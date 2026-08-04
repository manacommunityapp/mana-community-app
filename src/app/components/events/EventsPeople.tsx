import { useState } from "react";
import { Users, MapPin } from "lucide-react";
import { EventsVolunteers } from "./EventsVolunteers";
import { EventsVenue } from "./EventsVenue";

const TABS = [
  { id: "volunteers", label: "Volunteers", icon: Users  },
  { id: "venue",      label: "Venue",      icon: MapPin },
] as const;

export function EventsPeople() {
  const [tab, setTab] = useState<string>("volunteers");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "volunteers" ? <EventsVolunteers /> : <EventsVenue />}
    </div>
  );
}
