import type { ProductionSeries } from '../types/models';
export interface ProductionDataAdapter {
  getProductionTrend(mineId: string, range: string): Promise<ProductionSeries[]>;
}
