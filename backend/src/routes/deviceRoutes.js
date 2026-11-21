// src/routes/deviceRoutes.js
import { Router } from 'express';
import { bleAdapter } from '../services/bleAdapter.js';

const router = Router();

/**
 * GET /api/devices
 * List BLE devices, current connection, and GATT services
 */
router.get('/', (req, res) => {
  const data = bleAdapter.getDevices();
  const hwStatus = bleAdapter.getHardwareStatus();
  res.status(200).json({
    success: true,
    data,
    hardwareStatus: hwStatus
  });
});

/**
 * POST /api/devices/scan
 * Trigger BLE discovery scan
 */
router.post('/scan', async (req, res) => {
  try {
    const { timeoutMs = 1500 } = req.body || {};
    const devices = await bleAdapter.scan(timeoutMs);
    res.status(200).json({
      success: true,
      message: 'Scan completed',
      devices
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/devices/:id/connect
 * Connect to specified BLE device
 */
router.post('/:id/connect', async (req, res) => {
  try {
    const device = await bleAdapter.connect(req.params.id);
    res.status(200).json({
      success: true,
      message: `Connected to device ${device.name}`,
      device
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/devices/:id/disconnect
 * Disconnect from specified BLE device
 */
router.post('/:id/disconnect', async (req, res) => {
  try {
    const result = await bleAdapter.disconnect(req.params.id);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
