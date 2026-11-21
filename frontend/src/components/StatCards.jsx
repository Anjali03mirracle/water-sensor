// frontend/src/components/StatCards.jsx
import React from 'react';
import { 
  Waves, 
  ArrowDownUp, 
  Bluetooth, 
  Radio, 
  Database, 
  MapPin, 
  Clock, 
  Battery, 
  Signal, 
  AlertCircle 
} from 'lucide-react';

export default function StatCards({ 
  telemetry, 
  devicesState, 
  mqttState, 
  esState, 
  location 
}) {
  const currentWaterLevel = telemetry?.waterLevelMeters ?? 0;
  const currentPercentage = telemetry?.waterLevelPercentage ?? 0;
  const distanceToSurface = telemetry?.distanceMeters ?? 0;
  const status = telemetry?.status ?? 'NORMAL';
  const tankHeight = telemetry?.calibration?.tankHeightMeters ?? 5.0;
  
  // Status badge styling
  const getStatusBadge = (st) => {
    switch (st) {
      case 'HIGH':
        return <span className="badge badge-high animate-pulse">CRITICAL HIGH</span>;
      case 'LOW':
        return <span className="badge badge-low">LOW WATER</span>;
      default:
        return <span className="badge badge-normal">NORMAL LEVEL</span>;
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'HIGH': return 'from-rose-500 to-pink-600 text-rose-400';
      case 'LOW': return 'from-amber-500 to-orange-600 text-amber-400';
      default: return 'from-cyan-500 to-blue-600 text-cyan-400';
    }
  };

  const isBleConnected = devicesState?.connectionState === 'CONNECTED';
  const isMqttConnected = mqttState?.isConnected;
  const isEsAvailable = esState?.isAvailable;

  const formatTime = (ts) => {
    if (!ts) return 'Waiting for stream...';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Water Level Card */}
      <div className="glass-card p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-cyan-400" />
            Water Level
          </span>
          {getStatusBadge(status)}
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {currentWaterLevel.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-slate-400">meters</span>
            <span className="text-xs font-mono ml-auto text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {currentPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Liquid level progress bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-700/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getStatusColor(status)}`}
              style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span>Tank Height: {tankHeight}m</span>
          <span className="font-mono text-slate-300">Vol: ~{(currentPercentage * 50).toFixed(0)} L</span>
        </div>
      </div>

      {/* 2. Radar Distance to Surface */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownUp className="w-4 h-4 text-blue-400" />
            Radar Clearance
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">
            60 GHz PCR
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {distanceToSurface.toFixed(3)}
            </span>
            <span className="text-sm font-medium text-slate-400">meters</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distance from Acconeer sensor face to liquid surface
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            SNR: {telemetry?.signalQuality ?? 92}%
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
            {telemetry?.batteryPercentage ?? 95}%
          </span>
        </div>
      </div>

      {/* 3. BLE & MQTT Connection Status */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-purple-400" />
            IoT Connectivity
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ID: {telemetry?.deviceId || 'ACCONEER-001'}
          </span>
        </div>

        <div className="space-y-2 my-1">
          {/* BLE Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <Bluetooth className={`w-3.5 h-3.5 ${isBleConnected ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-slate-300">BLE (Simulated)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBleConnected ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-slate-500'}`} />
              <span className={`font-semibold font-mono text-[10px] ${isBleConnected ? 'text-amber-300' : 'text-slate-400'}`}>
                {isBleConnected ? 'SIMULATED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          {/* MQTT Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <Radio className={`w-3.5 h-3.5 ${isMqttConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300">MQTT Broker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMqttConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`font-semibold font-mono text-[11px] ${isMqttConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isMqttConnected ? 'ONLINE' : 'LOCAL BUFFER'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span>Published: {mqttState?.messagesPublishedCount ?? 0} msgs</span>
          <span className="text-[10px] text-slate-500">QoS: 1</span>
        </div>
      </div>

      {/* 4. Elasticsearch & GPS Snapshot */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" />
            Storage & Location
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            {formatTime(telemetry?.timestamp)}
          </span>
        </div>

        <div className="space-y-2 my-1">
          {/* ES Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">Elasticsearch</span>
            </div>
            <span className={`text-[11px] font-mono font-semibold ${isEsAvailable ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {isEsAvailable ? 'CLUSTER CONNECTED' : 'LOCAL FALLBACK'}
            </span>
          </div>

          {/* GPS Coordinates preview */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>GPS</span>
            </div>
            <span className="text-slate-300 text-[11px]">
              {location?.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '36.0155, -114.7378'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span>Indexed: {esState?.indexedCount ?? 0} docs</span>
          <span className="text-emerald-400 font-mono text-[10px]">9 Sats Locked</span>
        </div>
      </div>

    </div>
  );
}
