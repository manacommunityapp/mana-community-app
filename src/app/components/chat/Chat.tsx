import { useState, useCallback, useEffect } from "react";
import { ConversationsList } from "./ConversationsList";
import { ChatWindow } from "./ChatWindow";
import { ContactDetails } from "./ContactDetails";
import { useChat } from "../../../contexts/ChatContext";

/**
 * Main Chat page — three-panel layout:
 *   Left:   ConversationsList (always visible on md+, toggles on mobile)
 *   Center: ChatWindow (active chat or empty state)
 *   Right:  ContactDetails (toggle via info button, hidden on < xl)
 */
export function Chat() {
  const {
    conversations,
    messages,
    activeConvId,
    typingStates,
    selectConversation,
    sendMessage,
    startConversation,
    initialize,
  } = useChat();

  const [showDetails, setShowDetails] = useState(false);
  const [showConvList, setShowConvList] = useState(true); // mobile toggle

  // Hydrate conversations + contacts and start real-time listeners when the chat page opens.
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Automatically select the first conversation if none is active on mount
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [activeConvId, conversations, selectConversation]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? messages[activeConvId] ?? [] : [];
  const isTyping = activeConvId ? !!typingStates[activeConvId] : false;

  const handleSelectConversation = useCallback((id: string) => {
    selectConversation(id);
    setShowConvList(false); // on mobile, switch to chat view
    setShowDetails(false);
  }, [selectConversation]);

  const handleBack = useCallback(() => {
    selectConversation(null);
    setShowConvList(true);
  }, [selectConversation]);

  const handleToggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  return (
    <div
      className="flex h-full rounded-xl overflow-hidden border border-border shadow-lg"
      style={{
        background: "var(--chat-bg-main)",
      }}
    >
      {/* ── Left Panel: Conversations List ── */}
      <div
        className={`${
          showConvList ? "flex" : "hidden"
        } md:flex w-full md:w-80 lg:w-[340px] shrink-0`}
      >
        <ConversationsList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onStartChat={startConversation}
        />
      </div>

      {/* ── Center Panel: Chat Window ── */}
      <div
        className={`${
          !showConvList ? "flex" : "hidden"
        } md:flex flex-1 min-w-0`}
      >
        <ChatWindow
          conversation={activeConversation}
          messages={activeMessages}
          onToggleDetails={handleToggleDetails}
          onBack={handleBack}
          onSendMessage={sendMessage}
          isTyping={isTyping}
        />
      </div>

      {/* ── Right Panel: Contact Details (collapsible) ── */}
      {showDetails && activeConversation && (
        <div className="hidden lg:flex w-72 shrink-0 animate-fade-in-up">
          <ContactDetails contact={activeConversation.contact} />
        </div>
      )}
    </div>
  );
}
