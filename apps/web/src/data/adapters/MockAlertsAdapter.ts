
// MOCK DATA
import type { AlertsAdapter } from "./AlertsAdapter";
import type { RiskAlert } from "../types/models";

export class MockAlertsAdapter implements AlertsAdapter {
  async getActiveAlerts(mineId: string): Promise<RiskAlert[]> {
    if (mineId === "balaghat") {
      return [
        {
          id: "a1", mineId: "balaghat", title: "Excavator 3 Maintenance Overdue",
          severity: "CRITICAL", leadTimeDays: 2,
          causeBreakdown: [{ cause: "Engine Hours", percentage: 70 }, { cause: "Hydraulics", percentage: 30 }]
        },
        {
          id: "a2", mineId: "balaghat", title: "Rainfall Delay Risk",
          severity: "WARNING", leadTimeDays: 5,
          causeBreakdown: [{ cause: "Heavy Rain Forecast", percentage: 100 }]
        }
      ];
    }
    if (mineId === "gumgaon") {
      return [
        { id: "a3", mineId: "gumgaon", title: "Ventilation Shaft Flow Drop", severity: "CRITICAL", leadTimeDays: 1, causeBreakdown: [{cause: "Fan Failure", percentage: 100}] }
      ];
    }
    return []; // kandri, ukwa have no active alerts in mock
  }
}

