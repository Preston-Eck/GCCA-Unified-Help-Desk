import React, { useState, useEffect, useMemo } from 'react';
import { fetchSchema, getMappings, saveMapping, deleteFieldMapping, addColumnToSheet, APP_FIELDS } from '../services/dataService';
import { FieldMapping } from '../types';
import { Database, ArrowRight, RefreshCw, Trash2, Plus, AlertCircle, Wand2, FileSpreadsheet, LayoutGrid, Lock, AlertTriangle } from 'lucide-react';

// --- SUB-COMPONENT: Single Mapping Row ---
const MappingRow: React.FC<{
  map: FieldMapping;
  allColumns: string[];
  usedColumns: Set<string>;
  usedFields: Set<string>;
  onUpdate: (m: FieldMapping, field: keyof FieldMapping, val: string) => void;
  onDelete: (id: string) => void;
}> = ({ map, allColumns, usedColumns, usedFields, onUpdate, onDelete }) => {
  // Local state for the category filter prevents the "Locked Dropdown" issue
  const [categoryFilter, setCategoryFilter] = useState<string>(map.AppFieldID.split('.')[0]);

  // Calculate available fields for this specific row
  const availableAppFields = useMemo(() => {
    return APP_FIELDS.filter(f => 
      // 1. Match selected category
      (f.id.startsWith(categoryFilter + '.') || categoryFilter === 'All') &&
      // 2. Hide fields used by OTHER rows (but keep the one currently selected in this row)
      (!usedFields.has(f.id) || f.id === map.AppFieldID)
    );
  }, [categoryFilter, usedFields, map.AppFieldID]);

  // Calculate available columns
  const availableColumns = useMemo(() => {
    return allColumns.filter(c => !usedColumns.has(c) || c === map.SheetHeader);
  }, [allColumns, usedColumns, map.SheetHeader]);

  // Categories list
  const categories = useMemo(() => ['All', ...Array.from(new Set(APP_FIELDS.map(f => f.id.split('.')[0])))], []);

  // Safety Check: Is this a critical system field?
  const isCritical = ['ticket.id', 'ticket.comments', 'user.email'].includes(map.AppFieldID);

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm group hover:border-[#355E3B] transition-colors">
      
      {/* 1. Spreadsheet Column */}
      <div className="flex-1">
        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Spreadsheet Column</div>
        <select 
          value={map.SheetHeader}
          onChange={(e) => onUpdate(map, 'SheetHeader', e.target.value)}
          className="w-full border-gray-300 rounded p-1.5 text-sm focus:ring-[#355E3B]"
        >
          {/* Always include current value even if "used" elsewhere to prevent UI glitch */}
          <option value={map.SheetHeader}>{map.SheetHeader}</option>
          {availableColumns.filter(c => c !== map.SheetHeader).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div className="pt-7"><ArrowRight className="w-4 h-4 text-gray-300" /></div>

      {/* 2. App Field Selection */}
      <div className="flex-[2]">
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex justify-between">
            <span>Maps To App Field</span>
            {isCritical && <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> System Critical</span>}
          </div>
          <div className="flex gap-2">
            {/* Category Filter */}
            <select 
              className="w-1/3 border-gray-300 rounded p-1.5 text-xs bg-white text-gray-600 focus:ring-[#355E3B]"
              onChange={(e) => setCategoryFilter(e.target.value)}
              value={categoryFilter}
            >
                {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>

            {/* Field Selector */}
            <select 
              value={map.AppFieldID}
              onChange={(e) => {
                if (isCritical && !confirm("Warning: Changing this critical field mapping may break app functionality. Are you sure?")) return;
                onUpdate(map, 'AppFieldID', e.target.value);
              }}
              className={`flex-1 border-gray-300 rounded p-1.5 text-sm font-medium text-gray-900 focus:ring-[#355E3B] ${isCritical ? 'bg-amber-50' : ''}`}
            >
              {availableAppFields.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
              {/* Fallback for unlisted fields */}
              {!APP_FIELDS.find(f => f.id === map.AppFieldID) && <option value={map.AppFieldID}>{map.AppFieldID} (Unknown)</option>}
            </select>
          </div>
          
          {/* Field Description Helper */}
          <div className="text-[10px] text-gray-400 mt-1 pl-1">
            {APP_FIELDS.find(f => f.id === map.AppFieldID)?.description}
          </div>
      </div>

      {/* Delete Button */}
      <button onClick={() => onDelete(map.MappingID)} className="pt-7 text-gray-400 hover:text-red-500">
        {isCritical ? <Lock className="w-4 h-4 opacity-50" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
};


// --- MAIN COMPONENT ---
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
      if (!s || typeof s !== 'object') throw new Error("Invalid schema.");
      setSchema(s);
      setMappings(getMappings());
      
      const sheetNames = Object.keys(s);
      if (sheetNames.length > 0 && !activeTab) setActiveTab(sheetNames[0]);
    } catch (e: any) {
      setError("Failed to load schema. Ensure backend is deployed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- DERIVED DATA ---
  const currentSheetColumns = schema[activeTab] || [];
  const currentMappings = mappings.filter(m => m.SheetName === activeTab);
  
  // Sets for fast lookup in child components
  const usedColumns = new Set(currentMappings.map(m => m.SheetHeader));
  const usedFields = new Set(mappings.map(m => m.AppFieldID)); 

  // Reports
  const unmappedColumns = currentSheetColumns.filter(col => !usedColumns.has(col));
  const unmappedAppFields = APP_FIELDS.filter(f => !usedFields.has(f.id));

  const handleAddMapping = () => {
    const nextUnusedField = unmappedAppFields[0]?.id || APP_FIELDS[0].id;
    const nextUnusedCol = unmappedColumns[0] || '';

    saveMapping({
      MappingID: '',
      SheetName: activeTab,
      SheetHeader: nextUnusedCol,
      AppFieldID: nextUnusedField,
      Description: ''
    }).then(loadData);
  };

  const handleUpdate = (m: FieldMapping, field: keyof FieldMapping, val: string) => {
    const updated = { ...m, [field]: val };
    saveMapping(updated); 
    setMappings(prev => prev.map(pm => pm.MappingID === m.MappingID ? updated : pm));
  };

  const handleDelete = async (id: string) => {
    if(confirm("Delete this mapping?")) {
      await deleteFieldMapping(id);
      setMappings(prev => prev.filter(m => m.MappingID !== id));
    }
  };

  const handleAutoAddColumn = async (fieldId: string) => {
    const field = APP_FIELDS.find(f => f.id === fieldId);
    if (!field) return;
    const suggestedHeader = field.label.replace(/ /g, '_'); // "Ticket Title" -> "Ticket_Title"
    
    if (confirm(`Create new column "${suggestedHeader}" in sheet "${activeTab}"?`)) {
      setLoading(true);
      const res = await addColumnToSheet(activeTab, suggestedHeader);
      if (res && res.success) {
        await loadData(); 
        await saveMapping({
           MappingID: '',
           SheetName: activeTab,
           SheetHeader: suggestedHeader,
           AppFieldID: fieldId
        });
        await loadData(); 
      } else {
        alert("Failed: " + (res?.message || "Unknown error"));
      }
      setLoading(false);
    }
  };

  const handleSmartMatch = () => {
    let matchCount = 0;
    unmappedColumns.forEach(col => {
      // Normalize header: "Ticket_Title" -> "tickettitle"
      const normCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const match = unmappedAppFields.find(f => {
        const normLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normId = f.id.split('.')[1] || '';
        return normLabel === normCol || normId === normCol || normCol.includes(normId);
      });

      if (match) {
        saveMapping({
          MappingID: '',
          SheetName: activeTab,
          SheetHeader: col,
          AppFieldID: match.id
        });
        matchCount++;
      }
    });

    if (matchCount > 0) {
      loadData();
      alert(`Auto-matched ${matchCount} fields!`);
    } else {
      alert("No obvious matches found.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gray-100 gap-4 p-4 overflow-hidden">
      
      {/* LEFT: Sheets Navigation */}
      <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Sheets
          </h3>
          <button onClick={loadData} className="text-gray-400 hover:text-[#355E3B]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {Object.keys(schema).map(sheet => (
            <button
              key={sheet}
              onClick={() => setActiveTab(sheet)}
              className={`w-full text-left px-4 py-3 text-sm border-l-4 transition-colors ${
                activeTab === sheet 
                  ? 'bg-green-50 border-[#355E3B] text-[#355E3B] font-bold' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {sheet}
              <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                {schema[sheet].length} Columns
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE: Mappings Editor */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Field Mappings: {activeTab}</h2>
            <div className="text-xs text-gray-500">Connect your spreadsheet columns to app logic.</div>
          </div>
          <div className="flex gap-2">
             <button onClick={handleSmartMatch} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-indigo-100">
               <Wand2 className="w-3 h-3" /> Auto-Match
             </button>
             <button onClick={handleAddMapping} className="bg-[#355E3B] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-800">
               <Plus className="w-3 h-3" /> Add Map
             </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {currentMappings.length === 0 ? (
            <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400 text-sm">No mappings defined for this sheet.</p>
              <button onClick={handleSmartMatch} className="mt-2 text-[#355E3B] text-xs font-bold hover:underline">Run Auto-Match</button>
            </div>
          ) : (
            currentMappings.map(map => (
              <MappingRow 
                key={map.MappingID}
                map={map}
                allColumns={currentSheetColumns}
                usedColumns={usedColumns}
                usedFields={usedFields}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Reports & Analysis */}
      <div className="w-72 flex flex-col gap-4">
        
        {/* Unmapped App Fields Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
           <div className="p-3 bg-red-50 border-b border-red-100 flex justify-between items-center">
             <h3 className="text-xs font-bold text-red-800 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> Unmapped App Fields
             </h3>
             <span className="bg-red-200 text-red-800 text-[10px] px-1.5 rounded-full">{unmappedAppFields.length}</span>
           </div>
           <div className="overflow-y-auto p-2 flex-1">
             {unmappedAppFields.length === 0 ? (
               <div className="text-center text-xs text-green-600 p-4">All fields mapped! 🎉</div>
             ) : (
               unmappedAppFields.map(f => (
                 <div key={f.id} className="p-2 mb-2 bg-white border border-gray-100 rounded hover:border-gray-300 transition-colors group">
                    <div className="font-bold text-xs text-gray-700">{f.label}</div>
                    <div className="text-[10px] text-gray-400">{f.description}</div>
                    <button 
                      onClick={() => handleAutoAddColumn(f.id)}
                      className="mt-2 w-full text-[10px] bg-gray-50 hover:bg-[#355E3B] hover:text-white border border-gray-200 rounded py-1 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Create Column
                    </button>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Unmapped Columns Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-1/3 flex flex-col">
           <div className="p-3 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
             <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1">
               <LayoutGrid className="w-3 h-3" /> Unused Columns
             </h3>
             <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 rounded-full">{unmappedColumns.length}</span>
           </div>
           <div className="overflow-y-auto p-2 flex-1">
              <div className="flex flex-wrap gap-1">
                {unmappedColumns.length === 0 ? <span className="text-[10px] text-gray-400 p-2">None</span> : unmappedColumns.map(c => (
                  <span key={c} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                    {c}
                  </span>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MappingDashboard;