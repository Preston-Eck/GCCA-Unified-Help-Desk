
import React, { useState } from 'react';
import { Lock, UserPlus } from 'lucide-react';
import { getAppConfig } from '../services/dataService';
import AccountRequest from './AccountRequest';

export const AccessDenied: React.FC = () => {
  const config = getAppConfig();
  const [showRequest, setShowRequest] = useState(false);

  if (showRequest) {
    return <AccountRequest onBack={() => setShowRequest(false)} />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-t-8 border-[#355E3B]">
        <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#355E3B] mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {config.unauthorizedMessage}
        </p>
        
        <button 
          onClick={() => setShowRequest(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#FFD700] text-gray-900 font-bold py-2 rounded mb-6 hover:bg-yellow-400"
        >
          <UserPlus className="w-5 h-5" /> Request Access
        </button>

        <div className="text-sm text-gray-400">
          Contact: {config.supportContact}
        </div>
        <div className="text-xs text-gray-300 mt-4">
          System: {config.appName}
        </div>
      </div>
    </div>
  );
};
