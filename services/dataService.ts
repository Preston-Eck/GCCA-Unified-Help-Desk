
import { Ticket, User, Campus, Building, Location, Asset, Priority, SiteConfig, TicketComment } from '../types';

// --- 1. The Database (Mock Sheets) ---

let APP_CONFIG: SiteConfig = {
  appName: "GCCA Unified Help Desk",
  unauthorizedMessage: "Your email address was not found in the Users database. Please contact the IT Chair or Administration to request access.",
  supportContact: "helpdesk@gcca.edu",
  announcementBanner: ""
};

export const USERS_DB: User[] = [
  { UserID: 'U1', Email: 'staff@gcca.edu', Name: 'Sarah Staff', User_Type: 'Staff', Department: 'Academics' },
  { UserID: 'U2', Email: 'principal.madison@gcca.edu', Name: 'Principal Madison', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U3', Email: 'principal.mill@gcca.edu', Name: 'Principal Mill', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U4', Email: 'it.chair@gcca.edu', Name: 'IT Chair', User_Type: 'Chair', Department: 'IT' },
  { UserID: 'U5', Email: 'fac.chair@gcca.edu', Name: 'Facilities Chair', User_Type: 'Chair', Department: 'Facilities' },
  { UserID: 'U6', Email: 'tech.bob@gcca.edu', Name: 'Bob The Builder', User_Type: 'Tech', Department: 'Facilities' },
  { UserID: 'U7', Email: 'tech.alice@gcca.edu', Name: 'Alice Network', User_Type: 'Tech', Department: 'IT' },
  { UserID: 'U8', Email: 'admin@gcca.edu', Name: 'Super Admin', User_Type: 'Admin, Chair', Department: 'IT' },
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
  { AssetID: 'AST-PRJ-01', LocationID_Ref: 'LOC-101', Asset_Name: 'Epson Projector' },
  { AssetID: 'AST-HVAC-01', LocationID_Ref: 'LOC-OFF', Asset_Name: 'Thermostat Unit A' },
];

// Mutable Tickets Table
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
    IsPublic: false
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
    Status: 'Pending Approval', 
    Priority: Priority.LOW,
    Assigned_Staff: '',
    Comments: [{
      CommentID: 'C1',
      Author_Email: 'staff@gcca.edu',
      Timestamp: new Date(Date.now() - 86000000).toISOString(),
      Text: 'It is getting worse.'
    }],
    IsPublic: false
  },
  {
    TicketID: 'T-1003',
    Date_Submitted: new Date(Date.now() - 172800000).toISOString(),
    Submitter_Email: 'staff@gcca.edu',
    CampusID_Ref: 'CAMP-MIL',
    BuildingID_Ref: 'BLD-MIL-1',
    LocationID_Ref: 'LOC-LIB',
    Title: 'Broken Chair',
    Description: 'Leg snapped off.',
    Category: 'Facilities',
    Status: 'Completed', 
    Priority: Priority.LOW,
    Assigned_Staff: 'tech.bob@gcca.edu',
    Comments: [],
    IsPublic: true
  }
];

// --- 2. Backend Functions ---

export const getAppConfig = (): SiteConfig => {
  return { ...APP_CONFIG };
};

export const updateAppConfig = (newConfig: SiteConfig) => {
  APP_CONFIG = { ...newConfig };
};

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

// --- Asset Management CRUD ---
export const addBuilding = (campusId: string, name: string) => {
  BUILDINGS_DB.push({ 
    BuildingID: `BLD-${Date.now()}`, 
    CampusID_Ref: campusId, 
    Building_Name: name 
  });
};
export const addLocation = (buildingId: string, name: string) => {
  LOCATIONS_DB.push({
    LocationID: `LOC-${Date.now()}`,
    BuildingID_Ref: buildingId,
    Location_Name: name
  });
};
export const addAsset = (locationId: string, name: string) => {
  ASSETS_DB.push({
    AssetID: `AST-${Date.now()}`,
    LocationID_Ref: locationId,
    Asset_Name: name
  });
};
export const deleteBuilding = (id: string) => { BUILDINGS_DB = BUILDINGS_DB.filter(b => b.BuildingID !== id); };
export const deleteLocation = (id: string) => { LOCATIONS_DB = LOCATIONS_DB.filter(l => l.LocationID !== id); };
export const deleteAsset = (id: string) => { ASSETS_DB = ASSETS_DB.filter(a => a.AssetID !== id); };


export const validateUser = (email: string): User | null => {
  return USERS_DB.find(u => u.Email === email) || null;
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
  }
): Ticket => {
  let status: Ticket['Status'] = 'New';
  
  if (data.category === 'Facilities') {
    if (data.campusId === 'CAMP-MAD' || data.campusId === 'CAMP-MIL') {
      status = 'Pending Approval';
    }
  }

  const newTicket: Ticket = {
    TicketID: `T-${Math.floor(Math.random() * 10000)}`,
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
    AI_Suggested_Plan: 'Analyzing...', 
    Comments: [],
    IsPublic: false
  };

  TICKETS_DB = [newTicket, ...TICKETS_DB];
  return newTicket;
};

export const getTicketsForUser = (user: User): Ticket[] => {
  const roles = user.User_Type.split(',').map(r => r.trim());
  const visibleTickets: Ticket[] = [];
  const handledIds = new Set<string>();

  const addTicket = (t: Ticket) => {
    if (!handledIds.has(t.TicketID)) {
      visibleTickets.push(t);
      handledIds.add(t.TicketID);
    }
  };

  // 1. Admin / Chairs see ALL tickets for their Department
  if (roles.includes('Admin')) {
    TICKETS_DB.forEach(addTicket); 
  } else if (roles.includes('Chair')) {
    TICKETS_DB.filter(t => t.Category === user.Department).forEach(addTicket);
  }

  // 2. Approvers: All Facilities tickets for their Campus
  if (roles.includes('Approver')) {
    let myCampusId = '';
    if (user.Email.includes('madison')) myCampusId = 'CAMP-MAD';
    if (user.Email.includes('mill')) myCampusId = 'CAMP-MIL';

    if (myCampusId) {
      TICKETS_DB.filter(t => t.Category === 'Facilities' && t.CampusID_Ref === myCampusId).forEach(addTicket);
    }
  }

  // 3. Techs: Assigned OR Unassigned New in Dept
  if (roles.includes('Tech')) {
    TICKETS_DB.filter(t => 
      t.Assigned_Staff === user.Email || 
      (t.Category === user.Department && t.Status === 'New' && !t.Assigned_Staff)
    ).forEach(addTicket);
  }

  // 4. Everyone: Own Tickets + Interaction History
  TICKETS_DB.filter(t => {
    if (t.Submitter_Email === user.Email) return true;
    // Check history
    if (t.Comments.some(c => c.Author_Email === user.Email)) return true;
    return false;
  }).forEach(addTicket);

  // 5. Public Tickets (Viewable by everyone)
  TICKETS_DB.filter(t => t.IsPublic).forEach(addTicket);

  return visibleTickets.sort((a, b) => new Date(b.Date_Submitted).getTime() - new Date(a.Date_Submitted).getTime());
};

// --- Update Functions ---

export const updateTicketStatus = (ticketId: string, status: Ticket['Status'], actorEmail: string, assignedTo?: string) => {
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) {
      const updated = { 
        ...t, 
        Status: status, 
        Assigned_Staff: assignedTo !== undefined ? assignedTo : t.Assigned_Staff 
      };
      
      // Auto-add system comment
      updated.Comments = [...updated.Comments, {
        CommentID: `LOG-${Date.now()}`,
        Author_Email: 'System',
        Timestamp: new Date().toISOString(),
        Text: `Status updated to ${status} by ${actorEmail}${assignedTo ? `. Assigned to ${assignedTo}` : ''}.`,
        IsStatusChange: true
      }];
      return updated;
    }
    return t;
  });
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
