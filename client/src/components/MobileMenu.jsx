/**
 * components/MobileMenu.jsx
 *
 * Responsive mobile navigation drawer with Light Civic-Tech styling.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Home,
  Map,
  PlusCircle,
  BarChart3,
  Bell,
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Badge from './ui/Badge';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!isOpen) return null;

  const authenticatedLinks = [
    { to: '/', label: 'Neighborhood Overview', icon: Home },
    { to: '/map', label: 'Safety Map', icon: Map },
    { to: '/report', label: 'Report Incident', icon: PlusCircle },
    { to: '/digest', label: 'Weekly Digest', icon: BarChart3 },
    { to: '/notifications', label: 'Proximity Alerts', icon: Bell },
  ];

  return (
    <>
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-50 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-[var(--color-surface)] border-l border-[var(--color-border)] z-50 md:hidden flex flex-col justify-between shadow-lg animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="SafeStreet"
                className="h-7 w-auto object-contain"
              />
              <span className="font-bold text-sm text-[var(--color-text-primary)]">
                SafeStreet
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
              aria-label="Close navigation"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* User Brief (if logged in) */}
          {user ? (
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-sm flex items-center justify-center">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mb-1">
                    {user.email}
                  </p>
                  <Badge
                    variant={user.role === 'admin' ? 'secondary' : 'neutral'}
                    size="sm"
                  >
                    {user.role === 'admin' ? 'Authority Administrator' : 'Verified Resident'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]/50">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Welcome to SafeStreet. Sign in to access your neighborhood safety dashboard.
              </p>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {user ? (
              <>
                {authenticatedLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors
                        ${active
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                        }
                      `}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {user.role === 'admin' && (
                  <>
                    <div className="my-2 border-t border-[var(--color-border)]" />
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors
                        ${isActive('/admin')
                          ? 'bg-[var(--color-secondary-light)] text-[var(--color-primary)] font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)]'
                        }
                      `}
                    >
                      <Shield size={16} strokeWidth={2} />
                      <span>Admin Triage Console</span>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <a
                  href="#safety-map"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                >
                  <Map size={16} strokeWidth={2} />
                  <span>Safety Map</span>
                </a>
                <a
                  href="#how-it-works"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                >
                  <BarChart3 size={16} strokeWidth={2} />
                  <span>How It Works</span>
                </a>
                <a
                  href="#community-safety"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                >
                  <Shield size={16} strokeWidth={2} />
                  <span>Community Safety</span>
                </a>
                <div className="my-2 border-t border-[var(--color-border)]" />
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                >
                  <LogIn size={16} strokeWidth={2} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]"
                >
                  <UserPlus size={16} strokeWidth={2} />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        {user && (
          <div className="p-3 border-t border-[var(--color-border)] space-y-1 bg-[var(--color-surface-secondary)]/30">
            <Link
              to="/profile"
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors
                ${isActive('/profile')
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                }
              `}
            >
              <User size={16} strokeWidth={2} />
              <span>Resident Profile & Radius</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors cursor-pointer"
            >
              <LogOut size={16} strokeWidth={2} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;
