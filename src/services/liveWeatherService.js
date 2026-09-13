/**
 * Live Weather Service for BhujanRakshak Landslide Early Warning System
 * Fetches real-time meteorological conditions for North East Indian coordinates
 * using meteorological APIs (Open-Meteo with WMO standards).
 */

export const MONITORED_STATIONS = [
  {
    id: 'loc-noney',
    name: 'Noney (Tupul Ridge)',
    state: 'Manipur',
    latitude: 24.7174,
    longitude: 93.6331,
    elevation: 850
  },
  {
    id: 'loc-aizawl',
    name: 'Aizawl (Melthum)',
    state: 'Mizoram',
    latitude: 23.7271,
    longitude: 92.7176,
    elevation: 1132
  },
  {
    id: 'loc-cherra',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    latitude: 25.2800,
    longitude: 91.7300,
    elevation: 1430
  },
  {
    id: 'loc-sonapur',
    name: 'Sonapur Tunnel (NH-6)',
    state: 'Meghalaya',
    latitude: 25.1235,
    longitude: 92.3651,
    elevation: 480
  },
  {
    id: 'loc-haflong',
    name: 'Haflong Hill (Dima Hasao)',
    state: 'Assam',
    latitude: 25.1667,
    longitude: 93.0167,
    elevation: 680
  }
];

/**
 * Maps WMO weather interpretation code to clear label and icon identifier
 */
export function interpretWmoCode(code) {
  if (code === 0) return { label: 'Clear Sky', category: 'clear' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', category: 'cloudy' };
  if (code === 3) return { label: 'Overcast', category: 'cloudy' };
  if (code >= 45 && code <= 48) return { label: 'Fog / Mist', category: 'fog' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', category: 'drizzle' };
  if (code >= 61 && code <= 63) return { label: 'Moderate Rain', category: 'rain' };
  if (code >= 64 && code <= 65) return { label: 'Heavy Monsoon Rain', category: 'heavy_rain' };
  if (code >= 80 && code <= 82) return { label: 'Torrential Downpour', category: 'heavy_rain' };
  if (code >= 95 && code <= 99) return { label: 'Severe Thunderstorm', category: 'thunderstorm' };
  return { label: 'Precipitation Active', category: 'rain' };
}

/**
 * Fetches live weather for a specific latitude and longitude
 */
export async function fetchLiveWeather(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation,soil_moisture_0_to_1cm&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API returned status: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    // Calculate 24-hour cumulative rainfall from hourly precipitation if available
    let cumulative24h = 0;
    if (hourly.precipitation && Array.isArray(hourly.precipitation)) {
      const last24 = hourly.precipitation.slice(0, 24);
      cumulative24h = last24.reduce((acc, val) => acc + (val || 0), 0);
    }

    // Soil moisture estimate (convert volumetric m3/m3 ~0.15 - 0.50 to saturation %)
    let soilMoisturePercent = 65.0;
    if (hourly.soil_moisture_0_to_1cm && hourly.soil_moisture_0_to_1cm.length > 0) {
      const rawVol = hourly.soil_moisture_0_to_1cm[0] || 0.35;
      // Normal soil saturation capacity for Himalayan/NE clay loam is ~0.45 m3/m3
      soilMoisturePercent = Math.min(98.0, Math.max(20.0, (rawVol / 0.45) * 100));
    } else {
      // Fallback formula based on precipitation
      soilMoisturePercent = Math.min(95.0, 40.0 + ((current.precipitation || 0) * 3.5) + (cumulative24h * 0.4));
    }

    const wmoInfo = interpretWmoCode(current.weather_code ?? 61);

    return {
      success: true,
      temperature: current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : 24.5,
      humidity: current.relative_humidity_2m || 82,
      precipitationRate: current.precipitation !== undefined ? Math.max(0, current.precipitation) : 0,
      cumulative24h: Math.round(cumulative24h * 10) / 10,
      windSpeed: current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : 12,
      weatherCode: current.weather_code || 0,
      weatherLabel: wmoInfo.label,
      weatherCategory: wmoInfo.category,
      soilSaturation: Math.round(soilMoisturePercent * 10) / 10,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error) {
    console.warn('Live weather fetch fallback applied:', error.message);
    // Reliable offline / fallback values
    return {
      success: false,
      temperature: 24.2,
      humidity: 85,
      precipitationRate: 14.5,
      cumulative24h: 68.2,
      windSpeed: 16,
      weatherCode: 63,
      weatherLabel: 'Moderate Rain (Simulated)',
      weatherCategory: 'rain',
      soilSaturation: 74.8,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

/**
 * Fetch summary for multiple key stations at once
 */
export async function fetchAllStationWeather() {
  const promises = MONITORED_STATIONS.map(async (station) => {
    const weather = await fetchLiveWeather(station.latitude, station.longitude);
    return {
      ...station,
      weather
    };
  });

  return Promise.all(promises);
}
