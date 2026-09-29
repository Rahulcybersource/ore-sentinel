export interface ResourceEstimationModel {
  targetId: string;
  targetName: string;
  geologicalResourceMt: number;
  gradeMnPct: number;
  gradeFePct: number;
  p10TonnageMt: number;
  p50TonnageMt: number;
  p90TonnageMt: number;
  blockCount: number;
  unitBlockSizeM: [number, number, number]; // [dx, dy, dz]
  bulkDensityTpm3: number;
  drillCoverageNotes: string;
  krigingComparison: {
    ordinaryKrigingMt: number;
    mlEnsembleMt: number;
    varianceReductionPct: number;
    crossValidationR2: number;
  };
  uncertaintyBreakdown: {
    source: string;
    impactPct: number;
    mitigation: string;
  }[];
}

export const TARGET_RESOURCE_MODELS: Record<string, ResourceEstimationModel> = {
  'T-07': {
    targetId: 'T-07',
    targetName: 'Balaghat North-East Extension',
    geologicalResourceMt: 6.8,
    gradeMnPct: 24.3,
    gradeFePct: 7.4,
    p10TonnageMt: 7.8,
    p50TonnageMt: 6.8,
    p90TonnageMt: 5.9,
    blockCount: 4250,
    unitBlockSizeM: [20, 20, 5],
    bulkDensityTpm3: 3.2,
    drillCoverageNotes: '7 diamond boreholes (spacing 100m to 250m). Southern sector high confidence; northern sector stepouts sparse.',
    krigingComparison: {
      ordinaryKrigingMt: 6.5,
      mlEnsembleMt: 6.8,
      varianceReductionPct: 22.4,
      crossValidationR2: 0.81,
    },
    uncertaintyBreakdown: [
      {
        source: 'Subsurface drill spacing (>200m in north)',
        impactPct: 44,
        mitigation: 'Drill 3 infill core holes along section line N-14',
      },
      {
        source: 'Structural dip variation (60° to 75°)',
        impactPct: 28,
        mitigation: 'Oriented core structural logging & optical televiewer',
      },
      {
        source: 'Bulk density variability (3.05 - 3.40 t/m³)',
        impactPct: 16,
        mitigation: 'Pycnometer & gamma-gamma density wireline logging',
      },
      {
        source: 'Regolith saprolite boundary transition',
        impactPct: 12,
        mitigation: 'Shallow auger drilling through saprolite profile',
      },
    ],
  },
  'T-18': {
    targetId: 'T-18',
    targetName: 'Tirodi–Sitapatore Link',
    geologicalResourceMt: 4.2,
    gradeMnPct: 22.8,
    gradeFePct: 8.2,
    p10TonnageMt: 5.1,
    p50TonnageMt: 4.2,
    p90TonnageMt: 3.4,
    blockCount: 2700,
    unitBlockSizeM: [20, 20, 5],
    bulkDensityTpm3: 3.1,
    drillCoverageNotes: '4 scout boreholes along 980m strike. Thick alluvial gravel cover requires depth penetration.',
    krigingComparison: {
      ordinaryKrigingMt: 3.9,
      mlEnsembleMt: 4.2,
      varianceReductionPct: 18.1,
      crossValidationR2: 0.74,
    },
    uncertaintyBreakdown: [
      {
        source: 'Alluvial cover thickness uncertainty (15-30m)',
        impactPct: 48,
        mitigation: 'Ground electrical resistivity tomography (ERT)',
      },
      {
        source: 'Braunite vs pyrolusite oxidation ratio',
        impactPct: 30,
        mitigation: 'Mineralogical XRD assay on core samples',
      },
      {
        source: 'Lateral continuity across cross-fault',
        impactPct: 22,
        mitigation: 'High-resolution ground magnetometer profile',
      },
    ],
  },
  'T-12': {
    targetId: 'T-12',
    targetName: 'Mansar West Limb Stepout',
    geologicalResourceMt: 3.1,
    gradeMnPct: 20.4,
    gradeFePct: 7.9,
    p10TonnageMt: 4.0,
    p50TonnageMt: 3.1,
    p90TonnageMt: 2.2,
    blockCount: 2040,
    unitBlockSizeM: [25, 25, 5],
    bulkDensityTpm3: 3.05,
    drillCoverageNotes: '3 scout boreholes. Structural repetition suspected along overturned isoclinal fold.',
    krigingComparison: {
      ordinaryKrigingMt: 2.8,
      mlEnsembleMt: 3.1,
      varianceReductionPct: 15.0,
      crossValidationR2: 0.69,
    },
    uncertaintyBreakdown: [
      {
        source: 'Overturned fold geometry closure depth',
        impactPct: 52,
        mitigation: 'Detailed cross-sectional structural reconstruction',
      },
      {
        source: 'Siliceous gangue (quartz/rhodonite) dilution',
        impactPct: 32,
        mitigation: 'Beneficiation testwork & heavy media separation tests',
      },
      {
        source: 'Limited sample volume',
        impactPct: 16,
        mitigation: 'Additional core assays at 50m stepout',
      },
    ],
  },
};

export interface ConceptualSubsurfaceBlock {
  id: string;
  x: number; // local coordinates (grid relative)
  y: number;
  z: number; // depth level (meters below collar)
  gradeMnPct: number;
  tonnes: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'High-grade Ore' | 'Medium-grade Ore' | 'Low-grade Mineralized' | 'Waste Schist';
}

// Generate realistic conceptual block model for 3D exploration viewer
export function generateConceptualBlocks(targetId: string): ConceptualSubsurfaceBlock[] {
  const blocks: ConceptualSubsurfaceBlock[] = [];
  const baseGrade = targetId === 'T-07' ? 24.3 : targetId === 'T-18' ? 22.8 : 20.4;
  
  for (let x = -3; x <= 3; x++) {
    for (let y = -2; y <= 2; y++) {
      for (let z = 1; z <= 6; z++) {
        const depthMeters = z * 25 + 40; // 65m to 190m
        // Distance from central orebody trend
        const distFromCenter = Math.abs(y - 0.3 * x);
        const isCore = distFromCenter < 1.0 && z >= 2 && z <= 5;
        const isMineralized = distFromCenter < 1.8 && z >= 2;
        
        let grade = 4.5 + Math.random() * 3.0;
        let category: ConceptualSubsurfaceBlock['category'] = 'Waste Schist';
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        
        if (isCore) {
          grade = baseGrade + (Math.sin(x + z) * 4.2) + (Math.random() * 3 - 1.5);
          category = grade >= 26 ? 'High-grade Ore' : 'Medium-grade Ore';
          confidence = z <= 4 ? 'HIGH' : 'MEDIUM';
        } else if (isMineralized) {
          grade = baseGrade * 0.65 + (Math.random() * 4);
          category = 'Low-grade Mineralized';
          confidence = 'MEDIUM';
        }
        
        blocks.push({
          id: `BLK-${x + 3}-${y + 2}-${z}`,
          x: x * 25,
          y: y * 25,
          z: depthMeters,
          gradeMnPct: Number(grade.toFixed(1)),
          tonnes: Math.round(25 * 25 * 5 * 3.15),
          confidence,
          category,
        });
      }
    }
  }
  return blocks;
}
