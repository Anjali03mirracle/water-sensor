// src/services/bleDecoder.js
import { logger } from '../utils/logger.js';

/**
 * BLE Payload Decoder with Configurable Byte Mapping
 * 
 * IMPORTANT TECHNICAL ACCURACY NOTICE:
 * This 12-byte binary frame is an application-level DEMO / PLACEHOLDER structure
 * created specifically for this monitoring system MVP.
 * The Acconeer A121 radar IC transmits raw complex sweep / distance data over SPI,
 * and does NOT have an official 12-byte vendor BLE packet format.
 * 
 * DEMO / PLACEHOLDER Frame Specification:
 * - Total Length: 12 Bytes
 * - Byte Order: Big-Endian (Configurable)
 */

export const DEFAULT_BYTE_MAPPING = {
  headerOffset: 0,
  headerExpectedValue: 0xAA,
  versionOffset: 1,
  distanceOffset: 2,
  distanceLength: 2,
  distanceEndian: 'BE', // 'BE' or 'LE'
  distanceUnitMultiplier: 0.001, // mm to meters
  signalQualityOffset: 4,
  batteryOffset: 5,
  temperatureOffset: 6,
  statusFlagsOffset: 7,
  sequenceOffset: 8,
  sequenceLength: 2,
  checksumOffset: 10,
  checksumLength: 2
};

export class BlePayloadDecoder {
  constructor(customMapping = {}) {
    this.mapping = { ...DEFAULT_BYTE_MAPPING, ...customMapping };
  }

  setMapping(customMapping) {
    this.mapping = { ...this.mapping, ...customMapping };
  }

  /**
   * Detailed Byte Analysis Table for Demo Protocol
   */
  getMappingDefinition() {
    return {
      frameLengthBytes: 12,
      endianness: this.mapping.distanceEndian,
      isPlaceholderFormat: true,
      protocolNotice: 'Application-level DEMO/PLACEHOLDER protocol. Not an official Acconeer AB vendor specification.',
      mapping: this.mapping,
      fields: [
        {
          offset: 0,
          length: 1,
          field: 'header',
          type: 'Uint8',
          byteOrder: 'N/A',
          scale: 1,
          units: 'hex',
          description: 'Magic byte identifier (expected 0xAA)'
        },
        {
          offset: 1,
          length: 1,
          field: 'version',
          type: 'Uint8',
          byteOrder: 'N/A',
          scale: 1,
          units: 'none',
          description: 'Payload schema version (0x01)'
        },
        {
          offset: 2,
          length: 2,
          field: 'distance',
          type: 'Uint16',
          byteOrder: this.mapping.distanceEndian === 'BE' ? 'Big-Endian' : 'Little-Endian',
          scale: 0.001,
          units: 'mm -> meters',
          description: 'Radar distance measurement from sensor face to liquid surface'
        },
        {
          offset: 4,
          length: 1,
          field: 'signalQuality',
          type: 'Uint8',
          byteOrder: 'N/A',
          scale: 1,
          units: '%',
          description: 'Radar SNR / confidence score (0-100%)'
        },
        {
          offset: 5,
          length: 1,
          field: 'battery',
          type: 'Uint8',
          byteOrder: 'N/A',
          scale: 1,
          units: '%',
          description: 'Device battery level (0-100%)'
        },
        {
          offset: 6,
          length: 1,
          field: 'temperature',
          type: 'Int8',
          byteOrder: 'N/A',
          scale: 1,
          units: '°C',
          description: 'Ambient / sensor die temperature (-128 to +127°C)'
        },
        {
          offset: 7,
          length: 1,
          field: 'statusFlags',
          type: 'Uint8 (Bitmask)',
          byteOrder: 'N/A',
          scale: 1,
          units: 'bitfield',
          description: 'Bit 0: Radar Locked, Bit 1: Wave Alert, Bit 2: Error, Bit 7: Demo Data'
        },
        {
          offset: 8,
          length: 2,
          field: 'sequence',
          type: 'Uint16',
          byteOrder: 'Big-Endian',
          scale: 1,
          units: 'count',
          description: 'Rolling message sequence number'
        },
        {
          offset: 10,
          length: 2,
          field: 'checksum',
          type: 'Uint16',
          byteOrder: 'Big-Endian',
          scale: 1,
          units: 'checksum',
          description: 'Sum of bytes 0..9 modulo 65536'
        }
      ]
    };
  }

  normalizeToBuffer(rawInput) {
    if (Buffer.isBuffer(rawInput)) {
      return rawInput;
    }
    if (Array.isArray(rawInput)) {
      return Buffer.from(rawInput);
    }
    if (typeof rawInput === 'string') {
      const cleanHex = rawInput.replace(/0x|\s+|:|-/gi, '');
      if (cleanHex.length % 2 !== 0) {
        throw new Error(`Malformed payload: Invalid hexadecimal string length (${cleanHex.length} nibbles)`);
      }
      return Buffer.from(cleanHex, 'hex');
    }
    throw new Error(`Unsupported raw payload format. Expected Buffer, Array, or Hex String.`);
  }

  formatToHexString(buffer) {
    return Array.from(buffer)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
  }

  decode(rawInput) {
    const timestamp = new Date().toISOString();
    const buffer = this.normalizeToBuffer(rawInput);
    const m = this.mapping;

    // Validate Length
    if (buffer.length < 12) {
      throw new Error(`Payload underflow: buffer is ${buffer.length} bytes, minimum required is 12 bytes`);
    }

    const validationWarnings = [];

    // 1. Header Validation
    const headerByte = buffer.readUInt8(m.headerOffset);
    if (headerByte !== m.headerExpectedValue) {
      validationWarnings.push(`Unexpected magic header byte: 0x${headerByte.toString(16)} (expected 0x${m.headerExpectedValue.toString(16)})`);
    }

    // 2. Protocol Version
    const version = buffer.readUInt8(m.versionOffset);

    // 3. Distance in mm
    let distanceMm = 0;
    if (m.distanceEndian === 'LE') {
      distanceMm = buffer.readUInt16LE(m.distanceOffset);
    } else {
      distanceMm = buffer.readUInt16BE(m.distanceOffset);
    }
    const distanceMeters = parseFloat((distanceMm * m.distanceUnitMultiplier).toFixed(3));

    // 4. Signal Quality & Battery
    const signalQuality = buffer.readUInt8(m.signalQualityOffset);
    const batteryPercentage = buffer.readUInt8(m.batteryOffset);

    // 5. Temperature
    const temperatureCelsius = buffer.readInt8(m.temperatureOffset);

    // 6. Status Flags
    const statusFlagsByte = buffer.readUInt8(m.statusFlagsOffset);
    const isRadarLocked = Boolean(statusFlagsByte & 0x01);
    const isSurfaceMotionAlert = Boolean(statusFlagsByte & 0x02);
    const isHardwareFault = Boolean(statusFlagsByte & 0x04);
    const isSimulatedDemo = Boolean(statusFlagsByte & 0x80);

    // 7. Sequence ID
    const sequenceNumber = buffer.readUInt16BE(m.sequenceOffset);

    // 8. Checksum verification
    const receivedChecksum = buffer.readUInt16BE(m.checksumOffset);
    let calculatedChecksum = 0;
    for (let i = 0; i < m.checksumOffset; i++) {
      calculatedChecksum = (calculatedChecksum + buffer[i]) & 0xFFFF;
    }
    const isChecksumValid = receivedChecksum === calculatedChecksum;
    if (!isChecksumValid) {
      validationWarnings.push(`Invalid checksum: received 0x${receivedChecksum.toString(16)} calculated 0x${calculatedChecksum.toString(16)}`);
    }

    return {
      rawHex: this.formatToHexString(buffer),
      rawPayloadBytes: Array.from(buffer),
      rawByteLength: buffer.length,
      protocolVersion: version,
      distanceMeters,
      distanceMm,
      signalQuality,
      batteryPercentage,
      temperatureCelsius,
      sequenceNumber,
      isChecksumValid,
      calculatedChecksum,
      receivedChecksum,
      validationWarnings,
      statusFlags: {
        raw: `0x${statusFlagsByte.toString(16).padStart(2, '0').toUpperCase()}`,
        isRadarLocked,
        isSurfaceMotionAlert,
        isHardwareFault,
        isSimulatedDemo
      },
      isPlaceholderFormat: true,
      timestamp,
      decodedAt: timestamp
    };
  }

  encode({
    distanceMeters = 2.5,
    signalQuality = 92,
    batteryPercentage = 95,
    temperatureCelsius = 24,
    isRadarLocked = true,
    isSurfaceMotionAlert = false,
    isHardwareFault = false,
    isSimulatedDemo = true,
    sequenceNumber = 1
  }) {
    const buffer = Buffer.alloc(12);
    const m = this.mapping;

    // Byte 0: Header
    buffer.writeUInt8(m.headerExpectedValue, m.headerOffset);

    // Byte 1: Version
    buffer.writeUInt8(0x01, m.versionOffset);

    // Bytes 2-3: Distance in mm
    const distanceMm = Math.round(distanceMeters * 1000);
    if (m.distanceEndian === 'LE') {
      buffer.writeUInt16LE(distanceMm, m.distanceOffset);
    } else {
      buffer.writeUInt16BE(distanceMm, m.distanceOffset);
    }

    // Byte 4: Signal Quality
    buffer.writeUInt8(Math.min(100, Math.max(0, signalQuality)), m.signalQualityOffset);

    // Byte 5: Battery
    buffer.writeUInt8(Math.min(100, Math.max(0, batteryPercentage)), m.batteryOffset);

    // Byte 6: Temperature (signed)
    buffer.writeInt8(temperatureCelsius, m.temperatureOffset);

    // Byte 7: Status Flags
    let flags = 0;
    if (isRadarLocked) flags |= 0x01;
    if (isSurfaceMotionAlert) flags |= 0x02;
    if (isHardwareFault) flags |= 0x04;
    if (isSimulatedDemo) flags |= 0x80;
    buffer.writeUInt8(flags, m.statusFlagsOffset);

    // Bytes 8-9: Sequence
    buffer.writeUInt16BE(sequenceNumber & 0xFFFF, m.sequenceOffset);

    // Bytes 10-11: Checksum
    let checksum = 0;
    for (let i = 0; i < m.checksumOffset; i++) {
      checksum = (checksum + buffer[i]) & 0xFFFF;
    }
    buffer.writeUInt16BE(checksum, m.checksumOffset);

    return buffer;
  }
}

export const bleDecoder = new BlePayloadDecoder();
