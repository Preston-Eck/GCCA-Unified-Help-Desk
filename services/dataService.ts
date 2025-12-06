import { Ticket, User, Campus, Building, Location, Asset, MaintenanceSchedule, SOP, TicketAttachment, Vendor, VendorBid, VendorReview, AccountRequest, RoleDefinition, Permission, SiteConfig, AssetSOPLink } from '../types';

// --- LOCAL CACHE STATE ---
const DB_CACHE = {
  users: [] as User[],
  campuses: [] as Campus[],
  buildings: [] as Building[],
  locations: [] as Location[],
  assets: [] as Asset[],
  sops: [] as SOP[],
  schedules: [] as MaintenanceSchedule[],
  vendors: [] as Vendor[],
  tickets: [] as Ticket[],
  roles: [] as RoleDefinition[],
  config: {
    appName: 'Help Desk',
    unauthorizedMessage: 'Access Denied',
    supportContact: 'support@example.com',
    announcementBanner: ''
  } as SiteConfig,
  bids: [] as VendorBid[],
  reviews: [] as VendorReview[],
  accountRequests: [] as AccountRequest[],
  assetSopLinks: [] as AssetSOPLink[],
  ticketAttachments: [] as TicketAttachment[]
};

// --- THE BRIDGE ---
const runServer = (fnName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !window.google || !window.google.script) {
      console.warn(`[Mock Mode] Call to ${fnName}`, args);
      if (fnName === 'getDatabaseData') resolve({}); 
      else resolve(null);
      return;
    }
    // @ts-ignore
    window.google.script.run
      .withSuccessHandler((res) => {
        try { resolve(typeof res === 'string' ? JSON.parse(res) : res); } 
        catch(e) { resolve(res); }
      })
      .withFailureHandler(reject)
      [fnName](...args);
  });
};

// --- HELPER: NORMALIZE EMAIL (Fixes Access Denied) ---
const normEmail = (email: string) => email ? email.trim().toLowerCase() : '';

// --- INITIALIZATION ---
export const initDatabase = async () => {
  try {
    const u = await runServer("getDatabaseData");
    if (u) {
      // Load and normalize Emails immediately
      DB_CACHE.users = (u.USERS || []).map((user: User) => ({ ...user, Email: normEmail(user.Email) }));
      
      DB_CACHE.campuses = u.CAMPUSES || [];
      DB_CACHE.buildings = u.BUILDINGS || [];
      DB_CACHE.locations = u.LOCATIONS || [];
      DB_CACHE.assets = u.ASSETS || [];
      DB_CACHE.tickets = u.TICKETS || [];
      DB_CACHE.ticketAttachments = u.ATTACHMENTS || [];
      DB_CACHE.sops = u.SOP || [];
      DB_CACHE.schedules = u.SCHEDULES || [];
      DB_CACHE.assetSopLinks = u.ASSET_SOP || [];
      DB_CACHE.vendors = u.VENDORS || [];
      DB_CACHE.bids = u.BIDS || [];
      DB_CACHE.reviews = u.REVIEWS || [];
      
      // Safe Role Parsing
      DB_CACHE.roles = (u.ROLES || []).map((r: any) => ({
        ...r,
        Permissions: r.Permissions ? r.Permissions.split(',') : []
      }));

      DB_CACHE.accountRequests = u.REQUESTS || [];
      if (u.CONFIG) DB_CACHE.config = u.CONFIG;
      
      console.log("Database Loaded. Users found:", DB_CACHE.users.length);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to load database:", e);
    return false;
  }
};

// --- EXPORTS ---
export const getCampuses = () => DB_CACHE.campuses;
export const getBuildings = (campusId: string) => DB_CACHE.buildings.filter(b => b.CampusID_Ref === campusId);
export const getLocations = (buildingId: string) => DB_CACHE.locations.filter(l => l.BuildingID_Ref === buildingId);
export const getAssets = (locationId: string) => DB_CACHE.assets.filter(a => a.LocationID_Ref === locationId);
export const getUsers = () => DB_CACHE.users;
export const getRoles = () => DB_CACHE.roles;
export const getAppConfig = () => DB_CACHE.config;
export const getTicketsForUser = (user: User) => {
    // Return all tickets for client-side filtering (Fixes "missing tickets" on refresh)
    return DB_CACHE.tickets;
};
export const updateAppConfig = async (newConfig: SiteConfig) => { DB_CACHE.config = newConfig; return runServer('updateConfig', newConfig); };

// --- WRITES WITH OPTIMISTIC UPDATES ---

export const submitTicket = async (email: string, ticketData: any) => {
  const newTicketID = `T-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const payload = {
    TicketID: newTicketID,
    Date_Submitted: now,
    Submitter_Email: normEmail(email),
    CampusID_Ref: ticketData.campusId,
    BuildingID_Ref: ticketData.buildingId,
    LocationID_Ref: ticketData.locationId,
    Related_AssetID_Ref: ticketData.assetId || '',
    Title: ticketData.title,
    Description: ticketData.description,
    Category: ticketData.category,
    Status: 'New',
    Priority: ticketData.priority,
    Assigned_Staff: '',
    Assigned_VendorID_Ref: '',
    IsPublic: false,
    AI_Suggested_Plan: '',
    AI_Questions: ''
  };

  // Optimistic Update: Show it immediately
  DB_CACHE.tickets.unshift({ ...payload, Comments: [] } as Ticket);

  return runServer('saveTicket', payload).then(() => newTicketID);
};

export const uploadFile = async (file: File, ticketId: string) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const url = await runServer('uploadFile', base64, file.name, file.type, ticketId);
        resolve(url);
      } catch (e) { reject(e); }
    };
  });
};

// --- Infrastructure Optimistic Updates ---
export const addBuilding = (campusId: string, name: string) => {
    const newItem = { BuildingID: `BLD-${Date.now()}`, CampusID_Ref: campusId, Building_Name: name };
    DB_CACHE.buildings.push(newItem);
    return runServer('addBuilding', campusId, name);
};

export const addLocation = (buildingId: string, name: string) => {
    const newItem = { LocationID: `LOC-${Date.now()}`, BuildingID_Ref: buildingId, Location_Name: name };
    DB_CACHE.locations.push(newItem);
    return runServer('addLocation', buildingId, name);
};

export const addAsset = (locationId: string, name: string) => {
    const newItem = { AssetID: `AST-${Date.now()}`, LocationID_Ref: locationId, Asset_Name: name };
    DB_CACHE.assets.push(newItem);
    return runServer('addAsset', locationId, name);
};

export const saveUser = (u: User) => {
    // Normalize before saving
    const userToSave = { ...u, Email: normEmail(u.Email) };
    
    // Update Local Cache
    const idx = DB_CACHE.users.findIndex(existing => existing.UserID === u.UserID);
    if (idx >= 0) {
        DB_CACHE.users[idx] = userToSave;
    } else {
        const newUser = { ...userToSave, UserID: u.UserID || `U-${Date.now()}` };
        DB_CACHE.users.push(newUser);
    }
    return runServer('saveUser', userToSave);
};

// --- Standard Pass-throughs & Other Optimistic Updates ---
export const deleteBuilding = (id: string) => {
    DB_CACHE.buildings = DB_CACHE.buildings.filter(b => b.BuildingID !== id);
    return runServer('deleteBuilding', id);
};
export const deleteLocation = (id: string) => {
    DB_CACHE.locations = DB_CACHE.locations.filter(l => l.LocationID !== id);
    return runServer('deleteLocation', id);
};
export const updateAsset = (a: Asset) => {
     const idx = DB_CACHE.assets.findIndex(asset => asset.AssetID === a.AssetID);
     if(idx !== -1) DB_CACHE.assets[idx] = a;
     return runServer('updateAsset', a);
};
export const deleteAsset = (id: string) => {
    DB_CACHE.assets = DB_CACHE.assets.filter(a => a.AssetID !== id);
    return runServer('deleteAsset', id);
};

export const saveRole = (r: RoleDefinition) => {
    const idx = DB_CACHE.roles.findIndex(role => role.RoleName === r.RoleName);
    if(idx !== -1) DB_CACHE.roles[idx] = r;
    else DB_CACHE.roles.push(r);

    return runServer('saveRole', { 
        RoleName: r.RoleName, 
        Description: r.Description, 
        Permissions: r.Permissions.join(',') 
    });
};
export const deleteRole = (n: string) => {
    DB_CACHE.roles = DB_CACHE.roles.filter(r => r.RoleName !== n);
    return runServer('deleteRole', n);
};

export const saveMaintenanceSchedule = (s: MaintenanceSchedule) => {
    // Simple optimistic push (handling ID generation in real app is better)
    DB_CACHE.schedules = DB_CACHE.schedules.filter(sch => sch.ScheduleID !== s.ScheduleID); // Remove old if update
    DB_CACHE.schedules.push(s);
    return runServer('saveMaintenanceSchedule', s);
};
export const deleteMaintenanceSchedule = (id: string) => {
    DB_CACHE.schedules = DB_CACHE.schedules.filter(s => s.ScheduleID !== id);
    return runServer('deleteMaintenanceSchedule', id);
};

export const addSOP = (t: string, c: string) => {
    const newSop = { SOP_ID: `SOP-${Date.now()}`, SOP_Title: t, Concise_Procedure_Text: c, Google_Doc_Link: '' };
    DB_CACHE.sops.push(newSop);
    return runServer('saveSOP', newSop);
};
export const updateSOP = (s: SOP) => {
    const idx = DB_CACHE.sops.findIndex(sop => sop.SOP_ID === s.SOP_ID);
    if(idx !== -1) DB_CACHE.sops[idx] = s;
    return runServer('saveSOP', s);
};
export const deleteSOP = (id: string) => {
    DB_CACHE.sops = DB_CACHE.sops.filter(s => s.SOP_ID !== id);
    return runServer('deleteSOP', id);
};
export const linkSOPToAsset = (a: string, s: string) => runServer('linkSOP', a, s);

export const deleteUser = (id: string) => {
    DB_CACHE.users = DB_CACHE.users.filter(u => u.UserID !== id);
    return runServer('deleteUser', id);
};

export const submitAccountRequest = (req: any) => runServer('submitAccountRequest', req);
export const rejectAccountRequest = (id: string) => {
    DB_CACHE.accountRequests = DB_CACHE.accountRequests.filter(r => r.RequestID !== id);
    return runServer('deleteAccountRequest', id);
};

export const saveVendor = (v: Vendor) => {
    // Optimistic Vendor Save
    const idx = DB_CACHE.vendors.findIndex(ven => ven.VendorID === v.VendorID);
    if (idx !== -1) DB_CACHE.vendors[idx] = v;
    else DB_CACHE.vendors.push(v);
    return runServer('saveVendor', v);
};
export const updateVendorStatus = (id: string, status: string) => {
  const vendor = DB_CACHE.vendors.find(v => v.VendorID === id);
  if (vendor) vendor.Status = status as any;
  return runServer('saveVendor', { VendorID: id, Status: status });
};
export const registerVendor = (v: any) => runServer('saveVendor', { ...v, VendorID: `V-${Date.now()}`, Status: 'Pending', DateJoined: new Date().toISOString() });
export const submitBid = (v: string, t: string, a: number, n: string, f: any[]) => runServer('submitBid', { BidID: `BID-${Date.now()}`, VendorID_Ref: v, TicketID_Ref: t, Amount: a, Notes: n, Status: 'Pending', DateSubmitted: new Date().toISOString() });
export const acceptBid = (b: string, t: string) => runServer('updateBid', { BidID: b, Status: 'Accepted' });
export const addVendorReview = (v: string, t: string, a: string, r: number, c: string) => runServer('saveReview', { ReviewID: `REV-${Date.now()}`, VendorID_Ref: v, TicketID_Ref: t, Author_Email: a, Rating: r, Comment: c, Timestamp: new Date().toISOString() });

// Getters & Helpers
export const getAllSOPs = () => DB_CACHE.sops;
export const getSOPsForAsset = (id: string) => DB_CACHE.sops; 
export const getAllMaintenanceSchedules = () => DB_CACHE.schedules;
export const getMaintenanceSchedules = (id: string) => DB_CACHE.schedules.filter(s => s.AssetID_Ref === id);
export const getAccountRequests = () => DB_CACHE.accountRequests;
export const getVendors = () => DB_CACHE.vendors;
export const getVendorHistory = (id: string) => DB_CACHE.bids.filter(b => b.VendorID_Ref === id);
export const getOpenTicketsForVendors = () => DB_CACHE.tickets.filter(t => t.Status === 'Open for Bid');
export const getVendorTickets = (id: string) => DB_CACHE.tickets.filter(t => t.Assigned_VendorID_Ref === id);
export const getBidsForTicket = (id: string) => DB_CACHE.bids.filter(b => b.TicketID_Ref === id);
export const getAttachmentsForBid = (id: string) => [];
export const getVendorReview = (id: string) => DB_CACHE.reviews.find(r => r.TicketID_Ref === id);
export const getTicketById = (id: string) => DB_CACHE.tickets.find(t => t.TicketID === id);

// --- TICKET ACTIONS (Optimistic) ---
export const claimTicket = (id: string, email: string) => {
    const t = DB_CACHE.tickets.find(ticket => ticket.TicketID === id);
    if(t) { t.Status = 'Assigned'; t.Assigned_Staff = email; }
    runServer('updateTicketStatus', id, 'Assigned', email);
};
export const updateTicketStatus = (id: string, status: string, email: string, assign?: string) => {
    const t = DB_CACHE.tickets.find(ticket => ticket.TicketID === id);
    if(t) { t.Status = status as any; if(assign) t.Assigned_Staff = assign; }
    runServer('updateTicketStatus', id, status, assign);
};
export const addTicketComment = (id: string, email: string, text: string, isStatus?: boolean) => {
    const t = DB_CACHE.tickets.find(ticket => ticket.TicketID === id);
    const newComment = { CommentID: `C-${Date.now()}`, Author_Email: email, Text: text, IsStatusChange: isStatus, Timestamp: new Date().toISOString() };
    if(t) { if(!t.Comments) t.Comments = []; t.Comments.push(newComment); }
    runServer('saveTicket', { TicketID: id, Comments: JSON.stringify(t?.Comments || [newComment]) }); 
};
export const toggleTicketPublic = (id: string, val: boolean) => {
    const t = DB_CACHE.tickets.find(ticket => ticket.TicketID === id);
    if(t) t.IsPublic = val;
    runServer('saveTicket', { TicketID: id, IsPublic: val });
};
export const mergeTickets = (t: string, s: string, u: string) => console.log("Merge not fully impl");
export const checkAndGeneratePMTickets = () => 0;

export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};
export const getAssetDetails = (id: string) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getAttachments = (id: string) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);

// Fix White Screen Crash: Safely check for Tech role
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type && u.User_Type.includes('Tech')); 

// --- PERMISSIONS HELPER (Robust) ---
export const hasPermission = (user: User, permission: string): boolean => {
  if (!user) return false;
  if (user.User_Type && (user.User_Type.includes('Admin') || user.User_Type.includes('Chair'))) return true;
  
  // Safe split for empty roles
  const userRoles = user.User_Type ? user.User_Type.split(',').map(r => r.trim()) : [];
  
  const definedRoles = getRoles(); 
  for (const roleName of userRoles) {
    const roleDef = definedRoles.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions && roleDef.Permissions.includes(permission as any)) return true;
  }
  return false;
};