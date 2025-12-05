

import React, { useState, useEffect } from 'react';
import { User, Campus, Building, Location, Asset, MaintenanceSchedule, SOP } from '../types';
import { 
  getCampuses, getBuildings, getLocations, getAssets,
  addBuilding, addLocation, addAsset, deleteBuilding, deleteLocation, deleteAsset,
  getMaintenanceSchedules, saveMaintenanceSchedule, deleteMaintenanceSchedule,
  getSOPsForAsset, addSOP, linkSOPToAsset, updateAsset, checkAndGeneratePMTickets, updateSOP, hasPermission
} from '../services/dataService';
import { generateMaintenanceSchedule, generateSOPContent } from '../services/geminiService';
import { Trash2, Plus, RefreshCw, MapPin, Box, Home, Calendar, BookOpen, Sparkles, X, Save, Edit, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  user: User;
}

type Tab = 'BUILDINGS' | 'LOCATIONS' | 'ASSETS';

const AssetManager: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('BUILDINGS');
  const [selectedCampus, setSelectedCampus] = useState(getCampuses()[0]?.CampusID || '');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Asset Detail Modal State
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);

  // Data State
  const campuses = getCampuses();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Refresh Trigger
  const refresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    if (selectedCampus) setBuildings(getBuildings(selectedCampus));
    else setBuildings([]);
  }, [selectedCampus, refreshKey]);

  useEffect(() => {
    if (selectedBuilding) setLocations(getLocations(selectedBuilding));
    else setLocations([]);
  }, [selectedBuilding, refreshKey]);

  useEffect(() => {
    if (selectedLocation) setAssets(getAssets(selectedLocation));
    else setAssets([]);
  }, [selectedLocation, refreshKey]);


  const handleAdd = () => {
    const name = prompt(`Enter name for new ${activeTab.slice(0, -1).toLowerCase()}:`);
    if (!name) return;

    if (activeTab === 'BUILDINGS' && selectedCampus) {
      addBuilding(selectedCampus, name);
    } else if (activeTab === 'LOCATIONS' && selectedBuilding) {
      addLocation(selectedBuilding, name);
    } else if (activeTab === 'ASSETS' && selectedLocation) {
      addAsset(selectedLocation, name);
    }
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    
    if (activeTab === 'BUILDINGS') deleteBuilding(id);
    if (activeTab === 'LOCATIONS') deleteLocation(id);
    if (activeTab === 'ASSETS') deleteAsset(id);
    refresh();
  };

  const runPMCheck = () => {
    const count = checkAndGeneratePMTickets();
    if(count > 0) alert(`Generated ${count} maintenance tickets from due schedules.`);
    else alert("No schedules are currently due.");
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-[#355E3B]">Asset Management</h2>
        <div className="flex items-center gap-2">
           <button onClick={runPMCheck} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 flex items-center gap-1 font-bold">
             <Clock className="w-3 h-3" /> Run Daily PM Check
           </button>
           <span className="text-sm text-gray-500">Manage infrastructure data</span>
        </div>
      </div>

      <div className="p-6">
        {/* Context Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campus</label>
            <select 
              value={selectedCampus} 
              onChange={e => setSelectedCampus(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            >
              {campuses.map(c => <option key={c.CampusID} value={c.CampusID}>{c.Campus_Name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Building</label>
            <select 
              value={selectedBuilding} 
              onChange={e => setSelectedBuilding(e.target.value)}
              disabled={activeTab === 'BUILDINGS' && !selectedCampus}
              className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
            >
              <option value="">-- All / Select --</option>
              {buildings.map(b => <option key={b.BuildingID} value={b.BuildingID}>{b.Building_Name}</option>)}
            </select>
          </div>

           <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
            <select 
              value={selectedLocation} 
              onChange={e => setSelectedLocation(e.target.value)}
              disabled={activeTab !== 'ASSETS'}
              className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"
            >
              <option value="">-- Select Location --</option>
              {locations.map(l => <option key={l.LocationID} value={l.LocationID}>{l.Location_Name}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button 
            onClick={() => setActiveTab('BUILDINGS')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'BUILDINGS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}
          >
            <Home className="w-4 h-4" /> Buildings
          </button>
          <button 
            onClick={() => setActiveTab('LOCATIONS')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'LOCATIONS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}
          >
            <MapPin className="w-4 h-4" /> Locations
          </button>
          <button 
            onClick={() => setActiveTab('ASSETS')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'ASSETS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}
          >
            <Box className="w-4 h-4" /> Assets
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleAdd}
            disabled={
              (activeTab === 'LOCATIONS' && !selectedBuilding) ||
              (activeTab === 'ASSETS' && !selectedLocation)
            }
            className="bg-[#355E3B] text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add New {activeTab.slice(0, -1).toLowerCase()}
          </button>
        </div>

        {/* List */}
        <div className="bg-gray-50 rounded border border-gray-200 max-h-96 overflow-y-auto">
          {activeTab === 'BUILDINGS' && (
            <ul className="divide-y divide-gray-200">
              {buildings.length === 0 ? <li className="p-4 text-center text-gray-500">No buildings found.</li> :
              buildings.map(b => (
                <li key={b.BuildingID} className="p-3 flex justify-between items-center hover:bg-white">
                  <span>{b.Building_Name}</span>
                  <button onClick={() => handleDelete(b.BuildingID)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'LOCATIONS' && (
            <ul className="divide-y divide-gray-200">
              {!selectedBuilding ? <li className="p-4 text-center text-gray-500">Select a Building to view Locations.</li> :
               locations.length === 0 ? <li className="p-4 text-center text-gray-500">No locations found.</li> :
               locations.map(l => (
                <li key={l.LocationID} className="p-3 flex justify-between items-center hover:bg-white">
                  <span>{l.Location_Name}</span>
                  <button onClick={() => handleDelete(l.LocationID)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'ASSETS' && (
             <ul className="divide-y divide-gray-200">
              {!selectedLocation ? <li className="p-4 text-center text-gray-500">Select a Location to view Assets.</li> :
               assets.length === 0 ? <li className="p-4 text-center text-gray-500">No assets found.</li> :
               assets.map(a => (
                <li 
                  key={a.AssetID} 
                  className="p-3 flex justify-between items-center hover:bg-white cursor-pointer group"
                  onClick={() => setSelectedAssetForDetail(a)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 group-hover:text-[#355E3B]">{a.Asset_Name}</span>
                    <span className="text-[10px] text-gray-400">Model: {a.Model_Number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Manage</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(a.AssetID); }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ASSET DETAIL MODAL */}
      {selectedAssetForDetail && (
        <AssetDetailModal 
          asset={selectedAssetForDetail} 
          user={user}
          onClose={() => { setSelectedAssetForDetail(null); refresh(); }} 
        />
      )}
    </div>
  );
};

// --- Asset Detail Modal Sub-Component ---
const AssetDetailModal = ({ asset, user, onClose }: { asset: Asset, user: User, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'MAINTENANCE' | 'SOPS'>('INFO');
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [editForm, setEditForm] = useState<Asset>(asset);
  const [isGenerating, setIsGenerating] = useState(false);

  const canEditSOP = hasPermission(user, 'MANAGE_SOPS');
  const canEditSchedule = hasPermission(user, 'MANAGE_SCHEDULES');

  useEffect(() => {
    setSchedules(getMaintenanceSchedules(asset.AssetID));
    setSops(getSOPsForAsset(asset.AssetID));
  }, [asset]);

  const handleSaveInfo = () => {
    updateAsset(editForm);
    alert("Saved");
  };

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    const result = await generateMaintenanceSchedule(asset.Asset_Name, asset.Model_Number || '');
    if (result.length > 0) {
      result.forEach(item => {
        saveMaintenanceSchedule({
          ScheduleID: '',
          AssetID_Ref: asset.AssetID,
          TaskName: item.task,
          Frequency: item.frequency as any,
          NextDue: new Date(Date.now() + 86400000).toISOString() // Default tomorrow
        });
      });
      setSchedules(getMaintenanceSchedules(asset.AssetID));
    }
    setIsGenerating(false);
  };

  const handleCreateSOP = async (taskName: string) => {
     setIsGenerating(true);
     const content = await generateSOPContent(taskName, asset.Asset_Name);
     const newSop = addSOP(`SOP for ${taskName}`, content);
     linkSOPToAsset(asset.AssetID, newSop.SOP_ID);
     setSops(getSOPsForAsset(asset.AssetID));
     setIsGenerating(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#355E3B] text-white p-6 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Box className="w-6 h-6" /> {asset.Asset_Name}
            </h2>
            <div className="text-green-100 text-sm mt-1 flex gap-4">
               <span>ID: {asset.AssetID}</span>
               <span>Model: {asset.Model_Number || 'N/A'}</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X className="w-6 h-6"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button onClick={() => setActiveTab('INFO')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'INFO' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}>
            Specs & Info
          </button>
          <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'MAINTENANCE' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}>
            <Calendar className="w-4 h-4" /> PM Schedule
          </button>
          <button onClick={() => setActiveTab('SOPS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'SOPS' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}>
            <BookOpen className="w-4 h-4" /> SOP Library
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'INFO' && (
            <div className="max-w-xl space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset Name</label>
                 <input className="w-full border p-2 rounded" value={editForm.Asset_Name} onChange={e => setEditForm({...editForm, Asset_Name: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Number</label>
                   <input className="w-full border p-2 rounded" value={editForm.Model_Number || ''} onChange={e => setEditForm({...editForm, Model_Number: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                   <input className="w-full border p-2 rounded" value={editForm.Serial_Number || ''} onChange={e => setEditForm({...editForm, Serial_Number: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Install Date</label>
                 <input type="date" className="w-full border p-2 rounded" value={editForm.InstallDate || ''} onChange={e => setEditForm({...editForm, InstallDate: e.target.value})} />
               </div>
               <button onClick={handleSaveInfo} className="bg-[#355E3B] text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-800">
                 <Save className="w-4 h-4" /> Save Changes
               </button>
            </div>
          )}

          {activeTab === 'MAINTENANCE' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                   <h3 className="font-bold text-blue-900 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Scheduler</h3>
                   <p className="text-xs text-blue-700">Generate suggested preventative maintenance tasks based on asset model.</p>
                </div>
                {canEditSchedule && (
                  <button onClick={handleGenerateSchedule} disabled={isGenerating} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-700 disabled:opacity-50">
                    {isGenerating ? 'Analyzing...' : 'Auto-Generate Schedule'}
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Active Schedules</h3>
                {schedules.length === 0 ? <p className="text-gray-400 italic">No schedules defined.</p> : (
                  <div className="grid gap-3">
                    {schedules.map(s => (
                      <CollapsibleSchedule 
                        key={s.ScheduleID} 
                        schedule={s} 
                        canEdit={canEditSchedule} 
                        onDelete={() => deleteMaintenanceSchedule(s.ScheduleID)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'SOPS' && (
            <div className="space-y-6">
               <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h3 className="font-bold text-amber-900 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Standard Operating Procedures</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    AI-generated procedures help technicians perform tasks consistently.
                  </p>
               </div>

               <div className="grid gap-4">
                 {sops.length === 0 ? <p className="text-gray-400 italic">No SOPs linked.</p> : 
                   sops.map(sop => (
                     <CollapsibleSOP 
                       key={sop.SOP_ID} 
                       sop={sop} 
                       canEdit={canEditSOP}
                     />
                   ))
                 }
               </div>

               {/* Quick Add Generator */}
               {canEditSOP && (
                 <div className="mt-8 border-t pt-6">
                   <h4 className="text-sm font-bold text-gray-700 mb-2">Generate New SOP</h4>
                   <div className="flex gap-2">
                     <input id="newSopTask" placeholder="e.g. Replace Filter" className="flex-1 border p-2 rounded text-sm" />
                     <button 
                       onClick={() => {
                          const input = document.getElementById('newSopTask') as HTMLInputElement;
                          if(input.value) handleCreateSOP(input.value);
                       }}
                       disabled={isGenerating}
                       className="bg-[#355E3B] text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-800 disabled:opacity-50"
                     >
                       {isGenerating ? 'Writing...' : 'Generate Procedure'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Collapsible Sub-Components

const CollapsibleSOP = ({ sop, canEdit }: { sop: SOP, canEdit: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(sop.Concise_Procedure_Text);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSOP({ ...sop, Concise_Procedure_Text: text });
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
      >
        <div className="font-bold text-gray-900 flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
          {sop.SOP_Title}
        </div>
        {isOpen && canEdit && !isEditing && (
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-xs text-blue-600 hover:underline">
            Edit
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
          {isEditing ? (
            <div className="space-y-2">
              <textarea 
                className="w-full border p-2 rounded" 
                rows={5}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Save</button>
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="text-gray-500 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
             <div className="whitespace-pre-wrap text-gray-700 font-mono">
               {sop.Concise_Procedure_Text}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

const CollapsibleSchedule = ({ schedule, canEdit, onDelete }: { schedule: MaintenanceSchedule, canEdit: boolean, onDelete: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Simpler schedule edit logic handled in Operations Dashboard for robustness, 
  // here we just show details + delete.
  
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
          <div>
            <div className="font-bold text-gray-900">{schedule.TaskName}</div>
            <div className="text-xs text-gray-500">Next: {new Date(schedule.NextDue).toLocaleDateString()}</div>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
            new Date(schedule.NextDue) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {new Date(schedule.NextDue) < new Date() ? 'Overdue' : 'OK'}
        </span>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
           <div className="grid grid-cols-2 gap-4 mb-3">
             <div><span className="font-bold text-gray-500 text-xs uppercase">Frequency:</span> {schedule.Frequency}</div>
             <div><span className="font-bold text-gray-500 text-xs uppercase">Last Done:</span> {schedule.LastPerformed || 'Never'}</div>
           </div>
           {canEdit && (
             <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 text-xs hover:underline flex items-center gap-1">
               <Trash2 className="w-3 h-3"/> Delete Schedule
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default AssetManager;