// frontend/src/components/StatCards.jsx
import React from 'react';
import { 
  Waves, 
  ArrowDownUp, 
  Radio, 
  Database, 
  MapPin, 
  Clock, 
  Battery, 
  Signal
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
  
  const getStatusBadge = (st) => {
    switch (st) {
      case 'HIGH':
        return <span className="badge badge-high">HIGH ALERT</span>;
      case 'LOW':
        return <span className="badge badge-low">LOW ALERT</span>;
      default:
        return <span className="badge badge-normal">NOMINAL</span>;
    }
  };

  const getBarColor = (st) => {
    switch (st) {
      case 'HIGH': return 'bg-rose-500';
      case 'LOW': return 'bg-amber-500';
      default: return 'bg-sky-500';
    }
  };

  const isBleConnected = devicesState?.connectionState === 'CONNECTED';
  const isMqttConnected = mqttState?.isConnected;
  const isEsAvailable = esState?.isAvailable;

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      
      {/* 1. Water Level */}
      <div className="industrial-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            Water Level
          </span>
          {getStatusBadge(status)}
        </div>

        <div className="my-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {currentWaterLevel.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">m</span>
            <span className="text-xs font-mono ml-auto text-sky-400 font-semibold bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
              {currentPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Simple Industrial Level Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5">
            <div 
              className={`h-full transition-all duration-300 ${getBarColor(status)}`}
              style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
          <span>Capacity: {tankHeight.toFixed(1)}m</span>
          <span className="text-slate-300">Vol: ~{(currentPercentage * 50).toFixed(0)} L</span>
        </div>
      </div>

      {/* 2. Radar Distance to Surface */}
      <div className="industrial-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-300" />
            Surface Clearance
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/60">
            A121 Radar
          </span>
        </div>

        <div className="my-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {distanceToSurface.toFixed(3)}
            </span>
            <span className="text-xs text-slate-400 font-mono">m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sensor face to liquid level distance
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
          <span className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-emerald-400" />
            SNR: {telemetry?.signalQuality ?? 92}%
          </span>
          <span className="flex items-center gap-1">
            <Battery className="w-3 h-3 text-slate-300" />
            Batt: {telemetry?.batteryPercentage ?? 95}%
          </span>
        </div>
      </div>

      {/* 3. BLE & MQTT Link Status */}
      <div className="industrial-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            Gateway Links
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {telemetry?.deviceId || 'ACCONEER-001'}
          </span>
        </div>

        <div className="space-y-1.5 my-1 text-xs font-mono">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">BLE Gateway:</span>
            <span className={`text-[10px] font-semibold ${isBleConnected ? 'text-amber-400' : 'text-slate-400'}`}>
              {isBleConnected ? 'SIMULATED_LINK' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">MQTT Broker:</span>
            <span className={`text-[10px] font-semibold ${isMqttConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isMqttConnected ? 'ONLINE' : 'LOCAL BUFFER'}
            </span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
          <span>Packets: {mqttState?.messagesPublishedCount ?? 0}</span>
          <span>QoS: 1</span>
        </div>
      </div>

      {/* 4. Storage & Spatial Snapshot */}
      <div className="industrial-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Storage & Location
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            {formatTime(telemetry?.timestamp)}
          </span>
        </div>

        <div className="space-y-1.5 my-1 text-xs font-mono">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Elasticsearch:</span>
            <span className={`text-[10px] font-semibold ${isEsAvailable ? 'text-emerald-400' : 'text-slate-300'}`}>
              {isEsAvailable ? 'ONLINE' : 'FALLBACK MEMORY'}
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              GPS:
            </span>
            <span className="text-slate-200">
              {location?.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '36.0155, -114.7378'}
            </span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
          <span>Indexed: {esState?.indexedCount ?? 0} docs</span>
          <span className="text-slate-400">9 Sats Locked</span>
        </div>
      </div>

    </div>
  );
}
