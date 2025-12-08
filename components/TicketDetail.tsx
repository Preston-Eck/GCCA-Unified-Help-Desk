import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, Priority, User } from '../types';
import { 
  updateTicket, addTicketComment, updateTicketStatus, 
  getAttachments, claimTicket
} from '../services/dataService';
import { 
  ArrowLeft, Clock, User as UserIcon, Tag, AlertCircle, 
  MessageSquare, Paperclip, CheckCircle, Send
} from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  onBack: () => void;
  onUpdate: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, currentUser, onBack, onUpdate }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use local state for immediate UI updates
  const [localTicket, setLocalTicket] = useState<Ticket>(ticket);

  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateTicketStatus(localTicket.id, newStatus);
      setLocalTicket(prev => ({ ...prev, status: newStatus }));
      onUpdate();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    try {
      // FIXED: Calling updateTicket with 2 arguments (id, updates)
      await updateTicket(localTicket.id, { priority: newPriority });
      setLocalTicket(prev => ({ ...prev, priority: newPriority }));
      onUpdate();
    } catch (error) {
      console.error('Failed to update priority', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      await addTicketComment(localTicket.id, comment);
      setComment('');
      // In a real app we would reload comments here
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      await claimTicket(localTicket.id);
      setLocalTicket(prev => ({ ...prev, assignedTo: currentUser.name }));
      onUpdate();
    } catch (error) {
      console.error('Failed to claim ticket', error);
    }
  };

  // Helper for color coding
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.Critical: return 'text-red-600 bg-red-50';
      case Priority.High: return 'text-orange-600 bg-orange-50';
      case Priority.Medium: return 'text-blue-600 bg-blue-50';
      case Priority.Low: return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-4 flex items-center text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{localTicket.title}</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(localTicket.priority)}`}>
              {localTicket.priority}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Created: {localTicket.createdAt ? new Date(localTicket.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Type: {localTicket.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>Assigned: {localTicket.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap">
                {localTicket.description}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments
              </h3>
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a note or update..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || !comment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
              <div className="text-center text-slate-500 py-4 italic">
                No comments yet.
              </div>
            </section>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-medium text-slate-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {!localTicket.assignedTo && (
                  <button 
                    onClick={handleClaim}
                    className="w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Claim Ticket
                  </button>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select 
                    value={localTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {Object.values(TicketStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                  <select 
                    value={localTicket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {Object.values(Priority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;