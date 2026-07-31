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
    <div className="fixed bottom-24 right-6 sm:bottom-6 sm:right-24 z-50 font-sans">
      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`fixed inset-x-4 bottom-24 top-4 sm:absolute sm:inset-auto sm:bottom-16 sm:right-0 ${
            AI_AGENT_CHATBOT_ENABLED
              ? "sm:w-[400px] sm:h-[620px] sm:max-h-[80vh]"
              : "sm:w-[520px] sm:h-[900px] sm:max-h-[85vh]"
          } flex flex-col rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 bg-white`}
          style={{
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}
        >
          {AI_AGENT_CHATBOT_ENABLED ? (
            /* New AI agent (behind feature flag). */
            <div className="flex-1 min-h-0">
              <ManaChat onClose={() => setIsOpen(false)} />
            </div>
          ) : (
            /* Default: earlier app-information chatbot. */
            <>
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <AppFlowChatbot isFloating={true} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Trigger Button displaying the GIF */}
      <button
        id="floating-chatbot-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-indigo-500/20 bg-white"
        style={{
          boxShadow: "0 6px 20px rgba(99,102,241,0.25)",
        }}
      >
        <img
          src="/chat-bot-img-1.gif"
          alt="Chat Bot"
          className="w-full h-full object-cover scale-110"
        />
      </button>
    </div>
  );
}
