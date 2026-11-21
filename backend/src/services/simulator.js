// src/services/simulator.js
import { bleDecoder } from './bleDecoder.js';
import { sensorDataService } from './sensorDataService.js';
import { gpsService } from './gpsService.js';
import { logger } from '../utils/logger.js';

/**
 * Acconeer A121 Sensor & BLE Gateway Simulator
 * 
 * Simulates real-world water reservoir dynamics:
 * - Fluid oscillation (tides / pumping inflow / natural evaporation cycle)
 * - Raw BLE 12-byte payload construction and byte serialization
 * - Realistic radar signal amplitude jitter
 * - Strictly marks all generated data with `isDemoData: true` and hardware status flags
 */

export class SensorSimulator {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS || '3000', 10);
    this.deviceId = process.env.DEMO_DEVICE_ID || 'ACCONEER-WL-001';
    
    // Wave / cycle generator parameters
    this.stepCounter = 0;
    this.baseDistanceMeters = 2.4; // Mid-tank distance (Mounting height 5.2m -> Water level ~2.8m)
    this.amplitudeMeters = 1.3;    // Water level will swing between ~1.5m and ~4.1m
    this.cycleLengthSteps = 60;    // Full tide cycle in 60 ticks
    this.waveNoiseAmplitude = 0.03;// +/- 3cm surface ripple
    
    // Battery degradation simulation
    this.batteryLevel = 98;
    this.sequenceNumber = 100;
  }

  /**
   * Generate next simulated sensor reading
   */
  generateReading() {
    this.stepCounter++;
    this.sequenceNumber = (this.sequenceNumber + 1) & 0xFFFF;

    // Simulate slow battery drain
    if (this.stepCounter % 150 === 0 && this.batteryLevel > 15) {
      this.batteryLevel -= 1;
    }

    // Sinusoidal distance variation + surface ripple noise
    const angle = (this.stepCounter / this.cycleLengthSteps) * 2 * Math.PI;
    const waveNoise = (Math.random() - 0.5) * 2 * this.waveNoiseAmplitude;
    // When distance increases, water level is dropping (empty tank)
    // When distance decreases, water level is rising (fill tank)
    const simulatedDistance = Math.max(
      0.3, // Min distance below mounting plate
      Math.min(5.0, this.baseDistanceMeters + Math.sin(angle) * this.amplitudeMeters + waveNoise)
    );

    // Radar signal quality: stronger return when water is closer, with realistic jitter
    const qualityJitter = Math.floor((Math.random() - 0.5) * 6);
    const signalQuality = Math.max(65, Math.min(99, 92 - Math.floor(simulatedDistance * 4) + qualityJitter));

    // Temperature with diurnal drift: 21°C +/- 3°C
    const temperatureCelsius = Math.round(22 + Math.sin(angle * 0.5) * 3 + (Math.random() - 0.5));

    // Surface motion alert if ripple is strong
    const isSurfaceMotionAlert = Math.abs(waveNoise) > 0.022;

    // Build raw 12-byte BLE frame using bleDecoder
    const rawBuffer = bleDecoder.encode({
      distanceMeters: simulatedDistance,
      signalQuality,
      batteryPercentage: this.batteryLevel,
      temperatureCelsius,
      isRadarLocked: true,
      isSurfaceMotionAlert,
      isHardwareFault: false,
      isSimulatedDemo: true, // EXPLICIT DEMO FLAG
      sequenceNumber: this.sequenceNumber
    });

    const rawHex = bleDecoder.formatToHexString(rawBuffer);

    // Decode to verify round-trip integrity
    const decoded = bleDecoder.decode(rawBuffer);

    // GPS coordinate snapshot with explicit DEMO marker
    const location = gpsService.getLocation();

    return {
      deviceId: this.deviceId,
      rawHex,
      rawBuffer,
      decoded,
      distanceMeters: decoded.distanceMeters,
      signalQuality: decoded.signalQuality,
      batteryPercentage: decoded.batteryPercentage,
      temperatureCelsius: decoded.temperatureCelsius,
      location,
      isDemoData: true, // MANDATORY DEMO DATA INDICATOR
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequenceNumber
    };
  }

  /**
   * Step once and inject into sensorDataService
   */
  async step() {
    const reading = this.generateReading();
    const record = await sensorDataService.processTelemetry(reading);
    return record;
  }

  /**
   * Start auto-publishing loop
   */
  start(intervalMs = null) {
    if (this.isRunning) return;
    if (intervalMs) {
      this.intervalMs = Math.max(500, intervalMs);
    }

    this.isRunning = true;
    logger.info(`Starting Acconeer A121 Sensor Simulator (Interval: ${this.intervalMs}ms, Device: ${this.deviceId}). [DEMO MODE ACTIVE]`);

    // Run first step immediately
    this.step().catch(err => logger.error(`Simulator initial step error:`, err));

    this.intervalId = setInterval(() => {
      this.step().catch(err => logger.error(`Simulator tick error:`, err));
    }, this.intervalMs);
  }

  /**
   * Stop auto-publishing loop
   */
  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    logger.info(`Acconeer A121 Sensor Simulator stopped.`);
  }

  /**
   * Get simulator state
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      deviceId: this.deviceId,
      stepCount: this.stepCounter,
      isDemoMode: true
    };
  }
}

export const simulator = new SensorSimulator();
