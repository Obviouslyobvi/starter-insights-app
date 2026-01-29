
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const discoverAllStories = async (existingCount: number = 0, batchSize: number = 10): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are a high-performance business intelligence bot. 
    Find ${batchSize} unique, high-revenue case study company names from starterstory.com. 
    
    CRITICAL: 
    - Search for lists like "Best SaaS case studies on Starter Story" or "Top E-commerce founders Starter Story".
    - Focus on companies with over $50k/month revenue if possible.
    - Avoid these existing ${existingCount} items (just focus on finding new, diverse ones).
    - Return ONLY a JSON array of company names.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data found.");
  
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Discovery Parse Error:", e);
    return [];
  }
};

export const analyzeStory = async (companyName: string): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Deeply analyze the business case study for "${companyName}" on starterstory.com.

    You must extract high-signal data:
    1. Founder Name: Who started it?
    2. Revenue: Most recent monthly or annual revenue reported.
    3. Distribution (The "How"): EXACTLY how did they get their first 100 and first 10,000 users? Was it SEO, Cold Outreach, Product Hunt, Reddit, etc?
    4. Monetization: Their primary business model (SaaS, Commission, Ad-revenue, etc).
    5. The "Aha! Moment": What was the specific turning point, unique insight, or "lucky break" that changed everything?
    6. Summary: A punchy 2-sentence summary of the business.
    7. Category: Choose the most accurate one (e.g., Vertical SaaS, D2C, Micro-SaaS, B2B Service).
    8. Starter Story URL: The full URL to this case study on starterstory.com (format: https://www.starterstory.com/stories/...)
    9. Company Website: The company's official website URL.

    Return as a JSON object.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          founder: { type: Type.STRING },
          revenue: { type: Type.STRING },
          distributionChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
          monetizationMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
          ahaMoment: { type: Type.STRING },
          summary: { type: Type.STRING },
          category: { type: Type.STRING },
          starterStoryUrl: { type: Type.STRING },
          companyWebsite: { type: Type.STRING }
        },
        required: ["companyName", "founder", "revenue", "distributionChannels", "monetizationMethods", "ahaMoment", "summary", "category", "starterStoryUrl", "companyWebsite"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Analysis failed.");
  
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as AnalysisResult;
  } catch (e) {
    throw new Error("Gemini Analysis Parse failed.");
  }
};
