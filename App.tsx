import React, { useState } from 'react';
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import { MOCK_USERS } from './services/ticketService';
import { UserConfig } from './types';
import { ShieldCheck, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function App() {
  // Simulating Session.getActiveUser()
  const [currentUser, setCurrentUser] = useState<UserConfig>(MOCK_USERS[0]);
  const [view, setView] = useState<'form' | 'dashboard'>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-hunter-green text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-gcca-gold" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">GCCA Unified Help Desk</h1>
              <p className="text-xs text-gray-300">IT & Facilities</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Simulation Controls - Would not exist in production */}
            <div className="hidden md:flex items-center gap-2 bg-[#2a4b2f] p-1 rounded-lg">
              <span className="text-xs text-gray-300 px-2">Simulate User:</span>
              <select 
                className="bg-transparent text-sm text-white font-medium focus:outline-none border-none cursor-pointer"
                value={currentUser.email}
                onChange={(e) => {
                  const user = MOCK_USERS.find(u => u.email === e.target.value);
                  if (user) setCurrentUser(user);
                  refreshData();
                }}
              >
                {MOCK_USERS.map(u => (
                  <option key={u.email} value={u.email} className="text-black">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              view === 'dashboard' 
                ? 'bg-hunter-green text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            My Dashboard
          </button>
          
          <button
            onClick={() => setView('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              view === 'form' 
                ? 'bg-hunter-green text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        {/* Dynamic View */}
        <div className="animate-in fade-in duration-300">
          {view === 'form' ? (
            <TicketForm 
              userEmail={currentUser.email} 
              onSuccess={() => {
                refreshData();
                setView('dashboard');
              }} 
            />
          ) : (
            <TicketDashboard 
              currentUser={currentUser} 
              refreshTrigger={refreshTrigger}
              onRefresh={refreshData}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Grove City Christian Academy. Internal Use Only.
        </div>
      </footer>
    </div>
  );
}
