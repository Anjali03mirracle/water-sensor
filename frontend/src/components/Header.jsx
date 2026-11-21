// frontend/src/components/Header.jsx
import React from 'react';
import { Waves, Play, Square, Activity, Cpu, RefreshCw } from 'lucide-react';

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
    <header className="glass-card mb-6 p-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Waves className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              IoT Water Level Detection System
            </h1>
            <span className="badge badge-demo">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              DEMO SIMULATION ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>Primary Sensor: <strong className="text-cyan-400">Acconeer A121 (60 GHz PCR)</strong></span>
            <span>•</span>
            <span>BLE Gateway Protocol</span>
            <span>•</span>
            <span>MQTT & Elasticsearch Cloud Sync</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Acconeer Architecture & Calibration modal button */}
        <button
          onClick={onOpenSpecs}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="View Acconeer A121 Radar Configuration & Calibration Math"
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          A121 Radar Specs
        </button>

        {/* Manual Step Pulse */}
        <button
          onClick={onStepSimulator}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Manually trigger 1 measurement sample"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          Single Pulse
        </button>

        {/* Simulator Stream Toggle */}
        <button
          onClick={() => onToggleSimulator(!isRunning)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            isRunning
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/40'
              : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              Pause Simulator ({simulatorStatus?.intervalMs ? `${simulatorStatus.intervalMs / 1000}s` : '3s'})
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Simulator
            </>
          )}
        </button>

        {/* Refresh All Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-secondary text-xs"
          title="Refresh All Telemetry & Subsystems"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
