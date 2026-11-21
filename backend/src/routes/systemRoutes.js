// src/routes/systemRoutes.js
import { Router } from 'express';
import { elasticsearchService } from '../services/elasticsearchService.js';
import { acconeerAdapter } from '../services/acconeerA121Adapter.js';
import { bleDecoder } from '../services/bleDecoder.js';
import { simulator } from '../services/simulator.js';
import { mqttService } from '../services/mqttService.js';
import { bleAdapter } from '../services/bleAdapter.js';

const router = Router();

/**
 * GET /api/health
 * Comprehensive system health and subsystem status
 */
router.get('/health', async (req, res) => {
  const mqttStatus = mqttService.getStatus();
  const esStatus = elasticsearchService.getStatus();
  const bleStatus = bleAdapter.getHardwareStatus();
  const acconeerStatus = acconeerAdapter.getHardwareStatus();

  res.status(200).json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    demoModeActive: true,
    subsystems: {
      simulator: simulator.getStatus(),
      mqtt: {
        connected: mqttStatus.isConnected,
        state: mqttStatus.connectionState,
        brokerUrl: mqttStatus.brokerUrl
      },
      elasticsearch: {
        available: esStatus.isAvailable,
        state: esStatus.connectionState,
        nodeUrl: esStatus.nodeUrl,
        indexedCount: esStatus.indexedCount
      },
      ble: {
        hardwareAvailable: bleStatus.isNativeBleAvailable,
        driver: bleStatus.driverType
      },
      acconeerA121: {
        hardwareConnected: acconeerStatus.isHardwareConnected,
        model: acconeerStatus.sensorModel
      }
    }
  });
});

/**
 * GET /api/elasticsearch/status
 */
router.get('/elasticsearch/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: elasticsearchService.getStatus()
  });
});

/**
 * GET /api/elasticsearch/records
 */
router.get('/elasticsearch/records', async (req, res) => {
  try {
    const { limit = 20, query = '' } = req.query;
    const results = await elasticsearchService.search({ limit: parseInt(limit, 10), query });
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/acconeer/config
 */
router.get('/acconeer/config', (req, res) => {
  res.status(200).json({
    success: true,
    configuration: acconeerAdapter.getConfiguration(),
    hardwareStatus: acconeerAdapter.getHardwareStatus()
  });
});

/**
 * GET /api/ble/decoder-spec
 */
router.get('/ble/decoder-spec', (req, res) => {
  res.status(200).json({
    success: true,
    specification: bleDecoder.getMappingDefinition()
  });
});

/**
 * POST /api/ble/decode-hex
 */
router.post('/ble/decode-hex', (req, res) => {
  try {
    const { hexString } = req.body;
    if (!hexString) {
      return res.status(400).json({ success: false, error: 'hexString is required' });
    }
    const decoded = bleDecoder.decode(hexString);
    const waterLevel = acconeerAdapter.calculateWaterLevel(decoded.distanceMeters);

    res.status(200).json({
      success: true,
      decoded,
      waterLevel
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
