/**
 * pages/NotFound.jsx — 404 page
 */
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center px-4">
    <div>
      <p className="text-8xl mb-4">🔍</p>
      <h1 className="text-5xl font-bold text-white mb-3">404</h1>
      <p className="text-slate-400 mb-8">This page doesn't exist.</p>
      <Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
        Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
