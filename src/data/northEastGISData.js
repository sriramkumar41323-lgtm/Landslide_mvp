// North Eastern Region GIS Data
// Includes Risk Heatmap Polygons, State Labels, Brahmaputra River, Villages, Weather Stations, and Highways

export const NE_STATE_LABELS = [
  { name: 'ASSAM', lat: 26.2006, lng: 92.9376, color: '#1e293b' },
  { name: 'ARUNACHAL PRADESH', lat: 27.6500, lng: 93.6500, color: '#0f172a' },
  { name: 'MEGHALAYA', lat: 25.4670, lng: 91.3662, color: '#1e293b' },
  { name: 'NAGALAND', lat: 26.1584, lng: 94.5624, color: '#1e293b' },
  { name: 'MANIPUR', lat: 24.6637, lng: 93.9063, color: '#1e293b' },
  { name: 'MIZORAM', lat: 23.1645, lng: 92.9376, color: '#1e293b' },
  { name: 'TRIPURA', lat: 23.9408, lng: 91.9882, color: '#1e293b' },
  { name: 'Bhutan', lat: 27.5142, lng: 90.4336, color: '#64748b', isNeighbor: true }
];

// Brahmaputra River path across Assam
export const BRAHMAPUTRA_RIVER = [
  [27.80, 95.30],
  [27.48, 94.90],
  [27.15, 94.30],
  [26.75, 93.50],
  [26.65, 92.80],
  [26.25, 91.80],
  [26.15, 91.70],
  [26.05, 90.50],
  [25.80, 89.95]
];

// // Multi-tier contour polygons representing the exact GIS Meteorological & Landslide Risk Heatmap:
// 1. Green baseline (Assam valley & Arunachal outer slope)
// 2. Yellow warning transition belts
// 3. Orange high-risk slope shear zones
// 4. Intense Crimson-Red critical landslide rupture zones along mountain ridges (matching reference GIS image)
export const RISK_HEATMAP_CONTOURS = [
  // =========================================================================
  // TIER 1: VIBRANT GREEN BASELINE (Assam Plain, Valley Floor & Foothills)
  // =========================================================================
  {
    id: 'risk-green-regional-base',
    level: 'Low',
    color: '#16a34a',
    fillColor: '#22c55e',
    fillOpacity: 0.55,
    polygon: [
      [28.2, 91.8],
      [28.6, 94.2],
      [28.5, 96.5],
      [27.4, 96.8],
      [26.8, 95.8],
      [26.2, 94.8],
      [25.6, 93.8],
      [24.8, 93.0],
      [24.8, 91.2],
      [25.5, 90.0],
      [26.4, 89.8],
      [27.2, 91.0],
      [27.8, 91.5]
    ]
  },

  // =========================================================================
  // TIER 2: WARM YELLOW TRANSITION (Himalayan Foothills & Mountain Slopes)
  // =========================================================================
  {
    id: 'risk-yellow-arunachal-north',
    level: 'Medium',
    color: '#ca8a04',
    fillColor: '#facc15',
    fillOpacity: 0.70,
    polygon: [
      [27.9, 91.9],
      [28.2, 93.0],
      [28.3, 94.6],
      [28.1, 95.8],
      [27.5, 96.4],
      [27.1, 95.8],
      [27.0, 94.4],
      [26.8, 93.2],
      [27.0, 92.1]
    ]
  },
  {
    id: 'risk-yellow-south-plateau',
    level: 'Medium',
    color: '#ca8a04',
    fillColor: '#facc15',
    fillOpacity: 0.70,
    polygon: [
      [26.2, 91.5],
      [26.3, 92.8],
      [26.1, 93.8],
      [25.7, 94.4],
      [25.0, 93.8],
      [24.9, 92.2],
      [25.3, 91.2],
      [25.8, 91.0]
    ]
  },

  // =========================================================================
  // TIER 3: VIVID ORANGE HIGH-RISK BELTS (Mountain Scarp & Fault Zones)
  // =========================================================================
  // Arunachal Western Ridge (Tawang/West Kameng)
  {
    id: 'risk-orange-west-kameng',
    level: 'High',
    color: '#ea580c',
    fillColor: '#f97316',
    fillOpacity: 0.85,
    polygon: [
      [27.6, 91.9],
      [27.8, 92.6],
      [27.4, 93.0],
      [27.0, 92.7],
      [27.0, 92.0]
    ]
  },
  // Arunachal Central Mountain Arc (Papum Pare / Lower Subansiri)
  {
    id: 'risk-orange-central-arunachal',
    level: 'High',
    color: '#ea580c',
    fillColor: '#f97316',
    fillOpacity: 0.85,
    polygon: [
      [27.4, 93.0],
      [27.8, 93.6],
      [28.0, 94.6],
      [27.6, 95.0],
      [27.1, 94.4],
      [26.9, 93.6]
    ]
  },
  // Arunachal Eastern Foothills (Dibang / Lohit)
  {
    id: 'risk-orange-east-dibang',
    level: 'High',
    color: '#ea580c',
    fillColor: '#f97316',
    fillOpacity: 0.85,
    polygon: [
      [28.1, 95.0],
      [28.3, 96.0],
      [27.8, 96.5],
      [27.3, 96.0],
      [27.4, 95.3]
    ]
  },
  // Southern Ridge (Sonapur - Meghalaya - Dima Hasao Escarpment)
  {
    id: 'risk-orange-southern-scarp',
    level: 'High',
    color: '#ea580c',
    fillColor: '#f97316',
    fillOpacity: 0.85,
    polygon: [
      [25.8, 91.6],
      [25.9, 92.6],
      [25.6, 93.5],
      [25.2, 93.4],
      [25.0, 92.4],
      [25.2, 91.6]
    ]
  },

  // =========================================================================
  // TIER 4: INTENSE CRIMSON-RED CRITICAL HAZARD CORES (As in Reference Photo)
  // =========================================================================
  // 1. Arunachal West Peak (Near Bhutan border / Tawang)
  {
    id: 'risk-red-west-peak',
    level: 'Critical',
    color: '#991b1b',
    fillColor: '#dc2626',
    fillOpacity: 0.95,
    polygon: [
      [27.5, 92.1],
      [27.7, 92.5],
      [27.3, 92.7],
      [27.1, 92.3]
    ]
  },
  // 2. Arunachal Central Epicenter (Papum Pare / Itanagar Ridge - Large Red Field)
  {
    id: 'risk-red-central-epicenter',
    level: 'Critical',
    color: '#991b1b',
    fillColor: '#dc2626',
    fillOpacity: 0.98,
    polygon: [
      [27.3, 93.2],
      [27.6, 93.8],
      [27.8, 94.4],
      [27.4, 94.7],
      [27.0, 94.1],
      [26.9, 93.4]
    ]
  },
  // 3. Arunachal East Critical Ridge (Dibang / Roing Mountain Fault)
  {
    id: 'risk-red-east-spur',
    level: 'Critical',
    color: '#991b1b',
    fillColor: '#dc2626',
    fillOpacity: 0.95,
    polygon: [
      [27.9, 95.3],
      [28.2, 95.9],
      [27.7, 96.2],
      [27.5, 95.6]
    ]
  },
  // 4. Sonapur Shear Ridge & Jaintia Hills (NH-6 corridor - High vulnerability)
  {
    id: 'risk-red-sonapur-jaintia',
    level: 'Critical',
    color: '#991b1b',
    fillColor: '#dc2626',
    fillOpacity: 0.98,
    polygon: [
      [25.5, 92.0],
      [25.6, 92.6],
      [25.1, 92.6],
      [25.0, 92.1]
    ]
  },
  // 5. Haflong - Dima Hasao - Barail Range (South Assam Hill Sector)
  {
    id: 'risk-red-haflong-barail',
    level: 'Critical',
    color: '#991b1b',
    fillColor: '#dc2626',
    fillOpacity: 0.95,
    polygon: [
      [25.5, 92.8],
      [25.6, 93.3],
      [25.1, 93.4],
      [25.0, 92.9]
    ]
  }
];

// High-Density Hotspot Nodes across North East Mountain Ridges
// Rendered with multi-radius gradient halos that blend into the contours
export const HIGH_RISK_HEAT_SPOTS = [
  // 1. Arunachal West (Bhalukpong & West Kameng Gorge)
  {
    id: 'spot-bhalukpong',
    name: 'Bhalukpong Gorge Ridge',
    state: 'Arunachal Pradesh',
    lat: 27.0125,
    lng: 92.6510,
    radiusMeters: 38000,
    severity: 'Critical',
    riskScore: '97.6%',
    poreSaturation: '98.5%',
    criticalFactor: 'Steep river gorge undercut & active rockfall runout'
  },
  // 2. Arunachal Central (Papum Pare / Itanagar High Core)
  {
    id: 'spot-itanagar-ridge',
    name: 'Papum Pare Escarpment',
    state: 'Arunachal Pradesh',
    lat: 27.2844,
    lng: 93.7253,
    radiusMeters: 42000,
    severity: 'Critical',
    riskScore: '98.4%',
    poreSaturation: '99.1%',
    criticalFactor: 'Tectonic thrust shear + continuous precipitation saturation'
  },
  // 3. Arunachal East (Pasighat & Siang Valley Choke Point)
  {
    id: 'spot-pasighat',
    name: 'Upper Siang Valley Choke',
    state: 'Arunachal Pradesh',
    lat: 28.0664,
    lng: 95.3262,
    radiusMeters: 36000,
    severity: 'Critical',
    riskScore: '95.8%',
    poreSaturation: '96.4%',
    criticalFactor: 'Glacial silt slurry & fractured metamorphic shale'
  },
  // 4. Sonapur Tunnel Shear Corridor (NH-6 - Meghalaya/Assam Border)
  {
    id: 'spot-sonapur',
    name: 'Sonapur Tunnel Bypass (NH-6)',
    state: 'Meghalaya / Assam Border',
    lat: 25.1852,
    lng: 92.3564,
    radiusMeters: 35000,
    severity: 'Critical',
    riskScore: '98.9%',
    poreSaturation: '99.4%',
    criticalFactor: 'Transverse tension crack + waterlogged sandstone cutting'
  },
  // 5. Haflong - Dima Hasao Mountain Ridge (NH-57)
  {
    id: 'spot-haflong',
    name: 'Haflong - Barail Ridge (NH-57)',
    state: 'Dima Hasao, Assam',
    lat: 25.1764,
    lng: 93.0231,
    radiusMeters: 32000,
    severity: 'Critical',
    riskScore: '95.2%',
    poreSaturation: '96.8%',
    criticalFactor: 'Colluvial soil creeping over underlying steep limestone bedrock'
  },
  // 6. Kohima Mountain Pass (NH-29 / NH-44)
  {
    id: 'spot-kohima',
    name: 'Kohima Gorge km 42 (NH-29)',
    state: 'Nagaland',
    lat: 25.6751,
    lng: 94.1086,
    radiusMeters: 30000,
    severity: 'High',
    riskScore: '89.4%',
    poreSaturation: '91.2%',
    criticalFactor: 'Continuous slope shear creeping into arterial corridor'
  },
  // 7. Jorabat Hill Drainage Pass (NH-37 / Guwahati Gateway)
  {
    id: 'spot-jorabat',
    name: 'Jorabat - Khanapara Cutting (NH-37)',
    state: 'Kamrup / Ri-Bhoi Border',
    lat: 26.1105,
    lng: 91.8720,
    radiusMeters: 24000,
    severity: 'Warning',
    riskScore: '78.5%',
    poreSaturation: '85.2%',
    criticalFactor: 'Hillside drainage overflow & red laterite mud slurry'
  },
  // 8. Tawang Western Ridge
  {
    id: 'spot-tawang',
    name: 'Tawang - Sela Pass Ridge',
    state: 'Arunachal Pradesh',
    lat: 27.5861,
    lng: 91.8594,
    radiusMeters: 34000,
    severity: 'Critical',
    riskScore: '94.6%',
    poreSaturation: '95.5%',
    criticalFactor: 'Permafrost thaw & steep granitic debris slide'
  }
];

// Monitored Villages matching the command center display
export const MONITORED_VILLAGES = [
  { id: 'v-1', name: 'Village X (Sonapur Ridge)', lat: 25.1852, lng: 92.3564, risk: 'High', population: 1420, evacuationStatus: 'Immediate Evacuate' },
  { id: 'v-2', name: 'Village Y (Bhalukpong Valley)', lat: 27.0125, lng: 92.6510, risk: 'High', population: 890, evacuationStatus: 'Immediate Evacuate' },
  { id: 'v-3', name: 'Village Z (Haflong Slopes)', lat: 25.1764, lng: 93.0231, risk: 'High', population: 2150, evacuationStatus: 'Immediate Evacuate' },
  { id: 'v-4', name: 'Nongpoh Settlement', lat: 25.9000, lng: 91.8800, risk: 'Medium', population: 3100, evacuationStatus: 'Standby Warning' },
  { id: 'v-5', name: 'Mawkyrwat Hills', lat: 25.3600, lng: 91.4500, risk: 'Medium', population: 1750, evacuationStatus: 'Standby Warning' },
  { id: 'v-6', name: 'Tezpur Outer Sector', lat: 26.6528, lng: 92.7926, risk: 'Low', population: 4800, evacuationStatus: 'Monitored Normal' }
];

// Weather Stations matching IMD telemetry
export const WEATHER_STATIONS = [
  { id: 'ws-1', name: 'Guwahati IMD Doppler Station', lat: 26.1445, lng: 91.7362, rainfall: 72.4, status: 'Active' },
  { id: 'ws-2', name: 'Shillong Central Observatory', lat: 25.5788, lng: 91.8933, rainfall: 124.6, status: 'Active' },
  { id: 'ws-3', name: 'Cherrapunji High-Precip Station', lat: 25.2702, lng: 91.7323, rainfall: 188.2, status: 'High Alert' },
  { id: 'ws-4', name: 'Itanagar IMD Weather Radar', lat: 27.0844, lng: 93.6053, rainfall: 86.5, status: 'Active' },
  { id: 'ws-5', name: 'Silchar Southern Valley Post', lat: 24.8333, lng: 92.7789, rainfall: 94.0, status: 'Active' },
  { id: 'ws-6', name: 'Kohima Hill Station Post', lat: 25.6751, lng: 94.1086, rainfall: 68.3, status: 'Active' }
];

// Soil Moisture Sensors (In-situ TDR Geotechnical Nodes)
export const SOIL_MOISTURE_SENSORS = [
  { id: 'sms-1', name: 'Soil Node SN-01 (Sonapur Cuttings)', lat: 25.2100, lng: 92.3400, saturation: 94.2, porePressure: '14.2 kPa' },
  { id: 'sms-2', name: 'Soil Node SN-02 (Umiam Dam Slope)', lat: 25.6500, lng: 91.9000, saturation: 78.5, porePressure: '9.8 kPa' },
  { id: 'sms-3', name: 'Soil Node SN-03 (Dima Hasao Pass)', lat: 25.2400, lng: 93.0600, saturation: 89.1, porePressure: '12.6 kPa' },
  { id: 'sms-4', name: 'Soil Node SN-04 (Bhalukpong Ridge)', lat: 26.9800, lng: 92.6200, saturation: 91.0, porePressure: '13.4 kPa' }
];

// Highways matching the dashboard status cards
export const ARTERIAL_HIGHWAYS = [
  {
    id: 'nh-44',
    code: 'NH 44',
    name: 'NH 44 (Shillong - Agartala)',
    openPct: 85,
    closedPct: 15,
    partiallyBlockedPct: 0,
    status: 'Partially Open',
    dangerZone: 'Jowai Pass km 64',
    path: [
      [25.57, 91.89],
      [25.45, 92.20],
      [25.15, 92.35],
      [24.85, 92.75],
      [24.10, 92.20],
      [23.83, 91.28]
    ]
  },
  {
    id: 'nh-37',
    code: 'NH 37',
    name: 'NH 37 (Guwahati - Dibrugarh Trunk)',
    openPct: 55,
    closedPct: 15,
    partiallyBlockedPct: 30,
    status: 'Partially Blocked',
    dangerZone: 'Jorabat to Kaziranga Section',
    path: [
      [26.14, 91.73],
      [26.11, 91.87],
      [26.25, 92.60],
      [26.58, 93.15],
      [26.65, 93.90],
      [27.48, 94.90]
    ]
  },
  {
    id: 'nh-10',
    code: 'NH 10',
    name: 'NH 10 (Siliguri - Gangtok Mountain Corridor)',
    openPct: 100,
    closedPct: 0,
    partiallyBlockedPct: 0,
    status: 'Open',
    dangerZone: 'Coronation Bridge / Teesta Gorge',
    path: [
      [26.72, 88.42],
      [26.90, 88.48],
      [27.05, 88.52],
      [27.33, 88.61]
    ]
  },
  {
    id: 'nh-57',
    code: 'NH 57',
    name: 'NH 57 (Lumding - Silchar Hill Railway Parallel)',
    openPct: 45,
    closedPct: 20,
    partiallyBlockedPct: 35,
    status: 'Critical Alert',
    dangerZone: 'Haflong Hill Cut km 92',
    path: [
      [25.75, 93.18],
      [25.40, 93.10],
      [25.17, 93.02],
      [24.83, 92.77]
    ]
  },
  {
    id: 'nh-6',
    code: 'NH 6',
    name: 'NH 6 (Jorabat - Ratacherra Lifeline)',
    openPct: 30,
    closedPct: 70,
    partiallyBlockedPct: 0,
    status: 'Severed',
    dangerZone: 'Sonapur Tunnel Bypass (Severed)',
    path: [
      [26.11, 91.87],
      [25.90, 91.88],
      [25.57, 91.89],
      [25.44, 92.21],
      [25.18, 92.35],
      [24.85, 92.78]
    ]
  }
];
