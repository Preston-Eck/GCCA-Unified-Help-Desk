import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getSessionUserEmail } from './services/api';
import { initDatabase, getUsers, hasPermission } from './services/dataService';
import { Loader2, Users, Shield, Database, Briefcase, Settings, Calendar, LogOut, Map, Package } from 'lucide-react';

// Components
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import AssetManager from './components/AssetManager';
import AdminPanel from './components/AdminPanel';
import AccessDenied from './components/AccessDenied';
import LoginScreen from './components/LoginScreen'; 
import OperationsDashboard from './components/OperationsDashboard';
import RoleManager from './components/RoleManager';
import UserManager from './components/UserManager';
import VendorManager from './components/VendorManager';
import CampusManager from './components/CampusManager';
// import InventoryManager from './components/InventoryManager'; // Uncomment if file exists

// --- CONFIG ---
const SUPER_ADMIN_EMAIL = 'preston@grovecitychristianacademy.com';
const STORAGE_KEY = 'gcca_user_session';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [realUserEmail, setRealUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        const users = getUsers();
        setAllUsers(users);

        let email = await getSessionUserEmail();
        if (!email || email === '') {
           const storedEmail = localStorage.getItem(STORAGE_KEY);
           if (storedEmail) email = storedEmail;
        }
        
        if (email && email !== '') {
           setRealUserEmail(email);
           const foundUser = users.find((u: User) => u.Email.toLowerCase() === email.toLowerCase());
           if (foundUser) setCurrentUser(foundUser);
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshKey]);

  const handleManualLogin = (email: string) => {
    const user = allUsers.find(u => u.Email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(STORAGE_KEY, email);
      setRealUserEmail(email);
      setCurrentUser(user);
    } else {
      setRealUserEmail(email);
      setCurrentUser(null); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setRealUserEmail('');
    window.location.reload();
  };

  const handleRoleSwitch = (targetEmail: string) => {
    if (targetEmail === 'REAL_USER') {
       const me = allUsers.find(u => u.Email.toLowerCase() === realUserEmail.toLowerCase());
       if (me) setCurrentUser(me);
    } else {
       const targetUser = allUsers.find(u => u.Email === targetEmail);
       if (targetUser) setCurrentUser(targetUser);
    }
  };

  // Helper to check permissions cleanly
  const check = (perm: any) => currentUser ? hasPermission(currentUser, perm) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#355E3B] mx-auto mb-4" />
          <p className="text-gray-500">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (realUserEmail) return <AccessDenied userEmail={realUserEmail} />;
    return <LoginScreen onLogin={handleManualLogin} />;
  }

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
            
            <div className="text-right flex items-center gap-3">
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">{currentUser.Name}</div>
                <div className="text-xs text-gray-300 opacity-80">{currentUser.User_Type}</div>
              </div>
              <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
           <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'dashboard' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
             Dashboard
           </button>
           
           {check('SUBMIT_TICKETS') && (
             <button onClick={() => setView('form')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'form' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               New Ticket
             </button>
           )}

           {check('MANAGE_ASSETS') && (
             <>
                <button onClick={() => setView('assets')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'assets' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
                  <Database className="w-4 h-4" /> Assets
                </button>
                <button onClick={() => setView('campuses')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'campuses' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
                  <Map className="w-4 h-4" /> Campuses
                </button>
             </>
           )}

           {check('INVENTORY_READ') && (
             <button onClick={() => setView('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'inventory' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Package className="w-4 h-4" /> Inventory
             </button>
           )}

           {(check('MANAGE_SOPS') || check('MANAGE_SCHEDULES')) && (
             <button onClick={() => setView('operations')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'operations' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Calendar className="w-4 h-4" /> Operations
             </button>
           )}

           {check('MANAGE_USERS') && (
             <button onClick={() => setView('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'users' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Users className="w-4 h-4" /> Users
             </button>
           )}

           {check('MANAGE_VENDORS') && (
             <button onClick={() => setView('vendors')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'vendors' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Briefcase className="w-4 h-4" /> Vendors
             </button>
           )}

           {check('MANAGE_ROLES') && (
             <button onClick={() => setView('roles')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'roles' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Shield className="w-4 h-4" /> Roles
             </button>
           )}

           {check('MANAGE_SETTINGS') && (
             <button onClick={() => setView('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${view === 'admin' ? 'bg-[#355E3B] text-white' : 'bg-white hover:bg-gray-50 shadow-sm'}`}>
               <Settings className="w-4 h-4" /> Settings
             </button>
           )}
        </div>

        <div className="animate-in fade-in duration-300">
          {view === 'dashboard' && <TicketDashboard user={currentUser} refreshKey={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />}
          {view === 'form' && <TicketForm userEmail={currentUser.Email} onSuccess={() => setView('dashboard')} />}
          {view === 'assets' && <AssetManager user={currentUser} />}
          {view === 'campuses' && <CampusManager user={currentUser} />}
          {/* {view === 'inventory' && <InventoryManager />} */} 
          {view === 'operations' && <OperationsDashboard user={currentUser} />}
          {view === 'users' && <UserManager currentUser={currentUser} />}
          {view === 'vendors' && <VendorManager />} 
          {view === 'roles' && <RoleManager />}
          {view === 'admin' && <AdminPanel onSuccess={() => setRefreshKey(k => k + 1)} />}
        </div>
      </main>
    </div>
  );
}