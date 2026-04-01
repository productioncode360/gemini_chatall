import log from "../../utils/logger.js";
import { ChatService } from "./chat.service.js";
import { ChatModel } from "./chat.model.js";

export const ChatController = {
  async createChat(req, res) {
    try {
      const { title = "New Chat", mode = "gemini-pro" } = req.body;
      const chat = await ChatModel.create(title, mode);
      res.status(201).json({ success: true, chatId: chat.chatId, title: chat.title });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  },
  async search(req, res) {
    try {
      const { query, mode = "gemini-pro", chatId, attachments = [], isStudyMode = false } = req.body;
      const response = await ChatService.processMessage(query, mode, chatId, attachments, isStudyMode);
      res.json(response);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  },
  async getAllChats(req, res) {
    try {
      const chats = await ChatModel.getAll();
      res.json({ success: true, chats });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  },
  async getChat(req, res) {
    try {
      const chat = await ChatModel.getById(req.params.chatId);
      res.json({ success: true, chat });
    } catch (err) { res.status(404).json({ success: false, error: err.message }); }
  }
};