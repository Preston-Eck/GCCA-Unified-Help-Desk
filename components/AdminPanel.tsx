import React, { useState } from 'react';
import { SiteConfig } from '../types';
import { getAppConfig, updateAppConfig } from '../services/dataService';
import { Save, Settings, Database, CheckCircle } from 'lucide-react';
import MappingDashboard from './MappingDashboard'; // <--- Import the new component

interface Props {
  onSuccess?: () => void;
}

const AdminPanel: React.FC<Props> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MAPPING'>('GENERAL');
  const [config, setConfig] = useState<SiteConfig>(getAppConfig());
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateAppConfig(config);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#355E3B]">Admin Settings</h2>
          <p className="text-sm text-gray-500">System configuration and data mapping</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'GENERAL' 
                ? 'bg-[#355E3B] text-white' 
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" /> General
          </button>
          <button
            onClick={() => setActiveTab('MAPPING')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'MAPPING' 
                ? 'bg-[#355E3B] text-white' 
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4" /> Data Mapping
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'GENERAL' ? (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" /> Site Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unauthorized Message</label>
                <textarea
                  rows={3}
                  value={config.unauthorizedMessage}
                  onChange={(e) => setConfig({ ...config, unauthorizedMessage: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed to users not found in the Users sheet.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Contact Email</label>
                <input
                  type="text"
                  value={config.supportContact}
                  onChange={(e) => setConfig({ ...config, supportContact: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Banner (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., System Maintenance on Friday"
                  value={config.announcementBanner}
                  onChange={(e) => setConfig({ ...config, announcementBanner: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#355E3B]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#355E3B] text-white px-4 py-2 rounded shadow hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {showSuccess && (
                <span className="text-green-600 font-medium flex items-center gap-1 animate-pulse">
                  <CheckCircle className="w-4 h-4" /> Settings Saved!
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Render the Mapping Dashboard Component */
          <MappingDashboard />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;