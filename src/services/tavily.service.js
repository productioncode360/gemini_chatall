// src/services/tavily.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";
import log from "../utils/logger.js";

export const TavilyService = {
  async search(query) {
    try {
      if (!ENV.TAVILY_API_KEY) {
        throw new Error("TAVILY_API_KEY is missing in .env file. Please add it.");
      }

      log.api("TAVILY", "search", query);

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: query,
          search_depth: "basic",
          max_results: 6,
          include_answer: true,
          include_images: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily HTTP Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.answer && (!data.results || data.results.length === 0)) {
        return "No relevant information found from web search.";
      }

      return data.answer || data.results.map(r => r.content).join("\n\n");
    } catch (err) {
      log.error("TavilyService.search failed", err);
      throw new Error(`Tavily search failed: ${err.message}`);
    }
  }
};