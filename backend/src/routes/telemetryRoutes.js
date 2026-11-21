// src/routes/telemetryRoutes.js
import { Router } from 'express';
import { sensorDataService } from '../services/sensorDataService.js';
import { simulator } from '../services/simulator.js';

const router = Router();

/**
 * GET /api/telemetry/latest
 * Return the most recent telemetry record
 */
router.get('/latest', (req, res) => {
  const latest = sensorDataService.getLatest();
  if (!latest) {
    return res.status(200).json({
      success: true,
      message: 'No telemetry records yet',
      data: null
    });
  }
  res.status(200).json({
    success: true,
    data: latest
  });
});

/**
 * GET /api/telemetry
 * Retrieve paginated telemetry records and summary statistics
 */
router.get('/', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const historyData = sensorDataService.getHistory(limit, offset);
  const stats = sensorDataService.getStats();

  res.status(200).json({
    success: true,
    data: historyData.records,
    pagination: {
      total: historyData.total,
      limit: historyData.limit,
      offset: historyData.offset
    },
    statistics: stats
  });
});

/**
 * POST /api/telemetry
 * Ingest or test a telemetry reading (accepts distanceMeters or rawHex)
 */
router.post('/', async (req, res) => {
  try {
    const { distanceMeters, rawHex, deviceId, signalQuality, batteryPercentage, isDemoData } = req.body;

    if (distanceMeters === undefined && !rawHex) {
      return res.status(400).json({
        success: false,
        error: 'Either distanceMeters (number) or rawHex (hex string) is required'
      });
    }

    if (distanceMeters !== undefined && (typeof distanceMeters !== 'number' || distanceMeters < 0)) {
      return res.status(400).json({
        success: false,
        error: 'distanceMeters must be a positive number'
      });
    }

    const record = await sensorDataService.processTelemetry({
      distanceMeters,
      rawHex,
      deviceId,
      signalQuality,
      batteryPercentage,
      isDemoData: isDemoData !== undefined ? Boolean(isDemoData) : true
    });

    res.status(201).json({
      success: true,
      message: 'Telemetry processed successfully',
      data: record
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/telemetry/simulator/toggle
 * Start or stop the simulator
 */
router.post('/simulator/toggle', (req, res) => {
  const { running, intervalMs } = req.body;
  if (running === true) {
    simulator.start(intervalMs);
  } else if (running === false) {
    simulator.stop();
  } else {
    // Toggle
    if (simulator.isRunning) {
      simulator.stop();
    } else {
      simulator.start(intervalMs);
    }
  }

  res.status(200).json({
    success: true,
    simulator: simulator.getStatus()
  });
});

/**
 * POST /api/telemetry/simulator/step
 * Force single tick in simulator
 */
router.post('/simulator/step', async (req, res) => {
  try {
    const record = await simulator.step();
    res.status(200).json({
      success: true,
      data: record,
      simulator: simulator.getStatus()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
