export type ProspectivityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type PriorityLevel = 'P1' | 'P2' | 'P3';
export type DataStatusBadge = 'REAL / PUBLIC' | 'SIMULATED / DEMO' | 'REQUIRES MOIL INTERNAL';
export type WorkflowStep = 'explore' | 'estimate' | 'predict' | 'simulate' | 'act';

export interface CorrectiveRecommendation {
  id: string;
  rank: number;
  title: string;
  category: 'FLEET' | 'BLASTING' | 'MAINTENANCE' | 'ALLOCATION';
  tonnageImpact: number;
  timeToImpactHours: number;
  operationalDifficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  cost: 'LOW' | 'MEDIUM' | 'HIGH';
  mineZone: string;
  description: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
}

export interface EvidenceFactor {
  level: ProspectivityLevel;
  pct: number;
  description: string;
}

export interface ExplorationTarget {
  id: string;
  code: string;
  name: string;
  sector: string;
  coordinates: [number, number]; // [lat, lng]
  prospectivity: ProspectivityLevel;
  score: number; // 0.0 - 1.0 (favorability score, NEVER described as % chance)
  confidence: number; // e.g. 78%
  suggestedNextStep: string;
  evidence: {
    geological: EvidenceFactor;
    structural: EvidenceFactor;
    spectral: EvidenceFactor;
    occurrenceProximity: EvidenceFactor;
    terrainContext: EvidenceFactor;
  };
  resourceSummary: {
    targetResourceMt: number;
    gradeMnPct: number;
    likelyRangeMt: [number, number];
    confidence: ConfidenceLevel;
    blockVolumeM3: number;
    bulkDensityTpm3: number;
    drillCoverageHoles: number;
    dataDensityNotes: string;
    limitingFactor: string;
  };
  crossSection: {
    strikeLengthM: number;
    dipAngleDeg: number;
    hostFormation: string;
    overburdenThicknessM: number;
    oreBodyGeometry: string;
  };
}

export interface Drillhole {
  id: string;
  code: string;
  targetId: string;
  coordinates: [number, number];
  depthMeters: number;
  mineralizedInterval: [number, number]; // e.g. [92, 128]
  mnGradePct: number;
  feGradePct: number;
  lithology: string;
  dataStatus: 'DEMO / PROXY' | 'PUBLIC / VERIFIED' | 'SIMULATED';
  collarElevationM: number;
}

export interface ProductionCausalFactor {
  factor: string;
  pct: number;
  tonnesImpact: number;
  category: 'Equipment' | 'Blasting' | 'Weather' | 'Logistics';
  details: string;
}

export interface MineSite {
  id: string;
  name: string;
  type: 'Underground' | 'Opencast';
  targetTonnes: number;
  forecastTonnes: number;
  availabilityPct: number;
  blastingDelayHours: number;
  status: 'NORMAL' | 'ALERT' | 'CRITICAL';
  keyConstraint: string;
}

export interface ScenarioParameters {
  equipmentAvailabilityPct: number;
  blastingDelayHours: number;
  mineAAllocationPct: number;
  targetProductionKt: number;
  weatherCondition: 'Favorable (Dry)' | 'Moderate Rain' | 'Heavy Monsoon';
  selectedMineId: string;
}

export interface ScenarioSimulationResult {
  baselineForecastKt: number;
  baselineShortfallKt: number;
  baselineRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  simulatedForecastKt: number;
  simulatedShortfallKt: number;
  simulatedRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  netRecoveryKt: number;
  recoveryBreakdown: {
    lever: string;
    tonnesRecovered: number;
    feasibility: string;
  }[];
}

export interface Recommendation {
  id: string;
  code: string;
  priority: PriorityLevel;
  title: string;
  targetMine: string;
  expectedRecoveryTonnes: number;
  primaryReason: string;
  confidence: ConfidenceLevel;
  status: 'Awaiting engineer approval' | 'Approved' | 'Dismissed';
  feasibilityPct: number;
  urgency: 'High' | 'Medium' | 'Low';
  actionDetails: string;
  associatedScenarioLever: string;
  approvalTimestamp?: string;
}

export interface DataSourceItem {
  id: string;
  name: string;
  category: 'REAL / PUBLIC DATA' | 'SIMULATED / DEMO DATA' | 'REQUIRES MOIL INTERNAL DATA';
  provider: string;
  resolution: string;
  updateCadence: string;
  roleInPipeline: string;
  status: 'ONLINE' | 'ACTIVE PROXY' | 'INTERNAL AIR-GAPPED';
  notes: string;
}

export interface ModelCenterItem {
  id: string;
  moduleName: string;
  algorithm: string;
  inputFeatures: string[];
  outputMetric: string;
  validationBaseline: string;
  explainabilityMethod: string;
  currentStatus: string;
  notes: string;
}

export interface SihMatrixRow {
  requirement: string;
  prototypeFeature: string;
  dataSource: string;
  modelMethod: string;
  deliverableOutput: string;
  status: 'BUILT & TESTED' | 'DEMO SIMULATION' | 'PLANNED / REQUIRES MOIL DATA';
}

export interface MapGroundingCitation {
  title: string;
  uri: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  mapsGrounding?: MapGroundingCitation[];
  groundedWithMaps?: boolean;
}
