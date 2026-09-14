/**
 * components/Navbar.jsx
 *
 * SafeStreet Light Civic-Tech Navbar.
 * Crisp white surface, 1px border (#DDE5DF), brand green accents (#287D5A),
 * and distinct layouts for public visitors versus authenticated residents.
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  PlusCircle,
  BarChart3,
  User,
  Shield,
  LogOut,
  Menu,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import MobileMenu from './MobileMenu';
import { Button } from './ui';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const authenticatedLinks = [
    { to: '/', label: 'Overview', icon: Home },
    { to: '/map', label: 'Safety Map', icon: Map },
    { to: '/report', label: 'Report Incident', icon: PlusCircle },
    { to: '/digest', label: 'Weekly Digest', icon: BarChart3 },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Brand Logo ────────────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 focus:outline-none group py-1"
            >
              <img
                src="/logo.png"
                alt="SafeStreet Logo"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-[var(--color-text-primary)] leading-none">
                  SafeStreet
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-[var(--color-primary)] mt-0.5">
                  Civic Safety
                </span>
              </div>
            </Link>

            {/* ── Navigation (Authenticated State) ──────────────────── */}
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-1">
                  {authenticatedLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.to);
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${active
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                          }
                        `}
                      >
                        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Right Controls */}
                <div className="hidden md:flex items-center gap-2">
                  <NotificationBell />

                  {/* Admin Console Badge */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isActive('/admin')
                          ? 'bg-[var(--color-secondary-light)] text-[var(--color-primary)] font-semibold border border-[var(--color-secondary)]/30'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)]'
                        }
                      `}
                    >
                      <Shield size={14} strokeWidth={2} />
                      <span>Admin Triage</span>
                    </Link>
                  )}

                  <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1" />

                  {/* User Profile */}
                  <Link
                    to="/profile"
                    className={`
                      flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${isActive('/profile')
                        ? 'text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                      }
                    `}
                    title="Resident Profile & Radius"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
                      <User size={13} strokeWidth={2} />
                    </div>
                    <span className="max-w-[110px] truncate text-[var(--color-text-primary)]">
                      {user.name?.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                    title="Sign out of SafeStreet"
                    aria-label="Logout"
                  >
                    <LogOut size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Mobile Menu Trigger */}
                <div className="flex items-center gap-2 md:hidden">
                  <NotificationBell />
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
                    aria-label="Open Navigation Menu"
                  >
                    <Menu size={20} strokeWidth={2} />
                  </button>
                </div>
              </>
            ) : (
              /* ── Navigation (Public Visitor State) ───────────────── */
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-[var(--color-text-secondary)] mr-3">
                  <a href="#safety-map" className="hover:text-[var(--color-text-primary)] transition-colors">
                    Safety Map
                  </a>
                  <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">
                    How It Works
                  </a>
                  <a href="#community-safety" className="hover:text-[var(--color-text-primary)] transition-colors">
                    Community Safety
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>

                  <Link to="/register">
                    <Button variant="primary" size="sm" className="shadow-xs">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;
