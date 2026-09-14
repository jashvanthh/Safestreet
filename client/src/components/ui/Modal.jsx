/**
 * components/ui/Modal.jsx
 *
 * Light Civic-Tech modal dialog with soft backdrop blur and keyboard accessibility.
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`
          relative w-full ${SIZES[size] || SIZES.md}
          bg-[var(--color-surface)] border border-[var(--color-border)]
          rounded-xl shadow-lg overflow-hidden z-10 flex flex-col max-h-[90vh]
          animate-in fade-in zoom-in-95 duration-150
        `}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 -mr-1 rounded-md hover:bg-[var(--color-surface-secondary)]"
              aria-label="Close dialog"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 text-sm text-[var(--color-text-secondary)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
