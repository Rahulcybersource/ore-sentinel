export type MineOperator = 'MOIL' | 'Private' | 'Private/OMC';
export type MineType = 'Underground' | 'Opencast';

export interface MineSite {
  id: string;
  name: string;
  operator: MineOperator;
  coordinates: [number, number]; // [longitude, latitude]
  type: MineType;
  strikeTrend: number;
  annualCapacityMT: number;
}

export const NATIONAL_MN_REGISTRY: MineSite[] = [
  // MOIL Central India Belt (Sausar Group)
  { id: 'BAL-01', name: 'Balaghat (Bharveli)', operator: 'MOIL', coordinates: [80.201, 21.874], type: 'Underground', strikeTrend: 75, annualCapacityMT: 450000 },
  { id: 'DON-02', name: 'Dongri Buzurg', operator: 'MOIL', coordinates: [79.704, 21.551], type: 'Opencast', strikeTrend: 80, annualCapacityMT: 350000 },
  { id: 'MAN-03', name: 'Mansar', operator: 'MOIL', coordinates: [79.289, 21.389], type: 'Underground', strikeTrend: 110, annualCapacityMT: 120000 },
  { id: 'KAN-04', name: 'Kandri', operator: 'MOIL', coordinates: [79.275, 21.422], type: 'Underground', strikeTrend: 120, annualCapacityMT: 100000 },
  { id: 'GUM-05', name: 'Gumgaon', operator: 'MOIL', coordinates: [79.034, 21.385], type: 'Underground', strikeTrend: 95, annualCapacityMT: 80000 },
  { id: 'UKW-06', name: 'Ukwa', operator: 'MOIL', coordinates: [80.472, 21.971], type: 'Underground', strikeTrend: 65, annualCapacityMT: 110000 },
  { id: 'CHI-07', name: 'Chikla', operator: 'MOIL', coordinates: [79.761, 21.554], type: 'Underground', strikeTrend: 80, annualCapacityMT: 150000 },
  // Eastern & Southern Corridors (Competitors / National Scale)
  { id: 'BAR-08', name: 'Barbil / Joda Belt', operator: 'Private/OMC', coordinates: [85.400, 22.120], type: 'Opencast', strikeTrend: 30, annualCapacityMT: 650000 },
  { id: 'SAN-09', name: 'Sandur (SMIORE)', operator: 'Private', coordinates: [76.541, 15.082], type: 'Opencast', strikeTrend: 320, annualCapacityMT: 280000 }
];
