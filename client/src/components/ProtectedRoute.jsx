/**
 * components/ProtectedRoute.jsx
 *
 * How React Router v6 nested route guards work:
 *   - This component is used as a layout route: <Route element={<ProtectedRoute />}>
 *   - It renders <Outlet /> if the user is authenticated
 *   - It redirects to /login if not
 *   - <Outlet /> is where child routes render — it's React Router's way of
 *     saying "render whatever matched child route goes here"
 *
 * The isLoading check is critical:
 *   On first load, AuthContext reads localStorage asynchronously.
 *   If we redirect to /login before that read completes, a logged-in user
 *   gets kicked out every time they refresh the page.
 *   So we show a spinner until we KNOW whether they're logged in or not.
 */
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Still reading localStorage — don't redirect yet
  if (isLoading) return <LoadingSpinner />;

  // Not logged in → send to login page
  // 'replace' replaces the current history entry so the user
  // can't press Back to get into a protected page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
