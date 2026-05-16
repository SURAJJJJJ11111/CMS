import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../api/api';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES   = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const DEPARTMENTS = ['', 'IT', 'HR', 'FINANCE', 'OPERATIONS', 'LEGAL', 'SUPPORT', 'GENERAL'];

export default function ComplaintList() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [page, status, department]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, size: 8 };
      if (status)     params.status = status;
      if (department) params.department = department;
      const res = await complaintAPI.getAll(params);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? (data.content || []).filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()))
    : (data.content || []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Complaints</h2>
          <p className="text-slate-400 text-sm">{data.totalElements} total tickets</p>
        </div>
        {user?.role === 'USER' && (
          <button id="btn-create-complaint" onClick={() => navigate('/complaints/new')} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Complaint
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search complaints..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-500" />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
            className="input-field text-sm"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
          </select>
        </div>
        {isManager() && (
          <select
            value={department}
            onChange={e => { setDepartment(e.target.value); setPage(0); }}
            className="input-field text-sm"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'All Depts'}</option>)}
          </select>
        )}
      </div>

      {/* Complaint Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-slate-400">No complaints found.</p>
          {user?.role === 'USER' && (
            <button onClick={() => navigate('/complaints/new')} className="btn-primary mt-4">
              Raise a complaint
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => navigate(`/complaints/${c.id}`)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary p-2"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-slate-400 text-sm">
            Page {page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
            className="btn-secondary p-2"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
