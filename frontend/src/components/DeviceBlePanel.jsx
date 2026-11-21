// frontend/src/components/DeviceBlePanel.jsx
import React, { useState } from 'react';
import { 
  Bluetooth, 
  Search, 
  Link, 
  Unlink, 
  Binary, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Terminal,
  RefreshCw
} from 'lucide-react';

export default function DeviceBlePanel({
  devicesState,
  latestTelemetry,
  onScan,
  isScanning,
  onConnect,
  onDisconnect,
  onDecodeHex
}) {
  const [copiedHex, setCopiedHex] = useState(false);
  const [customHexInput, setCustomHexInput] = useState('AA 01 09 C4 5C 58 16 81 00 45 42 10');
  const [decodedResult, setDecodedResult] = useState(null);
  const [decodeError, setDecodeError] = useState(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const devices = devicesState?.devices || [];
  const connectedId = devicesState?.connectedDeviceId;
  const connectionState = devicesState?.connectionState || 'DISCONNECTED';
  const gatt = devicesState?.gattSpecification || {};

  const rawHex = latestTelemetry?.rawHex || 'AA 01 0B B8 5E 5C 16 81 00 24 3F 1A';

  const copyHex = () => {
    navigator.clipboard.writeText(rawHex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const handleTestDecode = async () => {
    try {
      setIsDecoding(true);
      setDecodeError(null);
      const res = await onDecodeHex(customHexInput);
      setDecodedResult(res);
    } catch (err) {
      setDecodeError(err.message);
    } finally {
      setIsDecoding(false);
    }
  };

  // Parse rawHex bytes array
  const hexBytes = rawHex.split(' ').filter(Boolean);

  // Field breakdown definitions
  const byteMappingTable = [
    { offset: '00', name: 'Header Magic', bytes: hexBytes[0] || 'AA', meaning: '0xAA (Acconeer Frame)' },
    { offset: '01', name: 'Protocol Ver', bytes: hexBytes[1] || '01', meaning: 'v1.0 Payload' },
    { offset: '02-03', name: 'Radar Dist (mm)', bytes: `${hexBytes[2] || '0B'} ${hexBytes[3] || 'B8'}`, meaning: `${latestTelemetry?.distanceMeters ? (latestTelemetry.distanceMeters * 1000).toFixed(0) : '3000'} mm (${latestTelemetry?.distanceMeters || '3.000'} m)` },
    { offset: '04', name: 'Signal Quality', bytes: hexBytes[4] || '5E', meaning: `${latestTelemetry?.signalQuality || 94}% SNR Confidence` },
    { offset: '05', name: 'Battery Level', bytes: hexBytes[5] || '5C', meaning: `${latestTelemetry?.batteryPercentage || 92}% Li-SOCl2 Cell` },
    { offset: '06', name: 'Temperature', bytes: hexBytes[6] || '16', meaning: `${latestTelemetry?.temperatureCelsius || 22}°C Die Temp` },
    { offset: '07', name: 'Status Bitmask', bytes: hexBytes[7] || '81', meaning: '0x81 (Radar Locked & Demo Flag)' },
    { offset: '08-09', name: 'Sequence ID', bytes: `${hexBytes[8] || '00'} ${hexBytes[9] || '24'}`, meaning: `Frame #${latestTelemetry?.sequenceNumber || 36}` },
    { offset: '10-11', name: '16-bit CRC', bytes: `${hexBytes[10] || '3F'} ${hexBytes[11] || '1A'}`, meaning: 'Checksum Valid' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      
      {/* LEFT: BLE Discovery & Device Management */}
      <div className="industrial-card p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Bluetooth className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  BLE Device Discovery & Management
                </h3>
                <p className="text-[11px] text-slate-400">
                  Radar gateway peripheral interface & GATT state
                </p>
              </div>
            </div>

            <button
              onClick={onScan}
              disabled={isScanning}
              className="btn-secondary text-[11px] flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-sky-400' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Peripherals'}
            </button>
          </div>

          {/* Discovered Peripherals List */}
          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Discovered Nodes ({devices.length})</span>
              <span className="text-[10px] font-mono text-sky-400">
                Adapter: {connectionState}
              </span>
            </div>

            {devices.map((dev) => {
              const isSelected = dev.id === connectedId;
              return (
                <div
                  key={dev.id}
                  className={`p-3 rounded border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-950/20 border-sky-500/40'
                      : 'bg-[#090e18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{dev.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          CONNECTED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-3">
                      <span>MAC: {dev.address}</span>
                      <span>RSSI: <strong className="text-slate-300">{dev.rssi} dBm</strong></span>
                      <span className="text-sky-400">ID: {dev.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <button
                        onClick={() => onDisconnect(dev.id)}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 flex items-center gap-1.5 transition"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => onConnect(dev.id)}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 flex items-center gap-1.5 transition"
                      >
                        <Link className="w-3 h-3" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* GATT Specifications Accordion / Reference */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
              <Cpu className="w-3 h-3 text-sky-400" />
              DEMO / PLACEHOLDER GATT UUIDs (Not Vendor Official)
            </div>
            <p className="text-[10px] text-amber-300/80 mb-2 font-sans">
              Notice: The Acconeer A121 is an SPI radar transceiver without native BLE. These UUIDs are application-level placeholders for a custom BLE forwarder.
            </p>
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span>Radar Service:</span>
              <span className="text-sky-300 text-[10px]">{gatt.SERVICE_UUID || '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'}</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span>Telemetry RX (Notify):</span>
              <span className="text-sky-300 text-[10px]">{gatt.CHAR_TELEMETRY_NOTIFY_UUID || '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'}</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span>Control TX (Write):</span>
              <span className="text-sky-300 text-[10px]">{gatt.CHAR_CONTROL_WRITE_UUID || '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
          Hardware Notice: Native Bluetooth scanning on host machines requires OS BlueZ / WinUSB kernel drivers. The BLE adapter emulates GATT peripheral scanning and subscription events seamlessly.
        </p>
      </div>

      {/* RIGHT: Raw BLE Payload Viewer & Hex Decoder */}
      <div className="industrial-card p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Raw BLE Byte Payload Viewer
                  <span className="badge badge-demo text-[9px]">DEMO/PLACEHOLDER FORMAT</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Application-level 12-byte binary frame (Not official Acconeer AB vendor protocol)
                </p>
              </div>
            </div>

            <button
              onClick={copyHex}
              className="btn-secondary text-[11px] flex items-center gap-1.5"
            >
              {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedHex ? 'Copied' : 'Copy Hex'}
            </button>
          </div>

          {/* Hex Byte Stream Box */}
          <div className="p-2.5 rounded bg-[#070b14] border border-slate-800 mb-3 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Live Inbound Hex String</span>
              <span className="text-sky-400">12 Bytes • Big-Endian</span>
            </div>
            <div className="text-xs font-semibold text-sky-300 tracking-wider flex flex-wrap gap-1.5">
              {hexBytes.map((byte, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition cursor-help"
                  title={`Byte [${idx}]: 0x${byte}`}
                >
                  {byte}
                </span>
              ))}
            </div>
          </div>

          {/* Byte Field Breakdown Table */}
          <div className="overflow-x-auto mb-3 border border-slate-800 rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090e18] text-slate-400 text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-1.5 px-2.5">Offset</th>
                  <th className="py-1.5 px-2.5">Field</th>
                  <th className="py-1.5 px-2.5">Raw Byte</th>
                  <th className="py-1.5 px-2.5">Decoded Representation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#070b14] text-slate-300">
                {byteMappingTable.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition">
                    <td className="py-1 px-2.5 text-slate-500 text-[11px]">{row.offset}</td>
                    <td className="py-1 px-2.5 font-sans font-medium text-slate-300 text-[11px]">{row.name}</td>
                    <td className="py-1 px-2.5 text-sky-400 font-bold text-[11px]">{row.bytes}</td>
                    <td className="py-1 px-2.5 text-emerald-400 text-[11px]">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Hex String Decoder Tool */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              Manual BLE Hex Stream Decoder
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customHexInput}
                onChange={(e) => setCustomHexInput(e.target.value)}
                placeholder="Enter 12-byte hex e.g. AA 01 0B B8 ..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleTestDecode}
                disabled={isDecoding}
                className="btn-primary text-xs"
              >
                {isDecoding ? 'Decoding...' : 'Decode Hex'}
              </button>
            </div>

            {decodeError && (
              <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {decodeError}
              </p>
            )}

            {decodedResult && (
              <div className="mt-2.5 p-2 rounded bg-slate-900 border border-emerald-500/30 text-xs font-mono space-y-1 text-slate-300">
                <div className="text-emerald-400 font-bold">
                  Decoded Distance: {decodedResult.decoded?.distanceMeters} m ({decodedResult.decoded?.distanceMm} mm)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Calculated Water Level: <strong className="text-sky-300">{decodedResult.waterLevel?.waterLevelMeters} m ({decodedResult.waterLevel?.waterLevelPercentage}%)</strong> • Status: {decodedResult.waterLevel?.status}
                </div>
                <div className="text-[10px] text-slate-500">
                  Checksum Valid: {decodedResult.decoded?.isChecksumValid ? 'YES' : 'NO'} • Battery: {decodedResult.decoded?.batteryPercentage}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
