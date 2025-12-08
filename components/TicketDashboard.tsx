import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, User, Priority } from '../types';
import { getTicketsForUser, getAllMaintenanceSchedules, claimTicket, hasPermission, lookup } from '../services/dataService';
import { AlertCircle, Calendar, Inbox, Globe, Filter } from 'lucide-react';
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

  // --- PERMISSIONS CHECKS (FIXED: Updated property names) ---
  // Note: hasPermission implementation in dataService returns true for everything in mock mode
  const canApprove = hasPermission(user, 'APPROVE_TICKETS');
  const canClaim = hasPermission(user, 'CLAIM_TICKETS');
  const manageAssets = hasPermission(user, 'MANAGE_ASSETS');

  // FIXED: user.User_Type -> user.role
  const isRestrictedParent = user.role.includes('Parent') && 
                             !user.role.includes('Admin') && 
                             !user.role.includes('Chair') && 
                             !user.role.includes('Staff');

  useEffect(() => {
    if (isRestrictedParent) setView('PUBLIC_BOARD');
    else if (canApprove) setView('ACTION_REQUIRED');
    
    // getTicketsForUser is now synchronous in the fix, so we can set it directly
    const userTickets = getTicketsForUser(user.id);
    setTickets(userTickets); 
  }, [user, refreshKey, canApprove, isRestrictedParent]);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // View Filters
    // FIXED: t.Submitter_Email -> t.createdBy, user.Email -> user.email
    if (view === 'MY_TICKETS') filtered = filtered.filter(t => t.createdBy === user.email);
    else if (view === 'ACTION_REQUIRED') {
      // FIXED: t.Status -> t.status
      if (canApprove) filtered = filtered.filter(t => t.status === 'Pending Approval');
      else if (canClaim) filtered = filtered.filter(t => t.status === 'New');
    }
    // FIXED: t.Is_Public -> t.isPublic
    else if (view === 'PUBLIC_BOARD') filtered = filtered.filter(t => t.isPublic);
    else if (view === 'HISTORY') filtered = filtered.filter(t => t.status !== 'New');

    // Search
    if (search) {
      const q = search.toLowerCase();
      // FIXED: t.Title -> t.title, t.Description -> t.description, t.TicketID -> t.id
      filtered = filtered.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      // FIXED: t.Date_Submitted -> t.createdAt
      let valA: any = a.createdAt;
      let valB: any = b.createdAt;
      
      // FIXED: Property accessors to lowercase
      if (sortField === 'Status') { valA = a.status; valB = b.status; }
      if (sortField === 'Priority') {
         const pMap = { [Priority.Critical]: 3, [Priority.High]: 2, [Priority.Medium]: 1, [Priority.Low]: 0 };
         // @ts-ignore
         valA = pMap[a.priority] || 0; 
         // @ts-ignore
         valB = pMap[b.priority] || 0;
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
       if (t.status !== 'Completed') {
         items.push({ 
           type: 'TICKET', 
           id: t.id, 
           date: t.createdAt, 
           title: t.title, 
           status: t.status, 
           ticket: t 
         });
       }
    });
    if (manageAssets) {
        const pms = getAllMaintenanceSchedules();
        pms.forEach(pm => {
            // Adapted for maintenance schedule properties
            items.push({ 
              type: 'PM', 
              id: pm.id, 
              date: pm.nextDue, 
              title: pm.task, 
              status: 'Scheduled', 
              schedule: pm 
            });
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
        claimTicket(id);
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
           <div className="mb-4 flex gap-2">
             <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="Search tickets..." 
                 className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               <Filter className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
             </div>
           </div>

           {view === 'AGENDA' ? (
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 font-bold"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Item</th><th className="p-3">Status</th></tr></thead>
                  <tbody>
                      {agendaItems.map(item => (
                          <tr key={item.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => item.type === 'TICKET' && setSelectedTicket(item.ticket)}>
                              <td className="p-3">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
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
                          <th className="p-3">Submitted By</th>
                          <th className="p-3 cursor-pointer" onClick={() => setSortField('Status')}>Status</th>
                          <th className="p-3">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredTickets.map(t => (
                          <tr key={t.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                              <td className="p-3">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-3 font-medium">
                                  <div>{t.title}</div>
                                  {/* Using priority as secondary info */}
                                  <div className="text-xs text-gray-500">{t.priority}</div>
                              </td>
                              <td className="p-3">{t.createdBy}</td>
                              <td className="p-3">{getStatusBadge(t.status)}</td>
                              <td className="p-3">
                                  {!t.assignedTo && t.status === 'New' && canClaim && (
                                      <button onClick={(e) => handleQuickClaim(e, t.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Claim</button>
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
      
      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          currentUser={user} // TicketDetail expects 'currentUser' prop name based on previous fixes
          onBack={() => setSelectedTicket(null)} 
          onUpdate={onRefresh} 
        />
      )}
    </>
  );
};

export default TicketDashboard;