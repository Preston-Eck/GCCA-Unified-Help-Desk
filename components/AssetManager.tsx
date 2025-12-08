import React, { useState, useEffect } from 'react';
import { 
  getCampuses, getBuildings, getLocations, getAssets,
  addBuilding, addLocation, addAsset,
  updateBuilding, updateLocation, updateAsset,
  deleteBuilding, deleteLocation, deleteAsset
} from '../services/dataService';
import { Campus, Building, Location, Asset } from '../types';
import { Building as BuildingIcon, MapPin, Box, Plus, Edit, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';

const AssetManager: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedCampus, setExpandedCampus] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // FIXED: Added await to all calls to prevent ".map is not a function" errors
      const [c, b, l, a] = await Promise.all([
        getCampuses(),
        getBuildings(),
        getLocations(),
        getAssets()
      ]);
      setCampuses(c);
      setBuildings(b);
      setLocations(l);
      setAssets(a);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuilding = async (campusId: string) => {
    const name = prompt('Enter Building Name:');
    if (!name) return;
    // FIXED: Correct argument usage
    const newB = await addBuilding({ campusId, name, type: 'General' });
    setBuildings([...buildings, newB]);
  };

  const handleAddLocation = async (buildingId: string) => {
    const name = prompt('Enter Room/Location Name:');
    if (!name) return;
    const newL = await addLocation({ buildingId, name, type: 'Room' });
    setLocations([...locations, newL]);
  };

  const handleAddAsset = async (locationId: string) => {
    const name = prompt('Enter Asset Name:');
    if (!name) return;
    const newA = await addAsset({ locationId, name, type: 'Equipment', status: 'Active' });
    setAssets([...assets, newA]);
  };

  const handleDelete = async (type: 'building' | 'location' | 'asset', id: string) => {
    if(!window.confirm('Are you sure?')) return;
    
    if (type === 'building') {
      await deleteBuilding(id);
      setBuildings(buildings.filter(b => b.id !== id));
    } else if (type === 'location') {
      await deleteLocation(id);
      setLocations(locations.filter(l => l.id !== id));
    } else {
      await deleteAsset(id);
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Asset Data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Asset Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {campuses.map(campus => (
          <div key={campus.id} className="border-b border-slate-100 last:border-0">
            <div 
              className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100"
              onClick={() => setExpandedCampus(expandedCampus === campus.id ? null : campus.id)}
            >
              <div className="flex items-center gap-3">
                {expandedCampus === campus.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-900">{campus.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddBuilding(campus.id); }}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {expandedCampus === campus.id && (
              <div className="pl-8 pr-4 py-2 space-y-2">
                {buildings.filter(b => b.campusId === campus.id).map(building => (
                  <div key={building.id} className="border border-slate-200 rounded-lg bg-white mb-2">
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedBuilding(expandedBuilding === building.id ? null : building.id)}
                    >
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">{building.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete('building', building.id); }}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddLocation(building.id); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {expandedBuilding === building.id && (
                      <div className="pl-6 pr-3 py-2 border-t border-slate-100 bg-slate-50/50">
                        {locations.filter(l => l.buildingId === building.id).map(location => (
                          <div key={location.id} className="mb-2 last:mb-0">
                            <div 
                              className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-200/50 cursor-pointer"
                              onClick={() => setExpandedLocation(expandedLocation === location.id ? null : location.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Box className="w-3 h-3 text-slate-400" />
                                <span className="text-sm text-slate-700">{location.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                   onClick={(e) => { e.stopPropagation(); handleDelete('location', location.id); }}
                                   className="text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <button 
                                   onClick={(e) => { e.stopPropagation(); handleAddAsset(location.id); }}
                                   className="text-blue-600 hover:text-blue-800"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {expandedLocation === location.id && (
                              <div className="pl-6 py-1 space-y-1">
                                {assets.filter(a => a.locationId === location.id).map(asset => (
                                  <div key={asset.id} className="flex items-center justify-between text-xs text-slate-600 bg-white border border-slate-100 p-2 rounded">
                                    <span>{asset.name}</span>
                                    <button onClick={() => handleDelete('asset', asset.id)}>
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                ))}
                                {assets.filter(a => a.locationId === location.id).length === 0 && (
                                  <div className="text-xs text-slate-400 italic pl-2">No assets</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetManager;