import { Users, Clock, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// TODO: wire to eventService
const departments = [
  { name: "Registration",  head: "Priya S.",   total: 18, present: 16, color: "#6366f1" },
  { name: "Food & Kitchen",head: "Ravi M.",    total: 42, present: 38, color: "#4f46e5" },
  { name: "Security",      head: "Amit P.",    total: 24, present: 22, color: "#0891b2" },
  { name: "Venue & Decor", head: "Sara J.",    total: 30, present: 28, color: "#8b5cf6" },
  { name: "Medical",       head: "Dr. Neha",   total: 8,  present: 8,  color: "#be185d" },
  { name: "Parking",       head: "Karan T.",   total: 12, present: 10, color: "#d97706" },
  { name: "Audio/Visual",  head: "Deepak J.",  total: 10, present: 9,  color: "#0f766e" },
  { name: "Guest Mgmt",    head: "Anita D.",   total: 15, present: 13, color: "#059669" },
];

const volunteers = [
  { id: "V-001", name: "Rahul Nair",     dept: "Food & Kitchen", shift: "Morning (6AM-2PM)", status: "Active",    contact: "+91 98001 11111" },
  { id: "V-002", name: "Meera Pillai",   dept: "Registration",   shift: "Morning (8AM-1PM)", status: "Active",    contact: "+91 98002 22222" },
  { id: "V-003", name: "Suresh Babu",    dept: "Security",       shift: "Full Day",          status: "Active",    contact: "+91 98003 33333" },
  { id: "V-004", name: "Kavitha Rao",    dept: "Venue & Decor",  shift: "Evening (2PM-10PM)",status: "On Break",  contact: "+91 98004 44444" },
  { id: "V-005", name: "Ajay Mathur",    dept: "Parking",        shift: "Morning (7AM-1PM)", status: "Active",    contact: "+91 98005 55555" },
  { id: "V-006", name: "Divya Menon",    dept: "Audio/Visual",   shift: "Full Day",          status: "Absent",    contact: "+91 98006 66666" },
  { id: "V-007", name: "Sanjay Gupta",   dept: "Guest Mgmt",     shift: "Evening (4PM-10PM)",status: "Active",    contact: "+91 98007 77777" },
];

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  Active:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "On Break":{ bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  Absent:    { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
};

export function EventsVolunteers() {
  const totalVols = departments.reduce((a, d) => a + d.total, 0);
  const totalPresent = departments.reduce((a, d) => a + d.present, 0);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Volunteers", value: totalVols,                color: "#4f46e5" },
          { label: "Present Today",    value: totalPresent,             color: "#10b981" },
          { label: "Departments",      value: departments.length,       color: "#6366f1" },
          { label: "Attendance Rate",  value: `${Math.round(totalPresent / totalVols * 100)}%`, color: "#d97706" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Department grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Departments</h2>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Department
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const pct = Math.round((dept.present / dept.total) * 100);
            return (
              <div key={dept.name}
                className="animate-fade-in-up p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${dept.color}18` }}>
                    <Users className="w-4 h-4" style={{ color: dept.color }} />
                  </div>
                  <span className="text-xs font-black" style={{ color: dept.color }}>{pct}%</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">{dept.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Head: {dept.head}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-slate-500">{dept.present} present</span>
                    <span className="text-slate-400">of {dept.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: dept.color, width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volunteer list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800">Volunteer Directory</h2>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Assign Volunteer
          </button>
        </div>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                {["ID", "Name", "Department", "Shift", "Status", "Contact", "Actions"].map(h => (
                  <TableHead key={h} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {volunteers.map((v) => {
                const ss = statusStyle[v.status];
                return (
                  <TableRow key={v.id} className="animate-fade-in-up hover:bg-slate-50/60 transition-colors">
                    <TableCell className="px-6 py-3.5 font-mono text-xs text-slate-400">{v.id}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {v.name[0]}
                        </div>
                        <span className="font-semibold text-slate-800">{v.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-slate-600 text-xs">{v.dept}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> {v.shift}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} /> {v.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-slate-500 font-mono">{v.contact}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex gap-2">
                        <button className="text-xs font-semibold text-indigo-600 hover:underline">Edit</button>
                        <button className="text-xs font-semibold text-indigo-600 hover:underline">Certificate</button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
