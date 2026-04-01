import fetch from "node-fetch";
import { ENV } from "../config/env.js";
import log from "../utils/logger.js";

export const GeminiService = {
  async generate(prompt, attachments = []) {
    try {
      const model = ENV.GEMINI_MODEL || "gemini-1.5-pro";   
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`;

      const partsArray = [{ text: prompt }];

      if (attachments && attachments.length > 0) {
        attachments.forEach(att => {
          if (att.data) {
            const base64Data = att.data.split(",")[1];
            partsArray.push({ inlineData: { data: base64Data, mimeType: att.mimeType } });
          }
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: partsArray }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) throw new Error(`Gemini HTTP Error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.",
        usage: data.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
      };
    } catch (err) { throw new Error("Gemini API call failed."); }
  }
};