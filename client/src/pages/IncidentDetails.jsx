/**
 * pages/IncidentDetails.jsx
 *
 * Comprehensive case report view for filed safety incidents.
 * Includes status workflow timeline, GridFS photo evidence, and embedded mini-map location.
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lightbulb,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Camera,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, Badge, Button } from '../components/ui';
import { createCustomPin } from '../utils/mapIcons';

const CATEGORY_META = {
  poor_lighting: { label: 'Poor Lighting', icon: Lightbulb },
  harassment: { label: 'Harassment', icon: AlertTriangle },
  unsafe_intersection: { label: 'Unsafe Intersection', icon: ShieldAlert },
  suspicious_activity: { label: 'Suspicious Activity', icon: Eye },
  other: { label: 'Other Hazard', icon: MapPin },
};

const STATUS_STEPS = [
  { key: 'reported', label: 'Reported', desc: 'Filed into community dispatch queue' },
  { key: 'under_review', label: 'Under Review', desc: 'Triaged by verified safety authorities' },
  { key: 'resolved', label: 'Resolved', desc: 'Hazard remediated or closed' },
];

const IncidentDetails = () => {
  const { id } = useParams();
  const routeState = useLocation().state;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await api.get(`/incidents/${id}`);
        setIncident(res.data.data.incident);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve incident records.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  if (isLoading) return <LoadingSpinner message="Retrieving case intelligence record…" />;

  if (error || !incident) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] flex items-center justify-center p-4">
        <Card elevated className="max-w-md text-center p-8 space-y-4">
          <AlertCircle size={36} className="text-[var(--color-danger)] mx-auto" strokeWidth={1.8} />
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            Case Record Unavailable
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {error || 'The requested incident identifier does not exist or has been archived.'}
          </p>
          <Link to="/map" className="inline-block pt-2">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft size={14} />
              Return to Safety Map
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [lngVal, latVal] = incident.location.coordinates;
  const categoryMeta = CATEGORY_META[incident.category] || CATEGORY_META.other;
  const CategoryIcon = categoryMeta.icon;

  const getStepStatus = (stepKey) => {
    const current = incident.status;
    if (current === stepKey) return 'active';
    if (current === 'resolved') return 'completed';
    if (current === 'under_review' && stepKey === 'reported') return 'completed';
    return 'pending';
  };

  // Check if the current user can delete (must be the reporter OR an admin)
  const isOwner  = user && incident.reportedBy && incident.reportedBy._id === user._id;
  const isAdmin  = user && user.role === 'admin';
  const canDelete = isOwner || isAdmin;

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/incidents/${id}`);
      navigate('/map', { state: { deleted: true } });
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete. Please try again.');
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Top Navigation Breadcrumb ───────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            <span>Back to Safety Map</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
              Case Ref: {incident._id.slice(-8).toUpperCase()}
            </span>

            {/* Delete button — only visible to the reporter or an admin */}
            {canDelete && !deleteConfirm && (
              <button
                id="delete-incident-btn"
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 px-2.5 py-1.5 rounded-lg transition-colors border border-[var(--color-danger)]/30"
              >
                <Trash2 size={13} strokeWidth={2} />
                Delete Report
              </button>
            )}
          </div>
        </div>

        {/* ── Delete Confirmation Banner ────────────────────────────── */}
        {deleteConfirm && (
          <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <Trash2 size={18} className="text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-danger)]">Delete this incident report?</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  This action is permanent. The report, associated location data, and any uploaded photo will be removed and cannot be recovered.
                </p>
                {deleteError && (
                  <p className="text-xs text-[var(--color-danger)] mt-2 font-medium">{deleteError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <button
                id="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="text-xs font-bold px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
              <button
                onClick={() => { setDeleteConfirm(false); setDeleteError(''); }}
                className="text-xs font-medium px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Just Created Success Banner ─────────────────────────────── */}
        {routeState?.justCreated && (
          <div className="p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/25 rounded-xl flex items-start gap-3 text-xs text-[var(--color-success)]">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <div>
              <span className="font-semibold block mb-0.5">Safety report successfully registered</span>
              Nearby neighborhood residents have been dispatched proximity alerts based on their configured alert radiuses.
            </div>
          </div>
        )}

        {/* ── Primary Case Header ─────────────────────────────────────── */}
        <Card elevated noPadding className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.status} size="md" />
              <Badge variant="neutral" size="md" className="gap-1.5">
                <CategoryIcon size={14} strokeWidth={2} />
                <span>{categoryMeta.label}</span>
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(incident.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {new Date(incident.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {incident.title}
          </h1>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
            {incident.description}
          </p>
        </Card>

        {/* ── Two-Column Layout: Evidence/Details vs Status & Map ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left 2 Cols: Evidence & Location Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Photo Evidence (if uploaded) */}
            {incident.photoFileId && (
              <Card elevated noPadding className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <Camera size={14} strokeWidth={2.2} />
                  <span>Verified Photo Documentation</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] max-h-96">
                  <img
                    src={`/api/files/${incident.photoFileId}`}
                    alt="Filed incident photographic proof"
                    className="w-full h-full object-contain max-h-96 mx-auto"
                    loading="lazy"
                  />
                </div>
              </Card>
            )}

            {/* Embedded Mini Location Map */}
            <Card elevated noPadding className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <MapPin size={14} strokeWidth={2.2} />
                  <span>Geospatial Coordinates</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${latVal},${lngVal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Google Maps</span>
                  <ExternalLink size={12} strokeWidth={2} />
                </a>
              </div>

              <div className="h-56 rounded-xl overflow-hidden border border-[var(--color-border)] relative">
                <MapContainer
                  center={[latVal, lngVal]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  dragging={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker
                    position={[latVal, lngVal]}
                    icon={createCustomPin(incident.category, true)}
                  />
                </MapContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-mono px-1">
                <span>Latitude: {latVal.toFixed(6)}</span>
                <span>Longitude: {lngVal.toFixed(6)}</span>
              </div>
            </Card>

          </div>

          {/* Right Col: Status Progression Stepper & Reporter Meta */}
          <div className="space-y-6">

            {/* Status Workflow Stepper */}
            <Card elevated noPadding className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Resolution Workflow
              </h3>

              <div className="space-y-4 relative pl-2">
                {STATUS_STEPS.map((step, idx) => {
                  const statusState = getStepStatus(step.key);
                  const isLast = idx === STATUS_STEPS.length - 1;

                  return (
                    <div key={step.key} className="relative flex items-start gap-3">
                      {/* Connecting Line */}
                      {!isLast && (
                        <div
                          className={`absolute left-3 top-6 bottom-[-16px] w-[2px] ${
                            statusState === 'completed'
                              ? 'bg-[var(--color-success)]/40'
                              : 'bg-[var(--color-border)]'
                          }`}
                        />
                      )}

                      {/* Step Indicator Node */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[11px] font-bold border transition-colors ${
                          statusState === 'completed'
                            ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40'
                            : statusState === 'active'
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                        }`}
                      >
                        {statusState === 'completed' ? (
                          <CheckCircle2 size={13} strokeWidth={2.5} />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={`text-xs font-semibold leading-none ${
                            statusState === 'active'
                              ? 'text-[var(--color-primary)]'
                              : statusState === 'completed'
                              ? 'text-[var(--color-text-primary)]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Reporter & Verification Dossier */}
            <Card elevated noPadding className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Filing Integrity
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">Reporter Identity</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {incident.isAnonymous ? 'Verified Resident (Anonymous)' : (incident.reportedBy?.name || 'Community Member')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">Privacy Protocol</span>
                  <span className="inline-flex items-center gap-1 text-[var(--color-success)] font-medium">
                    <UserCheck size={12} />
                    {incident.isAnonymous ? 'Protected' : 'Public Attribution'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--color-text-secondary)]">Geospatial Validation</span>
                  <span className="text-[var(--color-primary)] font-mono">
                    2dsphere Verified
                  </span>
                </div>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
};

export default IncidentDetails;
