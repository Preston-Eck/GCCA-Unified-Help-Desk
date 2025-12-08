import { Ticket, SOP, MaintenanceSchedule, InventoryItem, User, Asset, Campus, Building, Location, SiteConfig, RoleDefinition, KBArticle, AccountRequest, Vendor, Material } from '../types';

// ==========================================
// 1. MOCK DATABASE
// ==========================================
const MOCK_DATA: Record<string, any[]> = {
  'Tickets': [],
  'SOPs': [],
  'Maintenance': [],
  'Inventory': [],
  'Campuses': [{ id: 'c1', name: 'Main Campus', code: 'MAIN' }],
  'Buildings': [{ id: 'b1', campusId: 'c1', name: 'Science Hall' }],
  'Locations': [{ id: 'l1', buildingId: 'b1', name: 'Room 101', type: 'Classroom' }],
  'Assets': [{ id: 'a1', name: 'Projector', type: 'AV', locationId: 'l1', status: 'Active' }],
  'Mappings': [], 
  'Comments': [],
  'Attachments': [],
  'Roles': [
    { id: 'r1', name: 'Admin', description: 'Full Access', permissions: ['all'], isSystem: true },
    { id: 'r2', name: 'User', description: 'Standard Access', permissions: ['read'], isSystem: true }
  ],
  'KBArticles': [],
  'Users': [
     { id: 'u1', name: 'Demo User', email: 'demo@gcca.org', role: 'Admin', department: 'IT', status: 'Active' }
  ],
  'AccountRequests': [],
  'Vendors': []
};

// ==========================================
// 2. GENERIC HELPERS
// ==========================================
export const getItems = async (listName: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_DATA[listName] || [];
};

export const addItem = async (listName: string, item: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
  if (!MOCK_DATA[listName]) MOCK_DATA[listName] = [];
  MOCK_DATA[listName].push(newItem);
  return newItem;
};

export const updateItem = async (listName: string, id: string, updates: any): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const list = MOCK_DATA[listName] || [];
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) list[index] = { ...list[index], ...updates };
};

export const deleteItem = async (listName: string, id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  if (MOCK_DATA[listName]) {
    MOCK_DATA[listName] = MOCK_DATA[listName].filter(i => i.id !== id);
  }
};

// ==========================================
// 3. SPECIFIC EXPORTS
// ==========================================

// --- Users & Permissions ---
export const getCurrentUser = async (): Promise<User> => {
  return { id: '123', name: 'Demo User', email: 'demo@gcca.org', role: 'Admin', department: 'IT' };
};

export const getTechnicians = async () => [
  { id: 't1', name: 'Mike Tech', email: 'mike@gcca.org' },
  { id: 't2', name: 'Sarah Tech', email: 'sarah@gcca.org' }
];

export const hasPermission = (user: any, permission: string) => true;

export const lookup = {
  campus: async (q: string) => getItems('Campuses'),
  building: async (q: string) => getItems('Buildings'),
  location: async (q: string) => getItems('Locations'),
  asset: async (q: string) => getItems('Assets'),
  user: async (q: string) => [{ id: 'u1', name: 'User 1' }]
};

// --- Tickets ---
export const submitTicket = async (arg1: string | any, arg2?: any): Promise<any> => {
  if (typeof arg1 === 'string') return addItem(arg1, arg2);
  return addItem('Tickets', arg1);
};
export const getTickets = () => getItems('Tickets');

export const getTicketsForUser = async (userId: string) => getItems('Tickets');

export const getTicketById = async (id: string) => {
    const tickets = await getItems('Tickets');
    return tickets.find(t => t.id === id);
};

export const updateTicket = (id: string, data: any, user?: any, comment?: string) => {
  return updateItem('Tickets', id, data);
};
export const deleteTicket = (id: string) => deleteItem('Tickets', id);

export const updateTicketStatus = (id: string, status: string) => updateItem('Tickets', id, { status });
export const addTicketComment = (ticketId: string, comment: string) => addItem('Comments', { ticketId, comment, date: new Date() });
export const toggleTicketPublic = (id: string, isPublic: boolean) => updateItem('Tickets', id, { isPublic });
export const getAttachments = async (ticketId: string) => [];
export const claimTicket = (id: string) => updateItem('Tickets', id, { assignedTo: 'Current User' });
export const getBidsForTicket = async (ticketId: string) => [];
export const acceptBid = async (ticketId: string, bidId: string) => updateItem('Tickets', ticketId, { status: 'Bid Accepted' });

// --- SOPs ---
export const getAllSOPs = () => getItems('SOPs');
export const saveSOP = (sop: any) => sop.id ? updateItem('SOPs', sop.id, sop) : addItem('SOPs', sop);
export const deleteSOP = (id: string) => deleteItem('SOPs', id);
export const updateSOP = (id: string, data: any) => updateItem('SOPs', id, data);
export const getSOPsForAsset = async (assetId: string) => [];
export const linkSOPToAsset = async (sopId: string, assetId: string) => {};
export const addSOP = (data: any) => addItem('SOPs', data);

// --- Maintenance ---
export const getAllMaintenanceSchedules = () => getItems('Maintenance');
export const getMaintenanceSchedules = () => getItems('Maintenance');
export const saveMaintenanceSchedule = (schedule: any) => schedule.id ? updateItem('Maintenance', schedule.id, schedule) : addItem('Maintenance', schedule);
export const deleteMaintenanceSchedule = (id: string) => deleteItem('Maintenance', id);
export const checkAndGeneratePMTickets = async () => {};

// --- Inventory ---
export const getAllInventory = () => getItems('Inventory');
export const addInventoryItem = (item: any) => addItem('Inventory', item);
export const updateInventoryQuantity = (id: string, qty: number) => updateItem('Inventory', id, { quantity: qty });
export const updateInventoryItem = (id: string, data: any) => updateItem('Inventory', id, data);
export const deleteInventoryItem = (id: string) => deleteItem('Inventory', id);

// Alias for InventoryManager
export const getInventory = () => getItems('Inventory');
export const saveMaterial = (mat: any) => mat.id ? updateItem('Inventory', mat.id, mat) : addItem('Inventory', mat);


// --- Asset Manager Specifics ---
export const getCampuses = (query?: any) => getItems('Campuses');

export const saveCampus = (campus: any) => {
    return campus.id ? updateItem('Campuses', campus.id, campus) : addItem('Campuses', campus);
};

export const deleteCampus = (id: string) => deleteItem('Campuses', id);

export const getBuildings = (campusId?: string) => getItems('Buildings');
export const getLocations = (buildingId?: string) => getItems('Locations');
export const getAssets = (locationId?: string) => getItems('Assets');

export const addBuilding = (arg1: any, arg2?: any) => {
  const data = arg2 ? arg2 : arg1; 
  return addItem('Buildings', data);
};
export const addLocation = (arg1: any, arg2?: any) => {
  const data = arg2 ? arg2 : arg1;
  return addItem('Locations', data);
};
export const addAsset = (arg1: any, arg2?: any) => {
  const data = arg2 ? arg2 : arg1;
  return addItem('Assets', data);
};

export const updateBuilding = (id: string, data: any) => updateItem('Buildings', id, data);
export const updateLocation = (id: string, data: any) => updateItem('Locations', id, data);
export const updateAsset = (id: string, data: any) => updateItem('Assets', id, data);

export const deleteBuilding = (id: string) => deleteItem('Buildings', id);
export const deleteLocation = (id: string) => deleteItem('Locations', id);
export const deleteAsset = (id: string) => deleteItem('Assets', id);

export const getAssetDetails = async (id: string) => {
  const assets = await getItems('Assets');
  return assets.find(a => a.id === id);
};

// --- Files ---
export const uploadFile = async (file: File) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    url: URL.createObjectURL(file),
    type: file.type
  };
};

// --- Schema Mapping ---

export const APP_FIELDS = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'text', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
  { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { key: 'assignedTo', label: 'Assigned To', type: 'user' },
  { key: 'dueDate', label: 'Due Date', type: 'date' }
];

export const fetchSchema = async (sheetId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: 'col1', name: 'Ticket Name', type: 'text' },
    { id: 'col2', name: 'Details', type: 'text' },
    { id: 'col3', name: 'Severity', type: 'text' },
    { id: 'col4', name: 'Date Created', type: 'date' }
  ];
};

export const getMappings = async (sheetId: string) => getItems('Mappings');

export const saveMapping = (mapping: any) => {
  return mapping.id ? updateItem('Mappings', mapping.id, mapping) : addItem('Mappings', mapping);
};

export const deleteFieldMapping = (id: string) => deleteItem('Mappings', id);

export const addColumnToSheet = async (sheetId: string, columnName: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { id: Math.random().toString(), name: columnName };
};

// --- Admin Config ---

let MOCK_CONFIG: SiteConfig = {
    siteName: 'GCCA Unified Help Desk',
    supportEmail: 'support@gcca.org',
    primaryColor: '#2563eb'
};

export const getAppConfig = async (): Promise<SiteConfig> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_CONFIG;
};

export const updateAppConfig = async (config: Partial<SiteConfig>): Promise<SiteConfig> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    MOCK_CONFIG = { ...MOCK_CONFIG, ...config };
    return MOCK_CONFIG;
};

// --- Auth ---

export const requestOtp = async (email: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`OTP requested for ${email}`);
};

export const verifyOtp = async (email: string, otp: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: 'u1',
    name: 'Demo User',
    email: email,
    role: 'Admin',
    department: 'IT'
  };
};

// --- Role Management ---

export const getRoles = () => getItems('Roles');

export const saveRole = (role: any) => {
  return role.id ? updateItem('Roles', role.id, role) : addItem('Roles', role);
};

export const deleteRole = (id: string) => deleteItem('Roles', id);

// --- Knowledge Base ---

export const getKBArticles = () => getItems('KBArticles');

export const saveKBArticle = (article: any) => {
  return article.id ? updateItem('KBArticles', article.id, article) : addItem('KBArticles', article);
};

export const deleteKBArticle = (id: string) => deleteItem('KBArticles', id);

// --- User Management & Account Requests ---

export const getUsers = () => getItems('Users');

export const saveUser = (user: any) => {
  return user.id ? updateItem('Users', user.id, user) : addItem('Users', user);
};

export const deleteUser = (id: string) => deleteItem('Users', id);

export const getAccountRequests = () => getItems('AccountRequests');

export const rejectAccountRequest = (id: string) => updateItem('AccountRequests', id, { status: 'Rejected' });

export const approveAccountRequest = (id: string) => updateItem('AccountRequests', id, { status: 'Approved' });

// --- Vendor Management ---

export const getVendors = () => getItems('Vendors');

export const saveVendor = (vendor: any) => {
  return vendor.id ? updateItem('Vendors', vendor.id, vendor) : addItem('Vendors', vendor);
};

export const updateVendorStatus = (id: string, status: string) => updateItem('Vendors', id, { status });

export const getVendorHistory = async (id: string) => [];

// --- Init Database (FIXED: Added this missing export) ---

export const initDatabase = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Database initialized with mock data');
};