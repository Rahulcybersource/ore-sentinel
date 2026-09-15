import type { ReserveDataAdapter } from "./ReserveDataAdapter";
import type { ReserveCell } from "../types/models";
import { MockReserveAdapter } from "./MockReserveAdapter";

export class LiveReserveAdapter implements ReserveDataAdapter {
  async getReserveGrid(mineId: string): Promise<ReserveCell[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("http://localhost:4000/api/reserve/grid?mineId=" + mineId, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to fetch from data-proxy");
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('[ORE-SENTINEL] Live API failed, falling back to cached spectral data.');
      const mockAdapter = new MockReserveAdapter();
      return mockAdapter.getReserveGrid(mineId);
    }
  }
}
