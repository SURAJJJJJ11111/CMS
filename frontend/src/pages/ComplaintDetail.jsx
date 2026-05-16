import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintAPI, userAPI, escalationAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, User, Building2, AlertTriangle, Star,
  MessageSquare, Send, Paperclip, CheckCircle2, Activity, Edit2, Trash2, Download, FileText, Image as ImageIcon
} from 'lucide-react';

const STATUS_OPTIONS = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange && onChange(star)}
          disabled={!onChange}
          className={`transition-colors ${star <= value ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
        >
          <Star size={22} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager, isAgent } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const [cRes, commRes, auditRes, attRes] = await Promise.all([
        complaintAPI.getById(id),
        complaintAPI.getComments(id),
        complaintAPI.getAuditLogs(id),
        complaintAPI.getAttachments(id),
      ]);
      setComplaint(cRes.data);
      setComments(commRes.data);
      setAuditLogs(auditRes.data);
      setAttachments(attRes.data);

      if (isManager()) {
        const agentsRes = await userAPI.getAgents(cRes.data.department);
        setAgents(agentsRes.data);
      }
    } catch (err) {
      toast.error('Failed to load complaint details');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await complaintAPI.addComment(id, { content: commentText });
      setComments(prev => [...prev, res.data]);
      setCommentText('');
      toast.success('Comment added');
      fetchComplaint(); // to refresh timeline
    } catch { toast.error('Failed to add comment'); }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await complaintAPI.editComment(commentId, { content: editCommentText });
      setComments(prev => prev.map(c => c.id === commentId ? res.data : c));
      setEditingComment(null);
      toast.success('Comment updated');
    } catch { toast.error('Failed to update comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await complaintAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    try {
      await complaintAPI.updateStatus(id, { status: newStatus, comment: statusComment });
      setNewStatus('');
      setStatusComment('');
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    try {
      await complaintAPI.assign(id, selectedAgent);
      toast.success('Agent assigned successfully');
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      await complaintAPI.rate(id, { rating, feedback: ratingFeedback });
      toast.success('Thanks for your feedback!');
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rating failed');
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) return;
    try {
      await escalationAPI.manualEscalate(id, escalateReason);
      toast.success('Complaint escalated');
      setEscalateReason('');
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Escalation failed');
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    try {
      await complaintAPI.uploadFile(id, file);
      toast.success('File uploaded');
      setFile(null);
      fetchComplaint();
    } catch { toast.error('Upload failed'); }
  };

  const handleDownloadAttachment = async (attId, fileName, fileType) => {
    try {
      const res = await complaintAPI.downloadAttachment(attId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: fileType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download file');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!complaint) return null;

  const isOwner = user?.id === complaint.raisedBy?.id;
  const isAssignedAgent = user?.id === complaint.assignedTo?.id;
  const canChangeStatus = isManager() || isAssignedAgent;
  const nextStatuses = STATUS_OPTIONS[complaint.status] || [];

  const statusColor = {
    OPEN: 'badge-open', IN_PROGRESS: 'badge-in_progress',
    RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
  };
  const priorityColor = {
    CRITICAL: 'badge-critical', HIGH: 'badge-high',
    MEDIUM: 'badge-medium', LOW: 'badge-low',
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN') : '—';

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/complaints')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back to complaints
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 text-sm font-mono">#{complaint.id}</span>
              {complaint.escalated && (
                <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                  <AlertTriangle size={10} /> Escalated
                </span>
              )}
              {complaint.slaBreached && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
                  <Clock size={10} /> SLA Breached
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{complaint.title}</h2>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold uppercase ${priorityColor[complaint.priority]}`}>
              {complaint.priority}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold uppercase ${statusColor[complaint.status]}`}>
              {complaint.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-5">{complaint.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Raised By</p>
            <div className="flex items-center gap-2 text-slate-200">
              <User size={14} className="text-slate-400" />
              {complaint.raisedBy?.name}
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Assigned To</p>
            <div className="flex items-center gap-2 text-slate-200">
              <User size={14} className="text-slate-400" />
              {complaint.assignedTo?.name || <span className="text-slate-600 italic">Unassigned</span>}
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Department</p>
            <div className="flex items-center gap-2 text-slate-200">
              <Building2 size={14} className="text-slate-400" />
              {complaint.department}
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1">SLA Deadline</p>
            <div className={`flex items-center gap-2 ${complaint.slaBreached ? 'text-red-400' : 'text-slate-200'}`}>
              <Clock size={14} className={complaint.slaBreached ? 'text-red-400' : 'text-slate-400'} />
              {fmt(complaint.slaDeadline)}
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Created</p>
            <span className="text-slate-200">{fmt(complaint.createdAt)}</span>
          </div>
          {complaint.resolvedAt && (
            <div>
              <p className="text-slate-500 mb-1">Resolved</p>
              <span className="text-emerald-400">{fmt(complaint.resolvedAt)}</span>
            </div>
          )}
          {complaint.rating && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Rating</p>
              <div className="flex items-center gap-2">
                <StarRating value={complaint.rating} />
                {complaint.ratingFeedback && <span className="text-slate-400 text-xs">— {complaint.ratingFeedback}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          
          {/* Attachments Section */}
          <div className="card p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Paperclip size={18} className="text-primary-400" />
              Attachments ({attachments.length})
            </h3>
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="bg-dark-700/50 rounded-xl p-3 flex flex-col justify-between group border border-dark-600 hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      {att.fileType?.includes('image') ? <ImageIcon size={20} className="text-blue-400" /> : <FileText size={20} className="text-slate-400" />}
                      <span className="text-xs text-slate-300 font-medium truncate flex-1" title={att.fileName}>{att.fileName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500 uppercase">{(att.fileSize / 1024).toFixed(1)} KB</span>
                      <button 
                        onClick={() => handleDownloadAttachment(att.id, att.fileName, att.fileType)}
                        className="text-primary-400 hover:text-white transition-colors bg-primary-500/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No files attached.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="card p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-primary-400" />
              Comments ({comments.length})
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pr-1">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No comments yet</p>
              ) : comments.map(c => (
                <div key={c.id} className="bg-dark-700 rounded-xl p-4 relative group border border-transparent hover:border-dark-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-200 text-sm font-semibold">{c.authorName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 bg-dark-600 px-2 py-0.5 rounded-full">{c.authorRole}</span>
                      <span className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                    </div>
                  </div>
                  
                  {editingComment === c.id ? (
                    <div className="mt-2">
                      <textarea 
                        className="input-field text-sm w-full mb-2" 
                        value={editCommentText} 
                        onChange={(e) => setEditCommentText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingComment(null)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
                        <button onClick={() => handleEditComment(c.id)} className="btn-primary text-xs px-3 py-1">Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  )}

                  {/* Comment Actions */}
                  {!editingComment && (user?.id === c.authorId || isManager()) && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-dark-800 rounded-lg shadow-lg border border-dark-600 p-0.5">
                      {user?.id === c.authorId && (
                        <button onClick={() => { setEditingComment(c.id); setEditCommentText(c.content); }} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteComment(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Type a comment..."
                className="input-field text-sm flex-1"
              />
              <button onClick={handleAddComment} className="btn-primary p-2.5 px-4 shadow-lg shadow-primary-500/20">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Actions Panel */}
          <div className="space-y-4">
            {canChangeStatus && nextStatuses.length > 0 && (
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-3">Update Status</h4>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field text-sm mb-2">
                  <option value="">Select new status</option>
                  {nextStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <input value={statusComment} onChange={e => setStatusComment(e.target.value)} placeholder="Add a note..." className="input-field text-sm mb-2" />
                <button onClick={handleStatusUpdate} disabled={!newStatus} className="btn-primary w-full text-sm">
                  <CheckCircle2 size={15} className="inline mr-1" /> Update Status
                </button>
              </div>
            )}

            {isManager() && !complaint.assignedTo && (
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-3">Assign Agent</h4>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="input-field text-sm mb-2">
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.department})</option>)}
                </select>
                <button onClick={handleAssign} disabled={!selectedAgent} className="btn-primary w-full text-sm">Assign Agent</button>
              </div>
            )}

            {isManager() && !complaint.escalated && complaint.status !== 'CLOSED' && (
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-orange-400" /> Escalate
                </h4>
                <input value={escalateReason} onChange={e => setEscalateReason(e.target.value)} placeholder="Reason for escalation..." className="input-field text-sm mb-2" />
                <button onClick={handleEscalate} disabled={!escalateReason.trim()} className="btn-danger w-full text-sm">Escalate Complaint</button>
              </div>
            )}

            {isOwner && (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && !complaint.rating && (
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-3">Rate Resolution</h4>
                <StarRating value={rating} onChange={setRating} />
                <input value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)} placeholder="Your feedback (optional)" className="input-field text-sm mt-3 mb-2" />
                <button onClick={handleRate} disabled={!rating} className="btn-primary w-full text-sm mt-1">Submit Rating</button>
              </div>
            )}

            <div className="card p-4 border-dashed border-2 border-dark-600 bg-dark-800/50">
              <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Paperclip size={14} className="text-primary-400" /> Attach File
              </h4>
              <input type="file" onChange={e => setFile(e.target.files[0])} className="text-xs text-slate-400 mb-3 w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20" />
              <button onClick={handleFileUpload} disabled={!file} className="btn-secondary w-full text-sm">Upload File</button>
            </div>
          </div>

          {/* Timeline Activity Panel */}
          <div className="card p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-5">
              <Activity size={18} className="text-primary-400" />
              Activity Timeline
            </h3>
            <div className="relative border-l border-dark-600 ml-3 space-y-6 pb-2">
              {auditLogs.map((log, index) => (
                <div key={log.id} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-dark-600 border-[3px] border-dark-800 ring-1 ring-dark-500" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-white">{log.action.replace(/_/g, ' ')}</span>
                    <p className="text-xs text-slate-400 leading-snug">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><User size={10}/> {log.performedBy}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
