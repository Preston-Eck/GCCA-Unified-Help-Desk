import React, { useState } from 'react';
import { getInventory, saveMaterial } from '../services/dataService';
import { Material } from '../types';
import { Package, Plus, Search, AlertCircle } from 'lucide-react';

const InventoryManager = () => {
  const [items, setItems] = useState<Material[]>(getInventory());
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Material> | null>(null);

  const filtered = items.filter(i => i.Material_Name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if(editing && editing.Material_Name) {
       saveMaterial(editing as Material);
       setItems(getInventory()); // Reload
       setEditing(null);
    }
  };

  return (
    <div className="bg-white rounded shadow h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2"><Package className="w-5 h-5"/> Inventory</h2>
        <button onClick={() => setEditing({})} className="bg-green-600 text-white px-3 py-1 rounded flex gap-1 items-center"><Plus className="w-4 h-4"/> New Item</button>
      </div>
      
      <div className="p-4">
        <div className="relative mb-4">
          <input className="w-full border p-2 pl-8 rounded" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
          <Search className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
        </div>

        <div className="overflow-auto h-[500px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 font-bold">
               <tr>
                 <th className="p-3">Item Name</th>
                 <th className="p-3">Category</th>
                 <th className="p-3">In Stock</th>
                 <th className="p-3">Reorder Point</th>
               </tr>
            </thead>
            <tbody>
               {filtered.map(item => (
                 <tr key={item.MaterialID} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setEditing(item)}>
                   <td className="p-3 font-medium">{item.Material_Name}</td>
                   <td className="p-3 text-gray-500">{item.Category}</td>
                   <td className={`p-3 font-bold ${item.Quantity_on_Hand <= item.Reorder_Point ? 'text-red-600' : 'text-green-600'}`}>
                     {item.Quantity_on_Hand} {item.Purchase_Unit_Name}
                   </td>
                   <td className="p-3 text-gray-400">{item.Reorder_Point}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Edit Modal (Simplified) */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
             <h3 className="font-bold mb-4">{editing.MaterialID ? 'Edit Item' : 'New Material'}</h3>
             <input className="w-full border p-2 mb-2 rounded" placeholder="Name" value={editing.Material_Name || ''} onChange={e => setEditing({...editing, Material_Name: e.target.value})} />
             <input className="w-full border p-2 mb-2 rounded" placeholder="Category" value={editing.Category || ''} onChange={e => setEditing({...editing, Category: e.target.value})} />
             <div className="flex gap-2 mb-4">
               <input type="number" className="w-1/2 border p-2 rounded" placeholder="Qty" value={editing.Quantity_on_Hand || 0} onChange={e => setEditing({...editing, Quantity_on_Hand: parseInt(e.target.value)})} />
               <input type="number" className="w-1/2 border p-2 rounded" placeholder="Reorder Pt" value={editing.Reorder_Point || 0} onChange={e => setEditing({...editing, Reorder_Point: parseInt(e.target.value)})} />
             </div>
             <button onClick={handleSave} className="w-full bg-green-600 text-white p-2 rounded">Save</button>
             <button onClick={() => setEditing(null)} className="w-full text-gray-500 mt-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;