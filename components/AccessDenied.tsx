
import React from 'react';
import { Lock } from 'lucide-react';

export const AccessDenied: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-t-8 border-[#355E3B]">
      <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-[#355E3B] mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6">
        Your email address was not found in the <strong>Users</strong> database. 
        Please contact the IT Chair or Administration to request access.
      </p>
      <div className="text-sm text-gray-400">
        System: GCCA Unified Help Desk
      </div>
    </div>
  </div>
);
