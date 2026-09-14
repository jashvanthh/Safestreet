/**
 * components/IncidentCard.jsx
 *
 * Compact incident card used in MapPage sidebar and feed lists.
 * Synchronizes with map pin selection.
 */
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Eye,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = {
  poor_lighting: Lightbulb,
  harassment: AlertTriangle,
  unsafe_intersection: ShieldAlert,
  suspicious_activity: Eye,
  other: MapPin,
};

const CATEGORY_COLORS = {
  poor_lighting: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
  harassment: 'text-[var(--color-danger)] bg-[var(--color-danger)]/10',
  unsafe_intersection: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
  suspicious_activity: 'text-[var(--color-secondary)] bg-[var(--color-secondary)]/10',
  other: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10',
};

const IncidentCard = ({ incident, onClick, isActive }) => {
  const Icon = CATEGORY_ICONS[incident.category] || MapPin;
  const colorClass = CATEGORY_COLORS[incident.category] || 'text-[var(--color-primary)] bg-[var(--color-primary)]/10';

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border p-3.5 transition-all duration-150 group select-none
        ${isActive
          ? 'bg-[var(--color-surface-elevated)] border-[var(--color-primary)] shadow-md ring-1 ring-[var(--color-primary)]/30'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]/60'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${colorClass}`}
        >
          <Icon size={16} strokeWidth={2.2} />
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <StatusBadge status={incident.status} size="sm" />
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {new Date(incident.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          <h4
            className={`font-semibold text-xs leading-snug truncate transition-colors ${
              isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'
            }`}
          >
            {incident.title}
          </h4>

          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed mt-1 mb-2">
            {incident.description}
          </p>

          <div className="flex items-center justify-end">
            <Link
              to={`/incidents/${incident._id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
            >
              <span>Case details</span>
              <ChevronRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
