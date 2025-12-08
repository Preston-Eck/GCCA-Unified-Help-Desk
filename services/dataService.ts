import * as T from '../types';

// --- BRIDGE ---
const runServer = (fn: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined') { 
      console.warn(`[Mock Mode] Call to ${fn}`, args); 
      resolve(null); 
      return; 
    }
    // @ts-ignore
    window.google.script.run
      .withSuccessHandler((r: any) => resolve(typeof r === 'string' ? JSON.parse(r) : r))
      .withFailureHandler((e: any) => {
        console.error(`[Server Error] ${fn}:`, e);
        reject(e);
      })[fn](...args);
  });
};

// --- CENTRAL STATE CACHE ---
const DB_CACHE = {
  users: [] as T.User[],
  tickets: [] as T.Ticket[],
  tasks: [] as T.Task[],
  campuses: [] as T.Campus[],
  buildings: [] as T.Building[],
  locations: [] as T.Location[],
  assets: [] as T.Asset[],
  vendors: [] as T.Vendor[],
  materials: [] as T.Material[],
  documents: [] as T.Document[],
  sops: [] as T.SOP[],
  schedules: [] as T.MaintenanceSchedule[],
  roles: [] as T.RoleDefinition[],
  mappings: [] as T.FieldMapping[],
  schema: {} as Record<string, string[]>,
  config: {} as T.SiteConfig,
  ticketAttachments: [] as T.TicketAttachment[],
  bids: [] as T.VendorBid[],
  reviews: [] as T.VendorReview[],
  accountRequests: [] as T.AccountRequest[],
  loaded: false
};

const normEmail = (email: string) => email ? email.trim().toLowerCase() : '';

// --- INITIALIZATION ---
export const initDatabase = async () => {
  try {
    const data = await runServer('getDatabaseData');
    if (data) {
      DB_CACHE.users = (data.USERS || []).map((u: any) => ({ ...u, Email: normEmail(u.Email) }));
      DB_CACHE.tickets = data.TICKETS || [];
      DB_CACHE.tasks = data.TASKS || [];
      DB_CACHE.materials = data.MATERIALS || [];
      DB_CACHE.campuses = data.CAMPUSES || [];
      DB_CACHE.buildings = data.BUILDINGS || [];
      DB_CACHE.locations = data.LOCATIONS || [];
      DB_CACHE.assets = data.ASSETS || [];
      DB_CACHE.vendors = (data.VENDORS || []).map((v: any) => ({
        ...v, 
        Vendor_Name: v.Vendor_Name || v.CompanyName 
      }));
      DB_CACHE.sops = data.SOPS || [];
      DB_CACHE.schedules = (data.SCHEDULES || []).map((s: any) => ({
          ...s,
          PM_ID: s.PM_ID || s.ScheduleID,
          Next_Due_Date: s.Next_Due_Date || s.NextDue
      }));
      DB_CACHE.documents = data.DOCS || [];
      
      DB_CACHE.roles = (data.ROLES || []).map((r: any) => ({
        ...r, Permissions: r.Permissions ? r.Permissions.split(',') : []
      }));
      
      DB_CACHE.mappings = data.MAPPINGS || [];
      
      // 🎓 CONFIG FIX: Handle if it returns an array or object
      if (data.CONFIG) {
        if (Array.isArray(data.CONFIG) && data.CONFIG.length > 0) {
           DB_CACHE.config = data.CONFIG[0];
        } else if (!Array.isArray(data.CONFIG)) {
           DB_CACHE.config = data.CONFIG;
        }
      }
      
      DB_CACHE.ticketAttachments = data.TICKET_ATTACHMENTS || data.ATTACHMENTS || [];
      DB_CACHE.bids = data.BIDS || [];
      DB_CACHE.reviews = data.REVIEWS || [];
      DB_CACHE.accountRequests = data.REQUESTS || [];

      // Join Comments
      const allComments = data.COMMENTS || [];
      DB_CACHE.tickets = (data.TICKETS || []).map((t: T.Ticket) => {
        const ticketComments = allComments.filter((c: any) => c.TicketID_Ref === t.TicketID);
        ticketComments.sort((a: any, b: any) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
        return { ...t, Comments: ticketComments };
      });

      DB_CACHE.loaded = true;
      console.log("Database Initialized:", DB_CACHE);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Init failed:", e);
    return false;
  }
};

// --- READERS (GETTERS) ---
export const getUsers = () => DB_CACHE.users;
export const getTickets = () => DB_CACHE.tickets;
export const getTicketsForUser = (user: T.User) => DB_CACHE.tickets;
export const getTasks = (ticketId?: string) => ticketId ? DB_CACHE.tasks.filter(t => t.TicketID_Ref === ticketId) : DB_CACHE.tasks;
export const getInventory = () => DB_CACHE.materials;
export const getAssets = (locId?: string) => locId ? DB_CACHE.assets.filter(a => a.LocationID_Ref === locId) : DB_CACHE.assets;
export const getVendors = () => DB_CACHE.vendors;
export const getCampuses = () => DB_CACHE.campuses;
export const getBuildings = (campusId?: string) => campusId ? DB_CACHE.buildings.filter(b => b.CampusID_Ref === campusId) : DB_CACHE.buildings;
export const getLocations = (bldgId?: string) => bldgId ? DB_CACHE.locations.filter(l => l.BuildingID_Ref === bldgId) : DB_CACHE.locations;
export const getRoles = () => DB_CACHE.roles;
export const getMappings = () => DB_CACHE.mappings;
export const getAppConfig = () => DB_CACHE.config;
export const getAllMaintenanceSchedules = () => DB_CACHE.schedules;
export const getMaintenanceSchedules = (assetId: string) => DB_CACHE.schedules.filter(s => s.AssetID_Ref === assetId);
export const getSOPs = () => DB_CACHE.sops;
export const getAllSOPs = () => DB_CACHE.sops; 
export const getSOPsForAsset = (assetId: string) => DB_CACHE.sops;
export const getAccountRequests = () => DB_CACHE.accountRequests;
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type?.includes('Tech'));
export const getTicketById = (id: string) => DB_CACHE.tickets.find(t => t.TicketID === id);

export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};

// --- WRITERS (ACTIONS) ---

// 1. TICKETS
export const submitTicket = (email: string, data: any) => {
  const newTicket: T.Ticket = {
    ...data,
    TicketID: `T-${Date.now()}`,
    Submitter_Email: email,
    Date_Submitted: new Date().toISOString(),
    Status: 'New',
    Comments: []
  };
  DB_CACHE.tickets.unshift(newTicket);
  return runServer('saveTicket', newTicket).then(() => newTicket.TicketID);
};

export const updateTicketStatus = (id: string, status: string, email?: string, assign?: string) => {
  const ticket = DB_CACHE.tickets.find(t => t.TicketID === id);
  if (ticket) {
    ticket.Status = status;
    if (assign) ticket.Assigned_Staff = assign;
  }
  return runServer('saveTicket', { TicketID: id, Status: status, Assigned_Staff: assign });
};

export const claimTicket = (id: string, email: string) => updateTicketStatus(id, 'Assigned', email, email);

export const toggleTicketPublic = (id: string, isPublic: boolean) => {
  const ticket = DB_CACHE.tickets.find(t => t.TicketID === id);
  if (ticket) ticket.Is_Public = isPublic;
  return runServer('saveTicket', { TicketID: id, Is_Public: isPublic });
};

export const addTicketComment = (ticketId: string, email: string, text: string) => {
  const newComment: T.TicketComment = {
    CommentID: `C-${Date.now()}`,
    TicketID_Ref: ticketId,
    Author_Email: email,
    Timestamp: new Date().toISOString(),
    Comment_Text: text,
    Visibility: 'Public'
  };
  const ticket = DB_CACHE.tickets.find(t => t.TicketID === ticketId);
  if (ticket) {
    if (!ticket.Comments) ticket.Comments = [];
    ticket.Comments.push(newComment);
  }
  return runServer('saveComment', newComment);
};

// 2. INFRASTRUCTURE & SETTINGS
// 🎓 SETTINGS FIX: Updates local cache immediately
export const updateAppConfig = (c: T.SiteConfig) => {
  DB_CACHE.config = c;
  return runServer('updateConfig', c);
};

export const saveCampus = (c: T.Campus) => {
  const newItem = { ...c, CampusID: c.CampusID || `CAM-${Date.now()}` };
  const idx = DB_CACHE.campuses.findIndex(x => x.CampusID === newItem.CampusID);
  if (idx !== -1) DB_CACHE.campuses[idx] = newItem;
  else DB_CACHE.campuses.push(newItem);
  return runServer('saveCampus', newItem);
};
// Alias for addCampus (if needed by other components)
export const addCampus = (name: string) => saveCampus({ CampusID: '', Campus_Name: name });

export const deleteCampus = (id: string) => {
  DB_CACHE.campuses = DB_CACHE.campuses.filter(c => c.CampusID !== id);
  return runServer('deleteCampus', id);
};

export const addBuilding = (campusId: string, name: string) => {
  const item = { BuildingID: `BLD-${Date.now()}`, CampusID_Ref: campusId, Building_Name: name };
  DB_CACHE.buildings.push(item);
  return runServer('saveBuilding', item);
};

export const updateBuilding = (b: T.Building) => {
  const idx = DB_CACHE.buildings.findIndex(x => x.BuildingID === b.BuildingID);
  if (idx !== -1) DB_CACHE.buildings[idx] = b;
  return runServer('saveBuilding', b);
};

export const deleteBuilding = (id: string) => {
  DB_CACHE.buildings = DB_CACHE.buildings.filter(b => b.BuildingID !== id);
  return runServer('deleteBuilding', id);
};

export const addLocation = (bldgId: string, name: string) => {
  const item = { LocationID: `LOC-${Date.now()}`, BuildingID_Ref: bldgId, Location_Name: name };
  DB_CACHE.locations.push(item);
  return runServer('saveLocation', item);
};

export const updateLocation = (l: T.Location) => {
  const idx = DB_CACHE.locations.findIndex(x => x.LocationID === l.LocationID);
  if (idx !== -1) DB_CACHE.locations[idx] = l;
  return runServer('saveLocation', l);
};

export const deleteLocation = (id: string) => {
  DB_CACHE.locations = DB_CACHE.locations.filter(l => l.LocationID !== id);
  return runServer('deleteLocation', id);
};

export const addAsset = (locId: string, name: string) => {
  const item: T.Asset = { AssetID: `AST-${Date.now()}`, LocationID_Ref: locId, Asset_Name: name };
  DB_CACHE.assets.push(item);
  return runServer('saveAsset', item);
};

export const updateAsset = (asset: T.Asset) => {
  const idx = DB_CACHE.assets.findIndex(a => a.AssetID === asset.AssetID);
  if (idx !== -1) DB_CACHE.assets[idx] = asset;
  return runServer('saveAsset', asset);
};

export const deleteAsset = (id: string) => {
  DB_CACHE.assets = DB_CACHE.assets.filter(a => a.AssetID !== id);
  return runServer('deleteAsset', id);
};

// 3. VENDORS & INVENTORY
export const saveVendor = (vendor: T.Vendor) => {
  const idx = DB_CACHE.vendors.findIndex(v => v.VendorID === vendor.VendorID);
  if (idx !== -1) DB_CACHE.vendors[idx] = vendor;
  else DB_CACHE.vendors.push(vendor);
  return runServer('saveVendor', vendor);
};

export const updateVendorStatus = (id: string, status: string) => {
  const v = DB_CACHE.vendors.find(x => x.VendorID === id);
  if (v) v.Status = status;
  return runServer('saveVendor', { VendorID: id, Status: status });
};

export const saveMaterial = (mat: T.Material) => {
  const newMat = { ...mat, MaterialID: mat.MaterialID || `MAT-${Date.now()}` };
  const idx = DB_CACHE.materials.findIndex(m => m.MaterialID === newMat.MaterialID);
  if (idx !== -1) DB_CACHE.materials[idx] = newMat;
  else DB_CACHE.materials.push(newMat);
  return runServer('saveMaterial', newMat);
};

// 4. TASKS & OPERATIONS
export const saveTask = (task: T.Task) => {
  const newTask = { ...task, TaskID: task.TaskID || `TSK-${Date.now()}` };
  const idx = DB_CACHE.tasks.findIndex(t => t.TaskID === newTask.TaskID);
  if (idx !== -1) DB_CACHE.tasks[idx] = newTask;
  else DB_CACHE.tasks.push(newTask);
  return runServer('saveTask', newTask);
};

export const saveMaintenanceSchedule = (s: T.MaintenanceSchedule) => {
  const newItem = { ...s, PM_ID: s.PM_ID || `PM-${Date.now()}` };
  const idx = DB_CACHE.schedules.findIndex(x => x.PM_ID === newItem.PM_ID);
  if (idx !== -1) DB_CACHE.schedules[idx] = newItem;
  else DB_CACHE.schedules.push(newItem);
  return runServer('saveSchedule', newItem);
};

export const deleteMaintenanceSchedule = (id: string) => {
  DB_CACHE.schedules = DB_CACHE.schedules.filter(s => s.PM_ID !== id);
  return runServer('deleteMaintenanceSchedule', id);
};

export const addSOP = (title: string, text: string) => {
  const newItem: T.SOP = { SOP_ID: `SOP-${Date.now()}`, SOP_Title: title, Concise_Procedure_Text: text, Google_Doc_Link: '' };
  DB_CACHE.sops.push(newItem);
  return runServer('saveSOP', newItem).then(() => newItem);
};

export const updateSOP = (sop: T.SOP) => {
  const idx = DB_CACHE.sops.findIndex(s => s.SOP_ID === sop.SOP_ID);
  if (idx !== -1) DB_CACHE.sops[idx] = sop;
  return runServer('saveSOP', sop);
};

export const linkSOPToAsset = (assetId: string, sopId: string) => runServer('linkSOP', assetId, sopId);

// 5. USERS & ROLES
export const saveUser = (u: T.User) => {
  const finalID = u.UserID || `U-${Date.now()}`;
  const userToSave = { ...u, UserID: finalID, Email: normEmail(u.Email) };
  const idx = DB_CACHE.users.findIndex(x => x.UserID === finalID);
  if (idx !== -1) DB_CACHE.users[idx] = userToSave;
  else DB_CACHE.users.push(userToSave);
  return runServer('saveUser', userToSave);
};

export const deleteUser = (id: string) => {
  DB_CACHE.users = DB_CACHE.users.filter(u => u.UserID !== id);
  return runServer('deleteUser', id);
};

export const saveRole = (r: T.RoleDefinition) => {
  const idx = DB_CACHE.roles.findIndex(role => role.RoleName === r.RoleName);
  if (idx !== -1) DB_CACHE.roles[idx] = r;
  else DB_CACHE.roles.push(r);
  return runServer('saveRole', { RoleName: r.RoleName, Description: r.Description, Permissions: r.Permissions.join(',') });
};

export const deleteRole = (name: string) => {
  DB_CACHE.roles = DB_CACHE.roles.filter(r => r.RoleName !== name);
  return runServer('deleteRole', name);
};

// --- UTILS ---
export const fetchSchema = async () => runServer('getSchema');
export const addColumnToSheet = (s: string, h: string) => runServer('addColumn', s, h);
export const requestOtp = (e: string) => runServer('requestOtp', e);
export const verifyOtp = (e: string, c: string) => runServer('verifyOtp', e, c);

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

export const hasPermission = (user: T.User, perm: string): boolean => {
  if (!user) return false;
  if (user.User_Type?.includes('Admin') || user.User_Type?.includes('Chair')) return true;
  const userRoles = (user.User_Type || '').split(',').map(r => r.trim());
  for (const roleName of userRoles) {
    const roleDef = DB_CACHE.roles.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions.includes(perm as any)) return true;
  }
  return false;
};

// Misc
export const checkAndGeneratePMTickets = () => runServer('checkAndGeneratePMTickets'); 
export const getAssetDetails = (id: string) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getBidsForTicket = (id: string) => DB_CACHE.bids.filter(b => b.TicketID_Ref === id);
export const getAttachments = (id: string) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);
export const getVendorHistory = (id: string) => DB_CACHE.bids.filter(b => b.VendorID_Ref === id);

export const submitBid = (v: string, t: string, a: number, n: string) => {
  const newBid: T.VendorBid = {
    BidID: `BID-${Date.now()}`,
    VendorID_Ref: v,
    TicketID_Ref: t,
    Amount: a,
    Notes: n,
    Status: 'Pending',
    DateSubmitted: new Date().toISOString()
  };
  DB_CACHE.bids.push(newBid);
  return runServer('submitBid', newBid);
};

export const acceptBid = (bidId: string, ticketId: string) => {
  const bid = DB_CACHE.bids.find(b => b.BidID === bidId);
  if (bid) bid.Status = 'Accepted';
  return runServer('updateBid', { BidID: bidId, Status: 'Accepted' });
};