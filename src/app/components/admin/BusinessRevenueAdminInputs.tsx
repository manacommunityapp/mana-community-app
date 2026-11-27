import { useEffect, useState, type FormEvent } from "react";
import {
  businessRevenueService,
  type CommunitySubscriptionInput,
  type CommunitySubscriptionRecord,
  type CommunitySubscriptionStatus,
} from "../../../services/analytics/businessRevenueService";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ communityId: "", externalReference: "", planCode: "", planName: "", recurringAmount: "", billingPeriodMonths: "1", status: "ACTIVE" as CommunitySubscriptionStatus, currentPeriodStart: today(), currentPeriodEnd: "" });

export function BusinessRevenueAdminInputs({ onSaved }: { onSaved: () => void }) {
  const [rows, setRows] = useState<CommunitySubscriptionRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try { setRows(await businessRevenueService.listSubscriptions()); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load subscriptions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reload(); }, []);

  const selectSubscription = (value: string) => {
    setSelectedId(value);
    setSavedMessage(null);
    const row = rows.find((item) => String(item.id) === value);
    if (!row) { setForm(emptyForm()); return; }
    setForm({ communityId: String(row.communityId), externalReference: row.externalReference ?? "", planCode: row.planCode, planName: row.planName, recurringAmount: String(row.recurringAmount), billingPeriodMonths: String(row.billingPeriodMonths), status: row.status, currentPeriodStart: row.currentPeriodStart, currentPeriodEnd: row.currentPeriodEnd ?? "" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    const input: CommunitySubscriptionInput = {
      communityId: Number(form.communityId),
      externalReference: form.externalReference.trim() || null,
      planCode: form.planCode.trim(),
      planName: form.planName.trim(),
      recurringAmount: Number(form.recurringAmount),
      billingPeriodMonths: Number(form.billingPeriodMonths),
      status: form.status,
      currentPeriodStart: form.currentPeriodStart,
      currentPeriodEnd: form.currentPeriodEnd || null,
    };
    try {
      const row = await businessRevenueService.saveSubscription(selectedId ? Number(selectedId) : null, input);
      setSelectedId(String(row.id));
      await reload();
      setSavedMessage("Subscription ledger entry saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save subscription.");
    } finally { setSaving(false); }
  };

  return <details className="rounded-xl border border-border/70 bg-card px-4 py-3">
    <summary className="cursor-pointer text-sm font-semibold text-primary">Manage community SaaS subscriptions</summary>
    <p className="mt-2 text-xs text-muted-foreground">Keep the current plan amount and paid-through period current. MRR is normalized from the stored 1, 3, 6, or 12 month billing period.</p>
    <div className="mt-3 max-w-md">
      <label className="text-xs text-muted-foreground">Edit existing or create new<select value={selectedId} onChange={(event) => selectSubscription(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground"><option value="">New subscription</option>{rows.map((row) => <option key={row.id} value={row.id}>Community {row.communityId} · {row.planName} · {row.status}</option>)}</select></label>
    </div>
    <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs text-muted-foreground">Community ID<input required type="number" min="1" disabled={!!selectedId} value={form.communityId} onChange={(e) => setForm((v) => ({ ...v, communityId: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground disabled:opacity-60" /></label>
      <label className="text-xs text-muted-foreground">Plan code<input required value={form.planCode} onChange={(e) => setForm((v) => ({ ...v, planCode: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">Plan name<input required value={form.planName} onChange={(e) => setForm((v) => ({ ...v, planName: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">External billing reference<input value={form.externalReference} onChange={(e) => setForm((v) => ({ ...v, externalReference: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">Recurring price (₹)<input required type="number" min="0" step="0.01" value={form.recurringAmount} onChange={(e) => setForm((v) => ({ ...v, recurringAmount: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">Billing period<select value={form.billingPeriodMonths} onChange={(e) => setForm((v) => ({ ...v, billingPeriodMonths: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground"><option value="1">Monthly</option><option value="3">Quarterly</option><option value="6">Half yearly</option><option value="12">Yearly</option></select></label>
      <label className="text-xs text-muted-foreground">Status<select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as CommunitySubscriptionStatus }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground">{["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"].map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">Current period starts<input required type="date" value={form.currentPeriodStart} onChange={(e) => setForm((v) => ({ ...v, currentPeriodStart: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">Paid through<input type="date" value={form.currentPeriodEnd} onChange={(e) => setForm((v) => ({ ...v, currentPeriodEnd: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
      <button type="submit" disabled={saving || loading} className="self-end rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save subscription"}</button>
    </form>
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
    {savedMessage && <p role="status" className="mt-2 text-xs text-emerald-700">{savedMessage}</p>}
  </details>;
}