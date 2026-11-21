// frontend/src/components/DemoBanner.jsx
import React from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export default function DemoBanner({ simulatorStatus, hardwareStatus }) {
  return (
    <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-slate-900/60 border border-amber-600/40 text-amber-200 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-amber-300">
                HARDWARE EMULATION & DEMO MODE ACTIVE
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-200">
                Simulated Telemetry
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
              Physical Acconeer A121 PCR hardware and BLE radio transceiver are simulated via software adapter. All displayed water levels, radar sweeps, and GPS coordinates are synthetic data stream samples marked with status bit 7 (0x80).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-amber-500/20">
          <div className="flex items-center gap-1.5 font-mono text-amber-300/90">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Simulator: {simulatorStatus?.isRunning ? 'STREAMING' : 'PAUSED'}</span>
          </div>
          <span className="text-amber-500/40">•</span>
          <span className="text-[11px] text-amber-200/70">Interval: {simulatorStatus?.intervalMs || 3000}ms</span>
        </div>
      </div>
    </div>
  );
}
