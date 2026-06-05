import pdfParse from 'pdf-parse';

/**
 * Extract all text content from a PDF buffer.
 * @param {Buffer} pdfBuffer - The raw PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parsing error:', err.message);
    throw new Error('Failed to extract text from PDF.');
  }
};
