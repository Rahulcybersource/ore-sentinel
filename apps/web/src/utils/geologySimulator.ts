export function generateStrikeAlignedAssays(center: [number, number], strike: number) {
  const [centerLng, centerLat] = center;
  const numPoints = 150;
  const features = [];
  
  // Convert strike to radians
  const strikeRad = strike * (Math.PI / 180);
  
  for (let i = 0; i < numPoints; i++) {
    // Generate points along the strike (length ~ 4km total, +/- 2km)
    const lengthMeters = (Math.random() - 0.5) * 4000;
    // Add some random dispersion perpendicular to strike (width ~ 400m)
    const dispersionMeters = (Math.random() - 0.5) * 400; 
    
    // Roughly 111111 meters per degree of lat
    // dLat is y-axis, dLng is x-axis
    // But strike is typically measured clockwise from North. 
    // If North is 0, East is 90. 75 degrees is ENE.
    // In math terms (where East is 0, North is 90), strike 75 from North means angle = 90 - 75 = 15 degrees.
    // So math angle = (90 - strike) * PI / 180
    const mathAngle = (90 - strike) * (Math.PI / 180);
    
    const dxLength = lengthMeters * Math.cos(mathAngle);
    const dyLength = lengthMeters * Math.sin(mathAngle);
    
    const dxDispersion = dispersionMeters * Math.cos(mathAngle + Math.PI/2);
    const dyDispersion = dispersionMeters * Math.sin(mathAngle + Math.PI/2);
    
    const dLng = (dxLength + dxDispersion) / (111111 * Math.cos(centerLat * Math.PI / 180));
    const dLat = (dyLength + dyDispersion) / 111111;
    
    const realLat = centerLat + dLat;
    const realLng = centerLng + dLng;
    
    // Higher grade near the center
    const distanceNorm = Math.sqrt(Math.pow(lengthMeters/2000, 2) + Math.pow(dispersionMeters/200, 2));
    const gradeProb = Math.max(0, 1 - distanceNorm) * Math.random();
    // For Balaghat, grades are typically high. Let's make it between 25 and 55
    const mnGrade = 25 + gradeProb * 30; 
    
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [realLng, realLat] },
      properties: {
        id: `assay-${i}`,
        realLat,
        realLng,
        mnGrade,
        depthMeters: 50 + Math.random() * 200, // Depth from 50m to 250m
        probability: gradeProb,
        confidenceScore: Math.random() * 0.3 + 0.6,
      }
    });
  }
  
  return {
    type: 'FeatureCollection',
    features
  };
}
