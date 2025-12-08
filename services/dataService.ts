import { Ticket, SOP, MaintenanceSchedule, InventoryItem, User, Asset, Campus, Building, Location, SiteConfig, RoleDefinition, KBArticle, AccountRequest, Vendor, Material, Task } from '../types';
import * as API from './api';

// ==========================================
// 1. LOCAL CACHE & NORMALIZATION
// ==========================================
let CACHE: Record<string, any[]> = {
  'Tickets': [], 'SOPs': [], 'Maintenance': [], 'Inventory': [],
  'Campuses': [], 'Buildings': [], 'Locations': [], 'Assets': [],
  'Mappings': [], 'Comments': [], 'Attachments': [],
  'Roles': [], 'Users': [], 'AccountRequests': [], 'Vendors': [],
  'Tasks': [], 'Bids': []
};

let APP_CONFIG: SiteConfig = {
  siteName: 'GCCA Unified Help Desk',
  supportEmail: 'support@gcca.org',
  primaryColor: '#355E3B'
};

// HELPERS: Normalize Backend Data (Sheet Columns) -> Frontend Types
const normalize = (item: any, idField: string) => {
  if (!item) return item;
  const newItem = { ...item, id: item[idField] || item.id };
  
  // --- MAPPING FIXES (Backend -> Frontend) ---
  if (item.Email) newItem.email = item.Email;
  if (item.Name) newItem.name = item.Name;
  if (item.User_Type) newItem.role = item.User_Type;
  if (item.Department) newItem.department = item.Department;
  if (item.Account_Status) newItem.status = item.Account_Status;

  if (item.Date_Submitted) newItem.createdAt = item.Date_Submitted;
  if (item.Submitter_Email) newItem.createdBy = item.Submitter_Email;
  if (item.Status) newItem.status = item.Status;
  if (item.Is_Public) newItem.isPublic = item.Is_Public;
  if (item.Title) newItem.title = item.Title;
  if (item.Description) newItem.description = item.Description;
  if (item.Priority) newItem.priority = item.Priority;
  if (item.Assigned_Staff) newItem.assignedTo = item.Assigned_Staff;

  if (item.Asset_Name) newItem.name = item.Asset_Name;
  if (item.Location_Name) newItem.name = item.Location_Name;
  if (item.Building_Name) newItem.name = item.Building_Name;
  if (item.Campus_Name) newItem.name = item.Campus_Name;

  if (item.Material_Name) newItem.name = item.Material_Name;
  if (item.Quantity_on_Hand) newItem.quantity = item.Quantity_on_Hand;
  if (item.Reorder_Point) newItem.minLevel = item.Reorder_Point;

  return newItem;
};

// HELPERS: Prepare Frontend Data -> Backend Columns
const toBackend = (item: any, idField: string) => {
  const { id, ...rest } = item;
  const backendItem = { ...rest, [idField]: id || item[idField] };
  
  if (item.createdAt) backendItem.Date_Submitted = item.createdAt;
  if (item.createdBy) backendItem.Submitter_Email = item.createdBy;
  if (item.status) backendItem.Status = item.status;
  if (item.email) backendItem.Email = item.email;
  if (item.name) backendItem.Name = item.name;
  if (item.role) backendItem.User_Type = item.role;
  
  return backendItem;
};

// ==========================================
// 2. INIT & SYNC
// ==========================================
export const initDatabase = async () => {
  try {
    const data = await API.getDatabaseData();
    if (!data) {
      console.warn("No data returned from backend (Mock Mode?)");
      return;
    }

    CACHE['Tickets'] = (data.TICKETS || []).map((t: any) => normalize(t, 'TicketID'));
    CACHE['SOPs'] = (data.SOPS || []).map((s: any) => normalize(s, 'SOP_ID'));
    CACHE['Maintenance'] = (data.SCHEDULES || []).map((s: any) => normalize(s, 'PM_ID'));
    CACHE['Inventory'] = (data.MATERIALS || []).map((m: any) => normalize(m, 'MaterialID'));
    CACHE['Campuses'] = (data.CAMPUSES || []).map((c: any) => normalize(c, 'CampusID'));
    CACHE['Buildings'] = (data.BUILDINGS || []).map((b: any) => normalize(b, 'BuildingID'));
    CACHE['Locations'] = (data.LOCATIONS || []).map((l: any) => normalize(l, 'LocationID'));
    CACHE['Assets'] = (data.ASSETS || []).map((a: any) => normalize(a, 'AssetID'));
    CACHE['Users'] = (data.USERS || []).map((u: any) => normalize(u, 'UserID'));
    CACHE['Roles'] = (data.ROLES || []).map((r: any) => normalize(r, 'RoleName')); 
    CACHE['Vendors'] = (data.VENDORS || []).map((v: any) => normalize(v, 'VendorID'));
    CACHE['Mappings'] = (data.MAPPINGS || []).map((m: any) => normalize(m, 'MappingID'));
    CACHE['AccountRequests'] = (data.REQUESTS || []).map((r: any) => normalize(r, 'RequestID'));
    CACHE['Tasks'] = (data.TASKS || []).map((t: any) => normalize(t, 'TaskID'));
    
    if (data.CONFIG && data.CONFIG.length > 0) {
       APP_CONFIG = { ...APP_CONFIG, ...data.CONFIG[0] };
    }

    console.log("Database initialized & normalized:", CACHE);
  } catch (error) {
    console.error("Failed to sync with Google Sheets:", error);
  }
};

// ==========================================
// 3. GENERIC HELPERS (Sync Read, Async Write)
// ==========================================
export const getItems = (listName: string): any[] => {
  return CACHE[listName] || [];
};

const updateCache = (listName: string, item: any, isDelete = false) => {
  const list = CACHE[listName] || [];
  if (isDelete) {
    CACHE[listName] = list.filter(i => i.id !== item.id);
  } else {
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
      CACHE[listName][index] = { ...CACHE[listName][index], ...item };
    } else {
      CACHE[listName].push(item);
    }
  }
};

// ==========================================
// 4. SPECIFIC EXPORTS
// ==========================================

// --- Users & Permissions ---
export const getCurrentUser = async (): Promise<User> => {
  return CACHE['Users'][0] || {} as User;
};

export const getUsers = () => getItems('Users');
export const saveUser = async (user: any) => { updateCache('Users', user); return API.saveUser(toBackend(user, 'UserID')); };
export const deleteUser = async (id: string) => { updateCache('Users', { id }, true); return API.deleteUser(id); };

export const hasPermission = (user: any, permission: string) => {
  if (user?.role?.includes('Admin')) return true;
  return true; 
};

export const getRoles = () => getItems('Roles');
export const saveRole = async (role: any) => { updateCache('Roles', role); return API.saveRole(toBackend(role, 'RoleName')); };
export const deleteRole = async (id: string) => { updateCache('Roles', { id }, true); return API.deleteRole(id); };

// --- Tickets ---
export const getTickets = () => getItems('Tickets');
export const getTicketsForUser = (userId: string) => getItems('Tickets'); 
export const getTicketById = (id: string) => getItems('Tickets').find(t => t.id === id);

export const submitTicket = async (userEmail: string | any, data?: any) => {
  const ticketData = typeof userEmail === 'object' ? userEmail : data;
  const email = typeof userEmail === 'string' ? userEmail : 'unknown@gcca.org';

  const newTicket = { 
    ...ticketData, 
    id: 'T-' + Date.now(), 
    createdBy: email,
    createdAt: new Date().toISOString(),
    status: 'New'
  };
  updateCache('Tickets', newTicket);
  return API.submitTicket(toBackend(newTicket, 'TicketID'));
};

export const updateTicket = async (id: string, data: any) => {
  updateCache('Tickets', { ...data, id });
  return API.saveTicket(toBackend({ ...data, id }, 'TicketID'));
};

export const updateTicketStatus = async (id: string, status: string) => {
  updateCache('Tickets', { id, status }); 
  return API.updateTicketStatus(id, status);
};
export const claimTicket = async (id: string) => API.updateTicketStatus(id, 'Assigned');

// --- Assets ---
export const getCampuses = () => getItems('Campuses');
export const saveCampus = async (c: any) => { updateCache('Campuses', c); return API.saveCampus(toBackend(c, 'CampusID')); };
export const deleteCampus = async (id: string) => { updateCache('Campuses', {id}, true); return API.deleteCampus(id); };

export const getBuildings = (campusId?: string) => {
  const all = getItems('Buildings');
  return campusId ? all.filter(b => b.CampusID_Ref === campusId) : all;
};
export const saveBuilding = async (b: any) => { updateCache('Buildings', b); return API.saveBuilding(toBackend(b, 'BuildingID')); };
export const deleteBuilding = async (id: string) => { updateCache('Buildings', {id}, true); return API.deleteBuilding(id); };
export const addBuilding = async (data: any, name?: string) => {
  const building = name ? { ...data, Building_Name: name, id: 'B-'+Date.now() } : { ...data, id: 'B-'+Date.now() };
  updateCache('Buildings', building);
  return API.saveBuilding(toBackend(building, 'BuildingID'));
};
export const updateBuilding = async (id: string, data: any) => {
  const updated = { ...data, id };
  updateCache('Buildings', updated);
  return API.saveBuilding(toBackend(updated, 'BuildingID'));
};

export const getLocations = (buildingId?: string) => {
  const all = getItems('Locations');
  return buildingId ? all.filter(l => l.BuildingID_Ref === buildingId) : all;
};
export const addLocation = async (buildingId: any, name?: string) => {
  const newItem = typeof buildingId === 'object' 
    ? buildingId 
    : { id: 'L-'+Date.now(), Location_Name: name, BuildingID_Ref: buildingId };
  updateCache('Locations', newItem);
  return API.saveLocation(toBackend(newItem, 'LocationID'));
};
export const deleteLocation = async (id: string) => { updateCache('Locations', {id}, true); return API.deleteLocation(id); };
export const updateLocation = (id: string, data: any) => {
  const item = { ...data, id };
  updateCache('Locations', item);
  return API.saveLocation(toBackend(item, 'LocationID'));
};

export const getAssets = (locationId?: string) => {
  const all = getItems('Assets');
  return locationId ? all.filter(a => a.LocationID_Ref === locationId) : all;
};
export const addAsset = async (locationId: any, name?: string) => {
  const newItem = typeof locationId === 'object'
    ? locationId
    : { id: 'A-'+Date.now(), Asset_Name: name, LocationID_Ref: locationId, status: 'Active' };
  updateCache('Assets', newItem);
  return API.saveAsset(toBackend(newItem, 'AssetID'));
};
export const deleteAsset = async (id: string) => { updateCache('Assets', {id}, true); return API.deleteAsset(id); };
export const updateAsset = (id: string, data: any) => {
  const item = { ...data, id };
  updateCache('Assets', item);
  return API.saveAsset(toBackend(item, 'AssetID'));
};
export const getAssetDetails = async (id: string) => getItems('Assets').find(a => a.id === id);


// --- Inventory & Vendors ---
export const getInventory = () => getItems('Inventory');
export const saveMaterial = async (m: any) => { updateCache('Inventory', m); return API.saveMaterial(toBackend(m, 'MaterialID')); };
// Aliases for compatibility
export const getAllInventory = getInventory;
export const addInventoryItem = async (data: any) => saveMaterial(data);
export const updateInventoryQuantity = async (id: string, q: number) => {}; // Implement if needed
export const updateInventoryItem = async (id: string, data: any) => saveMaterial({ ...data, id });
export const deleteInventoryItem = async (id: string) => {}; 

export const getVendors = () => getItems('Vendors');
export const saveVendor = async (v: any) => { updateCache('Vendors', v); return API.saveVendor(toBackend(v, 'VendorID')); };
export const updateVendorStatus = async (id: string, status: string) => {
  const vendor = CACHE['Vendors'].find(v => v.id === id);
  if (vendor) {
     vendor.Status = status;
     updateCache('Vendors', vendor);
     return API.saveVendor(toBackend(vendor, 'VendorID'));
  }
};
export const getVendorHistory = (id: string) => []; 

// --- Config & Utils ---
export const getAppConfig = () => APP_CONFIG;
export const updateAppConfig = async (cfg: Partial<SiteConfig>) => {
  APP_CONFIG = { ...APP_CONFIG, ...cfg };
  return API.updateConfig(APP_CONFIG);
};

export const lookup = {
  campus: (id: string) => CACHE['Campuses'].find(c => c.id === id)?.Campus_Name || id,
  building: (id: string) => CACHE['Buildings'].find(b => b.id === id)?.Building_Name || id,
  location: (id: string) => CACHE['Locations'].find(l => l.id === id)?.Location_Name || id,
  asset: (id: string) => CACHE['Assets'].find(a => a.id === id)?.Asset_Name || id,
  user: (email: string) => CACHE['Users'].find(u => u.email === email)?.name || email
};

// --- Auth ---
export const requestOtp = async (email: string) => API.requestOtp(email);
export const verifyOtp = async (email: string, code: string) => {
  const result = await API.verifyOtp(email, code);
  return !!result;
};

// --- Operations & Maintenance ---
export const getAllMaintenanceSchedules = () => getItems('Maintenance');
export const getMaintenanceSchedules = getAllMaintenanceSchedules;
export const saveMaintenanceSchedule = async (data: any) => {
  updateCache('Maintenance', data);
  return API.saveSchedule(toBackend(data, 'PM_ID'));
};
export const deleteMaintenanceSchedule = async (id: string) => {}; 
export const checkAndGeneratePMTickets = async () => {};

export const getAccountRequests = () => getItems('AccountRequests');
export const rejectAccountRequest = async (id: string) => {}; 
export const approveAccountRequest = async (id: string) => {}; 

export const getAllSOPs = () => getItems('SOPs');
export const getSOPsForAsset = (id: string) => [];
export const addSOP = async (data: any) => {
  updateCache('SOPs', data);
  return API.saveSOP(toBackend(data, 'SOP_ID'));
};
export const updateSOP = async (id: string, data: any) => {
  const item = { ...data, id };
  updateCache('SOPs', item);
  return API.saveSOP(toBackend(item, 'SOP_ID'));
};
export const deleteSOP = async (id: string) => {};

// --- Task Manager (FIXED) ---
export const getTasks = (ticketId: string) => getItems('Tasks').filter(t => t.TicketID_Ref === ticketId);
export const saveTask = async (task: any) => {
  const newTask = { ...task, id: task.id || 'TSK-' + Date.now() };
  updateCache('Tasks', newTask);
  return API.saveTask(toBackend(newTask, 'TaskID')); 
};

// --- Vendor Portal (RESTORED) ---
export const getOpenTicketsForVendors = () => getItems('Tickets').filter(t => t.status === 'Open' || t.status === 'New');
export const submitBid = async (vendorId: string, ticketId: string, amount: number, notes: string, files: File[]) => {
  console.log("Submitting bid", { vendorId, ticketId, amount });
};
export const registerVendor = async (data: any) => saveVendor({ ...data, Status: 'Pending' });
export const getVendorTickets = (vendorId: string) => getItems('Tickets').filter(t => t.Assigned_Vendor === vendorId);


// --- Generic Wrappers ---
export const addItem = async (list: string, data: any) => {
  if (list === 'SOPs') return addSOP(data);
  if (list === 'Maintenance') return saveMaintenanceSchedule(data);
  return data;
};
export const updateItem = async (list: string, id: string, data: any) => {
  return addItem(list, { ...data, id });
};
export const deleteItem = async (list: string, id: string) => {};


// --- Mapping & Files ---
export const APP_FIELDS = [
  { id: 'ticket.id', label: 'Ticket ID', description: 'Unique identifier' },
  { id: 'ticket.title', label: 'Title', description: 'Issue summary' },
  { id: 'ticket.description', label: 'Description', description: 'Full details' },
  { id: 'ticket.status', label: 'Status', description: 'Open, Closed, etc.' },
  { id: 'ticket.priority', label: 'Priority', description: 'Low, Medium, High' },
  { id: 'ticket.category', label: 'Category', description: 'IT or Facilities' },
  { id: 'ticket.submitter', label: 'Submitter Email', description: 'Email of requester' },
  { id: 'ticket.assigned', label: 'Assigned To', description: 'Tech email' },
  { id: 'location.id', label: 'Location ID', description: 'Room/Area ID' },
  { id: 'asset.id', label: 'Asset ID', description: 'Equipment ID' },
  { id: 'user.name', label: 'User Name', description: 'Full name' },
  { id: 'user.email', label: 'User Email', description: 'Login email' }
];

export const fetchSchema = async () => API.getSchema(); 
export const getMappings = () => getItems('Mappings');

export const saveMapping = async (mapping: any) => {
  if (!mapping.MappingID && !mapping.id) {
     mapping.MappingID = 'MAP-' + Date.now();
  }
  updateCache('Mappings', mapping);
  return API.saveMapping(toBackend(mapping, 'MappingID'));
};

export const deleteFieldMapping = async (id: string) => API.deleteMapping(id);
export const addColumnToSheet = async (s: string, h: string) => API.addColumnToSheet(s, h);

export const uploadFile = async (file: File, ticketId: string) => {
  return API.uploadFile(file, ticketId);
};

export const saveKBArticle = async (d: any) => {};
export const deleteKBArticle = async (id: string) => {};
export const getKBArticles = () => [];

export const addTicketComment = async (id: string, txt: string) => API.saveComment({ TicketID_Ref: id, Comment: txt });
export const toggleTicketPublic = async (id: string, pub: boolean) => {};
export const getAttachments = async (id: string) => [];
export const getBidsForTicket = async (id: string) => [];
export const acceptBid = async (tid: string, bid: string) => {};
export const linkSOPToAsset = async (aid: string, sid: string) => API.linkSOP(aid, sid);