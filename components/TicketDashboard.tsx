
import React from 'react';
import { User } from '../types';
import { getTicketsForUser, lookup, updateTicketStatus } from '../services/dataService';
import { CheckCircle, Clock, FileText, User as UserIcon } from 'lucide-react';

interface Props {
  user: User;
  refreshKey: number;
  onRefresh: () => void;
}

const TicketDashboard: React.FC<Props> = ({ user, refreshKey, onRefresh }) => {
  const tickets = getTicketsForUser(user);

  const handleAction = (id: string, action: 'Approve' | 'Complete' | 'Assign') => {
    if (action === 'Approve') {
      updateTicketStatus(id, 'New');
    } else if (action === 'Complete') {
      updateTicketStatus(id, 'Completed');
    } else if (action === 'Assign') {
      // In a real app, this would open a modal to pick a user
      const assignee = prompt("Enter email of staff member to assign:", user.Email);
      if (assignee) updateTicketStatus(id, 'Assigned', assignee);
    }
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'New': 'bg-blue-100 text-blue-800',
      'Pending Approval': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Assigned': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${(styles as any)[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-[#355E3B] border-b-4 border-[#FFD700] pb-1 inline-block">
          Ticket Dashboard
        </h2>
        <span className="text-sm text-gray-500">Viewing as: {user.Name} ({user.User_Type})</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">ID / Date</th>
                <th className="p-4">Location</th>
                <th className="p-4 w-1/3">Issue</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No tickets found.</td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.TicketID} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-mono font-bold text-gray-700">{t.TicketID}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(t.Date_Submitted).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-gray-900">{lookup.campus(t.CampusID_Ref)}</div>
                      <div className="text-gray-600">{lookup.building(t.BuildingID_Ref)}</div>
                      <div className="text-xs text-gray-500 mt-1">{lookup.location(t.LocationID_Ref)}</div>
                      {t.Related_AssetID_Ref && (
                        <div className="text-xs text-[#355E3B] mt-1 bg-green-50 px-1 rounded inline-block">
                          Asset: {lookup.asset(t.Related_AssetID_Ref)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-gray-800">{t.Title}</div>
                      <div className="text-gray-600 mt-1">{t.Description}</div>
                      {t.Assigned_Staff && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-purple-700">
                          <UserIcon className="w-3 h-3" /> Assigned to: {t.Assigned_Staff}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <span className="font-medium text-gray-700">{t.Category}</span>
                    </td>
                    <td className="p-4 align-top">
                      {getStatusBadge(t.Status)}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col gap-2 items-end">
                        {/* Approver Logic */}
                        {user.User_Type.includes('Approver') && t.Status === 'Pending Approval' && (
                          <button onClick={() => handleAction(t.TicketID, 'Approve')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                        
                        {/* Chair Logic */}
                        {user.User_Type.includes('Chair') && t.Status !== 'Completed' && (
                          <button onClick={() => handleAction(t.TicketID, 'Assign')} className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> Assign
                          </button>
                        )}

                        {/* Tech Logic */}
                        {(user.User_Type.includes('Tech') || user.User_Type.includes('Chair')) && t.Status !== 'Completed' && (
                          <button onClick={() => handleAction(t.TicketID, 'Complete')} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Mark Complete
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
    </div>
  );
};

export default TicketDashboard;
