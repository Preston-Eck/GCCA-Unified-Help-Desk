
import React, { useState, useMemo } from 'react';
import { User, Ticket } from '../types';
import { getTicketsForUser, lookup } from '../services/dataService';
import { 
  CheckCircle, FileText, User as UserIcon, Filter, 
  Search, Inbox, List, AlertCircle, Briefcase, ArrowUpDown, Globe, Eye
} from 'lucide-react';
import TicketDetail from './TicketDetail';

interface Props {
  user: User;
  refreshKey: number;
  onRefresh: () => void;
}

type DashboardView = 'MY_TICKETS' | 'ACTION_REQUIRED' | 'DEPARTMENT_ALL' | 'CAMPUS_ALL' | 'PUBLIC_BOARD' | 'HISTORY';
type SortField = 'Date' | 'Priority' | 'Status';

const TicketDashboard: React.FC<Props> = ({ user, refreshKey, onRefresh }) => {
  const allTickets = useMemo(() => getTicketsForUser(user), [user, refreshKey]);
  
  const [currentView, setCurrentView] = useState<DashboardView>('ACTION_REQUIRED');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('Date');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected Ticket for Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const roles = user.User_Type;
  const isApprover = roles.includes('Approver');
  const isChair = roles.includes('Chair');
  const isTech = roles.includes('Tech');
  const isAdmin = roles.includes('Admin');

  // --- Filtering Logic ---
  const filteredTickets = useMemo(() => {
    let result = allTickets;

    if (currentView === 'MY_TICKETS') {
      result = result.filter(t => t.Submitter_Email === user.Email);
    } 
    else if (currentView === 'ACTION_REQUIRED') {
      if (isApprover) {
        result = result.filter(t => t.Status === 'Pending Approval');
      } else if (isTech || isChair) {
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
      // Tickets I've submitted OR commented on (already fetched by getTicketsForUser)
      // Just exclude ones where I have action required to differentiate
      result = result.filter(t => 
        t.Status !== 'New' && t.Status !== 'Pending Approval' &&
        (t.Submitter_Email === user.Email || t.Comments.some(c => c.Author_Email === user.Email))
      );
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
  }, [allTickets, currentView, searchTerm, statusFilter, sortField, sortAsc, isApprover, isTech, isChair, user]);


  const getStatusBadge = (status: string) => {
    const styles: any = {
      'New': 'bg-blue-100 text-blue-800',
      'Pending Approval': 'bg-amber-100 text-amber-900 border border-amber-300',
      'Assigned': 'bg-purple-100 text-purple-900',
      'Completed': 'bg-green-100 text-green-900',
      'Resolved': 'bg-gray-100 text-gray-900',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar */}
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
                {isApprover ? 'Pending Approval' : 'Action Required'}
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

              {(isChair || isTech || isAdmin) && (
                <button 
                  onClick={() => setCurrentView('DEPARTMENT_ALL')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                    ${currentView === 'DEPARTMENT_ALL' ? 'bg-green-50 text-[#355E3B]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                  All {user.Department}
                </button>
              )}

              {(isApprover) && (
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

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters
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
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-2"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

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
                  <span className="ml-2 text-xs font-normal text-gray-500">({filteredTickets.length})</span>
                </h2>
                
                <button 
                  onClick={() => setSortAsc(!sortAsc)}
                  className="text-xs flex items-center gap-1 text-gray-600 hover:text-[#355E3B]"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Sort by {sortField} ({sortAsc ? 'Asc' : 'Desc'})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 cursor-pointer hover:bg-green-800" onClick={() => setSortField('Date')}>ID / Date</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 w-1/3">Issue</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 cursor-pointer hover:bg-green-800" onClick={() => setSortField('Status')}>Status</th>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
