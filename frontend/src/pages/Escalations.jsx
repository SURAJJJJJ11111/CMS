import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { escalationAPI } from '../api/api';
import { AlertTriangle, Clock, User, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Escalations() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    escalationAPI.getAll()
      .then(res => setEscalations(res.data))
      .catch(() => toast.error('Failed to load escalations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <AlertTriangle size={24} className="text-orange-400" />
          Escalations
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {escalations.length} escalated complaints — requires immediate attention
        </p>
      </div>

      {escalations.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-emerald-400" />
          </div>
          <p className="text-white font-semibold">No escalations</p>
          <p className="text-slate-400 text-sm mt-1">All complaints are within SLA. Great job! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalations.map(e => (
            <div
              key={e.id}
              className="card p-5 border-orange-500/20 hover:border-orange-500/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    e.automatic ? 'bg-red-500/20' : 'bg-orange-500/20'
                  }`}>
                    <AlertTriangle size={16} className={e.automatic ? 'text-red-400' : 'text-orange-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">
                        Complaint #{e.complaintId}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        e.automatic
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                      }`}>
                        {e.automatic ? 'Auto-escalated' : 'Manual'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm font-medium">{e.complaintTitle}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      <span className="font-medium text-slate-300">Reason:</span> {e.reason}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/complaints/${e.complaintId}`)}
                  className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <ExternalLink size={12} />
                  View
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User size={11} />
                  By: {e.escalatedByName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={11} />
                  {new Date(e.escalatedAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
