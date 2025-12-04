
import React, { useState, useEffect } from 'react';
import { User, Campus, Building, Location, Asset } from '../types';
import { 
  getCampuses, getBuildings, getLocations, getAssets,
  addBuilding, addLocation, addAsset, deleteBuilding, deleteLocation, deleteAsset
} from '../services/dataService';
import { Trash2, Plus, RefreshCw, MapPin, Box, Home } from 'lucide-react';

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

  // Data State
  const campuses = getCampuses();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Refresh Trigger
  const refresh = () => setRefreshKey(prev => prev + 1);

  // Cascading Fetch
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-[#355E3B]">Asset Management</h2>
        <div className="text-sm text-gray-500">Manage infrastructure data</div>
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
              disabled={activeTab === 'BUILDINGS' && !selectedCampus} // Always enabled if filtering down
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
              disabled={activeTab !== 'ASSETS'} // Only needed for Assets
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
                <li key={a.AssetID} className="p-3 flex justify-between items-center hover:bg-white">
                  <span>{a.Asset_Name}</span>
                  <button onClick={() => handleDelete(a.AssetID)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
