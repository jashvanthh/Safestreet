/**
 * pages/Login.jsx
 *
 * What this demonstrates:
 *   - useState for controlled form inputs
 *   - useState for loading + error states (always have these in forms)
 *   - Calling api.js (Axios) to POST /api/auth/login
 *   - useAuth().login() to persist token + user to context + localStorage
 *   - useNavigate() to redirect after login
 *   - Form validation with user-friendly error messages
 *   - Redirecting already-logged-in users away from the login page
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const { login, user } = useAuth();
  const navigate        = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect away
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    // Clears error on any input change — better UX than stale error messages
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();   // Prevent default browser form submission (page reload)
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const { token, user: userData } = res.data.data;
      login(token, userData);          // Persist to context + localStorage
      navigate(userData.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      // err.response.data.message comes from our { success: false, message } shape
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SafeStreet" className="h-16 w-auto mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to SafeStreet</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
