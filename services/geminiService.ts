
import { GoogleGenAI } from "@google/genai";
import type { Reservation } from "../types";

// IMPORTANT: This assumes the API key is set in the environment variables.
// In a real application, this key should be handled securely and never exposed on the client-side.
// This service would typically be a backend route that the frontend calls.
// For this frontend-only demo, we initialize it here.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Gemini API key not found. AI features will be disabled. Please set process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Generates a staff briefing for a given set of reservations using the Gemini API.
 * @param reservations - An array of reservation objects for the day.
 * @returns A string containing the AI-generated briefing.
 */
export const generateStaffBriefing = async (reservations: Reservation[]): Promise<string> => {
    if (!API_KEY) {
        return "Gemini API key is not configured. Briefing cannot be generated.";
    }

    const model = 'gemini-2.5-flash';

    const prompt = `
      You are the manager of a high-end restaurant providing a daily briefing to the staff.
      Based on the following list of reservations for today, generate a concise, friendly, and informative summary.
      Highlight any important details like VIPs, special requests, allergies, or celebrations (anniversaries, birthdays).
      Organize the briefing by time. Be professional and motivational.

      Today's Reservations:
      ${reservations.map(r => `
        - Time: ${r.time}
        - Name: ${r.customerName}
        - Guests: ${r.covers}
        - Status: ${r.status}
        - Notes: ${r.notes || 'None'}
      `).join('')}

      Generate the briefing now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating staff briefing:", error);
        return "There was an error generating the briefing. Please check the console for details.";
    }
};
