
import type { ReserveDataAdapter } from "./ReserveDataAdapter";
import type { ReserveCell } from "../types/models";

export class LiveReserveAdapter implements ReserveDataAdapter {
  async getReserveGrid(mineId: string): Promise<ReserveCell[]> {
    try {
      const response = await fetch("http://localhost:4000/api/reserve/grid?mineId=" + mineId);
      if (!response.ok) {
        throw new Error("Failed to fetch from data-proxy");
      }
      return await response.json();
    } catch (error) {
      console.error("LiveReserveAdapter Error:", error);
      throw error;
    }
  }
}

