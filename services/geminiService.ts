
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Helps a requester refine their data requirement description
   */
  refineRequirement: async (rawDescription: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine the following data collection requirement into a professional, structured format suitable for data scrapers. Include sections for: Objective, Target Sources, Format Requirements, and Quality Standards. \n\nRaw Text: ${rawDescription}`,
    });
    return response.text || rawDescription;
  },

  /**
   * Suggests scraping strategies for a bounty
   */
  suggestScrapingStrategy: async (bountyTitle: string, description: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 effective scraping strategies or tools for this bounty: "${bountyTitle}". \nDescription: ${description}. Keep it concise.`,
    });
    return response.text || "No strategy available.";
  }
};