// src/modules/chat/chat.controller.js
import { ChatService } from "./chat.service.js";
import { ChatModel }   from "./chat.model.js";

export const ChatController = {

  async createChat(req, res) {
    try {
      const { title = "New Chat", mode = "gemini-pro" } = req.body;
      const userId = req.userId || null;
      const chat   = await ChatModel.create(title, mode, userId);

      const baseUrl   = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const shareLink = `${baseUrl}/chat/${chat.chatId}`;

      res.status(201).json({
        success:   true,
        chatId:    chat.chatId,
        title:     chat.title,
        shareLink
      });
    } catch (err) {
      console.error("❌ createChat Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async search(req, res) {
    try {
      const {
        query,
        mode        = "gemini-pro",
        chatId,
        attachments = [],
        isStudyMode = false,
        subId       = null          // ✅ Frontend se aa raha hai — pass karo
      } = req.body;

      const response = await ChatService.processMessage(
        query,
        mode,
        chatId,
        attachments,
        isStudyMode,
        subId                       // ✅ Service ko de do
      );

      res.json(response);
    } catch (err) {
      console.error("❌ search Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async vectorSearch(req, res) {
    try {
      const { query, topK = 5 } = req.body;
      if (!query) return res.status(400).json({ success: false, error: "query required" });
      const userId   = req.userId || null;
      const response = await ChatService.vectorSearch(query, topK, userId);
      res.json(response);
    } catch (err) {
      console.error("❌ vectorSearch Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getAllChats(req, res) {
    try {
      const userId = req.userId || null;
      const chats  = await ChatModel.getAll(userId);
      res.json({ success: true, chats });
    } catch (err) {
      console.error("❌ getAllChats Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getChat(req, res) {
    try {
      const chat = await ChatModel.getById(req.params.chatId);
      res.json({ success: true, chat });
    } catch (err) {
      console.error("❌ getChat Error:", err.message);
      res.status(404).json({ success: false, error: err.message });
    }
  }
};