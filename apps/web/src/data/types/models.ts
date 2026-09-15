export interface ReserveCell {
  id: string;
  lat: number;
  lng: number;
  probability: number;
  confidenceScore: number;
  contributingFactors: string[];
}
export interface ProductionSeries {
  date: string;
  actual: number | null;
  planned: number;
  forecast: number | null;
  confidenceMin: number | null;
  confidenceMax: number | null;
}
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export interface CauseBreakdown {
  cause: string;
  percentage: number;
}
export interface RiskAlert {
  id: string;
  mineId: string;
  title: string;
  severity: AlertSeverity;
  leadTimeDays: number;
  causeBreakdown: CauseBreakdown[];
}
export type DecisionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';
export interface Recommendation {
  id: string;
  alertId: string;
  title: string;
  description: string;
  estimatedImpact: string;
  status: DecisionStatus;
}
