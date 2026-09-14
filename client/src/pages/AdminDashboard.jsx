/**
 * pages/AdminDashboard.jsx
 *
 * Operations Command Center for Municipal and Administrative Authorities.
 * Incident triage queue, status workflow transitions, aggregated telemetry,
 * and comprehensive case-inspection modal.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  Search,
  Eye,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Camera,
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Card, Button, Modal } from '../components/ui';
import { INCIDENT_CATEGORIES, INCIDENT_STATUSES } from '../utils/constants';

const CATEGORY_META = {
  poor_lighting: { label: 'Poor Lighting', icon: Lightbulb },
  harassment: { label: 'Harassment', icon: AlertTriangle },
  unsafe_intersection: { label: 'Unsafe Intersection', icon: ShieldAlert },
  suspicious_activity: { label: 'Suspicious Activity', icon: Eye },
  other: { label: 'Other Hazard', icon: MapPin },
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', search: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Case Review Modal State
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch aggregated telemetry ─────────────────────────────────────────────
  const fetchStats = () => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error('Failed to fetch admin stats:', err));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Fetch triage incidents ─────────────────────────────────────────────────
  const fetchIncidents = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);

    api.get(`/admin/incidents?${params}`)
      .then((res) => {
        setIncidents(res.data.data.incidents || []);
        setPagination(res.data.data.pagination || null);
      })
      .catch((err) => console.error('Failed to fetch admin incidents:', err))
      .finally(() => setIsLoading(false));
  }, [filters.category, filters.status, page]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // ── Update incident status ─────────────────────────────────────────────────
  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdatingId(incidentId);
    try {
      await api.patch(`/incidents/${incidentId}/status`, { status: newStatus });
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === incidentId ? { ...inc, status: newStatus } : inc))
      );
      if (selectedIncident?._id === incidentId) {
        setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
      }
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete incident ────────────────────────────────────────────────────────
  const handleDeleteIncident = async (incidentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this safety report?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/incidents/${incidentId}`);
      setIncidents((prev) => prev.filter((inc) => inc._id !== incidentId));
      setIsReviewOpen(false);
      setSelectedIncident(null);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete incident record');
    } finally {
      setIsDeleting(false);
    }
  };

  const openReviewModal = (inc) => {
    setSelectedIncident(inc);
    setIsReviewOpen(true);
  };

  // Filter incidents locally by search query
  const filteredIncidents = incidents.filter((inc) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      inc.title?.toLowerCase().includes(q) ||
      inc.description?.toLowerCase().includes(q) ||
      inc.reportedBy?.name?.toLowerCase().includes(q)
    );
  });

  const resolvedCount = stats?.byStatus?.find((s) => s._id === 'resolved')?.count || 0;
  const underReviewCount = stats?.byStatus?.find((s) => s._id === 'under_review')?.count || 0;
  const reportedCount = stats?.byStatus?.find((s) => s._id === 'reported')?.count || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Operations Header ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)] mb-1">
              <Shield size={14} strokeWidth={2.5} />
              Authority Operations Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Incident Triage & Operations
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Review community filings, advance case resolution states, and monitor neighborhood telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/25">
              <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
              Live Operations Mode
            </span>
          </div>
        </div>

        {/* ── Metric Snapshot Strip ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card elevated noPadding className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)] mb-2">
              <span>Total Filings</span>
              <Shield size={16} className="text-[var(--color-primary)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
              {stats?.totalIncidents ?? '—'}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              All time platform reports
            </div>
          </Card>

          <Card elevated noPadding className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)] mb-2">
              <span>Pending Review</span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-danger)]">
              {reportedCount}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Awaiting authority inspection
            </div>
          </Card>

          <Card elevated noPadding className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)] mb-2">
              <span>Under Review</span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-warning)]">
              {underReviewCount}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Actively under investigation
            </div>
          </Card>

          <Card elevated noPadding className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)] mb-2">
              <span>Resolved</span>
              <CheckCircle2 size={16} className="text-[var(--color-success)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-success)]">
              {resolvedCount}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Closed and remediated
            </div>
          </Card>
        </div>

        {/* ── Distribution Analysis Row ─────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <Card elevated noPadding className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Category Distribution
              </h3>
              <div className="space-y-2.5">
                {stats.byCategory?.map((item) => {
                  const meta = CATEGORY_META[item._id] || CATEGORY_META.other;
                  const maxVal = Math.max(...stats.byCategory.map((b) => b.count), 1);
                  const percentage = Math.round((item.count / maxVal) * 100);

                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--color-text-primary)] font-medium">
                          {meta.label}
                        </span>
                        <span className="font-mono text-[var(--color-text-muted)]">
                          {item.count} reports
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Status Breakdown */}
            <Card elevated noPadding className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Resolution Pipeline
              </h3>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/5 text-center space-y-1">
                  <span className="text-xs font-medium text-[var(--color-danger)]">Reported</span>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">{reportedCount}</div>
                  <span className="text-[10px] text-[var(--color-text-muted)] block">Queue</span>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/5 text-center space-y-1">
                  <span className="text-xs font-medium text-[var(--color-warning)]">Under Review</span>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">{underReviewCount}</div>
                  <span className="text-[10px] text-[var(--color-text-muted)] block">In Progress</span>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/5 text-center space-y-1">
                  <span className="text-xs font-medium text-[var(--color-success)]">Resolved</span>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">{resolvedCount}</div>
                  <span className="text-[10px] text-[var(--color-text-muted)] block">Completed</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Incident Triage Queue Table ───────────────────────────── */}
        <Card elevated noPadding className="overflow-hidden space-y-0">
          {/* Table Controls */}
          <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface-secondary)]/40">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                Incident Triage Queue
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Inspect raw filings with uncensored reporter credentials for verification
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-48 sm:w-60">
                <input
                  type="text"
                  placeholder="Search triage queue…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, status: e.target.value }));
                  setPage(1);
                }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="">All Statuses</option>
                {INCIDENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, category: e.target.value }));
                  setPage(1);
                }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="">All Categories</option>
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table View */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[var(--color-text-muted)] font-mono">
              Loading incident records…
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 size={32} className="text-[var(--color-success)] mx-auto" strokeWidth={1.8} />
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                Triage Queue Clear
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                No incidents match the active filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Incident</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Reporter (Admin View)</th>
                    <th className="py-3 px-4">Date Filed</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Advance Status</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/60">
                  {filteredIncidents.map((inc) => {
                    const meta = CATEGORY_META[inc.category] || CATEGORY_META.other;
                    const Icon = meta.icon;

                    return (
                      <tr
                        key={inc._id}
                        className="hover:bg-[var(--color-surface-secondary)]/60 transition-colors group"
                      >
                        {/* Title & Preview */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                            {inc.title}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                            {inc.description}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                            <Icon size={13} className="text-[var(--color-text-muted)]" />
                            {meta.label}
                          </span>
                        </td>

                        {/* Reporter info */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div>
                            <span className="font-medium text-[var(--color-text-primary)] block">
                              {inc.reportedBy?.name || 'Unknown User'}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
                              {inc.reportedBy?.email || '—'}
                              {inc.isAnonymous && (
                                <span className="ml-1 text-[var(--color-warning)]">(Anon Flag)</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[var(--color-text-muted)]">
                          {new Date(inc.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={inc.status} size="sm" />
                        </td>

                        {/* Status dropdown */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={inc.status}
                            disabled={updatingId === inc._id}
                            onChange={(e) => handleStatusChange(inc._id, e.target.value)}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] rounded-md px-2 py-1 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer disabled:opacity-50"
                          >
                            <option value="reported">Reported</option>
                            <option value="under_review">Under Review</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openReviewModal(inc)}
                              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
                              title="Inspect Full Case File"
                            >
                              <Eye size={15} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc._id)}
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors cursor-pointer"
                              title="Delete Incident Record"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total filings)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Admin Case Review Modal ───────────────────────────────── */}
        {selectedIncident && (
          <Modal
            isOpen={isReviewOpen}
            onClose={() => {
              setIsReviewOpen(false);
              setSelectedIncident(null);
            }}
            title="Official Case Inspection Dossier"
            description={`Case Reference ID: ${selectedIncident._id}`}
            size="lg"
            footer={
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteIncident(selectedIncident._id)}
                  disabled={isDeleting}
                  className="gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? 'Deleting…' : 'Delete Incident'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsReviewOpen(false)}
                  >
                    Close Dossier
                  </Button>
                  {selectedIncident.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(selectedIncident._id, 'resolved')}
                      disabled={updatingId === selectedIncident._id}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Current Status:
                  </span>
                  <StatusBadge status={selectedIncident.status} size="md" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)]">Transition:</span>
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleStatusChange(selectedIncident._id, e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] rounded-md px-2 py-1 cursor-pointer"
                  >
                    <option value="reported">Reported</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  {selectedIncident.title}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Photographic Evidence if any */}
              {selectedIncident.photoFileId && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
                    <Camera size={13} />
                    Photo Evidence
                  </span>
                  <div className="rounded-lg overflow-hidden border border-[var(--color-border)] max-h-60 bg-[var(--color-bg)]">
                    <img
                      src={`/api/files/${selectedIncident.photoFileId}`}
                      alt="Incident Evidence"
                      className="w-full h-full object-contain max-h-60 mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Reporter Internal Details */}
              <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                  Reporter Audit Intelligence
                </span>
                <div className="grid grid-cols-2 gap-2 text-[var(--color-text-secondary)]">
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Registered Name:</span>
                    <strong className="text-[var(--color-text-primary)]">{selectedIncident.reportedBy?.name || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Registered Email:</span>
                    <strong className="text-[var(--color-text-primary)] font-mono">{selectedIncident.reportedBy?.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Contact Follow-up:</span>
                    <strong className="text-[var(--color-text-primary)]">{selectedIncident.reporterContact || 'None provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Public Anonymous Flag:</span>
                    <span className={selectedIncident.isAnonymous ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-text-primary)]'}>
                      {selectedIncident.isAnonymous ? 'Yes (Identity Hidden Publicly)' : 'No (Public)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-mono pt-1">
                <span>
                  Coordinates: {selectedIncident.location.coordinates[1].toFixed(5)}, {selectedIncident.location.coordinates[0].toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${selectedIncident.location.coordinates[1]},${selectedIncident.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open in External Maps</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
