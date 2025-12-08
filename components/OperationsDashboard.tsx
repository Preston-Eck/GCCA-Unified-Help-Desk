import React, { useState, useEffect } from 'react';
import { User, SOP, MaintenanceSchedule } from '../types';
// CHANGED: Import generic functions instead of specific ones
import { getItems, addItem, updateItem, deleteItem } from '../services/dataService';
import { BookOpen, Calendar, Edit, Trash2, Save, X, Search, Clock, Plus, AlertCircle } from 'lucide-react';

interface OperationsDashboardProps {
  currentUser: User;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'sops' | 'maintenance'>('sops');
  const [sops, setSops] = useState<SOP[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing states
  const [editingSOP, setEditingSOP] = useState<Partial<SOP> | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Partial<MaintenanceSchedule> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // CHANGED: Use generic getItems with list names
      const [sopsData, maintenanceData] = await Promise.all([
        getItems('SOPs'),
        getItems('Maintenance')
      ]);
      setSops(sopsData);
      setSchedules(maintenanceData);
    } catch (err) {
      console.error('Failed to load operations data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // --- SOP Handlers ---

  const handleSaveSOP = async () => {
    if (!editingSOP?.title || !editingSOP?.content) return;

    try {
      if (editingSOP.id) {
        // CHANGED: Use generic updateItem
        await updateItem('SOPs', editingSOP.id, editingSOP);
        setSops(prev => prev.map(s => s.id === editingSOP.id ? { ...s, ...editingSOP } as SOP : s));
      } else {
        // CHANGED: Use generic addItem
        const newSOP = {
          ...editingSOP,
          lastUpdated: new Date().toISOString(),
          version: '1.0'
        };
        const added = await addItem('SOPs', newSOP);
        // If addItem returns the object with ID, use it, otherwise reload or append locally if ID is generated differently
        setSops(prev => [...prev, added as SOP]);
      }
      setEditingSOP(null);
    } catch (err) {
      console.error('Failed to save SOP:', err);
      setError('Failed to save SOP.');
    }
  };

  const handleDeleteSOP = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this SOP?')) return;
    try {
      // CHANGED: Use generic deleteItem
      await deleteItem('SOPs', id);
      setSops(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete SOP:', err);
      setError('Failed to delete SOP.');
    }
  };

  // --- Maintenance Handlers ---

  const handleSaveSchedule = async () => {
    if (!editingSchedule?.equipment || !editingSchedule?.task) return;

    try {
      if (editingSchedule.id) {
        // CHANGED: Use generic updateItem
        await updateItem('Maintenance', editingSchedule.id, editingSchedule);
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? { ...s, ...editingSchedule } as MaintenanceSchedule : s));
      } else {
        // CHANGED: Use generic addItem
        const newSchedule = {
          ...editingSchedule,
          status: 'Pending',
          assignedTo: currentUser.name
        };
        const added = await addItem('Maintenance', newSchedule);
        setSchedules(prev => [...prev, added as MaintenanceSchedule]);
      }
      setEditingSchedule(null);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError('Failed to save maintenance schedule.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      // CHANGED: Use generic deleteItem
      await deleteItem('Maintenance', id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setError('Failed to delete schedule.');
    }
  };

  // --- Filtering ---

  const filteredSOPs = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sop.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSchedules = schedules.filter(schedule =>
    schedule.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading operations data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-slate-600">Manage SOPs and maintenance schedules</p>
        </div>
        <div className="flex gap-2">
            {/* Tab Buttons */}
          <button
            onClick={() => setActiveTab('sops')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sops' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              SOP Library
            </div>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'maintenance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Maintenance
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'sops' ? "Search SOPs..." : "Search Schedules..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={() => activeTab === 'sops' 
            ? setEditingSOP({ category: 'General', content: '' }) 
            : setEditingSchedule({ frequency: 'Monthly', status: 'Pending' })
          }
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New {activeTab === 'sops' ? 'SOP' : 'Task'}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'sops' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSOPs.map(sop => (
            <div key={sop.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-2">
                    {sop.category}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{sop.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingSOP(sop)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSOP(sop.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-4 line-clamp-3">{sop.content}</p>
              <div className="flex items-center text-xs text-slate-500 gap-4">
                <span>Ver: {sop.version}</span>
                <span>Updated: {new Date(sop.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-700">Equipment</th>
                <th className="px-6 py-4 font-medium text-slate-700">Task</th>
                <th className="px-6 py-4 font-medium text-slate-700">Frequency</th>
                <th className="px-6 py-4 font-medium text-slate-700">Next Due</th>
                <th className="px-6 py-4 font-medium text-slate-700">Assigned To</th>
                <th className="px-6 py-4 font-medium text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map(schedule => (
                <tr key={schedule.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{schedule.equipment}</td>
                  <td className="px-6 py-4 text-slate-600">{schedule.task}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      {schedule.frequency}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(schedule.nextDue).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                        {schedule.assignedTo.charAt(0)}
                      </div>
                      <span className="text-slate-600">{schedule.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingSchedule(schedule)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit SOP Modal */}
      {editingSOP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSOP.id ? 'Edit SOP' : 'New SOP'}
              </h2>
              <button onClick={() => setEditingSOP(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingSOP.title || ''}
                  onChange={e => setEditingSOP(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={editingSOP.category || 'General'}
                  onChange={e => setEditingSOP(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option>General</option>
                  <option>Safety</option>
                  <option>Equipment</option>
                  <option>Process</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                  rows={6}
                  value={editingSOP.content || ''}
                  onChange={e => setEditingSOP(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingSOP(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSOP}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save SOP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSchedule.id ? 'Edit Schedule' : 'New Schedule'}
              </h2>
              <button onClick={() => setEditingSchedule(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipment</label>
                  <input
                    type="text"
                    value={editingSchedule.equipment || ''}
                    onChange={e => setEditingSchedule(prev => ({ ...prev, equipment: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select
                    value={editingSchedule.frequency || 'Monthly'}
                    onChange={e => setEditingSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Description</label>
                <input
                  type="text"
                  value={editingSchedule.task || ''}
                  onChange={e => setEditingSchedule(prev => ({ ...prev, task: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={editingSchedule.nextDue ? new Date(editingSchedule.nextDue).toISOString().split('T')[0] : ''}
                  onChange={e => setEditingSchedule(prev => ({ ...prev, nextDue: new Date(e.target.value).toISOString() }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;