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

// --- INITIALIZATION ---
export const initDatabase = async () => {
  try {
    const u = await runServer("getDatabaseData");
    if (u) {
      // MAP SERVER KEYS (CAPS) TO APP STATE (lowercase)
      // We use DB_CACHE here, not 'B'
      DB_CACHE.users = u.USERS || u.Users || [];
      DB_CACHE.campuses = u.CAMPUSES || u.Campuses || [];
      DB_CACHE.buildings = u.BUILDINGS || u.Buildings || [];
      DB_CACHE.locations = u.LOCATIONS || u.Locations || [];
      DB_CACHE.assets = u.ASSETS || u.Assets || [];
      DB_CACHE.tickets = u.TICKETS || u.Tickets || [];
      DB_CACHE.ticketAttachments = u.ATTACHMENTS || u.Ticket_Attachments || [];
      DB_CACHE.sops = u.SOP || u.SOP_Library || [];
      DB_CACHE.schedules = u.SCHEDULES || u.PM_Schedules || [];
      DB_CACHE.assetSopLinks = u.ASSET_SOP || u.Asset_SOP_Link || [];
      DB_CACHE.vendors = u.VENDORS || u.Vendors || [];
      DB_CACHE.bids = u.BIDS || u.Bids || [];
      DB_CACHE.reviews = u.REVIEWS || u.Reviews || [];
      DB_CACHE.roles = u.ROLES || u.Roles || [];
      DB_CACHE.accountRequests = u.REQUESTS || u.Account_Requests || [];

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
export const getTicketsForUser = (user: User) => DB_CACHE.tickets;
export const updateAppConfig = async (newConfig: SiteConfig) => { DB_CACHE.config = newConfig; return runServer('updateConfig', newConfig); };

// --- WRITES ---
export const submitTicket = async (email: string, ticketData: any) => {
  const result = await runServer('saveTicket', { ...ticketData, submitterEmail: email, dateSubmitted: new Date().toISOString() });
  if (result) {
    DB_CACHE.tickets.unshift({ TicketID: result, ...ticketData, Submitter_Email: email, Date_Submitted: new Date().toISOString(), Status: 'New', Comments: [], IsPublic: false } as Ticket);
  }
  return result;
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

// Pass-throughs
export const addBuilding = (c, n) => runServer('addBuilding', c, n);
export const deleteBuilding = (id) => runServer('deleteBuilding', id);
export const addLocation = (b, n) => runServer('addLocation', b, n);
export const deleteLocation = (id) => runServer('deleteLocation', id);
export const addAsset = (l, n) => runServer('addAsset', l, n);
export const updateAsset = (a) => runServer('updateAsset', a);
export const deleteAsset = (id) => runServer('deleteAsset', id);
export const saveMaintenanceSchedule = (s) => runServer('saveMaintenanceSchedule', s);
export const deleteMaintenanceSchedule = (id) => runServer('deleteMaintenanceSchedule', id);
export const addSOP = (t, c) => runServer('saveSOP', { SOP_ID: `SOP-${Date.now()}`, SOP_Title: t, Concise_Procedure_Text: c });
export const updateSOP = (s) => runServer('saveSOP', s);
export const deleteSOP = (id) => runServer('deleteSOP', id);
export const linkSOPToAsset = (a, s) => runServer('linkSOP', a, s);
export const saveUser = (u) => runServer('saveUser', u);
export const deleteUser = (id) => runServer('deleteUser', id);
export const submitAccountRequest = (req) => runServer('submitAccountRequest', req);
export const rejectAccountRequest = (id) => runServer('deleteAccountRequest', id);
export const saveRole = (r) => runServer('saveRole', r);
export const deleteRole = (n) => runServer('deleteRole', n);
export const saveVendor = (v) => runServer('saveVendor', v);
export const updateVendorStatus = (id: string, status: string) => {
  // 1. Update Local Cache immediately so the UI reflects the change
  const vendor = DB_CACHE.vendors.find(v => v.VendorID === id);
  if (vendor) vendor.Status = status as any;
  
  // 2. Send update to Server
  return runServer('saveVendor', { VendorID: id, Status: status });
};
export const registerVendor = (v) => runServer('saveVendor', v);
export const submitBid = (v, t, a, n, f) => runServer('submitBid', { BidID: `BID-${Date.now()}`, VendorID_Ref: v, TicketID_Ref: t, Amount: a, Notes: n, Status: 'Pending', DateSubmitted: new Date().toISOString() });
export const acceptBid = (b, t) => runServer('updateBid', { BidID: b, Status: 'Accepted' });
export const addVendorReview = (v, t, a, r, c) => runServer('saveReview', { ReviewID: `REV-${Date.now()}`, VendorID_Ref: v, TicketID_Ref: t, Author_Email: a, Rating: r, Comment: c, Timestamp: new Date().toISOString() });

// Getters
export const getAllSOPs = () => DB_CACHE.sops;
export const getSOPsForAsset = (id) => DB_CACHE.sops;
export const getAllMaintenanceSchedules = () => DB_CACHE.schedules;
export const getMaintenanceSchedules = (id) => DB_CACHE.schedules.filter(s => s.AssetID_Ref === id);
export const getAccountRequests = () => DB_CACHE.accountRequests;
export const getVendors = () => DB_CACHE.vendors;
export const getVendorHistory = (id) => DB_CACHE.bids.filter(b => b.VendorID_Ref === id);
export const getOpenTicketsForVendors = () => DB_CACHE.tickets.filter(t => t.Status === 'Open for Bid');
export const getVendorTickets = (id) => DB_CACHE.tickets.filter(t => t.Assigned_VendorID_Ref === id);
export const getBidsForTicket = (id) => DB_CACHE.bids.filter(b => b.TicketID_Ref === id);
export const getAttachmentsForBid = (id) => [];
export const getVendorReview = (id) => DB_CACHE.reviews.find(r => r.TicketID_Ref === id);
export const getTicketById = (id) => DB_CACHE.tickets.find(t => t.TicketID === id);
export const claimTicket = (id, email) => runServer('updateTicketStatus', id, 'Assigned', email);
export const updateTicketStatus = (id, status, email, assign) => runServer('updateTicketStatus', id, status, assign);
export const addTicketComment = (id, email, text, isStatus) => runServer('saveTicket', { TicketID: id, Comments: [{ CommentID: `C-${Date.now()}`, Author_Email: email, Text: text, IsStatusChange: isStatus }] });
export const toggleTicketPublic = (id, val) => runServer('saveTicket', { TicketID: id, IsPublic: val });
export const mergeTickets = (t, s, u) => console.log("Merge not fully impl in mock");
export const checkAndGeneratePMTickets = () => 0;
export const lookup = {
  campus: (id) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};
export const getAssetDetails = (id) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getAttachments = (id) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type.includes('Tech'));
// --- PERMISSIONS HELPER ---
export const hasPermission = (user: User, permission: string): boolean => {
  if (!user) return false;

  // 1. Super User Override
  // Admins and Chairs automatically get all permissions
  if (user.User_Type.includes('Admin') || user.User_Type.includes('Chair')) {
    return true;
  }

  // 2. Check Role-Based Permissions
  // User_Type is a comma-separated string (e.g., "Staff, Tech")
  const userRoles = user.User_Type.split(',').map(r => r.trim());
  
  // Get definitions from the local cache
  const definedRoles = getRoles(); 
  
  // Check if ANY of the user's roles contain the required permission
  for (const roleName of userRoles) {
    const roleDef = definedRoles.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions && roleDef.Permissions.includes(permission as any)) {
      return true;
    }
  }

  return false;
};