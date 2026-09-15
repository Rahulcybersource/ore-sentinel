// MOCK DATA
import type { ReserveDataAdapter } from './ReserveDataAdapter';
import type { ReserveCell } from '../types/models';

export class MockReserveAdapter implements ReserveDataAdapter {
  async getReserveGrid(mineId: string): Promise<ReserveCell[]> {
    if (mineId === 'balaghat') {
      const grid: ReserveCell[] = [];
      for(let x = 0; x < 10; x++) {
        for(let z = 0; z < 10; z++) {
          const probability = Math.random();
          const isHigh = probability > 0.6;
          grid.push({
            id: 'b-' + x + '-' + z,
            lat: 21.8 + x * 0.005,
            lng: 80.2 + z * 0.005,
            probability,
            confidenceScore: Math.random() * 0.3 + 0.6,
            contributingFactors: isHigh 
              ? ['High iron-oxide index', 'Proximity to Borehole #47'] 
              : ['Weak satellite spectral signature', 'Surface topology mismatch']
          });
        }
      }
      return grid;
    }
    return [];
  }
}
