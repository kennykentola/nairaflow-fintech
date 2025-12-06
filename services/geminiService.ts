import { GoogleGenAI, Type } from "@google/genai";
import { CreditScoreResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLoanRisk = async (
  amount: number,
  duration: number,
  monthlyIncome: number,
  employmentStatus: string,
  purpose: string
): Promise<CreditScoreResponse> => {
  
  try {
    const prompt = `
      Act as a strict Fintech Credit Risk Officer for a Nigerian bank.
      Analyze the following loan application:
      - Requested Amount: ₦${amount}
      - Duration: ${duration} months
      - Monthly Income: ₦${monthlyIncome}
      - Employment: ${employmentStatus}
      - Purpose: ${purpose}

      Return a JSON object with:
      1. 'score': A credit score between 300 and 850.
      2. 'riskLevel': "LOW", "MEDIUM", or "HIGH".
      3. 'maxLoanAmount': The maximum recommended loan amount.
      4. 'reasoning': A brief 2-sentence explanation for the decision.

      Rules:
      - If loan amount > 50% of (monthlyIncome * duration), risk is HIGH.
      - If unemployed, risk is HIGH.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            maxLoanAmount: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["score", "riskLevel", "maxLoanAmount", "reasoning"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as CreditScoreResponse;
    }
    throw new Error("No response from AI");

  } catch (error) {
    console.error("AI Scoring Error:", error);
    // Fallback safe default
    return {
      score: 600,
      riskLevel: "MEDIUM",
      maxLoanAmount: amount * 0.8,
      reasoning: "AI Service unavailable. Defaulting to standard risk assessment based on income ratio."
    };
  }
};