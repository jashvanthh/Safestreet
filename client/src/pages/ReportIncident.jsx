import { Link } from 'react-router-dom';
const ReportIncident = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div className="text-center">
      <span className="text-6xl block mb-4">📢</span>
      <h1 className="text-3xl font-bold text-white mb-3">Report Incident</h1>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">Coming in Phase 5 — Submit incidents with photo and location.</p>
      <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Home</Link>
    </div>
  </div>
);
export default ReportIncident;
