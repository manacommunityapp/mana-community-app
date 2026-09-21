import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { X, Trophy } from "lucide-react";
import AppFlowChatbot from "./AppFlowChatbot";
import ManaChat from "./ManaChat";
import { AI_AGENT_CHATBOT_ENABLED } from "../../../config/featureFlags";
import { useIsModalActive } from "../../hooks/useIsModalActive";

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isModalActive = useIsModalActive();

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
    <div className="floating-chatbot-container">
      <div
        className={`fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-30 font-sans floating-action-launcher transition-all duration-200 ${
          isModalActive ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100"
        }`}
      >
        {/* Panel */}
        {isOpen && (
          <div
            ref={panelRef}
            className={`fixed inset-x-0 bottom-0 top-12 sm:absolute sm:inset-auto sm:bottom-16 sm:right-0 ${
              AI_AGENT_CHATBOT_ENABLED
                ? "sm:w-[400px] sm:h-[620px] sm:max-h-[80vh]"
                : "sm:w-[520px] sm:h-[900px] sm:max-h-[85vh]"
            } flex flex-col sm:rounded-3xl rounded-t-[24px] border border-slate-200/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 bg-white`}
            style={{
              boxShadow: "0 -8px 40px rgba(15,23,42,0.18), 0 20px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(99,102,241,0.12)",
            }}
          >
            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden flex flex-col items-center pt-3 pb-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 gap-1">
              <div className="w-9 h-1 rounded-full bg-white/50" />
              <span className="text-[10px] font-semibold text-white/70 tracking-wide uppercase">
                {AI_AGENT_CHATBOT_ENABLED ? "Mana AI" : "Help Center"}
              </span>
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

      <style>{`
        @keyframes ganeshFloatAnim {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(-5px) rotate(-2deg) scale(1.03);
          }
          50% {
            transform: translateY(-9px) rotate(0deg) scale(1.05);
          }
          75% {
            transform: translateY(-4px) rotate(2deg) scale(1.02);
          }
        }
        @keyframes divineHaloSpin {
          0% { filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6)) hue-rotate(0deg); }
          50% { filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.8)) hue-rotate(15deg); }
          100% { filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6)) hue-rotate(0deg); }
        }
        .ganesh-animated-idol {
          animation: ganeshFloatAnim 3.4s ease-in-out infinite, divineHaloSpin 4s linear infinite;
        }
      `}</style>

      {/* Floating Action Launchers */}
      {!isModalActive && (
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          {/* Floating devotional Ganesha button (hidden as requested) */}

          {/* Floating Sports Dashboard button */}
          <Link
            to="/sports"
            title="Open Sports Dashboard"
            className="group relative flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-full shadow-xl border-2 border-white/90 bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-30"
            style={{
              boxShadow: "0 6px 18px rgba(99, 102, 241, 0.45)",
            }}
          >
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500 border border-white"></span>
            </span>
          </Link>
        </div>
      )}
    </div>
  </div>
  );
}
