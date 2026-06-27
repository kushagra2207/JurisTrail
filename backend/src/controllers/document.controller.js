import cloudinary from '../config/cloudinary.js';
import { query } from '../config/db.js';
import { extractTextFromPDF } from '../utils/pdf.js';
import { runPipeline } from '../services/pipeline.service.js';
import { formatBytes } from '../utils/helpers.js';
import { decrypt } from '../utils/crypto.js';

/**
 * Upload a buffer to Cloudinary as a raw file.
 * Returns the Cloudinary result (secure_url, public_id, etc.)
 */
const uploadToCloudinary = (buffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: folder,
        public_id: originalName.replace(/\.[^/.]+$/, ''), // strip extension for public_id
        format: 'pdf',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * GET /api/cases/:caseId/documents
 * List all documents for a case.
 */
export const listDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Get documents from database (including extracted_data for FactBox)
    const dbDocsResult = await query(
      `SELECT id, original_name, cloudinary_url, file_size, mime_type, processing_status, uploaded_at, extracted_data
       FROM documents
       WHERE case_id = $1
       ORDER BY uploaded_at DESC`,
      [caseId]
    );

    const documents = dbDocsResult.rows.map((row) => {
      // Read evidence from PostgreSQL extracted_data (set by pipeline)
      const extractedData = decrypt(row.extracted_data) || {};
      const evidence = extractedData.evidence || [];

      // Collect resolved entities (deduplicated)
      const entities = [];
      const seenEntityNames = new Set();
      for (const item of evidence) {
        if (item.entities && Array.isArray(item.entities)) {
          for (const ent of item.entities) {
            if (ent && ent.name && !seenEntityNames.has(ent.name.toLowerCase())) {
              seenEntityNames.add(ent.name.toLowerCase());
              entities.push(ent);
            }
          }
        }
      }

      // Collect factual assertions
      const assertions = evidence.flatMap((item) => {
        if (item.key_claims && Array.isArray(item.key_claims) && item.key_claims.length > 0) {
          return item.key_claims;
        }
        return item.content ? [item.content] : [];
      });

      return {
        id: row.id,
        name: row.original_name,
        size: formatBytes(row.file_size),
        uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString().split('T')[0] : '',
        processingStatus: row.processing_status,
        cloudinaryUrl: row.cloudinary_url,
        mimeType: row.mime_type,
        entities,
        assertions
      };
    });

    return res.json(documents);
  } catch (error) {
    console.error('List documents error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/cases/:caseId/documents
 * Upload a PDF document. Triggers the 3-agent pipeline.
 *
 * Expects multipart/form-data with a "file" field.
 */
export const uploadDocument = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please attach a PDF.' });
    }

    const file = req.file;

    // Validate it's a PDF
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted.' });
    }

    // Prevent duplicate uploads within the same case
    const existingDoc = await query(
      'SELECT id, processing_status FROM documents WHERE case_id = $1 AND original_name = $2',
      [caseId, file.originalname]
    );
    if (existingDoc.rows.length > 0) {
      return res.status(409).json({
        error: `A document named "${file.originalname}" already exists in this case. Delete it first or rename the file.`
      });
    }

    // Upload to Cloudinary
    const folder = `juristrail/cases/${caseId}`;
    const cloudinaryResult = await uploadToCloudinary(file.buffer, folder, file.originalname);

    // Insert document record
    const result = await query(
      `INSERT INTO documents (case_id, original_name, cloudinary_url, cloudinary_public_id, file_size, mime_type, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, original_name, cloudinary_url, file_size, mime_type, processing_status, uploaded_at`,
      [caseId, file.originalname, cloudinaryResult.secure_url, cloudinaryResult.public_id, file.size, file.mimetype]
    );

    const document = result.rows[0];

    // Extract text from PDF
    let pdfText;
    try {
      pdfText = await extractTextFromPDF(file.buffer);
    } catch (err) {
      // Update status to failed if PDF parsing fails
      await query(
        'UPDATE documents SET processing_status = $1 WHERE id = $2',
        ['failed', document.id]
      );
      return res.status(422).json({
        error: 'Could not extract text from the PDF. The file may be corrupted or image-only.',
        document,
      });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      await query(
        'UPDATE documents SET processing_status = $1 WHERE id = $2',
        ['failed', document.id]
      );
      return res.status(422).json({
        error: 'The PDF contains no extractable text. It may be a scanned/image PDF.',
        document,
      });
    }

    // Respond immediately, run pipeline in background
    res.status(201).json({
      message: 'Document uploaded successfully. Processing started.',
      document,
    });

    // Run the 3-agent pipeline asynchronously
    runPipeline(caseId, document.id, pdfText, file.originalname)
      .then((results) => {
        console.log(`Pipeline complete for document ${document.id}:`, {
          evidence: results.evidence.length,
          timeline: results.timeline.length,
          investigations: results.investigations.length,
        });
      })
      .catch((err) => {
        console.error(`Pipeline failed for document ${document.id}:`, err.message);
      });
  } catch (error) {
    console.error('Upload document error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/cases/:caseId/documents/:docId
 * Delete a document from Cloudinary and the database.
 */
export const deleteDocument = async (req, res) => {
  try {
    const { caseId, docId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Find document
    const docResult = await query(
      'SELECT id, cloudinary_public_id FROM documents WHERE id = $1 AND case_id = $2',
      [docId, caseId]
    );
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docResult.rows[0];

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(doc.cloudinary_public_id, { resource_type: 'raw' });
    } catch (err) {
      console.warn('Cloudinary delete warning (continuing anyway):', err.message);
    }

    // Delete from DB
    await query('DELETE FROM documents WHERE id = $1', [docId]);

    return res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/cases/:caseId/documents/:docId/status
 * Check the processing status of a document.
 */
export const getDocumentStatus = async (req, res) => {
  try {
    const { caseId, docId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const result = await query(
      'SELECT processing_status, processing_error FROM documents WHERE id = $1 AND case_id = $2',
      [docId, caseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    return res.json({
      status: result.rows[0].processing_status,
      error: result.rows[0].processing_error || null,
    });
  } catch (error) {
    console.error('Get document status error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/cases/:caseId/documents/:docId/reprocess
 * Re-run the pipeline for a failed document.
 */
export const reprocessDocument = async (req, res) => {
  try {
    const { caseId, docId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Find the document
    const docResult = await query(
      'SELECT id, original_name, cloudinary_url, processing_status FROM documents WHERE id = $1 AND case_id = $2',
      [docId, caseId]
    );
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docResult.rows[0];

    if (doc.processing_status === 'processing') {
      return res.status(409).json({ error: 'Document is already being processed.' });
    }

    // Download PDF from Cloudinary and re-extract text
    const pdfResponse = await fetch(doc.cloudinary_url);
    if (!pdfResponse.ok) {
      return res.status(500).json({ error: 'Failed to download document from storage.' });
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    let pdfText;
    try {
      pdfText = await extractTextFromPDF(pdfBuffer);
    } catch (err) {
      return res.status(422).json({ error: 'Failed to extract text from stored PDF.' });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(422).json({ error: 'PDF contains no extractable text.' });
    }

    // Reset status
    await query(
      'UPDATE documents SET processing_status = $1, processing_error = NULL WHERE id = $2',
      ['pending', docId]
    );

    // Respond and run pipeline async
    res.json({ message: 'Reprocessing started.', status: 'pending' });

    runPipeline(caseId, docId, pdfText, doc.original_name)
      .then((results) => {
        console.log(`Reprocess pipeline complete for document ${docId}:`, {
          evidence: results.evidence.length,
          timeline: results.timeline.length,
          investigations: results.investigations.length,
        });
      })
      .catch((err) => {
        console.error(`Reprocess pipeline failed for document ${docId}:`, err.message);
      });
  } catch (error) {
    console.error('Reprocess document error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
