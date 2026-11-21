// src/services/bleAdapter.js
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { bleDecoder } from './bleDecoder.js';

/**
 * BLE Integration Adapter Interface & Simulation
 * 
 * IMPORTANT TECHNICAL ACCURACY NOTICE:
 * 1. The Acconeer A121 is an SPI-interfaced 60 GHz Pulsed Coherent Radar chip.
 *    It has NO native Bluetooth hardware.
 * 2. The UUIDs below are DEMO / PLACEHOLDER values defined for this application's
 *    simulated BLE gateway. They are NOT official Acconeer vendor UUIDs.
 * 3. All peripheral devices returned by this adapter are SIMULATED DEMO NODES.
 */

export const BLE_GATT_SPEC = {
  // DEMO/PLACEHOLDER: Custom Acconeer IoT Water Monitor Service
  SERVICE_UUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
  // DEMO/PLACEHOLDER: Radar Telemetry RX Characteristic (Notify)
  CHAR_TELEMETRY_NOTIFY_UUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
  // DEMO/PLACEHOLDER: Radar Control TX Characteristic (Write)
  CHAR_CONTROL_WRITE_UUID: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
  // Standard Battery Service (Adopted Bluetooth SIG standard 0x180F)
  BATTERY_SERVICE_UUID: '0000180F-0000-1000-8000-00805F9B34FB',
  isPlaceholderSpecification: true,
  vendorNotice: 'Acconeer A121 is an SPI radar transceiver. These UUIDs are application-level DEMO/PLACEHOLDER definitions.'
};

export class BleAdapter extends EventEmitter {
  constructor() {
    super();
    this.isScanning = false;
    this.connectedDevice = null;
    this.connectionState = 'DISCONNECTED';
    
    // DEMO/PLACEHOLDER simulated devices
    this.knownDevices = [
      {
        id: 'ACCONEER-WL-001',
        name: 'Acconeer Radar Gateway 01 (Simulated)',
        address: 'D4:36:39:CA:A1:21',
        rssi: -58,
        services: [BLE_GATT_SPEC.SERVICE_UUID, BLE_GATT_SPEC.BATTERY_SERVICE_UUID],
        characteristics: [
          {
            uuid: BLE_GATT_SPEC.CHAR_TELEMETRY_NOTIFY_UUID,
            properties: ['read', 'notify'],
            description: '[DEMO/PLACEHOLDER] Radar Raw Payload Stream'
          },
          {
            uuid: BLE_GATT_SPEC.CHAR_CONTROL_WRITE_UUID,
            properties: ['write', 'writeWithoutResponse'],
            description: '[DEMO/PLACEHOLDER] Radar Sampling Configuration'
          }
        ],
        isConnected: true, // Simulated connection active
        isSimulatedDevice: true,
        lastSeen: new Date().toISOString()
      },
      {
        id: 'ACCONEER-WL-002',
        name: 'Acconeer Radar Gateway 02 (Reservoir - Simulated)',
        address: 'E8:6B:EA:9F:B4:72',
        rssi: -74,
        services: [BLE_GATT_SPEC.SERVICE_UUID],
        characteristics: [
          {
            uuid: BLE_GATT_SPEC.CHAR_TELEMETRY_NOTIFY_UUID,
            properties: ['notify'],
            description: '[DEMO/PLACEHOLDER] Radar Raw Payload Stream'
          }
        ],
        isConnected: false,
        isSimulatedDevice: true,
        lastSeen: new Date().toISOString()
      },
      {
        id: 'DEMO-SINK-003',
        name: 'Sump Basin IoT Node (Simulated)',
        address: 'F0:F5:BD:11:22:33',
        rssi: -82,
        services: [BLE_GATT_SPEC.SERVICE_UUID],
        characteristics: [],
        isConnected: false,
        isSimulatedDevice: true,
        lastSeen: new Date().toISOString()
      }
    ];

    // Set initial active simulated device
    this.connectedDevice = this.knownDevices[0];
    this.connectionState = 'CONNECTED';
  }

  /**
   * Hardware availability & capability report
   */
  getHardwareStatus() {
    return {
      isNativeBleAvailable: false,
      isHardwareConnected: false,
      driverType: 'SIMULATED_BLE_GATT_ADAPTER',
      platform: process.platform,
      uuidSpecification: 'DEMO_PLACEHOLDER_NOT_VENDOR_OFFICIAL',
      reason: 'Physical BLE scanning requires OS-level Bluetooth peripheral daemon (BlueZ / Noble). Running simulated BLE GATT adapter with full protocol emulation. Real Acconeer A121 requires physical SPI MCU.'
    };
  }

  /**
   * Scan for nearby BLE devices
   */
  async scan(timeoutMs = 1500) {
    this.isScanning = true;
    logger.info(`Starting simulated BLE scan for ${timeoutMs}ms...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isScanning = false;
        this.knownDevices.forEach(d => {
          d.rssi = -50 - Math.floor(Math.random() * 35);
          d.lastSeen = new Date().toISOString();
        });
        logger.info(`Simulated BLE scan completed. Found ${this.knownDevices.length} devices.`);
        resolve(this.knownDevices);
      }, timeoutMs);
    });
  }

  /**
   * List known / cached devices
   */
  getDevices() {
    return {
      devices: this.knownDevices,
      connectedDeviceId: this.connectedDevice ? this.connectedDevice.id : null,
      connectionState: this.connectionState,
      gattSpecification: BLE_GATT_SPEC,
      isHardwareConnected: false,
      isSimulated: true
    };
  }

  /**
   * Connect to a specific BLE device by ID
   */
  async connect(deviceId) {
    logger.info(`Connecting to simulated BLE device: ${deviceId}...`);
    this.connectionState = 'CONNECTING';

    const device = this.knownDevices.find(d => d.id === deviceId);
    if (!device) {
      this.connectionState = this.connectedDevice ? 'CONNECTED' : 'DISCONNECTED';
      throw new Error(`Device ${deviceId} not found in scan inventory`);
    }

    this.knownDevices.forEach(d => { d.isConnected = false; });
    device.isConnected = true;
    this.connectedDevice = device;
    this.connectionState = 'CONNECTED';
    
    logger.info(`Connected to simulated BLE device: ${device.name} (${device.id})`);
    this.emit('connected', device);
    return device;
  }

  /**
   * Disconnect the current or specified device
   */
  async disconnect(deviceId) {
    logger.info(`Disconnecting simulated BLE device: ${deviceId || this.connectedDevice?.id}...`);
    this.connectionState = 'DISCONNECTED';
    
    if (this.connectedDevice) {
      this.connectedDevice.isConnected = false;
    }
    const previousDevice = this.connectedDevice;
    this.connectedDevice = null;
    
    this.emit('disconnected', previousDevice);
    return { success: true, message: `Disconnected from ${deviceId || 'device'} (Simulated)` };
  }

  /**
   * Receive raw byte payload from peripheral (called by simulator or physical gateway)
   */
  handleIncomingRawPayload(rawBuffer, deviceId = 'ACCONEER-WL-001') {
    const decoded = bleDecoder.decode(rawBuffer);
    const eventData = {
      deviceId,
      rawHex: decoded.rawHex,
      rawBytes: Array.from(rawBuffer),
      decoded,
      isSimulatedData: true,
      receivedAt: new Date().toISOString()
    };
    this.emit('data', eventData);
    return eventData;
  }
}

export const bleAdapter = new BleAdapter();
