import React, { useState } from 'react';
import { Campus } from '../types';
import { getCampuses, saveCampus, deleteCampus } from '../services/dataService';
import { Map, Phone, MapPin, Plus, Save, Trash2, X } from 'lucide-react';

interface Props {
  user: any; // Passed for permission checks if needed later
}

const CampusManager: React.FC<Props> = () => {
  const [campuses, setCampuses] = useState<Campus[]>(getCampuses());
  const [editing, setEditing] = useState<Partial<Campus> | null>(null);

  const handleRefresh = () => setCampuses([...getCampuses()]);

  const handleSave = async () => {
    if (editing && editing.Campus_Name) {
      await saveCampus(editing as Campus);
      setEditing(null);
      handleRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this campus? This may break links to buildings.")) {
      await deleteCampus(id);
      handleRefresh();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-[#355E3B] flex items-center gap-2">
            <Map className="w-6 h-6" /> Campus Management
          </h2>
          <p className="text-xs text-gray-500">Manage campus locations, maps, and contact info.</p>
        </div>
        <button 
          onClick={() => setEditing({ CampusID: '', Campus_Name: '' })}
          className="bg-[#355E3B] text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:bg-green-800"
        >
          <Plus className="w-4 h-4" /> Add Campus
        </button>
      </div>

      <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campuses.map(campus => (
          <div key={campus.CampusID} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 relative group">
            <h3 className="font-bold text-lg text-gray-800 mb-2">{campus.Campus_Name}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{campus.Address || 'No address set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{campus.PhoneNumber || 'No phone set'}</span>
              </div>
              {campus.MapURL && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Map className="w-4 h-4" />
                  <a href={campus.MapURL} target="_blank" rel="noreferrer" className="hover:underline">View Map</a>
                </div>
              )}
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={() => setEditing(campus)} className="p-1.5 bg-white border rounded shadow hover:text-blue-600">
                <MapPin className="w-4 h-4" /> {/* Edit Icon placeholder */}
              </button>
              <button onClick={() => handleDelete(campus.CampusID)} className="p-1.5 bg-white border rounded shadow hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#355E3B] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">{editing.CampusID ? 'Edit Campus' : 'New Campus'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campus Name</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={editing.Campus_Name} 
                  onChange={e => setEditing({...editing, Campus_Name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={editing.Address || ''} 
                  onChange={e => setEditing({...editing, Address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={editing.PhoneNumber || ''} 
                  onChange={e => setEditing({...editing, PhoneNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Map URL (Drive Link)</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={editing.MapURL || ''} 
                  onChange={e => setEditing({...editing, MapURL: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-[#355E3B] text-white py-2 rounded font-bold hover:bg-green-800 flex justify-center items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Campus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusManager;