import { useState } from "react";
import { Clock, MapPin, Mic2, Music, Trophy, Layers, Star, ChevronRight } from "lucide-react";

const days = ["Day 1 – Aug 27", "Day 2 – Aug 28", "Day 3 – Aug 29"];

type ScheduleItem = {
  time: string; duration: string; title: string; type: string;
  venue: string; performer?: string; judge?: string; icon: any; color: string;
};

// TODO: wire to eventService
const schedule: Record<string, ScheduleItem[]> = {
  "Day 1 – Aug 27": [
    { time: "8:00 AM",  duration: "45m", title: "Ganesh Puja & Aarti",           type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { time: "9:00 AM",  duration: "1h",  title: "Classical Dance – Bharatanatyam",type: "Cultural",     venue: "Main Stage",       performer: "Ananya Troupe", icon: Music,  color: "#8b5cf6" },
    { time: "10:30 AM", duration: "2h",  title: "Cricket Tournament – Pool A",    type: "Sports",       venue: "Ground A",         icon: Trophy, color: "#6366f1" },
    { time: "12:00 PM", duration: "1h",  title: "Lunch & Prasadam",              type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { time: "2:00 PM",  duration: "1h",  title: "Singing Competition – Round 1",  type: "Competition",  venue: "Amphitheatre",     judge: "Ravi Shankar", icon: Mic2,   color: "#4f46e5" },
    { time: "4:00 PM",  duration: "90m", title: "Badminton Tournament",           type: "Sports",       venue: "Indoor Court",     icon: Trophy, color: "#0891b2" },
    { time: "6:00 PM",  duration: "1h",  title: "Chief Guest Address",            type: "Ceremony",     venue: "Main Stage",       performer: "Dr. Arun Kumar", icon: Mic2, color: "#d97706" },
    { time: "7:30 PM",  duration: "90m", title: "Cultural Night – Music Show",    type: "Cultural",     venue: "Main Stage",       performer: "Shankar Band",  icon: Music, color: "#8b5cf6" },
  ],
  "Day 2 – Aug 28": [
    { time: "8:30 AM",  duration: "30m", title: "Morning Aarti",                 type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { time: "9:30 AM",  duration: "2h",  title: "Workshop: Rangoli Art",          type: "Workshop",     venue: "Hall B",           icon: Layers, color: "#be185d" },
    { time: "11:00 AM", duration: "2h",  title: "Cricket Finals",                 type: "Sports",       venue: "Ground A",         icon: Trophy, color: "#6366f1" },
    { time: "1:00 PM",  duration: "1h",  title: "Lunch & Prasadam",              type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { time: "3:00 PM",  duration: "2h",  title: "Elocution & Skit Competition",   type: "Competition",  venue: "Amphitheatre",     icon: Mic2,   color: "#4f46e5" },
    { time: "6:00 PM",  duration: "2h",  title: "Prize Distribution Ceremony",    type: "Ceremony",     venue: "Main Stage",       icon: Trophy, color: "#d97706" },
    { time: "8:00 PM",  duration: "2h",  title: "Bollywood Night",               type: "Cultural",     venue: "Main Stage",       performer: "DJ Fusion",     icon: Music, color: "#8b5cf6" },
  ],
  "Day 3 – Aug 29": [
    { time: "8:00 AM",  duration: "1h",  title: "Morning Puja & Havan",          type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { time: "10:00 AM", duration: "2h",  title: "Laddu Auction",                  type: "Auction",      venue: "Auction Stage",    icon: Layers, color: "#0891b2" },
    { time: "12:00 PM", duration: "30m", title: "Special Lunch – Grand Feast",   type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { time: "2:00 PM",  duration: "3h",  title: "Ganesh Visarjan Procession",     type: "Ritual",       venue: "Community Route",  icon: Star,   color: "#7c3aed" },
    { time: "6:00 PM",  duration: "1h",  title: "Thank You & Closing Ceremony",   type: "Ceremony",     venue: "Main Stage",       icon: Mic2,   color: "#d97706" },
  ],
};

const typeColors: Record<string, { bg: string; text: string }> = {
  Ritual:      { bg: "bg-amber-50",    text: "text-amber-700"    },
  Cultural:    { bg: "bg-violet-50",   text: "text-violet-700"   },
  Sports:      { bg: "bg-indigo-50",   text: "text-indigo-700"   },
  Competition: { bg: "bg-indigo-50",   text: "text-indigo-700"   },
  Workshop:    { bg: "bg-pink-50",     text: "text-pink-700"     },
  Food:        { bg: "bg-emerald-50",  text: "text-emerald-700"  },
  Ceremony:    { bg: "bg-yellow-50",   text: "text-yellow-700"   },
  Auction:     { bg: "bg-cyan-50",     text: "text-cyan-700"     },
};

export function EventsPrograms() {
  const [activeDay, setActiveDay] = useState(days[0]);
  const items = schedule[activeDay] || [];

  return (
    <div className="space-y-6">
      {/* Day tabs */}
      <div className="bg-white rounded-2xl p-1.5 flex gap-1 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        {days.map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
              ${activeDay === d ? "text-white shadow-sm" : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}
            style={activeDay === d ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" } : undefined}>
            {d}
          </button>
        ))}
      </div>

      {/* Schedule timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="font-bold text-slate-800">Program Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} events · {activeDay}</p>
        </div>

        <div className="p-6 space-y-3">
          {items.map((item, i) => {
            const tc = typeColors[item.type] || { bg: "bg-slate-50", text: "text-slate-600" };
            return (
              <div key={i} className="flex gap-5 group animate-fade-in-up">
                {/* Time column */}
                <div className="flex-shrink-0 w-20 pt-1 text-right">
                  <p className="text-xs font-bold text-slate-600">{item.time}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.duration}</p>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: `${item.color}18` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  {i < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" style={{ minHeight: 20 }} />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all group-hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" /> {item.venue}
                          </span>
                          {item.performer && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Mic2 className="w-3 h-3" /> {item.performer}
                            </span>
                          )}
                          {item.judge && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Star className="w-3 h-3" /> Judge: {item.judge}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${tc.bg} ${tc.text}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
