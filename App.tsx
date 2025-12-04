
import React, { useState } from 'react';
import { USERS_DB, validateUser } from './services/dataService';
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import { AccessDenied } from './components/AccessDenied';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';

export default function App() {
  // Simulating the "Authenticated User" from Session.getActiveUser()
  // Defaulting to the first user in the DB for demo purposes
  const [currentUserEmail, setCurrentUserEmail] = useState(USERS_DB[0].Email);
  const [currentView, setCurrentView] = useState<'form' | 'dashboard'>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = validateUser(currentUserEmail);

  if (!currentUser) {
    return <AccessDenied />;
  }

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Navbar */}
      <nav className="bg-[#355E3B] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center text-[#355E3B] font-bold">
                HD
              </div>
              <span className="font-bold text-lg tracking-wide">Unified Help Desk</span>
            </div>
            
            {/* User Simulation Switcher (For Demo Only) */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs text-green-200">Simulate Identity:</span>
              <select 
                value={currentUserEmail}
                onChange={(e) => {
                  setCurrentUserEmail(e.target.value);
                  handleRefresh();
                }}
                className="bg-[#2a4b2f] border border-green-800 text-sm rounded px-2 py-1 text-white focus:outline-none"
              >
                {USERS_DB.map(u => (
                  <option key={u.UserID} value={u.Email}>
                    {u.Name} ({u.User_Type})
                  </option>
                ))}
                <option value="invalid@gcca.edu">Unauthorized User</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
              currentView === 'dashboard'
                ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button
            onClick={() => setCurrentView('form')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
              currentView === 'form'
                ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in duration-300">
          {currentView === 'form' ? (
            <TicketForm 
              userEmail={currentUser.Email} 
              onSuccess={() => {
                handleRefresh();
                setCurrentView('dashboard');
              }}
            />
          ) : (
            <TicketDashboard 
              user={currentUser} 
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
            />
          )}
        </div>

      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Grove City Christian Academy. Internal Use Only.</p>
        </div>
      </footer>
    </div>
  );
}
