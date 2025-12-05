import { GoogleGenAI } from "@google/genai";
import { AIClassificationResponse, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const classifyUrl = async (url: string): Promise<AIClassificationResponse> => {
  try {
    // Using gemini-2.5-flash as it supports Google Search grounding
    const model = "gemini-2.5-flash";

    const prompt = `
You are an AI assistant that classifies web URLs.
Your goal is to extract structured data about the URL using Google Search.

The user has provided this URL: ${url}

Please research this URL using Google Search to understand its content.

IMPORTANT RULES:
- Do NOT hallucinate or invent content.
- Use ONLY the text extracted by the Search Tool or metadata provided.
- If the content is unclear, sparse, login-walled, or 404, you MUST set a low confidenceScore (below 0.7).
- ALWAYS return JSON as plain text in your final output. No MIME types, no schemas.

TASKS:
1. Title: Short factual title (max 60 chars).
2. Category: Choose strictly from the provided list.
3. Subcategory: Infer (e.g., tool, article, course).
4. Description: Write a precise summary of the content (strictly 2-3 sentences). Focus on what the resource *is* and what it *does*.
5. Link Type: Detect one of ['video', 'article', 'app/tool', 'tutorial', 'product page']. If none fit, use 'other'.
6. Intent: Determine user intent from ['Learn something', 'Download tool', 'Watch tutorial', 'Try an app', 'Get inspiration', 'Research topic'].
7. Pricing: Detect if 'Free', 'Freemium', or 'Paid'. If unknown, use 'Unknown'.
8. Tags: Generate 5 smart tags including Topic, Industry, and Resource Type.
9. Confidence Score: A number between 0.0 and 1.0 indicating how certain you are.
   - 0.8 - 1.0: High confidence.
   - 0.6 - 0.79: Medium confidence.
   - < 0.6: Low confidence.

CATEGORIES:
${Object.values(Category).join("\n")}

OUTPUT JSON (AS PLAIN TEXT):
{
  "title": "",
  "category": "",
  "subcategory": "",
  "description": "",
  "tags": "", // comma separated string
  "linkType": "", 
  "intent": "",
  "pricing": "",
  "confidenceScore": 0.85
}
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up potential markdown formatting
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text) as AIClassificationResponse;
    return data;

  } catch (error) {
    console.error("Error classifying URL:", error);
    throw error;
  }
};