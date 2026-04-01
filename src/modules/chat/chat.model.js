import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import log from "../../utils/logger.js";

const COLLECTION = "chats";

export const ChatModel = {
  async create(title = "New Chat", mode = "gemini-pro") {
    // ... (ye function same rahega jaise aapka tha)
    try {
      const db = getDB();
      const chat = {
        title,
        mode,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection(COLLECTION).insertOne(chat);
      log.success(`New Chat Created → ID: ${result.insertedId.toString()}`);
      
      return { 
        chatId: result.insertedId.toString(), 
        title, mode, messages: [],
        createdAt: chat.createdAt, updatedAt: chat.updatedAt
      };
    } catch (err) {
      log.error("ChatModel.create failed", err);
      throw new Error("Failed to create new chat");
    }
  },

  async getById(chatId) {
    // ... (ye function bhi same rahega)
    try {
      if (!chatId) throw new Error("Chat ID is required");
      const idStr = String(chatId).trim();
      const db = getDB();
      const chat = await db.collection(COLLECTION).findOne({ _id: new ObjectId(idStr) });
      if (!chat) { log.warn(`Chat not found for ID: ${idStr}`); throw new Error("Chat not found"); }
      return chat;
    } catch (err) {
      log.error(`ChatModel.getById failed for chatId: ${chatId}`, err);
      throw new Error("Chat not found");
    }
  },

  // Yahan attachment update kiya gaya hai
  async addMessage(chatId, userMessage, assistantMessage, attachment = null) {
    try {
      const db = getDB();
      const chat = await this.getById(chatId);

      let userContent = userMessage || "";
      // Agar image/file aayi thi, toh DB history me likh do ki user ne kya upload kiya tha
      if (attachment) {
        userContent = `[Uploaded File: ${attachment.name}] \n` + userContent;
      }

      const newMessages = [
        ...chat.messages,
        { role: "user", content: userContent, timestamp: new Date() },
        { role: "assistant", content: assistantMessage, timestamp: new Date() }
      ];

      const updateResult = await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { messages: newMessages, updatedAt: new Date() } }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("Failed to update chat messages");
      }

      log.success(`Message added to chat: ${chatId}`);
      return newMessages;
    } catch (err) {
      log.error("ChatModel.addMessage failed", err);
      throw err;
    }
  }
};