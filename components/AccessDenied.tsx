import React, { useState } from 'react';
import { Lock, UserPlus, LogOut } from 'lucide-react';
import { getAppConfig } from '../services/dataService';
import AccountRequest from './AccountRequest';

interface Props {
  userEmail?: string;
}

const AccessDenied: React.FC<Props> = ({ userEmail }) => {
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
        <p className="text-gray-600 mb-2">
          {config.unauthorizedMessage}
        </p>

        {userEmail && (
          <div className="mb-6 bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-500">
            You are logged in as:<br/>
            <span className="font-mono text-gray-800 font-bold text-sm">{userEmail}</span>
          </div>
        )}
        
        <button 
          onClick={() => setShowRequest(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#FFD700] text-gray-900 font-bold py-2 rounded mb-4 hover:bg-yellow-400 transition-colors"
        >
          <UserPlus className="w-5 h-5" /> Request Access
        </button>

        {/* SIGN OUT LINK */}
        <div className="border-t border-gray-100 pt-4 mt-4">
             <p className="text-xs text-gray-500 mb-2">Wrong account?</p>
             <a 
               href="https://accounts.google.com/Logout" 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:underline font-medium"
             >
               <LogOut className="w-4 h-4" /> Sign Out of Google
             </a>
        </div>

        <div className="mt-6 text-xs text-gray-300">
          System: {config.appName}
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;