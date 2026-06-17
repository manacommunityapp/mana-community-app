import { useState, useCallback, useMemo } from "react";
import { MessageCircle, X } from "lucide-react";
import { ConversationsList } from "./ConversationsList";
import { ChatWindow } from "./ChatWindow";
import { useChat } from "../../../contexts/ChatContext";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConvList, setShowConvList] = useState(true);

  const {
    conversations,
    messages,
    activeConvId,
    typingStates,
    selectConversation,
    sendMessage,
    startConversation,
  } = useChat();

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? messages[activeConvId] ?? [] : [];
  const isTyping = activeConvId ? !!typingStates[activeConvId] : false;

  const handleSelectConversation = useCallback((id: string) => {
    selectConversation(id);
    setShowConvList(false);
  }, [selectConversation]);

  const handleBack = useCallback(() => {
    setShowConvList(true);
    selectConversation(null);
  }, [selectConversation]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ── Chat Widget Panel ── */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-96 h-[520px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          style={{
            background: "linear-gradient(135deg, rgba(22,22,58,0.95) 0%, rgba(13,13,31,0.98) 100%)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-border bg-black/20 shrink-0">
            <span className="text-sm font-semibold text-white/95 tracking-wide">
              Community Chat
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {showConvList || !activeConvId ? (
              <ConversationsList
                conversations={conversations}
                activeId={activeConvId}
                onSelect={handleSelectConversation}
                onStartChat={startConversation}
              />
            ) : (
              <ChatWindow
                conversation={activeConversation}
                messages={activeMessages}
                onToggleDetails={() => {}}
                onBack={handleBack}
                onSendMessage={sendMessage}
                forceShowBack={true}
                isTyping={isTyping}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Toggle Trigger Button ── */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          // If we open, sync listing state
          if (!isOpen && activeConvId) {
            setShowConvList(false);
          } else {
            setShowConvList(true);
          }
        }}
        className="h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          boxShadow: "0 6px 20px rgba(99,102,241,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
        }}
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background animate-pulse"
            style={{
              background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
            }}
          >
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
