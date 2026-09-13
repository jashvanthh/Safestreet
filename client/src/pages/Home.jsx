/**
 * pages/Home.jsx
 *
 * Landing page for authenticated users.
 * Shows a summary/welcome with quick-action cards.
 * Uses useAuth() to greet the user by name.
 */
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const QUICK_ACTIONS = [
  { icon: '📢', label: 'Report Incident', desc: 'Report a safety concern in your area', to: '/report', color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500/50' },
  { icon: '🗺️', label: 'View Map',        desc: 'See incidents reported near you',     to: '/map',    color: 'from-emerald-600/20 to-emerald-700/10 border-emerald-600/30 hover:border-emerald-500/50' },
  { icon: '🔔', label: 'Alerts',          desc: 'Check your proximity notifications',  to: '/notifications', color: 'from-yellow-600/20 to-yellow-700/10 border-yellow-600/30 hover:border-yellow-500/50' },
  { icon: '📊', label: 'Weekly Digest',   desc: 'Neighborhood safety trends',          to: '/digest', color: 'from-purple-600/20 to-purple-700/10 border-purple-600/30 hover:border-purple-500/50' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Welcome back, <span className="text-blue-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Help keep your neighborhood safe. Report incidents, stay informed,
            and connect with your community.
          </p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            📢 Report an Incident
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`bg-gradient-to-br ${action.color} border rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <span className="text-3xl block mb-3">{action.icon}</span>
              <h3 className="text-white font-semibold mb-1">{action.label}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Admin shortcut */}
        {user?.role === 'admin' && (
          <div className="mt-6 bg-purple-600/10 border border-purple-600/30 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-purple-300 font-semibold">Admin Dashboard</h3>
              <p className="text-slate-400 text-sm">Triage incidents and view aggregated stats</p>
            </div>
            <Link
              to="/admin"
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Open →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
