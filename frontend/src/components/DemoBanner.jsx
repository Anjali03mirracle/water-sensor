// frontend/src/components/DemoBanner.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DemoBanner({ simulatorStatus, hardwareStatus }) {
  return (
    <div className="mb-5 p-3 rounded-md bg-[#13161f] border border-amber-600/30 text-amber-200/90 text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                Hardware Emulation Notice
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-600/30">
                SIMULATED_DEMO
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Physical Acconeer A121 radar module and native BLE gateway are emulated in software. All surface distance measurements, radar SNR amplitudes, and GPS coordinates are synthetic telemetry streams marked with status flag bit 7 (0x80).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          <div>
            Simulator: <strong className={simulatorStatus?.isRunning ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {simulatorStatus?.isRunning ? 'ACTIVE (3s)' : 'PAUSED'}
            </strong>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            Target: <span className="text-slate-200">{simulatorStatus?.deviceId || 'ACCONEER-WL-001'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
