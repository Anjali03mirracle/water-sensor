// frontend/src/components/TelemetryTable.jsx
import React, { useState } from 'react';
import { History, Download, RefreshCw, Layers } from 'lucide-react';

export default function TelemetryTable({ history = [], onRefresh, isRefreshing }) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = history.filter(item => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const downloadCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['Timestamp', 'Device ID', 'Water Level (m)', 'Water Level (%)', 'Distance (m)', 'Status', 'Signal Quality (%)', 'Battery (%)', 'Temp (C)', 'Raw Hex', 'Is Demo'];
    const rows = filtered.map(r => [
      r.timestamp,
      r.deviceId,
      r.waterLevelMeters,
      r.waterLevelPercentage,
      r.distanceMeters,
      r.status,
      r.signalQuality,
      r.batteryPercentage,
      r.temperatureCelsius,
      `"${r.rawHex}"`,
      r.isDemoData
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="industrial-card p-4 sm:p-5 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Historical Radar Telemetry Records
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                ({filtered.length} entries)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pulsed Coherent Radar time-series distance and fluid volume measurements
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2.5 py-1 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High Alert</option>
            <option value="LOW">Low Alert</option>
          </select>

          <button
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#090e18] text-slate-400 text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2 px-2.5">Timestamp</th>
              <th className="py-2 px-2.5">Device ID</th>
              <th className="py-2 px-2.5">Water Level</th>
              <th className="py-2 px-2.5">Surface Dist</th>
              <th className="py-2 px-2.5">Status</th>
              <th className="py-2 px-2.5">SNR</th>
              <th className="py-2 px-2.5">Battery</th>
              <th className="py-2 px-2.5">Temp</th>
              <th className="py-2 px-2.5">Raw BLE Payload (Hex)</th>
              <th className="py-2 px-2.5">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-[#070b14] text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-500 text-xs">
                  No telemetry records available yet.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 30).map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-900/40 transition">
                  <td className="py-1.5 px-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-1.5 px-2.5 text-sky-400 font-semibold whitespace-nowrap text-[11px]">
                    {row.deviceId}
                  </td>
                  <td className="py-1.5 px-2.5 font-semibold text-white whitespace-nowrap text-[11px]">
                    {row.waterLevelMeters?.toFixed(2)} m
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({row.waterLevelPercentage?.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                    {row.distanceMeters?.toFixed(3)} m
                  </td>
                  <td className="py-1.5 px-2.5 whitespace-nowrap text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${
                      row.status === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      row.status === 'LOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-400 text-[11px]">{row.signalQuality}%</td>
                  <td className="py-1.5 px-2.5 text-slate-400 text-[11px]">{row.batteryPercentage}%</td>
                  <td className="py-1.5 px-2.5 text-slate-400 text-[11px]">{row.temperatureCelsius}°C</td>
                  <td className="py-1.5 px-2.5 text-sky-300 text-[11px] truncate max-w-[200px]" title={row.rawHex}>
                    {row.rawHex}
                  </td>
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    {row.isDemoData ? (
                      <span className="text-[9px] text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                        SIMULATED
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                        HARDWARE
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
