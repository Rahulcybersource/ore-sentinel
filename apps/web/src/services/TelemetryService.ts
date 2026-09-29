import telemetryData from '../data/productionTelemetry.json';

export interface TelemetryRow {
  Year: string;
  State: string;
  District: string;
  Production_Tonnes: number;
  National_Total_Tonnes: number;
  District_National_Share_Pct: number;
  State_Total_Tonnes: number;
  District_State_Share_Pct: number;
  State_National_Share_Pct: number;
  Avg_Latitude: number;
  Avg_Longitude: number;
  Avg_Temperature_C: number;
  Temperature_Level: string;
  Total_Rainfall_mm: number;
  Rainfall_Level: string;
  Avg_Humidity_pct: number;
  Humidity_Level: string;
  Production_Stress: number;
  Temperature_Stress: number;
  Rainfall_Stress: number;
  Humidity_Stress: number;
  Weather_Stress: number;
  Equipment_Breakdown_Risk_Percent: number;
  Equipment_Breakdown_Risk_Level: string;
  Year_Start: number;
  Expected_Production_Tonnes: number | string;
  Production_Shortfall_Percent: number | string;
  Production_Shortfall_Risk_Level: string;
}

export class TelemetryService {
  /**
   * Returns a specific telemetry row for the given district, state and year.
   * If not found, returns the first row for that district or undefined.
   */
  static getDistrictTelemetry(state: string, district: string, year: string): TelemetryRow | undefined {
    const data = telemetryData as TelemetryRow[];
    return data.find(row => 
      row.State === state && 
      row.District === district && 
      row.Year === year
    ) || data.find(row => row.State === state && row.District === district);
  }
}
