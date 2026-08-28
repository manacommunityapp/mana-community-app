import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDown, ArrowRight, CalendarDays, CheckCircle2, Clock3, Gavel,
  HandHeart, Home, IndianRupee, Info, LayoutDashboard, Loader2, LogOut,
  ShieldCheck, Ticket, User, UserPlus, Users, UtensilsCrossed, X,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useAuth } from "../../../contexts/AuthContext";
import {
  eventMemberFlowService,
  type EventMemberFlowResponse,
  type EventMemberFlowFeatureStatus,
} from "../../../services/events/eventMemberFlowService";

type NodeTone = "navy" | "blue" | "teal" | "green" | "slate";

interface JourneyNodeProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone?: NodeTone;
  items?: string[];
  complete?: boolean;
}

interface FeatureCardConfig {
  key: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  path?: string;
  modal?: boolean;
}

const features: FeatureCardConfig[] = [
  {
    key: "details",
    title: "Event Details",
    description: "View complete event information, venue and highlights.",
    icon: Info,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    path: "/events",
  },
  {
    key: "timings",
    title: "Event Timings",
    description: "View the schedule, important timings and sessions.",
    icon: Clock3,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    path: "/events/schedule",
  },
  {
    key: "programmes",
    title: "Event Programmes",
    description: "Explore programmes, activities and performers.",
    icon: CalendarDays,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    path: "/events/schedule",
  },
  {
    key: "donation",
    title: "Event Donation",
    description: "Choose a contribution amount and make a donation.",
    icon: IndianRupee,
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
    path: "/events/fundraising",
  },
  {
    key: "pooja",
    title: "Pooja Registration",
    description: "Select the Pooja and submit your registration.",
    icon: HandHeart,
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fde68a",
    modal: true,
  },
  {
    key: "meals",
    title: "Lunch / Dinner",
    description: "Select meal preferences and complete registration.",
    icon: UtensilsCrossed,
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    modal: true,
  },
  {
    key: "passes",
    title: "Event Passes",
    description: "View and manage your event passes and entry tickets.",
    icon: Ticket,
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    modal: true,
  },
  {
    key: "family",
    title: "Family Members",
    description: "View and manage family members registered for the event.",
    icon: Users,
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    modal: true,
  },
  {
    key: "auctions",
    title: "Auctions",
    description: "View auction items, place bids and track activity.",
    icon: Gavel,
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
    path: "/events/fundraising",
  },
];

const toneClasses: Record<NodeTone, string> = {
  navy: "border-[#173B72]/20 bg-white shadow-[0_12px_32px_rgba(23,59,114,0.12)]",
  blue: "border-blue-100 bg-white shadow-[0_10px_28px_rgba(37,99,235,0.10)]",
  teal: "border-teal-100 bg-white shadow-[0_10px_28px_rgba(13,148,136,0.10)]",
  green: "border-emerald-200 bg-emerald-50 shadow-[0_10px_28px_rgba(16,185,129,0.12)]",
  slate: "border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
};

function VerticalArrow() {
  return (
    <div className="flex h-12 items-center justify-center" aria-hidden="true">
      <div className="flex h-full flex-col items-center text-[#8BA3C7]">
        <div className="h-8 w-px bg-[#B8C6DA]" />
        <ArrowDown className="h-4 w-4" />
      </div>
    </div>
  );
}

function JourneyNode({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "slate",
  items = [],
  complete = false,
}: JourneyNodeProps) {
  return (
    <section className={cn("w-full max-w-[430px] rounded-[18px] border p-5", toneClasses[tone])}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          complete ? "bg-emerald-500 text-white" : "bg-[#EAF2FF] text-[#173B72]"
        )}>
          {complete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#667085]">{eyebrow}</p>
          <h3 className="mt-1 text-base font-black leading-tight text-[#202124]">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
        </div>
      </div>
      {items.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] px-3 py-2 text-xs font-semibold text-[#173B72]">
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DashboardNode({ summary }: { summary: EventMemberFlowResponse | null }) {
  const flatLabel = [summary?.tower, summary?.block, summary?.flatNumber].filter(Boolean).join(" - ");
  return (
    <section className="w-full max-w-[520px] rounded-[18px] border border-[#173B72]/20 bg-[#173B72] p-5 text-white shadow-[0_18px_42px_rgba(23,59,114,0.22)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Step 5</p>
          <h3 className="mt-1 text-lg font-black leading-tight">User Dashboard</h3>
          <p className="mt-1 text-sm leading-5 text-white/72">Main home screen that provides access to all event features.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Metric label="Flat" value={flatLabel || "Not saved"} />
        <Metric label="Family" value={`${summary?.familyMemberCount ?? 0} members`} />
        <Metric label="Activities" value={`${summary?.activityRegistrationCount ?? 0} joined`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-0.5 truncate text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function BranchConnectors() {
  const cardCenters = [100, 300, 500, 700, 900, 1100, 1300];
  return (
    <div className="relative mx-auto hidden h-24 w-full max-w-[1400px] xl:block" aria-hidden="true">
      <svg viewBox="0 0 1400 96" className="h-full w-full overflow-visible">
        <defs>
          <marker id="event-flow-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#8BA3C7" />
          </marker>
        </defs>
        <path d="M700 0 V34" stroke="#8BA3C7" strokeWidth="2" fill="none" />
        <path d="M100 34 H1300" stroke="#B8C6DA" strokeWidth="2" fill="none" />
        {cardCenters.map((x) => (
          <path key={x} d={`M${x} 34 V82`} stroke="#8BA3C7" strokeWidth="2" fill="none" markerEnd="url(#event-flow-arrow)" />
        ))}
      </svg>
    </div>
  );
}

function FeatureCard({
  feature,
  status,
  onOpen,
}: {
  feature: FeatureCardConfig;
  status?: EventMemberFlowFeatureStatus;
  onOpen: () => void;
}) {
  const Icon = feature.icon;

  return (
    <article
      className="group flex min-h-[230px] flex-col rounded-[16px] border bg-white p-4 shadow-[0_10px_26px_rgba(23,59,114,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(23,59,114,0.14)]"
      style={{ borderColor: feature.border }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: feature.bg, color: feature.color }}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border px-2 py-1 text-[10px] font-bold" style={{ borderColor: feature.border, color: feature.color, background: feature.bg }}>
          {status?.status ?? "Available"}
        </span>
      </div>
      <h4 className="mt-4 text-sm font-black text-[#202124]">{feature.title}</h4>
      <p className="mt-2 flex-1 text-xs leading-5 text-[#667085]">{feature.description}</p>
      <button
        onClick={onOpen}
        className="mt-4 inline-flex items-center justify-between rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] px-3 py-2 text-xs font-bold text-[#173B72] transition group-hover:border-[#173B72]/30 group-hover:bg-[#EAF2FF]"
      >
        Open
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function FeatureDetailModal({
  feature,
  status,
  summary,
  onClose,
}: {
  feature: FeatureCardConfig;
  status?: EventMemberFlowFeatureStatus;
  summary: EventMemberFlowResponse | null;
  onClose: () => void;
}) {
  const Icon = feature.icon;

  const content = () => {
    switch (feature.key) {
      case "pooja":
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">Register for Pooja ceremonies during the event. Select your preferred Pooja type and submit your family's participation details.</p>
            <div className="rounded-xl border border-[#fde68a] bg-[#fefce8] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ca8a04]">Available Poojas</p>
              <ul className="mt-3 space-y-2">
                {["Ganesh Pooja", "Lakshmi Pooja", "Satyanarayana Pooja", "Havan Ceremony"].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-semibold text-[#202124]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#ca8a04]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#667085]">Your Registration</p>
              <p className="mt-2 text-sm text-[#667085]">No Pooja registration submitted yet. Contact the event committee to register.</p>
            </div>
          </div>
        );
      case "meals":
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">Select meal preferences for lunch and dinner sessions. Registrations are per family member.</p>
            <div className="grid grid-cols-2 gap-3">
              {["Lunch – Day 1", "Dinner – Day 1", "Lunch – Day 2", "Dinner – Day 2"].map((meal) => (
                <div key={meal} className="rounded-xl border border-[#99f6e4] bg-[#f0fdfa] p-3">
                  <UtensilsCrossed className="h-5 w-5 text-[#0f766e]" />
                  <p className="mt-2 text-xs font-bold text-[#0f766e]">{meal}</p>
                  <p className="mt-1 text-[10px] text-[#667085]">Vegetarian &amp; Non-Veg</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#667085]">Meal Selections</p>
              <p className="mt-2 text-sm text-[#667085]">{summary?.mealRegistrationCount ?? 0} meal(s) registered for your household.</p>
            </div>
          </div>
        );
      case "passes":
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">Your event passes grant access to specific venues and sessions during the event.</p>
            <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6d28d9]">Pass Types</p>
              <ul className="mt-3 space-y-2">
                {["General Entry Pass", "VIP Access Pass", "Programme Entry", "Dining Pass"].map((pass) => (
                  <li key={pass} className="flex items-center gap-2 text-sm font-semibold text-[#202124]">
                    <Ticket className="h-4 w-4 shrink-0 text-[#6d28d9]" />
                    {pass}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#667085]">Your Passes</p>
              <p className="mt-2 text-sm text-[#667085]">Passes will be issued after event registration is complete. Contact the admin for details.</p>
            </div>
          </div>
        );
      case "family":
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">Family members registered under your flat for this event.</p>
            <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0369a1]">Registered Members</p>
                <span className="rounded-full bg-[#0369a1] px-2 py-0.5 text-[10px] font-bold text-white">
                  {summary?.familyMemberCount ?? 0}
                </span>
              </div>
              {(summary?.familyMemberCount ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-[#667085]">No family members added yet. Go to the Family Members section to add them.</p>
              ) : (
                <p className="mt-3 text-sm text-[#667085]">{summary?.familyMemberCount} family member(s) are registered for this event.</p>
              )}
            </div>
            <div className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#667085]">Event Registrations</p>
              <p className="mt-2 text-sm text-[#667085]">{summary?.eventRegistrationCount ?? 0} event registration(s) across all family members.</p>
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-[#667085]">{feature.description}</p>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[20px] bg-white shadow-[0_24px_64px_rgba(23,59,114,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#DCE3EE] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: feature.bg, color: feature.color }}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#202124]">{feature.title}</h2>
              <span className="text-[10px] font-bold" style={{ color: feature.color }}>{status?.status ?? "Available"}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE3EE] text-[#667085] transition hover:bg-[#F8FAFD]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{content()}</div>
      </div>
    </div>
  );
}

function flowFallback(userName?: string, email?: string): EventMemberFlowResponse {
  return {
    residentName: userName ?? "Community Member",
    email: email ?? null,
    phone: null,
    flatNumber: null,
    block: null,
    tower: null,
    residentType: null,
    occupancyStatus: null,
    flatProfileComplete: false,
    familyMemberCount: 0,
    eventRegistrationCount: 0,
    activityRegistrationCount: 0,
    mealRegistrationCount: 0,
    features: features.map((f) => ({
      key: f.key,
      label: f.title,
      available: true,
      status: "Available",
    })),
  };
}

export function EventMemberFlow() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EventMemberFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    eventMemberFlowService
      .getSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(flowFallback(user?.fullName, user?.email));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.fullName]);

  const featureStatus = useMemo(() => {
    const map = new Map<string, EventMemberFlowFeatureStatus>();
    summary?.features?.forEach((feature) => map.set(feature.key, feature));
    return map;
  }, [summary]);

  const flatComplete = summary?.flatProfileComplete ?? false;
  const familyComplete = (summary?.familyMemberCount ?? 0) > 0;
  const registrationComplete = flatComplete || familyComplete || (summary?.eventRegistrationCount ?? 0) > 0;

  return (
    <main className="min-h-full rounded-[20px] bg-[#F6F8FC] px-4 py-8 text-[#202124] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173B72] text-white shadow-[0_14px_30px_rgba(23,59,114,0.24)]">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#173B72] sm:text-4xl">Event Management Application</h1>
          <p className="mt-2 text-sm font-semibold text-[#667085]">User Flow &middot; Residential Community</p>
        </header>

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 text-sm font-semibold text-[#667085]">
            <Loader2 className="h-5 w-5 animate-spin text-[#173B72]" />
            Loading member event flow...
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-col items-center">
              <JourneyNode
                eyebrow="Start"
                title="User"
                description="Begin the event journey."
                icon={User}
                tone="navy"
                items={[summary?.residentName || user?.fullName || "Member", summary?.email || user?.email || "Signed in"]}
              />
              <VerticalArrow />
              <JourneyNode
                eyebrow="Step 2"
                title="User Registration - Per Flat"
                description="Flat number, resident details and login credentials identify the household."
                icon={Home}
                tone="blue"
                complete={flatComplete}
                items={[
                  summary?.flatNumber ? `Flat ${summary.flatNumber}` : "Flat pending",
                  summary?.phone || "Phone pending",
                  summary?.email || "Login active",
                ]}
              />
              <VerticalArrow />
              <JourneyNode
                eyebrow="Step 3"
                title="Add Family Members"
                description="Add name, date of birth and relationship for multiple family members."
                icon={UserPlus}
                tone="teal"
                complete={familyComplete}
                items={[
                  `${summary?.familyMemberCount ?? 0} added`,
                  "Name",
                  "Age / Relationship",
                ]}
              />
              <VerticalArrow />
              <JourneyNode
                eyebrow="Step 4"
                title="Registration Complete"
                description="Your flat and family information has been saved."
                icon={CheckCircle2}
                tone="green"
                complete={registrationComplete}
                items={[
                  `${summary?.eventRegistrationCount ?? 0} event registrations`,
                  `${summary?.activityRegistrationCount ?? 0} programme registrations`,
                  `${summary?.mealRegistrationCount ?? 0} meal selections`,
                ]}
              />
              <VerticalArrow />
              <DashboardNode summary={summary} />
            </div>

            <BranchConnectors />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.key}
                  feature={feature}
                  status={featureStatus.get(feature.key)}
                  onOpen={() => {
                    if (feature.modal) {
                      setActiveModal(feature.key);
                    } else if (feature.path) {
                      navigate(feature.path);
                    }
                  }}
                />
              ))}
            </section>

            {activeModal && (() => {
              const feature = features.find((f) => f.key === activeModal);
              if (!feature) return null;
              return (
                <FeatureDetailModal
                  feature={feature}
                  status={featureStatus.get(feature.key)}
                  summary={summary}
                  onClose={() => setActiveModal(null)}
                />
              );
            })()}

            <div className="mt-10 flex justify-center">
              <Button
                onClick={logout}
                variant="outline"
                className="h-11 rounded-xl border-[#DCE3EE] bg-white px-5 text-sm font-bold text-[#173B72] shadow-[0_8px_20px_rgba(23,59,114,0.08)] hover:bg-[#EAF2FF]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#667085]">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Member view for residential community event participation
            </div>
          </>
        )}
      </div>
    </main>
  );
}
