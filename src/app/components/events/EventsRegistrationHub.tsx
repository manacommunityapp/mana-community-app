import { useState } from "react";
import { Ticket, UserCheck } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { REGISTER_EVENT } from "../../../constants/permissions";
import { EventsRegistration } from "./EventsRegistration";
import { EventsUserRegistration } from "./EventsUserRegistration";

const TABS = [
  { id: "admin",  label: "Manage Registrations", icon: Ticket,    adminOnly: true  },
  { id: "public", label: "Public Registration",  icon: UserCheck, adminOnly: false },
] as const;

export function EventsRegistrationHub() {
  const { hasPermission, isAdmin } = useAuth();
  const canRegister = hasPermission(REGISTER_EVENT);

  const visibleTabs = TABS.filter(t => {
    if (t.id === "admin") return isAdmin;
    if (t.id === "public") return canRegister || isAdmin;
    return true;
  });

  const [tab, setTab] = useState<string>(visibleTabs[0]?.id ?? "admin");

  if (visibleTabs.length === 1) {
    return visibleTabs[0].id === "admin" ? <EventsRegistration /> : <EventsUserRegistration />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
              tab === t.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}>
            <t.icon className="w-4 h-4 flex-shrink-0" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "admin" ? <EventsRegistration /> : <EventsUserRegistration />}
    </div>
  );
}
