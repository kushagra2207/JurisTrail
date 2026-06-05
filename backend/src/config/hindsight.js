import dotenv from 'dotenv';

dotenv.config();

let baseUrl = process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888';
let apiKey = process.env.HINDSIGHT_API_KEY;

// Smart fallback if HINDSIGHT_BASE_URL was configured with the API Key (hsk_...) directly
if (baseUrl.startsWith('hsk_')) {
  apiKey = baseUrl;
  baseUrl = 'https://api.hindsight.vectorize.io';
}

/**
 * Hindsight REST API client.
 * Wraps the Hindsight HTTP API for retain, recall, and reflect operations.
 * Works with both self-hosted and cloud deployments.
 */
class HindsightClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // strip trailing slash
    this.apiKey = apiKey;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
    };
  }

  /**
   * Store content in a memory bank.
   * Hindsight auto-creates banks on first retain.
   */
  async retain(bankId, content) {
    const res = await fetch(`${this.baseUrl}/v1/default/banks/${bankId}/memories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ items: [{ content }] }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Hindsight retain failed (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  /**
   * Recall memories matching a query from a bank.
   * @param {string} bankId
   * @param {string} queryText
   * @param {object} options - { types, budget }
   */
  async recall(bankId, queryText, options = {}) {
    const body = {
      query: queryText,
      ...(options.types && { types: options.types }),
      budget: options.budget || 'high',
    };
    const res = await fetch(`${this.baseUrl}/v1/default/banks/${bankId}/memories/recall`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { memories: [], results: [] }; // Bank does not exist yet (no retains done)
      }
      const errBody = await res.text();
      throw new Error(`Hindsight recall failed (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  /**
   * Reflect on memories — synthesized reasoning over stored knowledge.
   */
  async reflect(bankId, queryText, options = {}) {
    const body = {
      query: queryText,
      budget: options.budget || 'high',
    };
    const res = await fetch(`${this.baseUrl}/v1/default/banks/${bankId}/reflect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { reflection: '', result: '' }; // Bank does not exist yet (no retains done)
      }
      const errBody = await res.text();
      throw new Error(`Hindsight reflect failed (${res.status}): ${errBody}`);
    }
    return res.json();
  }
}

const hindsightClient = new HindsightClient(baseUrl, apiKey);

export default hindsightClient;
