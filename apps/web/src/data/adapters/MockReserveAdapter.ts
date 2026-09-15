// MOCK DATA
import type { ReserveDataAdapter } from './ReserveDataAdapter';
import type { ReserveCell } from '../types/models';
import { generateStrikeAlignedAssays } from '../../utils/geologySimulator';

export class MockReserveAdapter implements ReserveDataAdapter {
  async getReserveGrid(mineId: string): Promise<ReserveCell[]> {
    if (mineId === 'balaghat') {
      const geojson = generateStrikeAlignedAssays([80.201, 21.874], 75);
      
      const grid: ReserveCell[] = geojson.features.map((feature: any) => ({
        id: feature.properties.id,
        lat: feature.properties.realLat,
        lng: feature.properties.realLng,
        probability: feature.properties.probability,
        confidenceScore: feature.properties.confidenceScore,
        contributingFactors: feature.properties.probability > 0.6 
          ? ['High iron-oxide index', 'Proximity to Borehole #47', 'Sausar Group Alignment'] 
          : ['Weak satellite spectral signature', 'Surface topology mismatch']
      }));
      
      return grid;
    }
    return [];
  }
}
