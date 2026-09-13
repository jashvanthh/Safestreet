/**
 * components/LoadingSpinner.jsx
 *
 * Reusable full-screen loader shown while:
 *   - AuthContext reads localStorage on mount (isLoading)
 *   - Pages fetch data
 *
 * Why this matters:
 *   Without this, on page refresh there's a flash where the app shows
 *   the login page for a split second before realizing you're logged in.
 *   The isLoading flag in AuthContext + this spinner prevents that.
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm tracking-wide">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
