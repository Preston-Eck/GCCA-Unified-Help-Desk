import React from 'react';
import { Ticket, UserConfig, TicketStatus, Priority } from '../types';
import { getTicketsForUser, approveTicket, resolveTicket } from '../services/ticketService';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Props {
  currentUser: UserConfig;
  refreshTrigger: number;
  onRefresh: () => void;
}

const TicketDashboard: React.FC<Props> = ({ currentUser, refreshTrigger, onRefresh }) => {
  const tickets = getTicketsForUser(currentUser);

  const handleApprove = (id: string) => {
    if (confirm('Approve this ticket for maintenance?')) {
      approveTicket(id);
      onRefresh();
    }
  };

  const handleResolve = (id: string) => {
    if (confirm('Mark this ticket as resolved?')) {
      resolveTicket(id);
      onRefresh();
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL: return 'bg-red-100 text-red-800';
      case Priority.HIGH: return 'bg-orange-100 text-orange-800';
      case Priority.MEDIUM: return 'bg-blue-100 text-blue-800';
      case Priority.LOW: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (s: TicketStatus) => {
    switch (s) {
      case TicketStatus.RESOLVED: return <CheckCircle className="w-4 h-4 text-green-600" />;
      case TicketStatus.PENDING_APPROVAL: return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-t-4 border-gcca-gold overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          Ticket Dashboard <span className="text-sm font-normal text-gray-500">({currentUser.role} View)</span>
        </h2>
        <span className="text-sm text-gray-500">{tickets.length} ticket(s) found</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Dept / Campus</th>
              <th className="p-4">Issue</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No tickets found for your current view.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono font-medium text-gray-600">{ticket.id}</td>
                  <td className="p-4 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{ticket.department}</div>
                    <div className="text-xs text-gray-500">{ticket.campus}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{ticket.locationDetails}</div>
                    <div className="text-gray-500 truncate max-w-xs">{ticket.description}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span>{ticket.status}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {/* Action Buttons Logic */}
                    <div className="flex gap-2">
                      {currentUser.role === 'Approver' && ticket.status === TicketStatus.PENDING_APPROVAL && (
                        <button 
                          onClick={() => handleApprove(ticket.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      
                      {(currentUser.role === 'Tech' || currentUser.role === 'Chair') && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.PENDING_APPROVAL && (
                        <button 
                          onClick={() => handleResolve(ticket.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketDashboard;
