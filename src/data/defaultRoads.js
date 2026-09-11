export const DEFAULT_HIGHWAYS = [
  {
    id: 'road-nh6',
    name: 'NH-6 (Jorabat - Shillong - Silchar)',
    code: 'NH-6',
    status: 'Severed', // In storm or critical event, becomes Severed
    dangerSection: 'Sonapur Tunnel km 141-144',
    detourAvailable: false,
    color: '#ef4444',
    path: [
      [26.1158, 91.8765], // Jorabat
      [25.9082, 91.8847], // Nongpoh
      [25.6823, 91.9124], // Umiam
      [25.5788, 91.8933], // Shillong
      [25.4412, 92.2023], // Jowai
      [25.1235, 92.3651], // Sonapur Tunnel (Landslide epicentre)
      [24.9654, 92.4876], // Ratacherra
      [24.8333, 92.7789]  // Silchar
    ]
  },
  {
    id: 'road-nh44',
    name: 'NH-44 (Shillong - Agartala Corridor)',
    code: 'NH-44',
    status: 'Clear',
    dangerSection: 'Churaibari Border Pass',
    detourAvailable: true,
    color: '#10b981',
    path: [
      [25.5788, 91.8933], // Shillong
      [25.4412, 92.2023], // Jowai
      [24.5123, 92.2412], // Karimganj
      [24.4124, 92.1932], // Churaibari
      [24.1843, 92.0123], // Dharmanagar
      [23.8315, 91.2868]  // Agartala
    ]
  },
  {
    id: 'road-nh10',
    name: 'NH-10 (Sevoke - Teesta - Gangtok)',
    code: 'NH-10',
    status: 'At Risk',
    dangerSection: '29th Mile & Bhalu Khola',
    detourAvailable: true,
    color: '#f59e0b',
    path: [
      [26.8834, 88.4719], // Sevoke Coronation Bridge
      [27.0543, 88.4682], // Teesta Bazaar
      [27.1432, 88.5123], // Singtam
      [27.2412, 88.5823], // Ranipool
      [27.3389, 88.6065]  // Gangtok
    ]
  },
  {
    id: 'road-nh29',
    name: 'NH-29 (Dimapur - Kohima - Imphal)',
    code: 'NH-29',
    status: 'Clear',
    dangerSection: 'Phesama Ridge km 38',
    detourAvailable: false,
    color: '#10b981',
    path: [
      [25.9042, 93.7289], // Dimapur
      [25.7923, 93.9142], // Chumukedima Gorge
      [25.6751, 94.1086], // Kohima
      [25.4123, 94.0512], // Maram
      [25.2678, 94.0245], // Senapati
      [24.8170, 93.9368]  // Imphal
    ]
  }
];
