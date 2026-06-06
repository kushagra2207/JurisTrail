import { chatCompletionJSON } from '../services/llm.service.js';
import { safeParseJSON, generateId } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are the Evidence Agent for a legal case investigation system. Your job is to extract structured evidence from raw document text.

For each piece of evidence you find, extract:
- type: The category of evidence (witness_statement, financial_record, phone_record, gps_data, email, contract, court_filing, forensic_report, other)
- content: A clear, concise summary of what this piece of evidence states or shows
- entities: Array of objects representing people, organizations, locations, and key objects mentioned. Each object MUST have:
  - name: The name of the entity
  - type: "person" | "location" | "organization" | "other"
  - desc: A brief description or role of the entity in the document
- locations: Array of locations mentioned  
- dates: Array of dates/times mentioned (in ISO format if possible, otherwise as stated)
- relationships: Array of relationships between entities (e.g. "John works for Acme Corp")
- key_claims: Array of factual claims made in this evidence

Be thorough — extract EVERY distinct piece of evidence. A single document may contain multiple evidence items.
Do not invent or infer information that is not explicitly stated in the text.

Respond with a JSON object in this format:
{
  "evidence": [
    {
      "type": "witness_statement",
      "content": "...",
      "entities": [
        {
          "name": "John Sharma",
          "type": "person",
          "desc": "Key Accused Associate"
        }
      ],
      "locations": ["..."],
      "dates": ["..."],
      "relationships": ["..."],
      "key_claims": ["..."]
    }
  ]
}`;

/**
 * Extract structured evidence from raw PDF text.
 * Supports chunking for large documents to prevent token limit errors.
 * @param {string} pdfText - Raw text extracted from the PDF
 * @param {string} documentName - Original filename of the PDF
 * @returns {Promise<Array>} Array of evidence objects with generated IDs
 */
export const extractEvidence = async (pdfText, documentName) => {
  const maxChunkLength = 15000; // ~3750 tokens
  
  if (!pdfText || pdfText.trim().length === 0) {
    return [];
  }

  // If the document is small, process in a single request
  if (pdfText.length <= maxChunkLength) {
    const userPrompt = `Document Name: "${documentName}"

Extract all evidence from the following document text:

---
${pdfText}
---`;

    const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt, { maxTokens: 2048 });
    const parsed = safeParseJSON(responseText);

    const evidenceItems = (parsed.evidence || []).map((item) => ({
      id: generateId('ev'),
      ...item,
      source_document: documentName,
    }));

    return evidenceItems;
  }

  // Split into chunks if document text is too large
  const chunks = [];
  for (let i = 0; i < pdfText.length; i += maxChunkLength) {
    chunks.push(pdfText.substring(i, i + maxChunkLength));
  }

  console.log(`[Evidence Agent] PDF text is large (${pdfText.length} chars). Processing in ${chunks.length} chunks sequentially...`);

  let allEvidence = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`   Processing chunk ${i + 1}/${chunks.length}...`);
    const userPrompt = `Document Name: "${documentName}" (Part ${i + 1} of ${chunks.length})

Extract all evidence from the following document text chunk:

---
${chunks[i]}
---`;

    try {
      const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt, { maxTokens: 2048 });
      const parsed = safeParseJSON(responseText);
      const items = (parsed.evidence || []).map((item) => ({
        id: generateId('ev'),
        ...item,
        source_document: documentName,
      }));
      allEvidence = allEvidence.concat(items);
    } catch (err) {
      console.error(`[Evidence Agent] Error processing chunk ${i + 1}/${chunks.length}:`, err.message);
      throw err;
    }
  }

  return allEvidence;
};
