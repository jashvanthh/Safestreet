/**
 * components/AdminRoute.jsx
 *
 * Extends ProtectedRoute logic with an extra role check.
 * Chained checks:
 *   1. Not loading yet?     → show spinner
 *   2. Not logged in?       → redirect to /login
 *   3. Logged in, not admin → redirect to / (home) with a message
 *   4. Admin?               → render <Outlet /> (the admin page)
 *
 * NOTE: This is a CLIENT-SIDE guard — it controls what the user SEES.
 *       The real security is on the server: requireAdmin middleware returns
 *       403 if a non-admin calls an admin API route.
 *       Both guards are needed — client for UX, server for security.
 */
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not admin → send to home
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
