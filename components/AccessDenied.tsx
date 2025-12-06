import React, { useState } from 'react';
import { Lock, UserPlus } from 'lucide-react';
import { getAppConfig } from '../services/dataService';
import AccountRequest from './AccountRequest';

// 1. Define Props (so it doesn't crash when App.tsx passes the email)
interface Props {
  userEmail?: string;
}

const AccessDenied: React.FC<Props> = ({ userEmail }) => {
  const config = getAppConfig();
  const [showRequest, setShowRequest] = useState(false);

  if (showRequest) {
    // If you have an AccountRequest component, ensure it handles the onBack prop
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

        {/* Display the email for clarity */}
        {userEmail && (
          <div className="mb-6 bg-gray-50 p-2 rounded border border-gray-200 text-xs text-gray-500">
            Logged in as: <span className="font-mono text-gray-700 font-bold">{userEmail}</span>
          </div>
        )}
        
        <button 
          onClick={() => setShowRequest(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#FFD700] text-gray-900 font-bold py-2 rounded mb-6 hover:bg-yellow-400 transition-colors"
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

// 2. THIS IS THE CRITICAL FIX (Default Export)
export default AccessDenied;
<div className="mt-4 pt-4 border-t border-gray-100">
  <p className="text-xs text-gray-500 mb-2">Wrong account?</p>
  <a 
    href="https://accounts.google.com/Logout" 
    target="_blank" 
    rel="noreferrer"
    className="text-sm text-blue-600 hover:underline"
  >
    Sign out of Google
  </a>
</div>