import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getSessionUserEmail } from './services/api';
import { initDatabase, getUsers, hasPermission, getAppConfig } from './services/dataService';
import { Loader2, Users, Shield, Database, Briefcase, Settings, Calendar, LogOut, Map as MapIcon, Package } from 'lucide-react';

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
import InventoryManager from './components/InventoryManager'; 

const SUPER_ADMIN_EMAIL = 'preston@grovecitychristianacademy.com';
const STORAGE_KEY = 'gcca_user_session';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [realUserEmail, setRealUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [appName, setAppName] = useState('GCCA Facilities');

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        
        // FIXED: Added await for async data
        const users = await getUsers();
        setAllUsers(users);
        
        const config = await getAppConfig();
        if (config && config.siteName) setAppName(config.siteName);

        let email = await getSessionUserEmail();
        if (!email || email === '') {
           const storedEmail = localStorage.getItem(STORAGE_KEY);
           if (storedEmail) email = storedEmail;
        }
        
        if (email && email !== '') {
           setRealUserEmail(email);
           const normEmail = email.trim().toLowerCase();
           
           // FIXED: Used lowercase 'email' to match User type
           const foundUser = users.find((u: User) => u.email.toLowerCase() === normEmail);
           
           if (foundUser) {
             setCurrentUser(foundUser);
           } else if (normEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
             console.warn("Using Super Admin Override");
             // FIXED: User object uses lowercase keys to match 'User' interface
             setCurrentUser({
               id: 'ADMIN_OVERRIDE',
               email: email,
               name: 'Super Admin (Recovery)',
               role: 'Admin', // Maps to User_Type logic later if needed
               department: 'IT',
               status: 'Active'
             });
           }
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
    if (email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, email);
      setRealUserEmail(email);
      // FIXED: User object uses lowercase keys
      setCurrentUser({
         id: 'ADMIN_OVERRIDE',
         email: email,
         name: 'Super Admin (Recovery)',
         role: 'Admin',
         department: 'IT',
         status: 'Active'
      });
      return;
    }
    // FIXED: Used lowercase 'email'
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
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
       if (realUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
         // FIXED: User object uses lowercase keys
         setCurrentUser({
            id: 'ADMIN_OVERRIDE',
            email: realUserEmail,
            name: 'Super Admin (Recovery)',
            role: 'Admin',
            department: 'IT',
            status: 'Active'
         });
       } else {
         // FIXED: Used lowercase 'email'
         const me = allUsers.find(u => u.email.toLowerCase() === realUserEmail.toLowerCase());
         if (me) setCurrentUser(me);
       }
    } else {
       // FIXED: Used lowercase 'email'
       const targetUser = allUsers.find(u => u.email === targetEmail);
       if (targetUser) setCurrentUser(targetUser);
    }
  };

  const check = (perm: string) => currentUser ? hasPermission(currentUser, perm) : false;

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
      <header className="bg-[#355E3B] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold hidden sm:block">{appName}</h1>
          </div>

          <div className="flex items-center gap-4">
            {realUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <div className="bg-yellow-500/20 p-1 rounded border border-yellow-500/50 flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-200" />
                <select 
                  className="bg-transparent text-xs text-white font-mono focus:outline-none max-w-[120px] sm:max-w-none"
                  // FIXED: Used lowercase 'email'
                  value={currentUser.email}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                >
                  <option className="text-black" value="REAL_USER">Viewing as: Myself</option>
                  <optgroup className="text-black" label="Switch View">
                    {allUsers.map(u => (
                      // FIXED: Used lowercase 'id', 'email', 'name', 'role'
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            
            <div className="text-right flex items-center gap-3">
              <div className="hidden sm:block">
                {/* FIXED: Used lowercase 'name' and 'role' */}
                <div className="text-sm font-semibold">{currentUser.name}</div>
                <div className="text-xs text-gray-300 opacity-80">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                  <MapIcon className="w-4 h-4" /> Campuses
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
          {/* FIXED: Used lowercase 'email' */}
          {view === 'form' && <TicketForm userEmail={currentUser.email} onSuccess={() => setView('dashboard')} />}
          {view === 'assets' && <AssetManager user={currentUser} />}
          {view === 'campuses' && <CampusManager user={currentUser} />}
          {view === 'inventory' && <InventoryManager />}
          {view === 'operations' && <OperationsDashboard currentUser={currentUser} />}
          {view === 'users' && <UserManager currentUser={currentUser} />}
          {view === 'vendors' && <VendorManager />} 
          {view === 'roles' && <RoleManager />}
          {view === 'admin' && <AdminPanel onSuccess={() => setRefreshKey(k => k + 1)} />}
        </div>
      </main>
    </div>
  );
}