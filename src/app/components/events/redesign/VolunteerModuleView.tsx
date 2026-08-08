import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Clock, PhoneCall, Award, Users, AlertCircle, Sparkles } from "lucide-react";
import { GlassCard, TouchButton, StatusChip } from "./EventDesignSystem";

interface VolunteerModuleViewProps {
  isDark?: boolean;
}

export const VolunteerModuleView: React.FC<VolunteerModuleViewProps> = ({ isDark = false }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const shiftData = {
    dutyTitle: "Prasadam & Meal Crowd Management",
    department: "Food & Dining Division",
    shiftTime: "11:30 AM – 03:30 PM (Today)",
    shiftLeader: "Ramesh Sharma (+91 98111 22334)",
    emergencyContact: "+91 99999 00000 (Control Room)",
    venue: "Gate 2 Prasadam Hall",
    totalDutyHours: "18.5 Hours Total",
  };

  const shiftTimeline = [
    { time: "08:00 AM - 12:00 PM", title: "Morning Aarti Gate Security", status: "Completed", count: "12 Volunteers" },
    { time: "11:30 AM - 03:30 PM", title: "Prasadam Queue & Dining Help", status: "In Progress", count: "24 Volunteers" },
    { time: "05:00 PM - 09:00 PM", title: "Stage & VIP Escort Duty", status: "Upcoming", count: "18 Volunteers" },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Volunteer OS
        </span>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Volunteer & Duty Roster</h2>
      </div>

      {/* Today's Duty Highlight Card */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Assigned Duty Today</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{shiftData.dutyTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{shiftData.department} • {shiftData.venue}</p>
          </div>
          <StatusChip status={isCheckedIn ? "Checked In" : "Pending Duty"} isDark={isDark} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Shift Hours</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{shiftData.shiftTime}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Shift Leader</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">{shiftData.shiftLeader}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <TouchButton
            variant={isCheckedIn ? "glass" : "primary"}
            fullWidth
            onClick={() => setIsCheckedIn(!isCheckedIn)}
          >
            {isCheckedIn ? "✅ Checked-In at Gate 2" : "Check-in Duty Now"}
          </TouchButton>

          <button
            onClick={() => window.open("tel:9999900000")}
            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Emergency Call"
          >
            <PhoneCall className="w-5 h-5" />
          </button>
        </div>
      </GlassCard>

      {/* Duty Shift Timeline */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Today's Shift Roster</h3>
        <div className="space-y-3">
          {shiftTimeline.map((s, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border">
              <div>
                <span className="text-[10px] font-mono text-[#FF6B00] font-bold">{s.time}</span>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">{s.title}</h4>
                <span className="text-[10px] text-slate-400">{s.count}</span>
              </div>
              <StatusChip status={s.status} isDark={isDark} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Certificate & Achievements Card */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Volunteer Certificate Ready</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">18.5 Verified Service Hours completed</p>
          </div>
        </div>

        <button
          onClick={() => alert("Certificate downloaded!")}
          className="px-3 py-2 rounded-xl bg-[#FF6B00] text-white text-xs font-bold shadow-xs hover:scale-105 cursor-pointer"
        >
          Download
        </button>
      </GlassCard>
    </div>
  );
};
