import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Polygon,
  Circle,
  Tooltip,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Plus, 
  Minus, 
  Layers, 
  Maximize2, 
  Crosshair, 
  Settings, 
  Compass, 
  X, 
  ChevronDown, 
  Radio, 
  Activity, 
  Droplets,
  CloudRain,
  MapPin,
  Camera,
  Flame,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { 
  BRAHMAPUTRA_RIVER, 
  HIGH_RISK_HEAT_SPOTS,
  RISK_HEATMAP_CONTOURS,
  NE_STATE_LABELS,
  MONITORED_VILLAGES, 
  WEATHER_STATIONS, 
  SOIL_MOISTURE_SENSORS, 
  ARTERIAL_HIGHWAYS 
} from '../data/northEastGISData';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Google Maps Tile Configurations with 100% English Labels ('hl=en')
const GOOGLE_BASEMAPS = {
  roadmap: {
    id: 'roadmap',
    name: 'Map',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=en',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  }
};

// Helper component to fly the map when selected target coordinates change
function MapFlyController({ targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord) {
      map.flyTo([targetCoord.latitude || targetCoord.lat, targetCoord.longitude || targetCoord.lng], 11, {
        duration: 1.5
      });
    }
  }, [targetCoord, map]);
  return null;
}

// Controller for custom zoom and recenter actions
function MapToolbarActions({ onZoomIn, onZoomOut, onRecenter }) {
  const map = useMap();
  useEffect(() => {
    if (onZoomIn) onZoomIn.current = () => map.zoomIn();
    if (onZoomOut) onZoomOut.current = () => map.zoomOut();
    if (onRecenter) onRecenter.current = () => map.flyTo([26.15, 92.8], 7.2, { duration: 1.2 });
  }, [map, onZoomIn, onZoomOut, onRecenter]);
  return null;
}

// Dedicated Leaflet Pane for organic, smooth continuous heatmap rasterization
function HeatmapPaneController() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('heatmapBlurPane')) {
      const pane = map.createPane('heatmapBlurPane');
      pane.style.zIndex = '340';
      pane.style.filter = 'blur(8px)';
      pane.style.opacity = '0.92';
      pane.style.pointerEvents = 'none';
    }
  }, [map]);
  return null;
}

// GIS State / Territorial Label Creator matching reference geological imagery
function createStateLabelIcon(label) {
  return L.divIcon({
    className: 'gis-state-label',
    html: `
      <div style="
        font-family: 'Inter', sans-serif;
        font-weight: 800;
        font-size: ${label.isNeighbor ? '12px' : '14px'};
        letter-spacing: 0.14em;
        color: ${label.color || '#0f172a'};
        text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, 0 1px 3px rgba(0,0,0,0.5);
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        text-transform: uppercase;
        opacity: 0.95;
      ">
        ${label.name}
      </div>
    `,
    iconSize: [140, 24],
    iconAnchor: [70, 12]
  });
}

// Custom Leaflet DivIcon Creators
function createVillageIcon(risk) {
  const color = risk === 'High' ? '#dc2626' : risk === 'Medium' ? '#f97316' : '#22c55e';
  return L.divIcon({
    className: 'custom-village-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;">
        ${risk === 'High' ? `<div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function createWeatherStationIcon() {
  return L.divIcon({
    className: 'custom-weather-icon',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #0284c7; border: 2px solid white; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
          <path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function createSoilMoistureIcon() {
  return L.divIcon({
    className: 'custom-soil-icon',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #0d9488; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function createHazardPinIcon(report) {
  const severity = typeof report === 'string' ? report : (report?.severity || 'Warning');
  const reportType = report?.report_type || (report?.crackWidth || report?.crack_width_cm ? 'mountain_crack' : 'climate_weather');
  const isPending = report?.sync_status === 'pending';
  const isCritical = severity === 'Critical';

  // Red for Critical & Mountain Cracks, Amber for Warning, Vibrant Sky for Climate
  let color = isCritical ? '#dc2626' : (reportType === 'mountain_crack' ? '#ea580c' : '#0284c7');
  let glyph = reportType === 'mountain_crack' ? '▲' : '⛈';

  return L.divIcon({
    className: 'custom-hazard-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 34px; height: 42px;">
        <!-- Glowing Red Radar Ping Beacon for Immediate Citizen Warning Visibility -->
        <div style="position: absolute; top: -4px; width: 34px; height: 34px; border-radius: 50%; background-color: ${isCritical ? 'rgba(220, 38, 38, 0.6)' : 'rgba(234, 88, 12, 0.45)'}; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Main Teardrop Warning Marker Pin -->
        <div style="width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: ${color}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2;">
          <div style="transform: rotate(45deg); color: #ffffff; font-weight: 900; font-size: 12px; line-height: 1;">${glyph}</div>
        </div>
        
        <!-- Mini Status Pill: Sync or Live -->
        <div style="position: absolute; bottom: 0; background: ${isPending ? '#b45309' : '#047857'}; color: #ffffff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; z-index: 3; box-shadow: 0 1px 3px rgba(0,0,0,0.3); letter-spacing: 0.05em;">
          ${isPending ? 'OFFLINE' : 'LIVE'}
        </div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36]
  });
}

// Click handler for picking coordinates
function MapEventsHandler({ onSelectCoordinates }) {
  useMapEvents({
    click(e) {
      if (onSelectCoordinates) {
        onSelectCoordinates({
          lat: Number(e.latlng.lat.toFixed(4)),
          lng: Number(e.latlng.lng.toFixed(4))
        });
      }
    }
  });
  return null;
}

export default function MapView({
  hazardReports = [],
  selectedReport,
  onMapCoordinatePick,
  selectedCoord,
  locationRisks = []
}) {
  const NE_INDIA_CENTER = [26.15, 92.8];
  const DEFAULT_ZOOM = 7.2;

  // Google Maps Style State (Roadmap default, with 100% English labels)
  const [currentBasemap, setCurrentBasemap] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'

  // Layer Toggles matching the top filter pills
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(true);
  const [showWeatherStations, setShowWeatherStations] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('Eng');
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);

  // Map action refs for zoom and recenter
  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const recenterRef = useRef(null);

  const activeMapConfig = GOOGLE_BASEMAPS[currentBasemap] || GOOGLE_BASEMAPS.roadmap;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#e5e3df] overflow-hidden select-none">
      
      {/* 1. Map Top Filter Bar: Risk Severity Pill & Weather Station Dropdown */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        
        {/* Google Maps Layer Switcher (Map | Satellite | Terrain) */}
        <div className="flex rounded-md bg-white border border-slate-300 shadow-md overflow-hidden text-xs font-semibold text-slate-700">
          <button
            onClick={() => setCurrentBasemap('roadmap')}
            className={`px-2.5 py-1.5 transition-colors ${
              currentBasemap === 'roadmap' ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setCurrentBasemap('terrain')}
            className={`px-2.5 py-1.5 transition-colors border-l border-slate-200 ${
              currentBasemap === 'terrain' ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            Terrain
          </button>
          <button
            onClick={() => setCurrentBasemap('satellite')}
            className={`px-2.5 py-1.5 transition-colors border-l border-slate-200 ${
              currentBasemap === 'satellite' ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Pill 1: Landslide Risk Severity (Toggle Heatmaps) */}
        {showRiskHeatmap ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>Landslide risk severity</span>
            <button 
              onClick={() => setShowRiskHeatmap(false)}
              className="ml-1 text-slate-400 hover:text-slate-700 transition-colors"
              title="Hide heat maps"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowRiskHeatmap(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50"
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Show Heat Maps</span>
          </button>
        )}

        {/* Pill 2: Weather station Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-md hover:bg-slate-50"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span>Weather station</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>

          {isStationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-md shadow-xl border border-slate-200 py-1 text-xs z-30">
              <label className="flex items-center px-3 py-1.5 hover:bg-slate-50 cursor-pointer font-medium text-slate-800">
                <input 
                  type="checkbox" 
                  checked={showWeatherStations} 
                  onChange={(e) => setShowWeatherStations(e.target.checked)} 
                  className="rounded text-sky-600 mr-2"
                />
                Show IMD Weather Nodes
              </label>
              <div className="border-t border-slate-100 my-1"></div>
              {WEATHER_STATIONS.map(st => (
                <div key={st.id} className="px-3 py-1 text-slate-600 truncate text-[11px] flex justify-between">
                  <span>• {st.name.replace(' Doppler Station', '').replace(' Central Observatory', '')}</span>
                  <strong className="text-sky-700">{st.rainfall} mm</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Google Maps Style Zoom and Control Buttons */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white border border-slate-300 rounded-md p-1 shadow-md pointer-events-auto">
        <button 
          title="Zoom In" 
          onClick={() => zoomInRef.current && zoomInRef.current()} 
          className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          title="Zoom Out" 
          onClick={() => zoomOutRef.current && zoomOutRef.current()} 
          className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 mx-0.5"></div>
        <button 
          title="Toggle High-Risk Heat Maps" 
          onClick={() => setShowRiskHeatmap(!showRiskHeatmap)}
          className={`p-1 rounded transition-colors ${showRiskHeatmap ? 'text-red-600 bg-red-50' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          <Flame className="w-4 h-4" />
        </button>
        <button 
          title="Fullscreen" 
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button 
          title="Recenter to North East India" 
          onClick={() => recenterRef.current && recenterRef.current()}
          className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Main Leaflet Map Canvas with Google Maps Tiles (English Labels) */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={NE_INDIA_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={5}
          maxZoom={19}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          {/* Google Maps Base Layer (with hl=en for 100% English area names) */}
          <TileLayer
            key={activeMapConfig.id}
            attribution={activeMapConfig.attribution}
            url={activeMapConfig.url}
            subdomains={activeMapConfig.subdomains}
            maxZoom={activeMapConfig.maxZoom}
          />

          {/* Coordinate click picker */}
          <MapEventsHandler onSelectCoordinates={onMapCoordinatePick} />

          {/* Map Toolbar Zoom & Recenter Controller */}
          <MapToolbarActions 
            onZoomIn={zoomInRef} 
            onZoomOut={zoomOutRef} 
            onRecenter={recenterRef} 
          />

          {/* Dynamic Fly Controller when a report is selected in the feed */}
          <MapFlyController targetCoord={selectedReport} />

          {/* Dedicated Leaflet Pane for Continuous GIS Heatmap Blur & Color Blending */}
          <HeatmapPaneController />

          {/* =================================================================== */}
          {/* A. BRAHMAPUTRA RIVER PATH */}
          {/* =================================================================== */}
          <Polyline
            positions={BRAHMAPUTRA_RIVER}
            pathOptions={{
              color: '#0284c7',
              weight: 4.5,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          >
            <Tooltip sticky>
              <span className="font-bold text-sky-700">River Brahmaputra Valley</span>
            </Tooltip>
          </Polyline>

          {/* =================================================================== */}
          {/* B. CONTINUOUS GEOLOGICAL HAZARD HEATMAP (Matching Reference Image) */}
          {/* =================================================================== */}
          {showRiskHeatmap && (
            <>
              {/* 1. Regional Multi-Tier Isobar Polygons in Blurred Raster Pane */}
              {RISK_HEATMAP_CONTOURS.map((contour) => (
                <Polygon
                  key={contour.id}
                  positions={contour.polygon}
                  pane="heatmapBlurPane"
                  pathOptions={{
                    stroke: false,
                    fillColor: contour.fillColor,
                    fillOpacity: contour.fillOpacity
                  }}
                />
              ))}

              {/* 2. Dense Mountain Ridge Gradient Heat Halos in Blurred Raster Pane */}
              {HIGH_RISK_HEAT_SPOTS.map((spot) => {
                const isCritical = spot.severity === 'Critical';

                return (
                  <React.Fragment key={spot.id}>
                    {/* Outer Buffer Halo (Vibrant Terrain Green) */}
                    <Circle
                      center={[spot.lat, spot.lng]}
                      radius={spot.radiusMeters}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: '#22c55e',
                        fillOpacity: 0.60
                      }}
                    />

                    {/* Middle Warning Halo (Golden Warm Yellow) */}
                    <Circle
                      center={[spot.lat, spot.lng]}
                      radius={spot.radiusMeters * 0.72}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: '#facc15',
                        fillOpacity: 0.75
                      }}
                    />

                    {/* High Instability Scarp (Vivid Amber-Orange) */}
                    <Circle
                      center={[spot.lat, spot.lng]}
                      radius={spot.radiusMeters * 0.48}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: '#f97316',
                        fillOpacity: 0.85
                      }}
                    />

                    {/* Critical Landslide Rupture Core (Intense Crimson Red Core as in Reference Photo) */}
                    <Circle
                      center={[spot.lat, spot.lng]}
                      radius={spot.radiusMeters * 0.28}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: isCritical ? '#dc2626' : '#ea580c',
                        fillOpacity: 0.98
                      }}
                    />
                  </React.Fragment>
                );
              })}

              {/* 3. Interactive Tooltip Anchors for Critical Epicenters in Standard Interactive Pane */}
              {HIGH_RISK_HEAT_SPOTS.map((spot) => (
                <Circle
                  key={`anchor-${spot.id}`}
                  center={[spot.lat, spot.lng]}
                  radius={spot.radiusMeters * 0.25}
                  pathOptions={{
                    color: '#991b1b',
                    weight: 1.5,
                    dashArray: '3, 3',
                    fillColor: 'transparent',
                    fillOpacity: 0
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs font-sans p-1.5 min-w-[210px]">
                      <div className="flex items-center gap-1.5 font-bold text-red-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                        <span>{spot.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">{spot.state}</div>
                      <div className="mt-1.5 pt-1 border-t border-slate-200 text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hazard Level:</span>
                          <strong className="text-red-600 uppercase font-bold">{spot.severity}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">AI Risk Index:</span>
                          <strong className="text-red-700 font-bold">{spot.riskScore}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Soil Pore Saturation:</span>
                          <strong className="text-amber-700 font-bold">{spot.poreSaturation}</strong>
                        </div>
                        <div className="text-slate-600 text-[10px] mt-1 pt-1 border-t border-slate-100 italic">
                          {spot.criticalFactor}
                        </div>
                      </div>
                    </div>
                  </Tooltip>
                </Circle>
              ))}

              {/* 4. DYNAMIC SUPABASE REALTIME AI MONITORED LOCATIONS */}
              {locationRisks.map((loc, idx) => {
                const isHigh = loc.risk_level === 'High';
                const isMedium = loc.risk_level === 'Medium';
                const coreColor = isHigh ? '#dc2626' : isMedium ? '#ea580c' : '#16a34a';
                const radius = isHigh ? 28000 : isMedium ? 20000 : 14000;

                return (
                  <React.Fragment key={`realtime-halo-${loc.location_name || idx}`}>
                    {/* Outer Buffer Halo */}
                    <Circle
                      center={[loc.latitude, loc.longitude]}
                      radius={radius}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: isHigh ? '#f97316' : isMedium ? '#facc15' : '#22c55e',
                        fillOpacity: 0.65
                      }}
                    />
                    {/* Inner Core */}
                    <Circle
                      center={[loc.latitude, loc.longitude]}
                      radius={radius * 0.35}
                      pane="heatmapBlurPane"
                      pathOptions={{
                        stroke: false,
                        fillColor: coreColor,
                        fillOpacity: 0.95
                      }}
                    />
                  </React.Fragment>
                );
              })}

              {/* 5. Interactive Tooltip Anchors for Dynamic Realtime Locations */}
              {locationRisks.map((loc, idx) => {
                const isHigh = loc.risk_level === 'High';
                const isMedium = loc.risk_level === 'Medium';
                const scorePct = loc.risk_score ? (loc.risk_score <= 1.0 ? (loc.risk_score * 100).toFixed(1) : loc.risk_score) : '—';
                const radius = isHigh ? 8000 : 6000;

                return (
                  <Circle
                    key={`realtime-anchor-${loc.location_name || idx}`}
                    center={[loc.latitude, loc.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: isHigh ? '#dc2626' : isMedium ? '#ea580c' : '#16a34a',
                      weight: 2,
                      dashArray: isHigh ? '4, 4' : undefined,
                      fillColor: isHigh ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                      fillOpacity: isHigh ? 0.3 : 0
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs font-sans p-1.5 min-w-[210px]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-red-600 animate-ping' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          <span>{loc.location_name}</span>
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 text-[10px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">AI Risk Assessment:</span>
                            <strong className={`uppercase font-bold ${isHigh ? 'text-red-700' : isMedium ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {loc.risk_level} ({scorePct}%)
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">3-Day Precipitation:</span>
                            <strong className="text-sky-700 font-bold">{loc.rainfall_3day} mm</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 font-mono text-[9px]">
                            <span>Supabase Synced:</span>
                            <span className="text-emerald-600 font-bold">Realtime</span>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  </Circle>
                );
              })}
            </>
          )}

          {/* =================================================================== */}
          {/* C. REGIONAL STATE GIS LABELS (ARUNACHAL PRADESH, ASSAM, etc.) */}
          {/* =================================================================== */}
          {NE_STATE_LABELS.map((label) => (
            <Marker
              key={label.name}
              position={[label.lat, label.lng]}
              icon={createStateLabelIcon(label)}
              interactive={false}
            />
          ))}

          {/* =================================================================== */}
          {/* D. ARTERIAL HIGHWAY CORRIDORS (High-Contrast GIS Line with Casing) */}
          {/* =================================================================== */}
          {ARTERIAL_HIGHWAYS.map((road) => {
            const isCritical = road.status === 'Severed' || road.closedPct > 40;
            const roadColor = isCritical ? '#dc2626' : road.partiallyBlockedPct > 0 ? '#ea580c' : '#0284c7';

            return (
              <React.Fragment key={road.id}>
                {/* 1. Outer Dark Cyan Blue Casing (like reference map road corridor) */}
                <Polyline
                  positions={road.path}
                  pathOptions={{
                    color: '#075985',
                    weight: 6,
                    opacity: 0.85
                  }}
                />
                {/* 2. Inner Active Colored Track */}
                <Polyline
                  positions={road.path}
                  pathOptions={{
                    color: roadColor,
                    weight: 3.5,
                    opacity: 0.95,
                    dashArray: isCritical ? '6, 6' : undefined
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs p-1 font-sans">
                      <div className="font-bold text-slate-900">{road.name}</div>
                      <div className="text-slate-600 text-[11px]">Hotspot: {road.dangerZone}</div>
                      <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                        Open: {road.openPct}% | Closed: {road.closedPct}%
                      </div>
                    </div>
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* =================================================================== */}
          {/* D. MONITORED VILLAGES MARKERS */}
          {/* =================================================================== */}
          {MONITORED_VILLAGES.map((village) => (
            <Marker
              key={village.id}
              position={[village.lat, village.lng]}
              icon={createVillageIcon(village.risk)}
            >
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <div className="font-bold text-slate-900">{village.name}</div>
                  <div className="text-slate-600">Population: {village.population.toLocaleString()}</div>
                  <div className="mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                      {village.evacuationStatus}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* =================================================================== */}
          {/* E. WEATHER STATIONS MARKERS */}
          {/* =================================================================== */}
          {showWeatherStations && WEATHER_STATIONS.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createWeatherStationIcon()}
            >
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <div className="font-bold text-sky-800">{station.name}</div>
                  <div className="text-slate-600">Precipitation: <strong>{station.rainfall} mm</strong></div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Status: {station.status}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* =================================================================== */}
          {/* F. SOIL MOISTURE SENSORS MARKERS */}
          {/* =================================================================== */}
          {SOIL_MOISTURE_SENSORS.map((sensor) => (
            <Marker
              key={sensor.id}
              position={[sensor.lat, sensor.lng]}
              icon={createSoilMoistureIcon()}
            >
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <div className="font-bold text-teal-800">{sensor.name}</div>
                  <div className="text-slate-600">Saturation: <strong>{sensor.saturation}%</strong></div>
                  <div className="text-slate-600">Pore Pressure: {sensor.porePressure}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* =================================================================== */}
          {/* G. CITIZEN HAZARD REPORTS GEO-TAGGED MARKERS */}
          {/* =================================================================== */}
          {hazardReports.map((report) => {
            const isMountainCrack = report.report_type === 'mountain_crack' || report.crackWidth || report.crack_width_cm;
            const isPending = report.sync_status === 'pending';
            const imgUrl = (report.image && report.image.length > 10) 
              ? report.image 
              : (report.image_data && report.image_data.length > 10) 
              ? report.image_data 
              : null;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createHazardPinIcon(report)}
              >
                <Popup>
                  <div className="p-2.5 max-w-[240px] text-xs font-sans">
                    {/* Header with Category & Sync status */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        isMountainCrack ? 'bg-amber-600' : 'bg-sky-600'
                      }`}>
                        {isMountainCrack ? '▲ Mountain Crack' : '⛈ Climate Event'}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isPending ? 'Pending Sync' : 'Cloud Synced'}
                      </span>
                    </div>

                    {imgUrl && (
                      <img 
                        src={imgUrl} 
                        alt="Hazard" 
                        className="w-full h-24 object-cover rounded mb-1.5 border border-slate-200" 
                      />
                    )}

                    <div className="font-bold text-slate-900 mb-0.5">
                      {report.location || report.location_name || 'Corridor Observed Hazard'}
                    </div>

                    <p className="text-slate-700 text-[11px] leading-snug line-clamp-3 mb-1.5">
                      {report.description}
                    </p>

                    <div className="pt-1 border-t border-slate-100 font-mono text-[10px] space-y-0.5 text-slate-500">
                      {isMountainCrack ? (
                        <div>
                          Crack Width: <strong className="text-red-600">{report.crackWidth || `${report.crack_width_cm || 15} cm`}</strong>
                          {report.crack_length_m && <span> | Length: <strong>{report.crack_length_m}m</strong></span>}
                        </div>
                      ) : (
                        <div>
                          Weather: <strong className="text-sky-700">{report.climate_condition || 'Heavy Rain'}</strong>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400">
                        GPS: {report.latitude}, {report.longitude}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* =================================================================== */}
        {/* 4. FLOATING MAP LEGEND (Bottom Right of Map) */}
        {/* =================================================================== */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-lg border border-slate-300 shadow-xl text-slate-800 text-xs w-64 pointer-events-auto select-none">
          <h4 className="font-bold text-slate-900 mb-2 text-xs tracking-tight flex items-center justify-between">
            <span>Landslide Risk Severity</span>
            <span className="text-[10px] text-red-600 font-mono font-bold uppercase">Live Heat Map</span>
          </h4>

          {/* Step gradient bar */}
          <div className="grid grid-cols-4 gap-0.5 h-3 rounded overflow-hidden mb-1">
            <div className="bg-[#22c55e]"></div>
            <div className="bg-[#eab308]"></div>
            <div className="bg-[#f97316]"></div>
            <div className="bg-[#dc2626]"></div>
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-3">
            <span>Low (Safe)</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>

          {/* Symbol Keys matching reference photo */}
          <div className="space-y-1.5 text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600/70 border border-red-700 flex items-center justify-center text-white text-[8px]">●</span>
              <span>High Risk Heat Map Zones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-1 bg-amber-800 rounded"></span>
              <span>Vulnerable Arterial Road</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
              <span>Villages (Immediate Evacuate)</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              <span>Soil Moisture Sensors</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span>IMD Weather Station</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. BOTTOM STATUS BAR (Multilingual Notifications & Offline Sync Status) */}
      {/* =================================================================== */}
      <div className="h-10 bg-white border-t border-slate-200 px-4 flex items-center justify-between z-20 text-xs font-sans text-slate-700 shadow-sm shrink-0">
        
        {/* Left: Multilingual Notifications */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Multilingual Notifications</span>
          <div className="flex items-center gap-1">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="Eng">Eng</option>
              <option value="Hindi">Hindi</option>
              <option value="Assamese">Assamese</option>
              <option value="Bengali">Bengali</option>
            </select>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Hindi Assamese etc.</span>
          </div>
        </div>

        {/* Right: Offline Sync Status: Enabled / Syncing (pulsing green dot) */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Offline Sync Status:</span>
          <span className="flex items-center gap-1.5 font-bold text-emerald-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Enabled/Syncing</span>
          </span>
        </div>

      </div>

    </div>
  );
}
