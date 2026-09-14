/**
 * components/LoadingSpinner.jsx
 *
 * Light Civic-Tech loading state with brand green spinner.
 */
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading SafeStreet…', fullScreen = true }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-center select-none">
      <div className="relative flex items-center justify-center">
        <Loader2
          size={28}
          className="text-[var(--color-primary)] animate-spin"
          strokeWidth={2.2}
        />
      </div>
      {message && (
        <p className="text-xs font-medium text-[var(--color-text-secondary)] tracking-tight">
          {message}
        </p>
      )}
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-xs">
      {content}
    </div>
  );
};

export default LoadingSpinner;
