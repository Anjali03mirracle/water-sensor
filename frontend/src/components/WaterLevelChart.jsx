// frontend/src/components/WaterLevelChart.jsx
import React, { useState } from 'react';
import { LineChart, Activity, AlertCircle } from 'lucide-react';

export default function WaterLevelChart({ history = [], statistics, tankHeight = 5.0 }) {
  const [pointCount, setPointCount] = useState(25);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Chronological order: reverse from history which is newest-first
  const displayData = [...history].slice(0, pointCount).reverse();

  // Tank threshold references
  const highThresholdMeters = tankHeight * 0.85; // 4.25m
  const lowThresholdMeters = tankHeight * 0.20;  // 1.00m

  // Chart coordinates calculation
  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yMax = tankHeight;
  const yMin = 0;

  const getX = (idx) => {
    if (displayData.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (displayData.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + innerHeight - ((clamped - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Build SVG path
  let pathD = '';
  let areaD = '';

  if (displayData.length > 0) {
    const points = displayData.map((d, i) => `${getX(i)},${getY(d.waterLevelMeters)}`);
    pathD = `M ${points.join(' L ')}`;
    areaD = `${pathD} L ${getX(displayData.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;
  }

  const hoveredData = hoverIndex !== null && displayData[hoverIndex] ? displayData[hoverIndex] : null;

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Live Radar Water Level Telemetry
              <span className="text-xs font-normal text-slate-400 font-mono">
                (Tank Height: {tankHeight}m)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time pulsed coherent radar distance inversion curve
            </p>
          </div>
        </div>

        {/* Threshold indicators & Point range selector */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-dashed border-b inline-block" />
              <span>High (85% / {highThresholdMeters}m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-dashed border-b inline-block" />
              <span>Low (20% / {lowThresholdMeters}m)</span>
            </div>
          </div>

          <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-800 text-xs font-medium">
            {[15, 25, 50].map((count) => (
              <button
                key={count}
                onClick={() => setPointCount(count)}
                className={`px-2.5 py-1 rounded transition ${
                  pointCount === count
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {count} pts
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl border border-slate-800/80 p-2">
        {displayData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">
            <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
            Awaiting radar telemetry packets...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[300px] overflow-visible"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="85%" stopColor="#0284c7" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines and Y-axis labels */}
            {[0, 1.25, 2.5, 3.75, 5.0].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {level.toFixed(1)}m
                  </text>
                </g>
              );
            })}

            {/* High Threshold Reference Line */}
            <line
              x1={padding.left}
              y1={getY(highThresholdMeters)}
              x2={width - padding.right}
              y2={getY(highThresholdMeters)}
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />

            {/* Low Threshold Reference Line */}
            <line
              x1={padding.left}
              y1={getY(lowThresholdMeters)}
              x2={width - padding.right}
              y2={getY(lowThresholdMeters)}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />

            {/* Gradient Area */}
            {areaD && <path d={areaD} fill="url(#waterGradient)" />}

            {/* Main Telemetry Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points and Interaction Circles */}
            {displayData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.waterLevelMeters);
              const isHovered = hoverIndex === i;

              return (
                <g key={d.id || i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3}
                    fill={d.status === 'HIGH' ? '#f43f5e' : d.status === 'LOW' ? '#f59e0b' : '#38bdf8'}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                  {/* Invisible larger hit target for smooth hover on mobile/desktop */}
                  <rect
                    x={cx - 10}
                    y={padding.top}
                    width={20}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                </g>
              );
            })}

            {/* Vertical Guide Line on Hover */}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + innerHeight}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredData && (
          <div
            className="absolute top-4 right-4 bg-slate-900/95 border border-cyan-500/50 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono backdrop-blur pointer-events-none"
          >
            <div className="text-cyan-300 font-bold flex items-center justify-between gap-4">
              <span>Water Level:</span>
              <span>{hoveredData.waterLevelMeters.toFixed(3)} m ({hoveredData.waterLevelPercentage}%)</span>
            </div>
            <div className="text-slate-300 flex items-center justify-between gap-4">
              <span>Radar Surface Dist:</span>
              <span>{hoveredData.distanceMeters.toFixed(3)} m</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between gap-4">
              <span>Status:</span>
              <span className={hoveredData.status === 'HIGH' ? 'text-rose-400 font-bold' : hoveredData.status === 'LOW' ? 'text-amber-400' : 'text-emerald-400'}>
                {hoveredData.status}
              </span>
            </div>
            <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
              {new Date(hoveredData.timestamp).toLocaleTimeString()} • {hoveredData.deviceId}
            </div>
          </div>
        )}
      </div>

      {/* Statistical Summary Strip */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="text-slate-400">
            <span>Average Level: </span>
            <strong className="text-slate-200 font-mono">{statistics.averageLevelMeters || 0} m</strong>
          </div>
          <div className="text-slate-400">
            <span>Max Peak Level: </span>
            <strong className="text-slate-200 font-mono">{statistics.maxLevelMeters || 0} m</strong>
          </div>
          <div className="text-slate-400">
            <span>Min Low Level: </span>
            <strong className="text-slate-200 font-mono">{statistics.minLevelMeters || 0} m</strong>
          </div>
          <div className="text-slate-400 text-right">
            <span>Historical Records: </span>
            <strong className="text-cyan-400 font-mono">{statistics.count || 0}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
