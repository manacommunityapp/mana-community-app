/**
 * Central feature flags.
 *
 * AI_AGENT_CHATBOT_ENABLED — when true, the floating chat bot uses the new
 * "Mana AI Assistant" (ManaChat, /api/v1/chat). When false (current default),
 * it falls back to the earlier AppFlowChatbot that answers application/how-to
 * questions. Flip to true once the AI agent backend is ready.
 */
export const AI_AGENT_CHATBOT_ENABLED = false;
