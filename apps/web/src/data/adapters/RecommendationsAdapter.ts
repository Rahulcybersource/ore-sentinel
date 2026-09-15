import type { Recommendation, DecisionStatus } from '../types/models';
export interface RecommendationsAdapter {
  getRecommendations(alertId: string): Promise<Recommendation[]>;
  submitDecision(recId: string, status: DecisionStatus): Promise<void>;
}
