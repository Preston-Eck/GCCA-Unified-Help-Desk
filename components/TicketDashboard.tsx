import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, User, Priority, TicketStatus } from '../types';
import { getTicketsForUser, getAllMaintenanceSchedules, claimTicket, getTechnicians, hasPermission } from '../services/dataService';
import { getSessionUserEmail } from '../services/api';
import { AlertCircle, CheckCircle2, Clock, Search, Filter, RefreshCw, Calendar, Inbox, History, Globe, Building2, Briefcase } from 'lucide-react';
import TicketDetail from './TicketDetail';

interface Props {
  user: User;
  refreshKey: number;
  onRefresh: () => void;
}

const TicketDashboard: React.FC<Props> = ({ user, refreshKey, onRefresh }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState('MY_TICKETS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'Date' | 'Priority' | 'Status'>('Date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // --- PERMISSIONS CHECKS ---
  const canApprove = hasPermission(user, 'APPROVE_TICKETS');
  const canClaim = hasPermission(user, 'CLAIM_TICKETS');
  const viewDept = hasPermission(user, 'VIEW_DEPT_TICKETS');
  const viewCampus = hasPermission(user, 'VIEW_CAMPUS_TICKETS');
  const viewBids = hasPermission(user, 'VIEW_ALL_BIDS');
  const manageAssets = hasPermission(user, 'MANAGE_ASSETS');

  // FIX: Only treat as "Parent" (Restricted View) if they have NO other privileges
  const isRestrictedParent = user.User_Type.includes('Parent') && 
                             !user.User_Type.includes('Admin') && 
                             !user.User_Type.includes('Chair') && 
                             !user.User_Type.includes('Staff') &&
                             !user.User_Type.includes('Tech');

  useEffect(() => {
    // Default Views
    if (isRestrictedParent) setView('PUBLIC_BOARD');
    else if (canApprove) setView('ACTION_REQUIRED');
    
    // Load Tickets
    setTickets(getTicketsForUser(user)); 
  }, [user, refreshKey, canApprove, isRestrictedParent]);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // 1. View Filters
    if (view === 'MY_TICKETS') {
      filtered = filtered.filter(t => t.Submitter_Email === user.Email);
    } else if (view === 'ACTION_REQUIRED') {
      if (canApprove) {
         filtered = filtered.filter(t => t.Status === 'Pending Approval');
      } else if (canClaim || viewDept) {
         filtered = filtered.filter(t => t.Status === 'New' || (t.Status === 'Assigned' && t.Assigned_Staff === user.Email));
      }
    } else if (view === 'DEPARTMENT_ALL') {
      filtered = filtered.filter(t => t.Category === user.Department);
    } else if (view === 'PUBLIC_BOARD') {
      filtered = filtered.filter(t => t.IsPublic);
    } else if (view === 'HISTORY') {
      filtered = filtered.filter(t => t.Status !== 'New' && t.Status !== 'Pending Approval' && 
        (t.Submitter_Email === user.Email || t.Comments.some(c => c.Author_Email === user.Email)));
    } else if (view === 'VENDOR_BIDS') {
      filtered = filtered.filter(t => t.Status === 'Open for Bid');
    } else if (view === 'CAMPUS_ALL') {
       filtered = filtered.filter(t => t.Status !== 'New');
    }

    // 2. Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.Title.toLowerCase().includes(q) || 
        t.Description.toLowerCase().includes(q) ||
        t.TicketID.toLowerCase().includes(q)
      );
    }

    // 3. Status Filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(t => t.Status === statusFilter);
    }

    // 4. Sort
    return [...filtered].sort((a, b) => {
      let valA: any = a[sortField === 'Date' ? 'Date_Submitted' : sortField === 'Priority' ? 'Priority' : 'Status'];
      let valB: any = b[sortField === 'Date' ? 'Date_Submitted' : sortField === 'Priority' ? 'Priority' : 'Status'];

      if (sortField === 'Priority') {
        const pMap = { Critical: 3, High: 2, Medium: 1, Low: 0 };
        valA = pMap[valA as Priority] || 0;
        valB = pMap[valB as Priority] || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [tickets, view, search, statusFilter, sortField, sortAsc, canApprove, canClaim, viewDept, user]);

  // Agenda View Data
  const agendaItems = useMemo(() => {
    if (view !== 'AGENDA') return [];
    const items = [];
    // Add Tickets
    tickets.forEach(t => {
      if (t.Status !== 'Completed' && t.Status !== 'Resolved') {
        items.push({ type: 'TICKET', id: t.TicketID, date: t.Date_Submitted, title: t.Title, status: t.Status, desc: t.Description, priority: t.Priority, ticket: t });
      }
    });
    // Add PM Schedules
    if (manageAssets || viewDept) {
      const schedules = getAllMaintenanceSchedules();
      schedules.forEach(s => {
        items.push({ type: 'PM', id: s.ScheduleID, date: s.NextDue, title: `PM Due: ${s.TaskName}`, status: 'Scheduled', desc: `${s.Frequency}`, schedule: s });
      });
    }
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [view, tickets, manageAssets, viewDept]);

  // Helpers
  const getStatusBadge = (status: string) => {
    const styles = {
      'New': 'bg-blue-100 text-blue-800',
      'Pending Approval': 'bg-amber-100 text-amber-900 border border-amber-300',
      'Assigned': 'bg-purple-100 text-purple-900',
      'Open for Bid': 'bg-pink-100 text-pink-900 border border-pink-300',
      'Completed': 'bg-green-100 text-green-900',
      'Resolved': 'bg-gray-100 text-gray-900',
      'Scheduled': 'bg-gray-100 text-gray-700 border border-gray-300'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-50'}`}>{status}</span>;
  };

  const handleQuickClaim = (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (confirm('Claim this ticket?')) {
      claimTicket(ticketId, user.Email);
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR - HIDDEN ONLY FOR RESTRICTED PARENTS */}
        {!isRestrictedParent && (
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
             <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Views</h3>
               <div className="space-y-1">
                 <button onClick={() => setView('ACTION_REQUIRED')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'ACTION_REQUIRED' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <AlertCircle className="w-4 h-4" /> {canApprove ? "Pending Approval" : "Action Required"}
                 </button>
                 <button onClick={() => setView('MY_TICKETS')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'MY_TICKETS' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Inbox className="w-4 h-4" /> My Tickets
                 </button>
                 <button onClick={() => setView('AGENDA')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'AGENDA' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Calendar className="w-4 h-4" /> Agenda / Schedule
                 </button>
                 {viewBids && (
                    <button onClick={() => setView('VENDOR_BIDS')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'VENDOR_BIDS' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Briefcase className="w-4 h-4" /> Active Vendor Bids
                    </button>
                 )}
                 <button onClick={() => setView('HISTORY')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'HISTORY' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <History className="w-4 h-4" /> Interacted / History
                 </button>
                 <button onClick={() => setView('PUBLIC_BOARD')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'PUBLIC_BOARD' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Globe className="w-4 h-4" /> Public Board
                 </button>
                 {viewDept && (
                   <button onClick={() => setView('DEPARTMENT_ALL')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'DEPARTMENT_ALL' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Building2 className="w-4 h-4" /> All {user.Department}
                   </button>
                 )}
                 {viewCampus && (
                   <button onClick={() => setView('CAMPUS_ALL')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'CAMPUS_ALL' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Building2 className="w-4 h-4" /> All Campus Tickets
                   </button>
                 )}
               </div>
             </div>
             
             {/* SEARCH BOX (In Sidebar for Desktop) */}
             <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Search
                </h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pl-8 focus:ring-1 focus:ring-[#355E3B] focus:outline-none"
                  />
                  <Search className="w-3 h-3 text-gray-400 absolute left-3 top-3" />
                </div>
             </div>
          </div>
        )}

        {/* SEARCH BOX (Only for Parents - since they have no sidebar) */}
        {isRestrictedParent && (
          <div className="w-full lg:w-64 flex-shrink-0">
             <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Search
                </h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pl-8 focus:ring-1 focus:ring-[#355E3B] focus:outline-none"
                  />
                  <Search className="w-3 h-3 text-gray-400 absolute left-3 top-3" />
                </div>
             </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800">
                {view === 'MY_TICKETS' && "My Submitted Tickets"}
                {view === 'ACTION_REQUIRED' && "Action Required"}
                {view === 'PUBLIC_BOARD' && "Public Ticket Board"}
                {view === 'DEPARTMENT_ALL' && `All ${user.Department} Tickets`}
                {view === 'HISTORY' && "My Interaction History"}
                {view === 'VENDOR_BIDS' && "Tickets Out for Bid"}
                {view === 'CAMPUS_ALL' && "Campus Overview"}
                {view === 'AGENDA' && "Unified Agenda & Schedule"}
                {view !== 'AGENDA' && <span className="ml-2 text-xs font-normal text-gray-500">({filteredTickets.length})</span>}
              </h2>

              {view !== 'AGENDA' && (
                <button onClick={() => setSortAsc(!sortAsc)} className="text-xs flex items-center gap-1 text-gray-600 hover:text-[#355E3B]">
                  <Filter className="w-3 h-3" /> Sort by {sortField} ({sortAsc ? 'Asc' : 'Desc'})
                </button>
              )}
            </div>

            {/* List View */}
            <div className="overflow-x-auto">
               {view === 'AGENDA' ? (
                 <table className="w-full text-left">
                   <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
                     <tr>
                       <th className="p-4">Type</th>
                       <th className="p-4">Due / Date</th>
                       <th className="p-4 w-1/3">Item / Task</th>
                       <th className="p-4">Context</th>
                       <th className="p-4">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 text-sm">
                     {agendaItems.length === 0 ? (
                       <tr><td colSpan={5} className="p-8 text-center text-gray-500">No upcoming items.</td></tr>
                     ) : (
                       agendaItems.map((item, idx) => {
                         const isOverdue = new Date(item.date) < new Date();
                         return (
                           <tr key={item.type + item.id + idx} className={`hover:bg-gray-50 transition-colors ${item.type === 'TICKET' ? 'cursor-pointer' : ''}`} onClick={() => item.type === 'TICKET' && setSelectedTicket(item.ticket)}>
                             <td className="p-4 align-top">
                               {item.type === 'TICKET' ? 
                                 <div className="flex items-center gap-2"><Inbox className="w-4 h-4 text-blue-500"/><span className="font-bold text-gray-700 text-xs">TICKET</span></div> : 
                                 <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600"/><span className="font-bold text-gray-700 text-xs">PM TASK</span></div>
                               }
                             </td>
                             <td className="p-4 align-top">
                               <div className={`font-mono font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>{new Date(item.date).toLocaleDateString()}</div>
                               {isOverdue && <div className="text-[10px] font-bold text-red-500 uppercase">Action Needed</div>}
                             </td>
                             <td className="p-4 align-top">
                               <div className="font-bold text-gray-900">{item.title}</div>
                               <div className="text-gray-500 text-xs mt-1 line-clamp-1">{item.desc}</div>
                             </td>
                             <td className="p-4 align-top">
                               {/* Context: Asset Name or Location */}
                               {item.type === 'TICKET' && item.ticket ? (
                                  <div className="text-xs text-gray-600">{item.ticket.LocationID_Ref}</div>
                               ) : (
                                  <div className="text-xs text-gray-500">Auto-Scheduled</div>
                               )}
                             </td>
                             <td className="p-4 align-top">{getStatusBadge(item.status)}</td>
                           </tr>
                         );
                       })
                     )}
                   </tbody>
                 </table>
               ) : (
                 <table className="w-full text-left">
                  <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 cursor-pointer hover:bg-green-800" onClick={() => setSortField('Date')}>ID / Date</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 w-1/3">Issue</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 cursor-pointer hover:bg-green-800" onClick={() => setSortField('Status')}>Status</th>
                      {canClaim && <th className="p-4">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredTickets.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">No tickets match your filters.</td></tr>
                    ) : (
                      filteredTickets.map(t => (
                        <tr key={t.TicketID} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(t)}>
                          <td className="p-4 align-top">
                            <div className="font-mono font-bold text-gray-700">{t.TicketID}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(t.Date_Submitted).toLocaleDateString()}</div>
                            {t.IsPublic && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Public
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                             <div className="font-semibold text-gray-900">{t.CampusID_Ref}</div>
                             <div className="text-gray-600">{t.BuildingID_Ref}</div>
                             <div className="text-xs text-gray-500 mt-1">{t.LocationID_Ref}</div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-bold text-gray-800">{t.Title}</div>
                            <div className="text-gray-600 mt-1 line-clamp-1">{t.Description}</div>
                            <div className="text-xs text-gray-400 mt-2">By: {t.Submitter_Email}</div>
                          </td>
                          <td className="p-4 align-top">
                            <span className="font-medium text-gray-700">{t.Category}</span>
                          </td>
                          <td className="p-4 align-top">
                            {getStatusBadge(t.Status)}
                            {t.Priority === 'Critical' && <div className="mt-1 text-xs text-red-600 font-bold uppercase">Critical</div>}
                          </td>
                          {canClaim && (
                            <td className="p-4 align-top">
                              {!t.Assigned_Staff && t.Status === 'New' ? (
                                <button 
                                  onClick={(e) => handleQuickClaim(e, t.TicketID)}
                                  className="text-xs bg-[#355E3B] text-white px-2 py-1 rounded hover:bg-green-800 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Claim
                                </button>
                              ) : t.Assigned_Staff === user.Email ? (
                                <span className="text-xs font-bold text-[#355E3B]">Assigned to you</span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
               )}
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          user={user} 
          onClose={() => setSelectedTicket(null)} 
          onUpdate={() => { setSelectedTicket(null); onRefresh(); }} 
        />
      )}
    </>
  );
};

export default TicketDashboard;