/**
 * components/ui/Select.jsx
 *
 * Light civic select dropdown with clean chevron and green focus state.
 */
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  error,
  id,
  className = '',
  required = false,
  helperText,
  children,
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
      <div className="relative">
        <select
          id={id}
          className={`
            w-full px-3.5 py-2 rounded-lg text-sm appearance-none
            bg-[var(--color-surface)] border border-[var(--color-border)]
            text-[var(--color-text-primary)]
            hover:border-[var(--color-border-strong)]
            focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15
            disabled:bg-[var(--color-surface-secondary)] disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150 cursor-pointer pr-10 shadow-xs
            ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15' : ''}
            ${className}
          `.trim()}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <ChevronDown size={16} strokeWidth={2} />
        </div>
      </div>
      {error && (
        <p className="text-[var(--color-danger)] text-xs mt-1.5">{error}</p>
      )}
    </div>
  );
};

export default Select;
