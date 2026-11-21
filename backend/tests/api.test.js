// tests/api.test.js
import test, { before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app.js';
import { mqttService } from '../src/services/mqttService.js';

const pipePath = `\\\\.\\pipe\\iot-water-level-test-${Date.now()}`;
let server;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: pipePath,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(pipePath, resolve);
  });
});

after(async () => {
  mqttService.disconnect();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API - GET /api/health returns 200 with online status and subsystems', async () => {
  const res = await makeRequest('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ONLINE');
  assert.strictEqual(res.body.demoModeActive, true);
  assert.ok(res.body.subsystems.mqtt);
  assert.ok(res.body.subsystems.elasticsearch);
});

test('API - GET /api/devices returns BLE device list with demo tags', async () => {
  const res = await makeRequest('GET', '/api/devices');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.devices));
  assert.ok(res.body.data.devices.length > 0);
  assert.strictEqual(res.body.data.isHardwareConnected, false, 'Hardware status must report false in demo mode');
});

test('API - POST /api/telemetry processes new reading in handbook structure', async () => {
  const res = await makeRequest('POST', '/api/telemetry', {
    distanceMeters: 1.5,
    deviceId: 'TEST-DEV-001',
    isDemoData: true
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  // Verify handbook-compliant structure
  assert.strictEqual(res.body.data.device_id, 'TEST-DEV-001');
  assert.ok(res.body.data.measurement);
  assert.strictEqual(res.body.data.measurement.water_level_meters, 3.7);
  assert.strictEqual(res.body.data.measurement.status, 'NORMAL');
  assert.ok(res.body.data.location);
  assert.strictEqual(res.body.data.source, 'SIMULATED_DEMO');
});

test('API - GET /api/location returns GPS coordinates and handles UNAVAILABLE state', async () => {
  // Test simulated lock
  const resLock = await makeRequest('GET', '/api/location');
  assert.strictEqual(resLock.status, 200);
  assert.strictEqual(resLock.body.success, true);
  assert.ok(typeof resLock.body.data.latitude === 'number');
  assert.strictEqual(resLock.body.data.isDemoData, true);

  // Switch to UNAVAILABLE
  await makeRequest('POST', '/api/location/source', { source: 'UNAVAILABLE' });
  const resUnavail = await makeRequest('GET', '/api/location');
  assert.strictEqual(resUnavail.body.data.source, 'UNAVAILABLE');
  assert.strictEqual(resUnavail.body.data.latitude, null);
  assert.strictEqual(resUnavail.body.data.status, 'SIGNAL_UNAVAILABLE');

  // Reset back to SIMULATED_DEMO
  await makeRequest('POST', '/api/location/source', { source: 'SIMULATED_DEMO' });
});

test('API - GET /api/mqtt/status returns broker status', async () => {
  const res = await makeRequest('GET', '/api/mqtt/status');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.topic);
});

test('API - POST /api/ble/decode-hex correctly decodes valid 12-byte payload', async () => {
  const res = await makeRequest('POST', '/api/ble/decode-hex', {
    hexString: 'AA 01 0B B8 5A 60 16 81 00 12 3E 44'
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.decoded.distanceMeters, 3.0);
  assert.strictEqual(res.body.waterLevel.waterLevelMeters, 2.2);
});
