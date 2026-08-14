import { useState } from "react";
import {
  UtensilsCrossed, Flame, Heart, Gavel,
  Plus, Search, Eye, Pencil, Copy, Trash2,
  FileText, CheckCircle2, Clock, XCircle, Archive,
  Users, Calendar, BarChart3, QrCode, MoreVertical,
  Globe, Ticket, UserCheck,
} from "lucide-react";
import { TabSwitcher } from "./shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { REGISTER_EVENT } from "../../../constants/permissions";
import { EventsRegistration } from "./EventsRegistration";
import { EventsRegistrationForms } from "./EventsRegistrationForms";
import { EventsUserRegistration } from "./EventsUserRegistration";

/* ─── Types ─── */
type FormStatus = "draft" | "active" | "closed" | "archived";

interface FormItem {
  id: string;
  name: string;
  description: string;
  status: FormStatus;
  createdAt: string;
  responsesCount: number;
  maxCapacity: number | null;
  fieldsCount: number;
  deadline: string | null;
}

/* ─── Status helpers ─── */
const STATUS_CONFIG: Record<FormStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active:   { label: "Active",   color: "bg-emerald-100 text-emerald-700 border-emerald-200",  icon: CheckCircle2 },
  draft:    { label: "Draft",    color: "bg-amber-100 text-amber-700 border-amber-200",         icon: Clock },
  closed:   { label: "Closed",   color: "bg-red-100 text-red-700 border-red-200",               icon: XCircle },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-500 border-slate-200",         icon: Archive },
};

/* ─── Sample Data ─── */
const FOOD_CULTURAL_FORMS: FormItem[] = [
  {
    id: "FC-001",
    name: "Prasad & Food Booking Form",
    description: "Order prasad meals, sweet boxes, and food packages for the festival",
    status: "active",
    createdAt: "2026-08-01",
    responsesCount: 142,
    maxCapacity: 300,
    fieldsCount: 8,
    deadline: "2026-08-20",
  },
  {
    id: "FC-002",
    name: "Potluck Dish Sign-up",
    description: "Community members can sign up to bring a dish for the potluck dinner",
    status: "active",
    createdAt: "2026-08-03",
    responsesCount: 67,
    maxCapacity: 80,
    fieldsCount: 6,
    deadline: "2026-08-18",
  },
  {
    id: "FC-003",
    name: "Cultural Performance Registration",
    description: "Register your group or individual performance for the cultural evening",
    status: "active",
    createdAt: "2026-07-25",
    responsesCount: 24,
    maxCapacity: 30,
    fieldsCount: 10,
    deadline: "2026-08-15",
  },
  {
    id: "FC-004",
    name: "Catering Preference & Dietary Form",
    description: "Collect dietary restrictions and meal preferences for catering planning",
    status: "draft",
    createdAt: "2026-08-05",
    responsesCount: 0,
    maxCapacity: null,
    fieldsCount: 7,
    deadline: null,
  },
  {
    id: "FC-005",
    name: "Cooking Competition Entry",
    description: "Register for the annual community cooking contest with dish details",
    status: "closed",
    createdAt: "2026-07-10",
    responsesCount: 38,
    maxCapacity: 40,
    fieldsCount: 9,
    deadline: "2026-07-31",
  },
];

const POOJA_FORMS: FormItem[] = [
  {
    id: "PJ-001",
    name: "Pooja Sponsorship Form",
    description: "Sponsor a specific pooja or seva for the event on behalf of your family",
    status: "active",
    createdAt: "2026-07-28",
    responsesCount: 89,
    maxCapacity: 200,
    fieldsCount: 9,
    deadline: "2026-08-21",
  },
  {
    id: "PJ-002",
    name: "Archana & Abhishekam Request",
    description: "Request a personal archana or abhishekam with specific nakshatra details",
    status: "active",
    createdAt: "2026-08-02",
    responsesCount: 55,
    maxCapacity: null,
    fieldsCount: 7,
    deadline: "2026-08-22",
  },
  {
    id: "PJ-003",
    name: "Sankalpam Registration",
    description: "Submit family details for the auspicious sankalpam during the main pooja",
    status: "active",
    createdAt: "2026-08-04",
    responsesCount: 33,
    maxCapacity: 50,
    fieldsCount: 12,
    deadline: "2026-08-19",
  },
  {
    id: "PJ-004",
    name: "Homam Participant Sign-up",
    description: "Join the homam as a participant or sponsor individual ahutis",
    status: "draft",
    createdAt: "2026-08-06",
    responsesCount: 0,
    maxCapacity: 108,
    fieldsCount: 8,
    deadline: null,
  },
  {
    id: "PJ-005",
    name: "Graha Pravesam Pooja Request",
    description: "Book a special graha pravesam pooja for new homes with priest details",
    status: "archived",
    createdAt: "2026-06-01",
    responsesCount: 12,
    maxCapacity: null,
    fieldsCount: 10,
    deadline: "2026-07-15",
  },
];

const DONATION_FORMS: FormItem[] = [
  {
    id: "DN-001",
    name: "General Event Donation Form",
    description: "Accept general donations to support event costs and community programs",
    status: "active",
    createdAt: "2026-07-20",
    responsesCount: 203,
    maxCapacity: null,
    fieldsCount: 6,
    deadline: "2026-08-31",
  },
  {
    id: "DN-002",
    name: "Temple Construction Fund",
    description: "Contributions toward the new community temple construction project",
    status: "active",
    createdAt: "2026-07-01",
    responsesCount: 156,
    maxCapacity: null,
    fieldsCount: 8,
    deadline: null,
  },
  {
    id: "DN-003",
    name: "Scholarship Donation Drive",
    description: "Fund scholarships for deserving students in the community",
    status: "active",
    createdAt: "2026-08-01",
    responsesCount: 94,
    maxCapacity: null,
    fieldsCount: 7,
    deadline: "2026-09-30",
  },
  {
    id: "DN-004",
    name: "Annual Charity Gala Pledge",
    description: "Pledge donations for the annual charity gala with recognition tiers",
    status: "draft",
    createdAt: "2026-08-07",
    responsesCount: 0,
    maxCapacity: null,
    fieldsCount: 9,
    deadline: null,
  },
  {
    id: "DN-005",
    name: "Senior Care Support Fund",
    description: "Monthly contribution form for senior member care and assistance programs",
    status: "closed",
    createdAt: "2026-05-01",
    responsesCount: 78,
    maxCapacity: null,
    fieldsCount: 6,
    deadline: "2026-07-31",
  },
];

const AUCTION_FORMS: FormItem[] = [
  {
    id: "AU-001",
    name: "Silent Auction Bidder Registration",
    description: "Register as a bidder for the silent auction with paddle assignment",
    status: "active",
    createdAt: "2026-08-03",
    responsesCount: 118,
    maxCapacity: 200,
    fieldsCount: 7,
    deadline: "2026-08-22",
  },
  {
    id: "AU-002",
    name: "Auction Item Submission Form",
    description: "Submit items for the auction with description, photo, and reserve price",
    status: "active",
    createdAt: "2026-08-01",
    responsesCount: 44,
    maxCapacity: 60,
    fieldsCount: 11,
    deadline: "2026-08-17",
  },
  {
    id: "AU-003",
    name: "Live Auction VIP Registration",
    description: "Reserve a seat for live auction with pre-approval and deposit details",
    status: "active",
    createdAt: "2026-08-05",
    responsesCount: 29,
    maxCapacity: 50,
    fieldsCount: 9,
    deadline: "2026-08-20",
  },
  {
    id: "AU-004",
    name: "Online Auction Participation Form",
    description: "Sign up for the online bidding platform with verification and terms",
    status: "draft",
    createdAt: "2026-08-08",
    responsesCount: 0,
    maxCapacity: null,
    fieldsCount: 8,
    deadline: null,
  },
  {
    id: "AU-005",
    name: "Charity Auction Winner Claim Form",
    description: "Collect payment and delivery details from auction winners",
    status: "draft",
    createdAt: "2026-08-08",
    responsesCount: 0,
    maxCapacity: null,
    fieldsCount: 10,
    deadline: null,
  },
];

/* ─── Form Card ─── */
function FormCard({ form }: { form: FormItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[form.status];
  const Icon = cfg.icon;
  const fillPct = form.maxCapacity ? Math.min(100, Math.round((form.responsesCount / form.maxCapacity) * 100)) : null;

  return (
    <div className="relative bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-indigo-100 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
            {form.name}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{form.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.color)}>
            <Icon className="w-2.5 h-2.5" />
            {cfg.label}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 bg-white border border-slate-100 rounded-xl shadow-lg py-1 w-36 text-xs">
                {[
                  { icon: Eye, label: "View" },
                  { icon: Pencil, label: "Edit" },
                  { icon: Copy, label: "Duplicate" },
                  { icon: QrCode, label: "Share QR" },
                  { icon: Globe, label: "Public Link" },
                  { icon: Trash2, label: "Delete", danger: true },
                ].map(({ icon: I, label, danger }) => (
                  <button
                    key={label}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 transition-colors",
                      danger ? "text-red-500 hover:bg-red-50" : "text-slate-600"
                    )}
                  >
                    <I className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-3">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {form.responsesCount} responses
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {form.fieldsCount} fields
        </span>
        {form.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due {form.deadline}
          </span>
        )}
      </div>

      {/* Capacity bar */}
      {fillPct !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Capacity</span>
            <span className="font-medium text-slate-600">{form.responsesCount} / {form.maxCapacity}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-400" : "bg-emerald-500"
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
        <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1 gap-1">
          <Eye className="w-3 h-3" /> View
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1 gap-1">
          <Pencil className="w-3 h-3" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
          <BarChart3 className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
          <QrCode className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Form Section ─── */
function FormSection({ forms, accentColor }: { forms: FormItem[]; accentColor: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "all">("all");

  const filtered = forms.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: forms.length,
    active: forms.filter(f => f.status === "active").length,
    draft: forms.filter(f => f.status === "draft").length,
    closed: forms.filter(f => f.status === "closed").length,
    archived: forms.filter(f => f.status === "archived").length,
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {(["all", "active", "draft", "closed", "archived"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all",
                statusFilter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
              <span className={cn(
                "px-1 rounded text-[10px]",
                statusFilter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-8 text-xs gap-1 whitespace-nowrap shrink-0"
            style={{ background: accentColor }}>
            <Plus className="w-3.5 h-3.5" /> New Form
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">No forms found</p>
          <p className="text-xs mt-1">Try changing filters or create a new form</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(form => <FormCard key={form.id} form={form} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Main Hub ─── */
export function EventsFormsHub() {
  const { hasPermission, isAdmin } = useAuth();
  const canRegister = hasPermission(REGISTER_EVENT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Event Forms</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage registration, service, and participation forms by category</p>
        </div>
      </div>

      <TabSwitcher
        tabs={[
          {
            id: "manage-registrations",
            label: "Manage Registrations",
            icon: Ticket,
            hidden: !isAdmin,
            content: <EventsRegistration />,
          },
          {
            id: "registration-forms",
            label: "Registration Forms",
            icon: FileText,
            hidden: !isAdmin,
            content: <EventsRegistrationForms />,
          },
          {
            id: "public-registration",
            label: "Public Registration",
            icon: UserCheck,
            hidden: !canRegister && !isAdmin,
            content: <EventsUserRegistration />,
          },
          {
            id: "food-cultural",
            label: "Food & Cultural",
            icon: UtensilsCrossed,
            content: (
              <FormSection
                forms={FOOD_CULTURAL_FORMS}
                accentColor="linear-gradient(135deg,#f97316,#ea580c)"
              />
            ),
          },
          {
            id: "pooja",
            label: "Pooja",
            icon: Flame,
            content: (
              <FormSection
                forms={POOJA_FORMS}
                accentColor="linear-gradient(135deg,#dc2626,#b91c1c)"
              />
            ),
          },
          {
            id: "donation",
            label: "Donation",
            icon: Heart,
            content: (
              <FormSection
                forms={DONATION_FORMS}
                accentColor="linear-gradient(135deg,#10b981,#059669)"
              />
            ),
          },
          {
            id: "auctions",
            label: "Auctions",
            icon: Gavel,
            content: (
              <FormSection
                forms={AUCTION_FORMS}
                accentColor="linear-gradient(135deg,#7c3aed,#6d28d9)"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
