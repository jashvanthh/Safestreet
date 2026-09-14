/**
 * components/ui/Textarea.jsx
 *
 * Light civic multiline input conforming to SafeStreet tokens with character counter.
 */

const Textarea = ({
  label,
  error,
  id,
  className = '',
  required = false,
  maxLength,
  showCount = false,
  value = '',
  rows = 4,
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
          {showCount && maxLength && (
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              {value?.length || 0} / {maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={`
          w-full px-3.5 py-2 rounded-lg text-sm
          bg-[var(--color-surface)] border border-[var(--color-border)]
          text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
          hover:border-[var(--color-border-strong)]
          focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15
          disabled:bg-[var(--color-surface-secondary)] disabled:opacity-60 disabled:cursor-not-allowed
          transition-colors duration-150 resize-y shadow-xs
          ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15' : ''}
          ${className}
        `.trim()}
        {...props}
      />
      {error && (
        <p className="text-[var(--color-danger)] text-xs mt-1.5">{error}</p>
      )}
    </div>
  );
};

export default Textarea;
