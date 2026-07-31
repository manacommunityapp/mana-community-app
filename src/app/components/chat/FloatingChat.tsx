import { useCallback, useMemo } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { ConversationsList } from "./ConversationsList";
import { ChatWindow } from "./ChatWindow";
import { useChat } from "../../../contexts/ChatContext";
import { useAuth } from "../../../contexts/AuthContext";

export function FloatingChat() {
  const {
    conversations,
    messages,
    activeConvId,
    typingStates,
    initialize,
    selectConversation,
    sendMessage,
    startConversation,
    isFloatingOpen: isOpen,
    setFloatingOpen: setIsOpen,
    showFloatingConvList: showConvList,
    setShowFloatingConvList: setShowConvList,
  } = useChat();

  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(" ")[0] || "there";

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

  const onlineCount = useMemo(() => {
    return conversations.filter((c) => c.contact?.isOnline).length;
  }, [conversations]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      initialize();
      setShowConvList(!activeConvId);
    }
  };

  return (
    <>
      {/* ── Mobile dim backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Chat Widget Panel ──
          Mobile: near full-screen sheet. Desktop: floating card above the launcher. */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden border border-border font-sans
                     inset-x-3 bottom-3 top-3
                     sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:left-auto
                     sm:w-[24rem] sm:h-[600px] sm:max-h-[80vh]
                     rounded-3xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          style={{
            background: "linear-gradient(160deg, rgba(28,27,74,0.97) 0%, rgba(15,14,42,0.98) 55%, rgba(10,9,31,0.99) 100%)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 70px rgba(13,10,50,0.55), 0 0 0 1px rgba(99,102,241,0.18), inset 0 1px 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* ── Brand Header ── */}
          <div
            className="relative shrink-0 px-4 pt-4 pb-3.5 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #7c3aed 100%)" }}
          >
            {/* decorative glows */}
            <div className="pointer-events-none absolute -top-10 -right-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-4 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-white/30"
                  style={{ background: "rgba(255,255,255,0.16)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)" }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <h3 className="text-[15px] font-bold text-white tracking-tight">Community Chat</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-300 online-dot" : "bg-white/40"}`} />
                    <span className="text-[11px] font-medium text-white/80">
                      {onlineCount > 0 ? `${onlineCount} member${onlineCount > 1 ? "s" : ""} online` : "We reply in minutes"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="p-1.5 -mr-1 -mt-0.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* personalized greeting */}
            <p className="relative mt-3 text-[12.5px] text-white/90">
              👋 Hi <span className="font-semibold text-white">{firstName}</span>, how can the community help today?
            </p>
          </div>

          {/* ── Content Area ── */}
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

      {/* ── Launcher ── */}
      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans ${isOpen ? "hidden sm:block" : "block"}`}>
        <div className="group relative flex items-center justify-end">
          {/* hover label (desktop) */}
          {!isOpen && (
            <span
              className="hidden sm:block mr-3 px-3 py-1.5 rounded-full text-xs font-semibold text-white whitespace-nowrap
                         opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none"
              style={{ background: "rgba(28,27,74,0.92)", boxShadow: "0 6px 18px rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              Chat with your community
            </span>
          )}

          <button
            onClick={toggleOpen}
            aria-label={isOpen ? "Close chat" : "Open community chat"}
            className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white
                       shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%)",
              boxShadow: "0 8px 26px rgba(99,102,241,0.5), inset 0 1px 1px rgba(255,255,255,0.25)",
            }}
          >
            {/* pulsing ring when there are unread messages and panel closed */}
            {!isOpen && totalUnread > 0 && (
              <span className="absolute inset-0 rounded-full ring-2 ring-indigo-300/60 animate-ping" />
            )}

            <span className="relative transition-transform duration-300" style={{ transform: isOpen ? "rotate(90deg) scale(0.9)" : "none" }}>
              {isOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />}
            </span>

            {/* online presence dot */}
            {!isOpen && onlineCount > 0 && totalUnread === 0 && (
              <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#1c1b4a] online-dot" />
            )}

            {/* unread badge */}
            {!isOpen && totalUnread > 0 && (
              <span
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-[#0d0d1f]"
                style={{ background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)" }}
              >
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
