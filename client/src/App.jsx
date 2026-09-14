/**
 * App.jsx — Router + Layout shell
 *
 * This component:
 *   1. Wraps everything in AuthProvider + SocketProvider (context injection)
 *   2. Defines all routes using React Router v6
 *   3. Uses ProtectedRoute for authenticated-only pages
 *   4. Uses AdminRoute for admin-only pages
 *
 * Route guard pattern:
 *   <ProtectedRoute> checks: if !user → redirect to /login
 *   <AdminRoute>     checks: if user.role !== 'admin' → redirect to /
 *   Both components use useAuth() which reads from AuthContext.
 *
 * Note: React Router v6 uses <Outlet> for nested routes.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages (stubs — will be filled in per phase)
import Home             from './pages/Home';
import Login            from './pages/Login';
import Register         from './pages/Register';
import MapPage          from './pages/MapPage';
import ReportIncident   from './pages/ReportIncident';
import IncidentDetails  from './pages/IncidentDetails';
import Notifications    from './pages/Notifications';
import Profile          from './pages/Profile';
import Digest           from './pages/Digest';
import AdminDashboard   from './pages/AdminDashboard';
import NotFound         from './pages/NotFound';

// Route guards
import ProtectedRoute   from './components/ProtectedRoute';
import AdminRoute       from './components/AdminRoute';

// Layout & Navigation
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import useAuth from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';

/**
 * RootRoute: Dynamically serves the editorial public Landing Page to guests,
 * and the personalized neighborhood briefing (Home) to authenticated residents.
 */
function RootRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return user ? <Home /> : <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />
            <main>
              <Routes>
                {/* Dynamic root route */}
                <Route path="/" element={<RootRoute />} />

                {/* Public auth routes */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes (must be logged in) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/map"            element={<MapPage />} />
                  <Route path="/report"         element={<ReportIncident />} />
                  <Route path="/incidents/:id"  element={<IncidentDetails />} />
                  <Route path="/notifications"  element={<Notifications />} />
                  <Route path="/profile"        element={<Profile />} />
                  <Route path="/digest"         element={<Digest />} />
                </Route>

                {/* Admin-only routes (must be logged in AND role === 'admin') */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
