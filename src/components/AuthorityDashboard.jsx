import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  Sun, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  Truck,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { fetchAllStationWeather } from '../services/liveWeatherService';

export default function AuthorityDashboard({
  telemetry,
  severity,
  highways = [],
  onToggleHighwayStatus,
  onClose
}) {
  const [evacuatedVillages, setEvacuatedVillages] = useState({});
  const [liveStations, setLiveStations] = useState([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [activeWeatherTab, setActiveWeatherTab] = useState('stations'); // 'stations' | 'models'

  const refreshStationWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchAllStationWeather();
      setLiveStations(data);
    } catch (e) {
      console.error('Failed to load station weather in dashboard:', e);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    refreshStationWeather();
    const interval = setInterval(refreshStationWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEvacuateToggle = (id) => {
    setEvacuatedVillages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Weather forecast columns matching the reference photo
  const weatherForecasts = [
    { label: 'Nowcast', source: 'Live', icon: Cloud, rain: '24 mm', color: 'text-slate-500' },
    { label: 'Rainfall', source: '(IMD API)', icon: CloudRain, rain: '68 mm', color: 'text-sky-500' },
    { label: 'Rainfall', source: '(AWS API)', icon: CloudLightning, rain: '112 mm', color: 'text-amber-500' },
    { label: 'Rainfall', source: '(IGP API)', icon: CloudRain, rain: '54 mm', color: 'text-sky-500' },
    { label: 'Rainfall', source: '(AD API)', icon: Cloud, rain: '32 mm', color: 'text-slate-500' },
    { label: 'Rainfall', source: '(ARF API)', icon: CloudLightning, rain: '88 mm', color: 'text-amber-500' }
  ];

  // Emergency evacuation priorities matching the reference photo
  const priorityEvacuations = [
    { id: 'evac-1', number: 1, title: 'Village X (High Risk) - Evacuate Now', zone: 'Sonapur Ridge', isHigh: true },
    { id: 'evac-2', number: 2, title: 'Village Y (High Risk) - Evacuate Now', zone: 'Bhalukpong Valley', isHigh: true },
    { id: 'evac-3', number: 3, title: 'Village Z (High Risk) - Evacuate Now', zone: 'Haflong Slopes', isHigh: true }
  ];

  return (
    <aside className="w-80 md:w-[350px] xl:w-[390px] h-full flex flex-col bg-slate-50 border-l border-slate-200 text-slate-800 select-none overflow-y-auto z-20 shrink-0 p-3 space-y-3">
      
      {/* =================================================================== */}
      {/* CARD 1: RISK SEVERITY LEVELS (Bar Chart + Donut Chart) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-lg border border-slate-200/90 p-3.5 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Risk Severity Levels
            </h3>
            <p className="text-[10px] text-slate-500">
              Real-time summary of alerts
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-0.5">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Charts Container: Bar Chart on Left + Donut Chart on Right */}
        <div className="grid grid-cols-2 gap-3 pt-2 items-center">
          
          {/* Left: Vertical Bar Chart with % Axis */}
          <div className="flex items-end gap-1.5 h-32 border-b border-l border-slate-200 pb-1 pl-1 relative">
            {/* Axis grid lines */}
            <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-100 text-[8px] font-mono text-slate-400 -translate-y-1/2">
              100%
            </div>
            <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-100 text-[8px] font-mono text-slate-400 -translate-y-1/2">
              75%
            </div>
            <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-slate-100 text-[8px] font-mono text-slate-400 -translate-y-1/2">
              50%
            </div>
            <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-100 text-[8px] font-mono text-slate-400 -translate-y-1/2">
              25%
            </div>

            {/* Low Bar (Green) */}
            <div className="flex-1 flex flex-col items-center h-full justify-end z-10">
              <div 
                className="w-full bg-[#22c55e] rounded-t-sm transition-all duration-700 shadow-sm"
                style={{ height: '30%' }}
                title="Low Risk: 30%"
              ></div>
              <span className="text-[9px] font-medium text-slate-600 mt-1">Low</span>
            </div>

            {/* Medium Bar (Yellow/Amber) */}
            <div className="flex-1 flex flex-col items-center h-full justify-end z-10">
              <div 
                className="w-full bg-[#eab308] rounded-t-sm transition-all duration-700 shadow-sm"
                style={{ height: '70%' }}
                title="Medium Risk: 70%"
              ></div>
              <span className="text-[9px] font-medium text-slate-600 mt-1">Medium</span>
            </div>

            {/* High Bar (Red/Orange) */}
            <div className="flex-1 flex flex-col items-center h-full justify-end z-10">
              <div 
                className="w-full bg-[#ef4444] rounded-t-sm transition-all duration-700 shadow-sm"
                style={{ height: '55%' }}
                title="High Risk: 55%"
              ></div>
              <span className="text-[9px] font-medium text-slate-600 mt-1">High</span>
            </div>

            {/* Critical Bar (Dark Crimson) */}
            <div className="flex-1 flex flex-col items-center h-full justify-end z-10">
              <div 
                className="w-full bg-[#991b1b] rounded-t-sm transition-all duration-700 shadow-sm"
                style={{ height: severity === 'Critical' ? '45%' : '18%' }}
                title={`Critical Risk: ${severity === 'Critical' ? '45%' : '18%'}`}
              ></div>
              <span className="text-[9px] font-medium text-slate-600 mt-1">Critical</span>
            </div>
          </div>

          {/* Right: Pie / Donut Chart with percentage tags (matching photo) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* 1. Low (Green) 30% -> dasharray="30 70", dashoffset="0" */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray="30 70"
                  strokeDashoffset="0"
                />
                {/* 2. Medium (Yellow) 29% -> dasharray="29 71", dashoffset="-30" */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#eab308"
                  strokeWidth="8"
                  strokeDasharray="29 71"
                  strokeDashoffset="-30"
                />
                {/* 3. High (Orange) 26% -> dasharray="26 74", dashoffset="-59" */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="8"
                  strokeDasharray="26 74"
                  strokeDashoffset="-59"
                />
                {/* 4. Critical (Red) 15% -> dasharray="15 85", dashoffset="-85" */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeDasharray="15 85"
                  strokeDashoffset="-85"
                />
              </svg>

              {/* Overlaid percentage tags matching photo */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[9px] font-bold text-slate-700 pointer-events-none">
                <span className="text-emerald-600">30%</span>
                <span className="text-amber-600">29%</span>
              </div>
              <div className="absolute top-1 left-2 text-[8px] font-bold text-red-600">
                10%
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 30%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 29%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600"></span> 10%</span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CARD 2: WEATHER-LINKED RISK FORECASTS (IMD API) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-lg border border-slate-200/90 p-3.5 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Weather & Rainfall Telemetry
              </h3>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-500">
              Live meteorological observations & models
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveWeatherTab(activeWeatherTab === 'stations' ? 'models' : 'stations')}
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
            >
              {activeWeatherTab === 'stations' ? 'View Forecasts' : 'View Stations'}
            </button>
            <button
              onClick={refreshStationWeather}
              disabled={isWeatherLoading}
              title="Refresh live observations"
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {activeWeatherTab === 'stations' ? (
          /* Live Stations Grid */
          <div className="space-y-1.5 pt-1">
            {liveStations && liveStations.length > 0 ? (
              liveStations.slice(0, 4).map((item) => {
                const w = item.weather || {};
                const isHeavy = (w.precipitationRate || 0) > 20;
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white border border-slate-200 text-blue-600">
                        {isHeavy ? <CloudRain className="w-3.5 h-3.5 text-blue-600" /> : <Cloud className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                          {item.name.split('(')[0]}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {w.weatherLabel || 'Monsoon Season'} • {w.humidity || 80}% RH
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-xs">
                        {w.temperature !== undefined ? `${w.temperature}°C` : '--'}
                      </div>
                      <div className={`text-[10px] font-semibold ${isHeavy ? 'text-red-600' : 'text-slate-600'}`}>
                        {w.precipitationRate !== undefined ? `${w.precipitationRate} mm/h` : '0 mm/h'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-[11px] text-slate-400">
                Loading live station observations...
              </div>
            )}
          </div>
        ) : (
          /* 6-Column Forecast Row matching reference */
          <div className="grid grid-cols-6 gap-1 pt-1 text-center">
            {weatherForecasts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="flex flex-col items-center p-1.5 rounded-md bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                >
                  <Icon className={`w-4 h-4 mb-1 ${item.color}`} />
                  <span className="text-[9px] font-semibold text-slate-700 leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono scale-90">
                    {item.source}
                  </span>
                  <span className="text-[9px] font-bold text-slate-800 mt-1">
                    {item.rain}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* CARD 3: ROAD CONNECTIVITY STATUS (Segmented Progress Bars) */}
      {/* =================================================================== */}
      <section className="bg-white rounded-lg border border-slate-200/90 p-3.5 shadow-sm">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Road Connectivity Status
          </h3>
          <p className="text-[10px] text-slate-500">
            Status and live map of higher highways
          </p>
        </div>

        {/* Highway Segmented Rows matching photo */}
        <div className="space-y-2.5 pt-1">
          {/* NH 44 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-800 w-12 shrink-0">
              NH 44
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden flex text-[9px] font-bold text-white leading-5">
              <div 
                style={{ width: '85%' }} 
                className="bg-[#22c55e] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 44: Open 85%"
              >
                Open
              </div>
              <div 
                style={{ width: '15%' }} 
                className="bg-[#dc2626] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 44: Closed 15%"
              >
                Closed
              </div>
            </div>
          </div>

          {/* NH 37 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-800 w-12 shrink-0">
              NH 37
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden flex text-[9px] font-bold text-white leading-5">
              <div 
                style={{ width: '50%' }} 
                className="bg-[#22c55e] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 37: Open 50%"
              >
                Open
              </div>
              <div 
                style={{ width: '35%' }} 
                className="bg-[#f97316] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 37: Partially Blocked 35%"
              >
                Partially Blocked
              </div>
              <div 
                style={{ width: '15%' }} 
                className="bg-[#dc2626] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 37: Closed 15%"
              >
                Closed
              </div>
            </div>
          </div>

          {/* NH 10 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-800 w-12 shrink-0">
              NH 10
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden flex text-[9px] font-bold text-white leading-5">
              <div 
                style={{ width: '100%' }} 
                className="bg-[#22c55e] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 10: Open 100%"
              >
                Open
              </div>
            </div>
          </div>

          {/* NH 57 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-800 w-12 shrink-0">
              NH 57
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden flex text-[9px] font-bold text-white leading-5">
              <div 
                style={{ width: '45%' }} 
                className="bg-[#22c55e] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 57: Open 45%"
              >
                Open
              </div>
              <div 
                style={{ width: '35%' }} 
                className="bg-[#f97316] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 57: Partially Blocked 35%"
              >
                Partially Blocked
              </div>
              <div 
                style={{ width: '20%' }} 
                className="bg-[#dc2626] flex items-center justify-center cursor-pointer hover:opacity-90"
                title="NH 57: Closed 20%"
              >
                Closed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CARD 4: EMERGENCY RESPONSE PRIORITIZATION */}
      {/* =================================================================== */}
      <section className="bg-white rounded-lg border border-slate-200/90 p-3.5 shadow-sm">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Emergency Response Prioritization
          </h3>
          <p className="text-[10px] text-slate-500">
            Top critical locations swift actions
          </p>
        </div>

        {/* Priority items matching photo */}
        <div className="space-y-1.5 pt-1">
          {priorityEvacuations.map((item) => {
            const isExecuted = evacuatedVillages[item.id];

            return (
              <div 
                key={item.id}
                className={`p-2 rounded flex items-center justify-between text-xs transition-colors ${
                  isExecuted 
                    ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                    : item.isHigh 
                    ? 'bg-red-50 text-red-900 border border-red-200/70' 
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold font-mono text-red-600 text-xs">
                    {item.number}
                  </span>
                  <span className={`font-semibold text-[11px] truncate ${isExecuted ? 'line-through text-slate-400' : ''}`}>
                    {item.title}
                  </span>
                </div>

                <button
                  onClick={() => handleEvacuateToggle(item.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all shrink-0 ${
                    isExecuted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isExecuted ? 'Dispatched' : 'Close'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

    </aside>
  );
}
