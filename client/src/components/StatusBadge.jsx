/**
 * components/StatusBadge.jsx
 *
 * Reusable pill badge for incident status.
 * Used in IncidentCard, IncidentDetails, AdminDashboard.
 *
 * Status → color mapping matches the constants.js definition.
 */
const STATUS_STYLES = {
  reported:     'bg-red-500/20 text-red-400 border border-red-500/30',
  under_review: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  resolved:     'bg-green-500/20 text-green-400 border border-green-500/30',
};

const STATUS_LABELS = {
  reported:     'Reported',
  under_review: 'Under Review',
  resolved:     'Resolved',
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || 'bg-slate-700 text-slate-300';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
