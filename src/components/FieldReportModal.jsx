import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Clock, 
  Navigation,
  RefreshCw,
  Mountain,
  CloudRain
} from 'lucide-react';

export default function FieldReportModal({
  isOpen,
  onClose,
  onSubmitReport,
  isOffline,
  selectedCoord,
  onClearSelectedCoord
}) {
  const [reportType, setReportType] = useState('mountain_crack'); // 'mountain_crack' | 'climate_weather'
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [note, setNote] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Sync selected map coordinate from user clicking the GIS map
  useEffect(() => {
    if (selectedCoord) {
      setLatitude(selectedCoord.lat.toString());
      setLongitude(selectedCoord.lng.toString());
      setGeoStatusMsg(`Map coordinate selected: ${selectedCoord.lat}, ${selectedCoord.lng}`);
    }
  }, [selectedCoord]);

  // Handle Image File selection & compression into Base64 (Canvas optimization)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Plain watermark on image for verification
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(10, height - 36, width - 20, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = '500 12px sans-serif';
        const geoText = `GPS: ${latitude || 'Pending'}, ${longitude || '...'} | ${reportType === 'mountain_crack' ? 'Mountain Crack' : 'Climate Event'}`;
        ctx.fillText(geoText, 18, height - 18);

        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(base64Data);
        setImageData(base64Data);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Browser Geolocation API Handler (offline GPS compatible)
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setGeoStatusMsg('Querying device GPS satellites...');

    if (!('geolocation' in navigator)) {
      setGeoStatusMsg('Geolocation is not supported by your browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        setGeoStatusMsg(`GPS acquired: ${lat}, ${lng} (±${Math.round(position.coords.accuracy)}m)`);
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        // Default to high-risk Sonapur ridge for demonstration if GPS denied
        setLatitude('25.1852');
        setLongitude('92.3564');
        setGeoStatusMsg('GPS signal weak in valley. Filled Sonapur Ridge (NH-6) coordinates.');
        setIsGettingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Quick helper to fill a hill hotspot coordinate
  const setHotspot = (lat, lng, locName) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setGeoStatusMsg(`Set to ${locName} (${lat}, ${lng})`);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageData && !imagePreview) {
      alert('Please take or upload a photo of the hazard.');
      return;
    }
    if (!latitude || !longitude) {
      alert('Please acquire GPS location or pick coordinates on the map.');
      return;
    }

    setIsSubmitting(true);

    const isCrack = reportType === 'mountain_crack';
    const reportPayload = {
      report_type: reportType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location_name: `Hill Hazard (${latitude}, ${longitude})`,
      corridor: 'NH-6',
      description: note.trim() 
        ? note.trim() 
        : (isCrack ? 'Observed mountain rock fracture / slope crack' : 'Extreme climate & weather condition observed in hill area'),
      severity: isCrack ? 'Critical' : 'Warning',
      crack_width_cm: isCrack ? 15 : null,
      climate_condition: !isCrack ? 'Severe Weather / Cloudburst' : null,
      image_data: imageData || imagePreview,
      image: imageData || imagePreview,
      created_at: new Date().toISOString()
    };

    try {
      const result = await onSubmitReport(reportPayload);
      setSubmitSuccess({
        isOffline,
        report: result
      });
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmitSuccess(null);
        setImagePreview(null);
        setImageData(null);
        setNote('');
        if (onClearSelectedCoord) onClearSelectedCoord();
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      alert('Failed to submit report. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Report Hazard
            </h2>
            <p className="text-xs text-slate-500">
              Upload photo with hill geolocation
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Plain Offline/Online Status Pill */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOffline 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOffline ? 'Offline (Local)' : 'Online (Cloud)'}</span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Splash */}
        {submitSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hazard Report Saved</h3>
            <p className="text-xs text-slate-600 max-w-sm">
              {submitSuccess.isOffline 
                ? 'Your photo and GPS coordinates are stored safely on your device (IndexedDB) and will sync to the Control Center when network connects.' 
                : 'Your report and photo have been synced directly to the Control Center dashboard.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
            
            {/* 1. Category Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('mountain_crack')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    reportType === 'mountain_crack'
                      ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Mountain className="w-4 h-4 text-amber-700" />
                  <span>Mountain Crack</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('climate_weather')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    reportType === 'climate_weather'
                      ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CloudRain className="w-4 h-4 text-sky-700" />
                  <span>Climate / Weather</span>
                </button>
              </div>
            </div>

            {/* 2. Photo Upload (Only Image) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Hazard Photo</span>
                <span className="text-[11px] text-slate-400 font-normal">Required</span>
              </label>

              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 bg-slate-50 transition-colors">
                {imagePreview ? (
                  <div className="relative group">
                    <img 
                      src={imagePreview} 
                      alt="Hazard preview" 
                      className="w-full h-48 object-cover rounded-lg border border-slate-200" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageData(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white px-2 py-0.5 rounded text-[11px] font-medium">
                      Photo captured
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 cursor-pointer text-slate-500 hover:text-slate-700">
                    <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center mb-2 text-slate-600">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Take Photo or Upload Image
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Camera capture or gallery image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 3. Geolocation (Only Geo Location) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Geolocation</span>
                <span className="text-[11px] text-slate-400 font-normal">GPS coordinates</span>
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  <span>{isGettingLocation ? 'Locating GPS satellites...' : 'Get Current GPS Location'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 25.1852"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 92.3564"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                {geoStatusMsg && (
                  <div className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
                    {geoStatusMsg}
                  </div>
                )}

                {/* Quick Hotspot fill buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => setHotspot(25.1235, 92.3651, 'Sonapur Pass')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Sonapur
                  </button>
                  <button
                    type="button"
                    onClick={() => setHotspot(23.8293, 92.7176, 'Aizawl Ridge')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Aizawl
                  </button>
                  <button
                    type="button"
                    onClick={() => setHotspot(27.0543, 88.4682, 'Teesta Valley')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Teesta
                  </button>
                  <button
                    type="button"
                    onClick={() => setHotspot(25.6835, 94.1120, 'Kohima Ridge')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    Kohima
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Optional Quick Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Note</span>
                <span className="text-[11px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                placeholder="Brief detail (e.g. widening crack across road)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            {/* 5. Submit Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  isOffline
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isOffline ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Save Locally (Offline Hill Mode)</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit to Control Center</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 mt-2">
                {isOffline 
                  ? 'Stored on device storage. Will sync to PostgreSQL once network is restored.' 
                  : 'Direct push to PostgreSQL cloud database and Control Center map.'}
              </p>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
