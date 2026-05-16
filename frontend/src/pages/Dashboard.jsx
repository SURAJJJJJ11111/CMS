import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI, analyticsAPI } from '../api/api';
import ComplaintCard from '../components/ComplaintCard';
import { Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes] = await Promise.all([
        complaintAPI.getAll({ page: 0, size: 5 }),
      ]);
      setComplaints(cRes.data.content || []);

      if (isManager()) {
        const aRes = await analyticsAPI.getSummary();
        setAnalytics(aRes.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-primary-400">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {user?.role === 'USER' && (
          <button
            id="btn-new-complaint"
            onClick={() => navigate('/complaints/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            New Complaint
          </button>
        )}
      </div>

      {/* Stats (Manager only) */}
      {isManager() && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Ticket}       label="Total Complaints"   value={analytics.totalComplaints}   color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Clock}        label="Open Tickets"       value={analytics.openComplaints}    color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={CheckCircle2} label="Resolved"           value={analytics.resolvedComplaints} color="bg-emerald-500/20 text-emerald-400"
                    sub={`+${analytics.resolvedLast7Days} this week`} />
          <StatCard icon={AlertTriangle} label="Escalated"         value={analytics.escalatedComplaints} color="bg-red-500/20 text-red-400" />
        </div>
      )}

      {/* Quick stats for non-managers */}
      {!isManager() && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Ticket}       label="My Complaints"   value={complaints.filter(c => c.status === 'OPEN').length + complaints.filter(c => c.status === 'IN_PROGRESS').length} color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Clock}        label="In Progress"     value={complaints.filter(c => c.status === 'IN_PROGRESS').length} color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={CheckCircle2} label="Resolved"        value={complaints.filter(c => c.status === 'RESOLVED').length}  color="bg-emerald-500/20 text-emerald-400" />
        </div>
      )}

      {/* Recent Complaints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-400" />
            Recent Complaints
          </h3>
          <button
            onClick={() => navigate('/complaints')}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="card p-12 text-center">
            <Ticket size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No complaints yet.</p>
            {user?.role === 'USER' && (
              <button onClick={() => navigate('/complaints/new')} className="btn-primary mt-4">
                Raise your first complaint
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {complaints.map(c => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onClick={() => navigate(`/complaints/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
