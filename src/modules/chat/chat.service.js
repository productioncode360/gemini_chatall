import log from "../../utils/logger.js";
import { GeminiService } from "../../services/gemini.service.js";
import { ChatModel } from "./chat.model.js";

export const ChatService = {
  async processMessage(query, mode = "gemini", chatId = null, attachments = [], isStudyMode = false) {
    try {
      let fullPrompt = query || "Explain the attached files.";
      let studyData = null;
      let isExtractionRequest = false;

      // 🔥 STUDY MODE FIX: JSON Extraction tabhi karo jab nayi File/Image aayi ho
      if (isStudyMode && attachments && attachments.length > 0) {
        isExtractionRequest = true;
        fullPrompt = `
          You are an expert AI Tutor. The user has uploaded images/documents containing multiple questions.
          User's specific instruction: "${query || 'Answer each question clearly.'}"
          
          TASK:
          1. Extract ALL unique questions from the images (ignore duplicates).
          2. Answer each question individually according to the user's constraints.
          3. You MUST return the result STRICTLY as a JSON array of objects. Do not use markdown outside the JSON.
          
          Format required:
          [
            { "question": "Extracted question 1?", "answer": "Detailed answer here" },
            { "question": "Extracted question 2?", "answer": "Detailed answer here" }
          ]
        `;
      } else {
        // Normal Chat OR Follow-up question in Study Mode
        if (chatId) {
          try {
            const chat = await ChatModel.getById(chatId);
            const chatHistory = chat.messages || [];
            if (chatHistory.length > 0) {
              fullPrompt = "Previous context:\n" + chatHistory.map(m => `${m.role}: ${m.content}`).join("\n") + "\n\nUser's Follow-up Question: " + query;
            }
          } catch (e) { log.warn("Fresh chat started"); }
        }
      }

      // Call Gemini API
      const aiResponse = await GeminiService.generate(fullPrompt, attachments);
      let resultText = aiResponse.text;
      const tokenInfo = aiResponse.usage;

      // Agar JSON extract karne bola tha, tabhi parse karo
      if (isExtractionRequest) {
        try {
          let cleanJsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
          studyData = JSON.parse(cleanJsonStr);
          // Save a summary in DB so context is maintained
          if (chatId) {
             await ChatModel.addMessage(chatId, query || "Extract questions from images", "Extracted questions successfully.");
          }
        } catch (parseErr) {
          log.error("Failed to parse Study Mode JSON", parseErr);
          studyData = [{ question: "Extracted Results", answer: resultText }];
        }
      } else {
        // Normal DB save for follow-ups
        if (chatId) {
          await ChatModel.addMessage(chatId, query, resultText);
        }
      }

      return {
        success: true,
        result: resultText,
        isStudyMode: isExtractionRequest, // only true if we extracted JSON
        studyData: studyData,
        tokens: tokenInfo,
        chatId: chatId || null
      };

    } catch (err) {
      log.error("ChatService failed", err);
      throw err;
    }
  }
};