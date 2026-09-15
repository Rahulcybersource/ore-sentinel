import { Router } from 'express';
import { VedasService } from '../services/vedasService';

const router = Router();

router.get('/vedas/structure', async (req, res) => {
  const { bbox } = req.query;

  if (!bbox || typeof bbox !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid bbox parameter' });
  }

  const coords = bbox.split(',');
  if (coords.length !== 4 || coords.some(c => isNaN(parseFloat(c)))) {
    return res.status(400).json({ error: 'bbox must contain exactly four comma-separated numeric coordinates' });
  }

  try {
    const data = await VedasService.fetchStructuralLineaments(bbox);
    
    // Transform VEDAS response into a standardized GeoJSON FeatureCollection
    // mapping directly to MapLibre structural corridor requirements.
    const features = Array.isArray(data) ? data.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry || {
        type: 'LineString',
        coordinates: item.coordinates || []
      },
      properties: item.properties || { ...item }
    })) : data.features ? data.features : []; // fallback if it already has features

    const featureCollection = {
      type: 'FeatureCollection',
      features
    };

    res.json(featureCollection);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
