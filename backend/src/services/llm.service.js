import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/**
 * Send a chat completion request to the LLM.
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userPrompt - User-level input
 * @param {object} options - { temperature, maxTokens }
 * @returns {Promise<string>} The assistant's response text
 */
export const chatCompletion = async (systemPrompt, userPrompt, options = {}) => {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  });

  return response.choices[0].message.content;
};

/**
 * Chat completion that expects a JSON response.
 * Appends instruction to return valid JSON.
 */
export const chatCompletionJSON = async (systemPrompt, userPrompt, options = {}) => {
  const enhancedSystem = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanations, no code fences. Just raw JSON.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: enhancedSystem },
      { role: 'user', content: userPrompt },
    ],
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 4096,
    response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
  });

  return response.choices[0].message.content;
};
