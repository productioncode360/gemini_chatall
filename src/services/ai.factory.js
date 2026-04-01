import { GeminiService } from "./gemini.service.js";
import { GroqService } from "./groq.service.js";
import { TavilyService } from "./tavily.service.js";
import { getCurrentIST } from "../utils/helpers.js";
import log from "../utils/logger.js";

export const AIFactory = {
  // Yahan attachment = null add kiya
  async getResponse(query, mode = "gemini", attachment = null) {
    const currentTime = getCurrentIST();

    try {
      // Log me dikhega ki file aayi hai ya nahi
      log.api("AI_FACTORY", `Mode: ${mode} | Attachment: ${attachment ? 'Yes' : 'No'}`);

      if (mode.toLowerCase() === "tavily+gemini") {
        try {
          log.info("Tavily search started...");
          const searchData = await TavilyService.search(query);
          log.success("Tavily search successful");
          return `🌐 Tavily Web Search Result:\n\n${searchData}\n\n(Source: Real-time web search)`;
        } 
        catch (tavilyErr) {
          log.error("Tavily search failed", tavilyErr);
          return `❌ Tavily search failed: ${tavilyErr.message}\n\nTrying normal Gemini instead...`;
        }
      } 
      
      else if (mode.toLowerCase() === "groq") {
        return await GroqService.generate(`Date: ${currentTime}\nQuery: ${query}`);
      } 
      
      else {
        // Default to Gemini
        const prompt = `Date & Time: ${currentTime}\nUser Query: ${query || 'Explain the attached file'}\nClear jawab do:`;
        
        // Yahan attachment ko GeminiService me pass kar diya
        return await GeminiService.generate(prompt, attachment);
      }
    } catch (err) {
      log.error(`AIFactory.getResponse failed for mode: ${mode}`, err);
      throw new Error(`AI response failed for mode: ${mode}`);
    }
  }
};