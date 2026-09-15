
// MOCK DATA
import type { ProductionDataAdapter } from "./ProductionDataAdapter";
import type { ProductionSeries } from "../types/models";

export class MockProductionAdapter implements ProductionDataAdapter {
  async getProductionTrend(mineId: string, _range: string): Promise<ProductionSeries[]> {
    const base = mineId === "balaghat" ? 4000 : mineId === "ukwa" ? 2500 : 1500;
    return [
      { date: "Aug 01", actual: base + 200, planned: base, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: "Aug 02", actual: base + 100, planned: base + 50, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: "Aug 03", actual: base - 50, planned: base + 100, forecast: null, confidenceMin: null, confidenceMax: null },
      { date: "Aug 04", actual: null, planned: base + 100, forecast: base + 80, confidenceMin: base - 150, confidenceMax: base + 250 },
      { date: "Aug 05", actual: null, planned: base + 150, forecast: base - 200, confidenceMin: base - 400, confidenceMax: base + 50 },
      { date: "Aug 06", actual: null, planned: base + 150, forecast: base + 50, confidenceMin: base - 100, confidenceMax: base + 180 },
    ];
  }
}

