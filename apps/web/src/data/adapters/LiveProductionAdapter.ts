import type { ProductionDataAdapter } from './ProductionDataAdapter';
import type { ProductionSeries } from '../types/models';
export class LiveProductionAdapter implements ProductionDataAdapter {
  async getProductionTrend(_mineId: string, _range: string): Promise<ProductionSeries[]> {
    throw new Error('Not yet implemented — pending real data integration');
  }
}
