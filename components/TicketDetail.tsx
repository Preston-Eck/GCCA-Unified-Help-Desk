import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketStatus, TicketAttachment, SOP, Asset, VendorBid, VendorReview, Priority } from '../types';
import { updateTicketStatus, addTicketComment, toggleTicketPublic, lookup, getAttachments, getSOPsForAsset, getAssetDetails, getTechnicians, getBidsForTicket, acceptBid, claimTicket } from '../services/dataService';
import { X, User as UserIcon, Calendar, MessageSquare, Send, Globe, Lock, Paperclip, FileText, Settings, AlertCircle, ShoppingBag, Check, Hand, Truck, Star, GitMerge } from 'lucide-react';
import TaskManager from './TaskManager'; // <--- NEW INTEGRATION

interface Props {
  ticket: Ticket;
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const TicketDetail: React.FC<Props> = ({ ticket, user, onClose, onUpdate }) => {
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [asset, setAsset] = useState<Asset | undefined>(undefined);
  const [techs, setTechs] = useState<User[]>([]);
  const [bids, setBids] = useState<VendorBid[]>([]);
  const [review, setReview] = useState<VendorReview | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showRate, setShowRate] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [showMerge, setShowMerge] = useState(false);

  // Safe Permissions Checks
  const userType = user?.User_Type || '';
  const isParent = userType.includes('Parent');
  const isApprover = userType.includes('Approver');
  const isChair = userType.includes('Chair');
  const isTech = userType.includes('Tech');
  const isAdmin = userType.includes('Admin');
  const isBoard = userType.includes('Board');

  const canEdit = !isParent && (isApprover || isChair || isTech || isAdmin || isBoard);
  const canAssign = isChair || isAdmin || isBoard;
  const canViewBids = isChair || isAdmin || isBoard;
  const canManage = isChair || isAdmin || isBoard;

  useEffect(() => {
    if (!ticket) return; // Safety Check
    setAttachments(getAttachments(ticket.TicketID) || []); // Default to []
    
    if (ticket.Related_AssetID_Ref) {
      setSops(getSOPsForAsset(ticket.Related_AssetID_Ref) || []);
      setAsset(getAssetDetails(ticket.Related_AssetID_Ref));
    }
    
    if (canAssign) setTechs(getTechnicians() || []);
    if (canViewBids) {
      setBids(getBidsForTicket(ticket.TicketID) || []);
      // setReview(getVendorReview(ticket.TicketID)); // Uncomment if review logic is ready
    }
  }, [ticket, canAssign, canViewBids]);

  const handleStatusChange = (status: string) => {
    updateTicketStatus(ticket.TicketID, status, user.Email);
    onUpdate();
  };

  const handleAssign = (email: string) => {
    updateTicketStatus(ticket.TicketID, ticket.Status, user.Email, email);
    onUpdate();
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addTicketComment(ticket.TicketID, user.Email, commentText);
      setCommentText('');
      onUpdate();
    }
  };

  const handleTogglePublic = () => {
    toggleTicketPublic(ticket.TicketID, !ticket.Is_Public);
    onUpdate();
  };

  const handleAcceptBid = (bidId: string) => {
    if(confirm("Accept this bid?")) {
       acceptBid(bidId, ticket.TicketID);
       onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="p-6 bg-[#355E3B] text-white flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono tracking-wide">{ticket.TicketID}</span>
              {ticket.Is_Public && <span className="flex items-center gap-1 bg-blue-500/80 px-2 py-0.5 rounded text-xs"><Globe className="w-3 h-3"/> Public</span>}
              <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded text-xs">
                <Calendar className="w-3 h-3"/> {new Date(ticket.Date_Submitted).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">{ticket.Title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 space-y-6">
            
            {/* STATUS BAR */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${ticket.Priority === Priority.CRITICAL ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                 <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{ticket.Priority} Priority</span>
               </div>
               <div className="flex items-center gap-2">
                 {!ticket.Assigned_Staff && ticket.Status === 'New' && isTech && (
                    <button onClick={() => { claimTicket(ticket.TicketID, user.Email); onUpdate(); }} className="flex items-center gap-1 bg-[#355E3B] text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-800">
                      <Hand className="w-3 h-3"/> Claim Ticket
                    </button>
                 )}
                 <span className="text-xs text-gray-500 uppercase font-bold ml-2">Current Status:</span>
                 <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">{ticket.Status}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Main Info */}
              <div className="md:col-span-2 space-y-6">
                 
                 {/* Description Box */}
                 <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                   <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">Description</h3>
                   <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{ticket.Description}</p>
                   <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                     Submitted by: <span className="font-medium text-gray-700">{ticket.Submitter_Email}</span>
                   </div>
                   {ticket.Assigned_Staff && (
                     <div className="mt-1 text-xs text-indigo-600 font-semibold bg-indigo-50 inline-block px-2 py-1 rounded border border-indigo-100">
                       Assigned to: {ticket.Assigned_Staff}
                     </div>
                   )}
                 </div>

                 {/* TASK MANAGER (New) */}
                 {!isParent && <TaskManager ticketId={ticket.TicketID} />}

                 {/* AI Plan */}
                 {ticket.AI_Suggested_Plan && !isParent && (
                   <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                     <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                       <Settings className="w-4 h-4"/> AI Suggested Plan
                     </h3>
                     <p className="text-sm text-indigo-900">{ticket.AI_Suggested_Plan}</p>
                   </div>
                 )}

                 {/* Attachments */}
                 <div>
                   <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                     <Paperclip className="w-4 h-4"/> Attachments ({attachments.length})
                   </h3>
                   {attachments.length === 0 ? (
                     <p className="text-sm text-gray-400 italic bg-gray-100 p-3 rounded text-center">No files attached.</p>
                   ) : (
                     <div className="grid grid-cols-2 gap-3">
                       {attachments.map(att => (
                         <a key={att.AttachmentID} href={att.Drive_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded hover:border-[#355E3B] hover:shadow-md transition-all group">
                           <div className="bg-gray-100 p-2 rounded text-gray-500 group-hover:bg-green-50 group-hover:text-green-700"><FileText className="w-5 h-5"/></div>
                           <div className="overflow-hidden">
                             <div className="text-sm font-medium text-gray-700 truncate group-hover:text-[#355E3B]">{att.File_Name}</div>
                             <div className="text-[10px] text-gray-400 uppercase">{att.Mime_Type.split('/')[1] || 'FILE'}</div>
                           </div>
                         </a>
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Comments / History */}
                 <div>
                   <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                     <MessageSquare className="w-4 h-4"/> Case History
                   </h3>
                   <div className="space-y-4">
                     {(ticket.Comments || []).map((c: any, idx: number) => (
                       <div key={idx} className={`flex gap-3 ${c.IsStatusChange ? 'opacity-75' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${c.IsStatusChange ? 'bg-gray-200' : 'bg-[#355E3B] text-white'}`}>
                           {c.IsStatusChange ? <Settings className="w-4 h-4 text-gray-500"/> : <UserIcon className="w-4 h-4"/>}
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex-1">
                           <div className="flex justify-between items-start">
                             <span className="text-xs font-bold text-gray-900">{c.Author || c.Author_Email}</span>
                             <span className="text-[10px] text-gray-400">{c.Timestamp ? new Date(c.Timestamp).toLocaleString() : ''}</span>
                           </div>
                           <div className={`text-sm mt-1 ${c.IsStatusChange ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                             {c.Text}
                           </div>
                         </div>
                       </div>
                     ))}
                     {(!ticket.Comments || ticket.Comments.length === 0) && <p className="text-sm text-gray-400 italic">No activity recorded.</p>}
                   </div>
                 </div>

              </div>

              {/* RIGHT COLUMN: Metadata */}
              <div className="space-y-6">
                
                {/* Location Card */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Location Context</h3>
                  <div className="space-y-3">
                    <div><span className="text-xs text-gray-400 block">Campus</span><span className="text-sm font-medium">{lookup.campus(ticket.CampusID_Ref)}</span></div>
                    <div><span className="text-xs text-gray-400 block">Building</span><span className="text-sm font-medium">{lookup.building(ticket.BuildingID_Ref || '')}</span></div>
                    <div><span className="text-xs text-gray-400 block">Location</span><span className="text-sm font-medium">{lookup.location(ticket.LocationID_Ref)}</span></div>
                  </div>
                </div>

                {/* Asset Card */}
                {ticket.Related_AssetID_Ref && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Asset Details</h3>
                    <div className="space-y-2">
                       <div className="text-sm font-bold text-gray-900">{lookup.asset(ticket.Related_AssetID_Ref)}</div>
                       {asset && (
                         <>
                           <div className="text-xs text-gray-600 flex justify-between"><span>Model:</span> <span>{asset.Model_Number || 'N/A'}</span></div>
                           <div className="text-xs text-gray-600 flex justify-between"><span>Serial:</span> <span className="font-mono">{asset.Serial_Number || 'N/A'}</span></div>
                         </>
                       )}
                    </div>
                  </div>
                )}
                
                {/* Bids Card */}
                {canManage && (ticket.Status === 'Open for Bid' || bids.length > 0) && (
                   <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <h3 className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Vendor Bids</h3>
                      {bids.length === 0 ? <p className="text-xs text-purple-700 italic">No bids yet.</p> : (
                        <div className="space-y-2">
                           {bids.map(b => (
                             <div key={b.BidID} className="bg-white p-2 rounded shadow-sm">
                               <div className="flex justify-between font-bold text-gray-900 text-xs">
                                 <span>{b.VendorName}</span>
                                 <span>${b.Amount}</span>
                               </div>
                               {b.Status === 'Pending' && <button onClick={() => handleAcceptBid(b.BidID)} className="text-[10px] text-green-600 hover:underline mt-1">Accept Bid</button>}
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                )}

                {/* Merge Tool */}
                {canManage && (
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><GitMerge className="w-3 h-3"/> Merge Duplicates</h3>
                    {showMerge ? (
                      <div className="space-y-2">
                         <input className="w-full text-xs p-1 border rounded" placeholder="Target Ticket ID" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} />
                         <div className="flex gap-2">
                           <button onClick={() => alert("Merge feature coming soon")} className="flex-1 bg-red-600 text-white text-xs py-1 rounded">Confirm</button>
                           <button onClick={() => setShowMerge(false)} className="flex-1 bg-gray-300 text-xs py-1 rounded">Cancel</button>
                         </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowMerge(true)} className="w-full text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded">Merge into another</button>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0 shadow-lg">
           <form onSubmit={handlePostComment} className="flex gap-2 mb-4">
             <input type="text" placeholder="Add a comment or update..." value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border border-gray-300 rounded px-4 py-2 text-sm focus:ring-2 focus:ring-[#355E3B] outline-none" />
             <button type="submit" disabled={!commentText.trim()} className="bg-[#355E3B] text-white px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50 font-medium text-sm flex items-center gap-2"><Send className="w-4 h-4"/> Post</button>
           </form>
           
           {canEdit && (
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 border-t border-gray-100">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Status:</label>
                    <select value={ticket.Status} onChange={e => handleStatusChange(e.target.value)} className="text-sm border-gray-300 rounded bg-gray-50 py-1">
                       {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 {canAssign && (
                   <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Assign:</label>
                      <select value={ticket.Assigned_Staff || ''} onChange={e => handleAssign(e.target.value)} className="text-sm border-gray-300 rounded bg-gray-50 py-1 max-w-[150px]">
                        <option value="">-- Unassigned --</option>
                        {techs.map(t => <option key={t.UserID} value={t.Email}>{t.Name}</option>)}
                      </select>
                   </div>
                 )}
               </div>
               
               <div className="flex gap-2">
                  {canManage && ticket.Status !== 'Open for Bid' && (
                     <button onClick={() => handleStatusChange('Open for Bid')} className="text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium bg-purple-100 text-purple-800 hover:bg-purple-200">
                       <Truck className="w-3 h-3"/> Send to Vendor
                     </button>
                  )}
                  {canManage && (
                    <button onClick={handleTogglePublic} className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium ${ticket.Is_Public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {ticket.Is_Public ? <Globe className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} {ticket.Is_Public ? 'Publicly Visible' : 'Mark Public'}
                    </button>
                  )}
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;