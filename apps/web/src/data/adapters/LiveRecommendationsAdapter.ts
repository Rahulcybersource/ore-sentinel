import type { RecommendationsAdapter } from './RecommendationsAdapter';
import type { Recommendation, DecisionStatus } from '../types/models';
export class LiveRecommendationsAdapter implements RecommendationsAdapter {
  async getRecommendations(_alertId: string): Promise<Recommendation[]> {
    throw new Error('Not yet implemented — pending real data integration');
  }
  async submitDecision(_recId: string, _status: DecisionStatus): Promise<void> {
    throw new Error('Not yet implemented — pending real data integration');
  }
}
