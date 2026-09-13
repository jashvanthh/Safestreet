/**
 * components/IncidentCard.jsx
 *
 * Compact card used in:
 *   - MapPage sidebar (list of incidents next to the map)
 *   - Future: search results
 *
 * Props:
 *   incident — incident object from the API
 *   onClick  — called when card is clicked (highlights pin on map)
 *   isActive — highlights the card when its pin is selected on the map
 */
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = {
  poor_lighting:       '💡',
  harassment:          '⚠️',
  unsafe_intersection: '🚦',
  suspicious_activity: '👁️',
  other:               '📌',
};

const IncidentCard = ({ incident, onClick, isActive }) => {
  const icon = CATEGORY_ICONS[incident.category] || '📌';
  const [lng, lat] = incident.location.coordinates;  // GeoJSON [lng,lat] → swap for display

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border p-4 transition-all
        ${isActive
          ? 'bg-blue-600/20 border-blue-500/60'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={incident.status} />
          </div>
          <h3 className="text-white text-sm font-semibold truncate">{incident.title}</h3>
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{incident.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-500 text-xs">
              {new Date(incident.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
            </span>
            <Link
              to={`/incidents/${incident._id}`}
              onClick={(e) => e.stopPropagation()}  // Don't trigger parent onClick
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
