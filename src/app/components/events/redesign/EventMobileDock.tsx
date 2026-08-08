import React from "react";
import { LayoutDashboard, Calendar, Bell, User, Bot, Ticket } from "lucide-react";

interface EventMobileDockProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAI: () => void;
  isDark?: boolean;
  unreadCount?: number;
}

export const EventMobileDock: React.FC<EventMobileDockProps> = ({
  activeTab,
  setActiveTab,
  onOpenAI,
  isDark = false,
  unreadCount = 3,
}) => {
  const tabs = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "events", label: "Events", icon: Ticket },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "notifications", label: "Alerts", icon: Bell, badge: unreadCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="sticky bottom-3 left-0 right-0 z-40 px-4 max-w-lg mx-auto pointer-events-none">
      <div
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: isDark
            ? "rgba(15, 23, 42, 0.85)"
            : "rgba(255, 255, 255, 0.88)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid rgba(255, 107, 0, 0.18)",
          boxShadow: isDark
            ? "0 20px 40px -10px rgba(0,0,0,0.6)"
            : "0 20px 40px -10px rgba(255, 107, 0, 0.2)",
        }}
        className="pointer-events-auto flex items-center justify-around py-2 px-3 rounded-full relative"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 cursor-pointer min-w-[56px]"
              style={{ minHeight: "48px" }}
            >
              {isActive && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #FF6B00 0%, #FF8800 100%)",
                    boxShadow: "0 4px 12px rgba(255, 107, 0, 0.4)",
                  }}
                  className="absolute inset-0 rounded-2xl -z-10 animate-pulse-subtle"
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110 text-white" : isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-bold mt-1 transition-colors ${
                  isActive ? "text-white" : isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Floating AI Copilot Action Launcher */}
        <button
          onClick={onOpenAI}
          style={{
            background: "linear-gradient(135deg, #FF6B00 0%, #4F46E5 100%)",
            boxShadow: "0 8px 24px -4px rgba(255, 107, 0, 0.5), 0 0 20px rgba(79, 70, 229, 0.4)",
          }}
          className="absolute -top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white dark:border-slate-900 group"
          title="Open AI Event Copilot"
        >
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
        </button>
      </div>
    </div>
  );
};
