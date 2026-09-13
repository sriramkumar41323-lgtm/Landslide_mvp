import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  Sun, 
  Droplets, 
  Wind, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  AlertCircle,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { MONITORED_STATIONS, fetchLiveWeather } from '../services/liveWeatherService';

export default function TelemetryHUD({ 
  telemetry, 
  severity, 
  isStormSimulated,
  onStationChange,
  className = "absolute top-14 left-3 z-20 pointer-events-auto"
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(MONITORED_STATIONS[0].id);
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedStation = MONITORED_STATIONS.find(s => s.id === selectedStationId) || MONITORED_STATIONS[0];

  // Fetch live weather data when selected station changes or when manually refreshed
  const loadWeatherData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveWeather(selectedStation.latitude, selectedStation.longitude);
      setLiveWeather(data);
      if (onStationChange) {
        onStationChange(selectedStation, data);
      }
    } catch (err) {
      console.error('Failed to update live weather:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedStationId]);

  // Weather icon selector
  const renderWeatherIcon = (category) => {
    switch (category) {
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-amber-600" />;
      case 'heavy_rain':
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-600" />;
      case 'drizzle':
      case 'cloudy':
      case 'fog':
        return <Cloud className="w-5 h-5 text-slate-500" />;
      case 'clear':
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  // Merge simulated storm if active
  const currentRainfall = isStormSimulated 
    ? Math.max(telemetry?.rainfallMm || 0, 115.0) 
    : (liveWeather?.precipitationRate !== undefined ? liveWeather.precipitationRate : (telemetry?.rainfallMm || 24.0));

  const currentSoilMoisture = isStormSimulated 
    ? 91.5 
    : (liveWeather?.soilSaturation !== undefined ? liveWeather.soilSaturation : (telemetry?.soilSaturation || 65.0));

  const currentTemp = liveWeather?.temperature !== undefined ? liveWeather.temperature : 23.8;
  const currentHumidity = liveWeather?.humidity !== undefined ? liveWeather.humidity : 86;
  const currentWeatherLabel = isStormSimulated ? 'Torrential Cloudburst' : (liveWeather?.weatherLabel || 'Monsoon Overcast');
  const currentWeatherCategory = isStormSimulated ? 'thunderstorm' : (liveWeather?.weatherCategory || 'rain');

  // Compute clean risk level based on live parameters
  const isHighRisk = isStormSimulated || currentRainfall > 80 || currentSoilMoisture > 82;
  const isModerateRisk = !isHighRisk && (currentRainfall > 35 || currentSoilMoisture > 65);

  return (
    <div className={className}>
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-3.5 w-72 md:w-80 text-slate-800 transition-all">
        
        {/* Header: Station & Live Status */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
              Live Station Telemetry
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={loadWeatherData}
              disabled={isLoading}
              title="Refresh live data"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              title={isMinimized ? "Expand HUD" : "Minimize HUD"}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Station Selector Dropdown */}
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none w-full cursor-pointer"
            >
              {MONITORED_STATIONS.map((station) => (
                <option key={station.id} value={station.id} className="text-slate-800">
                  {station.name} ({station.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isMinimized && (
          <div className="space-y-2.5">
            
            {/* Card A: Real-Time Weather & Temperature */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
                    {renderWeatherIcon(currentWeatherCategory)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {currentTemp}°C
                    </div>
                    <div className="text-[11px] font-medium text-slate-600">
                      {currentWeatherLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex items-center justify-end gap-1 font-medium text-slate-600">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{currentHumidity}%</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Wind className="w-3 h-3 text-slate-400" />
                    <span>{liveWeather?.windSpeed || 12} km/h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Live Rainfall & Cumulative 24h */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-slate-500 text-[11px] mb-1">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  Precipitation Rate
                </span>
                <span className="text-[10px] text-slate-400">IMD / AWS Grid</span>
              </div>
              
              <div className="flex justify-between items-baseline mb-1.5">
                <div className="text-base font-bold text-slate-900">
                  {currentRainfall.toFixed(1)} <span className="text-xs font-normal text-slate-500">mm/h</span>
                </div>
                <div className="text-xs font-medium text-slate-600">
                  24h Total: <span className="font-bold text-slate-800">{liveWeather?.cumulative24h ? liveWeather.cumulative24h.toFixed(1) : (currentRainfall * 5.2).toFixed(1)} mm</span>
                </div>
              </div>

              {/* Clean progress bar for rainfall */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentRainfall > 70 ? 'bg-red-500' : currentRainfall > 30 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentRainfall / 100) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Card C: Soil Moisture Saturation */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-slate-500 text-[11px] mb-1">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Pore Saturation
                </span>
                <span className="text-[10px] text-slate-400">Piezometer Probe</span>
              </div>

              <div className="flex justify-between items-baseline mb-1.5">
                <div className="text-base font-bold text-slate-900">
                  {currentSoilMoisture.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentSoilMoisture > 82 ? 'Overpressure Hazard' : 'Moderate Infiltration'}
                </div>
              </div>

              {/* Clean progress bar for soil moisture */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentSoilMoisture > 82 ? 'bg-red-500' : currentSoilMoisture > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, currentSoilMoisture)}%` }}
                ></div>
              </div>
            </div>

            {/* Card D: AI Hazard Status */}
            <div className={`p-2.5 rounded-lg border ${
              isHighRisk 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : isModerateRisk 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {isHighRisk ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="text-xs font-bold">
                    {isHighRisk ? 'Critical Hazard Level' : isModerateRisk ? 'Elevated Watch' : 'Low Hazard (Stable)'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isHighRisk 
                    ? 'bg-red-600 text-white' 
                    : isModerateRisk 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isHighRisk ? 'HIGH RISK' : isModerateRisk ? 'MODERATE' : 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Footer timestamp */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5 px-0.5">
              <span>Station elev: {selectedStation.elevation}m</span>
              <span>Updated: {liveWeather?.updatedAt || 'Live'}</span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
