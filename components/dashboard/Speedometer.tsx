'use client';

import React from 'react';
import { useGpsSpeed } from '@/hooks/use-gps-speed';
import { Navigation, AlertTriangle, Power, PowerOff } from 'lucide-react';

interface SpeedometerProps {
  className?: string;
}

export function Speedometer({ className = '' }: SpeedometerProps) {
  const {
    speed,
    status,
    isTracking,
    statusLabel,
    errorMessage,
    toggleTracking,
  } = useGpsSpeed();

  // Dial scale: 0 to 140 km/h
  const MIN_SPEED = 0;
  const MAX_SPEED = 140;
  const START_ANGLE = -135; // degrees (bottom-left)
  const END_ANGLE = 135; // degrees (bottom-right)
  const TOTAL_ANGLE = END_ANGLE - START_ANGLE; // 270 degrees

  // Needle angle calculation
  const clampedSpeed = speed !== null ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed)) : 0;
  const needleAngle = START_ANGLE + (clampedSpeed / MAX_SPEED) * TOTAL_ANGLE;

  // Major ticks: 0, 20, 40, 60, 80, 100, 120, 140
  const majorTicks = [0, 20, 40, 60, 80, 100, 120, 140];
  // Minor ticks: 10, 30, 50, 70, 90, 110, 130
  const minorTicks = [10, 30, 50, 70, 90, 110, 130];

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Center & Radius for 280x280 SVG viewBox
  const CX = 140;
  const CY = 140;
  const GAUGE_RADIUS = 104;

  return (
    <div
      className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0a0f1d] to-[#070b14] border border-slate-800/90 shadow-2xl backdrop-blur-xl ${className}`}
      role="region"
      aria-label="Motorcycle Speedometer"
    >
      {/* Top Header bar with status indicator */}
      <div className="w-full flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500/90">
            Speedometer
          </span>
          <span className="text-slate-600 text-xs font-mono">·</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                status === 'active'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : status === 'searching'
                  ? 'bg-amber-400 animate-ping'
                  : status === 'denied' || status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-600'
              }`}
            />
            <span className="truncate max-w-[130px] sm:max-w-[160px] font-mono">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* GPS Power / Battery Toggle */}
        <button
          onClick={toggleTracking}
          title={isTracking ? 'Turn off GPS speed tracking to save battery' : 'Enable live GPS speedometer'}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all border ${
            isTracking
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          }`}
          aria-pressed={isTracking}
        >
          {isTracking ? (
            <>
              <Power className="w-3 h-3 text-emerald-400" />
              <span>GPS On</span>
            </>
          ) : (
            <>
              <PowerOff className="w-3 h-3 text-slate-400" />
              <span>Enable GPS</span>
            </>
          )}
        </button>
      </div>

      {/* Speedometer Circular Motorcycle Dial */}
      <div className="relative w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] flex items-center justify-center my-1">
        <svg
          viewBox="0 0 280 280"
          className="w-full h-full select-none"
          role="meter"
          aria-valuenow={speed !== null ? speed : undefined}
          aria-valuemin={0}
          aria-valuemax={140}
          aria-label="Speedometer Gauge"
        >
          {/* Bezel outer metallic rim */}
          <circle
            cx={CX}
            cy={CY}
            r="135"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            className="opacity-70"
          />
          <circle
            cx={CX}
            cy={CY}
            r="131"
            fill="none"
            stroke="#0f172a"
            strokeWidth="4"
          />
          <circle
            cx={CX}
            cy={CY}
            r="126"
            fill="#080c16"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Background Arc Track (270 deg) */}
          <path
            d={describeArc(CX, CY, GAUGE_RADIUS, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Redline zone: 100 to 140 km/h */}
          <path
            d={describeArc(
              CX,
              CY,
              GAUGE_RADIUS,
              START_ANGLE + (100 / MAX_SPEED) * TOTAL_ANGLE,
              END_ANGLE
            )}
            fill="none"
            stroke="rgba(239, 68, 68, 0.35)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Active speed colored arc (only when real speed available) */}
          {speed !== null && speed > 0 && (
            <path
              d={describeArc(CX, CY, GAUGE_RADIUS, START_ANGLE, needleAngle)}
              fill="none"
              stroke="url(#speedGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              className="transition-[d] duration-300 ease-out"
            />
          )}

          {/* Gradient for active arc */}
          <defs>
            <linearGradient id="speedGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Minor Ticks */}
          {minorTicks.map((val) => {
            const angle = START_ANGLE + (val / MAX_SPEED) * TOTAL_ANGLE;
            const p1 = polarToCartesian(CX, CY, GAUGE_RADIUS + 7, angle);
            const p2 = polarToCartesian(CX, CY, GAUGE_RADIUS + 13, angle);
            return (
              <line
                key={`minor-${val}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#475569"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Major Ticks & Speed Numerals */}
          {majorTicks.map((val) => {
            const angle = START_ANGLE + (val / MAX_SPEED) * TOTAL_ANGLE;
            const p1 = polarToCartesian(CX, CY, GAUGE_RADIUS + 4, angle);
            const p2 = polarToCartesian(CX, CY, GAUGE_RADIUS + 16, angle);
            const textPos = polarToCartesian(CX, CY, GAUGE_RADIUS - 18, angle);
            const isRedline = val >= 100;

            return (
              <g key={`major-${val}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isRedline ? '#f87171' : '#94a3b8'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  fill={isRedline ? '#f87171' : '#cbd5e1'}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Classic Motorcycle Needle (pointing cleanly) */}
          <g
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${needleAngle}deg)`,
              transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.4, 1)',
            }}
          >
            {/* Needle body */}
            <path
              d={`M ${CX - 2.5} ${CY} L ${CX} ${CY - GAUGE_RADIUS + 10} L ${CX + 2.5} ${CY} Z`}
              fill="#f59e0b"
              filter="url(#needleGlow)"
            />
            {/* Needle counterweight */}
            <path
              d={`M ${CX - 3} ${CY} L ${CX} ${CY + 18} L ${CX + 3} ${CY} Z`}
              fill="#d97706"
            />
          </g>

          {/* Center Hub Chrome Bezel & Cap */}
          <circle cx={CX} cy={CY} r="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="12" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r="4" fill="#fbbf24" />
        </svg>

        {/* Digital Readout in Dial Lower Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-7 pointer-events-none">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100 font-mono">
            {speed !== null ? speed : '--'}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            km/h
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {speed !== null ? 'Current Speed' : 'Speed unavailable'}
          </span>
        </div>
      </div>

      {/* Footer Info / Error prompt */}
      <div className="w-full text-center mt-1">
        {errorMessage && status !== 'active' ? (
          <p className="text-[11px] text-amber-400/90 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-mono">
            <Navigation className="w-3 h-3 text-slate-400" />
            <span>High-precision hardware telemetry</span>
          </p>
        )}
      </div>
    </div>
  );
}
