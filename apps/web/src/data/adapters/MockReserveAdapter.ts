import { FeatureCollection } from 'geojson';
import type { ReserveDataAdapter } from './ReserveDataAdapter';
import type { ReserveCell } from '../types/models';
import { generateStrikeAlignedAssays } from '../../utils/geologySimulator';

export class MockReserveAdapter implements ReserveDataAdapter {
  async getReserveGrid(mineId: string): Promise<FeatureCollection> {
    if (mineId === 'balaghat') {
      const geojson = generateStrikeAlignedAssays([80.201, 21.874], 75);
      // Map the contributing factors inside the features so they don't break downstream
      geojson.features.forEach((feature: any) => {
        feature.properties.contributingFactors = feature.properties.probability > 0.6 
          ? ['High iron-oxide index', 'Proximity to Borehole #47', 'Sausar Group Alignment'] 
          : ['Weak satellite spectral signature', 'Surface topology mismatch'];
      });
      return geojson as FeatureCollection;
    }
    return { type: 'FeatureCollection', features: [] };
  }
}
