import { chatCompletionJSON } from '../services/llm.service.js';
import { safeParseJSON, generateId } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are the Evidence Agent for a legal case investigation system. Your job is to extract structured evidence from raw document text.

For each piece of evidence you find, extract:
- type: The category of evidence (witness_statement, financial_record, phone_record, gps_data, email, contract, court_filing, forensic_report, other)
- content: A clear, concise summary of what this piece of evidence states or shows
- entities: Array of people, organizations, and key objects mentioned
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
      "entities": ["..."],
      "locations": ["..."],
      "dates": ["..."],
      "relationships": ["..."],
      "key_claims": ["..."]
    }
  ]
}`;

/**
 * Extract structured evidence from raw PDF text.
 * @param {string} pdfText - Raw text extracted from the PDF
 * @param {string} documentName - Original filename of the PDF
 * @returns {Promise<Array>} Array of evidence objects with generated IDs
 */
export const extractEvidence = async (pdfText, documentName) => {
  const userPrompt = `Document Name: "${documentName}"

Extract all evidence from the following document text:

---
${pdfText}
---`;

  const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt);
  const parsed = safeParseJSON(responseText);

  // Add IDs and source document to each evidence item
  const evidenceItems = (parsed.evidence || []).map((item) => ({
    id: generateId('ev'),
    ...item,
    source_document: documentName,
  }));

  return evidenceItems;
};
