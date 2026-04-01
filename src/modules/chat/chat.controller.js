// src/modules/chat/chat.controller.js
import log from "../../utils/logger.js";
import { ChatService } from "./chat.service.js";
import { ChatModel } from "./chat.model.js";

export const ChatController = {
  // Create new chat
  async createChat(req, res) {
    try {
      const { title = "New Chat", mode = "gemini" } = req.body;
      const chat = await ChatModel.create(title, mode);
      res.status(201).json({ success: true, ...chat });
    } catch (err) {
      log.error("ChatController.createChat failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Get all chats
  async getAllChats(req, res) {
    try {
      // Note: You can add this method in ChatModel if needed
      res.status(200).json({ success: true, message: "Get all chats - coming soon" });
    } catch (err) {
      log.error("ChatController.getAllChats failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Main search endpoint
  async search(req, res) {
    try {
      const { query, mode = "gemini", chatId } = req.body;

      if (!query) {
        return res.status(400).json({ success: false, error: "Query is required" });
      }

      const response = await ChatService.processMessage(query, mode, chatId);
      res.json(response);
    } catch (err) {
      log.error("ChatController.search failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};