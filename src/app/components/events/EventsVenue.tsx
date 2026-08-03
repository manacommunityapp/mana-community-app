import { Car, Shield, Stethoscope, Wifi, Zap, Wind } from "lucide-react";

// TODO: wire to eventService
const zones = [
  { id: "A", name: "Main Stage",       capacity: 2000, occupied: 1650, type: "Stage",    color: "#6366f1" },
  { id: "B", name: "Dining Hall",      capacity: 500,  occupied: 320,  type: "Food",     color: "#10b981" },
  { id: "C", name: "Registration Area",capacity: 100,  occupied: 42,   type: "Admin",    color: "#0891b2" },
  { id: "D", name: "Amphitheatre",     capacity: 800,  occupied: 600,  type: "Cultural", color: "#8b5cf6" },
  { id: "E", name: "Ground A",         capacity: 300,  occupied: 200,  type: "Sports",   color: "#4f46e5" },
  { id: "F", name: "Parking Lot",      capacity: 400,  occupied: 285,  type: "Parking",  color: "#d97706" },
  { id: "G", name: "Medical Camp",     capacity: 20,   occupied: 4,    type: "Medical",  color: "#be185d" },
  { id: "H", name: "VIP Lounge",       capacity: 50,   occupied: 28,   type: "VIP",      color: "#f59e0b" },
];

const facilities = [
  { name: "Power Supply",    status: "ok",      icon: Zap,         note: "Generator backup active" },
  { name: "WiFi Coverage",   status: "ok",      icon: Wifi,        note: "6 access points deployed" },
  { name: "Medical Team",    status: "ok",      icon: Stethoscope, note: "2 doctors, 4 paramedics" },
  { name: "Security",        status: "ok",      icon: Shield,      note: "48 guards, 12 CCTV cams" },
  { name: "Parking",         status: "warning", icon: Car,         note: "71% capacity – monitor" },
  { name: "Air Cooling",     status: "ok",      icon: Wind,        note: "8 industrial fans active" },
];

const statusDot: Record<string, string> = {
  ok:      "bg-emerald-400",
  warning: "bg-amber-400",
  error:   "bg-rose-500",
};

export function EventsVenue() {
  return (
    <div className="space-y-6">
      {/* Zone occupancy overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-800">Venue Zone Occupancy</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time capacity tracking</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const pct = Math.round((zone.occupied / zone.capacity) * 100);
            const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : zone.color;
            return (
              <div key={zone.id}
                className="animate-fade-in-up p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: zone.color }}>
                    {zone.id}
                  </div>
                  <span className="text-xs font-black tabular-nums" style={{ color: barColor }}>{pct}%</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">{zone.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{zone.type}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-slate-500">{zone.occupied.toLocaleString()} people</span>
                    <span className="text-slate-400">cap {zone.capacity.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: barColor, width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Venue map placeholder */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <h2 className="font-bold text-slate-800 mb-4">Venue Layout Map</h2>
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center"
          style={{ height: 280 }}>
          <div className="grid grid-cols-3 gap-3 p-8 w-full">
            {zones.slice(0, 6).map(z => (
              <div key={z.id} className="rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1"
                style={{ background: `${z.color}18`, border: `1.5px solid ${z.color}30`, minHeight: 70 }}>
                <span className="text-lg font-black" style={{ color: z.color }}>{z.id}</span>
                <p className="text-[9px] font-bold text-slate-600">{z.name}</p>
                <p className="text-[9px] text-slate-400">{Math.round(z.occupied/z.capacity*100)}%</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">Interactive venue map · Click zones to manage</p>
      </div>

      {/* Facilities status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <h2 className="font-bold text-slate-800 mb-5">Facility Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((f) => (
            <div key={f.name}
              className="animate-fade-in-up flex items-center gap-4 p-4 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.status === "ok" ? "bg-emerald-50" : "bg-amber-50"}`}>
                <f.icon className={`w-5 h-5 ${f.status === "ok" ? "text-emerald-600" : "text-amber-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{f.name}</p>
                  <span className={`w-2 h-2 rounded-full ${statusDot[f.status]}`} />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{f.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
