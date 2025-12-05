import { GoogleGenAI } from "@google/genai";
import { Priority } from "../types";

// Initialize Gemini Client
// In a real app, strict handling of process.env.API_KEY is required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeTicketPriority = async (description: string, department: string): Promise<Priority> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning default priority.");
    return Priority.MEDIUM;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an automated help desk triage assistant for a school.
      Analyze the following ticket description for the ${department} department.
      Determine the priority level based on urgency and impact.
      
      Description: "${description}"
      
      Return ONLY one of the following words: "Low", "Medium", "High", "Critical".
      Do not add any explanation or punctuation.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text?.trim();

    switch (text) {
      case 'Low': return Priority.LOW;
      case 'High': return Priority.HIGH;
      case 'Critical': return Priority.CRITICAL;
      default: return Priority.MEDIUM;
    }
  } catch (error) {
    console.error("Gemini triage failed:", error);
    return Priority.MEDIUM;
  }
};

export const refineTicketDescription = async (rawText: string, department: string): Promise<string> => {
  if (!process.env.API_KEY || !rawText) return rawText;

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a helpful IT and Facilities support assistant.
      The user has submitted a raw description for a ${department} ticket: "${rawText}".
      
      Please rewrite this to be clearer, more professional, and concise. 
      If vague, ask a clarifying question in parenthesis.
      Example Input: "internet bad" -> Output: "Internet connectivity is intermittent/slow. (Is this wired or wifi?)"
      
      Return ONLY the rewritten text.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return rawText;
  }
};

export const findPotentialDuplicates = async (newDescription: string, existingTickets: {id: string, text: string}[]): Promise<string[]> => {
  if (!process.env.API_KEY || !newDescription || existingTickets.length === 0) return [];

  try {
    // We send a batch to Gemini to check for semantic similarity
    // In a real high-volume app, vector embeddings (Vector Search) would be better.
    // For this list (usually < 50 open tickets), prompt engineering works fine.
    
    const context = existingTickets.map(t => `ID: ${t.id} | Desc: ${t.text}`).join('\n');
    
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a help desk duplication detector.
      New Ticket Description: "${newDescription}"
      
      Compare it against these existing open tickets:
      ${context}
      
      Identify any tickets that seem to be about the EXACT SAME specific issue (location, device, problem).
      Return ONLY a JSON array of Ticket IDs. If none, return [].
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text?.trim() || '[]';
    // Clean up markdown code blocks if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini duplication check failed:", error);
    return [];
  }
};

export const generateMaintenanceSchedule = async (assetName: string, modelNumber: string): Promise<Array<{task: string, frequency: string}>> => {
  if (!process.env.API_KEY) return [];

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      I have an asset: "${assetName}" (Model: ${modelNumber || 'Unknown'}).
      Create a preventative maintenance schedule for it.
      Return a JSON array of objects with keys: "task" (string) and "frequency" (Daily, Weekly, Monthly, Quarterly, Yearly).
      Provide 3-5 distinct, realistic tasks.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text?.trim() || '[]';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini PM schedule failed:", error);
    return [];
  }
};

export const generateSOPContent = async (taskName: string, assetName: string): Promise<string> => {
  if (!process.env.API_KEY) return "Standard Operating Procedure not available (AI Key missing).";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Write a concise, step-by-step Standard Operating Procedure (SOP) for the following task:
      Task: ${taskName}
      Asset: ${assetName}
      
      Format as a clean numbered list. Keep it safe and professional.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "Procedure generation failed.";
  } catch (error) {
    console.error("Gemini SOP generation failed:", error);
    return "Error generating SOP.";
  }
};