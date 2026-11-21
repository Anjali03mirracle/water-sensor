// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { logger } from './utils/logger.js';
import { simulator } from './services/simulator.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(` IoT Water Level Detection System - Backend Running`);
  logger.info(` Server listening on http://localhost:${PORT}`);
  logger.info(` Health check:       http://localhost:${PORT}/api/health`);
  logger.info(` Telemetry API:      http://localhost:${PORT}/api/telemetry/latest`);
  logger.info(`=======================================================`);

  // Auto-start simulator in demo mode if enabled
  const isSimulatorEnabled = process.env.SIMULATOR_ENABLED !== 'false';
  if (isSimulatorEnabled) {
    const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS || '3000', 10);
    simulator.start(intervalMs);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  simulator.stop();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  simulator.stop();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
