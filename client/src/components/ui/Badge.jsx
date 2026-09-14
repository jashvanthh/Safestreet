/**
 * components/ui/Badge.jsx
 *
 * Light civic status badge with subtle transparent/pastel background tints.
 */

const VARIANTS = {
  primary:
    'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20',
  secondary:
    'bg-[var(--color-secondary-light)] text-[#20695B] border-[var(--color-secondary)]/25',
  success:
    'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]/25',
  warning:
    'bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
  danger:
    'bg-[var(--color-danger-light)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  neutral:
    'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px] font-medium leading-tight',
  md: 'px-2.5 py-0.5 text-xs font-medium leading-normal',
  lg: 'px-3 py-1 text-xs font-semibold leading-normal',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border tracking-wide whitespace-nowrap
        ${VARIANTS[variant] || VARIANTS.neutral}
        ${SIZES[size] || SIZES.md}
        ${className}
      `.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-[var(--color-success)]'
              : variant === 'warning'
              ? 'bg-[var(--color-warning)]'
              : variant === 'danger'
              ? 'bg-[var(--color-danger)]'
              : variant === 'secondary'
              ? 'bg-[var(--color-secondary)]'
              : 'bg-[var(--color-primary)]'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
