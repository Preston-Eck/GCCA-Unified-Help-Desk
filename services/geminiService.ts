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