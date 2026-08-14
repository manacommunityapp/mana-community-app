import React, { useState } from "react";
import {
  Smartphone, Monitor, Moon, Sun, Search, Sparkles, X, QrCode,
  Ticket, Calendar, ShieldCheck, Utensils, DollarSign, Award, Image
} from "lucide-react";
import { EventMobileDock } from "./EventMobileDock";
import { EventAICopilotDrawer } from "./EventAICopilotDrawer";
import { EventsExecutiveHome } from "./EventsExecutiveHome";
import { EventDetailView } from "./EventDetailView";
import { EventsAnalyticsView } from "./EventsAnalyticsView";
import { EventRegistrationWizard } from "./EventRegistrationWizard";
import { CulturalActivitiesView } from "./CulturalActivitiesView";
import { VolunteerModuleView } from "./VolunteerModuleView";
import { FoodModuleView } from "./FoodModuleView";
import { InventoryModuleView } from "./InventoryModuleView";
import { FinanceSponsorsView } from "./FinanceSponsorsView";
import { GalleryMediaView } from "./GalleryMediaView";
import { EventsReports } from "../EventsReports";
import { ProfileNotificationsView } from "./ProfileNotificationsView";
import { BottomSheet, SkeletonLoader } from "./EventDesignSystem";
import { useEscapeKey } from "../../../../hooks/useEscapeKey";

export function EventsRedesignMain() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [showSearchCmd, setShowSearchCmd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEscapeKey(() => setShowSearchCmd(false), showSearchCmd);
  useEscapeKey(() => setShowAICopilot(false), showAICopilot);

  // Search state & selected event state for registration
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState<any>(null);

  const handleOpenRegister = (evt?: any) => {
    if (evt) {
      setSelectedRegisterEvent(evt);
    }
    setActiveTab("registration");
  };

  const handleOpenQRPass = () => {
    setActiveTab("details");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0F172A] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="sticky top-0 z-30 px-4 py-2.5 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF6B00] animate-ping" />
          <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            Flagship Event Management <span className="text-[#FF6B00] text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-slate-800">v3.0</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Cmd */}
          <button
            onClick={() => setShowSearchCmd(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search (Cmd+K)</span>
          </button>

          {/* Skeleton Shimmer Test Toggle */}
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1200);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] cursor-pointer"
            title="Simulate Shimmer Skeleton"
          >
            ⚡ Test Shimmer
          </button>

          {/* Frame Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] transition-colors cursor-pointer"
            title={isMobileFrame ? "Switch to Full Widescreen View" : "Switch to Mobile Device Frame"}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-[#FF6B00]" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <div className="py-4 px-2 sm:px-6 flex justify-center">
        <div
          className={`w-full transition-all duration-500 ${
            isMobileFrame
              ? "max-w-[420px] rounded-[48px] border-[10px] border-slate-900 dark:border-slate-800 shadow-2xl p-4 min-h-[850px] relative bg-slate-50 dark:bg-slate-950 overflow-hidden"
              : "max-w-4xl rounded-3xl p-6 shadow-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
          }`}
        >
          {/* Mobile Frame Dynamic Notch / Speaker Bar */}
          {isMobileFrame && (
            <div className="w-32 h-5 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center gap-2 border border-slate-800 shadow-inner">
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700" />
              <div className="w-10 h-1.5 rounded-full bg-slate-800" />
            </div>
          )}

          {/* Top Quick Module Pills Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 hide-scrollbar border-b border-slate-200/60 dark:border-slate-800">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "details", label: "Details" },
              { id: "analytics", label: "KPIs" },
              { id: "registration", label: "Register" },
              { id: "cultural", label: "Cultural" },
              { id: "volunteer", label: "Volunteers" },
              { id: "food", label: "Food OS" },
              { id: "inventory", label: "Inventory" },
              { id: "finance", label: "Finance" },
              { id: "gallery", label: "Media" },
              { id: "reports", label: "Reports" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "bg-[#FF6B00] text-white shadow-md"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Body Renderer */}
          {isLoading ? (
            <div className="space-y-4 py-8">
              <SkeletonLoader isDark={isDark} height="h-44" />
              <SkeletonLoader isDark={isDark} height="h-28" />
              <SkeletonLoader isDark={isDark} height="h-64" />
            </div>
          ) : (
            <div className="animate-fadeIn">
              {activeTab === "dashboard" && (
                <EventsExecutiveHome
                  isDark={isDark}
                  onNavigate={(v) => setActiveTab(v)}
                  onOpenQRScanner={handleOpenQRPass}
                  onOpenRegisterModal={handleOpenRegister}
                />
              )}
              {activeTab === "details" && (
                <EventDetailView
                  isDark={isDark}
                  onBack={() => setActiveTab("dashboard")}
                  onOpenRegister={handleOpenRegister}
                />
              )}
              {activeTab === "analytics" && <EventsAnalyticsView isDark={isDark} />}
              {activeTab === "registration" && (
                <div className="max-w-xl mx-auto py-1 sm:py-3">
                  <EventRegistrationWizard isDark={isDark} event={selectedRegisterEvent} onClose={() => setActiveTab("dashboard")} />
                </div>
              )}
              {activeTab === "cultural" && <CulturalActivitiesView isDark={isDark} />}
              {activeTab === "volunteer" && <VolunteerModuleView isDark={isDark} />}
              {activeTab === "food" && <FoodModuleView isDark={isDark} />}
              {activeTab === "inventory" && <InventoryModuleView isDark={isDark} />}
              {activeTab === "finance" && <FinanceSponsorsView isDark={isDark} />}
              {activeTab === "gallery" && <GalleryMediaView isDark={isDark} />}
              {activeTab === "reports" && <EventsReports />}
              {activeTab === "events" && (
                <EventsExecutiveHome
                  isDark={isDark}
                  onNavigate={(v) => setActiveTab(v)}
                  onOpenQRScanner={handleOpenQRPass}
                  onOpenRegisterModal={handleOpenRegister}
                />
              )}
              {activeTab === "calendar" && (
                <EventsExecutiveHome
                  isDark={isDark}
                  onNavigate={(v) => setActiveTab(v)}
                  onOpenQRScanner={handleOpenQRPass}
                  onOpenRegisterModal={handleOpenRegister}
                />
              )}
              {activeTab === "profile" && <ProfileNotificationsView isDark={isDark} activeSubView="profile" />}
              {activeTab === "notifications" && <ProfileNotificationsView isDark={isDark} activeSubView="notifications" />}
            </div>
          )}

          {/* Floating Mobile Dock */}
          <EventMobileDock
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab)}
            onOpenAI={() => setShowAICopilot(true)}
            isDark={isDark}
          />
        </div>
      </div>

      {/* AI Copilot Chat Drawer */}
      <EventAICopilotDrawer
        isOpen={showAICopilot}
        onClose={() => setShowAICopilot(false)}
        isDark={isDark}
      />

      {/* Global Command Search Sheet */}
      <BottomSheet
        isOpen={showSearchCmd}
        onClose={() => setShowSearchCmd(false)}
        title="Global Search & Quick Actions"
        subtitle="Search across events, passes, volunteers, food coupons, and finances"
        isDark={isDark}
      >
        <div className="space-y-3 p-2">
          <input
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none text-slate-900 dark:text-white border focus:border-[#FF6B00]"
          />

          <div className="space-y-2 pt-2">
            {[
              { title: "Ganesh Chaturthi Utsav 2026", type: "Event", tab: "details" },
              { title: "Generate QR Pass for Family", type: "Quick Action", tab: "registration" },
              { title: "Prasadam & Kitchen Dashboard", type: "Food Module", tab: "food" },
              { title: "Shift Timeline & Duty Roster", type: "Volunteer Module", tab: "volunteer" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveTab(item.tab);
                  setShowSearchCmd(false);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-slate-700 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white cursor-pointer transition-colors"
              >
                <span>{item.title}</span>
                <span className="text-[10px] text-[#FF6B00] uppercase">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
