import { Clock, AlertTriangle, User, MessageSquare, Paperclip } from 'lucide-react';

const statusColors = {
  OPEN: 'badge-open',
  IN_PROGRESS: 'badge-in_progress',
  RESOLVED: 'badge-resolved',
  CLOSED: 'badge-closed',
};

const priorityColors = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
};

function Badge({ label, colorClass }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${colorClass}`}>
      {label}
    </span>
  );
}

export default function ComplaintCard({ complaint, onClick }) {
  const slaBreached = complaint.slaBreached;
  const escalated   = complaint.escalated;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`card p-5 cursor-pointer hover:border-primary-700/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary-900/10 group animate-slide-up
        ${slaBreached ? 'border-red-500/30 hover:border-red-500/50' : ''}
        ${escalated ? 'border-orange-500/30' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-mono">#{complaint.id}</span>
            {escalated && (
              <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                <AlertTriangle size={10} />
                Escalated
              </span>
            )}
            {slaBreached && !escalated && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
                <Clock size={10} />
                SLA Breached
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm group-hover:text-primary-300 transition-colors line-clamp-1">
            {complaint.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge label={complaint.priority} colorClass={priorityColors[complaint.priority]} />
          <Badge label={complaint.status?.replace('_', ' ')} colorClass={statusColors[complaint.status]} />
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
        {complaint.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <User size={12} />
            {complaint.raisedBy?.name}
          </span>
          <span className="px-2 py-0.5 bg-dark-700 rounded-full text-slate-400">
            {complaint.department}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {complaint.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={11} />
              {complaint.commentCount}
            </span>
          )}
          {complaint.attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} />
              {complaint.attachmentCount}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(complaint.createdAt)}
          </span>
        </div>
      </div>

      {/* SLA bar */}
      {complaint.slaDeadline && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>SLA Deadline</span>
            <span className={slaBreached ? 'text-red-400' : 'text-slate-400'}>
              {formatDate(complaint.slaDeadline)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
