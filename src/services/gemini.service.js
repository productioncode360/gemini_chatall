// src/services/gemini.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";
import log from "../utils/logger.js";

export const GeminiService = {
  async generate(prompt) {
    try {
      if (!ENV.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in .env file");
      }

      const model = ENV.GEMINI_MODEL;   // Fixed model

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 65536 }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Gemini API error");
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    } catch (err) {
      log.error("GeminiService failed", err);
      throw new Error("Gemini API call failed. Check your API key and internet.");
    }
  }
};