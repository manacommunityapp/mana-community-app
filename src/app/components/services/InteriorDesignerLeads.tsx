import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, MapPin, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { interiorsService, type InteriorProject, type SubmitInteriorQuote } from "../../../services/interiors/interiorsService";

type QuoteDraftItem = { category: string; description: string; quantity: string; unit: string; unitPrice: string; marginPercent: string; taxPercent: string };

const newQuoteItem = (): QuoteDraftItem => ({ category: "MATERIAL", description: "", quantity: "1", unit: "unit", unitPrice: "", marginPercent: "0", taxPercent: "18" });

function buildQuote(items: QuoteDraftItem[]) {
  const lineItems = items.map((item) => ({
    category: item.category,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    marginPercent: Number(item.marginPercent || 0),
    taxPercent: Number(item.taxPercent || 0),
  }));
  const totals = lineItems.reduce((sum, item) => {
    const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
    const base = roundMoney(item.quantity * item.unitPrice);
    const margin = roundMoney(base * item.marginPercent / 100);
    const tax = roundMoney((base + margin) * item.taxPercent / 100);
    sum.total += base + margin + tax;
    sum.tax += tax;
    if (item.category === "MATERIAL") sum.materials += base;
    if (item.category === "LABOUR") sum.labor += base;
    return sum;
  }, { total: 0, tax: 0, materials: 0, labor: 0 });
  return { lineItems, totals };
}

function InteriorQuoteBuilder({ busy, onSubmit }: { busy: boolean; onSubmit: (data: SubmitInteriorQuote) => void }) {
  const [items, setItems] = useState<QuoteDraftItem[]>([newQuoteItem()]);
  const { lineItems, totals } = buildQuote(items);
  return <form onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const duration = Number(form.get("estimatedDurationDays"));
    onSubmit({ quotedAmount: Number(totals.total.toFixed(2)), estimatedDurationDays: duration,
      materialAllowance: Number(totals.materials.toFixed(2)), laborAmount: Number(totals.labor.toFixed(2)),
      taxAmount: Number(totals.tax.toFixed(2)), notes: String(form.get("notes") || "").trim() || undefined,
      lineItems });
  }} className="space-y-3 rounded-xl bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold">Quotation and BOQ</h3><button type="button" onClick={() => setItems((rows) => [...rows, newQuoteItem()])} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold">Add item</button></div>
    <div className="space-y-2">{items.map((item, index) => <div key={index} className="rounded-lg border border-slate-200 bg-white p-3"><div className="grid gap-2 sm:grid-cols-2"><label className="text-[11px] font-semibold text-slate-500">Category<select value={item.category} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, category: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"><option value="MATERIAL">Material</option><option value="LABOUR">Labour</option><option value="DESIGN">Design</option><option value="OTHER">Other</option></select></label><label className="text-[11px] font-semibold text-slate-500">Work / material description<input required maxLength={240} value={item.description} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} placeholder="e.g. BWP plywood wardrobe" className="mt-1 w-full rounded border border-slate-200 p-2 text-xs" /></label></div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"><label className="text-[11px] font-semibold text-slate-500">Qty<input required min="0.001" step="0.001" type="number" value={item.quantity} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs" /></label><label className="text-[11px] font-semibold text-slate-500">Unit<select value={item.unit} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"><option>unit</option><option>sqft</option><option>rft</option><option>set</option><option>lot</option><option>day</option></select></label><label className="text-[11px] font-semibold text-slate-500">Unit price<input required min="0" step="0.01" type="number" value={item.unitPrice} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, unitPrice: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs" /></label><label className="text-[11px] font-semibold text-slate-500">Margin %<input min="0" step="0.01" type="number" value={item.marginPercent} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, marginPercent: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs" /></label><label className="text-[11px] font-semibold text-slate-500">GST %<input min="0" step="0.01" type="number" value={item.taxPercent} onChange={(e) => setItems((rows) => rows.map((row, i) => i === index ? { ...row, taxPercent: e.target.value } : row))} className="mt-1 w-full rounded border border-slate-200 p-2 text-xs" /></label></div>{items.length > 1 && <button type="button" onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))} className="mt-2 text-[11px] font-semibold text-red-600">Remove item</button>}</div>)}</div>
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex items-center justify-between text-xs text-emerald-900"><span>BOQ total including GST</span><strong>₹{totals.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div><p className="mt-1 text-[10px] text-emerald-800">Material, labour, margin and tax are calculated from the line items.</p></div>
    <label className="block text-xs font-semibold text-slate-600">Duration (days)<input required name="estimatedDurationDays" min="1" type="number" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" /></label><label className="block text-xs font-semibold text-slate-600">Notes<textarea name="notes" rows={2} className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" placeholder="Material grades, inclusions, assumptions…" /></label><button disabled={busy || !Number.isFinite(totals.total) || totals.total <= 0} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Send className="h-4 w-4" />{busy ? "Sending…" : "Send quotation"}</button>
  </form>;
}

export function InteriorDesignerLeads() {
  const [leads, setLeads] = useState<InteriorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLeads(await interiorsService.listDesignerLeads());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load interior project leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    interiorsService.listDesignerLeads()
      .then((items) => { if (active) setLeads(items); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load interior project leads"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submitQuote = async (data: SubmitInteriorQuote, leadId: number) => {
    setSending(leadId);
    try {
      await interiorsService.submitQuote(leadId, data);
      toast.success("Quote sent to the client");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your quote");
    } finally {
      setSending(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading project leads…</div>;
  if (!leads.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Sparkles className="mx-auto h-7 w-7 text-emerald-700" /><h2 className="mt-3 text-base font-bold">No interior project invitations yet</h2><p className="mt-1 text-sm text-slate-500">New client briefs matched to your profile will appear here.</p></div>;

  return <div className="space-y-4">{leads.map((lead) => {
    const existingQuote = lead.quotes.find((quote) => quote.status === "SUBMITTED");
    return <article key={lead.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-[1fr_.85fr]">
      <div><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800">Project invitation</p><h2 className="mt-1 text-base font-bold">{lead.title}</h2></div><BadgeCheck className="h-5 w-5 shrink-0 text-emerald-700" /></div><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{lead.locality} · {lead.propertyType} · {lead.homeSize}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{lead.projectScope}</p><p className="mt-3 text-xs text-slate-500">Client budget: ₹{(lead.budgetMin ?? 0).toLocaleString("en-IN")} – ₹{(lead.budgetMax ?? 0).toLocaleString("en-IN")}</p>{existingQuote && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">Your quote has been sent. Amount: ₹{existingQuote.quotedAmount.toLocaleString("en-IN")}</p>}</div>
      {!existingQuote && <InteriorQuoteBuilder busy={sending === lead.id} onSubmit={(data) => { void submitQuote(data, lead.id); }} />}
    </article>;
  })}</div>;
}
