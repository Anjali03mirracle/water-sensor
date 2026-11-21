// frontend/src/components/GpsPanel.jsx
import React from 'react';
import { MapPin, Navigation, Compass, Crosshair, ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function GpsPanel({ location, onSourceChange }) {
  const source = location?.source ?? 'SIMULATED_DEMO';
  const isDemo = location?.isDemoData ?? true;
  const isUnavailable = source === 'UNAVAILABLE' || source === 'PERMISSION_DENIED' || location?.latitude === null;
  const statusMessage = location?.statusMessage || (isDemo ? 'SIMULATED_DEMO: Synthetic coordinates for demonstration' : 'Live Fix');
  const lat = location?.latitude;
  const lon = location?.longitude;
  const altitude = location?.altitudeMeters;
  const accuracy = location?.accuracyMeters;
  const satellites = location?.satellitesVisible ?? 0;
  const timestamp = location?.timestamp;

  const sources = [
    { id: 'SIMULATED_DEMO', label: 'Simulated Demo Node' },
    { id: 'NMEA_SERIAL_UART', label: 'NMEA GNSS Serial Receiver' },
    { id: 'CELLULAR_TOWER_TRILATERATION', label: 'Cellular Tower Trilateration' },
    { id: 'FIXED_SITE_SURVEY', label: 'Fixed Site Survey Benchmark' },
    { id: 'UNAVAILABLE', label: 'Signal Unavailable (Hardware Detached)' },
    { id: 'PERMISSION_DENIED', label: 'Permission Denied (Host Block)' }
  ];

  const osmUrl = lat && lon 
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
    : null;

  return (
    <div className="industrial-card p-4 sm:p-5 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              GPS Spatial Telemetry & Geo-Referencing
              {isDemo && !isUnavailable && (
                <span className="badge badge-demo text-[9px]">SIMULATED_DEMO</span>
              )}
              {isUnavailable && (
                <span className="badge badge-high text-[9px]">{source}</span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Configurable Source Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Location Source:</span>
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sky-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-sky-500 font-mono"
          >
            {sources.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isUnavailable ? (
        <div className="p-3 rounded bg-amber-950/30 border border-amber-600/40 text-amber-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-semibold text-xs text-amber-300">
              {source === 'PERMISSION_DENIED' ? 'Location Permission Denied' : 'GPS Hardware / Signal Unavailable'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {location?.statusMessage || 'No physical GNSS receiver detected on serial UART. Coordinate streaming suspended.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Latitude */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-sky-400" />
              Latitude (WGS-84)
            </div>
            <div className="text-lg font-bold font-mono text-white tracking-tight">
              {lat !== null && lat !== undefined ? `${lat.toFixed(6)}° N` : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Valid: -90° to +90°</span>
          </div>

          {/* Longitude */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-sky-400" />
              Longitude (WGS-84)
            </div>
            <div className="text-lg font-bold font-mono text-white tracking-tight">
              {lon !== null && lon !== undefined ? `${lon.toFixed(6)}° W` : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Valid: -180° to +180°</span>
          </div>

          {/* Altitude & Accuracy */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-sky-400" />
              Elevation & Precision
            </div>
            <div className="text-lg font-bold font-mono text-white tracking-tight">
              {altitude !== null && altitude !== undefined ? `${altitude.toFixed(1)} m` : '--'}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              Precision: ±{accuracy?.toFixed(1) || '2.5'} m ({satellites} Sats)
            </span>
          </div>

          {/* Map Link & Timestamp */}
          <div className="p-3 rounded bg-[#070b14] border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Spatial Fix</span>
              <span className="text-emerald-400 text-[10px] font-mono">3D DGPS FIX</span>
            </div>
            <div className="text-xs text-slate-300 font-mono truncate">
              {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Live'}
            </div>
            {osmUrl ? (
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
              >
                <span>OpenStreetMap</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="mt-2 text-xs text-slate-500">Map unavailable</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
