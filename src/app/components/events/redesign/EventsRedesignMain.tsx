import React, { useState } from "react";
import {
  Smartphone, Monitor, Moon, Sun, Search, Sparkles, X, QrCode,
  Ticket, Calendar, ShieldCheck, Utensils, IndianRupee, Award, Image,
  Heart, Users, CheckCircle2
} from "lucide-react";
import { EventMobileDock } from "./EventMobileDock";
import { EventAICopilotDrawer } from "./EventAICopilotDrawer";
import { EventsExecutiveHome } from "./EventsExecutiveHome";
import { EventDetailView } from "./EventDetailView";
import { EventsAnalyticsView } from "./EventsAnalyticsView";
import { EventRegistrationWizard } from "./EventRegistrationWizard";
import { PoojaRegistrationModal } from "../PoojaRegistrationModal";
import { LunchDinnerRegistrationModal } from "../LunchDinnerRegistrationModal";
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
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);

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
                  onOpenFeatureModal={(key) => setActiveFeatureModal(key)}
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
                  {selectedRegisterEvent?.category?.toLowerCase().includes("pooja") || selectedRegisterEvent?.category?.toLowerCase().includes("seva") ? (
                    <PoojaRegistrationModal
                      event={selectedRegisterEvent}
                      onClose={() => setActiveTab("dashboard")}
                      onSuccess={() => setActiveTab("dashboard")}
                    />
                  ) : selectedRegisterEvent?.category?.toLowerCase().includes("meal") ||
                      selectedRegisterEvent?.category?.toLowerCase().includes("food") ||
                      selectedRegisterEvent?.category?.toLowerCase().includes("lunch") ||
                      selectedRegisterEvent?.category?.toLowerCase().includes("dinner") ||
                      selectedRegisterEvent?.category?.toLowerCase().includes("prasadam") ||
                      selectedRegisterEvent?.category?.toLowerCase().includes("annadanam") ? (
                    <LunchDinnerRegistrationModal
                      isOpen={Boolean(selectedRegisterEvent)}
                      onClose={() => setActiveTab("dashboard")}
                      meal={{
                        id: selectedRegisterEvent.id,
                        name: selectedRegisterEvent.title || (selectedRegisterEvent as any).name || "Meal Pass",
                        mealType: selectedRegisterEvent.category?.toUpperCase() || "MEAL",
                        date: selectedRegisterEvent.date || selectedRegisterEvent.startDate,
                        startTime: selectedRegisterEvent.startTime || selectedRegisterEvent.time,
                        venue: selectedRegisterEvent.venue,
                        fee: selectedRegisterEvent.price || selectedRegisterEvent.fee,
                        isFree: selectedRegisterEvent.isFree,
                        mainEventId: selectedRegisterEvent.mainEventId,
                      }}
                      onSuccess={() => setActiveTab("dashboard")}
                    />
                  ) : (
                    <EventRegistrationWizard isDark={isDark} event={selectedRegisterEvent} onClose={() => setActiveTab("dashboard")} />
                  )}
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
                  onOpenFeatureModal={(key) => setActiveFeatureModal(key)}
                />
              )}
              {activeTab === "calendar" && (
                <EventsExecutiveHome
                  isDark={isDark}
                  onNavigate={(v) => setActiveTab(v)}
                  onOpenQRScanner={handleOpenQRPass}
                  onOpenRegisterModal={handleOpenRegister}
                  onOpenFeatureModal={(key) => setActiveFeatureModal(key)}
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

      {/* Member Services Feature Modal */}
      {activeFeatureModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setActiveFeatureModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
              style={{
                background: activeFeatureModal === "pooja" ? "linear-gradient(135deg,#F59E0B,#D97706)"
                  : activeFeatureModal === "meals" ? "linear-gradient(135deg,#059669,#10B981)"
                  : activeFeatureModal === "passes" ? "linear-gradient(135deg,#7C3AED,#6366F1)"
                  : "linear-gradient(135deg,#0369A1,#0EA5E9)"
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  {activeFeatureModal === "pooja" && <Heart className="w-5 h-5" />}
                  {activeFeatureModal === "meals" && <Utensils className="w-5 h-5" />}
                  {activeFeatureModal === "passes" && <Ticket className="w-5 h-5" />}
                  {activeFeatureModal === "family" && <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    {activeFeatureModal === "pooja" && "Pooja Registration"}
                    {activeFeatureModal === "meals" && "Lunch / Dinner"}
                    {activeFeatureModal === "passes" && "Event Passes"}
                    {activeFeatureModal === "family" && "Family Members"}
                  </h2>
                  <p className="text-[10px] text-white/75 font-semibold">
                    {activeFeatureModal === "pooja" && "Seva bookings & rituals"}
                    {activeFeatureModal === "meals" && "Meal preferences"}
                    {activeFeatureModal === "passes" && "Entry & access"}
                    {activeFeatureModal === "family" && "Household details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveFeatureModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-5 space-y-4">
              {activeFeatureModal === "pooja" && (
                <>
                  <p className="text-xs text-slate-500">Register for Pooja ceremonies. Select a seva type and submit for your family.</p>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Available Poojas</p>
                    {["Ganesh Abhishekam", "Lakshmi Pooja", "Satyanarayan Puja", "Havan Ceremony"].map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />{p}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500">
                    No registration submitted yet. Contact the event committee to register.
                  </div>
                </>
              )}
              {activeFeatureModal === "meals" && (
                <>
                  <p className="text-xs text-slate-500">Select meal preferences for lunch and dinner sessions.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Lunch – Day 1","Dinner – Day 1","Lunch – Day 2","Dinner – Day 2"].map((m) => (
                      <div key={m} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                        <Utensils className="w-4 h-4 text-emerald-600 mb-1" />
                        <p className="text-[10px] font-bold text-emerald-800">{m}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Veg &amp; Non-Veg</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeFeatureModal === "passes" && (
                <>
                  <p className="text-xs text-slate-500">Your event passes grant access to specific venues and sessions.</p>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Pass Types</p>
                    {["General Entry Pass","VIP Access Pass","Programme Entry","Dining Pass"].map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <Ticket className="h-4 w-4 shrink-0 text-violet-500" />{p}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500">
                    Passes are issued after event registration is complete.
                  </div>
                </>
              )}
              {activeFeatureModal === "family" && (
                <>
                  <p className="text-xs text-slate-500">Family members registered under your flat for this event.</p>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">Registered Members</p>
                      <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">0</span>
                    </div>
                    <p className="text-xs text-slate-500">No family members added yet. Go to the Family Members section to add them.</p>
                  </div>
                </>
              )}
              <button
                onClick={() => setActiveFeatureModal(null)}
                className="w-full py-3 rounded-2xl text-xs font-black text-white transition-all active:scale-95"
                style={{
                  background: activeFeatureModal === "pooja" ? "linear-gradient(135deg,#F59E0B,#D97706)"
                    : activeFeatureModal === "meals" ? "linear-gradient(135deg,#059669,#10B981)"
                    : activeFeatureModal === "passes" ? "linear-gradient(135deg,#7C3AED,#6366F1)"
                    : "linear-gradient(135deg,#0369A1,#0EA5E9)"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
