/**
 * components/StatusBadge.jsx
 *
 * Status badge with semantic dot indicator for the Light Civic-Tech system.
 */
import Badge from './ui/Badge';

const STATUS_VARIANTS = {
  reported: 'danger',
  under_review: 'warning',
  resolved: 'success',
};

const STATUS_LABELS = {
  reported: 'Reported',
  under_review: 'Under Review',
  resolved: 'Resolved',
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const variant = STATUS_VARIANTS[status] || 'neutral';
  const label = STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} dot>
      {label}
    </Badge>
  );
};

export default StatusBadge;
