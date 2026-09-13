/**
 * components/FilterBar.jsx
 *
 * Renders filter controls for the map/list view.
 * IMPORTANT: filtering is done ON THE SERVER — not client-side.
 *   When a filter changes, we update the parent's filter state,
 *   which triggers a new API call with the filter as query params.
 *   This means: GET /api/incidents?category=harassment&status=reported
 *
 *   WHY server-side filtering? (viva point)
 *   Client-side filtering would require fetching ALL incidents first,
 *   then filtering in JavaScript. As the DB grows this becomes slow.
 *   Server-side filtering uses MongoDB indexes, which are fast regardless
 *   of collection size.
 *
 * Props:
 *   filters  — { category, status } current filter state (controlled from parent)
 *   onChange — (newFilters) => void — called on any filter change
 *   onClear  — () => void — resets all filters
 */
const CATEGORIES = [
  { value: '',                    label: 'All Categories' },
  { value: 'poor_lighting',       label: '💡 Poor Lighting' },
  { value: 'harassment',          label: '⚠️ Harassment' },
  { value: 'unsafe_intersection', label: '🚦 Unsafe Intersection' },
  { value: 'suspicious_activity', label: '👁️ Suspicious Activity' },
  { value: 'other',               label: '📌 Other' },
];

const STATUSES = [
  { value: '',             label: 'All Statuses' },
  { value: 'reported',     label: '🔴 Reported' },
  { value: 'under_review', label: '🟡 Under Review' },
  { value: 'resolved',     label: '🟢 Resolved' },
];

const FilterBar = ({ filters, onChange, onClear }) => {
  const hasActiveFilter = filters.category || filters.status;

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Category select */}
      <select
        id="filter-category"
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Status select */}
      <select
        id="filter-status"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear button — only shown when a filter is active */}
      {hasActiveFilter && (
        <button
          id="filter-clear"
          onClick={onClear}
          className="text-slate-400 hover:text-white text-sm border border-slate-600 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
