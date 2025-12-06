
import { Ticket } from "../types";

// Type definition for Google Apps Script Server Functions
interface ServerFunctions {
  getDatabaseData: () => string; // Returns JSON string
  saveTicket: (ticket: any) => string; // Returns TicketID
  uploadFile: (data: string, filename: string, mimeType: string) => void;
  callGemini: (prompt: string) => string;
}

/**
 * Generic wrapper to call Google Apps Script server-side functions
 * converting the callback style to Promises.
 */
const runGAS = <T>(functionName: keyof ServerFunctions, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.script) {
      console.warn(`[Mock Mode] Call to ${functionName} failed: Google Script not loaded.`);
      reject("Google Script environment not found. Are you running locally?");
      return;
    }

    window.google.script.run
      .withSuccessHandler((response: any) => {
        try {
          // Attempt to parse JSON if the response looks like a JSON string
          if (typeof response === 'string' && (response.startsWith('{') || response.startsWith('['))) {
             resolve(JSON.parse(response));
          } else {
             resolve(response);
          }
        } catch (e) {
          resolve(response);
        }
      })
      .withFailureHandler((error: Error) => {
        console.error(`GAS Error [${functionName}]:`, error);
        reject(error);
      })
      [functionName](...args);
  });
};

// --- API Methods ---

export const api = {
  /**
   * Fetches all data tables from the Spreadsheet
   */
  getAllData: async (): Promise<any> => {
    return await runGAS('getDatabaseData');
  },

  /**
   * Saves a ticket to the "Tickets" sheet
   */
  saveTicket: async (ticket: Partial<Ticket>): Promise<string> => {
    return await runGAS<string>('saveTicket', ticket);
  },

  /**
   * Uploads a file to Drive and logs it to Ticket_Attachments
   */
  uploadFile: async (file: File, ticketId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          await runGAS('uploadFile', base64, file.name, file.type, ticketId);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Proxies a prompt to Gemini via the Server to protect API Keys
   */
  generateAIContent: async (prompt: string): Promise<string> => {
    return await runGAS<string>('callGemini', prompt);
  }
};

// Add this to services/api.ts

export const getSessionUserEmail = async () => {
  try {
    return await runServer('getSessionUserEmail');
  } catch (e) {
    console.error("Auth Error:", e);
    return null;
  }
};