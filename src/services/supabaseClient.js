import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean base URL if user accidentally included '/rest/v1' or trailing slash
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Check if credentials have been properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl.startsWith('https://')
);

// Initialize client if configured, otherwise null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Boilerplate helper to insert a field hazard report to PostgreSQL via Supabase
 * Handles Mountain Cracks and Climate / Weather observations
 * Returns { data, error, isMock }
 */
export async function insertFieldReport(reportData) {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        latitude: Number(reportData.latitude),
        longitude: Number(reportData.longitude),
        location_name: reportData.location_name || 'NE India Corridor',
        corridor: reportData.corridor || 'NH-6',
        description: reportData.description,
        severity: reportData.severity || 'Warning',
        report_type: reportData.report_type || 'mountain_crack',
        crack_width_cm: reportData.crack_width_cm ? Number(reportData.crack_width_cm) : null,
        crack_length_m: reportData.crack_length_m ? Number(reportData.crack_length_m) : null,
        climate_condition: reportData.climate_condition || null,
        image_data: reportData.image_data || null,
        reporter_name: reportData.reporter_name || 'Anonymous Citizen / Scout',
        reporter_phone: reportData.reporter_phone || null,
        offline_captured_at: reportData.offline_captured_at || reportData.saved_offline_at || null,
        synced_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('field_reports')
        .insert([payload])
        .select();

      if (error) {
        console.warn('[Supabase PostgreSQL] Insert error:', error.message);
        return { data: null, error, isMock: false };
      }
      return { data: data?.[0] || reportData, error: null, isMock: false };
    } catch (err) {
      console.error('[Supabase PostgreSQL] Network exception:', err);
      return { data: null, error: err, isMock: false };
    }
  }

  // Graceful Mock Fallback (when PostgreSQL / Supabase credentials are not yet added to .env)
  console.info('[BhujanRakshak] PostgreSQL/Supabase not configured in .env. Mocking remote cloud push for report:', reportData.location_name);
  const mockInserted = {
    id: 'sb-' + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    ...reportData,
    synced_at: new Date().toISOString()
  };
  return { data: mockInserted, error: null, isMock: true };
}

/**
 * Helper to fetch recent field reports from PostgreSQL via Supabase
 */
export async function fetchFieldReports() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('field_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('[Supabase PostgreSQL] Failed to fetch remote reports:', err.message);
      return { data: [], error: err };
    }
  }
  return { data: [], error: null };
}

export const FASTAPI_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Realtime listener: instantly triggers callback when any device submits a report
 */
export function subscribeToFieldReports(onNewReport) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('realtime_field_reports')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'field_reports' },
      (payload) => {
        if (onNewReport && (payload.new || payload.old)) {
          onNewReport(payload.new || payload.old);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch current evaluated risk records for all monitored NER locations
 * Queries Supabase location_risk table with fallback to FastAPI bridge server
 */
export async function fetchLocationRisks() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('location_risk')
        .select('*');
      if (!error && data && data.length > 0) {
        return { data, source: 'supabase', error: null };
      }
    } catch (err) {
      console.warn('[Supabase] location_risk fetch exception:', err.message);
    }
  }

  // Fallback: Query FastAPI bridge server
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/locations`);
    if (res.ok) {
      const json = await res.json();
      return { data: json.data || [], source: 'fastapi', error: null };
    }
  } catch (err) {
    console.debug('[FastAPI] Could not connect to bridge server:', err.message);
  }

  return { data: [], source: 'fallback', error: null };
}

/**
 * Realtime listener for location_risk table
 * Updates heatmaps and risk zones live when FastAPI writes new scores
 */
export function subscribeToLocationRisk(onRiskChange) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('realtime_location_risk')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'location_risk' },
      (payload) => {
        if (onRiskChange && payload.new) {
          onRiskChange(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch recent alert history from FastAPI /alerts or Supabase alert_log
 */
export async function fetchAlertHistory(limit = 50) {
  // Try FastAPI first
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/alerts?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      return { data: json.alerts || [], error: null };
    }
  } catch (err) {
    console.debug('[FastAPI /alerts] Fallback to Supabase:', err.message);
  }

  // Supabase direct query
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alert_log')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(limit);
      if (!error && data) {
        return { data, error: null };
      }
    } catch (err) {
      console.warn('[Supabase alert_log] error:', err.message);
    }
  }

  return { data: [], error: null };
}

/**
 * Realtime listener for alert_log table
 */
export function subscribeToAlertLog(onNewAlert) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('realtime_alert_log')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alert_log' },
      (payload) => {
        if (onNewAlert && payload.new) {
          onNewAlert(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Trigger backend pipeline immediately for on-demand demo testing
 */
export async function triggerBackendPipeline() {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/trigger-pipeline`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[FastAPI trigger-pipeline] error:', err.message);
  }
  return { status: 'offline', message: 'FastAPI server not reachable' };
}

/**
 * Subscribe a phone number for SMS early warning alerts
 */
export async function subscribePhoneNumber(name, phone, locationName) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, location_name: locationName })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('FastAPI subscribe fallback:', err.message);
  }

  // Direct Supabase insert
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .insert([{ name, phone, location_name: locationName }])
        .select();
      return { status: 'success', data: data?.[0] };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }

  return { status: 'simulated', message: `Subscribed ${phone} to ${locationName}` };
}

