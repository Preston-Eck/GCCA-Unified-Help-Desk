// src/services/api.ts

// Helper to talk to Google Apps Script
const runServer = (fnName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !google.script) {
      console.warn(`[Mock Mode] Call to ${fnName}`, args);
      resolve(null);
      return;
    }
    // @ts-ignore
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fnName](...args);
  });
};

export const getDatabaseData = async () => runServer('getDatabaseData');
export const getSessionUserEmail = async () => runServer('getSessionUserEmail');
export const submitTicket = async (data: any) => runServer('saveTicket', data);
export const updateTicketStatus = async (id: string, status: string, assignedTo?: string) => runServer('updateTicketStatus', id, status, assignedTo);

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