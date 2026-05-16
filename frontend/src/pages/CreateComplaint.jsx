import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';

const PRIORITIES   = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DEPARTMENTS  = ['IT', 'HR', 'FINANCE', 'OPERATIONS', 'LEGAL', 'SUPPORT', 'GENERAL'];

const PRIORITY_COLORS = {
  LOW: 'text-green-400', MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400', CRITICAL: 'text-red-400'
};

export default function CreateComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM',
    department: user?.department || 'GENERAL'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await complaintAPI.create(form);
      toast.success('Complaint raised successfully!');
      navigate(`/complaints/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <button onClick={() => navigate('/complaints')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-white">Raise a Complaint</h2>
        <p className="text-slate-400 text-sm mt-1">Describe your issue and we'll route it to the right team</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Title *</label>
            <input
              id="complaint-title"
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="Brief summary of the issue"
              required
              maxLength={200}
            />
            <p className="text-slate-500 text-xs mt-1">{form.title.length}/200</p>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Description *</label>
            <textarea
              id="complaint-desc"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field min-h-36 resize-y"
              placeholder="Describe the issue in detail (min 20 characters)..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Priority</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-200
                      ${form.priority === p
                        ? 'bg-dark-600 border-primary-600 text-white'
                        : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500'
                      }`}
                  >
                    <span className={PRIORITY_COLORS[p]}>●</span> {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Department</label>
              <select
                id="complaint-dept"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="input-field"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <p className="text-slate-500 text-xs mt-1">
                Only agents from this dept will handle your ticket
              </p>
            </div>
          </div>

          {/* SLA notice */}
          <div className="flex items-start gap-3 p-3 bg-primary-900/20 border border-primary-800/40 rounded-xl">
            <div className="w-5 h-5 bg-primary-600/30 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-primary-400 text-xs font-bold">i</span>
            </div>
            <p className="text-primary-300 text-xs leading-relaxed">
              Your complaint will be resolved within <strong>48 hours</strong> (SLA). Unresolved tickets will be automatically escalated to the manager.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/complaints')} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Send size={16} />}
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
