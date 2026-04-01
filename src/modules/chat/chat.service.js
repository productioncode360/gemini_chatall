// src/modules/chat/chat.service.js
import log from "../../utils/logger.js";
import { AIFactory } from "../../services/ai.factory.js";
import { ChatModel } from "./chat.model.js";
import { detectCodeRequest } from "../../utils/helpers.js";

export const ChatService = {
  async processMessage(query, mode = "gemini", chatId = null) {
    try {
      log.api("CHAT", "processMessage", `Mode: ${mode} | ChatID: ${chatId || 'None'}`);

      if (!query || query.trim() === "") {
        throw new Error("Query cannot be empty");
      }

      const isCodeRequest = detectCodeRequest(query);
      let result = "";

      result = await AIFactory.getResponse(query, mode);

      // Save to database if it's gemini-pro mode with chatId
      if (chatId && mode === "gemini-pro") {
        await ChatModel.addMessage(chatId, query, result);
        log.success(`Message saved to chat: ${chatId}`);
      }

      return {
        success: true,
        result,
        isCodeRequest,
        modeUsed: mode,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      log.error("ChatService.processMessage failed", err);
      throw err;
    }
  }
};