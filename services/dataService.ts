import { Ticket, User, Campus, Building, Location, Asset, MaintenanceSchedule, SOP, TicketAttachment, Vendor, VendorBid, VendorReview, AccountRequest, RoleDefinition, Permission, SiteConfig, AssetSOPLink } from '../types';

// --- LOCAL CACHE STATE ---
// We cache read-only data here so synchronous UI components (like dropdowns) 
// don't need to await server calls for every render.
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
  // New cache items
  bids: [] as VendorBid[],
  reviews: [] as VendorReview[],
  accountRequests: [] as AccountRequest[],
  assetSopLinks: [] as AssetSOPLink[],
  ticketAttachments: [] as TicketAttachment[]
};

// --- THE BRIDGE: Talks to Google Apps Script ---
const runServer = (fnName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !window.google || !window.google.script) {
      console.warn(`[Mock Mode] Call to server function '${fnName}' with args:`, args);
      // Return safe defaults for local dev to prevent crashes
      if (fnName === 'getDatabaseData') resolve({
        users: [], campuses: [], buildings: [], locations: [], assets: [], tickets: [], roles: []
      });
      else if (fnName === 'saveTicket') resolve("T-MOCK-123");
      else resolve(null);
      return;
    }

    // @ts-ignore
    window.google.script.run
      .withSuccessHandler((res) => {
        try {
            // Parse if it's a JSON string, otherwise return as is
            const data = typeof res === 'string' ? JSON.parse(res) : res;
            resolve(data);
        } catch(e) { resolve(res); }
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
      // 1. Core Infrastructure
      B.campuses = u.CAMPUSES || u.Campuses || [];
      B.buildings = u.BUILDINGS || u.Buildings || [];
      B.locations = u.LOCATIONS || u.Locations || [];
      B.assets = u.ASSETS || u.Assets || [];

      // 2. People & Roles
      B.users = u.USERS || u.Users || [];
      B.roles = u.ROLES || u.Roles || [];
      B.accountRequests = u.REQUESTS || u.Account_Requests || [];

      // 3. Workflows
      B.tickets = u.TICKETS || u.Tickets || [];
      B.ticketAttachments = u.ATTACHMENTS || u.Ticket_Attachments || [];
      
      // 4. Operations & Maintenance
      B.sops = u.SOP || u.SOP_Library || [];
      B.schedules = u.SCHEDULES || u.PM_Schedules || [];
      B.assetSopLinks = u.ASSET_SOP || u.Asset_SOP_Link || [];

      // 5. Vendor Management
      B.vendors = u.VENDORS || u.Vendors || [];
      B.bids = u.BIDS || u.Bids || [];
      B.reviews = u.REVIEWS || u.Reviews || [];

      // 6. App Configuration
      if (u.CONFIG) {
        B.config = u.CONFIG;
      }
      
      console.log("Database Loaded:", {
        Users: B.users.length,
        Tickets: B.tickets.length,
        Assets: B.assets.length
      });
      
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to load database:", e);
    return false;
  }
};

// --- READ FUNCTIONS (Synchronous from Cache) ---
export const getCampuses = () => DB_CACHE.campuses;
export const getBuildings = (campusId: string) => DB_CACHE.buildings.filter(b => b.CampusID_Ref === campusId);
export const getLocations = (buildingId: string) => DB_CACHE.locations.filter(l => l.BuildingID_Ref === buildingId);
export const getAssets = (locationId: string) => DB_CACHE.assets.filter(a => a.LocationID_Ref === locationId);
export const getUsers = () => DB_CACHE.users;
export const getRoles = () => DB_CACHE.roles;
export const getAppConfig = () => DB_CACHE.config;

export const updateAppConfig = async (newConfig: SiteConfig) => {
  DB_CACHE.config = newConfig;
  return runServer('updateConfig', newConfig);
};

// --- WRITE FUNCTIONS (Async to Server) ---

export const submitTicket = async (email: string, ticketData: any): Promise<string> => {
  const result = await runServer('saveTicket', { 
    ...ticketData, 
    submitterEmail: email,
    dateSubmitted: new Date().toISOString()
  });
  
  if (result) {
    DB_CACHE.tickets.unshift({
        TicketID: result,
        ...ticketData,
        Submitter_Email: email,
        Date_Submitted: new Date().toISOString(),
        Status: ticketData.status || 'New',
        Comments: [],
        IsPublic: false
    } as Ticket);
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
    reader.onerror = error => reject(error);
  });
};

// --- ASSET MANAGEMENT ---
export const addBuilding = async (campusId: string, name: string) => {
  const newBuilding: Building = { BuildingID: `B-${Date.now()}`, CampusID_Ref: campusId, Building_Name: name };
  DB_CACHE.buildings.push(newBuilding);
  return runServer('addBuilding', campusId, name);
};

export const deleteBuilding = async (id: string) => {
  DB_CACHE.buildings = DB_CACHE.buildings.filter(b => b.BuildingID !== id);
  return runServer('deleteBuilding', id);
};

export const addLocation = async (buildingId: string, name: string) => {
  const newLoc: Location = { LocationID: `L-${Date.now()}`, BuildingID_Ref: buildingId, Location_Name: name };
  DB_CACHE.locations.push(newLoc);
  return runServer('addLocation', buildingId, name);
};

export const deleteLocation = async (id: string) => {
  DB_CACHE.locations = DB_CACHE.locations.filter(l => l.LocationID !== id);
  return runServer('deleteLocation', id);
};

export const addAsset = async (locationId: string, name: string) => {
  const newAsset: Asset = { AssetID: `A-${Date.now()}`, LocationID_Ref: locationId, Asset_Name: name };
  DB_CACHE.assets.push(newAsset);
  return runServer('addAsset', locationId, name);
};

export const updateAsset = async (asset: Asset) => {
  const idx = DB_CACHE.assets.findIndex(a => a.AssetID === asset.AssetID);
  if (idx !== -1) DB_CACHE.assets[idx] = asset;
  return runServer('updateAsset', asset);
};

export const deleteAsset = async (id: string) => {
  DB_CACHE.assets = DB_CACHE.assets.filter(a => a.AssetID !== id);
  return runServer('deleteAsset', id);
};

// --- MAINTENANCE & SOP ---
export const getAllMaintenanceSchedules = () => DB_CACHE.schedules;
export const getMaintenanceSchedules = (assetId: string) => DB_CACHE.schedules.filter(s => s.AssetID_Ref === assetId);

export const saveMaintenanceSchedule = async (schedule: MaintenanceSchedule) => {
  if (!schedule.ScheduleID) schedule.ScheduleID = `SCH-${Date.now()}`;
  const idx = DB_CACHE.schedules.findIndex(s => s.ScheduleID === schedule.ScheduleID);
  if (idx !== -1) DB_CACHE.schedules[idx] = schedule;
  else DB_CACHE.schedules.push(schedule);
  return runServer('saveMaintenanceSchedule', schedule);
};

export const deleteMaintenanceSchedule = async (id: string) => {
  DB_CACHE.schedules = DB_CACHE.schedules.filter(s => s.ScheduleID !== id);
  return runServer('deleteMaintenanceSchedule', id);
};

export const checkAndGeneratePMTickets = (): number => {
    // Client-side mock of a nightly job
    let generated = 0;
    const now = new Date();
    DB_CACHE.schedules.forEach(s => {
        if (new Date(s.NextDue) <= now) {
            generated++;
            // Logic to update NextDue would go here
        }
    });
    return generated;
};

export const getAllSOPs = () => DB_CACHE.sops;
export const getSOPsForAsset = (assetId: string) => {
    const links = DB_CACHE.assetSopLinks.filter(l => l.AssetID_Ref === assetId);
    if (links.length > 0) {
        return DB_CACHE.sops.filter(s => links.some(l => l.SOP_ID_Ref === s.SOP_ID));
    }
    return [];
};

export const addSOP = (title: string, content: string): SOP => {
    const sop: SOP = { SOP_ID: `SOP-${Date.now()}`, SOP_Title: title, Concise_Procedure_Text: content, Google_Doc_Link: '' };
    DB_CACHE.sops.push(sop);
    runServer('saveSOP', sop);
    return sop;
};

export const updateSOP = async (sop: SOP) => {
    const idx = DB_CACHE.sops.findIndex(s => s.SOP_ID === sop.SOP_ID);
    if(idx !== -1) DB_CACHE.sops[idx] = sop;
    return runServer('saveSOP', sop);
};

export const deleteSOP = async (id: string) => {
    DB_CACHE.sops = DB_CACHE.sops.filter(s => s.SOP_ID !== id);
    return runServer('deleteSOP', id);
};

export const linkSOPToAsset = async (assetId: string, sopId: string) => {
    const link: AssetSOPLink = { Link_ID: `LNK-${Date.now()}`, AssetID_Ref: assetId, SOP_ID_Ref: sopId };
    DB_CACHE.assetSopLinks.push(link);
    return runServer('linkSOP', assetId, sopId);
};

// --- USER & ROLE MANAGEMENT ---
export const saveUser = (user: User) => {
    if(!user.UserID) user.UserID = `U-${Date.now()}`;
    const idx = DB_CACHE.users.findIndex(u => u.UserID === user.UserID);
    if(idx !== -1) DB_CACHE.users[idx] = user;
    else DB_CACHE.users.push(user);
    runServer('saveUser', user);
};

export const deleteUser = (id: string) => {
    DB_CACHE.users = DB_CACHE.users.filter(u => u.UserID !== id);
    runServer('deleteUser', id);
};

export const getAccountRequests = () => DB_CACHE.accountRequests;
export const submitAccountRequest = (req: any) => {
    const request: AccountRequest = { RequestID: `REQ-${Date.now()}`, ...req, DateSubmitted: new Date().toISOString(), Status: 'Pending' };
    DB_CACHE.accountRequests.push(request);
    runServer('submitAccountRequest', request);
};

export const approveAccountRequest = (id: string) => { 
  // Normally triggers server logic to create user and notify
  runServer('approveAccountRequest', id);
};

export const rejectAccountRequest = (id: string) => {
    DB_CACHE.accountRequests = DB_CACHE.accountRequests.filter(r => r.RequestID !== id);
    runServer('deleteAccountRequest', id);
};

export const saveRole = (role: RoleDefinition) => {
    const idx = DB_CACHE.roles.findIndex(r => r.RoleName === role.RoleName);
    if(idx !== -1) DB_CACHE.roles[idx] = role;
    else DB_CACHE.roles.push(role);
    runServer('saveRole', role);
};

export const deleteRole = (name: string) => {
    DB_CACHE.roles = DB_CACHE.roles.filter(r => r.RoleName !== name);
    runServer('deleteRole', name);
};

// --- VENDOR MANAGEMENT ---
export const getVendors = () => DB_CACHE.vendors;

export const saveVendor = (vendor: Vendor) => {
    if(!vendor.VendorID) vendor.VendorID = `V-${Date.now()}`;
    const idx = DB_CACHE.vendors.findIndex(v => v.VendorID === vendor.VendorID);
    if (idx !== -1) DB_CACHE.vendors[idx] = vendor;
    else DB_CACHE.vendors.push(vendor);
    runServer('saveVendor', vendor);
};

export const updateVendorStatus = (id: string, status: any) => {
    const v = DB_CACHE.vendors.find(v => v.VendorID === id);
    if(v) { 
      v.Status = status; 
      runServer('saveVendor', v); 
    }
};

export const getVendorHistory = (vendorId: string) => {
    return DB_CACHE.bids.filter(b => b.VendorID_Ref === vendorId).map(b => {
        const ticket = DB_CACHE.tickets.find(t => t.TicketID === b.TicketID_Ref);
        const review = DB_CACHE.reviews.find(r => r.TicketID_Ref === b.TicketID_Ref);
        return { ...b, ticketTitle: ticket?.Title || b.TicketID_Ref, review };
    });
};

export const registerVendor = (data: any) => {
    const v: Vendor = { 
        VendorID: `V-${Date.now()}`, 
        ...data, 
        Status: 'Pending', 
        DateJoined: new Date().toISOString() 
    };
    DB_CACHE.vendors.push(v);
    runServer('saveVendor', v);
};

export const getOpenTicketsForVendors = () => DB_CACHE.tickets.filter(t => t.Status === 'Open for Bid');
export const getVendorTickets = (vendorId: string) => DB_CACHE.tickets.filter(t => t.Assigned_VendorID_Ref === vendorId);

export const submitBid = (vendorId: string, ticketId: string, amount: number, notes: string, files: File[]) => {
    const bid: VendorBid = {
        BidID: `BID-${Date.now()}`,
        VendorID_Ref: vendorId,
        TicketID_Ref: ticketId,
        VendorName: DB_CACHE.vendors.find(v => v.VendorID === vendorId)?.CompanyName || 'Unknown',
        Amount: amount,
        Notes: notes,
        DateSubmitted: new Date().toISOString(),
        Status: 'Pending'
    };
    DB_CACHE.bids.push(bid);
    runServer('submitBid', bid);
};

export const getBidsForTicket = (ticketId: string) => DB_CACHE.bids.filter(b => b.TicketID_Ref === ticketId);
export const getAttachmentsForBid = (bidId: string) => []; // Placeholder for bid attachment logic

export const acceptBid = (bidId: string, ticketId: string) => {
    const bid = DB_CACHE.bids.find(b => b.BidID === bidId);
    if(bid) { 
        bid.Status = 'Accepted'; 
        const ticket = DB_CACHE.tickets.find(t => t.TicketID === ticketId);
        if(ticket) {
            ticket.Assigned_VendorID_Ref = bid.VendorID_Ref;
            ticket.Status = 'Assigned' as any;
            ticket.Assigned_Staff = undefined;
            runServer('saveTicket', ticket);
        }
        runServer('updateBid', bid);
    }
};

export const getVendorReview = (ticketId: string) => DB_CACHE.reviews.find(r => r.TicketID_Ref === ticketId);

export const addVendorReview = (vendorId: string, ticketId: string, author: string, rating: number, comment: string) => {
    const r: VendorReview = { 
        ReviewID: `REV-${Date.now()}`, 
        VendorID_Ref: vendorId, 
        TicketID_Ref: ticketId, 
        Author_Email: author, 
        Rating: rating, 
        Comment: comment, 
        Timestamp: new Date().toISOString() 
    };
    DB_CACHE.reviews.push(r);
    runServer('saveReview', r);
};

// --- TICKET HELPERS ---
export const validateUser = (email: string): User | null => {
  return DB_CACHE.users.find(u => u.Email.toLowerCase() === email.toLowerCase()) || null;
};

export const hasPermission = (user: User, permission: Permission): boolean => {
  const userRoles = user.User_Type.split(',').map(r => r.trim());
  for (const roleName of userRoles) {
    const roleDef = DB_CACHE.roles.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions.includes(permission)) {
      return true;
    }
  }
  return false;
};

export const getTicketsForUser = (user: User): Ticket[] => {
  let tickets = DB_CACHE.tickets;
  const permissions = {
     viewAll: hasPermission(user, 'VIEW_ALL_BIDS'), 
     viewDept: hasPermission(user, 'VIEW_DEPT_TICKETS'),
     viewCampus: hasPermission(user, 'VIEW_CAMPUS_TICKETS')
  };

  return tickets.filter(t => {
    if (t.Submitter_Email === user.Email) return true;
    if (permissions.viewDept && t.Category === user.Department) return true;
    if (permissions.viewCampus && t.CampusID_Ref === (user as any).Campus) return true; 
    return false;
  });
};

export const getTicketById = (id: string) => DB_CACHE.tickets.find(t => t.TicketID === id) || null;

export const claimTicket = async (id: string, email: string) => {
    const t = DB_CACHE.tickets.find(x => x.TicketID === id);
    if(t) {
        t.Status = 'Assigned';
        t.Assigned_Staff = email;
        runServer('saveTicket', t);
    }
};

export const updateTicketStatus = async (id: string, status: string, email: string, assign?: string) => {
     const t = DB_CACHE.tickets.find(x => x.TicketID === id);
     if(t) {
         t.Status = status as any;
         if(assign) t.Assigned_Staff = assign;
         addTicketComment(id, email, `Status updated to ${status}` + (assign ? `, Assigned to ${assign}` : ''), true);
         runServer('saveTicket', t);
     }
};

export const addTicketComment = async (id: string, email: string, text: string, isStatusChange = false) => {
    const t = DB_CACHE.tickets.find(x => x.TicketID === id);
    if(t) {
        t.Comments.push({
            CommentID: `C-${Date.now()}`,
            Author_Email: email,
            Timestamp: new Date().toISOString(),
            Text: text,
            IsStatusChange: isStatusChange
        });
        runServer('saveTicket', t); // Full save for simplicity in this mock
    }
};

export const toggleTicketPublic = async (id: string, val: boolean) => {
     const t = DB_CACHE.tickets.find(x => x.TicketID === id);
     if(t) { t.IsPublic = val; runServer('saveTicket', t); }
};

export const mergeTickets = (targetId: string, sourceId: string, user: string) => {
    const target = getTicketById(targetId);
    const source = getTicketById(sourceId);
    if (target && source) {
        target.Description += `\n\n[Merged from ${sourceId}]: ${source.Description}`;
        source.Status = 'Resolved' as any;
        source.Description += `\n[Merged into ${targetId}]`;
        addTicketComment(targetId, user, `Merged ticket ${sourceId} into this one.`, true);
        runServer('saveTicket', target);
        runServer('saveTicket', source);
    }
};

// --- MOCK / PLACEHOLDERS ---
export const lookup = {
  campus: (id: string) => DB_CACHE.campuses.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => DB_CACHE.buildings.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => DB_CACHE.locations.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id?: string) => DB_CACHE.assets.find(a => a.AssetID === id)?.Asset_Name || 'None',
};
export const getAssetDetails = (id: string) => DB_CACHE.assets.find(a => a.AssetID === id);
export const getAttachments = (id: string) => DB_CACHE.ticketAttachments.filter(a => a.TicketID_Ref === id);
export const getTechnicians = () => DB_CACHE.users.filter(u => u.User_Type.includes('Tech'));
