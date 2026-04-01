// src/modules/model/model.service.js
import log from "../../utils/logger.js";

export const ModelService = {
  getAvailableModels() {
    log.info("Fetching available AI models");
    return [
      { id: "gemini-pro", name: "🌟 Gemini Pro", provider: "Google" },
      { id: "gemini", name: "🤖 Gemini Flash", provider: "Google" },
      { id: "groq", name: "⚡ Groq (Llama)", provider: "Groq" },
      { id: "tavily+gemini", name: "🔍 Tavily + Gemini", provider: "Tavily + Google" }
    ];
  }
};