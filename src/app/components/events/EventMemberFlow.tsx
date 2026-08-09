import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDown, ArrowRight, CalendarDays, CheckCircle2, Clock3, Gavel,
  HandHeart, Home, IndianRupee, Info, LayoutDashboard, Loader2, LogOut,
  ShieldCheck, User, UserPlus, Users, UtensilsCrossed,
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
  path: string;
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
    path: "/events/registration",
  },
  {
    key: "meals",
    title: "Lunch / Dinner",
    description: "Select meal preferences and complete registration.",
    icon: UtensilsCrossed,
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    path: "/events/operations",
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
}: {
  feature: FeatureCardConfig;
  status?: EventMemberFlowFeatureStatus;
}) {
  const navigate = useNavigate();
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
        onClick={() => navigate(feature.path)}
        className="mt-4 inline-flex items-center justify-between rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] px-3 py-2 text-xs font-bold text-[#173B72] transition group-hover:border-[#173B72]/30 group-hover:bg-[#EAF2FF]"
      >
        Open
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
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
    features: features.map((feature) => ({
      key: feature.key,
      label: feature.title,
      available: true,
      status: "Available",
    })),
  };
}

export function EventMemberFlow() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<EventMemberFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
                description="Add name, age and relationship for multiple family members."
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
                <FeatureCard key={feature.key} feature={feature} status={featureStatus.get(feature.key)} />
              ))}
            </section>

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
