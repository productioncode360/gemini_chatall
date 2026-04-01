// src/constants/index.js
export const CONSTANTS = {
  DEFAULT_MODEL: "gemini",
  DEFAULT_CHAT_TITLE: "New Chat",
  MAX_QUERY_LENGTH: 10000,
  MAX_TOKENS: 65536,

  AI_MODES: {
    GEMINI_PRO: "gemini-pro",
    GEMINI: "gemini",
    GROQ: "groq",
    TAVILY_GEMINI: "tavily+gemini"
  },

  AX_TOOLS: {
    MCQ: "mcq",
    MINDMAP: "mindmap",
    FLASHCARD: "flashcard",
    NOTES: "notes"
  }
};

export default CONSTANTS;