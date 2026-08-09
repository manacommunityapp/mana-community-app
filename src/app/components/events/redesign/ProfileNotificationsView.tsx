import React, { useState } from "react";
import { User, Bell, Award, ShieldCheck, Ticket, CheckCircle2, Trash2, Sparkles, ChevronRight, Check } from "lucide-react";
import { GlassCard, TouchButton, StatusChip } from "./EventDesignSystem";

interface ProfileNotificationsViewProps {
  isDark?: boolean;
  activeSubView?: "profile" | "notifications";
}

export const ProfileNotificationsView: React.FC<ProfileNotificationsViewProps> = ({
  isDark = false,
  activeSubView = "profile",
}) => {
  const [subView, setSubView] = useState<"profile" | "notifications">(activeSubView);
  const [notifications, setNotifications] = useState([
    { id: "n1", group: "Today", title: "QR Pass Check-In Confirmed", time: "10 min ago", unread: true, desc: "Gate 2 entry verified for Ganesh Utsav 2026." },
    { id: "n2", group: "Today", title: "Volunteer Duty Reminder", time: "1 hour ago", unread: true, desc: "Prasadam distribution duty starts at 11:30 AM today." },
    { id: "n3", group: "Yesterday", title: "Sponsor Payment Acknowledged", time: "Yesterday", unread: false, desc: "₹2.50L Apex Builders sponsor voucher generated." },
    { id: "n4", group: "Earlier", title: "Cultural Registration Approved", time: "3 days ago", unread: false, desc: "Aarav Kumar registered for Solo Dance contest." },
  ]);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Sub View Toggle Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> User OS Hub
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {subView === "profile" ? "Member Profile" : "Notifications Center"}
          </h2>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setSubView("profile")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === "profile" ? "bg-[#FF6B00] text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setSubView("notifications")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === "notifications" ? "bg-[#FF6B00] text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Alerts ({notifications.filter((n) => n.unread).length})
          </button>
        </div>
      </div>

      {subView === "profile" ? (
        <div className="space-y-4">
          {/* User Profile Flagship Card */}
          <GlassCard isDark={isDark} hoverScale={false} className="p-6 border text-center space-y-3">
            <div className="relative inline-block">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                alt="Sandeep Kumar"
                className="w-24 h-24 rounded-full object-cover border-4 border-[#FF6B00] shadow-xl mx-auto"
              />
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-slate-800 text-[#FF6B00]">
                VIP Member • Sector 4
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">Sandeep Kumar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Flat A-402, Green Towers • Resident ID #8849</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Passes</span>
                <p className="text-sm font-black text-[#FF6B00]">3 Booked</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Service</span>
                <p className="text-sm font-black text-[#4F46E5]">18.5 Hrs</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Badges</span>
                <p className="text-sm font-black text-[#16A34A]">4 Earned</p>
              </div>
            </div>
          </GlassCard>

          {/* Achievements Badges */}
          <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Community Badges & Honors</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                <span className="text-2xl">🥇</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Star Volunteer</h4>
                  <p className="text-[10px] text-slate-400">15+ Duty Hours</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Top Sponsor</h4>
                  <p className="text-[10px] text-slate-400">Utsav Donor</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* NOTIFICATIONS TAB */
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <GlassCard isDark={isDark} hoverScale={false} className="p-8 border text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400">No unread notifications at the moment.</p>
            </GlassCard>
          ) : (
            notifications.map((n) => (
              <GlassCard
                key={n.id}
                isDark={isDark}
                hoverScale={false}
                className={`p-4 border flex items-start justify-between gap-3 ${
                  n.unread ? "border-l-4 border-l-[#FF6B00]" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#FF6B00] uppercase">{n.group} • {n.time}</span>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{n.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.desc}</p>
                </div>

                <button
                  onClick={() => handleDismiss(n.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title="Archive Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};
