
import { Ticket, User, Campus, Building, Location, Asset } from '../types';

// --- 1. The Database (Mock Sheets) ---

export const USERS_DB: User[] = [
  { UserID: 'U1', Email: 'staff@gcca.edu', Name: 'Sarah Staff', User_Type: 'Staff', Department: 'Academics' },
  { UserID: 'U2', Email: 'principal.madison@gcca.edu', Name: 'Principal Madison', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U3', Email: 'principal.mill@gcca.edu', Name: 'Principal Mill', User_Type: 'Approver', Department: 'Administration' },
  { UserID: 'U4', Email: 'it.chair@gcca.edu', Name: 'IT Chair', User_Type: 'Chair', Department: 'IT' },
  { UserID: 'U5', Email: 'fac.chair@gcca.edu', Name: 'Facilities Chair', User_Type: 'Chair', Department: 'Facilities' },
  { UserID: 'U6', Email: 'tech.bob@gcca.edu', Name: 'Bob The Builder', User_Type: 'Tech', Department: 'Facilities' },
  { UserID: 'U7', Email: 'tech.alice@gcca.edu', Name: 'Alice Network', User_Type: 'Tech', Department: 'IT' },
];

const CAMPUSES_DB: Campus[] = [
  { CampusID: 'CAMP-MAD', Campus_Name: 'Madison Ave' },
  { CampusID: 'CAMP-MIL', Campus_Name: 'Mill St' },
  { CampusID: 'CAMP-OTH', Campus_Name: 'Offsite' },
];

const BUILDINGS_DB: Building[] = [
  { BuildingID: 'BLD-M-MAIN', CampusID_Ref: 'CAMP-MAD', Building_Name: 'Madison Main Bldg' },
  { BuildingID: 'BLD-M-GYM', CampusID_Ref: 'CAMP-MAD', Building_Name: 'Madison Gym' },
  { BuildingID: 'BLD-MIL-1', CampusID_Ref: 'CAMP-MIL', Building_Name: 'Mill St Edu Center' },
];

const LOCATIONS_DB: Location[] = [
  { LocationID: 'LOC-101', BuildingID_Ref: 'BLD-M-MAIN', Location_Name: 'Room 101' },
  { LocationID: 'LOC-OFF', BuildingID_Ref: 'BLD-M-MAIN', Location_Name: 'Main Office' },
  { LocationID: 'LOC-CRT', BuildingID_Ref: 'BLD-M-GYM', Location_Name: 'Basketball Court' },
  { LocationID: 'LOC-LIB', BuildingID_Ref: 'BLD-MIL-1', Location_Name: 'Library' },
];

const ASSETS_DB: Asset[] = [
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
    Assigned_Staff: ''
  },
  {
    TicketID: 'T-1002',
    Date_Submitted: new Date().toISOString(),
    Submitter_Email: 'staff@gcca.edu',
    CampusID_Ref: 'CAMP-MAD',
    BuildingID_Ref: 'BLD-M-MAIN',
    LocationID_Ref: 'LOC-OFF',
    Title: 'Leaky Faucet',
    Description: 'Drips constantly.',
    Category: 'Facilities',
    Status: 'Pending Approval', // Workflow logic test
    Assigned_Staff: ''
  }
];

// --- 2. Backend Functions (Code.gs equivalents) ---

// Helper to look up names for UI display (joins)
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
  }
): Ticket => {
  let status: Ticket['Status'] = 'New';
  
  // --- WORKFLOW LOGIC ---
  if (data.category === 'Facilities') {
    // Check if Campus is Madison (CAMP-MAD) or Mill (CAMP-MIL)
    if (data.campusId === 'CAMP-MAD' || data.campusId === 'CAMP-MIL') {
      status = 'Pending Approval';
    }
  }
  // IT Logic: Always 'New' (default)

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
    AI_Suggested_Plan: 'Analyzing...', // Placeholder for AI integration
  };

  TICKETS_DB = [newTicket, ...TICKETS_DB];
  return newTicket;
};

export const getTicketsForUser = (user: User): Ticket[] => {
  // --- PERMISSION LOGIC ---
  const roles = user.User_Type.split(',').map(r => r.trim());

  let visibleTickets: Ticket[] = [];
  const handledIds = new Set<string>();

  const addTicket = (t: Ticket) => {
    if (!handledIds.has(t.TicketID)) {
      visibleTickets.push(t);
      handledIds.add(t.TicketID);
    }
  };

  // 1. Chairs see ALL tickets for their Department
  if (roles.includes('Chair')) {
    TICKETS_DB.filter(t => t.Category === user.Department).forEach(addTicket);
  }

  // 2. Approvers see Pending Approval tickets for their SPECIFIC Campus
  if (roles.includes('Approver')) {
    // Infer campus from email/identity logic (For simulation, we map manually)
    let myCampusId = '';
    if (user.Email.includes('madison')) myCampusId = 'CAMP-MAD';
    if (user.Email.includes('mill')) myCampusId = 'CAMP-MIL';

    if (myCampusId) {
      TICKETS_DB.filter(t => 
        t.Status === 'Pending Approval' && 
        t.CampusID_Ref === myCampusId
      ).forEach(addTicket);
    }
  }

  // 3. Techs see Assigned tickets OR Unassigned New tickets in their Dept
  if (roles.includes('Tech')) {
    TICKETS_DB.filter(t => 
      t.Assigned_Staff === user.Email || 
      (t.Category === user.Department && t.Status === 'New' && !t.Assigned_Staff)
    ).forEach(addTicket);
  }

  // 4. Everyone sees their own tickets
  TICKETS_DB.filter(t => t.Submitter_Email === user.Email).forEach(addTicket);

  return visibleTickets.sort((a, b) => new Date(b.Date_Submitted).getTime() - new Date(a.Date_Submitted).getTime());
};

export const updateTicketStatus = (ticketId: string, status: Ticket['Status'], assignedTo?: string) => {
  TICKETS_DB = TICKETS_DB.map(t => {
    if (t.TicketID === ticketId) {
      return { 
        ...t, 
        Status: status, 
        Assigned_Staff: assignedTo !== undefined ? assignedTo : t.Assigned_Staff 
      };
    }
    return t;
  });
};
