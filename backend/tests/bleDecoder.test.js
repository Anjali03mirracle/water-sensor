// tests/bleDecoder.test.js
import test from 'node:test';
import assert from 'node:assert';
import { bleDecoder } from '../src/services/bleDecoder.js';

test('BlePayloadDecoder - encode and decode roundtrip', () => {
  const original = {
    distanceMeters: 3.250,
    signalQuality: 92,
    batteryPercentage: 88,
    temperatureCelsius: 23,
    isRadarLocked: true,
    isSurfaceMotionAlert: false,
    isHardwareFault: false,
    isSimulatedDemo: true,
    sequenceNumber: 1042
  };

  const buffer = bleDecoder.encode(original);
  assert.strictEqual(buffer.length, 12, 'Encoded frame must be 12 bytes');

  const decoded = bleDecoder.decode(buffer);

  assert.strictEqual(decoded.distanceMeters, 3.25);
  assert.strictEqual(decoded.distanceMm, 3250);
  assert.strictEqual(decoded.signalQuality, 92);
  assert.strictEqual(decoded.batteryPercentage, 88);
  assert.strictEqual(decoded.temperatureCelsius, 23);
  assert.strictEqual(decoded.statusFlags.isRadarLocked, true);
  assert.strictEqual(decoded.statusFlags.isSurfaceMotionAlert, false);
  assert.strictEqual(decoded.statusFlags.isSimulatedDemo, true);
  assert.strictEqual(decoded.isChecksumValid, true, 'Checksum must be valid');
  assert.strictEqual(decoded.sequenceNumber, 1042);
  assert.ok(decoded.rawPayloadBytes);
  assert.ok(decoded.timestamp);
});

test('BlePayloadDecoder - decode from formatted hex string', () => {
  const buffer = bleDecoder.encode({
    distanceMeters: 2.0,
    signalQuality: 94,
    batteryPercentage: 85,
    temperatureCelsius: 22,
    isRadarLocked: true,
    isSimulatedDemo: true,
    sequenceNumber: 42
  });
  const hexStr = bleDecoder.formatToHexString(buffer);

  const decoded = bleDecoder.decode(hexStr);
  assert.strictEqual(decoded.distanceMeters, 2.0);
  assert.strictEqual(decoded.isChecksumValid, true);
});

test('BlePayloadDecoder - rejects malformed payloads and short buffers', () => {
  // Underflow: only 6 bytes
  assert.throws(() => {
    bleDecoder.decode(Buffer.from([0xAA, 0x01, 0x0B, 0xB8, 0x50, 0x60]));
  }, /Payload underflow/);

  // Odd length hex string
  assert.throws(() => {
    bleDecoder.decode('AA010BB85');
  }, /Malformed payload/);
});

test('BlePayloadDecoder - flags invalid checksum with validation warnings', () => {
  const buffer = bleDecoder.encode({
    distanceMeters: 2.5,
    signalQuality: 90,
    batteryPercentage: 90,
    temperatureCelsius: 20
  });

  // Corrupt checksum byte
  buffer[11] = (buffer[11] + 1) & 0xFF;

  const decoded = bleDecoder.decode(buffer);
  assert.strictEqual(decoded.isChecksumValid, false, 'Corrupted checksum must be flagged false');
  assert.ok(decoded.validationWarnings.length > 0);
});

test('BlePayloadDecoder - returns complete byte mapping documentation', () => {
  const spec = bleDecoder.getMappingDefinition();
  assert.strictEqual(spec.frameLengthBytes, 12);
  assert.strictEqual(spec.isPlaceholderFormat, true);
  assert.ok(Array.isArray(spec.fields));
  assert.strictEqual(spec.fields.length, 9);
  // Verify field properties
  const distField = spec.fields.find(f => f.field === 'distance');
  assert.strictEqual(distField.offset, 2);
  assert.strictEqual(distField.length, 2);
  assert.strictEqual(distField.type, 'Uint16');
  assert.strictEqual(distField.scale, 0.001);
});
