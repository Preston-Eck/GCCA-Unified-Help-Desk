import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getDatabaseData, getSessionUserEmail } from './services/api'; // Ensure this matches your imports
import { Loader2, ShieldAlert, Users } from 'lucide-react';

// Components
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import AssetManager from './components/AssetManager';
import AdminPanel from './components/AdminPanel';
import AccessDenied from './components/AccessDenied';

// --- CONFIG ---
const SUPER_ADMIN_EMAIL = 'preston@grovecitychristianacademy.com';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [realUserEmail, setRealUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // 1. INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      try {
        // A. Get Data & ID in parallel
        const [dbData, email] = await Promise.all([
          getDatabaseData(),
          getSessionUserEmail()
        ]);

        if (!email) throw new Error("Could not verify identity.");
        
        setRealUserEmail(email);
        
        // B. Find User in DB
        const users = dbData.Users || [];
        setAllUsers(users);
        
        const foundUser = users.find((u: User) => u.Email.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
          setCurrentUser(foundUser);
        } else {
          // OPTIONAL: Auto-create basic account if needed, or leave null for Access Denied
          console.warn("User not found in DB:", email);
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. SUPER ADMIN MASQUERADE FUNCTION
  const handleRoleSwitch = (targetEmail: string) => {
    const targetUser = allUsers.find(u => u.Email === targetEmail);
    if (targetUser) setCurrentUser(targetUser);
  };

  // 3. RENDER LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#355E3B] mx-auto mb-4" />
          <p className="text-gray-500">Verifying Identity...</p>
        </div>
      </div>
    );
  }

  // 4. RENDER ACCESS DENIED
  if (!currentUser) {
    return <AccessDenied userEmail={realUserEmail} />;
  }

  // 5. RENDER MAIN APP
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-[#355E3B] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">GCCA Facilities</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* SUPER ADMIN DROPDOWN */}
            {realUserEmail === SUPER_ADMIN_EMAIL && (
              <div className="bg-yellow-500/20 p-1 rounded border border-yellow-500/50 flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-200" />
                <select 
                  className="bg-transparent text-xs text-white font-mono focus:outline-none"
                  value={currentUser.Email}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                >
                  <option className="text-black" value={realUserEmail}>Viewing as: Myself</option>
                  <optgroup className="text-black" label="Switch View">
                    {allUsers.map(u => (
                      <option key={u.UserID} value={u.Email}>
                        {u.Name} ({u.User_Type})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{currentUser.Name}</div>
              <div className="text-xs text-gray-300 opacity-80">{currentUser.User_Type}</div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        {/* Navigation Tabs (Simplified for brevity) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
           <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'dashboard' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50'}`}>Dashboard</button>
           <button onClick={() => setView('new_ticket')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'new_ticket' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50'}`}>New Ticket</button>
           {/* Add other role-based tabs here */}
        </div>

        {/* View Routing */}
        <div className="animate-in fade-in duration-300">
          {view === 'dashboard' && <TicketDashboard currentUser={currentUser} />}
          {view === 'new_ticket' && <TicketForm userEmail={currentUser.Email} onSuccess={() => setView('dashboard')} />}
          {/* Add other views here */}
        </div>
      </main>
    </div>
  );
}