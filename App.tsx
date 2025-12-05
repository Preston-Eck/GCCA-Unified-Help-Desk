import React, { useState, useEffect } from 'react';
import { validateUser, getAppConfig, hasPermission, loadDatabase, getUsers } from './services/dataService';
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import AdminPanel from './components/AdminPanel';
import AssetManager from './components/AssetManager';
import UserManager from './components/UserManager';
import VendorManager from './components/VendorManager';
import VendorPortal from './components/VendorPortal';
import AccountRequest from './components/AccountRequest';
import RoleManager from './components/RoleManager';
import OperationsDashboard from './components/OperationsDashboard';
import { AccessDenied } from './components/AccessDenied';
import { LayoutDashboard, PlusCircle, Settings, Database, Users, Briefcase, ExternalLink, Shield, Clock, Loader2 } from 'lucide-react';

export default function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentView, setCurrentView] = useState<'form' | 'dashboard' | 'admin' | 'assets' | 'users' | 'vendors' | 'portal' | 'request-account' | 'roles' | 'operations'>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Initial Data Load
  useEffect(() => {
    const initApp = async () => {
      await loadDatabase();
      const users = getUsers();
      if (users.length > 0) {
        setCurrentUserEmail(users[0].Email);
      }
      setIsDataLoaded(true);
    };
    initApp();
  }, []);

  // Show loading screen while fetching data from Google Apps Script
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#355E3B] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Loading Help Desk...</h2>
      </div>
    );
  }

  // If in portal mode, we skip standard user auth for the view rendering, but we still need app shell
  const isPortalMode = currentView === 'portal';
  const isRequestMode = currentView === 'request-account';
  
  const currentUser = validateUser(currentUserEmail);
  const config = getAppConfig();

  // Public Routes
  if (isRequestMode) {
    return <AccountRequest onBack={() => setCurrentView('dashboard')} />;
  }

  if (!currentUser && !isPortalMode) {
    return <AccessDenied />;
  }

  const handleRefresh = () => setRefreshKey(prev => prev + 1);
  
  // PERMISSION CHECKS
  // Safely handle null user if in portal mode (though portal has its own return)
  const user = currentUser!;
  
  const canSubmit = user ? hasPermission(user, 'SUBMIT_TICKETS') : false;
  const canManageAssets = user ? hasPermission(user, 'MANAGE_ASSETS') : false;
  const canManageUsers = user ? hasPermission(user, 'MANAGE_USERS') : false;
  const canManageVendors = user ? hasPermission(user, 'MANAGE_VENDORS') : false;
  const canManageRoles = user ? hasPermission(user, 'MANAGE_ROLES') : false;
  const canManageSettings = user ? hasPermission(user, 'MANAGE_SETTINGS') : false;
  const canViewOperations = user ? (hasPermission(user, 'MANAGE_SOPS') || hasPermission(user, 'MANAGE_SCHEDULES')) : false;
  const isParent = user?.User_Type.includes('Parent');

  if (isPortalMode) {
     return (
       <div className="min-h-screen bg-gray-100 font-sans">
         <div className="bg-[#355E3B] h-2"></div>
         <button onClick={() => setCurrentView('dashboard')} className="absolute top-4 left-4 text-sm text-gray-500 hover:text-[#355E3B]">
           &larr; Back to Internal App
         </button>
         <VendorPortal />
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Navbar */}
      <nav className="bg-[#355E3B] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center text-gray-900 font-bold">
                HD
              </div>
              <span className="font-bold text-lg tracking-wide hidden sm:block">{config.appName}</span>
              <span className="font-bold text-lg tracking-wide sm:hidden">Help Desk</span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Sim Link for Portal */}
               {!isParent && (
                 <button onClick={() => setCurrentView('portal')} className="text-xs text-green-200 hover:text-white flex items-center gap-1">
                   <ExternalLink className="w-3 h-3" /> Vendor Portal
                 </button>
               )}

              <div className="hidden md:flex items-center gap-2">
                 <span className="text-xs text-green-200">Simulate:</span>
                 <select 
                    value={currentUserEmail}
                    onChange={(e) => {
                      setCurrentUserEmail(e.target.value);
                      handleRefresh();
                      setCurrentView('dashboard');
                    }}
                    className="bg-[#2a4b2f] border border-green-800 text-sm rounded px-2 py-1 text-white focus:outline-none max-w-[150px] truncate"
                  >
                    {getUsers().map(u => (
                      <option key={u.UserID} value={u.Email}>
                        {u.Name} ({u.User_Type})
                      </option>
                    ))}
                    <option value="invalid@gcca.edu">Unauthorized User</option>
                  </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
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
          
          {canSubmit && (
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
          )}

          {canManageAssets && (
             <button
              onClick={() => setCurrentView('assets')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'assets'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Database className="w-5 h-5" />
              Assets
            </button>
          )}

          {canViewOperations && (
             <button
              onClick={() => setCurrentView('operations')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'operations'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              Operations
            </button>
          )}

          {canManageUsers && (
             <button
              onClick={() => setCurrentView('users')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'users'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
          )}

          {canManageRoles && (
             <button
              onClick={() => setCurrentView('roles')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'roles'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Shield className="w-5 h-5" />
              Roles
            </button>
          )}
          
          {canManageVendors && (
             <button
              onClick={() => setCurrentView('vendors')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'vendors'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Vendors
            </button>
          )}

          {canManageSettings && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                currentView === 'admin'
                  ? 'bg-white text-[#355E3B] ring-2 ring-[#355E3B]'
                  : 'bg-white text-gray-500 hover:text-[#355E3B] hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Admin
            </button>
          )}
        </div>

        <div className="animate-in fade-in duration-300">
          {currentView === 'form' && canSubmit && (
            <TicketForm 
              userEmail={user.Email} 
              onSuccess={() => {
                handleRefresh();
                setCurrentView('dashboard');
              }}
            />
          )}

          {currentView === 'dashboard' && (
            <TicketDashboard 
              user={user} 
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
            />
          )}

          {currentView === 'assets' && canManageAssets && (
            <AssetManager user={user} />
          )}

          {currentView === 'operations' && canViewOperations && (
            <OperationsDashboard user={user} />
          )}

          {currentView === 'users' && canManageUsers && (
            <UserManager currentUser={user} />
          )}

          {currentView === 'vendors' && canManageVendors && (
            <VendorManager />
          )}
          
          {currentView === 'roles' && canManageRoles && (
            <RoleManager />
          )}

          {currentView === 'admin' && canManageSettings && (
             <AdminPanel onSuccess={handleRefresh} />
          )}
        </div>

      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {config.appName}. Internal Use Only.</p>
        </div>
      </footer>
    </div>
  );
}