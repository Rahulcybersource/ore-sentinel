export interface DrillTarget {
  lat: number;
  lng: number;
  mnGrade: number;
  spectralAnomaly: number;
  confidenceScore: number;
  targetDepth: string;
  dipAngle: string;
}

/**
 * Calculates an optimal drill target along a specific structural strike line,
 * avoiding "random farmland" by buffering strictly within the 300m geological corridor.
 * 
 * @param centerLat Origin Latitude (real mine pit)
 * @param centerLng Origin Longitude
 * @param strikeTrend Bearing in degrees (e.g., 75° for ENE)
 * @returns Best DrillTarget based on mn_grade * spectral_anomaly
 */
export function evaluateDrillTarget(
  centerLat: number,
  centerLng: number,
  strikeTrend: number
): DrillTarget {
  const bearingRad = strikeTrend * (Math.PI / 180);
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos(centerLat * (Math.PI / 180));

  let bestTarget: DrillTarget | null = null;
  let maxScore = -1;

  // We sample 100 potential target spots along a 4.5km strike (+/- 2.25km)
  for (let i = 0; i < 100; i++) {
    // Range -2.25 to 2.25
    const distAlongStrike = ((i / 99) - 0.5) * 4.5;
    
    // Constrain to a strictly 300m (0.3km) buffer lateral to the strike
    const maxLateralKm = 0.3; 
    const lateralSpread = (Math.random() * 2 - 1) * maxLateralKm;

    const dx = (distAlongStrike * Math.sin(bearingRad)) + (lateralSpread * Math.cos(bearingRad));
    const dy = (distAlongStrike * Math.cos(bearingRad)) - (lateralSpread * Math.sin(bearingRad));

    const pLat = centerLat + (dy / kmPerLat);
    const pLng = centerLng + (dx / kmPerLng);

    // Simulate geological anomaly features
    // High anomaly if it's within the center of the structural strike distance
    const centerProximity = 1 - Math.abs(distAlongStrike) / 2.25;
    
    const spectralAnomaly = 0.6 + (centerProximity * 0.4) - (Math.abs(lateralSpread) * 0.5); 
    const mnGrade = 35 + (spectralAnomaly * 20) + ((Math.random() - 0.5) * 5); // 35 to ~60%
    
    const score = mnGrade * spectralAnomaly;

    if (score > maxScore) {
      maxScore = score;
      
      // Determine Dip based on strike trend (approx perpendicular logic)
      let dipDir = strikeTrend < 180 ? 'North' : 'South';
      if (strikeTrend > 45 && strikeTrend < 135) dipDir = 'North-West';
      else if (strikeTrend > 225 && strikeTrend < 315) dipDir = 'South-East';
      
      const dipVal = Math.floor(55 + Math.random() * 20); // 55-75 degrees

      bestTarget = {
        lat: pLat,
        lng: pLng,
        mnGrade: Math.min(mnGrade, 56.5), // Cap at a realistic max
        spectralAnomaly,
        confidenceScore: spectralAnomaly * 0.95,
        targetDepth: `${Math.floor(80 + Math.random() * 40)}m - ${Math.floor(140 + Math.random() * 60)}m`,
        dipAngle: `${dipVal}° ${dipDir}`
      };
    }
  }

  return bestTarget as DrillTarget;
}
