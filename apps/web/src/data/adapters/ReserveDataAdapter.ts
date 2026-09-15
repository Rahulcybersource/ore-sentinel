import type { FeatureCollection } from 'geojson';
import type { ReserveCell } from '../types/models';
export interface ReserveDataAdapter {
  getReserveGrid(mineId: string): Promise<FeatureCollection>;
}
