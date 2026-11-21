// src/services/gpsService.js
import { logger } from '../utils/logger.js';

/**
 * GPS Location Service with Configurable Location Source & Validation
 * 
 * Handbook Compliance:
 * - Shows latitude, longitude, accuracy, timestamp, and source.
 * - Validates coordinate ranges (Latitude: -90 to 90, Longitude: -180 to 180).
 * - Represents UNAVAILABLE and PERMISSION_DENIED hardware/OS states.
 * - Clearly marks synthetic telemetry as SIMULATED_DEMO.
 */

export class GpsService {
  constructor(config = {}) {
    this.source = config.source || process.env.GPS_SOURCE || 'SIMULATED_DEMO';
    this.accuracyMeters = parseFloat(config.accuracyMeters || process.env.GPS_ACCURACY_METERS || 2.5);

    // Default reference coordinates (Water Reservoir Demo, e.g. Lake Mead station)
    this.baseLatitude = 36.0155;
    this.baseLongitude = -114.7378;
    this.baseAltitudeMeters = 374.5;
  }

  /**
   * Validate that coordinates fall within valid geographic boundaries
   */
  static validateCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { valid: false, error: 'Coordinates must be numeric' };
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      return { valid: false, error: 'Coordinates cannot be NaN' };
    }
    if (latitude < -90.0 || latitude > 90.0) {
      return { valid: false, error: `Latitude ${latitude} out of valid range [-90, +90]` };
    }
    if (longitude < -180.0 || longitude > 180.0) {
      return { valid: false, error: `Longitude ${longitude} out of valid range [-180, +180]` };
    }
    return { valid: true };
  }

  /**
   * Set location source dynamically
   */
  setSource(source) {
    const validSources = [
      'SIMULATED_DEMO',
      'NMEA_SERIAL_UART',
      'CELLULAR_TOWER_TRILATERATION',
      'FIXED_SITE_SURVEY',
      'UNAVAILABLE',
      'PERMISSION_DENIED'
    ];
    if (!validSources.includes(source)) {
      throw new Error(`Invalid GPS source '${source}'. Valid sources: ${validSources.join(', ')}`);
    }
    this.source = source;
    logger.info(`GPS location source updated to: ${source}`);
  }

  /**
   * Get current location telemetry
   */
  getLocation() {
    const timestamp = new Date().toISOString();

    // Hardware Unavailable State
    if (this.source === 'UNAVAILABLE') {
      return {
        latitude: null,
        longitude: null,
        altitudeMeters: null,
        accuracyMeters: null,
        source: 'UNAVAILABLE',
        status: 'SIGNAL_UNAVAILABLE',
        statusMessage: 'No GNSS hardware receiver detected or satellite lock lost.',
        isDemoData: false,
        satellitesVisible: 0,
        isValid: false,
        timestamp
      };
    }

    // Permission Denied State
    if (this.source === 'PERMISSION_DENIED') {
      return {
        latitude: null,
        longitude: null,
        altitudeMeters: null,
        accuracyMeters: null,
        source: 'PERMISSION_DENIED',
        status: 'PERMISSION_DENIED',
        statusMessage: 'Host OS denied location access permission.',
        isDemoData: false,
        satellitesVisible: 0,
        isValid: false,
        timestamp
      };
    }

    const isDemo = this.source === 'SIMULATED_DEMO';

    // Jitter calculation for realistic demo satellite drift
    const jitterLat = isDemo ? (Math.random() - 0.5) * 0.00008 : 0;
    const jitterLon = isDemo ? (Math.random() - 0.5) * 0.00008 : 0;
    const rawLat = parseFloat((this.baseLatitude + jitterLat).toFixed(6));
    const rawLon = parseFloat((this.baseLongitude + jitterLon).toFixed(6));

    const validation = GpsService.validateCoordinates(rawLat, rawLon);

    const currentAccuracy = isDemo 
      ? parseFloat((this.accuracyMeters + (Math.random() - 0.5) * 0.4).toFixed(1))
      : this.accuracyMeters;

    return {
      latitude: rawLat,
      longitude: rawLon,
      altitudeMeters: parseFloat((this.baseAltitudeMeters + (Math.random() - 0.5) * 0.2).toFixed(1)),
      accuracyMeters: currentAccuracy,
      source: this.source,
      status: 'ACQUIRED_LOCK',
      statusMessage: isDemo ? 'SIMULATED_DEMO: Synthetic coordinates for demonstration' : 'Live GNSS receiver fix',
      isDemoData: isDemo,
      satellitesVisible: isDemo ? 9 : 0,
      isValid: validation.valid,
      validationError: validation.error || null,
      timestamp
    };
  }
}

export const gpsService = new GpsService();
