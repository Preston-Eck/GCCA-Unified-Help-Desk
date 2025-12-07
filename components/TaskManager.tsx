import React, { useState } from 'react';
import { Task } from '../types';
import { getTasks, saveTask } from '../services/dataService';
import { CheckSquare, Plus, Save } from 'lucide-react';

const TaskManager = ({ ticketId }: { ticketId: string }) => {
  const [tasks, setTasks] = useState<Task[]>(getTasks(ticketId));
  const [editing, setEditing] = useState<Partial<Task> | null>(null);

  const handleSave = () => {
    if(editing && editing.Task_Name) {
      saveTask({ ...editing, TicketID_Ref: ticketId } as Task);
      setEditing(null);
      setTasks(getTasks(ticketId)); // Reload
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><CheckSquare className="w-4 h-4"/> Tasks & Work Orders</h3>
      <div className="space-y-2">
        {tasks.map(t => (
           <div key={t.TaskID} className="bg-white p-2 rounded shadow-sm border flex justify-between">
             <span>{t.Task_Name}</span>
             <span className="text-xs bg-gray-100 px-2 rounded">{t.Task_Status}</span>
           </div>
        ))}
      </div>
      {editing ? (
        <div className="mt-3 flex gap-2">
           <input className="border p-1 rounded flex-1" placeholder="New Task Name" value={editing.Task_Name || ''} onChange={e => setEditing({...editing, Task_Name: e.target.value})} />
           <button onClick={handleSave} className="bg-green-600 text-white px-3 rounded"><Save className="w-4 h-4"/></button>
        </div>
      ) : (
        <button onClick={() => setEditing({})} className="mt-3 text-xs text-blue-600 flex items-center gap-1 hover:underline">
          <Plus className="w-3 h-3"/> Add Task
        </button>
      )}
    </div>
  );
};
export default TaskManager;