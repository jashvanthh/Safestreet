/**
 * pages/IncidentDetails.jsx
 *
 * Shows a single incident fetched by ID from GET /api/incidents/:id
 * Key things to demonstrate:
 *   - Fetching on mount with useEffect (data-fetching pattern)
 *   - Conditional rendering: photo only if photoFileId exists
 *   - Photo URL: /api/files/:fileId — served by our GridFS streaming route
 *   - Anonymous display: reportedBy is already stripped server-side
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_LABELS = {
  poor_lighting:       '💡 Poor Lighting',
  harassment:          '⚠️ Harassment',
  unsafe_intersection: '🚦 Unsafe Intersection',
  suspicious_activity: '👁️ Suspicious Activity',
  other:               '📌 Other',
};

const IncidentDetails = () => {
  const { id }       = useParams();           // from /incidents/:id in App.jsx
  const routeState   = useLocation().state;  // { justCreated: true } from ReportIncident

  const [incident,  setIncident]  = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await api.get(`/incidents/${id}`);
        setIncident(res.data.data.incident);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load incident.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncident();
  }, [id]);   // Re-run if the ID in the URL changes

  if (isLoading) return <LoadingSpinner message="Loading incident…" />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link to="/" className="text-blue-400 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const [lngVal, latVal] = incident.location.coordinates;  // GeoJSON: [lng, lat] — swap for display

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success banner (only shown immediately after reporting) */}
        {routeState?.justCreated && (
          <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            ✅ Incident reported successfully! Nearby residents will be alerted.
          </div>
        )}

        {/* Back */}
        <Link to="/map" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">
          ← Back to Map
        </Link>

        {/* Main card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

          {/* Photo — only rendered if photoFileId exists */}
          {incident.photoFileId && (
            <div className="w-full h-56 overflow-hidden bg-slate-900">
              {/*
               * The src points to our GridFS streaming route.
               * GET /api/files/:fileId reads from MongoDB GridFS
               * and streams the image bytes back with Content-Type: image/jpeg
               */}
              <img
                src={`/api/files/${incident.photoFileId}`}
                alt="Incident photo"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="p-6 space-y-5">

            {/* Status + category row */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={incident.status} />
              <span className="text-slate-400 text-sm">
                {CATEGORY_LABELS[incident.category] || incident.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white">{incident.title}</h1>

            {/* Description */}
            <p className="text-slate-300 leading-relaxed">{incident.description}</p>

            {/* Meta row */}
            <div className="border-t border-slate-700 pt-4 space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Reported by</span>
                <span className="text-white">
                  {incident.isAnonymous ? 'Anonymous' : (incident.reportedBy?.name || 'Unknown')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="text-white font-mono text-xs">
                  {latVal.toFixed(5)}, {lngVal.toFixed(5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reported</span>
                <span className="text-white">
                  {new Date(incident.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            {/* Open in maps */}
            <a
              href={`https://www.google.com/maps?q=${latVal},${lngVal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              📍 Open in Google Maps →
            </a>

          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
