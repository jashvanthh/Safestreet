/**
 * components/FilterBar.jsx
 *
 * Professional filter controls for map view with clean SVG icon indicators.
 */
import { X, Filter } from 'lucide-react';
import { INCIDENT_CATEGORIES, INCIDENT_STATUSES } from '../utils/constants';

const FilterBar = ({ filters, onChange, onClear }) => {
  const hasActiveFilter = Boolean(filters.category || filters.status);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] pr-1">
        <Filter size={14} strokeWidth={2} />
        <span>Filters</span>
      </div>

      {/* Category select */}
      <select
        id="filter-category"
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer hover:border-[var(--color-border-light)]"
      >
        <option value="">All Categories</option>
        {INCIDENT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Status select */}
      <select
        id="filter-status"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer hover:border-[var(--color-border-light)]"
      >
        <option value="">All Statuses</option>
        {INCIDENT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-light)] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title="Reset all active filters"
        >
          <X size={12} strokeWidth={2.5} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;
