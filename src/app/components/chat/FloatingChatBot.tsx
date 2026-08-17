import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import AppFlowChatbot from "./AppFlowChatbot";
import ManaChat from "./ManaChat";
import { AI_AGENT_CHATBOT_ENABLED } from "../../../config/featureFlags";

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Only close if we didn't click the toggle button
        const button = document.getElementById("floating-chatbot-toggle");
        if (button && !button.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Mobile Dim Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-24 z-50 font-sans">
        {/* Panel */}
        {isOpen && (
          <div
            ref={panelRef}
            className={`fixed inset-x-2.5 bottom-3 top-10 sm:absolute sm:inset-auto sm:bottom-16 sm:right-0 ${
              AI_AGENT_CHATBOT_ENABLED
                ? "sm:w-[400px] sm:h-[620px] sm:max-h-[80vh]"
                : "sm:w-[520px] sm:h-[900px] sm:max-h-[85vh]"
            } flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 bg-white`}
            style={{
              boxShadow: "0 20px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(99,102,241,0.1)",
            }}
          >
            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden flex items-center justify-center pt-2 pb-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
              <div className="w-10 h-1 rounded-full bg-white/40" />
            </div>

            {AI_AGENT_CHATBOT_ENABLED ? (
              /* New AI agent (behind feature flag). */
              <div className="flex-1 min-h-0 flex flex-col">
                <ManaChat onClose={() => setIsOpen(false)} />
              </div>
            ) : (
              /* Default: earlier app-information chatbot. */
              <div className="flex-1 min-h-0 relative flex flex-col">
                <div className="absolute top-3 right-3 z-20">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-900/20 text-white/90 hover:text-white hover:bg-slate-900/30 transition-all cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <AppFlowChatbot isFloating={true} />
                </div>
              </div>
            )}
          </div>
        )}

      {/* Trigger Button displaying the GIF */}
      <button
        id="floating-chatbot-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-10 sm:h-14 sm:w-14 rounded-full overflow-hidden shadow-lg sm:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border sm:border-2 border-indigo-500/20 bg-white"
        style={{
          boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
        }}
      >
        <img
          src="/chat-bot-img-1.gif"
          alt="Chat Bot"
          className="w-full h-full object-cover scale-110"
        />
      </button>
    </div>
    </>
  );
}
