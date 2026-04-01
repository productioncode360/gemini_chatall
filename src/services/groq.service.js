// src/services/groq.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";
import log from "../utils/logger.js";

export const GroqService = {
  async generate(prompt) {
    try {
      if (!ENV.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing in .env file");
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: ENV.GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) throw new Error(`Groq HTTP Error: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.choices?.[0]?.message?.content || "No response from Groq.";
    } catch (err) {
      log.error("GroqService.generate failed", err);
      throw new Error("Groq service failed");
    }
  }
};