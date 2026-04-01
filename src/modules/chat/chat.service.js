import { GeminiService } from "../../services/gemini.service.js";
import { ChatModel } from "./chat.model.js";

export const ChatService = {
  async processMessage(query, mode = "gemini-pro", chatId = null, attachments = [], isStudyMode = false) {
    try {
      let fullPrompt = query || "Explain the attached files.";
      let studyData = null;
      let isExtReq = false;

      if (isStudyMode && attachments && attachments.length > 0) {
        isExtReq = true;
        fullPrompt = `You are an AI Tutor. Extract unique questions from images. 
                     Answer each question individually and clearly. 
                     STRICTLY return ONLY a valid JSON array in this format: 
                     [{"question": "Full question text here?", "answer": "Detailed answer here"}]
                     Do not add any extra text outside the JSON array.`;

      } else if (chatId) {
        try {
          const chat = await ChatModel.getById(chatId);
          if (chat.messages && chat.messages.length > 0) {
            fullPrompt = "Context:\n" + 
                        chat.messages.map(m => `${m.role}: ${m.content}`).join("\n") + 
                        "\n\nQuery: " + query;
          }
        } catch (e) { 
          console.error("Context fetch error:", e);
        }
      }

      const aiRes = await GeminiService.generate(fullPrompt, attachments);
      let resultText = aiRes.text;

      if (isExtReq) {
        try {
          // Clean JSON response
          let cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
          studyData = JSON.parse(cleanJson);

          if (chatId && Array.isArray(studyData) && studyData.length > 0) {
            // Study data ko dedicated field mein save karo
            await ChatModel.updateStudyData(chatId, studyData);

            // Message mein bhi notification save kar sakte ho
            await ChatModel.addMessage(
              chatId, 
              query || "Extract questions from image", 
              `✅ Extracted ${studyData.length} questions successfully.`, 
              attachments
            );
          }
        } catch (e) {
          console.error("JSON parse error in study mode:", e);
          studyData = [{ 
            question: "Extraction Result", 
            answer: "Could not parse questions properly. Raw response: " + resultText 
          }];
        }
      } 
      else if (chatId) {
        await ChatModel.addMessage(chatId, query, resultText, attachments);
      }

      return { 
        success: true, 
        result: resultText, 
        isStudyMode: isExtReq, 
        studyData: studyData, 
        chatId: chatId 
      };
    } catch (err) { 
      console.error("ChatService error:", err);
      throw err; 
    }
  }
};