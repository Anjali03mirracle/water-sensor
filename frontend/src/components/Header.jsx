// frontend/src/components/Header.jsx
import React from 'react';
import { Radio, Play, Square, Activity, Cpu, RefreshCw } from 'lucide-react';

export default function Header({
  simulatorStatus,
  onToggleSimulator,
  onStepSimulator,
  onRefresh,
  isRefreshing,
  onOpenSpecs
}) {
  const isRunning = simulatorStatus?.isRunning;

  return (
    <header className="industrial-card mb-5 p-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              IoT Water Level Detection System
            </h1>
            <span className="badge badge-demo">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              DEMO SIMULATION ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
            <span>Primary Sensor: <strong className="text-slate-200">Acconeer A121 (60 GHz PCR)</strong></span>
            <span className="text-slate-600">|</span>
            <span>BLE Gateway Protocol</span>
            <span className="text-slate-600">|</span>
            <span>MQTT & Elasticsearch Fallback Sync</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onOpenSpecs}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Inspect Acconeer A121 radar profile parameters and calibration equations"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          A121 Radar Specs
        </button>

        <button
          onClick={onStepSimulator}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Manually trigger 1 measurement pulse"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Single Pulse
        </button>

        <button
          onClick={() => onToggleSimulator(!isRunning)}
          className={`btn-secondary text-xs font-mono flex items-center gap-1.5 ${
            isRunning
              ? 'text-amber-300 border-amber-600/50 bg-amber-950/20 hover:bg-amber-950/30'
              : 'text-emerald-300 border-emerald-600/50 bg-emerald-950/20 hover:bg-emerald-950/30'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              Pause Stream ({simulatorStatus?.intervalMs ? `${simulatorStatus.intervalMs / 1000}s` : '3s'})
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              Resume Stream
            </>
          )}
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-secondary text-xs p-2"
          title="Refresh All Telemetry & Subsystem States"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
