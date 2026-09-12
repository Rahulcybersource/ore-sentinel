
// MOCK DATA
import type { RecommendationsAdapter } from "./RecommendationsAdapter";
import type { Recommendation, DecisionStatus } from "../types/models";

export class MockRecommendationsAdapter implements RecommendationsAdapter {
  async getRecommendations(alertId: string): Promise<Recommendation[]> {
    if (alertId === "a1") {
      return [
        { id: "r1", alertId: "a1", title: "Re-route Excavator 4", description: "Deploy Excavator 4 from Sector B to cover Sector A shortfall.", estimatedImpact: "+400t/day recovered", status: "PENDING" },
        { id: "r2", alertId: "a1", title: "Schedule Emergency Maintenance", description: "Bring team in for 3rd shift to complete 1000hr service.", estimatedImpact: "Prevents full breakdown", status: "PENDING" }
      ];
    }
    return [];
  }
  async submitDecision(recId: string, status: DecisionStatus): Promise<void> {
    console.log(`[Mock] Recommendation ${recId} changed to ${status}`);
    return new Promise(resolve => setTimeout(resolve, 800));
  }
}

