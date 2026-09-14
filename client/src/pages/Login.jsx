/**
 * pages/Login.jsx
 *
 * Polished authentication interface with official SafeStreet tokens.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { Card, Button, Input } from '../components/ui';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email address and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const { token, user: userData } = res.data.data;
      login(token, userData);
      navigate(userData.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="SafeStreet"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Sign In to SafeStreet
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Neighborhood Safety Intelligence & Incident Platform
          </p>
        </div>

        {/* Form Container */}
        <Card elevated noPadding className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 rounded-lg flex items-center gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="login-email"
              name="email"
              type="email"
              label="Email Address"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="resident@neighborhood.org"
              icon={Mail}
            />

            <Input
              id="login-password"
              name="password"
              type="password"
              label="Password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={Lock}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-3 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Login;
