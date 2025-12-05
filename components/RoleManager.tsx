

import React, { useState, useEffect } from 'react';
import { getRoles, saveRole, deleteRole } from '../services/dataService';
import { RoleDefinition, Permission } from '../types';
import { Shield, Plus, Save, Trash2, CheckSquare, Square, X } from 'lucide-react';

const AVAILABLE_PERMISSIONS: Permission[] = [
  'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'VIEW_DEPT_TICKETS',
  'VIEW_CAMPUS_TICKETS', 'VIEW_ALL_BIDS', 'MANAGE_ASSETS', 'MANAGE_USERS',
  'MANAGE_VENDORS', 'MANAGE_ROLES', 'MANAGE_SETTINGS', 'MANAGE_SOPS', 'MANAGE_SCHEDULES',
  'ASSIGN_TICKETS', 'APPROVE_TICKETS', 'CLAIM_TICKETS', 'MERGE_TICKETS'
];

const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<RoleDefinition>({ RoleName: '', Description: '', Permissions: [] });

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  const handleSelectRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setEditForm({ ...role });
    setIsEditing(false); // View mode first
  };

  const handleCreate = () => {
    const newRole = { RoleName: 'New Role', Description: '', Permissions: [] };
    setSelectedRole(null);
    setEditForm(newRole);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.RoleName) return;
    saveRole(editForm);
    setRoles(getRoles()); // Refresh
    setSelectedRole(editForm);
    setIsEditing(false);
  };

  const handleDelete = (roleName: string) => {
    if (roleName === 'Super Admin') {
      alert("Cannot delete the Super Admin role.");
      return;
    }
    if (confirm(`Delete role "${roleName}"? This may affect users assigned to this role.`)) {
      deleteRole(roleName);
      setRoles(getRoles());
      setSelectedRole(null);
    }
  };

  const togglePermission = (perm: Permission) => {
    const current = editForm.Permissions;
    if (current.includes(perm)) {
      setEditForm({ ...editForm, Permissions: current.filter(p => p !== perm) });
    } else {
      setEditForm({ ...editForm, Permissions: [...current, perm] });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden h-[calc(100vh-140px)] flex flex-col md:flex-row">
      
      {/* Sidebar List */}
      <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-[#355E3B] flex items-center gap-2">
            <Shield className="w-5 h-5" /> Roles
          </h2>
          <button onClick={handleCreate} className="bg-[#355E3B] text-white p-1 rounded hover:bg-green-800">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roles.map(r => (
            <button
              key={r.RoleName}
              onClick={() => handleSelectRole(r)}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium flex justify-between items-center ${
                selectedRole?.RoleName === r.RoleName || (isEditing && editForm.RoleName === r.RoleName)
                  ? 'bg-white shadow border border-gray-200 text-[#355E3B]' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r.RoleName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {(selectedRole || isEditing) ? (
          <>
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-white">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3 max-w-md">
                     <input 
                       className="text-2xl font-bold text-gray-900 border-b border-gray-300 w-full focus:outline-none focus:border-[#355E3B]"
                       value={editForm.RoleName}
                       onChange={e => setEditForm({...editForm, RoleName: e.target.value})}
                       placeholder="Role Name"
                     />
                     <input 
                       className="text-sm text-gray-600 border-b border-gray-300 w-full focus:outline-none focus:border-[#355E3B]"
                       value={editForm.Description}
                       onChange={e => setEditForm({...editForm, Description: e.target.value})}
                       placeholder="Role Description"
                     />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRole?.RoleName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{selectedRole?.Description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                 {isEditing ? (
                   <>
                     <button onClick={handleSave} className="bg-[#355E3B] text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-800">
                       <Save className="w-4 h-4" /> Save Role
                     </button>
                     <button onClick={() => { setIsEditing(false); setSelectedRole(roles.find(r => r.RoleName === editForm.RoleName) || null); }} className="border border-gray-300 px-3 py-2 rounded text-gray-600 hover:bg-gray-50">
                       Cancel
                     </button>
                   </>
                 ) : (
                   <>
                     <button onClick={() => { setEditForm(selectedRole!); setIsEditing(true); }} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded font-bold hover:bg-indigo-100">
                       Edit Permissions
                     </button>
                     <button onClick={() => handleDelete(selectedRole!.RoleName)} className="text-red-600 px-3 py-2 rounded hover:bg-red-50">
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </>
                 )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Permissions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isChecked = editForm.Permissions.includes(perm);
                  return (
                    <div 
                      key={perm}
                      onClick={() => isEditing && togglePermission(perm)}
                      className={`p-3 rounded border flex items-center gap-3 transition-colors ${
                        isEditing ? 'cursor-pointer hover:border-[#355E3B]' : 'opacity-80'
                      } ${isChecked ? 'bg-white border-green-200' : 'bg-gray-100 border-gray-200'}`}
                    >
                      <div className={`${isChecked ? 'text-[#355E3B]' : 'text-gray-400'}`}>
                        {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                      <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {perm.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
            <Shield className="w-12 h-12 opacity-20" />
            <p>Select a role to manage permissions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManager;