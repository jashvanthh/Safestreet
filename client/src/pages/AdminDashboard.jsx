/**
 * pages/AdminDashboard.jsx
 *
 * Admin-only page showing:
 *   1. Summary stat cards (total incidents, recent week, total users)
 *   2. Category breakdown bar chart (pure CSS — no extra charting library)
 *   3. Status breakdown
 *   4. Triage table — full incident list with inline status update
 *
 * STATUS UPDATE FLOW (viva point):
 *   Admin selects a new status from a dropdown in the table row.
 *   This calls PATCH /api/incidents/:id/status (protected by requireAdmin on server).
 *   On success, we update the local incidents state — no full refetch needed.
 *   This is optimistic-ish UI: we update after server confirms.
 *
 * AGGREGATION PIPELINE (shown here in the frontend context):
 *   The stats come from a single MongoDB $facet aggregation.
 *   $facet runs multiple pipelines in parallel — one DB round-trip
 *   returns all of: byCategory, byStatus, totalCount, recentWeek, dailyTrend.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_COLORS = {
  poor_lighting:       'bg-yellow-500',
  harassment:          'bg-red-500',
  unsafe_intersection: 'bg-orange-500',
  suspicious_activity: 'bg-purple-500',
  other:               'bg-slate-500',
};

const CATEGORY_LABELS = {
  poor_lighting:       '💡 Poor Lighting',
  harassment:          '⚠️ Harassment',
  unsafe_intersection: '🚦 Unsafe Intersection',
  suspicious_activity: '👁️ Suspicious Activity',
  other:               '📌 Other',
};

const STATUSES = ['reported', 'under_review', 'resolved'];

// ── Stat card component ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{sub}</span>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-slate-400 text-sm mt-1">{label}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats,     setStats]     = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [filters,   setFilters]   = useState({ category: '', status: '' });
  const [page,      setPage]      = useState(1);
  const [pagination,setPagination]= useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId,setUpdatingId]= useState(null);

  // ── Fetch aggregated stats ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch(console.error);
  }, []);

  // ── Fetch incidents for triage table ──────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (filters.category) params.set('category', filters.category);
    if (filters.status)   params.set('status',   filters.status);

    api.get(`/admin/incidents?${params}`)
      .then((res) => {
        setIncidents(res.data.data.incidents);
        setPagination(res.data.data.pagination);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [filters, page]);

  // ── Update incident status ─────────────────────────────────────────────
  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdatingId(incidentId);
    try {
      await api.patch(`/incidents/${incidentId}/status`, { status: newStatus });
      // Update local state — no need to refetch
      setIncidents((prev) =>
        prev.map((inc) =>
          inc._id === incidentId ? { ...inc, status: newStatus } : inc
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Bar chart helper ───────────────────────────────────────────────────
  const maxCategoryCount = stats
    ? Math.max(...(stats.byCategory.map((b) => b.count)), 1)
    : 1;

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Triage incidents and monitor neighborhood safety</p>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total Incidents" value={stats.totalIncidents}
              sub="All time" color="bg-blue-500/20 text-blue-400" />
            <StatCard icon="🔴" label="This Week" value={stats.recentWeek}
              sub="Last 7 days" color="bg-red-500/20 text-red-400" />
            <StatCard icon="👥" label="Registered Users" value={stats.totalUsers}
              sub="Total" color="bg-purple-500/20 text-purple-400" />
            <StatCard
              icon="✅"
              label="Resolved"
              value={stats.byStatus.find((s) => s._id === 'resolved')?.count || 0}
              sub="Incidents"
              color="bg-green-500/20 text-green-400"
            />
          </div>
        )}

        {/* ── Charts row ──────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Category bar chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">By Category</h2>
              <div className="space-y-3">
                {stats.byCategory.map((item) => (
                  <div key={item._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{CATEGORY_LABELS[item._id] || item._id}</span>
                      <span className="text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLORS[item._id] || 'bg-slate-500'} transition-all duration-700`}
                        style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status donut (simple pills) */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">By Status</h2>
              <div className="space-y-4">
                {stats.byStatus.map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <StatusBadge status={item._id} />
                    <span className="text-2xl font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Triage table ─────────────────────────────────────────────── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">Incident Triage</h2>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Title</th>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-left px-5 py-3">Reporter</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-white max-w-xs truncate">{inc.title}</td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {CATEGORY_LABELS[inc.category] || inc.category}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {inc.isAnonymous
                          ? <span className="text-slate-500 italic">Anonymous</span>
                          : inc.reportedBy?.name || '—'
                        }
                      </td>
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-5 py-3">
                        {/* Inline status update — calls PATCH /api/incidents/:id/status */}
                        <select
                          value={inc.status}
                          disabled={updatingId === inc._id}
                          onChange={(e) => handleStatusChange(inc._id, e.target.value)}
                          className="bg-slate-700 text-white text-xs rounded-lg px-2 py-1 border border-slate-600 focus:outline-none disabled:opacity-50 cursor-pointer"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
              <span className="text-slate-400 text-sm">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-slate-700 text-white rounded-lg disabled:opacity-40"
                >← Prev</button>
                <button
                  onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}
                  className="px-3 py-1 text-sm bg-slate-700 text-white rounded-lg disabled:opacity-40"
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
