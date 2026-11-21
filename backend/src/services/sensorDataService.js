// src/services/sensorDataService.js
import { acconeerAdapter } from './acconeerA121Adapter.js';
import { gpsService } from './gpsService.js';
import { bleDecoder } from './bleDecoder.js';
import { mqttService } from './mqttService.js';
import { elasticsearchService } from './elasticsearchService.js';
import { logger } from '../utils/logger.js';

/**
 * Sensor Data Service
 * 
 * Handbook Telemetry Structure Compliance:
 * - device_id: Unique hardware or demo node identifier
 * - timestamp: ISO 8601 acquisition time
 * - measurement: Structured sensor payload (water level, radar distance, status, battery, SNR)
 * - location: Lat/Lon, elevation, accuracy, satellite count
 * - source: Data origin (SIMULATED_DEMO vs Verified Hardware)
 */

export class SensorDataService {
  constructor(maxHistory = 500) {
    this.history = [];
    this.maxHistory = maxHistory;
    this.latestRecord = null;
    this.deviceId = process.env.DEMO_DEVICE_ID || 'ACCONEER-WL-001';
  }

  async processTelemetry(payload) {
    let distanceMeters = payload.distanceMeters;
    let rawHex = payload.rawHex || null;
    let signalQuality = payload.signalQuality ?? 94;
    let batteryPercentage = payload.batteryPercentage ?? 92;
    let temperatureCelsius = payload.temperatureCelsius ?? 22;
    let isDemoData = payload.isDemoData ?? true;
    let sequenceNumber = payload.sequenceNumber ?? (this.history.length + 1);

    // If raw hex payload provided, decode first
    if (payload.rawHex && (!distanceMeters || isNaN(distanceMeters))) {
      try {
        const decoded = bleDecoder.decode(payload.rawHex);
        distanceMeters = decoded.distanceMeters;
        signalQuality = decoded.signalQuality;
        batteryPercentage = decoded.batteryPercentage;
        temperatureCelsius = decoded.temperatureCelsius;
        isDemoData = decoded.statusFlags.isSimulatedDemo;
        sequenceNumber = decoded.sequenceNumber;
        rawHex = decoded.rawHex;
      } catch (err) {
        logger.error(`Error decoding rawHex payload in sensorDataService:`, err.message);
      }
    }

    if (typeof distanceMeters !== 'number' || isNaN(distanceMeters)) {
      distanceMeters = 2.45;
    }

    if (!rawHex) {
      const buffer = bleDecoder.encode({
        distanceMeters,
        signalQuality,
        batteryPercentage,
        temperatureCelsius,
        isSimulatedDemo: isDemoData,
        sequenceNumber
      });
      rawHex = bleDecoder.formatToHexString(buffer);
    }

    // Acconeer A121 geometry calculation
    const calc = acconeerAdapter.calculateWaterLevel(distanceMeters);

    // GPS location
    const location = payload.location || gpsService.getLocation();
    const timestamp = payload.timestamp || new Date().toISOString();
    const deviceId = payload.deviceId || payload.device_id || this.deviceId;
    const source = payload.source || (isDemoData ? 'SIMULATED_DEMO' : 'VERIFIED_HARDWARE');

    // Handbook structured telemetry format
    const measurement = {
      water_level_meters: calc.waterLevelMeters,
      water_level_percentage: calc.waterLevelPercentage,
      distance_to_surface_meters: calc.distanceMeters,
      status: calc.status,
      signal_quality_percent: signalQuality,
      battery_percentage: batteryPercentage,
      temperature_celsius: temperatureCelsius,
      sequence_number: sequenceNumber,
      sensor_model: 'Acconeer A121 (PCR 60GHz - Software Emulated)'
    };

    const record = {
      id: `tel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      // Handbook top-level fields
      device_id: deviceId,
      timestamp,
      measurement,
      location,
      source,
      // Backward-compatible flat fields for frontend
      deviceId,
      sensorModel: 'Acconeer A121 (Software Emulated)',
      distanceMeters: calc.distanceMeters,
      waterLevelMeters: calc.waterLevelMeters,
      waterLevelPercentage: calc.waterLevelPercentage,
      status: calc.status,
      signalQuality,
      batteryPercentage,
      temperatureCelsius,
      rawHex,
      isDemoData,
      calibration: {
        tankHeightMeters: calc.tankHeightMeters,
        mountingHeightMeters: calc.mountingHeightMeters,
        deadzoneMeters: 0.05
      }
    };

    // Store record in-memory
    this.latestRecord = record;
    this.history.unshift(record);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Publish to MQTT
    mqttService.publish(record).catch(err => {
      logger.debug(`MQTT publish handled: ${err.message}`);
    });

    // Index to Elasticsearch
    elasticsearchService.indexTelemetry(record).catch(err => {
      logger.debug(`Elasticsearch indexing handled: ${err.message}`);
    });

    return record;
  }

  getLatest() {
    return this.latestRecord;
  }

  getHistory(limit = 50, offset = 0) {
    const lim = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200);
    const off = Math.max(0, parseInt(offset, 10) || 0);
    const records = this.history.slice(off, off + lim);
    return {
      total: this.history.length,
      limit: lim,
      offset: off,
      records
    };
  }

  getStats() {
    if (this.history.length === 0) {
      return {
        count: 0,
        averageLevelMeters: 0,
        maxLevelMeters: 0,
        minLevelMeters: 0
      };
    }

    const levels = this.history.map(r => r.waterLevelMeters);
    const sum = levels.reduce((acc, v) => acc + v, 0);
    return {
      count: this.history.length,
      averageLevelMeters: parseFloat((sum / levels.length).toFixed(3)),
      maxLevelMeters: Math.max(...levels),
      minLevelMeters: Math.min(...levels)
    };
  }
}

export const sensorDataService = new SensorDataService();
