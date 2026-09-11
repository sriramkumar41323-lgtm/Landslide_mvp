import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CitizenReportingFeed from './components/CitizenReportingFeed';
import MapView from './components/MapView';
import AuthorityDashboard from './components/AuthorityDashboard';
import FieldReportModal from './components/FieldReportModal';
import StormAlertBanner from './components/StormAlertBanner';
import AlertLogPanel from './components/AlertLogPanel';
import EvaluatorSandboxModal from './components/EvaluatorSandboxModal';
import { CITIZEN_FEED_REPORTS } from './data/citizenReportsData';
import { ARTERIAL_HIGHWAYS } from './data/northEastGISData';
import { 
  calculateSeverity, 
  generateDynamicAlerts, 
  generateEmergencyQueue 
} from './services/telemetryEngine';
import { 
  getAllActiveReports, 
  getPendingLocalReports, 
  savePendingLocalReport, 
  addDirectOnlineReport, 
  syncPendingReports 
} from './services/offlineStorage';
import { 
  insertFieldReport, 
  fetchFieldReports, 
  subscribeToFieldReports,
  fetchLocationRisks,
  subscribeToLocationRisk,
  isSupabaseConfigured
} from './services/supabaseClient';
import { CheckCircle2, X, Zap } from 'lucide-react';

export default function App() {
  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    rainfallMm: 72.4,
    soilSaturation: 68.9,
    aiRiskProbability: 61.5
  });

  // Evaluator AI Sandbox state
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  // Simulator triggers
  const [isStormSimulated, setIsStormSimulated] = useState(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  // Highways state
  const [highways, setHighways] = useState(ARTERIAL_HIGHWAYS);

  // Field hazards reports & queue state
  const [hazardReports, setHazardReports] = useState(CITIZEN_FEED_REPORTS);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState(null);

  // Selected report for map fly-to
  const [selectedReport, setSelectedReport] = useState(null);

  // Modal and coordinate selection state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState(null);

  // Supabase location_risk & alert log panel state
  const [locationRisks, setLocationRisks] = useState([]);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);

  // Mobile tab switcher ('feed' | 'map' | 'dashboard')
  const [mobileTab, setMobileTab] = useState('map');
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Load initial reports while keeping curated visual reports
  const refreshReportList = useCallback(() => {
    const active = getAllActiveReports();
    const pending = getPendingLocalReports();
    // Prepend any new user-submitted reports to the curated feed
    const userSubmitted = active.filter(a => !CITIZEN_FEED_REPORTS.some(c => c.id === a.id));
    setHazardReports([...userSubmitted, ...CITIZEN_FEED_REPORTS]);
    setPendingSyncCount(pending.length);
  }, []);

  // Fetch reports directly from Supabase PostgreSQL & listen in realtime
  useEffect(() => {
    refreshReportList();

    // Fetch latest reports from Supabase cloud
    if (isSupabaseConfigured) {
      fetchFieldReports().then(({ data }) => {
        if (data && data.length > 0) {
          const remoteReports = data.map(r => ({
            ...r,
            image_data: r.image_data,
            image: r.image_data,
            sync_status: 'synced'
          }));
          setHazardReports(prev => {
            const remoteIds = new Set(remoteReports.map(r => r.id));
            const remaining = prev.filter(r => !remoteIds.has(r.id));
            return [...remoteReports, ...remaining];
          });
        }
      });

      // Realtime listener: triggers instantly when phone submits a report
      const unsubscribe = subscribeToFieldReports((newReport) => {
        const formatted = {
          ...newReport,
          image_data: newReport.image_data,
          image: newReport.image_data,
          sync_status: 'synced'
        };
        setHazardReports(prev => [formatted, ...prev.filter(r => r.id !== formatted.id)]);
        setSyncToastMsg(`⚡ Realtime Sync: New report received from field device!`);
        setTimeout(() => setSyncToastMsg(null), 4000);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [refreshReportList]);

  // Fetch & listen to dynamic location_risk from Supabase & FastAPI
  useEffect(() => {
    fetchLocationRisks().then(({ data }) => {
      if (data && data.length > 0) {
        setLocationRisks(data);
      }
    });

    const unsubscribe = subscribeToLocationRisk((updatedRisk) => {
      setLocationRisks(prev => {
        const exists = prev.some(p => p.location_name === updatedRisk.location_name);
        if (exists) {
          return prev.map(p => p.location_name === updatedRisk.location_name ? updatedRisk : p);
        }
        return [updatedRisk, ...prev];
      });
      setSyncToastMsg(`⚡ Realtime Hazard Update: ${updatedRisk.location_name} is at ${updatedRisk.risk_level} Risk`);
      setTimeout(() => setSyncToastMsg(null), 4000);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync Pending Offline Reports to PostgreSQL Cloud
  const handleTriggerSync = useCallback(async () => {
    if (isOfflineSimulated || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingReports();
      refreshReportList();
      if (result.syncedCount > 0) {
        setSyncToastMsg(`☁️ Successfully synced ${result.syncedCount} hill hazard report(s) to PostgreSQL cloud!`);
        setTimeout(() => setSyncToastMsg(null), 4000);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOfflineSimulated, isSyncing, refreshReportList]);

  // Automatic Network Reconnection Listener
  useEffect(() => {
    const handleOnline = () => {
      console.log('[BhujanRakshak] Internet connection detected. Triggering auto-sync...');
      if (!isOfflineSimulated) {
        handleTriggerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineSimulated, handleTriggerSync]);

  // When simulated offline mode is turned off, trigger cloud sync if there are pending reports
  useEffect(() => {
    if (!isOfflineSimulated) {
      const pending = getPendingLocalReports();
      if (pending.length > 0) {
        handleTriggerSync();
      }
    }
  }, [isOfflineSimulated, handleTriggerSync]);

  // Storm Simulator Trigger
  useEffect(() => {
    if (isStormSimulated) {
      setTelemetry({
        rainfallMm: 194.8,
        soilSaturation: 97.4,
        aiRiskProbability: 95.2
      });
    } else {
      setTelemetry({
        rainfallMm: 68.5,
        soilSaturation: 64.2,
        aiRiskProbability: 54.8
      });
    }
  }, [isStormSimulated]);

  // Dynamic Telemetry Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        if (isStormSimulated) {
          const rainVariation = (Math.random() - 0.5) * 6;
          const satVariation = (Math.random() - 0.5) * 1.5;
          const riskVariation = (Math.random() - 0.5) * 2;
          return {
            rainfallMm: Math.min(240, Math.max(165, prev.rainfallMm + rainVariation)),
            soilSaturation: Math.min(99.8, Math.max(92, prev.soilSaturation + satVariation)),
            aiRiskProbability: Math.min(99.4, Math.max(88, prev.aiRiskProbability + riskVariation))
          };
        } else {
          const rainDelta = (Math.random() - 0.48) * 3;
          const satDelta = (Math.random() - 0.48) * 1.5;
          const newRain = Math.min(130, Math.max(25, prev.rainfallMm + rainDelta));
          const newSat = Math.min(88, Math.max(35, prev.soilSaturation + satDelta));
          const newRisk = Math.min(95, Math.max(15, (newRain * 0.4) + (newSat * 0.45) + (Math.random() * 6)));

          return {
            rainfallMm: newRain,
            soilSaturation: newSat,
            aiRiskProbability: newRisk
          };
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isStormSimulated]);

  const severity = calculateSeverity(telemetry.aiRiskProbability);

  // Submit report handler
  const handleSubmitReport = async (reportData) => {
    if (isOfflineSimulated) {
      const savedLocal = savePendingLocalReport(reportData);
      refreshReportList();
      return savedLocal;
    } else {
      const { data } = await insertFieldReport(reportData);
      const activeReport = addDirectOnlineReport(data || reportData);
      refreshReportList();
      return activeReport;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070e17] text-slate-900 overflow-hidden font-sans">
      
      {/* 1. Command Center Top Header */}
      <Navbar
        isOfflineSimulated={isOfflineSimulated}
        setIsOfflineSimulated={setIsOfflineSimulated}
        isStormSimulated={isStormSimulated}
        setIsStormSimulated={setIsStormSimulated}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        telemetry={telemetry}
        severity={severity}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        onOpenAlertLog={() => setIsAlertPanelOpen(true)}
        onOpenSandboxModal={() => setIsSandboxModalOpen(true)}
      />

      {/* 2. Storm Emergency Alert Banner (when storm active) */}
      <StormAlertBanner
        isStormSimulated={isStormSimulated}
        onDeactivateStorm={() => setIsStormSimulated(false)}
        rainfallMm={telemetry.rainfallMm}
        riskProbability={telemetry.aiRiskProbability}
      />

      {/* 3. Sync Toast Alert */}
      {syncToastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg border-b border-emerald-500 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{syncToastMsg}</span>
          </div>
          <button onClick={() => setSyncToastMsg(null)} className="text-white hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Mobile View Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white text-xs font-semibold">
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-2 text-center ${mobileTab === 'feed' ? 'bg-slate-100 text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'}`}
        >
          Citizen Feed ({hazardReports.length})
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-center ${mobileTab === 'map' ? 'bg-slate-100 text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'}`}
        >
          GIS Risk Map
        </button>
        <button
          onClick={() => setMobileTab('dashboard')}
          className={`flex-1 py-2 text-center ${mobileTab === 'dashboard' ? 'bg-slate-100 text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'}`}
        >
          Risk & Forecasts
        </button>
      </div>

      {/* 5. Full 3-Column Command Center Display Layout */}
      <main className="flex-1 relative flex overflow-hidden bg-slate-100">
        
        {/* COLUMN 1: Citizen Field Reporting Feed (Left) */}
        <div className={`${mobileTab === 'feed' ? 'flex' : 'hidden lg:flex'} h-full shrink-0`}>
          <CitizenReportingFeed
            reports={hazardReports}
            selectedReportId={selectedReport?.id}
            onSelectReport={(rep) => setSelectedReport(rep)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        </div>

        {/* COLUMN 2: Center Interactive GIS Map with Heatmap & Geo-markers */}
        <div className={`flex-1 relative h-full ${mobileTab === 'map' ? 'block' : mobileTab === 'dashboard' ? 'hidden lg:block' : 'hidden md:block'}`}>
          <MapView
            hazardReports={hazardReports}
            selectedReport={selectedReport}
            selectedCoord={selectedCoord}
            onMapCoordinatePick={(coord) => setSelectedCoord(coord)}
            locationRisks={locationRisks}
          />

          {/* Floating Button to Re-open Risk & Forecasts panel if closed */}
          {!showRightPanel && (
            <button
              onClick={() => setShowRightPanel(true)}
              className="absolute top-14 right-3 z-20 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-md hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Open Risk & Forecasts (4 Cards)</span>
            </button>
          )}

          {/* Floating Button for Evaluator Sandbox / Jury Simulator */}
          <button
            onClick={() => setIsSandboxModalOpen(true)}
            title="Open Evaluator Disaster Sandbox & Multi-Hazard Simulator"
            className="absolute bottom-4 right-44 sm:right-48 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-sky-600 hover:to-indigo-600 text-white border border-sky-400/50 shadow-xl text-xs font-bold cursor-pointer transition-all hover:scale-105"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI Disaster Sandbox</span>
          </button>

          {/* Floating Button for Quick Emergency Alert Log Access */}
          <button
            onClick={() => setIsAlertPanelOpen(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white border border-slate-700 shadow-xl text-xs font-bold cursor-pointer transition-all hover:scale-105"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span>Emergency Alert Log</span>
          </button>

          {/* Selected Report Inspection Overlay Card on Map */}
          {selectedReport && (
            <div className="absolute bottom-4 left-4 z-20 max-w-sm bg-white/95 backdrop-blur-md rounded-lg p-3 border border-slate-300 shadow-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                  selectedReport.report_type === 'climate_weather' ? 'bg-sky-600' : 'bg-amber-600'
                }`}>
                  {selectedReport.report_type === 'climate_weather' ? '⛈ Climate Event' : '▲ Mountain Crack'}
                </span>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-0.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="font-bold text-slate-900 truncate">
                {selectedReport.location || selectedReport.location_name}
              </div>
              <p className="text-slate-600 text-[11px] line-clamp-2">
                {selectedReport.description}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>GPS: {selectedReport.latitude}, {selectedReport.longitude}</span>
                <span className={selectedReport.sync_status === 'pending' ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {selectedReport.sync_status === 'pending' ? 'Pending Cloud Sync' : 'PostgreSQL Synced'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: Right Operations & Analytics 4 Cards */}
        {showRightPanel && (
          <div className={`${mobileTab === 'dashboard' ? 'flex' : 'hidden lg:flex'} h-full shrink-0`}>
            <AuthorityDashboard
              telemetry={telemetry}
              severity={severity}
              highways={highways}
              onToggleHighwayStatus={() => {}}
              onClose={() => setShowRightPanel(false)}
            />
          </div>
        )}
      </main>

      {/* 6. Citizen Field Reporting Modal */}
      <FieldReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
        isOffline={isOfflineSimulated}
        selectedCoord={selectedCoord}
        onClearSelectedCoord={() => setSelectedCoord(null)}
      />

      {/* 7. Emergency Alert Log Slide-Over Panel */}
      <AlertLogPanel
        isOpen={isAlertPanelOpen}
        onClose={() => setIsAlertPanelOpen(false)}
        monitoredLocations={locationRisks}
      />

      {/* 8. Evaluator AI Disaster Sandbox & Simulator Modal */}
      <EvaluatorSandboxModal
        isOpen={isSandboxModalOpen}
        onClose={() => setIsSandboxModalOpen(false)}
      />
    </div>
  );
}
