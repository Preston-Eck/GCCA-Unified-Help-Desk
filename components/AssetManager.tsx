import React, { useState, useEffect } from 'react';
import { User, Building, Location, Asset, MaintenanceSchedule, SOP } from '../types';
import { 
  getCampuses, getBuildings, getLocations, getAssets,
  addBuilding, addLocation, addAsset, 
  updateBuilding, updateLocation, updateAsset, // 🎓 Imported the new update functions
  deleteBuilding, deleteLocation, deleteAsset,
  getMaintenanceSchedules, saveMaintenanceSchedule, deleteMaintenanceSchedule,
  getSOPsForAsset, addSOP, linkSOPToAsset, updateSOP, checkAndGeneratePMTickets
} from '../services/dataService';
import { generateMaintenanceSchedule, generateSOPContent } from '../services/geminiService';
import { Trash2, Plus, Home, MapPin, Box, Calendar, BookOpen, Sparkles, X, Save, Clock, ChevronDown, ChevronRight, Edit2, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
}

type Tab = 'BUILDINGS' | 'LOCATIONS' | 'ASSETS';

/**
 * 🎓 EDUCATIONAL NOTE: ASSET MANAGER
 * This component handles the 3-level hierarchy of your infrastructure:
 * Campus -> Building -> Location -> Asset
 * It uses "Drill-down" logic: selecting a Campus reveals Buildings, etc.
 */
const AssetManager: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('BUILDINGS');
  
  // Selection State
  const [selectedCampus, setSelectedCampus] = useState(getCampuses()[0]?.CampusID || '');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Data State
  const campuses = getCampuses();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // UI State
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);

  // 🎓 REFRESH LOGIC:
  // When 'refreshKey' changes, these effects re-run to fetch the latest data from the cache.
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

  const refresh = () => setRefreshKey(prev => prev + 1);

  // --- HANDLERS ---

  const handleAdd = () => {
    const name = prompt(`Enter name for new ${activeTab.slice(0, -1).toLowerCase()}:`);
    if (!name) return;

    // 🎓 OPTIMISTIC UI:
    // We call the service function, which updates the Cache IMMEDIATELY.
    // Then we call 'refresh()' to force React to re-render with that new data.
    if (activeTab === 'BUILDINGS' && selectedCampus) {
      addBuilding(selectedCampus, name);
    } else if (activeTab === 'LOCATIONS' && selectedBuilding) {
      addLocation(selectedBuilding, name);
    } else if (activeTab === 'ASSETS' && selectedLocation) {
      addAsset(selectedLocation, name);
    }
    refresh();
  };

  const handleEditItem = (id: string, currentName: string, type: Tab) => {
    const newName = prompt("Edit Name:", currentName);
    if (!newName || newName === currentName) return;

    if (type === 'BUILDINGS') {
       // We create a new object but KEEP the old ID
       const b = buildings.find(x => x.BuildingID === id);
       if(b) updateBuilding({ ...b, Building_Name: newName });
    }
    if (type === 'LOCATIONS') {
       const l = locations.find(x => x.LocationID === id);
       if(l) updateLocation({ ...l, Location_Name: newName });
    }
    // Assets are handled in the Modal
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    if (activeTab === 'BUILDINGS') deleteBuilding(id);
    if (activeTab === 'LOCATIONS') deleteLocation(id);
    if (activeTab === 'ASSETS') deleteAsset(id);
    refresh();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden h-[calc(100vh-100px)] flex flex-col">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
        <h2 className="text-xl font-bold text-[#355E3B]">Asset Management</h2>
        <div className="flex items-center gap-2">
           <button onClick={() => checkAndGeneratePMTickets()} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 flex items-center gap-1 font-bold">
             <Clock className="w-3 h-3" /> Run Daily PM Check
           </button>
           <span className="text-sm text-gray-500">Manage infrastructure</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 overflow-hidden">
        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campus</label>
            <select value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)} className="w-full border border-gray-300 rounded p-2">
              {campuses.map(c => <option key={c.CampusID} value={c.CampusID}>{c.Campus_Name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Building</label>
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} disabled={!selectedCampus} className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100">
              <option value="">-- Select --</option>
              {buildings.map(b => <option key={b.BuildingID} value={b.BuildingID}>{b.Building_Name}</option>)}
            </select>
          </div>
           <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} disabled={activeTab !== 'ASSETS'} className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100">
              <option value="">-- Select --</option>
              {locations.map(l => <option key={l.LocationID} value={l.LocationID}>{l.Location_Name}</option>)}
            </select>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 mb-4 shrink-0">
          <button onClick={() => setActiveTab('BUILDINGS')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'BUILDINGS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}><Home className="w-4 h-4" /> Buildings</button>
          <button onClick={() => setActiveTab('LOCATIONS')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'LOCATIONS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}><MapPin className="w-4 h-4" /> Locations</button>
          <button onClick={() => setActiveTab('ASSETS')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'ASSETS' ? 'border-b-2 border-[#355E3B] text-[#355E3B]' : 'text-gray-500'}`}><Box className="w-4 h-4" /> Assets</button>
        </div>

        {/* TOOLBAR */}
        <div className="flex justify-end mb-4 shrink-0">
          <button onClick={handleAdd} disabled={(activeTab === 'LOCATIONS' && !selectedBuilding) || (activeTab === 'ASSETS' && !selectedLocation)} className="bg-[#355E3B] text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-green-800 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add New {activeTab.slice(0, -1).toLowerCase()}
          </button>
        </div>

        {/* LIST VIEW */}
        <div className="bg-gray-50 rounded border border-gray-200 flex-1 overflow-y-auto">
          {activeTab === 'BUILDINGS' && (
            <ul className="divide-y divide-gray-200">
              {buildings.map(b => (
                <li key={b.BuildingID} className="p-3 flex justify-between items-center hover:bg-white group">
                  <span className="font-medium">{b.Building_Name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditItem(b.BuildingID, b.Building_Name, 'BUILDINGS')} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(b.BuildingID)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
              {buildings.length === 0 && <p className="p-4 text-center text-gray-400 italic">No buildings found.</p>}
            </ul>
          )}
          
          {activeTab === 'LOCATIONS' && (
            <ul className="divide-y divide-gray-200">
               {locations.map(l => (
                <li key={l.LocationID} className="p-3 flex justify-between items-center hover:bg-white group">
                  <span className="font-medium">{l.Location_Name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditItem(l.LocationID, l.Location_Name, 'LOCATIONS')} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(l.LocationID)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
              {locations.length === 0 && <p className="p-4 text-center text-gray-400 italic">Select a building to view locations.</p>}
            </ul>
          )}
          
          {activeTab === 'ASSETS' && (
             <ul className="divide-y divide-gray-200">
               {assets.map(a => (
                <li key={a.AssetID} className="p-3 flex justify-between items-center hover:bg-white cursor-pointer group transition-colors" onClick={() => setSelectedAssetForDetail(a)}>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 group-hover:text-[#355E3B] flex items-center gap-2">
                       {a.Asset_Name}
                       {a.Warranty_Expires && new Date(a.Warranty_Expires) < new Date() && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded border border-red-200">Warranty Expired</span>
                       )}
                    </span>
                    <span className="text-[10px] text-gray-400 flex gap-2">
                      <span>Model: {a.Model_Number || 'N/A'}</span>
                      <span>•</span>
                      <span>Serial: {a.Serial_Number || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-wider mr-2">Open Details</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(a.AssetID); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
              {assets.length === 0 && <p className="p-4 text-center text-gray-400 italic">Select a location to view assets.</p>}
            </ul>
          )}
        </div>
      </div>

      {selectedAssetForDetail && (
        <AssetDetailModal asset={selectedAssetForDetail} user={user} onClose={() => { setSelectedAssetForDetail(null); refresh(); }} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const AssetDetailModal: React.FC<{ asset: Asset, user: User, onClose: () => void }> = ({ asset, user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'MAINTENANCE' | 'SOPS'>('INFO');
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [editForm, setEditForm] = useState<Asset>(asset);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setSchedules(getMaintenanceSchedules(asset.AssetID));
    setSops(getSOPsForAsset(asset.AssetID));
  }, [asset]);

  const handleSaveInfo = () => { 
    updateAsset(editForm); // 🎓 Updates cache immediately
    alert("Asset details saved!"); 
  };

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    const result = await generateMaintenanceSchedule(asset.Asset_Name, asset.Model_Number || '');
    if (result.length > 0) {
      result.forEach(item => {
        saveMaintenanceSchedule({
          PM_ID: '', // Generated in dataService
          AssetID_Ref: asset.AssetID,
          Task_Name: item.task,
          Frequency: item.frequency as any,
          Next_Due_Date: new Date(Date.now() + 86400000).toISOString()
        });
      });
      setTimeout(() => setSchedules(getMaintenanceSchedules(asset.AssetID)), 1000);
    }
    setIsGenerating(false);
  };

  const handleCreateSOP = async (taskName: string) => {
     setIsGenerating(true);
     const content = await generateSOPContent(taskName, asset.Asset_Name);
     const newSop = await addSOP(`SOP for ${taskName}`, content);
     linkSOPToAsset(asset.AssetID, newSop.SOP_ID);
     setSops(prev => [...prev, newSop]);
     setIsGenerating(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-[#355E3B] text-white p-6 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Box className="w-6 h-6" /> {asset.Asset_Name}</h2>
            <div className="text-green-100 text-sm mt-1 flex gap-4"><span>ID: {asset.AssetID}</span></div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors"><X className="w-6 h-6"/></button>
        </div>

        {/* MODAL TABS */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          <button onClick={() => setActiveTab('INFO')} className={`px-6 py-3 text-sm font-bold ${activeTab === 'INFO' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}>Specs & Info</button>
          <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'MAINTENANCE' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}><Calendar className="w-4 h-4" /> PM Schedule</button>
          <button onClick={() => setActiveTab('SOPS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'SOPS' ? 'bg-white text-[#355E3B] border-t-2 border-t-[#355E3B]' : 'text-gray-500'}`}><BookOpen className="w-4 h-4" /> SOP Library</button>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'INFO' && (
            <div className="max-w-2xl space-y-6">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset Name</label>
                 <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" value={editForm.Asset_Name} onChange={e => setEditForm({...editForm, Asset_Name: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Number</label>
                   <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" value={editForm.Model_Number || ''} onChange={e => setEditForm({...editForm, Model_Number: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                   <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" value={editForm.Serial_Number || ''} onChange={e => setEditForm({...editForm, Serial_Number: e.target.value})} />
                 </div>
               </div>

               {/* 🎓 NEW FIELDS ADDED HERE */}
               <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded border border-gray-200">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                   <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" placeholder="e.g. HVAC, IT, Plumbing" value={editForm.Category || ''} onChange={e => setEditForm({...editForm, Category: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Install Date</label>
                   <input type="date" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" value={editForm.InstallDate ? editForm.InstallDate.split('T')[0] : ''} onChange={e => setEditForm({...editForm, InstallDate: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warranty Expires</label>
                   <input type="date" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#355E3B] outline-none" value={editForm.Warranty_Expires ? editForm.Warranty_Expires.split('T')[0] : ''} onChange={e => setEditForm({...editForm, Warranty_Expires: e.target.value})} />
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-100">
                 <button onClick={handleSaveInfo} className="bg-[#355E3B] text-white px-6 py-2.5 rounded font-bold flex items-center gap-2 hover:bg-green-800 transition-all shadow-sm">
                   <Save className="w-4 h-4" /> Save Changes
                 </button>
               </div>
            </div>
          )}
          
          {activeTab === 'MAINTENANCE' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                <div>
                  <h3 className="font-bold text-blue-900 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Scheduler</h3>
                  <p className="text-xs text-blue-700 mt-1">Generate suggested preventative maintenance tasks based on asset info.</p>
                </div>
                <button onClick={handleGenerateSchedule} disabled={isGenerating} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-700 disabled:opacity-50 transition-all">
                  {isGenerating ? 'Analyzing...' : 'Auto-Generate Schedule'}
                </button>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Active Schedules</h3>
                <div className="grid gap-3">
                  {schedules.map(s => (
                    <CollapsibleSchedule key={s.PM_ID} schedule={s} onDelete={() => deleteMaintenanceSchedule(s.PM_ID)} />
                  ))}
                  {schedules.length === 0 && <p className="text-sm text-gray-400 italic">No scheduled maintenance.</p>}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'SOPS' && (
            <div className="space-y-6">
               <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-600" />
                 <div>
                   <h3 className="font-bold text-amber-900">Standard Operating Procedures</h3>
                   <p className="text-xs text-amber-700">Guides linked to this asset will appear here and in the Ticket system.</p>
                 </div>
               </div>
               
               <div className="grid gap-4">
                 {sops.map(sop => <CollapsibleSOP key={sop.SOP_ID} sop={sop} />)}
                 {sops.length === 0 && <p className="text-sm text-gray-400 italic">No SOPs linked.</p>}
               </div>
               
               <div className="mt-8 border-t border-gray-100 pt-6">
                 <h4 className="text-sm font-bold text-gray-700 mb-2">Generate New SOP</h4>
                 <div className="flex gap-2">
                   <input id="newSopTask" placeholder="e.g. Replace Filter" className="flex-1 border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-[#355E3B] outline-none" />
                   <button onClick={() => { const input = document.getElementById('newSopTask') as HTMLInputElement; if(input.value) handleCreateSOP(input.value); }} disabled={isGenerating} className="bg-[#355E3B] text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-800 disabled:opacity-50">
                     {isGenerating ? 'Writing...' : 'Generate Procedure'}
                   </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CollapsibleSOP: React.FC<{ sop: SOP }> = ({ sop }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(sop.Concise_Procedure_Text);
  const handleSave = (e: React.MouseEvent) => { e.stopPropagation(); updateSOP({ ...sop, Concise_Procedure_Text: text }); setIsEditing(false); };
  
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
      <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="font-bold text-gray-900 flex items-center gap-2">{isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}{sop.SOP_Title}</div>
        {isOpen && !isEditing && <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>}
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
          {isEditing ? (
            <div className="space-y-2">
              <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={5} value={text} onChange={e => setText(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Save</button>
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="text-gray-500 text-xs hover:text-gray-700">Cancel</button>
              </div>
            </div>
          ) : (<div className="whitespace-pre-wrap text-gray-700 font-mono leading-relaxed">{sop.Concise_Procedure_Text}</div>)}
        </div>
      )}
    </div>
  );
};

const CollapsibleSchedule: React.FC<{ schedule: MaintenanceSchedule, onDelete: () => void }> = ({ schedule, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isOverdue = new Date(schedule.Next_Due_Date) < new Date();
  
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
      <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
          <div>
            <div className="font-bold text-gray-900">{schedule.Task_Name}</div>
            <div className="text-xs text-gray-500">Next Due: <span className="font-mono">{new Date(schedule.Next_Due_Date).toLocaleDateString()}</span></div>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {isOverdue ? 'Overdue' : 'Active'}
        </span>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm flex justify-between items-center">
          <div className="text-xs text-gray-600">
             <span className="font-bold uppercase">Frequency:</span> {schedule.Frequency}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 text-xs hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3"/> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetManager;