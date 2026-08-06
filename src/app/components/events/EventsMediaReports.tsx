import { useState } from "react";
import { ImageIcon, BarChart3 } from "lucide-react";
import { EventsGallery } from "./EventsGallery";
import { EventsReports } from "./EventsReports";

const TABS = [
  { id: "gallery", label: "Gallery",          icon: ImageIcon },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
] as const;

export function EventsMediaReports() {
  const [tab, setTab] = useState<string>("gallery");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
              tab === t.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}>
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "gallery" ? <EventsGallery /> : <EventsReports />}
    </div>
  );
}
