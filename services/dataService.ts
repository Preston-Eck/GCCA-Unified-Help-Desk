

import { Ticket, User, Campus, Building, Location, Asset, Priority, SiteConfig, TicketComment, SOP, AssetSOPLink, TicketAttachment, Vendor, VendorBid, TicketStatus, VendorReview, AccountRequest, RoleDefinition, Permission, MaintenanceSchedule, Frequency, Department } from '../types';

// --- 1. The Database (Mock Sheets) ---

let APP_CONFIG: SiteConfig = {
  appName: "GCCA Unified Help Desk",
  unauthorizedMessage: "Your email address was not found in the Users database.",
  supportContact: "helpdesk@gcca.edu",
  announcementBanner: ""
};

// --- ROLES & PERMISSIONS DATABASE ---
let ROLES_DB: RoleDefinition[] = [
  {
    RoleName: 'Super Admin',
    Description: 'Full system access including Role Management.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'VIEW_DEPT_TICKETS', 'VIEW_CAMPUS_TICKETS', 'VIEW_ALL_BIDS',
      'MANAGE_ASSETS', 'MANAGE_USERS', 'MANAGE_VENDORS', 'MANAGE_ROLES', 'MANAGE_SETTINGS', 'MANAGE_SOPS', 'MANAGE_SCHEDULES',
      'ASSIGN_TICKETS', 'APPROVE_TICKETS', 'MERGE_TICKETS'
    ]
  },
  {
    RoleName: 'Admin',
    Description: 'System administrator, limited role editing.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'VIEW_DEPT_TICKETS', 'VIEW_ALL_BIDS',
      'MANAGE_ASSETS', 'MANAGE_USERS', 'MANAGE_VENDORS', 'MANAGE_SETTINGS', 'MANAGE_SOPS', 'MANAGE_SCHEDULES',
      'ASSIGN_TICKETS', 'APPROVE_TICKETS', 'MERGE_TICKETS'
    ]
  },
  {
    RoleName: 'Board',
    Description: 'Oversight and Vendor approval.',
    Permissions: [
      'VIEW_DASHBOARD', 'VIEW_ALL_BIDS', 'MANAGE_VENDORS', 'MANAGE_ASSETS', 'MANAGE_USERS'
    ]
  },
  {
    RoleName: 'Chair',
    Description: 'Department Head.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'VIEW_DEPT_TICKETS', 'VIEW_ALL_BIDS',
      'MANAGE_ASSETS', 'MANAGE_VENDORS', 'MANAGE_SOPS', 'MANAGE_SCHEDULES', 'ASSIGN_TICKETS', 'MERGE_TICKETS'
    ]
  },
  {
    RoleName: 'Approver',
    Description: 'Principal or Campus Lead.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'VIEW_CAMPUS_TICKETS', 'VIEW_ALL_BIDS',
      'APPROVE_TICKETS', 'ASSIGN_TICKETS', 'MERGE_TICKETS'
    ]
  },
  {
    RoleName: 'Tech',
    Description: 'Technician.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS', 'CLAIM_TICKETS', 'MANAGE_ASSETS', 'MANAGE_SOPS'
    ]
  },
  {
    RoleName: 'Staff',
    Description: 'Standard employee.',
    Permissions: [
      'VIEW_DASHBOARD', 'SUBMIT_TICKETS', 'VIEW_MY_TICKETS'
    ]
  },
  {
    RoleName: 'Parent',
    Description: 'External user.',
    Permissions: [
      'VIEW_DASHBOARD' // Dashboard logic restricts them to Public Only
    ]
  }
];

export let USERS_DB: User[] = [
  { UserID: 'U1', Email: 'staff@gcca.edu', Name: 'Sarah Staff', User_Type: 'Staff', Department: 'Academics' },
  { UserID: 'U2', Email: 'principal.madison@gcca.edu', Name: 'Principal Madison', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U3', Email: 'principal.mill@gcca.edu', Name: 'Principal Mill', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U4', Email: 'it.chair@gcca.edu', Name: 'IT Chair', User_Type: 'Chair', Department: 'IT' },
  { UserID: 'U5', Email: 'fac.chair@gcca.edu', Name: 'Facilities Chair', User_Type: 'Chair', Department: 'Facilities' },
  { UserID: 'U6', Email: 'tech.bob@gcca.edu', Name: 'Bob The Builder', User_Type: 'Tech', Department: 'Facilities' },
  { UserID: 'U7', Email: 'tech.alice@gcca.edu', Name: 'Alice Network', User_Type: 'Tech', Department: 'IT' },
  { UserID: 'U8', Email: 'admin@gcca.edu', Name: 'General Admin', User_Type: 'Admin', Department: 'IT' },
  { UserID: 'U9', Email: 'board@gcca.edu', Name: 'Board Member', User_Type: 'Board', Department: 'Administration' },
  { UserID: 'U10', Email: 'parent@gcca.edu', Name: 'Jane Parent', User_Type: 'Parent', Department: 'General' },
  { UserID: 'U11', Email: 'super@gcca.edu', Name: 'The Super Admin', User_Type: 'Super Admin', Department: 'IT' },
];

let ACCOUNT_REQUESTS_DB: AccountRequest[] = [
  { RequestID: 'REQ-1', Name: 'New Teacher', Email: 'new.teacher@gcca.edu', RequestedRole: 'Staff', Department: 'Academics', Reason: 'Just hired.', DateSubmitted: new Date().toISOString(), Status: 'Pending' }
];

let CAMPUSES_DB: Campus[] = [
  { CampusID: 'CAMP-MAD', Campus_Name: 'Madison Ave' },
  { CampusID: 'CAMP-MIL', Campus_Name: 'Mill St' },
  { CampusID: 'CAMP-OTH', Campus_Name: 'Offsite' },
];

let BUILDINGS_DB: Building[] = [
  { BuildingID: 'BLD-M-MAIN', CampusID_Ref: 'CAMP-MAD', Building_Name: 'Madison Main Bldg' },
  { BuildingID: 'BLD-M-GYM', CampusID_Ref: 'CAMP-MAD', Building_Name: 'Madison Gym' },
  { BuildingID: 'BLD-MIL-1', CampusID_Ref: 'CAMP-MIL', Building_Name: 'Mill St Edu Center' },
];

let LOCATIONS_DB: Location[] = [
  { LocationID: 'LOC-101', BuildingID_Ref: 'BLD-M-MAIN', Location_Name: 'Room 101' },
  { LocationID: 'LOC-OFF', BuildingID_Ref: 'BLD-M-MAIN', Location_Name: 'Main Office' },
  { LocationID: 'LOC-CRT', BuildingID_Ref: 'BLD-M-GYM', Location_Name: 'Basketball Court' },
  { LocationID: 'LOC-LIB', BuildingID_Ref: 'BLD-MIL-1', Location_Name: 'Library' },
];

let ASSETS_DB: Asset[] = [
  { AssetID: 'AST-PRJ-01', LocationID_Ref: 'LOC-101', Asset_Name: 'Epson Projector', Model_Number: 'EX3240', Serial_Number: 'XF93022', InstallDate: '2023-01-15' },
  { AssetID: 'AST-HVAC-01', LocationID_Ref: 'LOC-OFF', Asset_Name: 'Thermostat Unit A', Model_Number: 'Honeywell T6', Serial_Number: 'HW-992', InstallDate: '2022-11-01' },
  { AssetID: 'AST-PRT-01', LocationID_Ref: 'LOC-LIB', Asset_Name: 'HP LaserJet Pro', Model_Number: 'M404n', Serial_Number: 'VNB3H299', InstallDate: '2023-05-10' },
];

let MAINTENANCE_SCHEDULES_DB: MaintenanceSchedule[] = [
  { ScheduleID: 'SCH-1', AssetID_Ref: 'AST-HVAC-01', TaskName: 'Filter Replacement', Frequency: 'Quarterly', NextDue: new Date(Date.now() - 86400000).toISOString() }, // Due yesterday
  { ScheduleID: 'SCH-2', AssetID_Ref: 'AST-PRJ-01', TaskName: 'Clean Air Intake', Frequency: 'Monthly', NextDue: new Date(Date.now() + 864000000).toISOString() }
];

let SOP_LIBRARY_DB: SOP[] = [
  { SOP_ID: 'SOP-001', SOP_Title: 'Projector Troubleshooting', Concise_Procedure_Text: '1. Check power cable. 2. Clean air filter. 3. Check HDMI connection.', Google_Doc_Link: '#' },
  { SOP_ID: 'SOP-002', SOP_Title: 'Thermostat Reset', Concise_Procedure_Text: 'Hold the Menu button for 5 seconds until "Reset" appears. Select Factory Reset.', Google_Doc_Link: '#' },
  { SOP_ID: 'SOP-003', SOP_Title: 'Printer Jam Clear', Concise_Procedure_Text: 'Open rear door. Pull paper GENTLY upwards. Do not rip.', Google_Doc_Link: '#' },
];

let ASSET_SOP_LINK_DB: AssetSOPLink[] = [
  { Link_ID: 'L1', AssetID_Ref: 'AST-PRJ-01', SOP_ID_Ref: 'SOP-001' },
  { Link_ID: 'L2', AssetID_Ref: 'AST-HVAC-01', SOP_ID_Ref: 'SOP-002' },
  { Link_ID: 'L3', AssetID_Ref: 'AST-PRT-01', SOP_ID_Ref: 'SOP-003' },
];

let VENDORS_DB: Vendor[] = [
  { VendorID: 'V1', CompanyName: 'Rapid Plumbers', ContactName: 'Mario', Email: 'mario@rapidplumbers.com', Phone: '555-0101', ServiceType: 'Facilities', Status: 'Approved', DateJoined: '2023-01-15' },
  { VendorID: 'V2', CompanyName: 'Tech Giants Inc', ContactName: 'Steve', Email: 'steve@techgiants.com', Phone: '555-0102', ServiceType: 'IT', Status: 'Approved', DateJoined: '2023-02-20' },
  { VendorID: 'V3', CompanyName: 'Sparky Electric', ContactName: 'Buzz', Email: 'buzz@sparky.com', Phone: '555-0103', ServiceType: 'Facilities', Status: 'Pending', DateJoined: '2023-10-05' }
];

let VENDOR_BIDS_DB: VendorBid[] = [
  { BidID: 'B1', TicketID_Ref: 'T-1002', VendorID_Ref: 'V1', VendorName: 'Rapid Plumbers', Amount: 150.00, Notes: 'Can fix tomorrow morning.', DateSubmitted: new Date(Date.now() - 40000000).toISOString(), Status: 'Accepted' },
  { BidID: 'B2', TicketID_Ref: 'T-1001', VendorID_Ref: 'V2', VendorName: 'Tech Giants Inc', Amount: 500.00, Notes: 'Replacement bulb service.', DateSubmitted: new Date(Date.now() - 20000000).toISOString(), Status: 'Pending' }
];

let VENDOR_REVIEWS_DB: VendorReview[] = [
  { ReviewID: 'R1', VendorID_Ref: 'V1', TicketID_Ref: 'T-1002', Author_Email: 'principal.madison@gcca.edu', Rating: 5, Comment: 'Excellent work, very fast!', Timestamp: new Date(Date.now() - 30000000).toISOString() }
];

let ATTACHMENTS_DB: TicketAttachment[] = [];

let TICKETS_DB: Ticket[] = [
  {
    TicketID: 'T-1001',
    Date_Submitted: new Date().toISOString(),
    Submitter_Email: 'staff@gcca.edu',
    CampusID_Ref: 'CAMP-MAD',
    BuildingID_Ref: 'BLD-M-MAIN',
    LocationID_Ref: 'LOC-101',
    Related_AssetID_Ref: 'AST-PRJ-01',
    Title: 'Projector Bulb Dim',
    Description: 'Hard to see slides.',
    Category: 'IT',
    Status: 'New',
    Priority: Priority.MEDIUM,
    Assigned_Staff: '',
    Comments: [],
    IsPublic: true,
    AI_Suggested_Plan: 'Replace bulb. Check filter hours.',
    TicketType: 'Incident'
  },
  {
    TicketID: 'T-1002',
    Date_Submitted: new Date(Date.now() - 86400000).toISOString(),
    Submitter_Email: 'staff@gcca.edu',
    CampusID_Ref: 'CAMP-MAD',
    BuildingID_Ref: 'BLD-M-MAIN',
    LocationID_Ref: 'LOC-OFF',
    Title: 'Leaky Faucet',
    Description: 'Drips constantly in the breakroom.',
    Category: 'Facilities',
    Status: TicketStatus.COMPLETED, 
    Priority: Priority.LOW,
    Assigned_Staff: '',
    Assigned_VendorID_Ref: 'V1', 
    Comments: [{
      CommentID: 'C1',
      Author_Email: 'staff@gcca.edu',
      Timestamp: new Date(Date.now() - 86000000).toISOString(),
      Text: 'It is getting worse.'
    }],
    IsPublic: false,
    TicketType: 'Incident'
  },
  {
    TicketID: 'T-1003',
    Date_Submitted: new Date().toISOString(),
    Submitter_Email: 'principal.madison@gcca.edu',
    CampusID_Ref: 'CAMP-MAD',
    BuildingID_Ref: 'BLD-M-GYM',
    LocationID_Ref: 'LOC-CRT',
    Title: 'Floor Resurfacing',
    Description: 'Need competitive bids for gym floor.',
    Category: 'Facilities',
    Status: TicketStatus.OPEN_FOR_BID,
    Priority: Priority.HIGH,
    Comments: [],
    IsPublic: false,
    TicketType: 'Incident'
  }
];

// --- 2. PERMISSIONS LOGIC (PBAC) ---

export const hasPermission = (user: User, permission: Permission): boolean => {
  const userRoles = user.User_Type.split(',').map(r => r.trim());
  for (const roleName of userRoles) {
    const roleDef = ROLES_DB.find(r => r.RoleName === roleName);
    if (roleDef && roleDef.Permissions.includes(permission)) {
      return true;
    }
  }
  return false;
};

// --- Role Management ---
export const getRoles = () => [...ROLES_DB];
export const saveRole = (role: RoleDefinition) => {
  const idx = ROLES_DB.findIndex(r => r.RoleName === role.RoleName);
  if (idx >= 0) ROLES_DB[idx] = role;
  else ROLES_DB.push(role);
};
export const deleteRole = (roleName: string) => { ROLES_DB = ROLES_DB.filter(r => r.RoleName !== roleName); };

// --- Backend Functions ---

export const getAppConfig = (): SiteConfig => ({ ...APP_CONFIG });
export const updateAppConfig = (newConfig: SiteConfig) => { APP_CONFIG = { ...newConfig }; };

export const lookup = {
  campus: (id: string) => CAMPUSES_DB.find(c => c.CampusID === id)?.Campus_Name || id,
  building: (id: string) => BUILDINGS_DB.find(b => b.BuildingID === id)?.Building_Name || id,
  location: (id: string) => LOCATIONS_DB.find(l => l.LocationID === id)?.Location_Name || id,
  asset: (id?: string) => ASSETS_DB.find(a => a.AssetID === id)?.Asset_Name || 'None',
};

// Cascading Dropdown Getters
export const getCampuses = () => CAMPUSES_DB;
export const getBuildings = (campusId: string) => BUILDINGS_DB.filter(b => b.CampusID_Ref === campusId);
export const getLocations = (buildingId: string) => LOCATIONS_DB.filter(l => l.BuildingID_Ref === buildingId);
export const getAssets = (locationId: string) => ASSETS_DB.filter(a => a.LocationID_Ref === locationId);

// Smart Asset Logic
export const getSOPsForAsset = (assetId: string): SOP[] => {
  const links = ASSET_SOP_LINK_DB.filter(link => link.AssetID_Ref === assetId);
  return links.map(link => SOP_LIBRARY_DB.find(sop => sop.SOP_ID === link.SOP_ID_Ref)!).filter(Boolean);
};

export const getAssetDetails = (assetId: string): Asset | undefined => {
  return ASSETS_DB.find(a => a.AssetID === assetId);
};

export const getAttachments = (ticketId: string): TicketAttachment[] => {
  return ATTACHMENTS_DB.filter(a => a.TicketID_Ref === ticketId && !a.BidID_Ref);
};

export const getAttachmentsForBid = (bidId: string): TicketAttachment[] => {
  return ATTACHMENTS_DB.filter(a => a.BidID_Ref === bidId);
}

// --- Asset Management CRUD ---
export const addBuilding = (campusId: string, name: string) => {
  BUILDINGS_DB.push({ BuildingID: `BLD-${Date.now()}`, CampusID_Ref: campusId, Building_Name: name });
};
export const addLocation = (buildingId: string, name: string) => {
  LOCATIONS_DB.push({ LocationID: `LOC-${Date.now()}`, BuildingID_Ref: buildingId, Location_Name: name });
};
export const addAsset = (locationId: string, name: string) => {
  ASSETS_DB.push({ AssetID: `AST-${Date.now()}`, LocationID_Ref: locationId, Asset_Name: name });
};
export const deleteBuilding = (id: string) => { BUILDINGS_DB = BUILDINGS_DB.filter(b => b.BuildingID !== id); };
export const deleteLocation = (id: string) => { LOCATIONS_DB = LOCATIONS_DB.filter(l => l.LocationID !== id); };
export const deleteAsset = (id: string) => { ASSETS_DB = ASSETS_DB.filter(a => a.AssetID !== id); };
export const updateAsset = (asset: Asset) => {
  const idx = ASSETS_DB.findIndex(a => a.AssetID === asset.AssetID);
  if (idx >= 0) ASSETS_DB[idx] = asset;
};

// --- Maintenance Schedule Logic ---
export const getAllMaintenanceSchedules = () => [...MAINTENANCE_SCHEDULES_DB];
export const getMaintenanceSchedules = (assetId: string) => MAINTENANCE_SCHEDULES_DB.filter(s => s.AssetID_Ref === assetId);

export const saveMaintenanceSchedule = (schedule: MaintenanceSchedule) => {
  const idx = MAINTENANCE_SCHEDULES_DB.findIndex(s => s.ScheduleID === schedule.ScheduleID);
  if (idx >= 0) MAINTENANCE_SCHEDULES_DB[idx] = schedule;
  else MAINTENANCE_SCHEDULES_DB.push({ ...schedule, ScheduleID: `SCH-${Date.now()}` });
};

export const deleteMaintenanceSchedule = (id: string) => {
  MAINTENANCE_SCHEDULES_DB = MAINTENANCE_SCHEDULES_DB.filter(s => s.ScheduleID !== id);
};

// --- SOP Logic ---
export const getAllSOPs = () => [...SOP_LIBRARY_DB];

export const addSOP = (title: string, content: string): SOP => {
  const newSOP: SOP = { SOP_ID: `SOP-${Date.now()}`, SOP_Title: title, Concise_Procedure_Text: content, Google_Doc_Link: '#' };
  SOP_LIBRARY_DB.push(newSOP);
  return newSOP;
}

export const updateSOP = (sop: SOP) => {
  const idx = SOP_LIBRARY_DB.findIndex(s => s.SOP_ID === sop.SOP_ID);
  if (idx >= 0) SOP_LIBRARY_DB[idx] = sop;
};

export const deleteSOP = (id: string) => {
  SOP_LIBRARY_DB = SOP_LIBRARY_DB.filter(s => s.SOP_ID !== id);
  ASSET_SOP_LINK_DB = ASSET_SOP_LINK_DB.filter(l => l.SOP_ID_Ref !== id);
};

export const linkSOPToAsset = (assetId: string, sopId: string) => {
  ASSET_SOP_LINK_DB.push({ Link_ID: `LNK-${Date.now()}`, AssetID_Ref: assetId, SOP_ID_Ref: sopId });
}

// Auto-Generate Tickets from Due Schedules
export const checkAndGeneratePMTickets = (): number => {
  let createdCount = 0;
  const now = new Date();
  
  MAINTENANCE_SCHEDULES_DB.forEach(schedule => {
    const dueDate = new Date(schedule.NextDue);
    if (dueDate <= now) {
      // Check if ticket already exists recently? For now, we just create one.
      const asset = getAssetDetails(schedule.AssetID_Ref);
      if (!asset) return;

      const location = LOCATIONS_DB.find(l => l.LocationID === asset.LocationID_Ref);
      const building = BUILDINGS_DB.find(b => b.BuildingID === location?.BuildingID_Ref);

      const newTicket: Ticket = {
        TicketID: `PM-${Date.now()}-${Math.floor(Math.random()*100)}`,
        Date_Submitted: now.toISOString(),
        Submitter_Email: 'System (Maintenance)',
        CampusID_Ref: building?.CampusID_Ref || 'CAMP-MAD',
        BuildingID_Ref: building?.BuildingID,
        LocationID_Ref: location?.LocationID || '',
        Related_AssetID_Ref: asset.AssetID,
        Title: `PM Due: ${schedule.TaskName} - ${asset.Asset_Name}`,
        Description: `Automated maintenance ticket generated from schedule.\nTask: ${schedule.TaskName}\nFrequency: ${schedule.Frequency}`,
        Category: 'Facilities', // Default for assets
        Status: 'New',
        Priority: Priority.MEDIUM,
        Comments: [],
        IsPublic: false,
        TicketType: 'Maintenance',
        AI_Suggested_Plan: `Check linked SOPs for ${schedule.TaskName}.`
      };

      TICKETS_DB.push(newTicket);
      createdCount++;
      
      // Advance NextDue
      const nextDate = new Date(dueDate);
      if (schedule.Frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (schedule.Frequency === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (schedule.Frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      else if (schedule.Frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setDate(nextDate.getDate() + 1); // Daily
      
      schedule.NextDue = nextDate.toISOString();
    }
  });
  
  return createdCount;
};


export const validateUser = (email: string): User | null => {
  return USERS_DB.find(u => u.Email === email) || null;
};

// --- User Management & Tech Assignment ---

export const getUsers = () => [...USERS_DB];

export const getTechnicians = () => {
  return USERS_DB.filter(u => hasPermission(u, 'CLAIM_TICKETS'));
};

export const saveUser = (user: User) => {
  const index = USERS_DB.findIndex(u => u.UserID === user.UserID);
  if (index >= 0) {
    USERS_DB[index] = user;
  } else {
    USERS_DB.push({ ...user, UserID: `U-${Date.now()}` });
  }
};

export const deleteUser = (userId: string) => {
  USERS_DB = USERS_DB.filter(u => u.UserID !== userId);
};

// --- Account Requests ---

export const submitAccountRequest = (req: Omit<AccountRequest, 'RequestID' | 'Status' | 'DateSubmitted'>) => {
  ACCOUNT_REQUESTS_DB.push({
    ...req,
    RequestID: `REQ-${Date.now()}`,
    Status: 'Pending',
    DateSubmitted: new Date().toISOString()
  });
};

export const getAccountRequests = () => ACCOUNT_REQUESTS_DB.filter(r => r.Status === 'Pending');

export const approveAccountRequest = (req: AccountRequest, finalRole: string, finalDept: string) => {
  saveUser({
    UserID: `U-${Date.now()}`,
    Email: req.Email,
    Name: req.Name,
    User_Type: finalRole,
    Department: finalDept
  });
  ACCOUNT_REQUESTS_DB = ACCOUNT_REQUESTS_DB.filter(r => r.RequestID !== req.RequestID);
};

export const rejectAccountRequest = (requestId: string) => {
   ACCOUNT_REQUESTS_DB = ACCOUNT_REQUESTS_DB.filter(r => r.RequestID !== requestId);
};

// --- Vendor Management ---

export const getVendors = () => [...VENDORS_DB];

export const registerVendor = (vendor: Omit<Vendor, 'VendorID' | 'Status' | 'DateJoined'>) => {
  VENDORS_DB.push({
    ...vendor,
    VendorID: `V-${Date.now()}`,
    Status: 'Pending',
    DateJoined: new Date().toISOString()
  });
};

export const updateVendorStatus = (vendorId: string, status: Vendor['Status']) => {
  VENDORS_DB = VENDORS_DB.map(v => v.VendorID === vendorId ? { ...v, Status: status } : v);
};

export const saveVendor = (vendor: Vendor) => {
  const index = VENDORS_DB.findIndex(v => v.VendorID === vendor.VendorID);
  if (index >= 0) {
    VENDORS_DB[index] = vendor;
  }
};

export const getBidsForTicket = (ticketId: string) => {
  return VENDOR_BIDS_DB.filter(b => b.TicketID_Ref === ticketId);
};

export const getVendorHistory = (vendorId: string) => {
  const bids = VENDOR_BIDS_DB.filter(b => b.VendorID_Ref === vendorId);
  return bids.map(bid => {
    const ticket = TICKETS_DB.find(t => t.TicketID === bid.TicketID_Ref);
    const review = VENDOR_REVIEWS_DB.find(r => r.TicketID_Ref === bid.TicketID_Ref && r.VendorID_Ref === vendorId);
    return {
      ...bid,
      ticketTitle: ticket?.Title || 'Unknown Ticket',
      ticketStatus: ticket?.Status || 'Unknown',
      review: review
    };
  }).sort((a, b) => new Date(b.DateSubmitted).getTime() - new Date(a.DateSubmitted).getTime());
};

export const getVendorTickets = (vendorId: string) => {
  return TICKETS_DB.filter(t => t.Assigned_VendorID_Ref === vendorId);
};

export const addVendorReview = (vendorId: string, ticketId: string, authorEmail: string, rating: number, comment: string) => {
  VENDOR_REVIEWS_DB.push({
    ReviewID: `REV-${Date.now()}`,
    VendorID_Ref: vendorId,
    TicketID_Ref: ticketId,
    Author_Email: authorEmail,
    Rating: rating,
    Comment: comment,
    Timestamp: new Date().toISOString()
  });
};

export const getVendorReview = (ticketId: string) => {
  return VENDOR_REVIEWS_DB.find(r => r.TicketID_Ref === ticketId);
};


export const submitBid = (vendorId: string, ticketId: string, amount: number, notes: string, files: File[]) => {
  const vendor = VENDORS_DB.find(v => v.VendorID === vendorId);
  const newBidId = `BID-${Date.now()}`;
  VENDOR_BIDS_DB.push({
    BidID: newBidId,
    TicketID_Ref: ticketId,
    VendorID_Ref: vendorId,
    VendorName: vendor?.CompanyName || 'Unknown Vendor',
    Amount: amount,
    Notes: notes,
    DateSubmitted: new Date().toISOString(),
    Status: 'Pending'
  });
  files.forEach(f => uploadFile(f, ticketId, newBidId));
};

export const acceptBid = (bidId: string, ticketId: string) => {
  const bid = VENDOR_BIDS_DB.find(b => b.BidID === bidId);
  if (!bid) return;
  VENDOR_BIDS_DB = VENDOR_BIDS_DB.map(b => b.BidID === bidId ? { ...b, Status: 'Accepted' } : b);
  updateTicketStatus(ticketId, TicketStatus.ASSIGNED, 'System', 'External Vendor');
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) {
      return { ...t, Assigned_VendorID_Ref: bid.VendorID_Ref };
    }
    return t;
  });
};

export const getOpenTicketsForVendors = () => {
  return TICKETS_DB.filter(t => t.Status === TicketStatus.OPEN_FOR_BID);
};


const uploadFile = (file: File, ticketId: string, bidId?: string) => {
  const mockUrl = URL.createObjectURL(file);
  ATTACHMENTS_DB.push({
    AttachmentID: `ATT-${Date.now()}-${Math.random()}`,
    TicketID_Ref: ticketId,
    BidID_Ref: bidId, 
    File_Name: file.name,
    Drive_URL: mockUrl,
    Mime_Type: file.type
  });
};

export const submitTicket = (
  submitterEmail: string,
  data: {
    campusId: string;
    buildingId: string;
    locationId: string;
    assetId: string;
    category: 'IT' | 'Facilities';
    title: string;
    description: string;
    priority?: Priority;
    files: File[];
  }
): Ticket => {
  let status: Ticket['Status'] = 'New';
  
  if (data.category === 'Facilities') {
    if (data.campusId === 'CAMP-MAD' || data.campusId === 'CAMP-MIL') {
      status = 'Pending Approval';
    }
  }

  const newId = `T-${Math.floor(Math.random() * 10000)}`;

  const newTicket: Ticket = {
    TicketID: newId,
    Date_Submitted: new Date().toISOString(),
    Submitter_Email: submitterEmail,
    CampusID_Ref: data.campusId,
    BuildingID_Ref: data.buildingId,
    LocationID_Ref: data.locationId,
    Related_AssetID_Ref: data.assetId || undefined,
    Title: data.title,
    Description: data.description,
    Category: data.category,
    Status: status,
    Priority: data.priority || Priority.MEDIUM,
    AI_Suggested_Plan: 'Pending Analysis...', 
    Comments: [],
    IsPublic: false,
    TicketType: 'Incident'
  };

  data.files.forEach(f => uploadFile(f, newId));

  TICKETS_DB = [newTicket, ...TICKETS_DB];
  return newTicket;
};

// --- Sub Task Logic ---
export const createSubTask = (parentTicketId: string, title: string, description: string, assignee: string) => {
  const parent = TICKETS_DB.find(t => t.TicketID === parentTicketId);
  if (!parent) return;

  const newId = `TASK-${Math.floor(Math.random() * 10000)}`;
  const subTask: Ticket = {
    ...parent, // Inherit location/category
    TicketID: newId,
    ParentTicketID: parentTicketId,
    TicketType: 'Task',
    Title: `[Task] ${title}`,
    Description: description,
    Assigned_Staff: assignee || undefined,
    Status: assignee ? 'Assigned' : 'New',
    Date_Submitted: new Date().toISOString(),
    Comments: [],
    IsPublic: false
  };
  TICKETS_DB.push(subTask);
  return subTask;
};

export const getSubTasks = (parentTicketId: string) => {
  return TICKETS_DB.filter(t => t.ParentTicketID === parentTicketId);
};


export const mergeTickets = (primaryId: string, duplicateId: string, userEmail: string) => {
  const primary = TICKETS_DB.find(t => t.TicketID === primaryId);
  const duplicate = TICKETS_DB.find(t => t.TicketID === duplicateId);
  if (!primary || !duplicate) throw new Error("Ticket not found");

  ATTACHMENTS_DB = ATTACHMENTS_DB.map(att => {
    if (att.TicketID_Ref === duplicateId) {
      return { ...att, TicketID_Ref: primaryId };
    }
    return att;
  });

  const notesToMove = duplicate.Comments;
  
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === primaryId) {
      return {
        ...t,
        Comments: [
          ...t.Comments,
          ...notesToMove,
          {
            CommentID: `SYS-${Date.now()}`,
            Author_Email: 'System',
            Timestamp: new Date().toISOString(),
            Text: `Ticket ${duplicateId} was merged into this ticket.`,
            IsStatusChange: true
          }
        ]
      };
    }
    if (t.TicketID === duplicateId) {
      return {
        ...t,
        Status: TicketStatus.RESOLVED,
        Comments: [...t.Comments, {
          CommentID: `SYS-${Date.now()}-2`,
          Author_Email: 'System',
          Timestamp: new Date().toISOString(),
          Text: `Merged into ${primaryId} by ${userEmail}.`,
          IsStatusChange: true
        }]
      };
    }
    return t;
  });
}

// --- UPDATED TICKET FETCHING WITH PERMISSIONS ---
export const getTicketsForUser = (user: User): Ticket[] => {
  
  const visibleTickets: Ticket[] = [];
  const handledIds = new Set<string>();

  const addTicket = (t: Ticket) => {
    if (!handledIds.has(t.TicketID)) {
      visibleTickets.push(t);
      handledIds.add(t.TicketID);
    }
  };

  if (hasPermission(user, 'VIEW_DEPT_TICKETS')) {
    TICKETS_DB.filter(t => t.Category === user.Department).forEach(addTicket);
  }

  if (hasPermission(user, 'VIEW_CAMPUS_TICKETS')) {
    let myCampusId = '';
    if (user.Email.includes('madison')) myCampusId = 'CAMP-MAD';
    if (user.Email.includes('mill')) myCampusId = 'CAMP-MIL';
    
    if (myCampusId) {
       TICKETS_DB.filter(t => t.Category === 'Facilities' && t.CampusID_Ref === myCampusId).forEach(addTicket);
    }
  }

  if (hasPermission(user, 'CLAIM_TICKETS')) {
    TICKETS_DB.filter(t => 
      t.Assigned_Staff === user.Email || 
      (t.Category === user.Department && t.Status === 'New' && !t.Assigned_Staff)
    ).forEach(addTicket);
  }

  if (hasPermission(user, 'VIEW_ALL_BIDS')) {
    TICKETS_DB.filter(t => t.Status === TicketStatus.OPEN_FOR_BID).forEach(addTicket);
  }

  TICKETS_DB.filter(t => {
    if (t.Submitter_Email === user.Email) return true;
    if (t.Comments.some(c => c.Author_Email === user.Email)) return true;
    return false;
  }).forEach(addTicket);

  TICKETS_DB.filter(t => t.IsPublic).forEach(addTicket);

  return visibleTickets.sort((a, b) => new Date(b.Date_Submitted).getTime() - new Date(a.Date_Submitted).getTime());
};

export const getTicketById = (id: string): Ticket | undefined => {
  return TICKETS_DB.find(t => t.TicketID === id);
}

// --- Update Functions ---

export const updateTicketStatus = (ticketId: string, status: Ticket['Status'], actorEmail: string, assignedTo?: string) => {
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) {
      const isAssignmentChange = assignedTo && assignedTo !== t.Assigned_Staff;
      const updated = { 
        ...t, 
        Status: status, 
        Assigned_Staff: assignedTo !== undefined ? assignedTo : t.Assigned_Staff 
      };
      const commentText = isAssignmentChange 
        ? `Status updated to ${status}. Assigned to ${assignedTo} by ${actorEmail}.`
        : `Status updated to ${status} by ${actorEmail}.`;

      updated.Comments = [...updated.Comments, {
        CommentID: `LOG-${Date.now()}`,
        Author_Email: 'System',
        Timestamp: new Date().toISOString(),
        Text: commentText,
        IsStatusChange: true
      }];
      return updated;
    }
    return t;
  });
};

export const claimTicket = (ticketId: string, techEmail: string) => {
  updateTicketStatus(ticketId, TicketStatus.ASSIGNED, techEmail, techEmail);
};

export const addTicketComment = (ticketId: string, authorEmail: string, text: string) => {
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) {
      return {
        ...t,
        Comments: [...t.Comments, {
          CommentID: `C-${Date.now()}`,
          Author_Email: authorEmail,
          Timestamp: new Date().toISOString(),
          Text: text,
          IsStatusChange: false
        }]
      };
    }
    return t;
  });
};

export const toggleTicketPublic = (ticketId: string, isPublic: boolean) => {
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) return { ...t, IsPublic: isPublic };
    return t;
  });
};