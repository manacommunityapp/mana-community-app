import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useChat } from "../../../contexts/ChatContext";
import { interiorsService, type InteriorDesignerProfile, type InteriorReview } from "../../../services/interiors/interiorsService";
import { fileUploadService } from "../../../services/files/fileUploadService";

type Designer = {
  id: number;
  userId: number;
  name: string;
  studio: string;
  areas: string[];
  specialty: string;
  rating: number | null;
  projects: number;
  startingAt: string | null;
  initials: string;
  color: string;
  bio: string;
  profileImageUrl: string | null;
  verificationStatus: string;
  portfolio: { title: string; imageUrl: string; description?: string }[];
  offerings?: { id: number; title: string; description?: string; basePrice: number; pricingUnit: string }[];
};

const COLORS = ["from-rose-200 to-orange-100", "from-sky-200 to-indigo-100", "from-amber-200 to-yellow-100", "from-emerald-200 to-teal-100", "from-violet-200 to-fuchsia-100", "from-orange-200 to-red-100"];

function parseJsonList(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record.areas)) return record.areas;
      if (Array.isArray(record.items)) return record.items;
    }
  } catch {
    return value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function mapDesigner(profile: InteriorDesignerProfile, index: number): Designer {
  const areas = parseJsonList(profile.serviceAreas).filter((item): item is string => typeof item === "string");
  const portfolio = parseJsonList(profile.portfolio).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (typeof record.imageUrl !== "string" || !record.imageUrl.trim()) return [];
    try { if (new URL(record.imageUrl).protocol !== "https:") return []; } catch { return []; }
    return [{
      title: typeof record.title === "string" ? record.title : "Interior project",
      imageUrl: record.imageUrl,
      description: typeof record.description === "string" ? record.description : undefined,
    }];
  });
  const name = profile.businessName || profile.userName || "Interior designer";
  const specialty = profile.offerings[0]?.title || profile.offerings[0]?.categoryName || "Interior design";
  return {
    id: profile.id,
    userId: profile.userId,
    name,
    studio: profile.businessName || profile.userName || "Independent designer",
    areas,
    specialty,
    rating: profile.avgRating,
    projects: profile.totalJobsCompleted ?? 0,
    startingAt: profile.offerings[0] ? `₹${profile.offerings[0].basePrice.toLocaleString("en-IN")} / ${profile.offerings[0].pricingUnit.toLowerCase()}` : null,
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    color: COLORS[index % COLORS.length],
    bio: profile.bio || "",
    profileImageUrl: profile.profileImageUrl,
    verificationStatus: profile.verificationStatus,
    portfolio,
  };
}

export function InteriorsMarketplace() {
  const navigate = useNavigate();
  const { openFloatingChatWithUser } = useChat();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [specialty, setSpecialty] = useState("All services");
  const [saved, setSaved] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [inspirationSaved, setInspirationSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const value = window.localStorage.getItem("mana-interiors-saved-inspiration");
      const parsed: unknown = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch { return []; }
  });
  const [showSavedInspiration, setShowSavedInspiration] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [briefSubmitted, setBriefSubmitted] = useState(false);
  const [submittingBrief, setSubmittingBrief] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [profileDesigner, setProfileDesigner] = useState<Designer | null>(null);
  const [profileReviews, setProfileReviews] = useState<InteriorReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const reviewRequestId = useRef(0);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    interiorsService.listDesigners()
      .then((profiles) => { if (active) setDesigners(profiles.map(mapDesigner)); })
      .catch(() => { if (active) { setLoadFailed(true); toast.error("Could not load interior designers"); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    interiorsService.listSavedDesigners()
      .then((profiles) => { if (active) setSaved(profiles.map((profile) => String(profile.id))); })
      .catch(() => { /* Saved designers are optional if the service is temporarily unavailable. */ });
    return () => { active = false; };
  }, []);

  const openDesignerProfile = (designer: Designer) => {
    setProfileDesigner(designer);
    setReviewsLoading(true);
    const requestId = ++reviewRequestId.current;
    interiorsService.getDesignerReviews(designer.id)
      .then((reviews) => { if (requestId === reviewRequestId.current) setProfileReviews(reviews); })
      .catch(() => { if (requestId === reviewRequestId.current) setProfileReviews([]); })
      .finally(() => { if (requestId === reviewRequestId.current) setReviewsLoading(false); });
  };

  const closeDesignerProfile = () => {
    reviewRequestId.current += 1;
    setProfileDesigner(null);
    setProfileReviews([]);
    setReviewsLoading(false);
  };

  const areas = useMemo(() => ["All areas", ...new Set(designers.flatMap((designer) => designer.areas).filter(Boolean).sort())], [designers]);
  const specialties = useMemo(() => ["All services", ...new Set(designers.map((designer) => designer.specialty).filter(Boolean).sort())], [designers]);

  const visibleDesigners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return designers.filter((designer) => {
      const matchesQuery = !normalizedQuery || `${designer.name} ${designer.studio} ${designer.areas.join(" ")} ${designer.specialty} ${designer.bio}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery
        && (!showSavedOnly || saved.includes(String(designer.id)))
        && (area === "All areas" || designer.areas.some((item) => item.toLowerCase() === area.toLowerCase()))
        && (specialty === "All services" || designer.specialty === specialty);
    });
  }, [area, designers, query, saved, showSavedOnly, specialty]);

  const toggleSaved = async (designerId: string) => {
    const removing = saved.includes(designerId);
    try {
      if (removing) await interiorsService.removeSavedDesigner(Number(designerId));
      else await interiorsService.saveDesigner(Number(designerId));
      setSaved((current) => removing ? current.filter((item) => item !== designerId) : [...current, designerId]);
      toast.success(removing ? "Designer removed from saved list" : "Designer saved to your list");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update saved designers");
    }
  };

  const saveInspiration = (key: string) => {
    setInspirationSaved((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      try { window.localStorage.setItem("mana-interiors-saved-inspiration", JSON.stringify(next)); }
      catch { toast.error("Could not save this idea on this device"); }
      return next;
    });
  };

  const openProjectBrief = (designer: Designer | null = null) => {
    setSelectedDesigner(designer);
    setBriefSubmitted(false);
    setCreatedProjectId(null);
    setShowBrief(true);
  };

  const submitBrief = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const budget = String(form.get("budget") || "");
    const budgetRanges: Record<string, [number, number]> = {
      under5: [0, 500000],
      fiveToTen: [500000, 1000000],
      tenToTwenty: [1000000, 2000000],
      twentyPlus: [2000000, 100000000],
    };
    const [budgetMin, budgetMax] = budgetRanges[budget] || [0, 0];
    setSubmittingBrief(true);
    try {
      const project = await interiorsService.createProject({
        propertyType: String(form.get("propertyType") || ""),
        homeSize: String(form.get("homeSize") || ""),
        locality: String(form.get("locality") || "").trim(),
        stylePreference: String(form.get("stylePreference") || "").trim() || undefined,
        focusAreas: form.getAll("focusAreas").map(String),
        budgetMin,
        budgetMax,
        projectScope: String(form.get("projectScope") || "").trim(),
        preferredStart: String(form.get("preferredStart") || "") || undefined,
        designerIds: selectedDesigner ? [selectedDesigner.id] : undefined,
      });
      const files = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 10);
      let attachmentsFailed = false;
      if (files.length) {
        try {
          const uploads = await Promise.all(files.map((file) => fileUploadService.upload(file, "INTERIORS", String(project.id), undefined, "brief")));
          const mediaIds = uploads.flatMap((upload) => typeof upload.id === "string" ? [upload.id] : []);
          await interiorsService.updateProjectAttachments(project.id, mediaIds);
        } catch {
          attachmentsFailed = true;
        }
      }
      setCreatedProjectId(project.id);
      setBriefSubmitted(true);
      if (attachmentsFailed) toast.error("Your brief was sent, but some files could not be attached. Contact your designer to share them.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your project brief");
    } finally {
      setSubmittingBrief(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] pb-14 text-[#20231f]">
      <section className="relative overflow-hidden bg-[#17261f] text-white">
        <div className="pointer-events-none absolute -right-28 -top-40 h-[32rem] w-[32rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-[25rem] w-[25rem] rounded-full border border-white/10" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-[#d8e3d8]">
              <Sparkles className="h-3.5 w-3.5 text-[#d8b77c]" /> Mana Interiors · Hyderabad
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-6xl">
              A home that feels like <span className="font-serif italic text-[#dfc69d]">you.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              Meet trusted local designers, explore their work, and find the right fit for your home and budget.
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-[#6c716b]">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  aria-label="Search designers or styles"
                  className="w-full bg-transparent text-sm text-[#252b26] outline-none placeholder:text-[#929890]"
                  placeholder="Designer, style or service"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="hidden h-8 w-px bg-[#e7e9e4] sm:block" />
              <label className="flex items-center gap-2 px-3 py-2 text-[#667068] sm:w-44">
                <MapPin className="h-4 w-4 shrink-0 text-[#728678]" />
                <select aria-label="Choose area" className="w-full appearance-none bg-transparent text-sm text-[#303831] outline-none" value={area} onChange={(event) => setArea(event.target.value)}>
                  {areas.map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </label>
              <button onClick={() => document.getElementById("designer-list")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#bb8954] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#a97541]">
                Find a designer <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
              <span><strong className="text-white">Hyderabad-first</strong> discovery</span>
              <span><strong className="text-white">Area-based</strong> search</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[#d8b77c]" /> Community recommendations</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mr-2">
            <div className="absolute -inset-4 rotate-[-3deg] rounded-[2rem] bg-[#b58b61]/20" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#d4c1a8] p-3 shadow-2xl shadow-black/20">
              <div className="relative flex aspect-[1.14] flex-col justify-between overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-[#e9dfd0] via-[#c3ad91] to-[#788677] p-5 sm:p-7">
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(90deg, transparent 0 64%, rgba(255,255,255,.55) 64% 65%, transparent 65%), linear-gradient(0deg, rgba(55,63,50,.3), transparent 54%), repeating-linear-gradient(0deg, transparent 0 56px, rgba(255,255,255,.18) 57px 58px)" }} />
                <div className="relative flex items-start justify-between">
                  <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c554a]">Designed around your life</span>
                  <span className="rounded-full bg-white/75 p-2 text-[#6f745f]"><Heart className="h-4 w-4" /></span>
                </div>
                <div className="relative max-w-[15rem] rounded-xl border border-white/30 bg-[#f8f5ef]/85 p-4 shadow-lg backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#78786e]">The right team for your home</p>
                  <p className="mt-1 font-serif text-xl text-[#363a32]">From first sketch to final detail.</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-[#646b5f]"><span className="h-1.5 w-1.5 rounded-full bg-[#9a704b]" /> Explore local professionals</div>
                </div>
              </div>
              <p className="px-2 pb-1 pt-3 text-center text-[10px] font-semibold tracking-wide text-[#4d554c]">Find inspiration, then meet the people who can make it yours.</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="grid gap-4 py-8 sm:grid-cols-3 sm:py-10">
          {[
            { number: "01", title: "Explore local talent", copy: "Browse designers by area, style, and project type." },
            { number: "02", title: "Compare with confidence", copy: "Review portfolios, experience, and transparent starting rates." },
            { number: "03", title: "Plan your project", copy: "Share your home details and get matched with a shortlist." },
          ].map((step) => (
            <article key={step.number} className="flex gap-4 rounded-2xl border border-[#e7e7e0] bg-white p-5">
              <span className="font-serif text-2xl text-[#b18860]">{step.number}</span>
              <div><h2 className="text-sm font-bold">{step.title}</h2><p className="mt-1.5 text-xs leading-5 text-[#727970]">{step.copy}</p></div>
            </article>
          ))}
        </section>

        <section id="inspiration" className="scroll-mt-6 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e2e4dd] pb-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9b7651]">Real work from local professionals</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Ideas for your home</h2><p className="mt-1.5 text-sm text-[#777d74]">Explore designer portfolios, save ideas on this device, then connect with the people behind them.</p></div>
            <button aria-pressed={showSavedInspiration} onClick={() => setShowSavedInspiration((value) => !value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${showSavedInspiration ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#dfe2da] bg-white text-[#525a52]"}`}><Heart className={`h-3.5 w-3.5 ${showSavedInspiration ? "fill-current" : ""}`} />Saved ideas ({inspirationSaved.length})</button>
          </div>
          {(() => {
            const ideas = designers.flatMap((designer) => designer.portfolio.map((item, index) => ({
              key: `${designer.id}:${index}:${item.imageUrl}`,
              designer,
              item,
            }))).filter(({ key }) => !showSavedInspiration || inspirationSaved.includes(key));
            return ideas.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ideas.map(({ key, designer, item }) => {
              const isSaved = inspirationSaved.includes(key);
              return <article key={key} className="group overflow-hidden rounded-2xl border border-[#e5e6df] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <button type="button" onClick={() => openDesignerProfile(designer)} className="relative block aspect-[1.25] w-full overflow-hidden bg-[#e9ece4] text-left"><img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-4 pt-12 text-sm font-semibold text-white">{item.title}</span></button>
                <div className="flex items-center justify-between gap-3 p-4"><button onClick={() => openDesignerProfile(designer)} className="min-w-0 text-left"><p className="truncate text-sm font-bold">{designer.studio}</p><p className="mt-0.5 truncate text-xs text-[#788077]">{item.description || designer.specialty}</p></button><button aria-label={`${isSaved ? "Unsave" : "Save"} ${item.title}`} aria-pressed={isSaved} onClick={() => saveInspiration(key)} className="shrink-0 rounded-full border border-[#e5e6df] p-2.5 text-[#697269] hover:text-rose-600"><Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} /></button></div>
              </article>;
            })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#d5d9d0] bg-white/70 px-6 py-10 text-center"><Sparkles className="mx-auto h-6 w-6 text-[#9b7651]" /><p className="mt-3 text-sm font-bold">{showSavedInspiration ? "No saved ideas yet" : loading ? "Loading portfolio ideas…" : "Local designers are adding portfolio ideas"}</p><p className="mt-1 text-xs text-[#777f75]">{showSavedInspiration ? "Tap the heart on a portfolio image to keep it here." : "Browse designers and check back as their portfolios grow."}</p>{showSavedInspiration && <button onClick={() => setShowSavedInspiration(false)} className="mt-3 text-xs font-bold text-[#58705c] underline underline-offset-4">Browse all ideas</button>}</div>;
          })()}
        </section>

        <section id="designer-list" className="scroll-mt-6 pb-5">
          <div className="flex flex-col gap-4 border-b border-[#e2e4dd] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9b7651]">The Mana community</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Designers near you</h2>
              <p className="mt-1.5 text-sm text-[#777d74]">Discover a team for every room, renovation, and budget.</p>
            </div>
            <button onClick={() => openProjectBrief()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#26382c] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#354a3a]">
              Get a project shortlist <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#727970]"><strong className="text-[#2f362f]">{visibleDesigners.length}</strong> verified designers</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Filter by service</span>
                <select className="appearance-none rounded-lg border border-[#dfe2da] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#525a52] outline-none focus:border-[#839581]" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
                  {specialties.map((item) => <option key={item}>{item}</option>)}
                </select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#7d857b]" />
              </label>
              <button onClick={() => navigate("/services/interiors/projects")} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe2da] bg-white px-3 py-2 text-xs font-semibold text-[#525a52] transition hover:bg-[#f2f4ef]">
                <SlidersHorizontal className="h-3.5 w-3.5" /> My projects
              </button>
              <button aria-pressed={showSavedOnly} onClick={() => setShowSavedOnly((value) => !value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${showSavedOnly ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#dfe2da] bg-white text-[#525a52] hover:bg-[#f2f4ef]"}`}><Heart className={`h-3.5 w-3.5 ${showSavedOnly ? "fill-current" : ""}`} />Saved ({saved.length})</button>
              <button onClick={() => navigate("/services/interiors/vendors")} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe2da] bg-white px-3 py-2 text-xs font-semibold text-[#525a52] transition hover:bg-[#f2f4ef]">Home vendors</button>
            </div>
          </div>

          {loading ? <div className="rounded-2xl border border-[#e5e6df] bg-white px-6 py-14 text-center text-sm text-[#737a71]">Loading verified designers…</div>
          : loadFailed ? <div className="rounded-2xl border border-dashed border-[#d5d9d0] bg-white/70 px-6 py-12 text-center"><h3 className="text-sm font-bold">Designer listings are unavailable</h3><p className="mt-1 text-xs text-[#777f75]">Try again in a moment.</p><button onClick={() => { setLoading(true); setLoadFailed(false); interiorsService.listDesigners().then((profiles) => setDesigners(profiles.map(mapDesigner))).catch(() => setLoadFailed(true)).finally(() => setLoading(false)); }} className="mt-4 text-xs font-bold text-[#58705c] underline underline-offset-4">Retry</button></div>
          : visibleDesigners.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDesigners.map((designer) => {
              const isSaved = saved.includes(String(designer.id));
              const coverImage = designer.portfolio[0]?.imageUrl || designer.profileImageUrl;
              return <article key={designer.id} className="group overflow-hidden rounded-2xl border border-[#e5e6df] bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#28392b]/[.07]">
                <div className={`relative flex h-44 items-end overflow-hidden bg-gradient-to-br ${designer.color} bg-cover bg-center p-4`} style={coverImage ? { backgroundImage: `linear-gradient(0deg, rgba(47,57,45,.35), transparent 62%), url("${coverImage}")` } : undefined}>
                  {!coverImage && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(90deg, transparent 0 68%, rgba(255,255,255,.8) 68% 69%, transparent 69%), linear-gradient(0deg, rgba(47,57,45,.28), transparent 52%), repeating-linear-gradient(0deg, transparent 0 48px, rgba(255,255,255,.22) 49px 50px)" }} />}
                  <div className="relative flex w-full items-end justify-between">
                    <div className="rounded-xl border border-white/40 bg-white/75 px-3 py-2 backdrop-blur-sm"><p className="font-serif text-base text-[#384137]">{designer.specialty}</p><p className="mt-0.5 text-[10px] text-[#73796e]">{designer.portfolio.length} portfolio projects</p></div>
                    <button aria-label={`${isSaved ? "Remove" : "Save"} ${designer.studio}`} onClick={() => void toggleSaved(String(designer.id))} className="rounded-full bg-white/80 p-2.5 text-[#667064] transition hover:text-rose-600">
                      <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#5c705f]"><BadgeCheck className="h-3 w-3" /> Mana verified</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff1ec] text-xs font-extrabold text-[#4b5b4c]">{designer.initials}</span>
                      <div className="min-w-0"><h3 className="truncate text-sm font-bold">{designer.name}</h3><p className="truncate text-xs text-[#788077]">{designer.studio}</p></div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold">{designer.rating === null ? <span className="text-[#8a9087]">New</span> : <><Star className="h-3.5 w-3.5 fill-[#d5a65c] text-[#d5a65c]" />{designer.rating.toFixed(1)}</>}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#eff0ec] pt-3 text-[11px] text-[#737a71]">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{designer.areas.length ? designer.areas.slice(0, 2).join(", ") : "Hyderabad"}</span>
                    <span className="inline-flex items-center gap-1"><BedDouble className="h-3 w-3" />{designer.projects} completed projects</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{designer.verificationStatus === "VERIFIED" && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-800">Identity / profile verified</span>}{designer.projects >= 5 && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-800">5+ completed jobs</span>}{designer.rating !== null && designer.rating >= 4.5 && <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-sky-800">Top rated by residents</span>}</div>
                  <div className="mt-3 flex items-end justify-between">
                    <div><p className="text-[10px] text-[#8a9087]">Starting from</p><p className="mt-0.5 text-sm font-bold text-[#364238]">{designer.startingAt || "Request pricing"}</p></div>
                    <div className="flex items-center gap-3"><button onClick={() => openDesignerProfile(designer)} className="text-xs font-bold text-[#58705c] hover:text-[#273b2c]">View profile</button><button onClick={() => openProjectBrief(designer)} className="inline-flex items-center gap-1 text-xs font-bold text-[#58705c] hover:text-[#273b2c]">Request a quote <ArrowRight className="h-3.5 w-3.5" /></button></div>
                  </div>
                </div>
              </article>;
            })}
          </div> : <div className="rounded-2xl border border-dashed border-[#d5d9d0] bg-white/70 px-6 py-12 text-center">
            <Search className="mx-auto h-6 w-6 text-[#90988d]" />
            <h3 className="mt-3 text-sm font-bold">No designers match those filters</h3>
            <p className="mt-1 text-xs text-[#777f75]">Try another area or clear your search.</p>
            <button onClick={() => { setQuery(""); setArea("All areas"); setSpecialty("All services"); }} className="mt-4 text-xs font-bold text-[#58705c] underline underline-offset-4">Clear filters</button>
          </div>}
        </section>

        <section className="mt-8 flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#e9ece4] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8f704f]">Your project, your way</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Not sure where to start?</h2><p className="mt-2 text-sm leading-6 text-[#71796f]">Tell us about your home and we’ll help you put together a shortlist of local designers to explore.</p></div>
          <button onClick={() => openProjectBrief()} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#26382c] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#354a3a]">Start a project brief <ArrowRight className="h-4 w-4" /></button>
        </section>
      </main>

      {showBrief && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#152119]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowBrief(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="project-brief-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#fbfbf8] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">A few details</p><h2 id="project-brief-title" className="mt-1 text-2xl font-semibold tracking-[-.03em]">Tell us about your home</h2>{selectedDesigner && <p className="mt-1 text-xs text-[#788077]">Enquiry for {selectedDesigner.studio}</p>}</div>
            <button aria-label="Close project brief" onClick={() => setShowBrief(false)} className="rounded-full p-2 text-[#697269] hover:bg-[#eff1ec]"><X className="h-5 w-5" /></button>
          </div>
          {briefSubmitted ? <div className="py-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e5eee4] text-[#4d7050]"><BadgeCheck className="h-6 w-6" /></span><h3 className="mt-4 text-lg font-bold">Project brief sent</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#737a71]">Your brief has been saved. Designers can respond with quotes for you to compare.</p><button onClick={() => createdProjectId && navigate(`/services/interiors/projects/${createdProjectId}`)} className="mt-6 rounded-xl bg-[#26382c] px-5 py-3 text-sm font-bold text-white">Track project and quotes</button></div> : <form className="mt-6 space-y-4" onSubmit={submitBrief}>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#525b52]">Home type<select name="propertyType" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none focus:border-[#879986]"><option value="" disabled>Select home type</option><option>Apartment</option><option>Villa</option><option>Independent home</option></select></label><label className="text-xs font-bold text-[#525b52]">Home size<select name="homeSize" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none focus:border-[#879986]"><option value="" disabled>Select BHK</option><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4+ BHK</option></select></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#525b52]">Area in Hyderabad<input name="locality" required placeholder="e.g. Miyapur" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none placeholder:text-[#a2a79f] focus:border-[#879986]" /></label><label className="text-xs font-bold text-[#525b52]">Approx. budget<select name="budget" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none focus:border-[#879986]"><option value="" disabled>Select a range</option><option value="under5">Under ₹5 lakh</option><option value="fiveToTen">₹5–10 lakh</option><option value="tenToTwenty">₹10–20 lakh</option><option value="twentyPlus">₹20 lakh+</option></select></label></div>
            <label className="block text-xs font-bold text-[#525b52]">Preferred style<select name="stylePreference" defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none focus:border-[#879986]"><option value="">Open to ideas</option><option>Modern</option><option>Contemporary</option><option>Minimal</option><option>Traditional</option><option>Scandinavian</option><option>Industrial</option><option>Eclectic</option></select></label>
            <fieldset><legend className="text-xs font-bold text-[#525b52]">Rooms to include</legend><div className="mt-2 flex flex-wrap gap-2">{["Living room", "Kitchen", "Bedroom", "Bathroom", "Dining", "Full home"].map((room) => <label key={room} className="inline-flex items-center gap-2 rounded-full border border-[#dfe2da] bg-white px-3 py-2 text-xs text-[#525b52]"><input type="checkbox" name="focusAreas" value={room} className="accent-[#49664e]" />{room}</label>)}</div></fieldset>
            <label className="block text-xs font-bold text-[#525b52]">Preferred start date<input name="preferredStart" type="date" className="mt-1.5 w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none focus:border-[#879986]" /></label>
            <label className="block text-xs font-bold text-[#525b52]">What would you like help with?<textarea name="projectScope" required rows={3} placeholder="A full home makeover, kitchen renovation…" className="mt-1.5 w-full resize-none rounded-xl border border-[#dfe2da] bg-white px-3 py-3 text-sm font-normal text-[#343b35] outline-none placeholder:text-[#a2a79f] focus:border-[#879986]" /></label>
            <label className="block text-xs font-bold text-[#525b52]">Plans and reference files <span className="font-normal text-[#858b82]">(up to 10)</span><input name="attachments" type="file" multiple accept="image/*,.pdf,.doc,.docx" className="mt-1.5 block w-full rounded-xl border border-[#dfe2da] bg-white px-3 py-2.5 text-xs font-normal text-[#596158] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eff1ec] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#435b47]" /><span className="mt-1 block text-[10px] font-normal text-[#858b82]">Add a floor plan, room photos or style references.</span></label>
            <p className="text-[11px] leading-5 text-[#858b82]">Your request is shared with the designer you selected, or matched professionals in your area.</p>
            <button disabled={submittingBrief} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#26382c] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#354a3a] disabled:opacity-60">{submittingBrief ? "Sending…" : "Send project brief"} <ArrowRight className="h-4 w-4" /></button>
          </form>}
        </section>
      </div>}

      {profileDesigner && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#152119]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDesignerProfile(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="designer-profile-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#fbfbf8] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">Verified designer</p><h2 id="designer-profile-title" className="mt-1 text-2xl font-semibold">{profileDesigner.studio}</h2><p className="mt-1 text-sm text-[#788077]">{profileDesigner.name} · {profileDesigner.areas.join(", ") || "Hyderabad"}</p></div><button aria-label="Close profile" onClick={closeDesignerProfile} className="rounded-full p-2 text-[#697269] hover:bg-[#eff1ec]"><X className="h-5 w-5" /></button></div>
          {profileDesigner.bio && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#596158]">{profileDesigner.bio}</p>}
          <div className="mt-5 rounded-xl bg-[#f0f1eb] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Resident reviews</h3><span className="inline-flex items-center gap-1 text-xs font-bold text-[#8d6e45]"><Star className="h-3.5 w-3.5 fill-current" />{profileDesigner.rating?.toFixed(1) ?? "New"} · {profileReviews.length}</span></div>{reviewsLoading ? <p className="mt-3 text-xs text-[#788077]">Loading reviews…</p> : profileReviews.length ? <div className="mt-3 space-y-3">{profileReviews.slice(0, 4).map((review) => <div key={review.id} className="border-t border-[#dfe2da] pt-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{review.reviewerName}</p><span className="text-xs text-[#8d6e45]">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>{review.comment && <p className="mt-1 text-xs leading-5 text-[#667068]">{review.comment}</p>}</div>)}</div> : <p className="mt-3 text-xs text-[#788077]">No completed-project reviews yet.</p>}</div>
          <h3 className="mt-6 text-sm font-bold">Services and starting rates</h3><div className="mt-2 space-y-2">{(profileDesigner.offerings ?? []).map((offering: any) => <div key={offering.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e6df] bg-white p-3"><div><p className="text-sm font-semibold">{offering.title}</p><p className="mt-0.5 text-xs text-[#788077]">{offering.description}</p></div><p className="shrink-0 text-sm font-bold">₹{offering.basePrice.toLocaleString("en-IN")} / {offering.pricingUnit.toLowerCase()}</p></div>)}</div>
          <h3 className="mt-6 text-sm font-bold">Portfolio</h3>{profileDesigner.portfolio.length ? <div className="mt-2 grid gap-3 sm:grid-cols-2">{profileDesigner.portfolio.map((item, index) => <article key={`${item.imageUrl}-${index}`} className="overflow-hidden rounded-xl border border-[#e5e6df] bg-white"><img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" loading="lazy" /><div className="p-3"><p className="text-sm font-semibold">{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-[#788077]">{item.description}</p>}</div></article>)}</div> : <p className="mt-2 rounded-xl bg-[#f0f1eb] p-4 text-xs text-[#788077]">This designer has not added portfolio images yet.</p>}
          <button onClick={() => { const designer = profileDesigner; closeDesignerProfile(); openProjectBrief(designer); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#26382c] px-5 py-3.5 text-sm font-bold text-white">Request a quote <ArrowRight className="h-4 w-4" /></button>
          <button onClick={() => void openFloatingChatWithUser(String(profileDesigner.userId)).catch(() => toast.error("Could not open chat"))} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe2da] bg-white px-5 py-3.5 text-sm font-bold text-[#344137]">Message designer</button>
        </section>
      </div>}
    </div>
  );
}
