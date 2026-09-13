/**
 * components/Navbar.jsx
 *
 * Renders differently based on auth state:
 *   - Not logged in: Login + Register links only
 *   - Logged in (resident): Home, Map, Report, Notifications, Profile, Logout
 *   - Logged in (admin): all above + Admin Dashboard link
 *
 * useAuth() reads from AuthContext — no prop drilling needed.
 * useNavigate() from React Router redirects after logout.
 *
 * The NotificationBell component (Phase 8) will slot in here — the space
 * is reserved in the nav links section.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper: highlight active link
  const isActive = (path) =>
    location.pathname === path
      ? 'text-blue-400 font-semibold'
      : 'text-slate-300 hover:text-white transition-colors';

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🛡️</span>
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-blue-400 transition-colors">
              SafeStreet
            </span>
          </Link>

          {/* Nav links */}
          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/"           className={isActive('/')}>Home</Link>
              <Link to="/map"        className={isActive('/map')}>Map</Link>
              <Link to="/report"     className={isActive('/report')}>Report</Link>
              <Link to="/notifications" className={isActive('/notifications')}>
                {/* Phase 8: swap this text for <NotificationBell /> */}
                Alerts
              </Link>

              {/* Admin-only link */}
              {user.role === 'admin' && (
                <Link to="/admin" className={`${isActive('/admin')} text-purple-400 hover:text-purple-300`}>
                  Admin
                </Link>
              )}

              {/* User menu */}
              <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
                <Link to="/profile" className="text-slate-300 hover:text-white text-sm">
                  👤 {user.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white text-sm transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
