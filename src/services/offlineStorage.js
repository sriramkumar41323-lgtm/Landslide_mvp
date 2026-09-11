import { insertFieldReport } from './supabaseClient';

const DB_NAME = 'BhujanRakshakDB';
const DB_VERSION = 1;
const STORE_NAME = 'field_reports';

const STORAGE_KEY_PENDING = 'bhujanrakshak_pending_reports';
const STORAGE_KEY_ACTIVE = 'bhujanrakshak_active_reports';

// Initial realistic default reports across North East India
export const INITIAL_HAZARD_REPORTS = [
  {
    id: 'hz-init-01',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    latitude: 25.1852,
    longitude: 92.3564,
    location_name: 'Sonapur Tunnel Bypass (Meghalaya)',
    corridor: 'NH-6',
    report_type: 'mountain_crack',
    description: 'Severe transverse mountain crack (18cm wide) cutting across cliff face and northbound lane. Mud slurry running down cutting slope.',
    severity: 'Critical',
    crack_width_cm: 18,
    crack_length_m: 35,
    climate_condition: null,
    reporter_name: 'Capt. R. Sangma (SDRF Patrol)',
    sync_status: 'synced',
    image_data: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'hz-init-02',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    latitude: 23.8293,
    longitude: 92.7176,
    location_name: 'Bawngkawn Hill Slopes (Aizawl)',
    corridor: 'NH-44',
    report_type: 'mountain_crack',
    description: 'Embankment toe scouring caused by hillside drainage overflow. Retaining wall showing 5-degree tilt with 9cm tension fractures.',
    severity: 'Warning',
    crack_width_cm: 9,
    crack_length_m: 14,
    climate_condition: null,
    reporter_name: 'Lalramchhana (PWD Field Inspector)',
    sync_status: 'synced',
    image_data: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'hz-init-03',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    latitude: 25.6835,
    longitude: 93.7548,
    location_name: 'Kohima-Dimapur Gorge km 42',
    corridor: 'NH-29',
    report_type: 'mountain_crack',
    description: 'Active mountain slope shear creeping into roadway. Loose boulders overhanging cliff face after continuous rainfall.',
    severity: 'Critical',
    crack_width_cm: 32,
    crack_length_m: 48,
    climate_condition: null,
    reporter_name: 'T. Jamir (Citizen Scout)',
    sync_status: 'synced',
    image_data: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'hz-init-04',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    latitude: 27.0543,
    longitude: 88.4682,
    location_name: 'Teesta Valley 29th Mile (Sikkim)',
    corridor: 'NH-10',
    report_type: 'climate_weather',
    description: 'Torrential cloudburst precipitation causing instant flash-flood surge in mountain gullies. Zero visibility along river gorge.',
    severity: 'Critical',
    crack_width_cm: null,
    crack_length_m: null,
    climate_condition: 'Cloudburst / Torrential Rain',
    reporter_name: 'Dorjee Lepcha (Hill Taxi Association)',
    sync_status: 'synced',
    image_data: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'hz-init-05',
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    latitude: 26.1105,
    longitude: 91.8720,
    location_name: 'Jorabat Hill Drainage Culvert',
    corridor: 'NH-37',
    report_type: 'climate_weather',
    description: 'Prolonged extreme rainfall (82mm) filling natural streams with mud silt runoff. Dense fog and cascading waterfall over highway.',
    severity: 'Warning',
    crack_width_cm: null,
    crack_length_m: null,
    climate_condition: 'Flash Flood / River Swell',
    reporter_name: 'B. Gogoi (Citizen Observer)',
    sync_status: 'synced',
    image_data: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80'
  }
];

// =========================================================================
// 1. IndexedDB Helper for High-Capacity Offline Storage in Hill Dead Zones
// =========================================================================
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sync_status', 'sync_status', { unique: false });
        store.createIndex('report_type', 'report_type', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.warn('[BhujanRakshak] IndexedDB open error, using LocalStorage fallback:', e);
      resolve(null);
    };
  });
}

async function putReportToIndexedDB(report) {
  try {
    const db = await openDatabase();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(report);
  } catch (err) {
    console.warn('[BhujanRakshak] Failed to write to IndexedDB:', err);
  }
}

// =========================================================================
// 2. Pending Offline Reports Management
// =========================================================================

/**
 * Retrieve pending offline reports waiting to sync to PostgreSQL
 */
export function getPendingLocalReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading pending reports:', err);
    return [];
  }
}

/**
 * Save a report locally in pending queue (Offline Hill Mode)
 * Writes to both LocalStorage metadata index & IndexedDB for large image data
 */
export function savePendingLocalReport(report) {
  try {
    const pending = getPendingLocalReports();
    const newReport = {
      ...report,
      id: report.id || 'offline-' + Date.now(),
      created_at: report.created_at || new Date().toISOString(),
      offline_captured_at: new Date().toISOString(),
      sync_status: 'pending',
      saved_offline_at: new Date().toISOString()
    };
    pending.unshift(newReport);
    localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));

    // Also update active cache so map and feed display it immediately
    const active = getAllActiveReports();
    active.unshift(newReport);
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(active));

    // Write full payload (with full-size compressed image) into IndexedDB
    putReportToIndexedDB(newReport);

    return newReport;
  } catch (err) {
    console.error('Error saving pending report:', err);
    return null;
  }
}

/**
 * Retrieve all active reports (synced + pending)
 */
export function getAllActiveReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(INITIAL_HAZARD_REPORTS));
      return [...INITIAL_HAZARD_REPORTS];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading active reports:', err);
    return [...INITIAL_HAZARD_REPORTS];
  }
}

/**
 * Synchronize all pending offline reports to PostgreSQL (via Supabase)
 * Called automatically when network reconnects or on manual "Sync to Cloud"
 */
export async function syncPendingReports() {
  const pending = getPendingLocalReports();
  if (!pending || pending.length === 0) {
    return { syncedCount: 0, failedCount: 0, remainingPending: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remainingPending = [];

  const activeReports = getAllActiveReports();

  for (const report of pending) {
    try {
      const { data, error } = await insertFieldReport(report);
      if (!error) {
        syncedCount++;
        const syncedTimestamp = new Date().toISOString();
        
        // Update status in active reports list
        const idx = activeReports.findIndex(r => r.id === report.id);
        if (idx !== -1) {
          activeReports[idx] = {
            ...activeReports[idx],
            id: data?.id || activeReports[idx].id,
            sync_status: 'synced',
            synced_at: syncedTimestamp
          };
        }

        // Update in IndexedDB as synced
        putReportToIndexedDB({
          ...report,
          id: data?.id || report.id,
          sync_status: 'synced',
          synced_at: syncedTimestamp
        });
      } else {
        failedCount++;
        remainingPending.push(report);
      }
    } catch (err) {
      console.error('Sync attempt failed for report:', report.id, err);
      failedCount++;
      remainingPending.push(report);
    }
  }

  // Save remaining pending queue
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(remainingPending));
  // Update active cache with newly synced statuses
  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeReports));

  return { syncedCount, failedCount, remainingPending: remainingPending.length };
}

/**
 * Save direct online report when network is present
 */
export function addDirectOnlineReport(report) {
  const activeReports = getAllActiveReports();
  const fullReport = {
    ...report,
    id: report.id || 'rep-' + Date.now(),
    created_at: report.created_at || new Date().toISOString(),
    sync_status: 'synced',
    synced_at: new Date().toISOString()
  };
  activeReports.unshift(fullReport);
  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeReports));
  putReportToIndexedDB(fullReport);
  return fullReport;
}
