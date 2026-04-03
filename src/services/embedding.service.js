// src/services/embedding.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";

const EMBEDDING_MODEL = "gemini-embedding-2-preview";

// ✅ Lower threshold taaki typos bhi catch ho (pakisatan → pakistan)
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.42;

// Minimum score jo user ko dikhana chahiye (irrelevant cut karo)
const DISPLAY_MIN_PCT = 50;

export const EmbeddingService = {

  async embed(text, taskType = "document") {
    try {
      const taskPrefix = taskType === "query"
        ? "Represent this query for searching relevant passages: "
        : "Represent this document for semantic retrieval: ";

      const inputText = taskPrefix + String(text).slice(0, 2048);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${ENV.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: inputText }] }
        })
      });

      if (!response.ok) throw new Error(`Embedding API error: ${await response.text()}`);
      const data = await response.json();
      return data.embedding?.values || null;
    } catch (err) {
      console.error("EmbeddingService.embed error:", err.message);
      throw err;
    }
  },

  normalize(vec) {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vec : vec.map(v => v / norm);
  },

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    const a = this.normalize(vecA);
    const b = this.normalize(vecB);
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return Math.max(-1, Math.min(1, dot));
  },

  // ══════════════════════════════════════════════════
  //  MAIN SEARCH — Study chats ke andar har question
  //  individually search karta hai
  //  ✅ FIXED: title = question text, subId return,
  //            no duplicate results
  // ══════════════════════════════════════════════════
  async searchChats(queryText, allChats, topK = 5) {
    try {
      const queryVec = await this.embed(queryText, "query");
      if (!queryVec) return [];

      const results = [];

      for (const chat of allChats) {
        const chatId = chat._id?.toString() || chat.chatId;

        // ════════════════════════════════
        //  STUDY CHAT — har question alag
        //  ✅ FIXED: title mein question text, subId return
        // ════════════════════════════════
        if (chat.mode === "study" && Array.isArray(chat.studyData) && chat.studyData.length > 0) {
          for (let idx = 0; idx < chat.studyData.length; idx++) {
            const item    = chat.studyData[idx];
            const qNum    = item.id || `Q${idx + 1}`;
            const qText   = (item.question || "").trim();
            const aText   = (item.answer   || "").trim();

            // Follow-up messages bhi include karo
            const subText = (item.subMessages || [])
              .map(sm => sm.content || "")
              .join(" ");

            // Is question ka full text
            const fullText = [qText, aText, subText].filter(Boolean).join(" ").slice(0, 2048);
            if (!fullText) continue;

            // Embed karo (ya cached use karo agar hai)
            let qVec = item.embedding;
            if (!qVec || !Array.isArray(qVec) || qVec.length === 0) {
              try {
                qVec = await this.embed(fullText, "document");
              } catch (e) {
                continue;
              }
            }

            const sim    = this.cosineSimilarity(queryVec, qVec);
            const simPct = Math.round(sim * 100);

            // Threshold se kam ho to skip
            if (sim < SIMILARITY_THRESHOLD) continue;

            results.push({
              chatId,
              // ✅ FIX 1: Title mein question number + text (session title nahi)
              //    Isse duplicates distinguish honge
              title:         `${qNum}: ${qText.slice(0, 60)}`,
              similarity:    sim,
              similarityPct: simPct,
              // ✅ FIX 2: Preview mein answer ka snippet dikhao
              preview:       aText.slice(0, 100),
              matchType:     "question",
              questionNum:   qNum,
              questionText:  qText,
              // ✅ FIX 3: subId zaroor return karo
              subId:         item.subId || item.id,
              createdAt:     chat.createdAt,
              mode:          "study"
            });
          }

          // Title bhi search karo (overall topic match)
          // ✅ FIXED: sirf tab add karo jab koi question match nahi mila
          const titleText = (chat.title || "").trim();
          if (titleText) {
            let titleVec = chat.titleEmbedding;
            if (!titleVec) {
              try { titleVec = await this.embed(titleText, "document"); } catch (e) {}
            }
            if (titleVec) {
              const titleSim = this.cosineSimilarity(queryVec, titleVec);
              if (titleSim >= SIMILARITY_THRESHOLD) {
                // ✅ Check karo kya already is chat ka koi Q result mein hai
                const alreadyHas = results.some(r => r.chatId === chatId && r.matchType === "question");
                if (!alreadyHas) {
                  results.push({
                    chatId,
                    title:         chat.title || "Study Session",
                    similarity:    titleSim,
                    similarityPct: Math.round(titleSim * 100),
                    preview:       `Study Session: ${titleText.slice(0, 100)}`,
                    matchType:     "topic",
                    createdAt:     chat.createdAt,
                    mode:          "study"
                  });
                }
              }
            }
          }
        }

        // ════════════════════════════════
        //  NORMAL CHAT — messages overall
        // ════════════════════════════════
        else {
          const titleText = (chat.title || "").trim();
          const msgText   = (chat.messages || [])
            .map(m => m.content || "")
            .join(" ")
            .slice(0, 1500);

          const fullText = [titleText, msgText].filter(Boolean).join(" ").trim();
          if (!fullText) continue;

          let chatVec = chat.embedding;
          if (!chatVec || !Array.isArray(chatVec) || chatVec.length === 0) {
            try {
              chatVec = await this.embed(fullText, "document");
            } catch (e) {
              continue;
            }
          }

          const sim = this.cosineSimilarity(queryVec, chatVec);
          if (sim < SIMILARITY_THRESHOLD) continue;

          const firstMsg = (chat.messages || []).find(m => m.role === "user");
          results.push({
            chatId,
            title:         chat.title || "Untitled",
            similarity:    sim,
            similarityPct: Math.round(sim * 100),
            preview:       firstMsg?.content?.slice(0, 120) || titleText.slice(0, 120),
            matchType:     "chat",
            createdAt:     chat.createdAt,
            mode:          chat.mode || "normal"
          });
        }
      }

      // ✅ Sort by similarity, DISPLAY_MIN_PCT se kam wale filter karo
      return results
        .filter(r => r.similarityPct >= DISPLAY_MIN_PCT)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    } catch (err) {
      console.error("EmbeddingService.searchChats error:", err.message);
      throw err;
    }
  }
};