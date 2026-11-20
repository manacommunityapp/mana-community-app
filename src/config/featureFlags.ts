/**
 * Central feature flags.
 *
 * AI_AGENT_CHATBOT_ENABLED — when true, the floating chat bot uses the new
 * "Mana AI Assistant" (ManaChat, /api/v1/chat). When false (current default),
 * it falls back to the earlier AppFlowChatbot that answers application/how-to
 * questions. Flip to true once the AI agent backend is ready.
 */
export const AI_AGENT_CHATBOT_ENABLED = false;

/**
 * Per-community module gating for pilots.
 *
 * `enabledModules === null` means the server has not restricted modules for
 * this community, so every module stays enabled (default, backwards compatible).
 * Otherwise only listed module keys (case-insensitive) are enabled.
 */
export function isModuleEnabled(
  moduleKey: string,
  config: { enabledModules: string[] | null },
): boolean {
  if (config.enabledModules === null) return true;
  const key = moduleKey.toLowerCase();
  return config.enabledModules.some((m) => m.toLowerCase() === key);
}
