// src/services/api.ts

// Helper to talk to Google Apps Script
// FIXED: Exported runServer so it can be used by dataService
export const runServer = (fnName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !google.script) {
      console.warn(`[Mock Mode] Call to ${fnName}`, args);
      resolve({ success: true });
      return;
    }
    // @ts-ignore
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fnName](...args);
  });
};

// --- CORE ---
export const getDatabaseData = async () => runServer('getDatabaseData');
export const getSessionUserEmail = async () => runServer('getSessionUserEmail');
export const updateConfig = async (config: any) => runServer('updateConfig', config);
export const getSchema = async () => runServer('getSchema'); // Added

// --- TICKETS ---
export const submitTicket = async (data: any) => runServer('saveTicket', data);
export const updateTicketStatus = async (id: string, status: string, assignedTo?: string) => runServer('saveTicket', { TicketID: id, Status: status, Assigned_Staff: assignedTo });
export const saveTicket = async (data: any) => runServer('saveTicket', data);
export const saveComment = async (data: any) => runServer('saveComment', data); // Added

// --- ASSETS & INFRASTRUCTURE ---
export const saveCampus = async (data: any) => runServer('saveCampus', data);
export const deleteCampus = async (id: string) => runServer('deleteCampus', id);

export const saveBuilding = async (data: any) => runServer('saveBuilding', data);
export const deleteBuilding = async (id: string) => runServer('deleteBuilding', id);

export const saveLocation = async (data: any) => runServer('saveLocation', data);
export const deleteLocation = async (id: string) => runServer('deleteLocation', id);

export const saveAsset = async (data: any) => runServer('saveAsset', data);
export const deleteAsset = async (id: string) => runServer('deleteAsset', id);
export const linkSOP = async (assetId: string, sopId: string) => runServer('linkSOP', assetId, sopId); // Added

// --- USERS & ROLES ---
export const saveUser = async (data: any) => runServer('saveUser', data);
export const deleteUser = async (id: string) => runServer('deleteUser', id);

export const saveRole = async (data: any) => runServer('saveRole', data);
export const deleteRole = async (id: string) => runServer('deleteRole', id);

// --- INVENTORY & VENDORS ---
export const saveMaterial = async (data: any) => runServer('saveMaterial', data);
export const saveVendor = async (data: any) => runServer('saveVendor', data);

// --- OPERATIONS ---
export const saveSOP = async (data: any) => runServer('saveSOP', data);
export const saveSchedule = async (data: any) => runServer('saveSchedule', data);

// --- MAPPINGS ---
export const saveMapping = async (data: any) => runServer('saveMapping', data);
export const deleteMapping = async (id: string) => runServer('deleteMapping', id);
export const addColumnToSheet = async (sheet: string, header: string) => runServer('addColumn', sheet, header);

// --- FILES ---
export const uploadFile = async (file: File, ticketId: string) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const url = await runServer('uploadFile', base64, file.name, file.type, ticketId);
        resolve(url);
      } catch (e) { reject(e); }
    };
    reader.readAsDataURL(file);
  });
};

// --- AUTH ---
export const requestOtp = async (email: string) => runServer('requestOtp', email);
export const verifyOtp = async (email: string, code: string) => runServer('verifyOtp', email, code);