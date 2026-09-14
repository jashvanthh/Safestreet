/**
 * pages/NotFound.jsx
 *
 * 404 Route handler with SafeStreet tokens.
 */
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button, Card } from '../components/ui';

const NotFound = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] flex items-center justify-center p-4">
    <Card elevated className="max-w-md text-center p-8 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
        <ShieldAlert size={32} strokeWidth={1.8} />
      </div>

      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] font-mono">
          404
        </h1>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Page Not Found
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          The requested path does not exist or may have been moved.
        </p>
      </div>

      <div className="pt-2">
        <Link to="/" className="inline-block">
          <Button variant="primary" size="md" className="gap-2">
            <ArrowLeft size={15} />
            <span>Return to Safety Briefing</span>
          </Button>
        </Link>
      </div>
    </Card>
  </div>
);

export default NotFound;
