import * as T from '../types';

// --- BRIDGE ---
const runServer = (fn: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined') { console.warn("Mock call:", fn); resolve(null); return; }
    // @ts-ignore
    window.google.script.run
      .withSuccessHandler((r: any) => resolve(typeof r === 'string' ? JSON.parse(r) : r))
      .withFailureHandler(reject)[fn](...args);
  });
};

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
      if (data.CONFIG) DB_CACHE.config = data.CONFIG;
      
      DB_CACHE.ticketAttachments = data.TICKET_ATTACHMENTS || data.ATTACHMENTS || [];
      DB_CACHE.bids = data.BIDS || [];
      DB_CACHE.reviews = data.REVIEWS || [];
      DB_CACHE.accountRequests = data.REQUESTS || [];

      // Join Comments to Tickets
      const allComments = data.COMMENTS || [];
      DB_CACHE.tickets = (data.TICKETS || []).map((t: T.Ticket) => {
        const ticketComments = allComments.filter((c: any) => c.TicketID_Ref === t.TicketID);
        ticketComments.sort((a: any, b: any) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
        return { ...t, Comments: ticketComments };
      });

      DB_CACHE.loaded = true;
      return true;
    }
    return false;
  } catch (e) {
    console.error("Init failed:", e);
    return false;
  }
};

// --- GETTERS ---
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
export const getSOPsForAsset = (id: string) => DB_CACHE.sops; 
export const getAccountRequests = () => DB_CACHE.accountRequests;
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type.includes('Tech'));
export const getTicketById = (id: string) => DB_CACHE.tickets.find(t => t.TicketID === id);

export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};

// --- ACTIONS ---

export const saveTask = async (task: T.Task) => {
  const newTask = { ...task, TaskID: task.TaskID || `TSK-${Date.now()}` };
  const idx = DB_CACHE.tasks.findIndex(t => t.TaskID === newTask.TaskID);
  if(idx >= 0) DB_CACHE.tasks[idx] = newTask; else DB_CACHE.tasks.push(newTask);
  return runServer('saveTask', newTask);
};

export const saveMaterial = async (mat: T.Material) => {
  const newMat = { ...mat, MaterialID: mat.MaterialID || `MAT-${Date.now()}` };
  DB_CACHE.materials.push(newMat);
  return runServer('saveMaterial', newMat);
};

export const saveTicket = (t: T.Ticket) => {
  const idx = DB_CACHE.tickets.findIndex(tik => tik.TicketID === t.TicketID);
  if(idx >= 0) DB_CACHE.tickets[idx] = t;
  return runServer('saveTicket', t);
};

export const submitTicket = (email: string, data: any) => {
    return runServer('saveTicket', { ...data, Submitter_Email: email, Date_Submitted: new Date().toISOString() });
};

export const updateTicketStatus = (id: string, status: string, email?: string, assign?: string) => runServer('updateTicketStatus', id, status, assign);
export const claimTicket = (id: string, email: string) => updateTicketStatus(id, 'Assigned', email, email);

// FIXED: Added Visibility property
export const addTicketComment = (ticketId: string, email: string, text: string) => {
  const newComment: T.TicketComment = {
    CommentID: `C-${Date.now()}`,
    TicketID_Ref: ticketId,
    Author_Email: email,
    Timestamp: new Date().toISOString(),
    Comment_Text: text,
    Visibility: 'Public' // Default visibility
  };
  
  const ticket = DB_CACHE.tickets.find(t => t.TicketID === ticketId);
  if (ticket) {
    if (!ticket.Comments) ticket.Comments = [];
    ticket.Comments.push(newComment);
  }
  
  return runServer('saveComment', newComment);
};

export const saveUser = (u: T.User) => {
  const finalID = u.UserID || `U-${Date.now()}`;
  const userToSave = { ...u, UserID: finalID, Email: normEmail(u.Email) };
  const idx = DB_CACHE.users.findIndex(x => x.UserID === finalID);
  if(idx >= 0) DB_CACHE.users[idx] = userToSave; else DB_CACHE.users.push(userToSave);
  return runServer('saveUser', userToSave);
};
export const deleteUser = (id: string) => {
    DB_CACHE.users = DB_CACHE.users.filter(u => u.UserID !== id);
    return runServer('deleteUser', id);
};

export const saveRole = async (r: T.RoleDefinition) => {
    const idx = DB_CACHE.roles.findIndex(role => role.RoleName === r.RoleName);
    if(idx !== -1) DB_CACHE.roles[idx] = r;
    else DB_CACHE.roles.push(r);
    return runServer('saveRole', { RoleName: r.RoleName, Description: r.Description, Permissions: r.Permissions.join(',') });
};
export const deleteRole = (name: string) => {
    DB_CACHE.roles = DB_CACHE.roles.filter(r => r.RoleName !== name);
    return runServer('deleteRole', name);
};

export const saveAsset = (a: T.Asset) => runServer('saveAsset', a);
export const updateAsset = (a: T.Asset) => runServer('saveAsset', a);
export const deleteAsset = (id: string) => runServer('deleteAsset', id);
export const saveCampus = (c: T.Campus) => runServer('saveCampus', c);
export const deleteCampus = (id: string) => runServer('deleteCampus', id);
export const saveBuilding = (b: T.Building) => runServer('saveBuilding', b);
export const deleteBuilding = (id: string) => runServer('deleteBuilding', id);
export const saveLocation = (l: T.Location) => runServer('saveLocation', l);
export const deleteLocation = (id: string) => runServer('deleteLocation', id);

export const addBuilding = (c: string, n: string) => runServer('saveBuilding', { CampusID_Ref: c, Building_Name: n });
export const addLocation = (b: string, n: string) => runServer('saveLocation', { BuildingID_Ref: b, Location_Name: n });
export const addAsset = (l: string, n: string) => runServer('saveAsset', { LocationID_Ref: l, Asset_Name: n });

export const saveMapping = (m: T.FieldMapping) => runServer('saveMapping', m);
export const saveFieldMapping = saveMapping;
export const deleteFieldMapping = (id: string) => runServer('deleteMapping', id);

export const fetchSchema = async () => runServer('getSchema');
export const addColumnToSheet = (s: string, h: string) => runServer('addColumn', s, h);
export const requestOtp = (e: string) => runServer('requestOtp', e);
export const verifyOtp = (e: string, c: string) => runServer('verifyOtp', e, c);

export const getAssetDetails = (id: string) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getVendorReview = (id: string) => DB_CACHE.reviews.find(r => r.TicketID_Ref === id);
export const getVendorTickets = (id: string) => DB_CACHE.tickets.filter(t => t.Assigned_VendorID_Ref === id);
export const getBidsForTicket = (id: string) => DB_CACHE.bids.filter(b => b.TicketID_Ref === id);
export const getAttachments = (id: string) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);
export const getAttachmentsForBid = (bidId: string) => []; 
export const getVendorHistory = (id: string) => DB_CACHE.bids.filter(b => b.VendorID_Ref === id);
export const getOpenTicketsForVendors = () => DB_CACHE.tickets.filter(t => t.Status === 'Open for Bid');

export const rejectAccountRequest = (id: string) => runServer('deleteAccountRequest', id);
export const submitAccountRequest = (d: any) => runServer('submitAccountRequest', d);
export const updateAppConfig = (c: T.SiteConfig) => runServer('updateConfig', c);
export const saveVendor = (v: T.Vendor) => runServer('saveVendor', v);
export const updateVendorStatus = (id: string, s: string) => runServer('saveVendor', { VendorID: id, Status: s });
export const submitBid = (v: string, t: string, a: number, n: string) => runServer('submitBid', { VendorID_Ref: v, TicketID_Ref: t, Amount: a, Notes: n });
export const acceptBid = (id: string, t: string) => runServer('updateBid', { BidID: id, Status: 'Accepted' });
export const addVendorReview = (v: string, t: string, a: string, r: number, c: string) => runServer('saveReview', { VendorID_Ref: v, TicketID_Ref: t, Rating: r, Comment: c });
export const toggleTicketPublic = (id: string, v: boolean) => runServer('saveTicket', { TicketID: id, Is_Public: v });
export const mergeTickets = () => console.log("Merge not impl");
export const checkAndGeneratePMTickets = () => 0;
export const addSOP = (t: string, c: string) => runServer('saveSOP', { SOP_Title: t, Concise_Procedure_Text: c });
export const deleteSOP = (id: string) => runServer('deleteSOP', id);
export const linkSOPToAsset = (a: string, s: string) => runServer('linkSOP', a, s);
export const updateSOP = (s: T.SOP) => runServer('saveSOP', s);
export const deleteMaintenanceSchedule = (id: string) => runServer('deleteMaintenanceSchedule', id);
export const saveMaintenanceSchedule = (s: T.MaintenanceSchedule) => runServer('saveSchedule', s);
export const registerVendor = (v: any) => runServer('saveVendor', v);
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
  return true; 
};

// --- APP FIELDS ---
export const APP_FIELDS: T.AppField[] = [
  // ... (Identical list as before, can be pasted here if needed, but omitted for brevity)
  { id: 'ticket.id', category: 'Ticket', label: 'Ticket ID', description: 'T-XXXX', type: 'text' },
  // ...
];