import log from "../../utils/logger.js";
import { GeminiService } from "../../services/gemini.service.js";
import { ChatModel } from "./chat.model.js";

export const ChatService = {
  async processMessage(query, mode = "gemini-pro", chatId = null, attachments = [], isStudyMode = false) {
    try {
      let fullPrompt = query || "Explain the attached files.";
      let studyData = null;
      let isExtractionRequest = false;

      if (isStudyMode && attachments && attachments.length > 0) {
        isExtractionRequest = true;
        fullPrompt = `
          You are an expert AI Tutor. The user uploaded images with multiple questions.
          User's instruction: "${query || 'Answer each question clearly.'}"
          
          TASK:
          1. Extract unique questions.
          2. Answer each individually.
          3. Return the result STRICTLY as a JSON array.
          
          Format: [{"question": "Q1?", "answer": "Ans1"}, {"question": "Q2?", "answer": "Ans2"}]
        `;
      } else {
        if (chatId) {
          try {
            const chat = await ChatModel.getById(chatId);
            const chatHistory = chat.messages || [];
            if (chatHistory.length > 0) {
              fullPrompt = "Context:\n" + chatHistory.map(m => `${m.role}: ${m.content}`).join("\n") + "\n\nNew Query: " + query;
            }
          } catch (e) { }
        }
      }

      const aiResponse = await GeminiService.generate(fullPrompt, attachments);
      let resultText = aiResponse.text;
      const tokenInfo = aiResponse.usage;

      if (isExtractionRequest) {
        try {
          let cleanJsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
          studyData = JSON.parse(cleanJsonStr);
          if (chatId) await ChatModel.addMessage(chatId, query || "Extract questions", "Extracted questions successfully.");
        } catch (parseErr) {
          studyData = [{ question: "Results", answer: resultText }];
        }
      } else {
        if (chatId) await ChatModel.addMessage(chatId, query, resultText, attachments);
      }

      return {
        success: true,
        result: resultText,
        isStudyMode: isExtractionRequest,
        studyData: studyData,
        tokens: tokenInfo,
        chatId: chatId
      };

    } catch (err) { throw err; }
  }
};