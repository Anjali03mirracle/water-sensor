// frontend/src/components/AcconeerModal.jsx
import React from 'react';
import { X, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Layers, Calculator, Wrench } from 'lucide-react';

export default function AcconeerModal({ isOpen, onClose, acconeerConfig }) {
  if (!isOpen) return null;

  const cfg = acconeerConfig?.configuration?.sensorConfig || {};
  const tank = acconeerConfig?.configuration?.tankParameters || {};
  const hw = acconeerConfig?.hardwareStatus || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Acconeer A121 Pulsed Coherent Radar (PCR) Integration Specs
              </h2>
              <p className="text-xs text-slate-400">
                Official RSS Architecture, Tank Calibration Math & Physical Hardware Checklist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hardware Status Banner */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs mb-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300">
              Hardware Status: {hw.isHardwareConnected ? 'PHYSICAL SENSOR ATTACHED' : 'SOFTWARE ADAPTER SIMULATION'}
            </div>
            <p className="text-amber-200/80 mt-1 leading-relaxed">
              {hw.limitationNotice || 'Physical Acconeer A121 module requires Acconeer RSS library flashed on an SPI MCU or BLE Gateway. Running in verified software simulation / adapter mode.'}
            </p>
          </div>
        </div>

        {/* Section 1: Tank Geometry & Distance-to-Water-Level Calculation */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            1. Distance-to-Water-Level Calibration Math
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
            <div className="text-cyan-300 font-bold">
              Formula: Water Level = Sensor Mounting Height (5.2m) - Radar Distance (d)
            </div>
            <div className="text-slate-400 leading-relaxed">
              • <strong>Mounting Height</strong>: {tank.mountingHeightMeters || 5.2} m (Distance from sensor face to tank floor)<br/>
              • <strong>Usable Tank Height</strong>: {tank.tankHeightMeters || 5.0} m (Capacity limit)<br/>
              • <strong>Deadzone / Blind Spot</strong>: {tank.deadzoneMeters || 0.05} m (Minimum focal distance in front of radar lens)<br/>
              • <strong>Critical High Alert</strong>: ≥ {tank.criticalHighPercent || 85}% ({(5.0 * 0.85).toFixed(2)} m)<br/>
              • <strong>Low Water Alert</strong>: ≤ {tank.lowPercent || 20}% ({(5.0 * 0.20).toFixed(2)} m)
            </div>
          </div>
        </div>

        {/* Section 2: Sensor RSS Configuration Structure */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            2. Acconeer A121 RSS Configuration [DEMO / Illustrative Assumption]
          </h3>
          <p className="text-[11px] text-amber-300/80 mb-2 font-mono">
            Notice: Parameters below are illustrative assumptions based on Acconeer RSS concepts. They are not certified factory defaults or official field calibration settings.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Radar Profile</span>
              <span className="text-cyan-300 font-bold">Profile 3 (Balanced Range)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Pulse Frequency (PRF)</span>
              <span className="text-cyan-300 font-bold">{cfg.prf || 'PRF_15_6_MHZ'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Averaging (HWAAS)</span>
              <span className="text-cyan-300 font-bold">{cfg.hwaas || 32} Samples</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Receiver Gain</span>
              <span className="text-cyan-300 font-bold">{cfg.receiverGain || 15} dB</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Range Start</span>
              <span className="text-cyan-300 font-bold">0.10 m</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Idle State</span>
              <span className="text-cyan-300 font-bold">DEEP_SLEEP</span>
            </div>
          </div>
        </div>

        {/* Section 3: Physical Hardware Transition Checklist */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-400" />
            3. Physical Hardware Deployment Checklist
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Acconeer XE121 Evaluation Kit or custom PCB with A121 PCR chip.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Host MCU with SPI bus support (Nordic nRF52840 / STM32WB55) running Acconeer RSS C-SDK.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Verified BLE GATT peripheral firmware broadcasting the 12-byte telemetry packet format.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Dielectric radome / protective PTFE lens window resistant to moisture and condensation.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs">
            Close Specification
          </button>
        </div>

      </div>
    </div>
  );
}
