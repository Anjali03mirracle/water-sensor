// src/routes/mqttRoutes.js
import { Router } from 'express';
import { mqttService } from '../services/mqttService.js';

const router = Router();

/**
 * GET /api/mqtt/status
 * Get broker connection status, topic, and recent published/received messages
 */
router.get('/status', (req, res) => {
  const status = mqttService.getStatus();
  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * POST /api/mqtt/publish
 * Publish arbitrary payload to MQTT broker
 */
router.post('/publish', async (req, res) => {
  try {
    const { payload, topic } = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'payload is required' });
    }
    const result = await mqttService.publish(payload, topic);
    res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
