import { Ticket, User, Campus, Building, Location, Asset, MaintenanceSchedule, SOP, TicketAttachment, Vendor, VendorBid, VendorReview, AccountRequest, RoleDefinition, SiteConfig, AssetSOPLink, FieldMapping, AppField } from '../types';

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
  ticketAttachments: [] as TicketAttachment[],
  mappings: [] as FieldMapping[],
  schema: {} as Record<string, string[]>
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

// --- HELPER: NORMALIZE EMAIL ---
const normEmail = (email: string) => email ? email.trim().toLowerCase() : '';

// --- INITIALIZATION ---
export const initDatabase = async () => {
  try {
    const u = await runServer("getDatabaseData");
    if (u) {
      DB_CACHE.users = (u.USERS || []).map((user: User) => ({ ...user, Email: normEmail(user.Email) }));
      DB_CACHE.campuses = u.CAMPUSES || [];
      DB_CACHE.buildings = u.BUILDINGS || [];
      DB_CACHE.locations = u.LOCATIONS || [];
      DB_CACHE.assets = u.ASSETS || [];
      DB_CACHE.mappings = u.MAPPINGS || u.Data_Mapping || [];

      // Safe Ticket Parsing
      DB_CACHE.tickets = (u.TICKETS || []).map((t: any) => {
          let comments = [];
          try {
              if (typeof t.Comments === 'string' && t.Comments.startsWith('[')) {
                  comments = JSON.parse(t.Comments);
              } else if (Array.isArray(t.Comments)) {
                  comments = t.Comments;
              }
          } catch (e) { console.warn("Comment parse error", t.TicketID); }
          return { ...t, Comments: comments };
      });

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

      // Prepopulate mappings if empty
      if (DB_CACHE.mappings.length === 0) {
         console.log("No mappings found. Prepopulating defaults...");
         await prepopulateMappings();
      }
      
      console.log("Database Loaded. Users found:", DB_CACHE.users.length);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to load database:", e);
    return false;
  }
};

// --- GETTERS ---
export const getCampuses = () => DB_CACHE.campuses;
export const getBuildings = (campusId: string) => DB_CACHE.buildings.filter(b => b.CampusID_Ref === campusId);
export const getLocations = (buildingId: string) => DB_CACHE.locations.filter(l => l.BuildingID_Ref === buildingId);
export const getAssets = (locationId: string) => DB_CACHE.assets.filter(a => a.LocationID_Ref === locationId);
export const getUsers = () => DB_CACHE.users;
export const getRoles = () => DB_CACHE.roles;
export const getAppConfig = () => DB_CACHE.config;
export const getTicketsForUser = (user: User) => DB_CACHE.tickets;
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
export const getAssetDetails = (id: string) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getAttachments = (id: string) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type && u.User_Type.includes('Tech')); 

export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};

// --- WRITES & ACTIONS ---

export const updateAppConfig = async (newConfig: SiteConfig) => { DB_CACHE.config = newConfig; return runServer('updateConfig', newConfig); };

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
    AI_Questions: '',
    Comments: JSON.stringify([])
  };

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
    const normalizedEmail = normEmail(u.Email);
    const finalID = u.UserID || `U-${Date.now()}`;
    const userToSave = { ...u, UserID: finalID, Email: normalizedEmail };
    const idx = DB_CACHE.users.findIndex(existing => existing.UserID === finalID);
    if (idx >= 0) DB_CACHE.users[idx] = userToSave;
    else DB_CACHE.users.push(userToSave);
    return runServer('saveUser', userToSave);
};

export const deleteUser = (id: string) => {
    DB_CACHE.users = DB_CACHE.users.filter(u => u.UserID !== id);
    return runServer('deleteUser', id);
};

export const saveRole = (r: RoleDefinition) => {
    const idx = DB_CACHE.roles.findIndex(role => role.RoleName === r.RoleName);
    if(idx !== -1) DB_CACHE.roles[idx] = r;
    else DB_CACHE.roles.push(r);
    return runServer('saveRole', { RoleName: r.RoleName, Description: r.Description, Permissions: r.Permissions.join(',') });
};
export const deleteRole = (n: string) => {
    DB_CACHE.roles = DB_CACHE.roles.filter(r => r.RoleName !== n);
    return runServer('deleteRole', n);
};

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
export const saveMaintenanceSchedule = (s: MaintenanceSchedule) => {
    DB_CACHE.schedules = DB_CACHE.schedules.filter(sch => sch.ScheduleID !== s.ScheduleID);
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

export const submitAccountRequest = (req: any) => runServer('submitAccountRequest', req);
export const rejectAccountRequest = (id: string) => {
    DB_CACHE.accountRequests = DB_CACHE.accountRequests.filter(r => r.RequestID !== id);
    return runServer('deleteAccountRequest', id);
};

export const saveVendor = (v: Vendor) => {
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

// --- TICKET ACTIONS ---
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

// --- PERMISSIONS HELPER ---
export const hasPermission = (user: User, permission: string): boolean => {
  if (!user) return false;
  if (user.User_Type && (user.User_Type.includes('Admin') || user.User_Type.includes('Chair'))) return true;
  const userRoles = user.User_Type ? user.User_Type.split(',').map(r => r.trim()) : [];
  const definedRoles = getRoles(); 
  for (const roleName of userRoles) {
    const roleDef = definedRoles.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions && roleDef.Permissions.includes(permission as any)) return true;
  }
  return false;
};
// --- SECURE AUTH ---
export const requestOtp = (email: string) => runServer('requestOtp', email);
export const verifyOtp = (email: string, code: string) => runServer('verifyOtp', email, code);

// --- SCHEMA & MAPPING ---

// 1. Fetch live headers from Spreadsheet
export const fetchSchema = async () => {
  const schema = await runServer('getSchema');
  DB_CACHE.schema = schema;
  return schema;
};

// 2. Define Known App Fields (The "User Inputs")
export const APP_FIELDS: AppField[] = [
  // --- TICKETS ---
  { id: 'ticket.id', label: 'Ticket ID', description: 'Unique Identifier (T-XXXX)', type: 'text' },
  { id: 'ticket.date', label: 'Date Submitted', description: 'ISO Date String', type: 'date' },
  { id: 'ticket.submitter', label: 'Submitter Email', description: 'Email of requester', type: 'text' },
  { id: 'ticket.title', label: 'Title', description: 'Short summary of issue', type: 'text' },
  { id: 'ticket.desc', label: 'Description', description: 'Full details of issue', type: 'text' },
  { id: 'ticket.category', label: 'Category', description: 'IT or Facilities', type: 'select' },
  { id: 'ticket.status', label: 'Status', description: 'New, Assigned, etc.', type: 'select' },
  { id: 'ticket.priority', label: 'Priority', description: 'Critical, High, Medium, Low', type: 'select' },
  { id: 'ticket.campus', label: 'Campus ID', description: 'Link to Campus', type: 'text' },
  { id: 'ticket.building', label: 'Building ID', description: 'Link to Building', type: 'text' },
  { id: 'ticket.location', label: 'Location ID', description: 'Link to Location', type: 'text' },
  { id: 'ticket.asset', label: 'Asset ID', description: 'Link to specific Asset', type: 'text' },
  { id: 'ticket.assigned_staff', label: 'Assigned Staff', description: 'Email of staff member', type: 'text' },
  { id: 'ticket.assigned_vendor', label: 'Assigned Vendor', description: 'ID of external vendor', type: 'text' },
  { id: 'ticket.public', label: 'Is Public?', description: 'Boolean flag', type: 'boolean' },
  { id: 'ticket.ai_plan', label: 'AI Plan', description: 'Generated suggestions', type: 'text' },
  { id: 'ticket.comments', label: 'Comments', description: 'JSON string of history', type: 'text' },

  // --- USERS ---
  { id: 'user.id', label: 'User ID', description: 'Unique Identifier', type: 'text' },
  { id: 'user.name', label: 'Full Name', description: 'User Display Name', type: 'text' },
  { id: 'user.email', label: 'Email', description: 'Login Email', type: 'text' },
  { id: 'user.roles', label: 'Roles', description: 'Comma-separated roles', type: 'text' },
  { id: 'user.dept', label: 'Department', description: 'Comma-separated depts', type: 'text' },

  // --- ASSETS ---
  { id: 'asset.id', label: 'Asset ID', description: 'Unique Identifier', type: 'text' },
  { id: 'asset.name', label: 'Asset Name', description: 'Equipment Name', type: 'text' },
  { id: 'asset.model', label: 'Model Number', description: 'Manufacturer Model', type: 'text' },
  { id: 'asset.serial', label: 'Serial Number', description: 'Unique Serial', type: 'text' },
  { id: 'asset.install_date', label: 'Install Date', description: 'Date installed', type: 'date' },
  { id: 'asset.location', label: 'Location Ref', description: 'Link to Location', type: 'text' },

  // --- VENDORS ---
  { id: 'vendor.id', label: 'Vendor ID', description: 'Unique Identifier', type: 'text' },
  { id: 'vendor.company', label: 'Company Name', description: 'Business Name', type: 'text' },
  { id: 'vendor.contact', label: 'Contact Person', description: 'Rep Name', type: 'text' },
  { id: 'vendor.email', label: 'Contact Email', description: 'Rep Email', type: 'text' },
  { id: 'vendor.phone', label: 'Phone', description: 'Contact Phone', type: 'text' },
  { id: 'vendor.type', label: 'Service Type', description: 'IT, Facilities, etc.', type: 'select' },
  { id: 'vendor.status', label: 'Status', description: 'Approved/Pending', type: 'select' },

  // --- SCHEDULES ---
  { id: 'schedule.id', label: 'Schedule ID', description: 'Unique Identifier', type: 'text' },
  { id: 'schedule.task', label: 'Task Name', description: 'Name of PM Task', type: 'text' },
  { id: 'schedule.asset', label: 'Asset Ref', description: 'Link to Asset', type: 'text' },
  { id: 'schedule.freq', label: 'Frequency', description: 'Daily, Weekly, etc.', type: 'select' },
  { id: 'schedule.next', label: 'Next Due', description: 'Date string', type: 'date' },
  { id: 'schedule.last', label: 'Last Done', description: 'Date string', type: 'date' },
];

export const getMappings = () => DB_CACHE.mappings;

export const saveFieldMapping = async (mapping: FieldMapping) => {
  const newMapping = { ...mapping, MappingID: mapping.MappingID || `MAP-${Date.now()}` };
  
  // Optimistic update
  const idx = DB_CACHE.mappings.findIndex(m => m.MappingID === newMapping.MappingID);
  if (idx >= 0) DB_CACHE.mappings[idx] = newMapping;
  else DB_CACHE.mappings.push(newMapping);
  
  return runServer('saveMapping', newMapping);
};

export const deleteFieldMapping = async (id: string) => {
  DB_CACHE.mappings = DB_CACHE.mappings.filter(m => m.MappingID !== id);
  return runServer('deleteMapping', id);
};

export const addColumnToSheet = async (sheet: string, header: string) => {
  return runServer('addColumn', sheet, header);
};

// 3. Prepopulation Logic
const prepopulateMappings = async () => {
  const defaults = [
    { SheetName: 'Tickets', SheetHeader: 'Title', AppFieldID: 'ticket.title' },
    { SheetName: 'Tickets', SheetHeader: 'Description', AppFieldID: 'ticket.description' },
    { SheetName: 'Tickets', SheetHeader: 'Status', AppFieldID: 'ticket.status' },
    { SheetName: 'Tickets', SheetHeader: 'Priority', AppFieldID: 'ticket.priority' },
    { SheetName: 'Users', SheetHeader: 'Name', AppFieldID: 'user.name' },
    { SheetName: 'Users', SheetHeader: 'Email', AppFieldID: 'user.email' },
    { SheetName: 'Assets', SheetHeader: 'Asset_Name', AppFieldID: 'asset.name' },
  ];

  for (const def of defaults) {
    await saveFieldMapping({
      MappingID: `MAP-DEF-${Math.floor(Math.random() * 10000)}`,
      SheetName: def.SheetName,
      SheetHeader: def.SheetHeader,
      AppFieldID: def.AppFieldID,
      Description: 'Auto-generated default'
    });
  }
};