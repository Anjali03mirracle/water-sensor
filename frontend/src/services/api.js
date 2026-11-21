// frontend/src/services/api.js
const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // System & Health
  async getHealth() {
    return handleResponse(await fetch(`${API_BASE}/health`));
  },

  // Telemetry
  async getTelemetryLatest() {
    return handleResponse(await fetch(`${API_BASE}/telemetry/latest`));
  },

  async getTelemetryHistory(limit = 50, offset = 0) {
    return handleResponse(await fetch(`${API_BASE}/telemetry?limit=${limit}&offset=${offset}`));
  },

  async postTelemetry(payload) {
    return handleResponse(await fetch(`${API_BASE}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }));
  },

  // Simulator
  async toggleSimulator(running, intervalMs) {
    return handleResponse(await fetch(`${API_BASE}/telemetry/simulator/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ running, intervalMs })
    }));
  },

  async stepSimulator() {
    return handleResponse(await fetch(`${API_BASE}/telemetry/simulator/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }));
  },

  // BLE & Devices
  async getDevices() {
    return handleResponse(await fetch(`${API_BASE}/devices`));
  },

  async scanDevices(timeoutMs = 1500) {
    return handleResponse(await fetch(`${API_BASE}/devices/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeoutMs })
    }));
  },

  async connectDevice(deviceId) {
    return handleResponse(await fetch(`${API_BASE}/devices/${deviceId}/connect`, {
      method: 'POST'
    }));
  },

  async disconnectDevice(deviceId) {
    return handleResponse(await fetch(`${API_BASE}/devices/${deviceId}/disconnect`, {
      method: 'POST'
    }));
  },

  // GPS Location
  async getLocation() {
    return handleResponse(await fetch(`${API_BASE}/location`));
  },

  async setLocationSource(source) {
    return handleResponse(await fetch(`${API_BASE}/location/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    }));
  },

  // MQTT
  async getMqttStatus() {
    return handleResponse(await fetch(`${API_BASE}/mqtt/status`));
  },

  async publishMqtt(payload, topic) {
    return handleResponse(await fetch(`${API_BASE}/mqtt/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, topic })
    }));
  },

  // Elasticsearch
  async getElasticsearchStatus() {
    return handleResponse(await fetch(`${API_BASE}/elasticsearch/status`));
  },

  async searchElasticsearch(query = '', limit = 20) {
    return handleResponse(await fetch(`${API_BASE}/elasticsearch/records?query=${encodeURIComponent(query)}&limit=${limit}`));
  },

  // Acconeer & BLE Specs
  async getAcconeerConfig() {
    return handleResponse(await fetch(`${API_BASE}/acconeer/config`));
  },

  async getBleDecoderSpec() {
    return handleResponse(await fetch(`${API_BASE}/ble/decoder-spec`));
  },

  async decodeBleHex(hexString) {
    return handleResponse(await fetch(`${API_BASE}/ble/decode-hex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hexString })
    }));
  }
};
