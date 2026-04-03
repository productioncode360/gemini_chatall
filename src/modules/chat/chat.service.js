// src/modules/chat/chat.service.js
import { AIFactory }     from "../../services/ai.factory.js";
import { GeminiService } from "../../services/gemini.service.js";
import { ChatModel }     from "./chat.model.js";

export const ChatService = {

  async processMessage(
    query, mode = "gemini-pro", chatId = null,
    attachments = [], isStudyMode = false, subId = null
  ) {
    try {
      console.log(`🔍 [ChatService] StudyMode:${isStudyMode} | SubId:${subId} | Query: "${query?.substring(0, 80)}..."`);

      let resultText = "";
      let studyDataToReturn = null;

      // ════════════════════════════════════════════
      // CASE 1: Image/PDF → Questions extract + APPEND
      // ════════════════════════════════════════════
      if (isStudyMode && attachments?.length > 0) {
        console.log("📸 Extracting questions from image/PDF...");

        // ✅ chatId validate karo — agar DB mein nahi hai to null treat karo
        let validChatId = null;
        if (chatId) {
          try {
            await ChatModel.getById(chatId);
            validChatId = chatId;
          } catch(e) {
            console.warn(`⚠️ chatId "${chatId}" DB mein nahi mila — naya chat frontend create karega`);
            validChatId = null;
          }
        }

        const extractPrompt = `
Yeh image/document se SAARE questions nikaal kar do.
Response SIRF valid JSON array hona chahiye — koi extra text nahi.
Format: [{"question": "Pehla question?"}, {"question": "Doosra question?"}]
Agar koi question na mile to: [{"question": "Is document mein kya likha hai?"}]
        `.trim();

        let extractedText = "";
        try {
          const extractRes = await GeminiService.generate(extractPrompt, attachments);
          extractedText = extractRes?.text || extractRes || "";
        } catch (e) {
          console.error("GeminiService error:", e.message);
          extractedText = `[{"question": "${query || 'Is image ke baare mein batao'}"}]`;
        }

        let questions = [];
        try {
          const match = extractedText.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            questions = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) { console.error("Parse error:", e.message); }

        if (!questions.length) {
          questions = [{ question: extractedText.trim() || "Is image ke baare mein batao" }];
        }

        // Har question ka answer generate karo
        const newStudyItems = [];
        for (let i = 0; i < questions.length; i++) {
          const qText = (questions[i].question || questions[i]).toString().trim();
          let answer = "Answer generating...";
          try {
            const ansRes = await GeminiService.generate(
              `Question: ${qText}\n\nDetailed aur clear answer do Hindi ya English mein.`,
              attachments
            );
            answer = ansRes?.text || ansRes || "Answer available nahi hai.";
          } catch (e) { console.error(`Answer Q${i} error:`, e.message); }

          newStudyItems.push({
            subId:       `q_${Date.now()}_${i}`,
            id:          `Q${i + 1}`,
            question:    qText,
            answer:      answer,
            subMessages: [],
            createdAt:   new Date()
          });
        }

        // ✅ Sirf tab DB mein save karo jab valid chatId ho
        if (validChatId) {
          await ChatModel.appendStudyData(validChatId, newStudyItems);
          const allStudyData = await ChatModel.getStudyData(validChatId);
          studyDataToReturn = allStudyData;
          console.log(`📚 ${newStudyItems.length} appended. Total: ${allStudyData.length}`);
        } else {
          // chatId nahi hai — frontend se create hoga, sirf naye items return karo
          studyDataToReturn = newStudyItems;
          console.log(`📚 ${newStudyItems.length} questions extracted (no chatId yet)`);
        }

        resultText = `✅ **${newStudyItems.length} new questions extracted!** (Total: ${studyDataToReturn?.length || newStudyItems.length})\n\nSidebar mein har question pe click karke **deep dive** kar sakte ho. 👈`;
      }

      // ════════════════════════════════════════════
      // CASE 2: Follow-up on specific question (subId)
      // ════════════════════════════════════════════
      else if (chatId && subId) {
        console.log(`🧵 Sub-thread follow-up: subId=${subId}`);

        // ✅ chatId validate karo
        let threadQuestion = query;
        try {
          const thread = await ChatModel.getSubThread(chatId, subId);
          if (thread) threadQuestion = thread.question;
        } catch (e) {
          console.error("getSubThread error:", e.message);
          // Chat not found — phir bhi answer do
        }

        const answerPrompt = `
Tum ek helpful AI teacher ho.
Main Question: ${threadQuestion}
User ka follow-up sawaal: ${query}
Detailed, clear aur helpful answer do Hindi ya English mein.
        `.trim();

        try {
          const geminiRes = await GeminiService.generate(answerPrompt);
          resultText = geminiRes?.text || geminiRes || "Answer generate nahi ho saka.";
        } catch (e) {
          resultText = "Abhi answer nahi aa saka. Thodi der baad try karo.";
        }

        // Save — silently fail karo agar chat nahi mila
        try {
          await ChatModel.addSubMessage(chatId, subId, query, resultText);
        } catch(e) {
          console.error("addSubMessage error (non-fatal):", e.message);
        }
      }

      // ════════════════════════════════════════════
      // CASE 3: Normal chat
      // ════════════════════════════════════════════
      if (!resultText) {
        console.log(`[API] AI_FACTORY | Mode: ${mode} | Query: "${query?.substring(0, 60)}..."`);
        try {
          resultText = await AIFactory.getResponse(
            query, mode, attachments.length ? attachments[0] : null
          );
        } catch (e) {
          resultText = "AI response generate nahi ho saka. Dobara try karo.";
        }

        // Save message — silently fail agar chat nahi mila
        if (chatId) {
          try {
            await ChatModel.getById(chatId); // validate first
            ChatModel.addMessage(chatId, query, resultText, attachments).catch(e =>
              console.error("addMessage error:", e.message)
            );
          } catch(e) {
            console.warn("Chat not found for addMessage, skipping save.");
          }
        }
      }

      return {
        success: true,
        result:  resultText,
        ...(studyDataToReturn && { studyData: studyDataToReturn })
      };

    } catch (err) {
      console.error("❌ ChatService Error:", err.message);
      return { success: true, result: "❌ Kuch gadbad ho gayi. Dubara try karo." };
    }
  },

  // ═══════════════════════════════════════════════════════
  //  VECTOR SEARCH — FIXED
  //  Study chats ke andar har question individually search
  //  Normal chats mein overall messages search
  //  ✅ Title mein question text dikhao (duplicate fix)
  //  ✅ subId return karo (click pe sirf woh question load ho)
  // ═══════════════════════════════════════════════════════
  async vectorSearch(query, topK = 5, userId = null) {
    try {
      const { getDB } = await import("../../config/db.js");
      const db = getDB();
      const filter = userId ? { userId } : {};

      // studyData aur messages dono chahiye
      const chats = await db.collection("chats")
        .find(filter, {
          projection: { title: 1, mode: 1, messages: 1, studyData: 1, createdAt: 1 }
        })
        .sort({ createdAt: -1 }).limit(100).toArray();

      if (!chats.length) return { success: true, results: [] };

      const queryLower = query.toLowerCase().trim();
      // Short words (≤2 char) ignore karo — noise hai
      const words = queryLower.split(/\s+/).filter(w => w.length > 2);

      const results = [];

      for (const chat of chats) {
        const chatId = chat._id.toString();

        // ══════════════════════════════════════════
        //  STUDY CHAT — har question individually
        //  ✅ FIXED: title = question text, subId return
        // ══════════════════════════════════════════
        if (chat.mode === "study" && Array.isArray(chat.studyData) && chat.studyData.length > 0) {

          for (let idx = 0; idx < chat.studyData.length; idx++) {
            const item  = chat.studyData[idx];
            const qNum  = item.id || `Q${idx + 1}`;
            const qText = (item.question || "").toLowerCase();
            const aText = (item.answer   || "").toLowerCase();
            const subText = (item.subMessages || [])
              .map(sm => (sm.content || "").toLowerCase())
              .join(" ");

            const allText = [qText, aText, subText].join(" ");

            let score = 0;

            // Exact full-query match — highest priority
            if (qText.includes(queryLower))        score += 60;
            else if (aText.includes(queryLower))   score += 40;
            else if (subText.includes(queryLower)) score += 30;

            // Word-level partial match
            const wordScore = words.reduce(
              (acc, w) => acc + (allText.includes(w) ? 12 : 0), 0
            );
            score += wordScore;

            // Study session title match (overall topic)
            const titleLower = (chat.title || "").toLowerCase();
            if (titleLower.includes(queryLower)) score += 25;

            // ✅ Irrelevant cut — minimum 20 points chahiye
            if (score < 20) continue;

            results.push({
              chatId,
              // ✅ FIX 1: Title mein question number + text dikhao (session title nahi)
              //    Isse har result alag dikhe ga — no more duplicates
              title:         `${qNum}: ${(item.question || "").substring(0, 60)}`,
              // ✅ FIX 2: Preview mein answer ka short snippet
              preview:       (item.answer || "").substring(0, 100),
              matchType:     "question",
              questionNum:   qNum,
              // ✅ FIX 3: subId zaroor return karo — click pe sirf yahi question load ho
              subId:         item.subId || item.id,
              similarityPct: Math.min(score, 99),
              score,
              mode:          "study"
            });
          }
        }

        // ══════════════════════════════════════════
        //  NORMAL CHAT — overall messages
        // ══════════════════════════════════════════
        else {
          const titleLower = (chat.title || "").toLowerCase();
          const msgText    = (chat.messages || [])
            .map(m => (m.content || "").toLowerCase())
            .join(" ");

          let score = 0;
          if (titleLower.includes(queryLower)) score += 50;
          if (msgText.includes(queryLower))    score += 35;
          const wordScore = words.reduce(
            (acc, w) => acc + (msgText.includes(w) ? 10 : 0), 0
          );
          score += wordScore;

          if (score < 20) continue;

          const firstMsg = (chat.messages || []).find(m => m.role === "user");
          results.push({
            chatId,
            title:         chat.title || "Conversation",
            preview:       firstMsg?.content?.substring(0, 100) || titleLower,
            matchType:     "chat",
            similarityPct: Math.min(score, 99),
            score,
            mode:          chat.mode || "normal"
          });
        }
      }

      // Best match pehle, topK tak
      const sorted = results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return { success: true, results: sorted };

    } catch (err) {
      console.error("vectorSearch error:", err.message);
      return { success: true, results: [] };
    }
  }
};