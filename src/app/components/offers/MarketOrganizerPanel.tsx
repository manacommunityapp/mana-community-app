import { useEffect, useState, type FormEvent } from "react";
import { Plus, Store, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { marketBazaarApi, type MarketApplication, type MarketEvent } from "../../../services/market/marketBazaarApi";

export function MarketOrganizerPanel({ onChanged }: { onChanged: () => void }) {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);
  const [applications, setApplications] = useState<MarketApplication[]>([]);
  const [busy, setBusy] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", venue: "", city: "", startsAt: "", endsAt: "", category: "MARKET" });
  const [stallForm, setStallForm] = useState({ stallNumber: "", zone: "", packageName: "Standard stall", description: "", size: "", price: "", facilities: "", allowedCategories: "", floorRow: "", floorColumn: "" });

  const refresh = async (preferredId?: number) => {
    const data = await marketBazaarApi.organizerEvents();
    setEvents(data);
    const chosenId = data.some((item) => item.id === preferredId) ? preferredId! : data[0]?.id ?? null;
    setEventId(chosenId);
    if (chosenId) setApplications(await marketBazaarApi.listApplications(chosenId));
    else setApplications([]);
  };

  useEffect(() => { void refresh().catch((error) => toast.error(error.message ?? "Could not load organizer events.")); }, []);

  const createEvent = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await marketBazaarApi.createEvent({
        ...eventForm,
        startsAt: eventForm.startsAt,
        endsAt: eventForm.endsAt || undefined,
      });
      toast.success("Market event published to Events.");
      setEventForm({ title: "", description: "", venue: "", city: "", startsAt: "", endsAt: "", category: "MARKET" });
      await refresh(created.id);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish this event.");
    } finally { setBusy(false); }
  };

  const addStall = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventId) return;
    setBusy(true);
    try {
      await marketBazaarApi.createStall(eventId, {
        ...stallForm, price: Number(stallForm.price), currency: "INR",
        facilities: stallForm.facilities.split(",").map((value) => value.trim()).filter(Boolean),
        allowedCategories: stallForm.allowedCategories.split(",").map((value) => value.trim()).filter(Boolean),
        floorRow: stallForm.floorRow ? Number(stallForm.floorRow) : undefined,
        floorColumn: stallForm.floorColumn ? Number(stallForm.floorColumn) : undefined,
      });
      toast.success("Stall package added.");
      setStallForm({ stallNumber: "", zone: "", packageName: "Standard stall", description: "", size: "", price: "", facilities: "", allowedCategories: "", floorRow: "", floorColumn: "" });
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this stall.");
    } finally { setBusy(false); }
  };

  const review = async (application: MarketApplication, approve: boolean) => {
    setBusy(true);
    try {
      if (approve) await marketBazaarApi.approve(application.id, application.stallId);
      else await marketBazaarApi.reject(application.id, "Application declined by the event organizer.");
      toast.success(approve ? "Application approved. A 15-minute payment hold is active." : "Application declined.");
      await refresh(eventId ?? undefined);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the application.");
    } finally { setBusy(false); }
  };

  const field = (label: string, value: string, onChange: (value: string) => void, type = "text", required = true) => (
    <label className="block space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
    </label>
  );

  return <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Plus className="h-5 w-5 text-emerald-600" />Publish a market event</h3>
      <p className="mb-4 text-xs text-slate-500">Creates the event in Mana Events and links Bazaar inventory to that same event record.</p>
      <form onSubmit={createEvent} className="grid gap-3 sm:grid-cols-2">
        {field("Event title", eventForm.title, (title) => setEventForm({ ...eventForm, title }))}
        {field("Venue", eventForm.venue, (venue) => setEventForm({ ...eventForm, venue }))}
        {field("City", eventForm.city, (city) => setEventForm({ ...eventForm, city }), "text", false)}
        {field("Category", eventForm.category, (category) => setEventForm({ ...eventForm, category }), "text", false)}
        {field("Starts at", eventForm.startsAt, (startsAt) => setEventForm({ ...eventForm, startsAt }), "datetime-local")}
        {field("Ends at", eventForm.endsAt, (endsAt) => setEventForm({ ...eventForm, endsAt }), "datetime-local", false)}
        <label className="block space-y-1 text-xs font-semibold text-slate-600 sm:col-span-2 dark:text-slate-300">Description<textarea value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
        <button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Publishing…" : "Publish event"}</button>
      </form>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Store className="h-5 w-5 text-emerald-600" />Stall inventory</h3>
      <label className="mb-4 block space-y-1 text-xs font-semibold">Event<select value={eventId ?? ""} onChange={async (event) => { const id = Number(event.target.value); setEventId(id); setApplications(await marketBazaarApi.listApplications(id)); }} className="w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="" disabled>Select an event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <form onSubmit={addStall} className="grid gap-3 sm:grid-cols-2">
        {field("Stall number", stallForm.stallNumber, (stallNumber) => setStallForm({ ...stallForm, stallNumber }))}
        {field("Package", stallForm.packageName, (packageName) => setStallForm({ ...stallForm, packageName }))}
        {field("Zone", stallForm.zone, (zone) => setStallForm({ ...stallForm, zone }), "text", false)}
        {field("Size", stallForm.size, (size) => setStallForm({ ...stallForm, size }), "text", false)}
        {field("Price (₹)", stallForm.price, (price) => setStallForm({ ...stallForm, price }), "number")}
        {field("Floor row", stallForm.floorRow, (floorRow) => setStallForm({ ...stallForm, floorRow }), "number", false)}
        {field("Floor column", stallForm.floorColumn, (floorColumn) => setStallForm({ ...stallForm, floorColumn }), "number", false)}
        {field("Facilities (comma-separated)", stallForm.facilities, (facilities) => setStallForm({ ...stallForm, facilities }), "text", false)}
        {field("Allowed categories (comma-separated)", stallForm.allowedCategories, (allowedCategories) => setStallForm({ ...stallForm, allowedCategories }), "text", false)}
        {field("Description", stallForm.description, (description) => setStallForm({ ...stallForm, description }), "text", false)}
        <button disabled={busy || !eventId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900 sm:col-span-2">Add stall</button>
      </form>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><ClipboardList className="h-5 w-5 text-emerald-600" />Vendor applications</h3>
      {!eventId ? <p className="text-sm text-slate-500">Publish a market event to review applications.</p> : !applications.length ? <p className="text-sm text-slate-500">No applications for this event yet.</p> : <div className="space-y-3">{applications.map((application) => <article key={application.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h4 className="font-bold">{application.businessName} · {application.stallNumber}</h4><p className="text-xs text-slate-500">{application.vendorName} · {application.category} · {application.phone}</p><p className="mt-2 text-sm">{application.products}</p><p className="mt-1 text-xs font-semibold text-amber-700">{application.status.replaceAll("_", " ")}</p></div>
          {(application.status === "SUBMITTED" || application.status === "UNDER_REVIEW") && <div className="flex gap-2"><button disabled={busy} onClick={() => void review(application, false)} className="rounded-xl border px-3 py-2 text-xs font-bold">Decline</button><button disabled={busy} onClick={() => void review(application, true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button></div>}
        </div>
      </article>)}</div>}
    </section>
    {busy && <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Saving changes…</div>}
  </div>;
}


