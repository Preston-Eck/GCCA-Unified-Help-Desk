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