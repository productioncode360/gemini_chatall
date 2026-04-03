// src/modules/chat/chat.model.js
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

const COLLECTION = "chats";

export const ChatModel = {

  async create(title = "New Chat", mode = "gemini-pro", userId = null) {
    const chat = {
      title, mode, userId,
      messages:  [],
      studyData: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await getDB().collection(COLLECTION).insertOne(chat);
    return { chatId: result.insertedId.toString(), title, mode, studyData: [] };
  },

  async getById(chatId) {
    const chat = await getDB().collection(COLLECTION).findOne({
      _id: new ObjectId(String(chatId))
    });
    if (!chat) throw new Error("Chat not found");
    return chat;
  },

  async getAll(userId = null) {
    const filter = userId ? { userId } : {};
    return getDB().collection(COLLECTION)
      .find(filter, { projection: { title: 1, mode: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();
  },

  // Normal chat messages
  async addMessage(chatId, userText, assistantText, attachments = []) {
    await getDB().collection(COLLECTION).updateOne(
      { _id: new ObjectId(String(chatId)) },
      {
        $push: { messages: { $each: [
          { role: "user",      content: userText,      timestamp: new Date() },
          { role: "assistant", content: assistantText, timestamp: new Date() }
        ]}},
        $set: { updatedAt: new Date() }
      }
    );
    return true;
  },

  // ✅ APPEND — purane questions safe, naye add ho jaate hain
  async appendStudyData(chatId, newStudyItems) {
    await getDB().collection(COLLECTION).updateOne(
      { _id: new ObjectId(String(chatId)) },
      {
        $push: { studyData: { $each: newStudyItems } },
        $set:  { updatedAt: new Date() }
      }
    );
    return true;
  },

  // Sirf tab use karo jab poora reset chahiye
  async replaceStudyData(chatId, studyDataArray) {
    await getDB().collection(COLLECTION).updateOne(
      { _id: new ObjectId(String(chatId)) },
      { $set: { studyData: studyDataArray, updatedAt: new Date() } }
    );
    return true;
  },

  // Follow-up message specific question mein
  async addSubMessage(chatId, subId, userMessage, assistantMessage) {
    await getDB().collection(COLLECTION).updateOne(
      { _id: new ObjectId(String(chatId)) },
      {
        $push: { "studyData.$[elem].subMessages": { $each: [
          { role: "user",      content: userMessage,      timestamp: new Date() },
          { role: "assistant", content: assistantMessage, timestamp: new Date() }
        ]}},
        $set: { updatedAt: new Date() }
      },
      { arrayFilters: [{ "elem.subId": subId }] }
    );
    return true;
  },

  async getSubThread(chatId, subId) {
    const chat = await this.getById(chatId);
    return chat.studyData.find(item => item.subId === subId) || null;
  },

  async getStudyData(chatId) {
    const chat = await this.getById(chatId);
    return chat.studyData || [];
  }
};