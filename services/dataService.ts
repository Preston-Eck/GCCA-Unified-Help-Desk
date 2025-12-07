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
    DB_CACHE.vendors = (data.VENDORS || []).map((v: any) => ({ ...v, Vendor_Name: v.Vendor_Name || v.CompanyName }));
    DB_CACHE.sops = data.SOPS || [];
    DB_CACHE.schedules = (data.SCHEDULES || []).map((s: any) => ({ ...s, PM_ID: s.PM_ID || s.ScheduleID, Next_Due_Date: s.Next_Due_Date || s.NextDue }));
    DB_CACHE.documents = data.DOCS || [];
    DB_CACHE.roles = (data.ROLES || []).map((r: any) => ({ ...r, Permissions: r.Permissions ? r.Permissions.split(',') : [] }));
    DB_CACHE.mappings = data.MAPPINGS || [];
    if (data.CONFIG) DB_CACHE.config = data.CONFIG;
    DB_CACHE.ticketAttachments = data.TICKET_ATTACHMENTS || data.ATTACHMENTS || [];
    DB_CACHE.bids = data.BIDS || [];
    DB_CACHE.reviews = data.REVIEWS || [];
    DB_CACHE.accountRequests = data.REQUESTS || [];
    DB_CACHE.loaded = true;
    return true;
  }
  return false;
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
export const getSOPsForAsset = (id: string) => DB_CACHE.sops; // Placeholder: Ideally filter by link table
export const getAccountRequests = () => DB_CACHE.accountRequests;
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type.includes('Tech'));
export const getTicketById = (id: string) => DB_CACHE.tickets.find(t => t.TicketID === id);

// --- HELPER LOOKUPS ---
export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};

// --- ACTIONS ---
export const saveTask = async (task: T.Task) => {
  const newTask = { ...task, TaskID: task.TaskID || `TSK-${Date.now()}` };
  DB_CACHE.tasks.push(newTask);
  return runServer('saveTask', newTask);
};

export const saveMaterial = async (mat: T.Material) => {
  const newMat = { ...mat, MaterialID: mat.MaterialID || `MAT-${Date.now()}` };
  DB_CACHE.materials.push(newMat);
  return runServer('saveMaterial', newMat);
};

// FIXED: Generate SOP ID client-side
export const addSOP = async (title: string, text: string) => {
  const newSop: T.SOP = { 
    SOP_ID: `SOP-${Date.now()}`, 
    SOP_Title: title, 
    Concise_Procedure_Text: text, 
    Google_Doc_Link: '' 
  };
  DB_CACHE.sops.push(newSop);
  await runServer('saveSOP', newSop);
  return newSop;
};

// FIXED: Generate PM ID client-side
export const saveMaintenanceSchedule = async (s: T.MaintenanceSchedule) => {
  const newSchedule = { ...s, PM_ID: s.PM_ID || `PM-${Date.now()}` };
  const idx = DB_CACHE.schedules.findIndex(x => x.PM_ID === newSchedule.PM_ID);
  if (idx >= 0) DB_CACHE.schedules[idx] = newSchedule; else DB_CACHE.schedules.push(newSchedule);
  return runServer('saveSchedule', newSchedule);
};

export const saveTicket = (t: T.Ticket) => runServer('saveTicket', t);
export const submitTicket = (email: string, data: any) => {
    return runServer('saveTicket', { ...data, Submitter_Email: email, Date_Submitted: new Date().toISOString() });
};

export const updateTicketStatus = (id: string, status: string, email?: string, assign?: string) => runServer('updateTicketStatus', id, status, assign);
export const claimTicket = (id: string, email: string) => updateTicketStatus(id, 'Assigned', email, email);

export const saveUser = (u: T.User) => runServer('saveUser', u);
export const deleteUser = (id: string) => runServer('deleteUser', id);
export const saveAsset = (a: T.Asset) => runServer('saveAsset', a);
export const updateAsset = (a: T.Asset) => runServer('saveAsset', a);
export const deleteAsset = (id: string) => runServer('deleteAsset', id);
export const saveCampus = (c: T.Campus) => runServer('saveCampus', c);
export const deleteCampus = (id: string) => runServer('deleteCampus', id);
export const saveBuilding = (b: T.Building) => runServer('saveBuilding', b);
export const deleteBuilding = (id: string) => runServer('deleteBuilding', id);
export const saveLocation = (l: T.Location) => runServer('saveLocation', l);
export const deleteLocation = (id: string) => runServer('deleteLocation', id);
export const saveMapping = (m: T.FieldMapping) => runServer('saveMapping', m);
export const deleteFieldMapping = (id: string) => runServer('deleteMapping', id);

export const fetchSchema = async () => {
  const schema = await runServer('getSchema');
  DB_CACHE.schema = schema;
  return schema;
};
export const addColumnToSheet = (s: string, h: string) => runServer('addColumn', s, h);
export const requestOtp = (e: string) => runServer('requestOtp', e);
export const verifyOtp = (e: string, c: string) => runServer('verifyOtp', e, c);

// --- LEGACY/ADAPTERS ---
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
export const saveRole = (r: any) => runServer('saveRole', r);
export const deleteRole = (id: string) => runServer('deleteRole', id);
export const saveVendor = (v: T.Vendor) => runServer('saveVendor', v);
export const updateVendorStatus = (id: string, s: string) => runServer('saveVendor', { VendorID: id, Status: s });
export const submitBid = (v: string, t: string, a: number, n: string) => runServer('submitBid', { VendorID_Ref: v, TicketID_Ref: t, Amount: a, Notes: n });
export const acceptBid = (id: string, t: string) => runServer('updateBid', { BidID: id, Status: 'Accepted' });
export const addVendorReview = (v: string, t: string, a: string, r: number, c: string) => runServer('saveReview', { VendorID_Ref: v, TicketID_Ref: t, Rating: r, Comment: c });
export const addTicketComment = (id: string, email: string, text: string) => runServer('saveTicket', { TicketID: id, Comments: JSON.stringify([{ Author: email, Text: text }]) }); 
export const toggleTicketPublic = (id: string, v: boolean) => runServer('saveTicket', { TicketID: id, Is_Public: v });
export const mergeTickets = () => console.log("Merge not impl");
export const checkAndGeneratePMTickets = () => 0;
export const deleteSOP = (id: string) => runServer('deleteSOP', id);
export const linkSOPToAsset = (a: string, s: string) => runServer('linkSOP', a, s);
export const updateSOP = (s: T.SOP) => runServer('saveSOP', s);
export const deleteMaintenanceSchedule = (id: string) => runServer('deleteMaintenanceSchedule', id);
export const addBuilding = (c: string, n: string) => runServer('saveBuilding', { CampusID_Ref: c, Building_Name: n });
export const addLocation = (b: string, n: string) => runServer('saveLocation', { BuildingID_Ref: b, Location_Name: n });
export const addAsset = (l: string, n: string) => runServer('saveAsset', { LocationID_Ref: l, Asset_Name: n });
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

// --- PERMISSIONS ---
export const hasPermission = (user: T.User, perm: string): boolean => {
  if (!user) return false;
  if (user.User_Type?.includes('Admin') || user.User_Type?.includes('Chair')) return true;
  return true; 
};

// --- MASTER LIST OF APP FIELDS ---
export const APP_FIELDS: T.AppField[] = [
  // TICKETS
  { id: 'ticket.id', category: 'Ticket', label: 'Ticket ID', description: 'T-XXXX', type: 'text' },
  { id: 'ticket.title', category: 'Ticket', label: 'Title', description: 'Summary', type: 'text' },
  { id: 'ticket.status', category: 'Ticket', label: 'Status', description: 'State', type: 'select' },
  { id: 'ticket.priority', category: 'Ticket', label: 'Priority', description: 'Urgency', type: 'select' },
  { id: 'ticket.submitter', category: 'Ticket', label: 'Submitter Email', description: 'Requester', type: 'text' },
  { id: 'ticket.date', category: 'Ticket', label: 'Date Submitted', description: 'ISO Date', type: 'date' },
  { id: 'ticket.category', category: 'Ticket', label: 'Category', description: 'IT/Facilities', type: 'select' },
  { id: 'ticket.assigned_staff', category: 'Ticket', label: 'Assigned Staff', description: 'Staff Email', type: 'text' },
  { id: 'ticket.public', category: 'Ticket', label: 'Is Public', description: 'Boolean', type: 'boolean' },

  // ASSETS
  { id: 'asset.id', category: 'Asset', label: 'Asset ID', description: 'Unique ID', type: 'text' },
  { id: 'asset.name', category: 'Asset', label: 'Asset Name', description: 'Equipment Name', type: 'text' },
  { id: 'asset.serial', category: 'Asset', label: 'Serial Number', description: 'Manufacturer Serial', type: 'text' },
  { id: 'asset.warranty', category: 'Asset', label: 'Warranty Expires', description: 'Date', type: 'date' },
  { id: 'asset.meter', category: 'Asset', label: 'Last Meter', description: 'Reading', type: 'number' },
  
  // LOCATIONS
  { id: 'location.id', category: 'Location', label: 'Location ID', description: 'LOC-XXXX', type: 'text' },
  { id: 'location.name', category: 'Location', label: 'Location Name', description: 'Room Name', type: 'text' },
  { id: 'location.parent', category: 'Location', label: 'Parent Location Ref', description: 'For sub-rooms', type: 'text' },
  { id: 'location.paint_col', category: 'Location', label: 'Paint Color', description: 'Hex or Name', type: 'text' },
  { id: 'location.floor', category: 'Location', label: 'Floor Type', description: 'Carpet/Tile', type: 'text' },
  { id: 'location.sqft', category: 'Location', label: 'Square Footage', description: 'Area', type: 'number' },

  // PM SCHEDULES
  { id: 'pm.id', category: 'Schedule', label: 'PM ID', description: 'Schedule Unique ID', type: 'text' },
  { id: 'pm.task', category: 'Schedule', label: 'Task Name', description: 'Action to perform', type: 'text' },
  { id: 'pm.next', category: 'Schedule', label: 'Next Due Date', description: 'Date', type: 'date' },
  { id: 'pm.freq', category: 'Schedule', label: 'Frequency', description: 'Daily/Weekly', type: 'select' },
  { id: 'pm.meter_trig', category: 'Schedule', label: 'Meter Trigger', description: 'Run at X usage', type: 'number' },

  // CAMPUS
  { id: 'campus.name', category: 'Campus', label: 'Campus Name', description: 'Main Name', type: 'text' },
  { id: 'campus.phone', category: 'Campus', label: 'Phone Number', description: 'Contact', type: 'text' },
  { id: 'campus.map', category: 'Campus', label: 'Campus Map', description: 'URL to Map', type: 'text' },

  // BUILDING
  { id: 'building.name', category: 'Building', label: 'Building Name', description: 'Name', type: 'text' },
  { id: 'building.plan', category: 'Building', label: 'Floor Plan', description: 'URL/File', type: 'text' },
  { id: 'building.photo', category: 'Building', label: 'Cover Photo', description: 'URL/Image', type: 'text' },

  // VENDOR
  { id: 'vendor.company', category: 'Vendor', label: 'Company Name', description: 'Business Name', type: 'text' },
  { id: 'vendor.contact', category: 'Vendor', label: 'Contact Person', description: 'Name', type: 'text' },
  { id: 'vendor.address', category: 'Vendor', label: 'Address', description: 'Full Address', type: 'text' },
  { id: 'vendor.website', category: 'Vendor', label: 'Website', description: 'URL', type: 'text' },
  
  // INVENTORY
  { id: 'mat.name', category: 'Inventory', label: 'Material Name', description: 'Item Name', type: 'text' },
  { id: 'mat.qty', category: 'Inventory', label: 'Quantity on Hand', description: 'Current Stock', type: 'number' },
  { id: 'mat.cost', category: 'Inventory', label: 'Unit Cost', description: '$ per unit', type: 'number' }
];