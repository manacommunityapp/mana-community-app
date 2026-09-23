import { useState, useEffect } from "react";
import { X, Send, Lock, ShieldCheck } from "lucide-react";
import type { HomeServiceBooking, ContextualChatMessage } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface HomeServiceChatModalProps {
  booking: HomeServiceBooking;
  onClose: () => void;
}

export function HomeServiceChatModal({ booking, onClose }: HomeServiceChatModalProps) {
  const [messages, setMessages] = useState<ContextualChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    loadMessages();
  }, [booking.id]);

  const loadMessages = async () => {
    const data = await homeServiceApi.getChatMessages(booking.id);
    setMessages(data);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await homeServiceApi.sendChatMessage(booking.id, inputText.trim());
    setInputText("");
    loadMessages();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-lg w-full flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center">
              {booking.workerName?.[0] || "W"}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Chat with {booking.workerName}
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                Contextual &amp; Phone Number Masked
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs">
          {messages.map((m) => {
            const isMe = m.senderRole === "RESIDENT";
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none"
                  }`}
                >
                  <span className="text-[9px] font-bold block opacity-70 mb-0.5">
                    {m.senderName}
                  </span>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs hover:opacity-95 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
