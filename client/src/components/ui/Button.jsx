/**
 * components/ui/Button.jsx
 *
 * SafeStreet Light Civic-Tech Button.
 * Restrained 8px radius, brand green (#287D5A) primary, and structural 1px borders.
 */

const VARIANTS = {
  primary:
    'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm hover:shadow active:scale-[0.99] border border-[var(--color-primary)]',
  secondary:
    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] active:scale-[0.99] shadow-sm',
  ghost:
    'bg-transparent hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
  danger:
    'bg-[var(--color-danger-light)] hover:bg-[#F7DADA] text-[var(--color-danger)] border border-[var(--color-danger)]/20 active:scale-[0.99]',
  accent:
    'bg-[var(--color-primary-light)] hover:bg-[#DDF0E7] text-[var(--color-primary)] border border-[var(--color-primary)]/20 active:scale-[0.99]',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
  md: 'px-4 py-2 text-sm font-medium rounded-lg',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-lg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 cursor-pointer
        transition-all duration-150 ease-in-out select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
