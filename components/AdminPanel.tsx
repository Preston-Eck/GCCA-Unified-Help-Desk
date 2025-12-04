
import React, { useState } from 'react';
import { getAppConfig, updateAppConfig } from '../services/dataService';
import { Save, AlertTriangle } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

const AdminPanel: React.FC<Props> = ({ onSuccess }) => {
  const [config, setConfig] = useState(getAppConfig());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateAppConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // Trigger global refresh if needed via callback
    if(onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-[#355E3B] border-b-4 border-[#FFD700] pb-1 inline-block">
          Admin Settings
        </h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Site Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
            <input 
              type="text" 
              value={config.appName}
              onChange={(e) => setConfig({...config, appName: e.target.value})}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unauthorized / Access Denied Message</label>
            <textarea 
              rows={3}
              value={config.unauthorizedMessage}
              onChange={(e) => setConfig({...config, unauthorizedMessage: e.target.value})}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
            />
            <p className="text-xs text-gray-500 mt-1">Displayed to users not found in the Users sheet.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Contact Email</label>
            <input 
              type="text" 
              value={config.supportContact}
              onChange={(e) => setConfig({...config, supportContact: e.target.value})}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
            />
          </div>
          
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Banner (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., System Maintenance on Friday"
              value={config.announcementBanner}
              onChange={(e) => setConfig({...config, announcementBanner: e.target.value})}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#355E3B] text-white px-4 py-2 rounded shadow hover:bg-green-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          
          {isSaved && (
            <span className="text-green-600 font-medium animate-pulse">
              Settings Saved Successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
