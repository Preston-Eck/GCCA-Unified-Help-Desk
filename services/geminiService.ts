
import { Priority } from "../types";

// Helper to access the backend bridge (assumes dataService exports a helper, or we use google.script.run directly)
// Since we can't easily import `runServer` if it's not exported, we'll re-implement a minimal bridge here
// or rely on the global google object.

const callServerAI = (prompt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !window.google || !window.google.script) {
      console.warn("AI Mock Mode: Backend not found");
      resolve("AI response unavailable in local mode.");
      return;
    }
    // @ts-ignore
    window.google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .callGemini(prompt);
  });
};

export const analyzeTicketPriority = async (description: string, department: string): Promise<Priority> => {
  try {
    const prompt = `
      You are an automated help desk triage assistant.
      Analyze this ${department} ticket description.
      Determine priority: "Low", "Medium", "High", or "Critical".
      Return ONLY the word.
      Description: "${description}"
    `;

    const text = await callServerAI(prompt);
    const cleaned = text.trim().replace(/['"]/g, '');

    switch (cleaned) {
      case 'Low': return Priority.LOW;
      case 'High': return Priority.HIGH;
      case 'Critical': return Priority.CRITICAL;
      default: return Priority.MEDIUM;
    }
  } catch (error) {
    console.error("AI Triage Failed:", error);
    return Priority.MEDIUM;
  }
};

export const refineTicketDescription = async (rawText: string, department: string): Promise<string> => {
  try {
    const prompt = `
      Rewrite this ${department} ticket description to be professional, concise, and clear.
      If vague, add a clarifying question in parenthesis.
      Input: "${rawText}"
      Return ONLY the rewritten text.
    `;
    return await callServerAI(prompt);
  } catch (error) {
    return rawText;
  }
};

export const findPotentialDuplicates = async (newDescription: string, existingTickets: {id: string, text: string}[]): Promise<string[]> => {
  try {
    if(existingTickets.length === 0) return [];
    const context = existingTickets.map(t => `ID: ${t.id} | Desc: ${t.text}`).join('\n');
    const prompt = `
      Check for duplicates.
      New Ticket: "${newDescription}"
      Existing:
      ${context}
      Return a JSON array of matching Ticket IDs. Return [] if none.
    `;
    const text = await callServerAI(prompt);
    // Clean code blocks if AI adds them
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return [];
  }
};

export const generateMaintenanceSchedule = async (assetName: string, modelNumber: string): Promise<Array<{task: string, frequency: string}>> => {
  try {
    const prompt = `
      Create a PM schedule for Asset: "${assetName}" (Model: ${modelNumber}).
      Return a JSON array of objects with "task" and "frequency" (Daily, Weekly, Monthly, Quarterly, Yearly).
    `;
    const text = await callServerAI(prompt);
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return [];
  }
};

export const generateSOPContent = async (taskName: string, assetName: string): Promise<string> => {
  try {
    const prompt = `
      Write a standard operating procedure (SOP) for task: "${taskName}" on asset: "${assetName}".
      Format as a clean numbered list.
    `;
    return await callServerAI(prompt);
  } catch (error) {
    return "Failed to generate SOP.";
  }
};
