// src/services/acconeerA121Adapter.js

/**
 * Acconeer A121 Pulsed Coherent Radar (PCR) Sensor Adapter Interface
 * 
 * IMPORTANT TECHNICAL ACCURACY NOTICE:
 * 1. The Acconeer A121 is a 60 GHz Pulsed Coherent Radar IC requiring high-frequency SPI
 *    communication (up to 50 MHz), crystal calibration, and the proprietary Acconeer
 *    RSS (Radar System Software) C-library running on an embedded MCU (STM32, Nordic, ESP32).
 * 2. Configuration parameters below (Profile 3, PRF 15.6MHz, HWAAS 32) are ILLUSTRATIVE
 *    DEMO ASSUMPTIONS based on typical tank level examples, NOT certified vendor defaults.
 * 3. Hardware is explicitly NOT CONNECTED in this MVP environment.
 */

export class AcconeerA121Adapter {
  constructor(config = {}) {
    this.tankHeightMeters = parseFloat(config.tankHeightMeters || process.env.TANK_HEIGHT_METERS || 5.0);
    this.mountingHeightMeters = parseFloat(config.mountingHeightMeters || process.env.SENSOR_MOUNTING_HEIGHT_METERS || 5.2);
    this.deadzoneMeters = 0.05; // 50mm typical blind spot in front of radar lens
    this.criticalHighPercent = parseFloat(config.criticalHighPercent || process.env.TANK_CRITICAL_HIGH_PERCENT || 85.0);
    this.lowPercent = parseFloat(config.lowPercent || process.env.TANK_LOW_PERCENT || 20.0);

    // DEMO / PLACEHOLDER: Illustrative A121 RSS configuration template (Unverified in field)
    this.sensorConfig = {
      isPlaceholderConfig: true,
      profile: 3,                  // Profile 1 (high resolution) to Profile 5 (longer range)
      prf: 'PRF_15_6_MHZ',         // Pulse Repetition Frequency
      hwaas: 32,                   // Hardware Accelerated Averaging Samples (SNR enhancement)
      receiverGain: 15,            // 0 - 23 dB gain
      subsweepConfig: {
        startRangeMeters: 0.1,     // Range start after blind zone
        endRangeMeters: this.mountingHeightMeters + 0.5,
        stepLength: 2              // Range points step length
      },
      interFrameIdleState: 'DEEP_SLEEP',
      continuousSweepMode: false
    };

    // Hardware status flag - physical EVK/MCU required for true hardware access
    this.hardwareStatus = {
      isHardwareConnected: false,
      sensorModel: 'Acconeer A121 (60 GHz PCR) - Software Emulation',
      rssVersionExpected: 'v1.4.0+ (C-SDK)',
      interface: 'SPI Bus (Requires Host MCU Gateway)',
      calibrationStatus: 'DEMO_MATHEMATICAL_MODEL',
      limitationNotice: 'Physical Acconeer A121 radar IC is NOT connected. Real deployment requires Acconeer RSS library compiled into firmware on an SPI-attached MCU (e.g. Nordic nRF52840 or STM32WB55).'
    };
  }

  /**
   * Convert raw radar measured distance (from sensor face to water surface)
   * into water level and percentage relative to tank bottom.
   * 
   * Calculation:
   *   Sensor is mounted at `mountingHeightMeters` (e.g. 5.2m from tank bottom, 0.2m above rim).
   *   Measured distance `d` is distance from sensor to water surface.
   *   Water level `h` = mountingHeightMeters - measuredDistance.
   *   Water level clamped to [0, tankHeightMeters].
   */
  calculateWaterLevel(distanceMeters) {
    if (typeof distanceMeters !== 'number' || isNaN(distanceMeters) || distanceMeters < 0) {
      throw new Error(`Invalid radar distance value: ${distanceMeters}`);
    }

    // Protect against deadzone readings
    const effectiveDistance = Math.max(this.deadzoneMeters, distanceMeters);

    // Level calculation
    const rawWaterLevel = this.mountingHeightMeters - effectiveDistance;
    const waterLevelMeters = Math.max(0, Math.min(this.tankHeightMeters, parseFloat(rawWaterLevel.toFixed(3))));
    const waterLevelPercentage = parseFloat(((waterLevelMeters / this.tankHeightMeters) * 100).toFixed(1));

    // Determine status
    let status = 'NORMAL';
    if (waterLevelPercentage >= this.criticalHighPercent) {
      status = 'HIGH';
    } else if (waterLevelPercentage <= this.lowPercent) {
      status = 'LOW';
    }

    return {
      distanceMeters: parseFloat(distanceMeters.toFixed(3)),
      waterLevelMeters,
      waterLevelPercentage,
      status,
      tankHeightMeters: this.tankHeightMeters,
      mountingHeightMeters: this.mountingHeightMeters,
      isCalculatedModel: true
    };
  }

  /**
   * Return sensor configuration specs
   */
  getConfiguration() {
    return {
      sensorModel: 'Acconeer A121 (Software Emulation)',
      sensorConfig: this.sensorConfig,
      tankParameters: {
        tankHeightMeters: this.tankHeightMeters,
        mountingHeightMeters: this.mountingHeightMeters,
        deadzoneMeters: this.deadzoneMeters,
        criticalHighPercent: this.criticalHighPercent,
        lowPercent: this.lowPercent
      },
      notice: 'Configuration parameters are illustrative DEMO assumptions based on Acconeer RSS concepts, not certified field settings.'
    };
  }

  /**
   * Hardware state report
   */
  getHardwareStatus() {
    return { ...this.hardwareStatus };
  }
}

export const acconeerAdapter = new AcconeerA121Adapter();
