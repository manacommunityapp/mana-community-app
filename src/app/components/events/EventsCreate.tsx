// TODO: wire to eventService
import { useState } from "react";
import {
  CalendarDays, MapPin, Users, DollarSign, Image, Settings,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Clock,
  Globe, Lock, Building2, Trophy, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload, Info,
  Tag, AlertCircle, Check,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";

/* ─── Types ─── */
interface FormData {
  // Step 1 – Basics
  title: string;
  eventType: string;
  category: string;
  description: string;
  visibility: "public" | "community" | "invite";
  // Step 2 – Schedule & Venue
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  multiDay: boolean;
  venueName: string;
  venueAddress: string;
  city: string;
  capacity: string;
  // Step 3 – Registration
  registrationEnabled: boolean;
  registrationDeadline: string;
  ticketTypes: TicketType[];
  requireApproval: boolean;
  allowWaitlist: boolean;
  // Step 4 – Budget
  totalBudget: string;
  budgetItems: BudgetItem[];
  // Step 5 – Media
  coverImageUrl: string;
  tags: string[];
}

interface TicketType {
  id: string;
  name: string;
  price: string;
  qty: string;
  description: string;
}

interface BudgetItem {
  id: string;
  category: string;
  amount: string;
}

/* ─── Constants ─── */
const EVENT_TYPES = [
  { value: "festival",    label: "Festival",       icon: Sparkles,      color: "#7c3aed" },
  { value: "sports",      label: "Sports",         icon: Trophy,        color: "#6366f1" },
  { value: "cultural",    label: "Cultural",       icon: Music,         color: "#8b5cf6" },
  { value: "health",      label: "Health Camp",    icon: Heart,         color: "#be185d" },
  { value: "community",   label: "Community",      icon: Users,         color: "#0891b2" },
  { value: "corporate",   label: "Corporate",      icon: Briefcase,     color: "#374151" },
  { value: "education",   label: "Education",      icon: GraduationCap, color: "#059669" },
  { value: "food",        label: "Food & Dining",  icon: Utensils,      color: "#4f46e5" },
  { value: "outdoor",     label: "Outdoor",        icon: Tent,          color: "#065f46" },
  { value: "other",       label: "Other",          icon: Globe,         color: "#64748b" },
];

const STEPS = [
  { id: 1, label: "Basics",       icon: CalendarDays },
  { id: 2, label: "Schedule",     icon: Clock        },
  { id: 3, label: "Registration", icon: Users        },
  { id: 4, label: "Budget",       icon: DollarSign   },
  { id: 5, label: "Media",        icon: Image        },
  { id: 6, label: "Review",       icon: CheckCircle2 },
];

const BUDGET_CATEGORIES = ["Venue", "Food & Catering", "Decoration", "Audio / Visual", "Security", "Marketing", "Transport", "Volunteers", "Medical", "Other"];

const DEFAULT_TICKET_TYPES: TicketType[] = [
  { id: "t1", name: "General",   price: "0",   qty: "100", description: "Open for all community members" },
  { id: "t2", name: "VIP",       price: "500", qty: "20",  description: "Priority seating & welcome kit" },
];

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: "b1", category: "Venue",            amount: "" },
  { id: "b2", category: "Food & Catering",  amount: "" },
  { id: "b3", category: "Decoration",       amount: "" },
];

/* ─── Sub-components ─── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </Label>
  );
}

function ToggleRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ─── Steps ─── */
function Step1Basics({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel required>Event Title</FieldLabel>
        <Input value={data.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Ganesh Chaturthi 2026 – Grand Celebration"
          className="w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all" />
      </div>

      <div>
        <FieldLabel required>Event Type</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {EVENT_TYPES.map(t => (
            <button key={t.value} onClick={() => update("eventType", t.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-center transition-all",
                data.eventType === t.value
                  ? "border-indigo-500 bg-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.15)]"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
              )}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: data.eventType === t.value ? `${t.color}20` : "#f8fafc" }}>
                <t.icon className="w-4.5 h-4.5" style={{ color: t.color }} />
              </div>
              <span className={cn("text-[11px] font-bold leading-tight", data.eventType === t.value ? "text-indigo-700" : "text-slate-600")}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel required>Description</FieldLabel>
        <Textarea value={data.description} onChange={e => update("description", e.target.value)} rows={4}
          placeholder="Describe your event – purpose, highlights, what attendees can expect…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all resize-none" />
        <p className="text-xs text-slate-400 mt-1.5">{data.description.length} / 1000 characters</p>
      </div>

      <div>
        <FieldLabel>Visibility</FieldLabel>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "public",    label: "Public",    icon: Globe, desc: "Anyone can view" },
            { value: "community", label: "Community", icon: Building2, desc: "Members only" },
            { value: "invite",    label: "Invite Only",icon: Lock, desc: "Private" },
          ].map(opt => (
            <button key={opt.value} onClick={() => update("visibility", opt.value as any)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                data.visibility === opt.value
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              )}>
              <opt.icon className={cn("w-5 h-5 mb-2", data.visibility === opt.value ? "text-indigo-500" : "text-slate-400")} />
              <p className={cn("text-sm font-bold", data.visibility === opt.value ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Schedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const inputCls = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";
  return (
    <div className="space-y-6">
      <ToggleRow checked={data.multiDay} onChange={v => update("multiDay", v)} label="Multi-day event" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Start Date</FieldLabel>
          <Input type="date" value={data.startDate} onChange={e => update("startDate", e.target.value)} className={inputCls} />
        </div>
        {data.multiDay && (
          <div>
            <FieldLabel required>End Date</FieldLabel>
            <Input type="date" value={data.endDate} onChange={e => update("endDate", e.target.value)} className={inputCls} />
          </div>
        )}
        <div>
          <FieldLabel required>Start Time</FieldLabel>
          <Input type="time" value={data.startTime} onChange={e => update("startTime", e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel required>End Time</FieldLabel>
          <Input type="time" value={data.endTime} onChange={e => update("endTime", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" /> Venue Details
        </p>
        <div className="space-y-4">
          <div>
            <FieldLabel required>Venue Name</FieldLabel>
            <Input value={data.venueName} onChange={e => update("venueName", e.target.value)} placeholder="e.g. Community Hall, Society Ground" className={inputCls} />
          </div>
          <div>
            <FieldLabel required>Address</FieldLabel>
            <Textarea value={data.venueAddress} onChange={e => update("venueAddress", e.target.value)} rows={2}
              placeholder="Full address of the venue"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>City</FieldLabel>
              <Input value={data.city} onChange={e => update("city", e.target.value)} placeholder="City" className={inputCls} />
            </div>
            <div>
              <FieldLabel>Max Capacity</FieldLabel>
              <Input type="number" value={data.capacity} onChange={e => update("capacity", e.target.value)} placeholder="e.g. 500" className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Registration({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const inputCls = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";
  const addTicket = () => {
    const newTicket: TicketType = { id: `t${Date.now()}`, name: "", price: "0", qty: "", description: "" };
    update("ticketTypes", [...data.ticketTypes, newTicket]);
  };
  const removeTicket = (id: string) => update("ticketTypes", data.ticketTypes.filter(t => t.id !== id));
  const updateTicket = (id: string, field: keyof TicketType, value: string) =>
    update("ticketTypes", data.ticketTypes.map(t => t.id === id ? { ...t, [field]: value } : t));

  return (
    <div className="space-y-5">
      <ToggleRow checked={data.registrationEnabled} onChange={v => update("registrationEnabled", v)} label="Enable event registration" />

      {data.registrationEnabled && (
        <div className="space-y-5 animate-fade-in-up">
          <div>
            <FieldLabel>Registration Deadline</FieldLabel>
            <Input type="date" value={data.registrationDeadline} onChange={e => update("registrationDeadline", e.target.value)} className={inputCls} />
          </div>

          <ToggleRow checked={data.requireApproval} onChange={v => update("requireApproval", v)} label="Require admin approval for registrations" />
          <ToggleRow checked={data.allowWaitlist} onChange={v => update("allowWaitlist", v)} label="Enable waitlist when tickets are full" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Ticket / Category Types</FieldLabel>
              <button onClick={addTicket}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                <Plus className="w-3.5 h-3.5" /> Add Type
              </button>
            </div>
            <div className="space-y-3">
              {data.ticketTypes.map((ticket, i) => (
                <div key={ticket.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Category {i + 1}</span>
                    {data.ticketTypes.length > 1 && (
                      <button onClick={() => removeTicket(ticket.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>Category Name</FieldLabel>
                      <Input value={ticket.name} onChange={e => updateTicket(ticket.id, "name", e.target.value)} placeholder="e.g. Family, VIP" className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel>Price (₹)</FieldLabel>
                      <Input type="number" value={ticket.price} onChange={e => updateTicket(ticket.id, "price", e.target.value)} placeholder="0 = Free" className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel>Capacity</FieldLabel>
                      <Input type="number" value={ticket.qty} onChange={e => updateTicket(ticket.id, "qty", e.target.value)} placeholder="Seats" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <Input value={ticket.description} onChange={e => updateTicket(ticket.id, "description", e.target.value)} placeholder="What's included for this category?" className={inputCls} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Budget({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const inputCls = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";
  const addItem = () => update("budgetItems", [...data.budgetItems, { id: `b${Date.now()}`, category: "", amount: "" }]);
  const removeItem = (id: string) => update("budgetItems", data.budgetItems.filter(b => b.id !== id));
  const updateItem = (id: string, field: keyof BudgetItem, value: string) =>
    update("budgetItems", data.budgetItems.map(b => b.id === id ? { ...b, [field]: value } : b));

  const totalAllocated = data.budgetItems.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalBudgetNum = parseFloat(data.totalBudget) || 0;
  const pct = totalBudgetNum > 0 ? Math.min(100, (totalAllocated / totalBudgetNum) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel required>Total Event Budget (₹)</FieldLabel>
        <Input type="number" value={data.totalBudget} onChange={e => update("totalBudget", e.target.value)} placeholder="e.g. 500000" className={inputCls} />
      </div>

      {/* Budget allocation progress */}
      {totalBudgetNum > 0 && (
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-indigo-600">Allocated</span>
            <span className="text-indigo-800">₹{totalAllocated.toLocaleString()} / ₹{totalBudgetNum.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-indigo-500 mt-1.5">{pct.toFixed(0)}% of budget allocated</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <FieldLabel>Budget Breakdown</FieldLabel>
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
            <Plus className="w-3.5 h-3.5" /> Add Line
          </button>
        </div>
        <div className="space-y-2.5">
          {data.budgetItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 animate-fade-in-up">
              <Select value={item.category} onValueChange={v => updateItem(item.id, "category", v)}>
                <SelectTrigger className="flex-1 h-auto px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus-visible:border-indigo-400">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="w-36 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <Input value={item.amount} onChange={e => updateItem(item.id, "amount", e.target.value)}
                  type="number" placeholder="Amount" className={cn(inputCls, "pl-7")} />
              </div>
              <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Media({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const inputCls = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !data.tags.includes(t)) {
      update("tags", [...data.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => update("tags", data.tags.filter(x => x !== t));

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Cover Image URL</FieldLabel>
        <Input value={data.coverImageUrl} onChange={e => update("coverImageUrl", e.target.value)}
          placeholder="https://images.unsplash.com/…" className={inputCls} />
        {data.coverImageUrl && (
          <div className="mt-3 h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <img src={data.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={() => {}} />
          </div>
        )}
        {!data.coverImageUrl && (
          <div className="mt-3 h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
            <Upload className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-400 font-medium">Paste image URL above to preview</p>
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Tags</FieldLabel>
        <div className="flex gap-2 mb-3">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag (e.g. festival, 2026)…" className={inputCls} />
          <Button onClick={addTag} className="px-4 py-3 h-auto rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-all flex-shrink-0">
            Add
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map(t => (
              <Badge key={t} variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                <Tag className="w-3 h-3" /> {t}
                <button onClick={() => removeTag(t)} className="hover:text-rose-500 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Step6Review({ data }: { data: FormData }) {
  const eventType = EVENT_TYPES.find(t => t.value === data.eventType);
  const totalBudget = parseFloat(data.totalBudget) || 0;
  const totalAllocated = data.budgetItems.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  const sections = [
    {
      title: "Event Basics",
      items: [
        { label: "Title",      value: data.title || "—"                    },
        { label: "Type",       value: eventType?.label || "—"              },
        { label: "Visibility", value: data.visibility                      },
      ],
    },
    {
      title: "Schedule & Venue",
      items: [
        { label: "Date",     value: data.startDate ? `${data.startDate}${data.multiDay && data.endDate ? ` → ${data.endDate}` : ""}` : "—" },
        { label: "Time",     value: data.startTime ? `${data.startTime} – ${data.endTime}` : "—" },
        { label: "Venue",    value: data.venueName || "—"                  },
        { label: "City",     value: data.city || "—"                       },
        { label: "Capacity", value: data.capacity || "—"                   },
      ],
    },
    {
      title: "Registration",
      items: [
        { label: "Enabled",      value: data.registrationEnabled ? "Yes" : "No"   },
        { label: "Categories",   value: data.ticketTypes.filter(t => t.name).map(t => `${t.name} (₹${t.price})`).join(", ") || "—" },
        { label: "Deadline",     value: data.registrationDeadline || "—"           },
        { label: "Approval",     value: data.requireApproval ? "Required" : "Auto" },
        { label: "Waitlist",     value: data.allowWaitlist ? "Enabled" : "Disabled"},
      ],
    },
    {
      title: "Budget",
      items: [
        { label: "Total Budget",    value: totalBudget ? `₹${totalBudget.toLocaleString()}` : "—" },
        { label: "Total Allocated", value: totalAllocated ? `₹${totalAllocated.toLocaleString()}` : "—" },
      ],
    },
  ];

  const warnings: string[] = [];
  if (!data.title) warnings.push("Event title is required.");
  if (!data.eventType) warnings.push("Please select an event type.");
  if (!data.startDate) warnings.push("Start date is required.");
  if (!data.venueName) warnings.push("Venue name is required.");

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Complete these before publishing:</p>
            <ul className="space-y-0.5">
              {warnings.map(w => <li key={w} className="text-xs text-amber-700">· {w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {sections.map(sec => (
        <div key={sec.title} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-100 border-b border-slate-200">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{sec.title}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {sec.items.map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 px-5 py-3">
                <span className="text-xs font-semibold text-slate-500 flex-shrink-0 w-28">{item.label}</span>
                <span className="text-sm font-medium text-slate-800 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.coverImageUrl && (
        <div className="h-32 rounded-xl overflow-hidden border border-slate-200">
          <img src={data.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.tags.map(t => (
            <Badge key={t} variant="outline" className="px-3 py-1 bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
              #{t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export function EventsCreate() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "", eventType: "", category: "", description: "",
    visibility: "community",
    startDate: "", endDate: "", startTime: "", endTime: "",
    multiDay: false, venueName: "", venueAddress: "", city: "", capacity: "",
    registrationEnabled: true, registrationDeadline: "",
    ticketTypes: DEFAULT_TICKET_TYPES,
    requireApproval: false, allowWaitlist: true,
    totalBudget: "", budgetItems: DEFAULT_BUDGET_ITEMS,
    coverImageUrl: "", tags: [],
  });

  const update = (key: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6
          shadow-[0_0_0_8px_rgba(16,185,129,0.1)]">
          <Check className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Event Created!</h2>
        <p className="text-slate-500 mb-8">"{formData.title || "Your event"}" has been created and is now {formData.visibility === "public" ? "publicly visible" : "live for your community"}.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setStep(1); }}
            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all">
            Create Another
          </button>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all">
            View Event
          </button>
        </div>
      </div>
    );
  }

  const stepComponents: Record<number, JSX.Element> = {
    1: <Step1Basics data={formData} update={update} />,
    2: <Step2Schedule data={formData} update={update} />,
    3: <Step3Registration data={formData} update={update} />,
    4: <Step4Budget data={formData} update={update} />,
    5: <Step5Media data={formData} update={update} />,
    6: <Step6Review data={formData} />,
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Create New Event</h1>
        <p className="text-slate-500 text-sm">Fill in the details step by step to publish your event.</p>
      </div>

      {/* Step progress */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => done && setStep(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    active ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                    : done ? "bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-400"
                  )}>
                  {done
                    ? <Check className="w-3.5 h-3.5" />
                    : <s.icon className="w-3.5 h-3.5" />
                  }
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={cn("w-3.5 h-3.5 flex-shrink-0", done ? "text-emerald-400" : "text-slate-300")} />
                )}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Step header */}
        <div className="px-8 py-5 border-b border-slate-50"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #fff 60%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {(() => { const S = STEPS[step - 1]; return <S.icon className="w-5 h-5 text-white" />; })()}
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Step {step} of {STEPS.length}</p>
              <h2 className="font-black text-slate-900">{STEPS[step - 1].label}</h2>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <div key={step} className="animate-fade-in-up">
            {stepComponents[step]}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              step === 1 ? "text-slate-300 cursor-not-allowed" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
            )}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-xs font-semibold text-slate-400">{step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm hover:from-indigo-700 hover:to-violet-600 transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all">
              <Sparkles className="w-4 h-4" /> Publish Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
