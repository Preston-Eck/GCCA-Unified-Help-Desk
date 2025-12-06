import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getDatabaseData, getSessionUserEmail } from './services/api';
import { Loader2, Users, Shield, Database, Briefcase, Settings, FileText, Calendar } from 'lucide-react';

// Components
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import AssetManager from './components/AssetManager';
import AdminPanel from './components/AdminPanel';
import AccessDenied from './components/AccessDenied';
import VendorPortal from './components/VendorPortal';
import OperationsDashboard from './components/OperationsDashboard';
import RoleManager from './components/RoleManager';
import UserManager from './components/UserManager';
import VendorManager from './components/VendorManager';

// --- CONFIG ---
const SUPER_ADMIN_EMAIL = 'preston@grovecitychristianacademy.com';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [realUserEmail, setRealUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // 1. INITIAL LOAD & AUTH
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get Email First
        const email = await getSessionUserEmail();
        if (!email) throw new Error("No email detected.");
        setRealUserEmail(email);

        // 2. Initialize Database (Populate the Brain)
        await initDatabase();
        
        // 3. Get Users from the Brain (now populated correctly)
        const users = getUsers(); 
        setAllUsers(users);

        // 4. Find You
        console.log("Checking access for:", email);
        const foundUser = users.find((u: User) => u.Email.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
          setCurrentUser(foundUser);
        } else {
          console.warn("User match failed. DB Emails:", users.map(u => u.Email));
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshKey]);

  // 2. SUPER ADMIN MASQUERADE FUNCTION
  const handleRoleSwitch = (targetEmail: string) => {
    if (targetEmail === 'REAL_USER') {
       // Reset to self
       const me = allUsers.find(u => u.Email.toLowerCase() === realUserEmail.toLowerCase());
       if (me) setCurrentUser(me);
    } else {
       // Switch to other
       const targetUser = allUsers.find(u => u.Email === targetEmail);
       if (targetUser) setCurrentUser(targetUser);
    }
  };

  // Helper for Permissions
  const hasPermission = (permFragment: string) => {
    if (!currentUser) return false;
    return currentUser.User_Type.includes('Admin') || 
           currentUser.User_Type.includes('Chair') || 
           currentUser.User_Type.includes(permFragment);
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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-[#355E3B] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center text-gray-900 font-bold">HD</div>
            <h1 className="text-xl font-bold hidden sm:block">GCCA Facilities</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* SUPER ADMIN DROPDOWN */}
            {realUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <div className="bg-yellow-500/20 p-1 rounded border border-yellow-500/50 flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-200" />
                <select 
                  className="bg-transparent text-xs text-white font-mono focus:outline-none max-w-[120px] sm:max-w-none"
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
        
        {/* NAVIGATION TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
           <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'dashboard' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
             Dashboard
           </button>
           
           {hasPermission('SUBMIT') && (
             <button onClick={() => setView('form')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'form' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               New Ticket
             </button>
           )}

           {hasPermission('ASSETS') && (
             <button onClick={() => setView('assets')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'assets' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Database className="w-4 h-4" /> Assets
             </button>
           )}

           {(hasPermission('SOPS') || hasPermission('SCHEDULES')) && (
             <button onClick={() => setView('operations')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'operations' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Calendar className="w-4 h-4" /> Operations
             </button>
           )}

           {hasPermission('USERS') && (
             <button onClick={() => setView('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'users' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Users className="w-4 h-4" /> Users
             </button>
           )}

           {hasPermission('VENDORS') && (
             <button onClick={() => setView('vendors')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'vendors' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Briefcase className="w-4 h-4" /> Vendors
             </button>
           )}

           {hasPermission('ROLES') && (
             <button onClick={() => setView('roles')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'roles' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Shield className="w-4 h-4" /> Roles
             </button>
           )}

           {hasPermission('SETTINGS') && (
             <button onClick={() => setView('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'admin' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Settings className="w-4 h-4" /> Settings
             </button>
           )}
        </div>

        {/* VIEW ROUTING */}
        <div className="animate-in fade-in duration-300">
          {view === 'dashboard' && <TicketDashboard user={currentUser} refreshKey={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />}
          {view === 'form' && <TicketForm userEmail={currentUser.Email} onSuccess={() => setView('dashboard')} />}
          {view === 'assets' && <AssetManager user={currentUser} />}
          {view === 'operations' && <OperationsDashboard user={currentUser} />}
          {view === 'users' && <UserManager currentUser={currentUser} />}
          {view === 'vendors' && <VendorManager />} 
          {/* Note: Using VendorManager for internal view, VendorPortal is for external */}
          {view === 'roles' && <RoleManager />}
          {view === 'admin' && <AdminPanel onSuccess={() => setRefreshKey(k => k + 1)} />}
        </div>
      </main>
    </div>
  );
}