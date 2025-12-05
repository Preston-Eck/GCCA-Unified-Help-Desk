import { Ticket, User, Campus, Building, Location, Asset, Vendor, TicketStatus } from '../types';

// Helper to wrap google.script.run in a Promise
const runServerFunction = (functionName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - google is defined in the Apps Script environment
    if (typeof google === 'undefined' || !google.script) {
      // Fallback for local testing (returns empty/mock if needed, or just rejects)
      console.warn("Google Script Run not found. Are you in local dev?");
      reject("Not running in Apps Script");
      return;
    }
    
    // @ts-ignore
    google.script.run
      .withSuccessHandler((response: any) => resolve(response))
      .withFailureHandler((error: any) => reject(error))
      [functionName](...args);
  });
};

// --- DATA FETCHING ---

export const getDatabaseData = async () => {
  try {
    return await runServerFunction('getDatabaseData');
  } catch (e) {
    console.error("Failed to fetch DB:", e);
    return {};
  }
};

// --- SUBMISSION ---

export const submitTicket = async (ticket: Partial<Ticket>) => {
  return await runServerFunction('saveTicket', ticket);
};

export const uploadFileToDrive = async (fileBase64: string, filename: string, mimeType: string, ticketId: string) => {
  return await runServerFunction('uploadFile', fileBase64, filename, mimeType, ticketId);
};

// --- UPDATES ---

export const updateTicketStatus = async (ticketId: string, status: string, assignedTo?: string) => {
  return await runServerFunction('updateTicketStatus', ticketId, status, assignedTo);
};