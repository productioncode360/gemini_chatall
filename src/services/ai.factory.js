// src/services/ai.factory.js
import { GeminiService } from "./gemini.service.js";
import { GroqService } from "./groq.service.js";
import { TavilyService } from "./tavily.service.js";
import { getCurrentIST } from "../utils/helpers.js";
import log from "../utils/logger.js";

export const AIFactory = {
  async getResponse(query, mode = "gemini", attachment = null) {
    const currentTime = getCurrentIST();

    log.api("AI_FACTORY", `Mode: ${mode} | Query: "${query.substring(0, 60)}..."`);

    try {
      // Web Search Mode
      if (mode.toLowerCase() === "tavily+gemini") {
        log.info("🌐 Web Search mode → Tavily call");
        const searchData = await TavilyService.search(query);
        log.success("✅ Tavily successful");
        return `🌐 **Real-time Web Search**\n\n${searchData}\n\n*Updated: ${currentTime}*`;
      }

      // Groq Mode
      if (mode.toLowerCase() === "groq") {
        return await GroqService.generate(`Date: ${currentTime}\nQuery: ${query}`);
      }

      // Gemini Pro / Normal Mode
      log.info(`Using Gemini for mode: ${mode}`);
      
      const prompt = `Date & Time: ${currentTime}
User Query: ${query}

Tu ek helpful aur friendly Indian AI assistant hai. 
Natural Hindi mein jawab do. 
Agar English mix ho to bhi chalega lekin zyada natural rakho.
Short aur clear jawab do.`;

      const response = await GeminiService.generate(prompt, attachment);
      return response.text || response;

    } catch (err) {
      console.error(`❌ AIFactory Error in ${mode} mode:`, err.message);
      return `⚠️ ${mode} mode mein abhi thodi problem aa rahi hai. Web Search mode try karo.`;
    }
  }
};