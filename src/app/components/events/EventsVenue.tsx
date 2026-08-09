import { useState, useEffect } from "react";
import { Car, Shield, Stethoscope, Wifi, Zap, Wind, Save, RefreshCw, CheckCircle2, AlertTriangle, Edit3 } from "lucide-react";
import { eventVenueService, type EventZoneDto, type EventFacilityDto } from "../../../services/events/eventVenueService";

const FACILITY_ICONS: Record<string, any> = {
  "Power Supply": Zap,
  "WiFi Coverage": Wifi,
  "Medical Team": Stethoscope,
  Security: Shield,
  Parking: Car,
  "Air Cooling": Wind,
};

const statusDot: Record<string, string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-rose-500",
};

export function EventsVenue() {
  const [configId, setConfigId] = useState<number | undefined>();
  const [venueName, setVenueName] = useState("Main Community Grounds");
  const [zones, setZones] = useState<EventZoneDto[]>([]);
  const [facilities, setFacilities] = useState<EventFacilityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingZone, setEditingZone] = useState<EventZoneDto | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await eventVenueService.getVenueConfig();
    setConfigId(data.id);
    setVenueName(data.venueName);
    setZones(data.zones);
    setFacilities(data.facilities);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const res = await eventVenueService.saveVenueConfig({
      id: configId,
      venueName,
      zones,
      facilities,
    });
    if (res && res.id) {
      setConfigId(res.id);
    }
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleOccupancyChange = (id: string, delta: number) => {
    setZones(prev =>
      prev.map(z => {
        if (z.id === id) {
          const newOccupied = Math.max(0, Math.min(z.capacity, z.occupied + delta));
          return { ...z, occupied: newOccupied };
        }
        return z;
      })
    );
  };

  const handleFacilityStatusToggle = (index: number) => {
    const statuses: Array<"ok" | "warning" | "error"> = ["ok", "warning", "error"];
    setFacilities(prev =>
      prev.map((f, i) => {
        if (i === index) {
          const nextIdx = (statuses.indexOf(f.status) + 1) % statuses.length;
          return { ...f, status: statuses[nextIdx] };
        }
        return f;
      })
    );
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header bar with backend persistence status */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-base sm:text-lg">{venueName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live Zone Occupancy & Facility Management (Database Persisted)</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Saved to DB
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save to Database"}
          </button>
        </div>
      </div>

      {/* Zone occupancy overview */}
      <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Venue Zone Occupancy</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Real-time capacity tracking & adjustments</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Backend Data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {zones.map(zone => {
            const pct = Math.round((zone.occupied / zone.capacity) * 100);
            const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : zone.color;
            return (
              <div
                key={zone.id}
                className="animate-fade-in-up p-3 sm:p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-[10px] sm:text-xs font-black flex-shrink-0"
                    style={{ background: zone.color }}
                  >
                    {zone.id}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tabular-nums" style={{ color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <p className="font-bold text-slate-800 text-xs sm:text-sm">{zone.name}</p>
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

                {/* Inline Quick Controls */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                  <span className="text-slate-400 font-medium">Adjust:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOccupancyChange(zone.id, -50)}
                      className="px-2 py-0.5 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-700 font-bold cursor-pointer"
                    >
                      -50
                    </button>
                    <button
                      onClick={() => handleOccupancyChange(zone.id, 50)}
                      className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold cursor-pointer"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Venue layout map */}
      <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <h2 className="font-bold text-slate-800 mb-4 text-sm sm:text-base">Venue Layout Map</h2>
        <div
          className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center"
          style={{ minHeight: 200 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-4 sm:p-8 w-full">
            {zones.slice(0, 6).map(z => (
              <div
                key={z.id}
                className="rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1"
                style={{ background: `${z.color}18`, border: `1.5px solid ${z.color}30`, minHeight: 70 }}
              >
                <span className="text-sm sm:text-lg font-black" style={{ color: z.color }}>
                  {z.id}
                </span>
                <p className="text-[9px] font-bold text-slate-600">{z.name}</p>
                <p className="text-[9px] text-slate-400">{Math.round((z.occupied / z.capacity) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">Interactive venue map · Click zones to adjust occupancy</p>
      </div>

      {/* Facilities status */}
      <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Facility Status</h2>
          <span className="text-[10px] text-slate-400">Click card to toggle status (OK / Warning / Error)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((f, idx) => {
            const IconComp = FACILITY_ICONS[f.name] || Shield;
            return (
              <div
                key={f.name}
                onClick={() => handleFacilityStatusToggle(idx)}
                className="animate-fade-in-up flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer select-none"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    f.status === "ok" ? "bg-emerald-50" : f.status === "warning" ? "bg-amber-50" : "bg-rose-50"
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      f.status === "ok" ? "text-emerald-600" : f.status === "warning" ? "text-amber-600" : "text-rose-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{f.name}</p>
                    <span className={`w-2 h-2 rounded-full ${statusDot[f.status]}`} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{f.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
