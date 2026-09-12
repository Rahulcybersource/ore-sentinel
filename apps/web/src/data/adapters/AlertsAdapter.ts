import type { RiskAlert } from '../types/models';
export interface AlertsAdapter {
  getActiveAlerts(mineId: string): Promise<RiskAlert[]>;
}
