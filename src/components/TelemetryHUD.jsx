import React, { useState } from 'react';
import { Radio, Droplets, CloudRain, Cpu, ChevronUp, ChevronDown, Activity } from 'lucide-react';

export default function TelemetryHUD({ telemetry, severity, isStormSimulated }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-auto">
      <div className="bg-command-900/90 backdrop-blur-md rounded-xl border border-cyan-500/40 shadow-2xl p-3 w-64 md:w-72 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-command-700/60">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Live Sensor HUD
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="space-y-2.5 text-xs font-mono">
            {/* Metric A: Rainfall */}
            <div className="bg-command-950/70 p-2 rounded-lg border border-command-800">
              <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1">
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-cyan-400" />
                  Precipitation
                </span>
                <span className="text-[10px] text-cyan-400">AWS-NE Network</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`text-base font-bold ${
                  telemetry.rainfallMm > 120 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
                }`}>
                  {telemetry.rainfallMm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm/h</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  24h: {(telemetry.rainfallMm * 6.2).toFixed(0)} mm
                </span>
              </div>
            </div>

            {/* Metric B: Soil Saturation */}
            <div className="bg-command-950/70 p-2 rounded-lg border border-command-800">
              <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-amber-400" />
                  Pore Saturation
                </span>
                <span className="text-[10px] text-amber-400">Piezometer Bank</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`text-base font-bold ${
                  telemetry.soilSaturation > 85 ? 'text-red-400' : 'text-amber-300'
                }`}>
                  {telemetry.soilSaturation.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {telemetry.soilSaturation > 85 ? 'Pore Overpressure' : 'Moderate Infiltration'}
                </span>
              </div>
            </div>

            {/* Metric C: AI Risk Index */}
            <div className={`p-2 rounded-lg border ${
              severity === 'Critical' 
                ? 'bg-red-950/40 border-red-500/50 shadow-neon-red' 
                : severity === 'Warning' 
                ? 'bg-amber-950/30 border-amber-500/40' 
                : 'bg-command-950/70 border-command-800'
            }`}>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  AI Failure Risk
                </span>
                <span className={`font-bold px-1 py-0.2 rounded text-[9px] ${
                  severity === 'Critical' ? 'bg-red-500 text-white' :
                  severity === 'Warning' ? 'bg-amber-500 text-black' :
                  'bg-emerald-500 text-white'
                }`}>
                  {severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`text-lg font-bold font-mono ${
                  severity === 'Critical' ? 'text-red-400' :
                  severity === 'Warning' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {telemetry.aiRiskProbability.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">
                  Cycle: Every 5s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
