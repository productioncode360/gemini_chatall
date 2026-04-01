import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

const COLLECTION = "chats";

export const ChatModel = {
  async create(title = "New Chat", mode = "gemini-pro") {
    try {
      const chat = { 
        title, 
        mode, 
        messages: [], 
        studyData: [],        // ← Naya field added
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      const result = await getDB().collection(COLLECTION).insertOne(chat);
      
      return { 
        chatId: result.insertedId.toString(), 
        title, 
        mode, 
        studyData: [] 
      };
    } catch (err) { 
      throw new Error("Failed to create chat"); 
    }
  },

  async getById(chatId) {
    try {
      const chat = await getDB().collection(COLLECTION).findOne({ 
        _id: new ObjectId(String(chatId).trim()) 
      });
      if (!chat) throw new Error("Not found");
      return chat;
    } catch (err) { 
      throw new Error("Not found"); 
    }
  },

  async getAll() {
    try {
      return await getDB().collection(COLLECTION)
        .find({}, { 
          projection: { 
            title: 1, 
            mode: 1, 
            createdAt: 1 
          } 
        })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (err) { 
      throw new Error("Failed to fetch history"); 
    }
  },

  // Study Data ko alag se update karne ke liye naya method
  async updateStudyData(chatId, studyDataArray) {
    try {
      await getDB().collection(COLLECTION).updateOne(
        { _id: new ObjectId(chatId) },
        { 
          $set: { 
            studyData: studyDataArray || [], 
            updatedAt: new Date() 
          } 
        }
      );
      return true;
    } catch (err) {
      console.error("Failed to update studyData:", err);
      throw err;
    }
  },

  async addMessage(chatId, userMessage, assistantMessage, attachments = [], studyData = null) {
    try {
      const chat = await this.getById(chatId);
      
      let userContent = userMessage || "";
      if (attachments && attachments.length > 0) {
        userContent = `[Uploaded ${attachments.length} files]\n` + userContent;
      }

      const newMsgs = [...chat.messages, 
        { role: "user", content: userContent }, 
        { role: "assistant", content: assistantMessage }
      ];

      const updateObj = { 
        messages: newMsgs, 
        updatedAt: new Date() 
      };

      // Agar studyData aa raha hai to use bhi update karo
      if (studyData && Array.isArray(studyData)) {
        updateObj.studyData = studyData;
      }

      await getDB().collection(COLLECTION).updateOne(
        { _id: new ObjectId(chatId) }, 
        { $set: updateObj }
      );

      return newMsgs;
    } catch (err) { 
      throw err; 
    }
  }
};