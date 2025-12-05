
import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketStatus, TicketAttachment, SOP, Asset, VendorBid, VendorReview } from '../types';
import { updateTicketStatus, addTicketComment, toggleTicketPublic, lookup, getAttachments, getSOPsForAsset, getAssetDetails, getTechnicians, getBidsForTicket, acceptBid, claimTicket, getAttachmentsForBid, getVendorReview, addVendorReview, mergeTickets } from '../services/dataService';
import { X, User as UserIcon, Calendar, MessageSquare, Send, Globe, Lock, Paperclip, FileText, Settings, AlertCircle, ShoppingBag, Check, Hand, Truck, Star, GitMerge } from 'lucide-react';

interface Props {
  ticket: Ticket;
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const TicketDetail: React.FC<Props> = ({ ticket, user, onClose, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [assetDetails, setAssetDetails] = useState<Asset | undefined>(undefined);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [bids, setBids] = useState<VendorBid[]>([]);
  
  // Review State
  const [review, setReview] = useState<VendorReview | undefined>(undefined);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewInput, setReviewInput] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Merge State
  const [isMerging, setIsMerging] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Permissions
  const roles = user.User_Type;
  const isParent = roles.includes('Parent');
  const isApprover = roles.includes('Approver');
  const isChair = roles.includes('Chair');
  const isTech = roles.includes('Tech');
  const isAdmin = roles.includes('Admin');
  const isBoard = roles.includes('Board');

  // Authorization Checks
  const canModify = !isParent && (isApprover || isChair || isTech || isAdmin || isBoard);
  const canPublish = isApprover || isChair || isAdmin || isBoard;
  const canAssign = isApprover || isChair || isAdmin || isBoard;
  const canVendor = isApprover || isChair || isAdmin || isBoard;
  const canMerge = isApprover || isChair || isAdmin || isBoard;

  // Load Extra Data
  useEffect(() => {
    setAttachments(getAttachments(ticket.TicketID));
    if (ticket.Related_AssetID_Ref) {
      setSops(getSOPsForAsset(ticket.Related_AssetID_Ref));
      setAssetDetails(getAssetDetails(ticket.Related_AssetID_Ref));
    }
    if (canAssign) {
      setTechnicians(getTechnicians());
    }
    if (canVendor) {
      setBids(getBidsForTicket(ticket.TicketID));
      setReview(getVendorReview(ticket.TicketID));
    }
  }, [ticket, canAssign, canVendor]);

  const handleStatusChange = (newStatus: string) => {
    updateTicketStatus(ticket.TicketID, newStatus as any, user.Email);
    onUpdate();
  };

  const handleAssignmentChange = (techEmail: string) => {
    updateTicketStatus(ticket.TicketID, ticket.Status, user.Email, techEmail);
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

  const handleAcceptBid = (bidId: string) => {
    if(confirm("Accept this bid? This will assign the ticket.")) {
      acceptBid(bidId, ticket.TicketID);
      onUpdate();
    }
  };

  const handleClaim = () => {
    claimTicket(ticket.TicketID, user.Email);
    onUpdate();
  }

  const handleMerge = () => {
    if(!mergeTargetId) return;
    if(mergeTargetId === ticket.TicketID) { alert("Cannot merge into self."); return; }
    
    if(confirm(`Are you sure you want to merge THIS ticket (${ticket.TicketID}) INTO Ticket ${mergeTargetId}? This ticket will be closed.`)) {
      try {
        mergeTickets(mergeTargetId, ticket.TicketID, user.Email);
        alert("Merge successful.");
        onUpdate();
      } catch (e) {
        alert("Failed to merge. Check ID.");
      }
    }
  }

  const handleSubmitReview = () => {
    if (ticket.Assigned_VendorID_Ref) {
      addVendorReview(ticket.Assigned_VendorID_Ref, ticket.TicketID, user.Email, ratingInput, reviewInput);
      setReview(getVendorReview(ticket.TicketID));
      setIsReviewing(false);
    }
  }

  const BidAttachments = ({ bidId }: { bidId: string }) => {
    const files = getAttachmentsForBid(bidId);
    if (files.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map(f => (
          <a key={f.AttachmentID} href={f.Drive_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600">
             <Paperclip className="w-3 h-3" /> {f.File_Name}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-[#355E3B] text-white flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono tracking-wide">{ticket.TicketID}</span>
              {ticket.IsPublic && <span className="flex items-center gap-1 bg-blue-500/80 px-2 py-0.5 rounded text-xs"><Globe className="w-3 h-3"/> Public Board</span>}
              <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded text-xs"><Calendar className="w-3 h-3"/> {new Date(ticket.Date_Submitted).toLocaleDateString()}</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">{ticket.Title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 space-y-6">
            
            {/* Status Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${
                   ticket.Priority === 'Critical' ? 'bg-red-500 animate-pulse' : 
                   ticket.Priority === 'High' ? 'bg-orange-500' : 'bg-green-500'
                 }`}></div>
                 <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{ticket.Priority} Priority</span>
               </div>
               
               <div className="flex items-center gap-2">
                 {/* Quick Actions for Tech */}
                 {isTech && !ticket.Assigned_Staff && ticket.Status === 'New' && (
                    <button onClick={handleClaim} className="flex items-center gap-1 bg-[#355E3B] text-white text-xs px-3 py-1 rounded font-bold hover:bg-green-800">
                      <Hand className="w-3 h-3" /> Claim Ticket
                    </button>
                 )}

                 <span className="text-xs text-gray-500 uppercase font-bold ml-2">Current Status:</span>
                 <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase shadow-sm ${
                   ticket.Status === 'New' ? 'bg-blue-100 text-blue-800' :
                   ticket.Status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' :
                   ticket.Status === 'Open for Bid' ? 'bg-purple-100 text-purple-800' :
                   ticket.Status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                 }`}>
                   {ticket.Status}
                 </span>
               </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Col: Description & Attachments */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">Description of Issue</h3>
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

                {/* AI Plan (Hidden for Parents) */}
                {ticket.AI_Suggested_Plan && !isParent && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Suggested Plan
                    </h3>
                    <p className="text-sm text-indigo-900">{ticket.AI_Suggested_Plan}</p>
                  </div>
                )}

                {/* Attachments */}
                <div>
                   <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                     <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
                   </h3>
                   {attachments.length === 0 ? (
                     <p className="text-sm text-gray-400 italic bg-gray-100 p-3 rounded text-center">No files attached.</p>
                   ) : (
                     <div className="grid grid-cols-2 gap-3">
                       {attachments.map(att => (
                         <a 
                           key={att.AttachmentID} 
                           href={att.Drive_URL} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded hover:border-[#355E3B] hover:shadow-md transition-all group"
                         >
                           <div className="bg-gray-100 p-2 rounded text-gray-500 group-hover:bg-green-50 group-hover:text-green-700">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div className="overflow-hidden">
                             <div className="text-sm font-medium text-gray-700 truncate group-hover:text-[#355E3B]">{att.File_Name}</div>
                             <div className="text-[10px] text-gray-400 uppercase">{att.Mime_Type.split('/')[1] || 'FILE'}</div>
                           </div>
                         </a>
                       ))}
                     </div>
                   )}
                </div>

                {/* Vendor Bids Section (Only if authorized and relevant) */}
                {(ticket.Status === TicketStatus.OPEN_FOR_BID || bids.length > 0) && canVendor && (
                  <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Vendor Bids
                    </h3>
                    {bids.length === 0 ? (
                       <p className="text-xs text-purple-700 italic">No bids received yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {bids.map(bid => (
                          <div key={bid.BidID} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">{bid.VendorName}</div>
                              <div className="text-xs text-gray-500">{bid.Notes}</div>
                              <div className="text-xs font-mono mt-1 text-gray-400">{new Date(bid.DateSubmitted).toLocaleDateString()}</div>
                              <BidAttachments bidId={bid.BidID} />
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#355E3B]">${bid.Amount.toFixed(2)}</div>
                              {bid.Status === 'Pending' ? (
                                <button onClick={() => handleAcceptBid(bid.BidID)} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 hover:bg-green-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Accept
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">Accepted</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor Review Section */}
                {ticket.Assigned_VendorID_Ref && canVendor && (
                  <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
                    <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                       <Star className="w-4 h-4" /> Vendor Performance Review
                    </h3>
                    
                    {review ? (
                      <div className="bg-white p-4 rounded shadow-sm">
                        <div className="flex items-center gap-1 mb-2">
                           {[1,2,3,4,5].map(s => (
                             <Star key={s} className={`w-4 h-4 ${s <= review.Rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                           ))}
                           <span className="text-xs font-bold text-gray-600 ml-2">Rated by {review.Author_Email}</span>
                        </div>
                        <p className="text-sm text-gray-800 italic">"{review.Comment}"</p>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded shadow-sm">
                        {isReviewing ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                               <label className="text-xs font-bold text-gray-500 uppercase">Rating:</label>
                               <div className="flex gap-1">
                                 {[1,2,3,4,5].map(s => (
                                   <button key={s} onClick={() => setRatingInput(s)} type="button">
                                     <Star className={`w-5 h-5 ${s <= ratingInput ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                                   </button>
                                 ))}
                               </div>
                            </div>
                            <textarea 
                              placeholder="Leave a comment about the vendor's performance..."
                              className="w-full text-sm border border-gray-300 rounded p-2"
                              rows={2}
                              value={reviewInput}
                              onChange={e => setReviewInput(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button onClick={handleSubmitReview} className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-amber-600">Submit Review</button>
                              <button onClick={() => setIsReviewing(false)} className="text-gray-500 text-xs px-3 py-1.5 hover:bg-gray-100 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setIsReviewing(true)} className="text-sm text-amber-700 font-medium hover:underline flex items-center gap-1">
                            <Star className="w-4 h-4" /> Rate this Vendor
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Feed */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Case History
                  </h3>
                  <div className="space-y-4">
                    {ticket.Comments.map(c => (
                      <div key={c.CommentID} className={`flex gap-3 ${c.IsStatusChange ? 'opacity-75' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${c.IsStatusChange ? 'bg-gray-200' : 'bg-[#355E3B] text-white'}`}>
                           {c.IsStatusChange ? <Settings className="w-4 h-4 text-gray-500"/> : <UserIcon className="w-4 h-4"/>}
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-gray-900">{c.Author_Email}</span>
                            <span className="text-[10px] text-gray-400">{new Date(c.Timestamp).toLocaleString()}</span>
                          </div>
                          <div className={`text-sm mt-1 ${c.IsStatusChange ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                            {c.Text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {ticket.Comments.length === 0 && <p className="text-sm text-gray-400 italic">No activity recorded.</p>}
                  </div>
                </div>

              </div>

              {/* Right Col: Asset & Tech Info */}
              <div className="space-y-6">
                
                {/* Location Card */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Location Context</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-400 block">Campus</span>
                      <span className="text-sm font-medium">{lookup.campus(ticket.CampusID_Ref)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Building</span>
                      <span className="text-sm font-medium">{lookup.building(ticket.BuildingID_Ref)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Location</span>
                      <span className="text-sm font-medium">{lookup.location(ticket.LocationID_Ref)}</span>
                    </div>
                  </div>
                </div>

                {/* Asset Card */}
                {ticket.Related_AssetID_Ref && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Asset Details</h3>
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-gray-900">{lookup.asset(ticket.Related_AssetID_Ref)}</div>
                      {assetDetails && (
                        <>
                          <div className="text-xs text-gray-600 flex justify-between">
                             <span>Model:</span> <span>{assetDetails.Model_Number || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex justify-between">
                             <span>Serial:</span> <span className="font-mono">{assetDetails.Serial_Number || 'N/A'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* SOP Links */}
                    {sops.length > 0 && !isParent && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Related SOPs
                        </h4>
                        <div className="space-y-2">
                          {sops.map(sop => (
                            <div key={sop.SOP_ID} className="bg-amber-50 p-2 rounded text-xs border border-amber-100">
                              <div className="font-bold text-amber-900">{sop.SOP_Title}</div>
                              <div className="text-amber-800 mt-1 line-clamp-3">{sop.Concise_Procedure_Text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Merge Action */}
                {canMerge && (
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <GitMerge className="w-3 h-3" /> Merge Duplicates
                    </h3>
                    {isMerging ? (
                      <div className="space-y-2">
                         <input 
                           type="text" 
                           placeholder="Target Ticket ID (e.g. T-1005)"
                           className="w-full text-xs p-1 border rounded"
                           value={mergeTargetId}
                           onChange={e => setMergeTargetId(e.target.value)}
                         />
                         <div className="flex gap-2">
                           <button onClick={handleMerge} className="flex-1 bg-red-600 text-white text-xs py-1 rounded hover:bg-red-700">Confirm Merge</button>
                           <button onClick={() => setIsMerging(false)} className="flex-1 bg-gray-300 text-gray-700 text-xs py-1 rounded">Cancel</button>
                         </div>
                         <p className="text-[10px] text-gray-500">Warning: This ticket will be closed.</p>
                      </div>
                    ) : (
                      <button onClick={() => setIsMerging(true)} className="w-full text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded transition-colors">
                        Merge into another ticket
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Add a comment, update, or resolution notes..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-4 py-2 text-sm focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            />
            <button type="submit" disabled={!newComment.trim()} className="bg-[#355E3B] text-white px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50 font-medium text-sm flex items-center gap-2">
              <Send className="w-4 h-4" /> Post
            </button>
          </form>

          {canModify && (
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 border-t border-gray-100">
               
               <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Status:</label>
                   <select 
                     value={ticket.Status} 
                     onChange={(e) => handleStatusChange(e.target.value)}
                     className="text-sm border-gray-300 rounded focus:ring-[#355E3B] bg-gray-50 py-1"
                   >
                     {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>

                 {/* Tech Assignment Dropdown */}
                 {canAssign && (
                   <div className="flex items-center gap-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Assign:</label>
                     <select 
                       value={ticket.Assigned_Staff || ''} 
                       onChange={(e) => handleAssignmentChange(e.target.value)}
                       className="text-sm border-gray-300 rounded focus:ring-[#355E3B] bg-gray-50 py-1 max-w-[150px]"
                     >
                       <option value="">-- Unassigned --</option>
                       {technicians.map(t => (
                         <option key={t.UserID} value={t.Email}>{t.Name}</option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>
              
              <div className="flex gap-2">
                {/* Send to Vendor Action */}
                {canVendor && ticket.Status !== TicketStatus.OPEN_FOR_BID && ticket.Status !== TicketStatus.COMPLETED && (
                  <button 
                    onClick={() => handleStatusChange(TicketStatus.OPEN_FOR_BID)}
                    className="text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                  >
                    <Truck className="w-3 h-3" /> Send to Vendor
                  </button>
                )}

                {canPublish && (
                  <button 
                    onClick={togglePublic}
                    className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${ticket.IsPublic ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {ticket.IsPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {ticket.IsPublic ? 'Publicly Visible' : 'Mark Public'}
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

// Helper for icon needed above
function Sparkles(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  )
}

export default TicketDetail;
