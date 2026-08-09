import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Trophy, Bell, Users, Shield, X, ChevronRight,
  CalendarDays, Flame, Award, Sparkles
} from "lucide-react";
import { CommunityDirectory } from "../../community/CommunityDirectory";
import { NotificationBell } from "./NotificationBell";

export function MobileHeaderActions() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<"sports_notifications" | "directory" | null>(null);
  const [sportsTab, setSportsTab] = useState<"sports" | "notifications">("sports");

  return (
    <>
      {/* ── Icon-Only Buttons inside Header (Visible on Mobile & Desktop) ────────── */}
      <div className="flex items-center gap-1.5">
        {/* Button 1: Sports & Notifications (Icon Only) */}
        <button
          type="button"
          onClick={() => setActiveModal("sports_notifications")}
          title="Sports & Notifications"
          className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center relative cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-indigo-600" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </button>

        {/* Button 2: Community Directory (Icon Only) */}
        <button
          type="button"
          onClick={() => setActiveModal("directory")}
          title="Community Directory"
          className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <Users className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* ── Modal Backdrop ──────────────────────────────────────────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        />
      )}

      {/* ── Modal 1: Sports & Notifications Modal ──────────────────────────── */}
      {activeModal === "sports_notifications" && (
        <div className="fixed inset-x-3 top-14 bottom-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-24 lg:w-[480px] lg:max-h-[80vh] lg:rounded-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Sports & Notifications</h3>
                <p className="text-[11px] text-white/70">Quick access to tournaments & alerts</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
            <button
              onClick={() => setSportsTab("sports")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sportsTab === "sports"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Sports Hub
            </button>
            <button
              onClick={() => setSportsTab("notifications")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sportsTab === "notifications"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Bell className="w-3.5 h-3.5" /> Notifications
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sportsTab === "sports" ? (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-900">Sports Community Hub</h4>
                    <p className="text-[11px] text-indigo-600 mt-0.5">Events, fixtures, leaderboards & auction</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      navigate("/sports");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    Open Hub <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Dashboard & Events", desc: "View all sports", icon: CalendarDays, path: "/sports", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Schedule & Fixtures", desc: "Match timings", icon: Flame, path: "/sports?tab=schedule", color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Live Auctions", desc: "Bid on players", icon: Sparkles, path: "/sports?tab=auction", color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Leaderboards", desc: "Top performers", icon: Award, path: "/sports?tab=leaderboard", color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setActiveModal(null);
                        navigate(item.path);
                      }}
                      className="p-3 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all text-left group shadow-2xs"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center mb-2`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">In-App Notifications</span>
                  <NotificationBell />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tap the notification bell icon above or check your Profile → Settings to configure your alert preferences.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 2: Community Directory Modal ────────────────────────────── */}
      {activeModal === "directory" && (
        <div className="fixed inset-x-3 top-12 bottom-4 z-50 flex flex-col bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-12 lg:w-[680px] lg:max-h-[85vh] lg:rounded-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <Users className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Community Directory</h3>
                <p className="text-[11px] text-white/70">Leadership, committees & contacts</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Directory Content */}
          <div className="flex-1 overflow-y-auto p-3">
            <CommunityDirectory />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileFloatingActions() {
  return <MobileHeaderActions />;
}
