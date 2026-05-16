import { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Clock, TrendingUp, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
      {sub && <p className="text-primary-400 text-xs mt-1 font-medium">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 shadow-xl">
      <p className="text-white text-sm font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-400 text-xs mt-1">
          {p.name}: <span className="text-white font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <p className="text-slate-400">No data available.</p>;

  const deptData = Object.entries(data.complaintsByDepartment || {})
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  const priorityData = Object.entries(data.complaintsByPriority || {})
    .map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(data.complaintsByStatus || {})
    .map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={26} className="text-primary-400" />
          Analytics Dashboard
        </h2>
        <p className="text-slate-400 text-sm mt-1">Real-time complaint performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket}        label="Total Complaints"  value={data.totalComplaints}      color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Clock}         label="Open Tickets"      value={data.openComplaints}       color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={CheckCircle2}  label="Resolved (7d)"     value={data.resolvedLast7Days}    color="bg-emerald-500/20 text-emerald-400"
                  sub={`${data.resolvedComplaints} total resolved`} />
        <StatCard icon={AlertTriangle} label="Escalated"         value={data.escalatedComplaints}  color="bg-red-500/20 text-red-400" />
      </div>

      {/* Avg Resolution Time */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-primary-600/20 rounded-2xl flex items-center justify-center">
          <TrendingUp size={28} className="text-primary-400" />
        </div>
        <div>
          <p className="text-slate-400 text-sm">Average Resolution Time</p>
          <p className="text-3xl font-bold text-white mt-1">
            {data.avgResolutionHours != null
              ? `${data.avgResolutionHours.toFixed(1)}h`
              : 'N/A'}
          </p>
          <p className="text-slate-500 text-xs mt-1">across all resolved complaints</p>
        </div>
        {data.avgResolutionHours != null && (
          <div className="ml-auto">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              data.avgResolutionHours <= 24 ? 'bg-emerald-500/20 text-emerald-400' :
              data.avgResolutionHours <= 48 ? 'bg-amber-500/20 text-amber-400' :
                                              'bg-red-500/20 text-red-400'
            }`}>
              {data.avgResolutionHours <= 24 ? '✓ Within SLA' :
               data.avgResolutionHours <= 48 ? '⚠ Near SLA Limit' : '✗ SLA Breached'}
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Dept Bar Chart */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-5">Complaints by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Complaints" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-5">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                   dataKey="value" nameKey="name" paddingAngle={3}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-5">Complaints by Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][i] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-4">Status Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'Open',        value: data.openComplaints,        pct: data.totalComplaints, color: 'bg-blue-500' },
              { label: 'In Progress', value: data.inProgressComplaints,  pct: data.totalComplaints, color: 'bg-amber-500' },
              { label: 'Resolved',    value: data.resolvedComplaints,    pct: data.totalComplaints, color: 'bg-emerald-500' },
              { label: 'Closed',      value: data.closedComplaints,      pct: data.totalComplaints, color: 'bg-slate-500' },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-white font-medium">{value} ({pct > 0 ? Math.round(value / pct * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-700`}
                    style={{ width: pct > 0 ? `${(value / pct) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
