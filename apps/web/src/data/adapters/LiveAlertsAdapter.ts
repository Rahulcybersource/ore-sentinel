import type { AlertsAdapter } from './AlertsAdapter';
import type { RiskAlert } from '../types/models';
export class LiveAlertsAdapter implements AlertsAdapter {
  async getActiveAlerts(_mineId: string): Promise<RiskAlert[]> {
    throw new Error('Not yet implemented — pending real data integration');
  }
}
