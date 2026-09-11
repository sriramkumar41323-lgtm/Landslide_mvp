import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Camera, 
  Play, 
  MapPin, 
  AlertTriangle, 
  PlusCircle, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Mountain,
  CloudRain,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  Eye
} from 'lucide-react';
import { CITIZEN_FEED_REPORTS } from '../data/citizenReportsData';

export default function CitizenReportingFeed({
  reports = CITIZEN_FEED_REPORTS,
  selectedReportId,
  onSelectReport,
  onOpenReportModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mountain_crack' | 'climate_weather' | 'pending'
  const [previewImage, setPreviewImage] = useState(null);

  const pendingCount = reports.filter(r => r.sync_status === 'pending').length;
  const syncedCount = reports.filter(r => r.sync_status === 'synced').length;

  const filteredReports = reports.filter(item => {
    // Search query match
    const matchesSearch = 
      (item.location || item.location_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.corridor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category filter match
    if (activeFilter === 'mountain_crack') {
      return item.report_type === 'mountain_crack' || item.crackWidth || item.crack_width_cm;
    }
    if (activeFilter === 'climate_weather') {
      return item.report_type === 'climate_weather' || item.climate_condition;
    }
    if (activeFilter === 'pending') {
      return item.sync_status === 'pending';
    }
    return true;
  });

  return (
    <aside className="w-64 md:w-72 xl:w-84 h-full flex flex-col bg-white border-r border-slate-200 text-slate-800 select-none shadow-sm z-20 shrink-0">
      
      {/* 1. Control Center Top Header with Live Cloud Indicator */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-slate-900 font-sans uppercase">
              Control Center Feed
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              PostgreSQL Cloud: {syncedCount} | Pending: {pendingCount}
            </p>
          </div>
        </div>
        <button 
          onClick={onOpenReportModal}
          title="Submit new geo-report"
          className="p-1 rounded text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search Analyst or Map Bar */}
      <div className="p-2.5 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cracks, location, corridor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="px-2 py-1.5 bg-slate-50/90 border-b border-slate-200 flex gap-1 text-[11px] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2 py-1 rounded font-medium whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({reports.length})
        </button>

        <button
          onClick={() => setActiveFilter('mountain_crack')}
          className={`px-2 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
            activeFilter === 'mountain_crack'
              ? 'bg-amber-600 text-white font-bold'
              : 'text-amber-800 hover:bg-amber-100/60'
          }`}
        >
          <Mountain className="w-3 h-3" />
          <span>Cracks</span>
        </button>

        <button
          onClick={() => setActiveFilter('climate_weather')}
          className={`px-2 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
            activeFilter === 'climate_weather'
              ? 'bg-sky-600 text-white font-bold'
              : 'text-sky-800 hover:bg-sky-100/60'
          }`}
        >
          <CloudRain className="w-3 h-3" />
          <span>Climate</span>
        </button>

        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-2 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
            activeFilter === 'pending'
              ? 'bg-amber-700 text-white font-bold'
              : 'text-amber-700 hover:bg-amber-100/60'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Hill Queue ({pendingCount})</span>
        </button>
      </div>

      {/* 4. Scrollable Feed of Disaster Hazard Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 divide-y-0">
        {filteredReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hazard reports match the selected filter.
          </div>
        ) : (
          filteredReports.map((report) => {
            const isSelected = selectedReportId === report.id;
            const isMountainCrack = report.report_type === 'mountain_crack' || report.crackWidth || report.crack_width_cm;
            const isPendingSync = report.sync_status === 'pending';

            const imageUrl = (report.image && report.image.length > 10) 
              ? report.image 
              : (report.image_data && report.image_data.length > 10) 
              ? report.image_data 
              : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80';

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className={`group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 bg-white ${
                  isSelected 
                    ? 'border-sky-500 shadow-md ring-2 ring-sky-500/20' 
                    : isPendingSync
                    ? 'border-amber-400 bg-amber-50/20 hover:border-amber-500'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Photo Thumbnail with Overlays */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={report.title || 'Hazard Report'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Video Play Icon Overlay */}
                  {report.hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <div className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Category Pill (Top Left) */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${
                      isMountainCrack ? 'bg-amber-600' : 'bg-sky-600'
                    }`}>
                      {isMountainCrack ? <Mountain className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
                      <span>{isMountainCrack ? 'Mountain Crack' : 'Climate Event'}</span>
                    </span>
                  </div>

                  {/* Severity pill (Top Right) */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white shadow-sm ${
                      report.severity === 'Critical' ? 'bg-red-600' : 'bg-amber-600'
                    }`}>
                      {report.severity}
                    </span>
                  </div>

                  {/* Click to inspect image button (Lower Right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage({ url: imageUrl, report });
                    }}
                    title="Inspect High-Res Photo"
                    className="absolute bottom-2 right-2 flex items-center justify-center w-6 h-6 rounded bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Geo-tagged Tag (Lower Left) */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9px] font-mono text-white">
                    <Camera className="w-3 h-3 text-slate-300" />
                    <span>{report.latitude ? `${report.latitude}, ${report.longitude}` : 'Geo-tagged'}</span>
                  </div>
                </div>

                {/* Card Meta & Description */}
                <div className="p-2.5">
                  {/* Sync Status Badge */}
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                    {isPendingSync ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Saved Locally (Pending Cloud Sync)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PostgreSQL Synced</span>
                      </span>
                    )}

                    <span className="text-slate-400">{report.timeAgo || 'Recent'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 mb-1 truncate">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{report.location || report.location_name}</span>
                  </div>
                  
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Specific Metric Tagging */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    {isMountainCrack ? (
                      <span>
                        Fissure: <strong className="text-red-600">{report.crackWidth || `${report.crack_width_cm || 18} cm`}</strong>
                      </span>
                    ) : (
                      <span className="text-sky-700 font-semibold truncate max-w-[150px]">
                        {report.climate_condition || 'Heavy Precipitation'}
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-semibold">
                      {report.corridor || 'NH-6'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button to Report Hazard */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onOpenReportModal}
          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Report Hazard (Photo & GPS)</span>
        </button>
      </div>

      {/* Image Inspection Modal / Lightbox */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#0a1526] rounded-xl border border-slate-700 overflow-hidden shadow-2xl text-white"
          >
            <div className="p-3 bg-[#070e1c] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold font-mono">
                  {previewImage.report.location || previewImage.report.location_name}
                </span>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <img 
                src={previewImage.url} 
                alt="Hazard Inspection" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3.5 bg-[#0a1526] text-xs space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-sky-300">
                  Coordinates: {previewImage.report.latitude}, {previewImage.report.longitude}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  previewImage.report.sync_status === 'synced' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {previewImage.report.sync_status === 'synced' ? 'PostgreSQL Synced' : 'Saved Locally (Pending Sync)'}
                </span>
              </div>
              <p className="text-slate-300 leading-snug">
                {previewImage.report.description}
              </p>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
