

import React, { useState, useEffect } from 'react';
import { User, SOP, MaintenanceSchedule } from '../types';
import { getAllSOPs, updateSOP, deleteSOP, getAllMaintenanceSchedules, saveMaintenanceSchedule, deleteMaintenanceSchedule, lookup, hasPermission } from '../services/dataService';
import { BookOpen, Calendar, Edit, Trash2, Save, X, Search, Clock, Plus } from 'lucide-react';

interface Props {
  user: User;
}

type Tab = 'SOPS' | 'SCHEDULES';

const OperationsDashboard: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('SOPS');
  const [sops, setSops] = useState<SOP[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit States
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

  const canManageSOPs = hasPermission(user, 'MANAGE_SOPS');
  const canManageSchedules = hasPermission(user, 'MANAGE_SCHEDULES');

  useEffect(() => {
    if (activeTab === 'SOPS') setSops(getAllSOPs());
    if (activeTab === 'SCHEDULES') setSchedules(getAllMaintenanceSchedules());
  }, [activeTab, refreshKey]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleSaveSOP = () => {
    if (editingSOP) {
      updateSOP(editingSOP);
      setEditingSOP(null);
      handleRefresh();
    }
  };

  const handleDeleteSOP = (id: string) => {
    if (confirm('Delete this SOP? This will unlink it from all assets.')) {
      deleteSOP(id);
      handleRefresh();
    }
  };

  const handleSaveSchedule = () => {
    if (editingSchedule) {
      saveMaintenanceSchedule(editingSchedule);
      setEditingSchedule(null);
      handleRefresh();
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Delete this schedule?')) {
      deleteMaintenanceSchedule(id);
      handleRefresh();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden min-h-[500px]">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#355E3B] flex items-center gap-2">
          <Clock className="w-5 h-5" /> Operations Dashboard
        </h2>
        <div className="flex bg-gray-200 rounded p-1">
          <button 
            onClick={() => setActiveTab('SOPS')}
            className={`px-4 py-2 text-sm font-bold rounded flex items-center gap-2 ${activeTab === 'SOPS' ? 'bg-white shadow text-[#355E3B]' : 'text-gray-500'}`}
          >
            <BookOpen className="w-4 h-4" /> SOP Library
          </button>
          <button 
            onClick={() => setActiveTab('SCHEDULES')}
            className={`px-4 py-2 text-sm font-bold rounded flex items-center gap-2 ${activeTab === 'SCHEDULES' ? 'bg-white shadow text-[#355E3B]' : 'text-gray-500'}`}
          >
            <Calendar className="w-4 h-4" /> Master Schedule
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            placeholder="Search..." 
            className="border p-2 rounded text-sm w-64" 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {activeTab === 'SOPS' && (
          <div>
            {!canManageSOPs && <p className="text-red-500 mb-4 text-sm">You do not have permission to manage SOPs.</p>}
            <div className="grid gap-4">
              {sops.filter(s => s.SOP_Title.toLowerCase().includes(filter.toLowerCase())).map(sop => (
                <div key={sop.SOP_ID} className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                   {editingSOP?.SOP_ID === sop.SOP_ID ? (
                     <div className="space-y-3">
                       <input 
                         className="w-full font-bold border-b p-1" 
                         value={editingSOP.SOP_Title}
                         onChange={e => setEditingSOP({...editingSOP, SOP_Title: e.target.value})}
                       />
                       <textarea 
                         className="w-full border p-2 rounded text-sm h-32 font-mono"
                         value={editingSOP.Concise_Procedure_Text}
                         onChange={e => setEditingSOP({...editingSOP, Concise_Procedure_Text: e.target.value})}
                       />
                       <div className="flex gap-2">
                         <button onClick={handleSaveSOP} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                         <button onClick={() => setEditingSOP(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs">Cancel</button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="font-bold text-gray-800">{sop.SOP_Title}</div>
                         <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{sop.Concise_Procedure_Text}</div>
                       </div>
                       {canManageSOPs && (
                         <div className="flex gap-2 shrink-0 ml-4">
                           <button onClick={() => setEditingSOP(sop)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                           <button onClick={() => handleDeleteSOP(sop.SOP_ID)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SCHEDULES' && (
           <div className="overflow-x-auto">
             {!canManageSchedules && <p className="text-red-500 mb-4 text-sm">You do not have permission to manage Schedules.</p>}
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b">
                   <th className="p-3">Status</th>
                   <th className="p-3">Task Name</th>
                   <th className="p-3">Asset</th>
                   <th className="p-3">Frequency</th>
                   <th className="p-3">Next Due</th>
                   <th className="p-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="text-sm divide-y">
                 {schedules.filter(s => s.TaskName.toLowerCase().includes(filter.toLowerCase())).map(s => (
                   <tr key={s.ScheduleID} className="hover:bg-gray-50">
                     {editingSchedule?.ScheduleID === s.ScheduleID ? (
                       <>
                         <td colSpan={5} className="p-3">
                           <div className="grid grid-cols-4 gap-2">
                             <input className="border p-1 rounded" value={editingSchedule.TaskName} onChange={e => setEditingSchedule({...editingSchedule, TaskName: e.target.value})} />
                             <select className="border p-1 rounded" value={editingSchedule.Frequency} onChange={e => setEditingSchedule({...editingSchedule, Frequency: e.target.value as any})}>
                               {['Daily','Weekly','Monthly','Quarterly','Yearly'].map(f => <option key={f} value={f}>{f}</option>)}
                             </select>
                             <input type="date" className="border p-1 rounded" value={editingSchedule.NextDue.split('T')[0]} onChange={e => setEditingSchedule({...editingSchedule, NextDue: new Date(e.target.value).toISOString()})} />
                           </div>
                         </td>
                         <td className="p-3 text-right">
                           <button onClick={handleSaveSchedule} className="text-green-600 font-bold mr-2">Save</button>
                           <button onClick={() => setEditingSchedule(null)} className="text-gray-500">Cancel</button>
                         </td>
                       </>
                     ) : (
                       <>
                         <td className="p-3">
                            {new Date(s.NextDue) < new Date() ? <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Overdue</span> : <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">OK</span>}
                         </td>
                         <td className="p-3 font-medium">{s.TaskName}</td>
                         <td className="p-3 text-gray-600">{lookup.asset(s.AssetID_Ref)}</td>
                         <td className="p-3">{s.Frequency}</td>
                         <td className="p-3 font-mono text-xs">{new Date(s.NextDue).toLocaleDateString()}</td>
                         <td className="p-3 text-right">
                           {canManageSchedules && (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => setEditingSchedule(s)} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                               <button onClick={() => handleDeleteSchedule(s.ScheduleID)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                             </div>
                           )}
                         </td>
                       </>
                     )}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
};

export default OperationsDashboard;