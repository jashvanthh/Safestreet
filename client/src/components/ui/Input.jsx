/**
 * components/ui/Input.jsx
 *
 * Light civic input field with crisp 8px rounding, #DDE5DF border, and green focus accent.
 */

const Input = ({
  label,
  error,
  id,
  className = '',
  required = false,
  helperText,
  icon: Icon,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-[var(--color-text-secondary)] tracking-tight"
          >
            {label}
            {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
          </label>
          {helperText && (
            <span className="text-[11px] text-[var(--color-text-muted)]">{helperText}</span>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-[var(--color-text-muted)]">
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
        <input
          id={id}
          className={`
            w-full py-2 rounded-lg text-sm
            ${Icon ? 'pl-9 pr-3.5' : 'px-3.5'}
            bg-[var(--color-surface)] border border-[var(--color-border)]
            text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
            hover:border-[var(--color-border-strong)]
            focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15
            disabled:bg-[var(--color-surface-secondary)] disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150 shadow-xs
            ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15' : ''}
            ${className}
          `.trim()}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[var(--color-danger)] text-xs mt-1.5 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default Input;
