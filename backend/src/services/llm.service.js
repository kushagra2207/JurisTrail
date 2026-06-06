import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callWithRetry = async (fn, retries = 5, delay = 6000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const status = error.status || error.statusCode;
      const isRateLimit = status === 429 || 
                          status === 413 || 
                          error.message.includes('Limit') || 
                          error.message.includes('rate limit') ||
                          error.message.includes('TPM') ||
                          error.message.includes('RPM') ||
                          error.message.includes('too large');
      
      if (isRateLimit && i < retries - 1) {
        console.warn(`[LLM] Rate limited or token limit hit (status ${status || 'unknown'}). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
        delay *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
};

/**
 * Send a chat completion request to the LLM.
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userPrompt - User-level input
 * @param {object} options - { temperature, maxTokens }
 * @returns {Promise<string>} The assistant's response text
 */
export const chatCompletion = async (systemPrompt, userPrompt, options = {}) => {
  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
    })
  );

  return response.choices[0].message.content;
};

/**
 * Chat completion that expects a JSON response.
 * Appends instruction to return valid JSON.
 */
export const chatCompletionJSON = async (systemPrompt, userPrompt, options = {}) => {
  const enhancedSystem = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanations, no code fences. Just raw JSON.`;

  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: enhancedSystem },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
    })
  );

  return response.choices[0].message.content;
};
