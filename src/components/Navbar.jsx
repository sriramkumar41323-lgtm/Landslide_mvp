import { 
  ShieldAlert, 
  RotateCw, 
  Bell, 
  Settings, 
  User, 
  CloudLightning, 
  Wifi, 
  WifiOff, 
  PlusCircle, 
  Radio, 
  Layers,
  Activity,
  UploadCloud,
  Mountain,
  Zap
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export default function Navbar({
  isOfflineSimulated,
  setIsOfflineSimulated,
  isStormSimulated,
  setIsStormSimulated,
  onOpenReportModal,
  pendingSyncCount = 0,
  onTriggerSync,
  isSyncing,
  telemetry,
  severity,
  showRightPanel,
  setShowRightPanel,
  showLeftFeed,
  setShowLeftFeed,
  onOpenAlertLog,
  onOpenSandboxModal
}) {
  return (
    <header className="h-14 bg-[#0a182c] border-b border-slate-700/80 px-4 flex items-center justify-between z-30 shadow-md text-white select-none">
      {/* 1. Left Brand & Platform Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Emblem Insignia */}
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-emerald-800 border border-amber-400 shadow-sm shrink-0">
          <div className="w-4 h-4 rounded-full border border-amber-300 flex items-center justify-center text-[9px] font-bold text-amber-200">
            ★
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xs sm:text-sm lg:text-[14px] font-bold text-slate-100 tracking-wide font-sans whitespace-nowrap">
          North Eastern Region AI-Enabled Early Warning and Monitoring Platform (NER-AI-EWS)
        </h1>
      </div>

      {/* 2. Right Side Controls & Status Badges */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-3">

        {/* AI Sandbox / Jury Simulator Button */}
        <button
          onClick={onOpenSandboxModal}
          title="Open Evaluator Disaster Sandbox & Multi-Hazard Simulator"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-950/50 border border-sky-400/40 transition-all hover:scale-105 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">AI Sandbox</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-sky-950/70 text-amber-300 border border-amber-400/40 font-semibold">Jury</span>
        </button>
        
        {/* Report Hazard Action Button - Clean Attractive Solid Blue */}
        <button
          onClick={onOpenReportModal}
          title="Report Mountain Crack or Climate Image"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report Hazard</span>
          <span className="sm:hidden">Report</span>
        </button>

        {/* Cloud Sync Pending Button */}
        {pendingSyncCount > 0 ? (
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            title={`${pendingSyncCount} offline reports queued. Click to push to PostgreSQL cloud.`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Cloud ({pendingSyncCount})</span>
          </button>
        ) : (
          <div className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cloud Synced</span>
          </div>
        )}

        {/* Badge: Landslide Risk */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#132845] border border-slate-600/80 text-[11px] font-medium text-slate-200">
          <span className={`w-2 h-2 rounded-full ${
            severity === 'Critical' ? 'bg-red-500 animate-ping' : 
            severity === 'Warning' ? 'bg-amber-400' : 'bg-emerald-400'
          }`}></span>
          <span>Risk</span>
          <span className={`font-mono text-[9px] px-1 py-0.2 rounded ${
            severity === 'Critical' ? 'bg-red-900/60 text-red-300' : 'bg-slate-700 text-slate-300'
          }`}>
            {severity}
          </span>
        </div>

        {/* Toggle Button: Control Center Feed */}
        <button
          onClick={() => setShowLeftFeed(!showLeftFeed)}
          title="Toggle Citizen Control Center Feed sidebar"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
            showLeftFeed 
              ? 'bg-emerald-700 text-white border-emerald-500 shadow-sm' 
              : 'bg-[#132845] text-slate-300 hover:text-white border-slate-600/80 hover:border-slate-500'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Feed</span>
        </button>

        {/* Toggle Button: Risk Severity & Forecasts (4 Cards) */}
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          title="Toggle Risk Severity Levels, Weather Forecasts, and Road Status cards"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
            showRightPanel 
              ? 'bg-sky-700 text-white border-sky-500 shadow-sm' 
              : 'bg-[#132845] text-slate-300 hover:text-white border-slate-600/80 hover:border-slate-500'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden sm:inline">Risk & Forecasts</span>
          <span className="sm:hidden">4 Cards</span>
        </button>

        {/* Storm Simulator Quick Trigger */}
        <button
          onClick={() => setIsStormSimulated(!isStormSimulated)}
          title="Simulate cloudburst and extreme landslide triggers"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
            isStormSimulated
              ? 'bg-red-700 text-white border-red-500 animate-pulse shadow-sm'
              : 'bg-[#152a47] text-red-300 hover:bg-[#1c3860] border-red-500/40'
          }`}
        >
          <CloudLightning className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{isStormSimulated ? 'Storm Active' : 'Storm Sim'}</span>
        </button>

        {/* Supabase PostgreSQL Cloud Status Pill */}
        {isSupabaseConfigured ? (
          <span 
            title="Connected to Supabase PostgreSQL cloud database" 
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/40"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud DB</span>
          </span>
        ) : (
          <span 
            title="Using Local Offline demo storage. Add Supabase keys to .env to connect live cloud." 
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-amber-950/70 text-amber-300 border border-amber-500/40"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Local DB</span>
          </span>
        )}

        {/* Hill Offline Mode Trigger - Clean attractive styling */}
        <button
          onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
          title="Toggle online vs offline hill storage syncing"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            isOfflineSimulated
              ? 'bg-amber-900/40 text-amber-200 border-amber-700'
              : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}
        >
          {isOfflineSimulated ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium">Hill Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium">Online</span>
            </>
          )}
        </button>

        {/* Refresh / Manual Sync Icon */}
        <button 
          onClick={onTriggerSync}
          disabled={isSyncing}
          title="Refresh real-time GIS & cloud sync feeds"
          className="p-1.5 rounded hover:bg-[#193254] text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
        </button>

        {/* Notification Bell with Badge Count -> Opens Alert Log */}
        <button 
          onClick={onOpenAlertLog}
          title="Open Landslide SMS & Early Warning Alert Log"
          className="relative p-1.5 rounded hover:bg-[#193254] text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-xs font-semibold text-slate-200">Alerts</span>
          <span className="absolute top-1 right-1 xl:right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>

        {/* Settings */}
        <div className="p-1.5 rounded hover:bg-[#193254] text-slate-300 hover:text-white cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
