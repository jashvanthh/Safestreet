/**
 * components/ui/Card.jsx
 *
 * Light Civic-Tech surface card.
 * Crisp 10px rounding, #DDE5DF border, and subtle 1px elevation.
 */

const Card = ({
  children,
  className = '',
  secondary = false,
  noPadding = false,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`
        border border-[var(--color-border)] rounded-[10px] transition-all duration-150
        ${secondary ? 'bg-[var(--color-surface-secondary)]' : 'bg-[var(--color-surface)] shadow-xs'}
        ${hoverable ? 'hover:border-[var(--color-border-strong)] hover:shadow-sm' : ''}
        ${noPadding ? '' : 'p-5 sm:p-6'}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
