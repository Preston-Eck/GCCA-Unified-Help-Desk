import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, User, Priority, TicketStatus } from '../types';
import { getTicketsForUser, getAllMaintenanceSchedules, claimTicket, hasPermission, lookup } from '../services/dataService';
import { AlertCircle, CheckCircle2, Calendar, Inbox, History, Globe, Building2, Briefcase, Filter, Search } from 'lucide-react';
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

  const isRestrictedParent = user.User_Type.includes('Parent') && 
                             !user.User_Type.includes('Admin') && 
                             !user.User_Type.includes('Chair') && 
                             !user.User_Type.includes('Staff');

  useEffect(() => {
    if (isRestrictedParent) setView('PUBLIC_BOARD');
    else if (canApprove) setView('ACTION_REQUIRED');
    setTickets(getTicketsForUser(user)); 
  }, [user, refreshKey, canApprove, isRestrictedParent]);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // View Filters
    if (view === 'MY_TICKETS') filtered = filtered.filter(t => t.Submitter_Email === user.Email);
    else if (view === 'ACTION_REQUIRED') {
      if (canApprove) filtered = filtered.filter(t => t.Status === 'Pending Approval');
      else if (canClaim) filtered = filtered.filter(t => t.Status === 'New');
    }
    else if (view === 'PUBLIC_BOARD') filtered = filtered.filter(t => t.Is_Public);
    else if (view === 'HISTORY') filtered = filtered.filter(t => t.Status !== 'New');

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.Title.toLowerCase().includes(q) || 
        t.Description.toLowerCase().includes(q) ||
        t.TicketID.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let valA: any = a.Date_Submitted;
      let valB: any = b.Date_Submitted;
      
      if (sortField === 'Status') { valA = a.Status; valB = b.Status; }
      if (sortField === 'Priority') {
         const pMap = { [Priority.CRITICAL]: 3, [Priority.HIGH]: 2, [Priority.MEDIUM]: 1, [Priority.LOW]: 0 };
         // @ts-ignore
         valA = pMap[a.Priority] || 0; 
         // @ts-ignore
         valB = pMap[b.Priority] || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [tickets, view, search, sortField, sortAsc, user]);

  const agendaItems = useMemo(() => {
    if (view !== 'AGENDA') return [];
    const items: any[] = [];
    tickets.forEach(t => {
       if (t.Status !== 'Completed') items.push({ type: 'TICKET', id: t.TicketID, date: t.Date_Submitted, title: t.Title, status: t.Status, ticket: t });
    });
    if (manageAssets) {
        const pms = getAllMaintenanceSchedules();
        pms.forEach(pm => {
            items.push({ type: 'PM', id: pm.PM_ID, date: pm.Next_Due_Date, title: pm.Task_Name, status: 'Scheduled', schedule: pm });
        });
    }
    return items.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [view, tickets, manageAssets]);

  const getStatusBadge = (status: string) => {
    const colors: any = { 'New': 'bg-blue-100 text-blue-800', 'Assigned': 'bg-purple-100 text-purple-800', 'Completed': 'bg-green-100 text-green-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const handleQuickClaim = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("Claim this ticket?")) {
        claimTicket(id, user.Email);
        onRefresh();
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        {!isRestrictedParent && (
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
             <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Views</h3>
               <div className="space-y-1">
                 <button onClick={() => setView('MY_TICKETS')} className={`w-full text-left p-2 rounded flex gap-2 ${view === 'MY_TICKETS' ? 'bg-green-50 text-[#355E3B]' : 'hover:bg-gray-50'}`}><Inbox className="w-4 h-4"/> My Tickets</button>
                 <button onClick={() => setView('AGENDA')} className={`w-full text-left p-2 rounded flex gap-2 ${view === 'AGENDA' ? 'bg-green-50 text-[#355E3B]' : 'hover:bg-gray-50'}`}><Calendar className="w-4 h-4"/> Agenda</button>
                 {canApprove && <button onClick={() => setView('ACTION_REQUIRED')} className={`w-full text-left p-2 rounded flex gap-2 ${view === 'ACTION_REQUIRED' ? 'bg-green-50 text-[#355E3B]' : 'hover:bg-gray-50'}`}><AlertCircle className="w-4 h-4"/> Action Required</button>}
                 <button onClick={() => setView('PUBLIC_BOARD')} className={`w-full text-left p-2 rounded flex gap-2 ${view === 'PUBLIC_BOARD' ? 'bg-green-50 text-[#355E3B]' : 'hover:bg-gray-50'}`}><Globe className="w-4 h-4"/> Public Board</button>
               </div>
             </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow border p-4">
           {view === 'AGENDA' ? (
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 font-bold"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Item</th><th className="p-3">Status</th></tr></thead>
                  <tbody>
                      {agendaItems.map(item => (
                          <tr key={item.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => item.type === 'TICKET' && setSelectedTicket(item.ticket)}>
                              <td className="p-3">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="p-3 font-bold text-xs">{item.type}</td>
                              <td className="p-3 font-medium">{item.title}</td>
                              <td className="p-3">{getStatusBadge(item.status)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-[#355E3B] text-white">
                      <tr>
                          <th className="p-3 cursor-pointer" onClick={() => setSortField('Date')}>Date</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Location</th>
                          <th className="p-3 cursor-pointer" onClick={() => setSortField('Status')}>Status</th>
                          <th className="p-3">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredTickets.map(t => (
                          <tr key={t.TicketID} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                              <td className="p-3">{new Date(t.Date_Submitted).toLocaleDateString()}</td>
                              <td className="p-3 font-medium">
                                  <div>{t.Title}</div>
                                  <div className="text-xs text-gray-500">{t.Submitter_Email}</div>
                              </td>
                              <td className="p-3">{lookup.location(t.LocationID_Ref)}</td>
                              <td className="p-3">{getStatusBadge(t.Status)}</td>
                              <td className="p-3">
                                  {!t.Assigned_Staff && t.Status === 'New' && canClaim && (
                                      <button onClick={(e) => handleQuickClaim(e, t.TicketID)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Claim</button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
               {filteredTickets.length === 0 && <div className="p-8 text-center text-gray-500">No tickets found.</div>}
             </div>
           )}
        </div>
      </div>
      {selectedTicket && <TicketDetail ticket={selectedTicket} user={user} onClose={() => setSelectedTicket(null)} onUpdate={onRefresh} />}
    </>
  );
};

export default TicketDashboard;