import React from 'react';
import { CloudLightning, AlertOctagon, XCircle, ShieldAlert } from 'lucide-react';

export default function StormAlertBanner({
  isStormSimulated,
  onDeactivateStorm,
  rainfallMm,
  riskProbability
}) {
  if (!isStormSimulated) return null;

  return (
    <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-800 text-white px-4 py-2 border-b-2 border-red-400 shadow-2xl flex items-center justify-between z-40 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded bg-black/30 border border-white/40">
          <CloudLightning className="w-5 h-5 text-yellow-300 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-black/50 text-yellow-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-400">
              SIMULATION ACTIVE
            </span>
            <span className="font-extrabold text-sm tracking-wide uppercase font-mono">
              Extreme Orographic Storm & Cloudburst In Progress
            </span>
          </div>
          <p className="text-xs text-red-100 hidden sm:block">
            Precipitation: <span className="font-bold text-yellow-200">{rainfallMm.toFixed(1)} mm/h</span> • 
            AI Failure Probability: <span className="font-bold text-yellow-200">{riskProbability.toFixed(1)}%</span> • 
            Status: <span className="underline font-bold">NH-6 Severed at Sonapur</span> • Evacuation protocols initiated.
          </p>
        </div>
      </div>

      <button
        onClick={onDeactivateStorm}
        className="px-3 py-1 rounded bg-black/60 hover:bg-black/80 text-xs font-mono text-white border border-white/30 transition-all shrink-0 flex items-center gap-1.5"
      >
        <XCircle className="w-3.5 h-3.5 text-red-300" />
        <span>End Simulation</span>
      </button>
    </div>
  );
}
