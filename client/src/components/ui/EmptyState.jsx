/**
 * components/ui/EmptyState.jsx
 *
 * Professional empty state component.
 * Displays icon, message, and optional action.
 */

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="text-[var(--color-text-muted)] mb-4">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <h3 className="text-[var(--color-text-primary)] font-semibold text-lg mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-[var(--color-text-secondary)] text-sm max-w-md mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
