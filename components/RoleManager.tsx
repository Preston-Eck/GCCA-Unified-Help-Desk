import React, { useState, useEffect } from 'react';
import { RoleDefinition, Permission } from '../types';
import { getRoles, saveRole, deleteRole } from '../services/dataService';
import { Shield, Plus, Save, Trash2, CheckSquare } from 'lucide-react';

const PERMISSION_GROUPS = {
  'Tickets': ['TICKET_CREATE', 'TICKET_READ_OWN', 'TICKET_READ_DEPT', 'TICKET_READ_ALL', 'TICKET_UPDATE_OWN', 'TICKET_UPDATE_ALL', 'TICKET_DELETE', 'TICKET_ASSIGN', 'TICKET_APPROVE', 'TICKET_MERGE'],
  'Tasks': ['TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE'],
  'Assets': ['ASSET_READ', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_DELETE'],
  'Inventory': ['INVENTORY_READ', 'INVENTORY_ADJUST', 'INVENTORY_PURCHASE'],
  'Vendors': ['VENDOR_READ', 'VENDOR_MANAGE', 'VENDOR_APPROVE'],
  'People': ['USER_READ', 'USER_MANAGE', 'ROLE_MANAGE'],
  'Docs & SOPs': ['SOP_READ', 'SOP_MANAGE', 'DOC_MANAGE'],
  'System': ['VIEW_DASHBOARD', 'VIEW_ADMIN_PANEL']
};

const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<RoleDefinition>({ RoleName: '', Description: '', Permissions: [] });

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  const handleSelect = (role: RoleDefinition) => {
    setSelectedRole(role);
    setEditForm({ ...role });
    setIsEditing(false);
  };

  const handleCreate = () => {
    const newRole = { RoleName: 'New Role', Description: '', Permissions: [] };
    setSelectedRole(null);
    setEditForm(newRole);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editForm.RoleName) {
      saveRole(editForm);
      setRoles(getRoles()); // Reload from cache
      setSelectedRole(editForm);
      setIsEditing(false);
    }
  };

  const handleDelete = (roleName: string) => {
    if (confirm(`Delete role "${roleName}"?`)) {
      deleteRole(roleName);
      setRoles(getRoles());
      setSelectedRole(null);
    }
  };

  const togglePermission = (perm: Permission) => {
    const current = editForm.Permissions;
    const updated = current.includes(perm) 
      ? current.filter(p => p !== perm) 
      : [...current, perm];
    setEditForm({ ...editForm, Permissions: updated });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[calc(100vh-140px)] flex flex-col md:flex-row overflow-hidden">
      
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
              onClick={() => handleSelect(r)}
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
      <div className="flex-1 flex flex-col bg-white">
        {(selectedRole || isEditing) ? (
          <>
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3 max-w-md">
                    <input 
                      className="text-2xl font-bold text-gray-900 border-b border-gray-300 w-full focus:outline-none focus:border-[#355E3B] bg-transparent"
                      value={editForm.RoleName}
                      onChange={e => setEditForm({ ...editForm, RoleName: e.target.value })}
                      placeholder="Role Name"
                    />
                    <input 
                      className="text-sm text-gray-600 border-b border-gray-300 w-full focus:outline-none focus:border-[#355E3B] bg-transparent"
                      value={editForm.Description}
                      onChange={e => setEditForm({ ...editForm, Description: e.target.value })}
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
                    <button onClick={() => { setIsEditing(false); setSelectedRole(roles.find(r => r.RoleName === editForm.RoleName) || null); }} className="border border-gray-300 px-3 py-2 rounded text-gray-600 hover:bg-gray-100">
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

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {group}
                    </div>
                    <div className="p-2 space-y-1">
                      {perms.map((perm) => {
                        const isActive = editForm.Permissions.includes(perm as Permission);
                        return (
                          <div 
                            key={perm} 
                            onClick={() => isEditing && togglePermission(perm as Permission)}
                            className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                              isEditing ? 'cursor-pointer hover:bg-gray-50' : ''
                            } ${isActive ? 'bg-green-50 text-green-900' : 'text-gray-500'}`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isActive ? 'bg-[#355E3B] border-[#355E3B]' : 'border-gray-300'}`}>
                              {isActive && <CheckSquare className="w-3 h-3 text-white" />}
                            </div>
                            <span className={isActive ? 'font-medium' : ''}>{perm.replace(/_/g, ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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