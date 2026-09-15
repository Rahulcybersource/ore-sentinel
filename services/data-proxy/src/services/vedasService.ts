import axios from 'axios';
import { config } from '../config/env';

const vedasClient = axios.create({
  baseURL: config.isroVedasBaseUrl,
  headers: {
    'Authorization': `Bearer ${config.isroVedasApiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 8000,
});

async function fetchWithRetry(url: string, params: any, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await vedasClient.get(url, { params });
      return response.data;
    } catch (error: any) {
      if (i === retries) {
        const message = error.response?.data?.message || error.message || 'Unknown ISRO VEDAS API error or timeout';
        throw { status: 502, message: `ISRO VEDAS Gateway Error: ${message}` };
      }
      // Wait for 1s, 2s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export class VedasService {
  /**
   * Queries the VEDAS geological fault line endpoints for the given bounding box.
   */
  static async fetchStructuralLineaments(bbox: string) {
    return fetchWithRetry('/geology/fault-lines', { bbox });
  }

  /**
   * Retrieves processed hyperspectral surface data for the given bounding box.
   */
  static async fetchMineralFractions(bbox: string) {
    return fetchWithRetry('/hyperspectral/mineral-fractions', { bbox });
  }
}
