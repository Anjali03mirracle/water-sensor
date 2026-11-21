// src/app.js
import express from 'express';
import cors from 'cors';
import telemetryRoutes from './routes/telemetryRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import mqttRoutes from './routes/mqttRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.DEBUG === 'true') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root welcome / metadata route
app.get('/', (req, res) => {
  res.json({
    project: 'IoT-Based Water Level Detection System',
    sensorReference: 'Acconeer A121 (60 GHz Pulsed Coherent Radar)',
    version: '1.0.0',
    mode: 'DEMO / HARDWARE_EMULATION',
    endpoints: {
      health: '/api/health',
      devices: '/api/devices',
      telemetryLatest: '/api/telemetry/latest',
      telemetryHistory: '/api/telemetry',
      location: '/api/location',
      mqttStatus: '/api/mqtt/status',
      elasticsearchStatus: '/api/elasticsearch/status'
    }
  });
});

// Mount Routes
app.use('/api', systemRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/mqtt', mqttRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

export default app;
