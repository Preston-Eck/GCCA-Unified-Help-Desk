
import React, { useState, useEffect } from 'react';
import { User, AccountRequest, RoleDefinition } from '../types';
import { getUsers, saveUser, deleteUser, getAccountRequests, approveAccountRequest, rejectAccountRequest, getRoles } from '../services/dataService';
import { Users, Plus, Edit2, Trash2, Save, X, Shield, UserPlus, Check, XCircle } from 'lucide-react';

interface Props {
  currentUser: User;
}

const UserManager: React.FC<Props> = ({ currentUser }) => {
  const [view, setView] = useState<'USERS' | 'REQUESTS'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setUsers(getUsers());
    setRequests(getAccountRequests());
    setAvailableRoles(getRoles());
  }, [refreshKey, view]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleCreate = () => {
    setEditingUser({
      UserID: '',
      Name: '',
      Email: '',
      User_Type: 'Staff',
      Department: 'Academics'
    });
  };

  const handleSave = () => {
    if (editingUser && editingUser.Email && editingUser.Name) {
      saveUser(editingUser as User);
      setEditingUser(null);
      handleRefresh();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this user? This cannot be undone.')) {
      deleteUser(id);
      handleRefresh();
    }
  };

  const handleApproveRequest = (req: AccountRequest) => {
    // We can open the edit modal to confirm details before final save
    setEditingUser({
       UserID: '',
       Name: req.Name,
       Email: req.Email,
       User_Type: req.RequestedRole,
       Department: req.Department || 'General'
    });
    rejectAccountRequest(req.RequestID); // Remove from request queue
  }

  const handleRejectRequest = (id: string) => {
    if(confirm('Reject this request?')) {
      rejectAccountRequest(id);
      handleRefresh();
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-[#355E3B] flex items-center gap-2">
          <Users className="w-5 h-5" /> User Management
        </h2>
        
        <div className="flex bg-gray-200 rounded p-1 gap-1">
          <button 
            onClick={() => setView('USERS')}
            className={`px-3 py-1.5 text-sm font-bold rounded ${view === 'USERS' ? 'bg-white shadow text-[#355E3B]' : 'text-gray-500'}`}
          >
            Active Users
          </button>
           <button 
            onClick={() => setView('REQUESTS')}
            className={`px-3 py-1.5 text-sm font-bold rounded flex items-center gap-1 ${view === 'REQUESTS' ? 'bg-white shadow text-[#355E3B]' : 'text-gray-500'}`}
          >
            Pending Requests 
            {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
          </button>
        </div>

        {view === 'USERS' && (
          <button
            onClick={handleCreate}
            className="bg-[#355E3B] text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-green-800"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        {view === 'USERS' ? (
          <table className="w-full text-left">
            <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role(s)</th>
                <th className="p-4">Department</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {users.map(u => (
                <tr key={u.UserID} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{u.Name}</td>
                  <td className="p-4 text-gray-600">{u.Email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {u.User_Type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{u.Department}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.UserID)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
             <thead className="bg-[#355E3B] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Requester</th>
                <th className="p-4">Email</th>
                <th className="p-4">Requested Role</th>
                <th className="p-4">Reason</th>
                <th className="p-4 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {requests.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No pending requests.</td></tr> : 
                requests.map(r => (
                <tr key={r.RequestID} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{r.Name}</td>
                  <td className="p-4 text-gray-600">{r.Email}</td>
                  <td className="p-4">
                     <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">{r.RequestedRole}</span>
                     {r.Department && <div className="text-xs text-gray-400 mt-1">{r.Department}</div>}
                  </td>
                  <td className="p-4 text-gray-600 italic">"{r.Reason}"</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleApproveRequest(r)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold">
                      <Check className="w-4 h-4" /> Review & Approve
                    </button>
                    <button onClick={() => handleRejectRequest(r.RequestID)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#355E3B] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Shield className="w-4 h-4" /> 
                {editingUser.UserID ? 'Edit User' : 'Approve/Create User'}
              </h3>
              <button onClick={() => setEditingUser(null)} className="hover:bg-white/20 rounded p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.Name}
                  onChange={e => setEditingUser({...editingUser, Name: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={editingUser.Email}
                  onChange={e => setEditingUser({...editingUser, Email: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                <select 
                   value={editingUser.Department}
                   onChange={e => setEditingUser({...editingUser, Department: e.target.value})}
                   className="w-full border border-gray-300 rounded p-2"
                >
                  <option value="General">General/Parent</option>
                  <option value="IT">IT</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Administration">Administration</option>
                  <option value="Academics">Academics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Primary Role
                </label>
                <select 
                   value={editingUser.User_Type?.split(',')[0]} 
                   onChange={e => setEditingUser({...editingUser, User_Type: e.target.value})}
                   className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                >
                  {availableRoles.map(r => (
                    <option key={r.RoleName} value={r.RoleName}>{r.RoleName}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Selected from defined roles.
                </p>
              </div>

              <button 
                onClick={handleSave}
                disabled={!editingUser.Name || !editingUser.Email}
                className="w-full bg-[#355E3B] text-white py-2 rounded font-bold hover:bg-green-800 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save User & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
