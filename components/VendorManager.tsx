
import React, { useState, useEffect } from 'react';
import { getVendors, updateVendorStatus, getVendorHistory, saveVendor, getTicketById, USERS_DB } from '../services/dataService';
import { Vendor, VendorBid, Ticket } from '../types';
import { CheckCircle, XCircle, Briefcase, Clock, Eye, X, Building2, Star, Archive, Edit, Save } from 'lucide-react';
import TicketDetail from './TicketDetail';

const VendorManager: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<'All' | 'Approved' | 'Pending' | 'Archived'>('All');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});

  // Ticket Detail View from History
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    setVendors(getVendors());
  }, [refreshKey]);

  useEffect(() => {
    if (selectedVendor) {
      setHistory(getVendorHistory(selectedVendor.VendorID));
      setEditForm(selectedVendor);
      setIsEditing(false);
    }
  }, [selectedVendor, refreshKey]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateVendorStatus(id, 'Approved');
    handleRefresh();
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateVendorStatus(id, 'Rejected');
    handleRefresh();
  };

  const handleArchive = () => {
    if(confirm('Are you sure you want to archive this vendor?')) {
      if (selectedVendor) updateVendorStatus(selectedVendor.VendorID, 'Archived');
      handleRefresh();
      setSelectedVendor(null);
    }
  }

  const handleSaveEdit = () => {
    if (selectedVendor && editForm.CompanyName && editForm.Email) {
      saveVendor({ ...selectedVendor, ...editForm } as Vendor);
      setIsEditing(false);
      handleRefresh();
      // Update local selection to reflect changes immediately
      setSelectedVendor({ ...selectedVendor, ...editForm } as Vendor);
    }
  }

  const handleTicketClick = (ticketId: string) => {
    const t = getTicketById(ticketId);
    if (t) setViewTicket(t);
  }

  const getProjectCount = (vendorId: string) => {
    return getVendorHistory(vendorId).filter(b => b.Status === 'Accepted').length;
  };

  const calculateAvgRating = (hist: any[]) => {
    const reviewed = hist.filter(h => h.review);
    if (reviewed.length === 0) return 0;
    const sum = reviewed.reduce((acc, curr) => acc + curr.review.Rating, 0);
    return (sum / reviewed.length).toFixed(1);
  }

  const filtered = vendors.filter(v => filter === 'All' || v.Status === filter);

  // Mock user for TicketDetail context (admin view)
  const adminUser = USERS_DB.find(u => u.User_Type.includes('Admin')) || USERS_DB[0];

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-[#355E3B] flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Vendor Management
          </h2>
          <div className="flex bg-gray-200 rounded p-1">
            {['All', 'Approved', 'Pending', 'Archived'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  filter === f ? 'bg-white shadow text-[#355E3B]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Projects</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map(v => (
                <tr 
                  key={v.VendorID} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedVendor(v)}
                >
                  <td className="p-4 font-medium">
                    {v.CompanyName}
                    <div className="text-xs text-gray-500">Joined: {new Date(v.DateJoined).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <div>{v.ContactName}</div>
                    <div className="text-xs text-gray-500">{v.Email}</div>
                  </td>
                  <td className="p-4">{v.ServiceType}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      v.Status === 'Approved' ? 'bg-green-100 text-green-800' : 
                      v.Status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                      v.Status === 'Archived' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-800'
                    }`}>
                      {v.Status}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-700">
                     {getProjectCount(v.VendorID)}
                  </td>
                  <td className="p-4 text-right">
                    {v.Status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => handleApprove(e, v.VendorID)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={(e) => handleReject(e, v.VendorID)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">Click to view details</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                 <tr><td colSpan={6} className="p-6 text-center text-gray-500 italic">No vendors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
             
             <div className="bg-[#355E3B] text-white p-5 flex justify-between items-start shrink-0">
               <div className="flex-1">
                 {isEditing ? (
                   <input 
                     value={editForm.CompanyName} 
                     onChange={e => setEditForm({...editForm, CompanyName: e.target.value})}
                     className="text-xl font-bold bg-green-800 border border-green-700 text-white rounded px-2 py-1 w-full"
                   />
                 ) : (
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <Building2 className="w-5 h-5" /> {selectedVendor.CompanyName}
                   </h2>
                 )}
                 
                 <div className="text-green-100 text-sm mt-1 flex items-center gap-2">
                   {selectedVendor.ServiceType} Specialist • 
                   <span className="bg-white/20 px-1.5 rounded text-xs">{selectedVendor.Status}</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-2 ml-4">
                  {isEditing ? (
                    <button onClick={handleSaveEdit} className="bg-white text-[#355E3B] px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-gray-100">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="text-green-100 hover:text-white hover:bg-white/10 px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedVendor(null)} className="hover:bg-white/20 rounded p-1 text-white/80 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
               </div>
             </div>

             <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                {/* Left Panel: Details */}
                <div className="md:col-span-1 space-y-5 border-r border-gray-100 pr-4">
                  
                  {/* Rating Card */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                     <div className="text-3xl font-bold text-amber-500">{calculateAvgRating(history)}</div>
                     <div className="flex justify-center gap-1 my-1">
                       {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Number(calculateAvgRating(history)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}
                     </div>
                     <div className="text-xs text-amber-700 font-medium">Avg Rating ({history.filter(h => h.review).length} Reviews)</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contact Person</label>
                      {isEditing ? (
                        <input className="w-full border p-1 rounded text-sm" value={editForm.ContactName} onChange={e => setEditForm({...editForm, ContactName: e.target.value})} />
                      ) : (
                        <div className="font-medium text-gray-800">{selectedVendor.ContactName}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                      {isEditing ? (
                        <input className="w-full border p-1 rounded text-sm" value={editForm.Email} onChange={e => setEditForm({...editForm, Email: e.target.value})} />
                      ) : (
                        <div className="text-sm text-gray-600">{selectedVendor.Email}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                      {isEditing ? (
                        <input className="w-full border p-1 rounded text-sm" value={editForm.Phone} onChange={e => setEditForm({...editForm, Phone: e.target.value})} />
                      ) : (
                        <div className="text-sm text-gray-600">{selectedVendor.Phone}</div>
                      )}
                    </div>
                     <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Service Type</label>
                      {isEditing ? (
                        <select className="w-full border p-1 rounded text-sm" value={editForm.ServiceType} onChange={e => setEditForm({...editForm, ServiceType: e.target.value as any})}>
                          <option value="IT">IT</option>
                          <option value="Facilities">Facilities</option>
                          <option value="General">General</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-600">{selectedVendor.ServiceType}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100">
                    <button onClick={handleArchive} className="w-full border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors">
                      <Archive className="w-4 h-4" /> Archive Vendor
                    </button>
                  </div>
                </div>

                {/* Right Panel: History */}
                <div className="md:col-span-2">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Project & Bid History
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                    {history.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 italic">No bid history found.</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {history.map((bid: any) => (
                          <div key={bid.BidID} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 cursor-pointer group" onClick={() => handleTicketClick(bid.TicketID_Ref)}>
                                <div className="text-xs text-gray-400 mb-0.5">{new Date(bid.DateSubmitted).toLocaleDateString()}</div>
                                <div className="font-bold text-[#355E3B] group-hover:underline flex items-center gap-1">
                                  {bid.ticketTitle}
                                  <Eye className="w-3 h-3 text-gray-300 group-hover:text-[#355E3B]" />
                                </div>
                                <div className="text-xs text-gray-500">Ticket ID: {bid.TicketID_Ref}</div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-mono font-bold text-gray-800">${bid.Amount.toFixed(0)}</div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  bid.Status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                  bid.Status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {bid.Status}
                                </span>
                              </div>
                            </div>

                            {/* Review Display inline */}
                            {bid.review && (
                              <div className="mt-2 bg-amber-50/50 border border-amber-100 rounded p-2 flex gap-3 items-start">
                                 <div className="mt-0.5 flex shrink-0">
                                   {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= bid.review.Rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}
                                 </div>
                                 <div>
                                   <p className="text-xs text-gray-700 italic">"{bid.review.Comment}"</p>
                                   <div className="text-[10px] text-gray-400 mt-1">- {bid.review.Author_Email}</div>
                                 </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal Layer */}
      {viewTicket && (
        <TicketDetail 
          ticket={viewTicket} 
          user={adminUser}
          onClose={() => setViewTicket(null)}
          onUpdate={() => {
            setViewTicket(null);
            handleRefresh();
          }}
        />
      )}
    </>
  );
};

export default VendorManager;
