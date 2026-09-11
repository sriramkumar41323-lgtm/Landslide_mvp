import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  RefreshCw, 
  ShieldAlert, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter,
  Flame,
  Radio,
  UserPlus
} from 'lucide-react';
import { 
  fetchAlertHistory, 
  subscribeToAlertLog, 
  triggerBackendPipeline, 
  subscribePhoneNumber 
} from '../services/supabaseClient';

export default function AlertLogPanel({ isOpen, onClose, monitoredLocations = [] }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  
  // Subscriber form state
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [subFeedback, setSubFeedback] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAlertHistory(50);
      if (data) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }

    // Subscribe to realtime alert log inserts from Supabase
    const unsubscribe = subscribeToAlertLog((newAlert) => {
      setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  // Set default location for subscriber dropdown
  useEffect(() => {
    if (monitoredLocations.length > 0 && !subLocation) {
      setSubLocation(monitoredLocations[0].name || monitoredLocations[0].location_name);
    }
  }, [monitoredLocations, subLocation]);

  const handleManualTrigger = async () => {
    setIsTriggering(true);
    try {
      await triggerBackendPipeline();
      setTimeout(() => {
        loadAlerts();
        setIsTriggering(false);
      }, 1500);
    } catch (err) {
      console.error('Trigger failed:', err);
      setIsTriggering(false);
    }
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (!subPhone || !subLocation) return;
    try {
      const res = await subscribePhoneNumber(subName || 'Civic Subscriber', subPhone, subLocation);
      setSubFeedback({ type: 'success', msg: `Subscribed ${subPhone} for alerts at ${subLocation}!` });
      setTimeout(() => {
        setSubFeedback(null);
        setShowSubscribeModal(false);
        setSubName('');
        setSubPhone('');
      }, 2000);
    } catch (err) {
      setSubFeedback({ type: 'error', msg: 'Subscription failed: ' + err.message });
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return (a.risk_level || '').toUpperCase() === filterLevel;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600/20 text-red-400 rounded border border-red-500/30">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Emergency Alert Log</h2>
              <p className="text-[11px] text-slate-400">Mobile Push (ntfy.sh) & SMS Dispatch</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Phone Notification Banner */}
        <div className="px-3 py-2 bg-gradient-to-r from-sky-900 to-indigo-900 text-white text-xs flex items-center justify-between border-b border-sky-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span className="text-[11px] font-medium">Free Live Push:</span>
            <code className="text-[11px] bg-black/40 px-1.5 py-0.5 rounded font-mono text-sky-300">ntfy.sh/bhujanrakshak_alerts</code>
          </div>
          <a 
            href="https://ntfy.sh/bhujanrakshak_alerts" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] bg-sky-500 hover:bg-sky-400 text-white font-bold px-2 py-0.5 rounded transition shadow"
          >
            Subscribe 🔔
          </a>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                filterLevel === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterLevel('HIGH')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                filterLevel === 'HIGH' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              High
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualTrigger}
              disabled={isTriggering}
              title="Trigger immediate AI re-evaluation cycle across all NER locations"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Evaluating...' : 'Eval Now'}</span>
            </button>

            <button
              onClick={() => setShowSubscribeModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ SMS Sub</span>
            </button>

            <button
              onClick={loadAlerts}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subscribe Modal Dialog */}
        {showSubscribeModal && (
          <div className="p-3.5 bg-sky-50 border-b border-sky-200 text-xs animate-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sky-950 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                Register for Landslide SMS Alerts
              </span>
              <button onClick={() => setShowSubscribeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleSubscribeSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Full Name / Authority Designation"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-sky-500"
              />
              <input
                type="tel"
                placeholder="Phone Number (e.g. +919876543210)"
                required
                value={subPhone}
                onChange={(e) => setSubPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
              />
              <select
                value={subLocation}
                onChange={(e) => setSubLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-sky-500"
              >
                {monitoredLocations.length > 0 ? (
                  monitoredLocations.map((l, i) => (
                    <option key={i} value={l.name || l.location_name}>
                      {l.name || l.location_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Noney (Tupul Railway Corridor)">Noney (Tupul Railway Corridor)</option>
                    <option value="Aizawl Melthum Ridge">Aizawl Melthum Ridge</option>
                    <option value="East Khasi Hills (Mawsynram)">East Khasi Hills (Mawsynram)</option>
                    <option value="Sonapur Tunnel Corridor (NH-6)">Sonapur Tunnel Corridor (NH-6)</option>
                  </>
                )}
              </select>

              {subFeedback && (
                <div className={`p-2 rounded text-[11px] font-semibold ${
                  subFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {subFeedback.msg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow"
              >
                Confirm SMS Subscription
              </button>
            </form>
          </div>
        )}

        {/* Alert List Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-600">No active alerts match criteria</p>
              <p className="text-xs text-slate-400 mt-1">Monitored sectors are currently within nominal thresholds</p>
            </div>
          ) : (
            filteredAlerts.map((alert, idx) => {
              const isHigh = (alert.risk_level || '').toUpperCase() === 'HIGH';
              const isMedium = (alert.risk_level || '').toUpperCase() === 'MEDIUM';
              const riskPct = alert.risk_score ? (alert.risk_score <= 1.0 ? (alert.risk_score * 100).toFixed(1) : alert.risk_score) : '—';
              const triggerTime = alert.triggered_at 
                ? new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Just now';
              const triggerDate = alert.triggered_at 
                ? new Date(alert.triggered_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : '';

              return (
                <div 
                  key={alert.id || idx}
                  className={`p-3 rounded-lg border shadow-sm transition-all ${
                    isHigh 
                      ? 'bg-red-50/80 border-red-200 hover:border-red-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        isHigh ? 'bg-red-600 text-white' : isMedium ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {alert.risk_level || 'Alert'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {alert.location_name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {triggerDate} {triggerTime}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      AI Landslide Risk: <strong className={isHigh ? 'text-red-700' : 'text-slate-800'}>{riskPct}%</strong>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <span>Channel:</span>
                      <strong className={`font-bold ${alert.channel === 'NTFY_PUSH' ? 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded' : 'text-slate-700'}`}>
                        {alert.channel === 'NTFY_PUSH' ? '📱 NTFY PUSH' : (alert.channel || 'SMS')}
                      </strong>
                    </span>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                    <div className="text-slate-500 truncate max-w-[200px]">
                      To: {alert.recipient && alert.recipient.startsWith('ntfy.sh') ? (
                        <a 
                          href={`https://${alert.recipient}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono text-indigo-600 underline font-semibold hover:text-indigo-800"
                        >
                          {alert.recipient}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-700">{alert.recipient || 'Subscribed Authorities'}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      (alert.status || '').startsWith('SENT') || alert.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : alert.status === 'SIMULATED_SENT'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span>Debounce interval: 3 hours</span>
          <span className="font-mono font-medium text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Realtime Connected
          </span>
        </div>

      </div>
    </div>
  );
}
