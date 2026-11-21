// frontend/src/components/ElasticsearchPanel.jsx
import React, { useState, useEffect } from 'react';
import { Database, Search, HardDrive, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function ElasticsearchPanel({ esState, onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [storageSource, setStorageSource] = useState('LOCAL_FALLBACK_MEMORY');
  const [isLoading, setIsLoading] = useState(false);

  const isAvailable = esState?.isAvailable;
  const nodeUrl = esState?.nodeUrl || 'http://localhost:9200';
  const indexName = esState?.indexName || 'iot-telemetry-water-level';
  const indexedCount = esState?.indexedCount ?? 0;

  const performSearch = async (query = searchQuery) => {
    try {
      setIsLoading(true);
      const res = await onSearch(query, 10);
      if (res?.data) {
        setRecords(res.data.records || []);
        setTotalCount(res.data.total || 0);
        setStorageSource(res.data.source || 'LOCAL_FALLBACK_MEMORY');
      }
    } catch (err) {
      console.error('ES search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch('');
  }, [esState?.indexedCount]);

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Elasticsearch Telemetry Storage
              <span className={`badge ${isAvailable ? 'badge-normal' : 'badge-low'}`}>
                {isAvailable ? 'CLUSTER ACTIVE' : 'LOCAL FALLBACK ACTIVE'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-throughput time-series telemetry indexing & full-text query engine
            </p>
          </div>
        </div>

        {/* Index details pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Index:</span>
          <span className="text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {indexName}
          </span>
        </div>
      </div>

      {/* Cluster Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Storage Target Node</span>
          <span className="text-cyan-400 font-bold">{nodeUrl}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Total Telemetry Indexed</span>
          <span className="text-white font-bold text-sm">{indexedCount} records</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Active Engine Mode</span>
          <span className={isAvailable ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isAvailable ? 'ELASTICSEARCH 8.x CLUSTER' : 'RESILIENT MEMORY BUFFER'}
          </span>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            placeholder="Search telemetry by Device ID, status (HIGH/NORMAL), or keywords..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
        <button
          onClick={() => performSearch()}
          disabled={isLoading}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          Query
        </button>
      </div>

      {/* Records Table Preview */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Timestamp</th>
              <th className="py-2 px-3">Device ID</th>
              <th className="py-2 px-3">Water Level (m)</th>
              <th className="py-2 px-3">Radar Dist (m)</th>
              <th className="py-2 px-3">Level Status</th>
              <th className="py-2 px-3">Battery</th>
              <th className="py-2 px-3">Storage Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500 text-xs">
                  No indexed records match the search criteria.
                </td>
              </tr>
            ) : (
              records.map((rec, i) => (
                <tr key={rec._id || rec.id || i} className="hover:bg-slate-900/50 transition">
                  <td className="py-1.5 px-3 text-slate-400">
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-1.5 px-3 text-cyan-300 font-bold">{rec.deviceId}</td>
                  <td className="py-1.5 px-3 text-white font-bold">
                    {rec.waterLevelMeters?.toFixed(2)} m ({rec.waterLevelPercentage}%)
                  </td>
                  <td className="py-1.5 px-3 text-slate-300">{rec.distanceMeters?.toFixed(3)} m</td>
                  <td className="py-1.5 px-3">
                    <span className={rec.status === 'HIGH' ? 'text-rose-400 font-bold' : rec.status === 'LOW' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-400">{rec.batteryPercentage}%</td>
                  <td className="py-1.5 px-3 text-[10px] text-slate-500">{storageSource}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
