import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import log from "../../utils/logger.js";

const COLLECTION = "chats";

export const ChatModel = {
  async create(title = "New Chat", mode = "gemini-pro") {
    try {
      const db = getDB();
      const chat = { title, mode, messages: [], createdAt: new Date(), updatedAt: new Date() };
      const result = await db.collection(COLLECTION).insertOne(chat);
      return { chatId: result.insertedId.toString(), title, mode, messages: [], createdAt: chat.createdAt };
    } catch (err) { throw new Error("Failed to create new chat"); }
  },

  async getById(chatId) {
    try {
      if (!chatId) throw new Error("Chat ID is required");
      const db = getDB();
      const chat = await db.collection(COLLECTION).findOne({ _id: new ObjectId(String(chatId).trim()) });
      if (!chat) throw new Error("Chat not found");
      return chat;
    } catch (err) { throw new Error("Chat not found"); }
  },

  // 🔴 FETCH ALL CHATS FOR SIDEBAR HISTORY
  async getAll() {
    try {
      const db = getDB();
      const chats = await db.collection(COLLECTION)
        .find({}, { projection: { title: 1, mode: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .toArray();
      return chats;
    } catch (err) { throw new Error("Failed to fetch chat history"); }
  },

  async addMessage(chatId, userMessage, assistantMessage, attachments = []) {
    try {
      const db = getDB();
      const chat = await this.getById(chatId);

      let userContent = userMessage || "";
      if (attachments && attachments.length > 0) {
         userContent = `[Uploaded ${attachments.length} files]\n` + userContent;
      }

      const newMessages = [
        ...chat.messages,
        { role: "user", content: userContent, timestamp: new Date() },
        { role: "assistant", content: assistantMessage, timestamp: new Date() }
      ];

      await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { messages: newMessages, updatedAt: new Date() } }
      );
      return newMessages;
    } catch (err) { throw err; }
  }
};