import React, { useState, useEffect } from 'react';
import { fetchSchema, getMappings, saveFieldMapping, deleteFieldMapping, APP_FIELDS } from '../services/dataService';
import { FieldMapping } from '../types';
import { Database, ArrowRight, Save, RefreshCw, Trash2, Plus, AlertCircle } from 'lucide-react';

const MappingDashboard: React.FC = () => {
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const s = await fetchSchema();
      // Verify response
      if (!s || typeof s !== 'object') {
        throw new Error("Invalid schema received from server.");
      }
      setSchema(s);
      setMappings(getMappings());
      
      const sheetNames = Object.keys(s);
      if (sheetNames.length > 0 && !activeTab) {
        setActiveTab(sheetNames[0]);
      }
    } catch (e: any) {
      console.error("Mapping Load Error:", e);
      setError("Failed to load schema. Ensure backend deployment is updated.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMapping = () => {
    const newMap: FieldMapping = {
      MappingID: '',
      SheetName: activeTab,
      SheetHeader: schema[activeTab]?.[0] || '',
      AppFieldID: APP_FIELDS[0].id,
      Description: ''
    };
    saveFieldMapping(newMap).then(() => loadData());
  };

  const handleUpdate = (m: FieldMapping, field: keyof FieldMapping, val: string) => {
    const updated = { ...m, [field]: val };
    saveFieldMapping(updated); 
    setMappings(prev => prev.map(pm => pm.MappingID === m.MappingID ? updated : pm));
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#355E3B] flex items-center gap-2">
            <Database className="w-6 h-6" /> Data Mapping Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Map spreadsheet columns to application fields.
          </p>
        </div>
        <button onClick={loadData} className="text-gray-500 hover:text-[#355E3B] p-2 rounded-full hover:bg-gray-100">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p>{error}</p>
          <button onClick={loadData} className="text-xs underline hover:text-red-700">Try Again</button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Sheets */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 text-xs font-bold text-gray-400 uppercase">Available Sheets</div>
            {Object.keys(schema).length === 0 && !loading && (
              <p className="p-4 text-xs text-gray-400 italic">No sheets found.</p>
            )}
            {Object.keys(schema).map(sheetName => (
              <button
                key={sheetName}
                onClick={() => setActiveTab(sheetName)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-all ${
                  activeTab === sheetName 
                    ? 'bg-white border-[#355E3B] text-[#355E3B] shadow-sm' 
                    : 'border-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {sheetName}
                <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                  {schema[sheetName].length} Columns
                </span>
              </button>
            ))}
          </div>

          {/* Content: Mappings */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Mappings for: {activeTab}</h3>
              <button 
                onClick={handleAddMapping}
                className="bg-[#355E3B] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-800"
              >
                <Plus className="w-4 h-4" /> Add Mapping
              </button>
            </div>

            <div className="space-y-4">
              {mappings.filter(m => m.SheetName === activeTab).length === 0 && (
                <div className="text-center p-10 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                  No mappings defined for this sheet yet.
                </div>
              )}

              {mappings.filter(m => m.SheetName === activeTab).map(map => (
                <div key={map.MappingID || Math.random()} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  
                  {/* Source: Sheet Column */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sheet Column</label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#355E3B]"
                      value={map.SheetHeader}
                      onChange={(e) => handleUpdate(map, 'SheetHeader', e.target.value)}
                    >
                      {schema[activeTab]?.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-300 mt-5" />

                  {/* Target: App Field */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Maps To App Field</label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#355E3B]"
                      value={map.AppFieldID}
                      onChange={(e) => handleUpdate(map, 'AppFieldID', e.target.value)}
                    >
                      {APP_FIELDS.map(f => (
                        <option key={f.id} value={f.id}>{f.label} ({f.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="flex-1">
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description (Optional)</label>
                     <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        value={map.Description || ''}
                        onChange={(e) => handleUpdate(map, 'Description', e.target.value)}
                        placeholder="e.g. Primary Key"
                     />
                  </div>

                  {/* Actions */}
                  <div className="mt-5">
                    <button 
                      onClick={() => deleteFieldMapping(map.MappingID)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingDashboard;