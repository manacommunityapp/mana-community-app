import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Calendar, Clock, MapPin, Store, Users, Loader2, RefreshCw, CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import { cashfreePaymentService } from "../../../services/payments/cashfreePaymentService";
import { marketBazaarApi, type MarketApplication, type MarketEvent, type MarketStall } from "../../../services/market/marketBazaarApi";
import { getStoredUser } from "../../../services/common/apiClient";
import { MarketOrganizerPanel } from "./MarketOrganizerPanel";

const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

async function ensureCashfreeSdk() {
  if ((window as any).Cashfree) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Cashfree checkout."));
    document.body.appendChild(script);
  });
}

export function MarketEventsView() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [organizerMode, setOrganizerMode] = useState(false);
  const storedUser = getStoredUser();
  const roleNames = [storedUser?.role, ...(storedUser?.roles ?? [])].filter(Boolean).map((role) => role!.toUpperCase());
  const canManage = roleNames.some((role) => ["ADMIN", "COMMUNITY_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"].includes(role)) || (storedUser?.permissions ?? []).some((permission) => ["Create Event", "Manage Event Dashboard"].includes(permission));
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [stalls, setStalls] = useState<MarketStall[]>([]);
  const [applications, setApplications] = useState<MarketApplication[]>([]);
  const [selectedStall, setSelectedStall] = useState<MarketStall | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [form, setForm] = useState({ vendorName: "", businessName: "", category: "", phone: "", products: "" });

  const loadEvents = useCallback(async (eventId?: number) => {
    setLoading(true);
    try {
      const [nextEvents, myApplications] = await Promise.all([
        marketBazaarApi.listEvents(),
        marketBazaarApi.myApplications(),
      ]);
      setEvents(nextEvents);
      setApplications(myApplications);
      const nextSelection = nextEvents.find((event) => event.id === eventId) ?? nextEvents[0] ?? null;
      setSelectedEvent(nextSelection);
      if (nextSelection) {
        const nextStalls = await marketBazaarApi.listStalls(nextSelection.id);
        setStalls(nextStalls);
        setSelectedStall((current) => nextStalls.find((stall) => stall.id === current?.id) ?? null);
      } else {
        setStalls([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Market Bazaar events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEvent || !selectedStall) return;
    setBusy(true);
    try {
      await marketBazaarApi.apply(selectedEvent.id, { ...form, stallId: selectedStall.id, complianceDocuments: [] });
      toast.success("Your stall application was submitted.");
      setApplicationOpen(false);
      setForm({ vendorName: "", businessName: "", category: "", phone: "", products: "" });
      await loadEvents(selectedEvent.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your application.");
    } finally {
      setBusy(false);
    }
  };

  const payForApplication = async (application: MarketApplication) => {
    if (!application.bookingId) {
      toast.error("This application does not have a payment hold.");
      return;
    }
    setBusy(true);
    try {
      const order = await marketBazaarApi.checkout(application.bookingId);
      if (!order.paymentSessionId) throw new Error("Cashfree checkout is not configured for this order.");
      await ensureCashfreeSdk();
      const isProd = Boolean(order.appId && !order.appId.startsWith("TEST"));
      const cashfree = (window as any).Cashfree({ mode: isProd ? "production" : "sandbox" });
      const checkoutResult = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
      if (checkoutResult?.error) throw new Error(checkoutResult.error.message ?? "Payment was not completed.");
      const verified = await cashfreePaymentService.verifyPayment(order.manaOrderId);
      if (verified.status === "PAID") {
        toast.success("Payment confirmed. Your stall is booked.");
        await loadEvents(selectedEvent?.id);
      } else {
        throw new Error(verified.failureReason ?? "Payment has not been confirmed yet.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  if (loading && !events.length) {
    return <div className="flex min-h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading community markets…</div>;
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Store className="h-4 w-4" /> Mana Community Bazaar
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Community markets</h2>
          <p className="mt-1 text-sm text-slate-500">Browse live events, apply for an available stall, and track your application.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && <button onClick={() => setOrganizerMode(!organizerMode)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{organizerMode ? "Browse markets" : "Organizer tools"}</button>}
          <button onClick={() => void loadEvents(selectedEvent?.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      {canManage && organizerMode ? <MarketOrganizerPanel onChanged={() => void loadEvents(selectedEvent?.id)} /> : !events.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Store className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">No published markets yet</h3>
          <p className="mt-1 text-sm text-slate-500">Published events for your community will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            {events.map((event) => (
              <button key={event.id} onClick={() => void loadEvents(event.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedEvent?.id === event.id ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">{event.status}</span>
                <span className="mt-1 block font-bold text-slate-900 dark:text-white">{event.title}</span>
                <span className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />{dateLabel(event.startsAt)}</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{event.venue}{event.city ? `, ${event.city}` : ""}</span>
              </button>
            ))}
          </aside>
          {selectedEvent && (
            <main className="space-y-5">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-rose-950 p-6 text-white shadow-lg sm:p-8">
                {selectedEvent.bannerUrl && <img src={selectedEvent.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
                <div className="relative space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedEvent.category && <span className="rounded-full bg-white/10 px-3 py-1">{selectedEvent.category}</span>}
                    <span className="rounded-full bg-white/10 px-3 py-1">{selectedEvent.communityName}</span>
                  </div>
                  <h3 className="text-2xl font-black sm:text-3xl">{selectedEvent.title}</h3>
                  {selectedEvent.description && <p className="max-w-2xl text-sm leading-relaxed text-slate-200">{selectedEvent.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-200">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-300" />{dateLabel(selectedEvent.startsAt)}</span>
                    {selectedEvent.endsAt && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-300" />Until {dateLabel(selectedEvent.endsAt)}</span>}
                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" />{selectedEvent.venue}</span>
                    <span className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-300" />{selectedEvent.vendorCount} vendors</span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><h4 className="font-black text-slate-900 dark:text-white">Available stalls</h4><p className="text-xs text-slate-500">{selectedEvent.availableStallCount} currently available</p></div>
                </div>
                {!stalls.length ? <p className="py-8 text-center text-sm text-slate-500">Stall packages have not been published yet.</p> : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {stalls.map((stall) => {
                      const available = stall.status === "AVAILABLE";
                      const selected = selectedStall?.id === stall.id;
                      return <button key={stall.id} disabled={!available} onClick={() => setSelectedStall(stall)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-700"} ${!available ? "cursor-not-allowed opacity-55" : "hover:border-emerald-400"}`}>
                        <div className="flex items-start justify-between gap-3"><span className="font-mono text-lg font-black">{stall.stallNumber}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{stall.status}</span></div>
                        <p className="mt-2 font-semibold">{stall.packageName}{stall.zone ? ` · ${stall.zone}` : ""}</p>{stall.size && <p className="mt-1 text-xs text-slate-500">{stall.size}</p>}{stall.facilities.length > 0 && <p className="mt-2 text-xs text-slate-500">Includes: {stall.facilities.join(", ")}</p>}{stall.allowedCategories.length > 0 && <p className="mt-1 text-xs text-slate-500">For: {stall.allowedCategories.join(", ")}</p>}{stall.floorRow != null && <p className="mt-1 text-xs font-semibold text-slate-500">Floor position · Row {stall.floorRow}{stall.floorColumn != null ? `, spot ${stall.floorColumn}` : ""}</p>}
                        {stall.description && <p className="mt-1 text-xs text-slate-500">{stall.description}</p>}
                        <p className="mt-3 text-lg font-black text-emerald-700 dark:text-emerald-300">{stall.currency} {stall.price.toLocaleString()}</p>
                      </button>;
                    })}
                  </div>
                )}
                {selectedStall && selectedStall.status === "AVAILABLE" && (
                  <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-emerald-500/10 p-4 sm:flex-row sm:items-center">
                    <div><p className="font-bold">Apply for stall {selectedStall.stallNumber}</p><p className="text-xs text-slate-500">The organizer reviews your application before payment is enabled.</p></div>
                    <button onClick={() => setApplicationOpen(true)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Apply for this stall</button>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="mb-4 font-black text-slate-900 dark:text-white">My stall applications</h4>
                {applications.length === 0 ? <p className="text-sm text-slate-500">You have not applied to a market stall.</p> : <div className="space-y-3">
                  {applications.map((application) => <div key={application.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-700">
                    <div><p className="font-bold">{application.eventTitle} · {application.stallNumber}</p><p className="text-xs text-slate-500">{application.businessName} · {application.status.replaceAll("_", " ")}</p>{application.rejectionReason && <p className="mt-1 text-xs text-rose-600">{application.rejectionReason}</p>}</div>
                    {application.status === "PAYMENT_PENDING" && application.bookingId && <button disabled={busy} onClick={() => void payForApplication(application)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CreditCard className="h-4 w-4" />Pay {application.currency} {application.amountDue?.toLocaleString()}</button>}
                    {application.status === "CONFIRMED" && <span className="font-bold text-emerald-600">Confirmed</span>}
                  </div>)}
                </div>}
              </section>
            </main>
          )}
        </div>
      )}

      {applicationOpen && selectedStall && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setApplicationOpen(false); }}>
        <form onSubmit={submitApplication} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-start justify-between"><div><h3 className="text-xl font-black">Apply for {selectedStall.stallNumber}</h3><p className="text-sm text-slate-500">{selectedEvent?.title}</p></div><button type="button" onClick={() => setApplicationOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
          {[
            ["vendorName", "Your name"], ["businessName", "Business name"], ["category", "Business category"], ["phone", "Contact phone"],
          ].map(([key, label]) => <label key={key} className="block space-y-1 text-sm font-semibold">{label}<input required maxLength={150} value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" /></label>)}
          <label className="block space-y-1 text-sm font-semibold">Products or services<textarea required maxLength={2000} value={form.products} onChange={(event) => setForm({ ...form, products: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setApplicationOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit application"}</button></div>
        </form>
      </div>}
    </div>
  );
}
