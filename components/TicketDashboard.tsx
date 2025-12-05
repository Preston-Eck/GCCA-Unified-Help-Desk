
import React, { useState, useMemo, useEffect } from 'react';
import { User, MaintenanceSchedule, Ticket } from '../types';
import { getTicketsForUser, lookup, claimTicket, hasPermission, getAllMaintenanceSchedules } from '../services/dataService';
import { 
  CheckCircle, FileText, User as UserIcon, Filter, 
  Search, Inbox, List, AlertCircle, Briefcase, ArrowUpDown, Globe, Eye, Hand, ShoppingBag, CalendarDays, Clock
} from 'lucide-react';
import TicketDetail from './TicketDetail';

interface Props {
  user: User;
  refreshKey: number;
  onRefresh: () => void;
}

type DashboardView = 'MY_TICKETS' | 'ACTION_REQUIRED' | 'DEPARTMENT_ALL' | 'CAMPUS_ALL' | 'PUBLIC_BOARD' | 'HISTORY' | 'VENDOR_BIDS' | 'AGENDA';
type SortField = 'Date' | 'Priority' | 'Status';

interface AgendaItem {
  type: 'TICKET' | 'PM';
  id: string;
  date: string;
  title: string;
  status: string;
  desc: string;
  priority?: string;
  ticket?: Ticket;
  schedule?: MaintenanceSchedule;
}

const TicketDashboard: React.FC<Props> = ({ user, refreshKey, onRefresh }) => {
  const allTickets = useMemo(() => getTicketsForUser(user), [user, refreshKey]);
  
  const [currentView, setCurrentView] = useState<DashboardView>('MY_TICKETS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('Date');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected Ticket for Modal
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Permission Checks (PBAC)
  const canApprove = hasPermission(user, 'APPROVE_TICKETS');
  const canClaim = hasPermission(user, 'CLAIM_TICKETS');
  const canViewAllDept = hasPermission(user, 'VIEW_DEPT_TICKETS');
  const canViewCampus = hasPermission(user, 'VIEW_CAMPUS_TICKETS');
  const canViewBids = hasPermission(user, 'VIEW_ALL_BIDS');
  const canManageAssets = hasPermission(user, 'MANAGE_ASSETS');
  const isParent = user.User_Type.includes('Parent');

  // Set default view based on role
  useEffect(() => {
    if (isParent) setCurrentView('PUBLIC_BOARD');
    else if (canApprove) setCurrentView('ACTION_REQUIRED');
  }, [isParent, canApprove]);

  // --- Filtering Logic ---
  const filteredTickets = useMemo(() => {
    let result = allTickets;

    if (currentView === 'MY_TICKETS') {
      result = result.filter(t => t.Submitter_Email === user.Email);
    } 
    else if (currentView === 'ACTION_REQUIRED') {
      if (canApprove) {
        result = result.filter(t => t.Status === 'Pending Approval');
      } else if (canClaim || canViewAllDept) {
        result = result.filter(t => 
          t.Status === 'New' || 
          (t.Status === 'Assigned' && t.Assigned_Staff === user.Email)
        );
      }
    }
    else if (currentView === 'DEPARTMENT_ALL') {
      result = result.filter(t => t.Category === user.Department);
    }
    else if (currentView === 'PUBLIC_BOARD') {
      result = result.filter(t => t.IsPublic);
    }
    else if (currentView === 'HISTORY') {
      result = result.filter(t => 
        t.Status !== 'New' && t.Status !== 'Pending Approval' &&
        (t.Submitter_Email === user.Email || t.Comments.some(c => c.Author_Email === user.Email))
      );
    }
    else if (currentView === 'VENDOR_BIDS') {
      result = result.filter(t => t.Status === 'Open for Bid');
    }
    else if (currentView === 'CAMPUS_ALL') {
       // getTicketsForUser handles the campus filtering logic internally for Approvers
       result = result.filter(t => t.Status !== 'New'); // Just an example filter
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.Title.toLowerCase().includes(lower) || 
        t.Description.toLowerCase().includes(lower) ||
        t.TicketID.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(t => t.Status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      let valA: any = a[sortField === 'Date' ? 'Date_Submitted' : sortField === 'Priority' ? 'Priority' : 'Status'];
      let valB: any = b[sortField === 'Date' ? 'Date_Submitted' : sortField === 'Priority' ? 'Priority' : 'Status'];

      if (sortField === 'Priority') {
        const pMap = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        valA = pMap[valA as keyof typeof pMap] || 0;
        valB = pMap[valB as keyof typeof pMap] || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [allTickets, currentView, searchTerm, statusFilter, sortField, sortAsc, canApprove, canClaim, canViewAllDept, user]);

  // --- Agenda Data Construction ---
  const agendaItems = useMemo<AgendaItem[]>(() => {
    if (currentView !== 'AGENDA') return [];

    const items: AgendaItem[] = [];

    // 1. Add Tickets
    allTickets.forEach(t => {
       // Filter agenda? Usually show active stuff.
       if (t.Status !== 'Completed' && t.Status !== 'Resolved') {
          items.push({
            type: 'TICKET',
            id: t.TicketID,
            date: t.Date_Submitted,
            title: t.Title,
            status: t.Status,
            desc: `${lookup.location(t.LocationID_Ref)} - ${t.Description}`,
            priority: t.Priority,
            ticket: t
          });
       }
    });

    // 2. Add PM Schedules (if allowed)
    if (canManageAssets || canViewAllDept) {
       const schedules = getAllMaintenanceSchedules();
       schedules.forEach(s => {
          items.push({
            type: 'PM',
            id: s.ScheduleID,
            date: s.NextDue,
            title: `PM Due: ${s.TaskName}`,
            status: 'Scheduled',
            desc: `Asset: ${lookup.asset(s.AssetID_Ref)} (${s.Frequency})`,
            schedule: s
          });
       });
    }

    // Sort Chronologically: Oldest first (Action order)
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [currentView, allTickets, canManageAssets, canViewAllDept]);


  const getStatusBadge = (status: string) => {
    const styles: any = {
      'New': 'bg-blue-100 text-blue-800',
      'Pending Approval': 'bg-amber-100 text-amber-900 border border-amber-300',
      'Assigned': 'bg-purple-100 text-purple-900',
      'Open for Bid': 'bg-pink-100 text-pink-900 border border-pink-300',
      'Completed': 'bg-green-100 text-green-900',
      'Resolved': 'bg-gray-100 text-gray-900',
      'Scheduled': 'bg-gray-100 text-gray-700 border border-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  const handleQuickClaim = (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (confirm("Claim this ticket?")) {
      claimTicket(ticketId, user.Email);
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar */}
        {!isParent && (
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Views</h3>
              <div className="space-y-1">
                
                <button 
                  onClick={() => setCurrentView('ACTION_REQUIRED')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'ACTION_REQUIRED' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <AlertCircle className="w-4 h-4" />
                  {canApprove ? 'Pending Approval' : 'Action Required'}
                </button>

                <button 
                  onClick={() => setCurrentView('MY_TICKETS')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'MY_TICKETS' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Inbox className="w-4 h-4" />
                  My Tickets
                </button>
                
                <button 
                  onClick={() => setCurrentView('AGENDA')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'AGENDA' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Agenda / Schedule
                </button>

                {canViewBids && (
                  <button 
                    onClick={() => setCurrentView('VENDOR_BIDS')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                      ${currentView === 'VENDOR_BIDS' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Active Vendor Bids
                  </button>
                )}

                <button 
                  onClick={() => setCurrentView('HISTORY')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'HISTORY' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Eye className="w-4 h-4" />
                  Interacted / History
                </button>

                <button 
                  onClick={() => setCurrentView('PUBLIC_BOARD')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'PUBLIC_BOARD' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Globe className="w-4 h-4" />
                  Public Board
                </button>

                {canViewAllDept && (
                  <button 
                    onClick={() => setCurrentView('DEPARTMENT_ALL')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                      ${currentView === 'DEPARTMENT_ALL' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                    All {user.Department}
                  </button>
                )}

                {canViewCampus && (
                  <button 
                    onClick={() => setCurrentView('CAMPUS_ALL')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                      ${currentView === 'CAMPUS_ALL' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Briefcase className="w-4 h-4" />
                    All Campus Tickets
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters (Full width if Parent) */}
        {currentView !== 'AGENDA' && (
          <div className={`bg-white rounded-lg shadow p-4 border border-gray-200 ${isParent ? 'w-full lg:w-64 flex-shrink-0' : 'hidden'}`}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Search
            </h3>
            <div className="space-y-3">
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pl-8 focus:ring-1 focus:ring-[#355E3B] focus:outline-none"
                  />
                  <Search className="w-3 h-3 text-gray-400 absolute left-3 top-3" />
                </div>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800">
                  {currentView === 'MY_TICKETS' && 'My Submitted Tickets'}
                  {currentView === 'ACTION_REQUIRED' && 'Action Required'}
                  {currentView === 'PUBLIC_BOARD' && 'Public Ticket Board'}
                  {currentView === 'DEPARTMENT_ALL' && `All ${user.Department} Tickets`}
                  {currentView === 'HISTORY' && 'My Interaction History'}
                  {currentView === 'VENDOR_BIDS' && 'Tickets Out for Bid'}
                  {currentView === 'CAMPUS_ALL' && 'Campus Overview'}
                  {currentView === 'AGENDA' && 'Unified Agenda & Schedule'}
                  {currentView !== 'AGENDA' && <span className="ml-2 text-xs font-normal text-gray-500">({filteredTickets.length})</span>}
                </h2>
                
                {currentView !== 'AGENDA' && (
                  <button 
                    onClick={() => setSortAsc(!sortAsc)}
                    className="text-xs flex items-center gap-1 text-gray-600 hover:text-[#355E3B]"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    Sort by {sortField} ({sortAsc ? 'Asc' : 'Desc'})
                  </button>
                )}
              </div>

              {currentView === 'AGENDA' ? (
                // Agenda View Render
                <div className="overflow-x-auto">
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
                             <tr 
                               key={item.type + item.id + idx} 
                               className={`hover:bg-gray-50 transition-colors ${item.type === 'TICKET' ? 'cursor-pointer' : ''}`}
                               onClick={() => item.type === 'TICKET' && setSelectedTicket(item.ticket)}
                             >
                               <td className="p-4 align-top">
                                  {item.type === 'TICKET' ? (
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-blue-500" />
                                      <span className="font-bold text-gray-700 text-xs">TICKET</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-amber-600" />
                                      <span className="font-bold text-gray-700 text-xs">PM TASK</span>
                                    </div>
                                  )}
                               </td>
                               <td className="p-4 align-top">
                                  <div className={`font-mono font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                    {new Date(item.date).toLocaleDateString()}
                                  </div>
                                  {isOverdue && <div className="text-[10px] font-bold text-red-500 uppercase">Action Needed</div>}
                               </td>
                               <td className="p-4 align-top">
                                  <div className="font-bold text-gray-900">{item.title}</div>
                                  <div className="text-gray-500 text-xs mt-1 line-clamp-1">{item.desc}</div>
                               </td>
                               <td className="p-4 align-top">
                                  {item.type === 'TICKET' && item.ticket ? (
                                    <div className="text-xs text-gray-600">
                                      {lookup.location(item.ticket.LocationID_Ref)}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500">
                                      Auto-Scheduled
                                    </div>
                                  )}
                               </td>
                               <td className="p-4 align-top">
                                  {getStatusBadge(item.status)}
                               </td>
                             </tr>
                           )
                         })
                       )}
                     </tbody>
                   </table>
                </div>
              ) : (
                // Standard List View
                <div className="overflow-x-auto">
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
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No tickets match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map(t => (
                          <tr 
                            key={t.TicketID} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedTicket(t)}
                          >
                            <td className="p-4 align-top">
                              <div className="font-mono font-bold text-gray-700">{t.TicketID}</div>
                              <div className="text-xs text-gray-500 mt-1">{new Date(t.Date_Submitted).toLocaleDateString()}</div>
                              {t.IsPublic && <div className="mt-1 text-xs text-blue-600 flex items-center gap-1"><Globe className="w-3 h-3"/> Public</div>}
                            </td>
                            <td className="p-4 align-top">
                              <div className="font-semibold text-gray-900">{lookup.campus(t.CampusID_Ref)}</div>
                              <div className="text-gray-600">{lookup.building(t.BuildingID_Ref)}</div>
                              <div className="text-xs text-gray-500 mt-1">{lookup.location(t.LocationID_Ref)}</div>
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
                                     <Hand className="w-3 h-3" /> Claim
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
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          user={user} 
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            setSelectedTicket(null); // Close modal
            onRefresh(); // Refresh list
          }}
        />
      )}
    </>
  );
};

export default TicketDashboard;
