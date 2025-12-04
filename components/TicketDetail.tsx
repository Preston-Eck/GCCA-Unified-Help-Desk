
import React, { useState } from 'react';
import { Ticket, User, TicketStatus } from '../types';
import { updateTicketStatus, addTicketComment, toggleTicketPublic, lookup } from '../services/dataService';
import { X, User as UserIcon, Calendar, MessageSquare, Send, Globe, Lock } from 'lucide-react';

interface Props {
  ticket: Ticket;
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const TicketDetail: React.FC<Props> = ({ ticket, user, onClose, onUpdate }) => {
  const [newComment, setNewComment] = useState('');

  // Permissions
  const roles = user.User_Type;
  const isApprover = roles.includes('Approver');
  const isChair = roles.includes('Chair');
  const isTech = roles.includes('Tech');
  const isAdmin = roles.includes('Admin');
  const canModify = isApprover || isChair || isTech || isAdmin;
  const canPublish = isApprover || isChair || isAdmin;

  const handleStatusChange = (newStatus: string) => {
    updateTicketStatus(ticket.TicketID, newStatus as any, user.Email);
    onUpdate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addTicketComment(ticket.TicketID, user.Email, newComment);
    setNewComment('');
    onUpdate();
  };

  const togglePublic = () => {
    toggleTicketPublic(ticket.TicketID, !ticket.IsPublic);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-[#355E3B] text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">{ticket.TicketID}</span>
              {ticket.IsPublic && <span className="flex items-center gap-1 bg-blue-500/80 px-2 py-0.5 rounded text-xs"><Globe className="w-3 h-3"/> Public</span>}
            </div>
            <h2 className="text-xl font-bold">{ticket.Title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold">Location</label>
               <div className="text-sm font-medium text-gray-900">
                 {lookup.building(ticket.BuildingID_Ref)} - {lookup.location(ticket.LocationID_Ref)}
               </div>
             </div>
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold">Category</label>
               <div className="text-sm font-medium text-gray-900">{ticket.Category}</div>
             </div>
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold">Status</label>
               <div className="mt-1">
                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                   ticket.Status === 'New' ? 'bg-blue-100 text-blue-800' :
                   ticket.Status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' :
                   ticket.Status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                 }`}>
                   {ticket.Status}
                 </span>
               </div>
             </div>
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold">Priority</label>
               <div className={`text-sm font-bold ${
                   ticket.Priority === 'Critical' ? 'text-red-600' : 
                   ticket.Priority === 'High' ? 'text-orange-600' : 'text-gray-600'
               }`}>
                 {ticket.Priority}
               </div>
             </div>
          </div>

          {/* Description */}
          <div>
             <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
             <p className="text-gray-700 bg-white border border-gray-100 p-3 rounded">{ticket.Description}</p>
          </div>

          {/* History / Comments */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Activity History
            </h3>
            <div className="space-y-4">
              {ticket.Comments.length === 0 && <p className="text-sm text-gray-400 italic">No activity yet.</p>}
              
              {ticket.Comments.map(c => (
                <div key={c.CommentID} className={`flex gap-3 ${c.IsStatusChange ? 'opacity-75' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.IsStatusChange ? 'bg-gray-200' : 'bg-[#355E3B] text-white'}`}>
                     {c.IsStatusChange ? <Calendar className="w-4 h-4 text-gray-500"/> : <UserIcon className="w-4 h-4"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">{c.Author_Email}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.Timestamp).toLocaleString()}</span>
                    </div>
                    <div className={`text-sm mt-1 ${c.IsStatusChange ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                      {c.Text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          
          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Add a comment or update..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            />
            <button type="submit" disabled={!newComment.trim()} className="bg-[#355E3B] text-white p-2 rounded hover:bg-green-800 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Controls */}
          {canModify && (
             <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
               <div className="flex items-center gap-2">
                 <label className="text-xs font-bold text-gray-600">Update Status:</label>
                 <select 
                   value={ticket.Status} 
                   onChange={(e) => handleStatusChange(e.target.value)}
                   className="text-sm border-gray-300 rounded focus:ring-[#355E3B]"
                 >
                   {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               {canPublish && (
                 <button 
                   onClick={togglePublic}
                   className={`ml-auto text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${ticket.IsPublic ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                 >
                   {ticket.IsPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                   {ticket.IsPublic ? 'Publicly Visible' : 'Internal Only'}
                 </button>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
