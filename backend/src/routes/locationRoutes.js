// src/routes/locationRoutes.js
import { Router } from 'express';
import { gpsService } from '../services/gpsService.js';

const router = Router();

/**
 * GET /api/location
 * Get current GPS coordinates and location metadata
 */
router.get('/', (req, res) => {
  const location = gpsService.getLocation();
  res.status(200).json({
    success: true,
    data: location
  });
});

/**
 * POST /api/location/source
 * Update configured location source (e.g. SIMULATED_DEMO, NMEA_SERIAL_UART)
 */
router.post('/source', (req, res) => {
  try {
    const { source } = req.body;
    if (!source) {
      return res.status(400).json({ success: false, error: 'source is required' });
    }
    gpsService.setSource(source);
    res.status(200).json({
      success: true,
      message: `Location source updated to ${source}`,
      data: gpsService.getLocation()
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
