import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Download, Loader2, MapPin, ReceiptText, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { interiorsService, type InteriorProject, type InteriorQuote } from "../../../services/interiors/interiorsService";
import { mediaService, type MediaResponse } from "../../../services/files/mediaService";
import { InteriorProjectProgress } from "./InteriorProjectProgress";

function money(value: number | null | undefined) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

function ProjectAttachments({ attachments }: { attachments: InteriorProject["attachments"] }) {
  const [media, setMedia] = useState<Record<string, MediaResponse | null>>({});
  useEffect(() => {
    let active = true;
    void Promise.all(attachments.map(async (attachment) => {
      try { return [attachment.mediaId, await mediaService.getById(attachment.mediaId)] as const; }
      catch { return [attachment.mediaId, null] as const; }
    })).then((items) => { if (active) setMedia(Object.fromEntries(items)); });
    return () => { active = false; };
  }, [attachments]);
  if (!attachments.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Plans and reference files</h2><ul className="mt-3 flex flex-wrap gap-2">{attachments.map((attachment) => <li key={attachment.mediaId}>{media[attachment.mediaId]?.url ? <a href={media[attachment.mediaId]?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"><Download className="h-3.5 w-3.5" />{attachment.fileName}</a> : <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{attachment.fileName}</span>}</li>)}</ul></section>;
}

function downloadQuotePdf(project: InteriorProject, quote: InteriorQuote) {
  const lines = [
    "MANA INTERIORS - PROJECT QUOTATION",
    `Project: ${project.title}`,
    `Designer: ${quote.providerName}`,
    `Area: ${project.locality}`,
    `Home: ${project.propertyType}, ${project.homeSize}`,
    `Prepared: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`,
    "",
    "COST BREAKDOWN",
    `Materials allowance: ${money(quote.materialAllowance)}`,
    `Labour: ${money(quote.laborAmount)}`,
    `GST / tax: ${money(quote.taxAmount)}`,
    `Quoted total: ${money(quote.quotedAmount)}`,
    `Estimated duration: ${quote.estimatedDurationDays ?? "To be agreed"} days`,
    "",
    "BILL OF QUANTITIES",
    ...(quote.lineItems.length ? quote.lineItems.map((item) => `${item.category} | ${item.description} | ${item.quantity} ${item.unit} x ${money(item.unitPrice)} | margin ${item.marginPercent}% | GST ${item.taxPercent}% | ${money(item.lineTotal)}`) : ["No itemized BOQ supplied."]),
    "",
    "SCOPE AND NOTES",
    project.projectScope,
    quote.notes || "No additional notes provided.",
    "",
    "This quotation was generated from the Mana Community Interiors marketplace.",
  ];
  const escaped = lines.map((line) => line.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/([\\()])/g, "\\$1").slice(0, 105));
  const pageLines = Array.from({ length: Math.ceil(escaped.length / 40) }, (_, index) => escaped.slice(index * 40, (index + 1) * 40));
  const fontObjectId = 3 + pageLines.length * 2;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pageLines.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageLines.length} >>`];
  pageLines.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const stream = ["BT", "/F1 10 Tf", "48 790 Td", ...page.flatMap((line, lineIndex) => index === 0 && lineIndex === 0 ? [`/F1 15 Tf (${line}) Tj`, "/F1 10 Tf", "0 -28 Td"] : [`(${line}) Tj`, "0 -18 Td"]), "ET"].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mana-interiors-quote-${quote.id}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InteriorProjects() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<InteriorProject[]>([]);
  const [project, setProject] = useState<InteriorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingQuote, setAcceptingQuote] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    try {
      if (id) setProject(await interiorsService.getProject(Number(id)));
      else setProjects(await interiorsService.listMyProjects());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your interiors projects");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    const request = id ? interiorsService.getProject(Number(id)) : interiorsService.listMyProjects();
    request
      .then((result) => {
        if (!active) return;
        if (id) setProject(result as InteriorProject);
        else setProjects(result as InteriorProject[]);
      })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load your interiors projects"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const acceptQuote = async (quoteId: number) => {
    if (!project) return;
    setAcceptingQuote(quoteId);
    try {
      setProject(await interiorsService.acceptQuote(project.id, quoteId));
      toast.success("Quote accepted. Your project is now assigned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not accept this quote");
    } finally {
      setAcceptingQuote(null);
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    const form = new FormData(event.currentTarget);
    setSubmittingReview(true);
    try {
      await interiorsService.reviewProject(project.id, {
        rating: Number(form.get("rating")),
        qualityRating: Number(form.get("qualityRating")),
        punctualityRating: Number(form.get("punctualityRating")),
        behaviorRating: Number(form.get("behaviorRating")),
        comment: String(form.get("comment") || "").trim(),
      });
      await load();
      toast.success("Thanks for reviewing your designer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-emerald-700" /></div>;

  if (!id) return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">Mana Interiors</p><h1 className="mt-1 text-2xl font-bold">My projects</h1><p className="mt-1 text-sm text-slate-500">Track enquiries and compare designer quotes.</p></div><Button variant="outline" onClick={() => navigate("/services/interiors")}><ArrowLeft className="mr-2 h-4 w-4" />Browse designers</Button></div>
    {projects.length ? <div className="space-y-3">{projects.map((item) => <button key={item.id} onClick={() => navigate(`/services/interiors/projects/${item.id}`)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm"><div className="min-w-0"><h2 className="truncate text-sm font-bold">{item.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.locality} · {item.propertyType} · {item.homeSize}</p><p className="mt-2 text-xs text-slate-500">{item.quotes.length} quote{item.quotes.length === 1 ? "" : "s"} · {new Date(item.createdAt).toLocaleDateString("en-IN")}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{item.status.replaceAll("_", " ")}</span></button>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Sparkles className="mx-auto h-7 w-7 text-emerald-700" /><h2 className="mt-3 text-base font-bold">No interiors projects yet</h2><p className="mt-1 text-sm text-slate-500">Create a project brief to get matched with designers.</p><Button className="mt-5" onClick={() => navigate("/services/interiors")}>Explore designers <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
  </div>;

  if (!project) return <div className="mx-auto max-w-4xl py-12 text-center"><h1 className="text-xl font-bold">Project not found</h1><Button className="mt-4" variant="outline" onClick={() => navigate("/services/interiors/projects")}><ArrowLeft className="mr-2 h-4 w-4" />Back to my projects</Button></div>;

  return <div className="mx-auto max-w-5xl space-y-6">
    {project.workOrder && <InteriorProjectProgress workOrder={project.workOrder} projectId={project.id} milestoneApprovals={project.milestoneApprovals ?? []} onChanged={() => { void load(); }} />}
    <ProjectAttachments attachments={project.attachments ?? []} />
    {Boolean(project.materialOrders?.length) && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">Material orders</h2><span className="text-xs text-slate-500">{project.materialOrders.length} order{project.materialOrders.length === 1 ? "" : "s"}</span></div><div className="mt-3 space-y-2">{project.materialOrders.map((order) => <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"><div><p className="text-xs font-bold">{order.orderNumber}</p><p className="mt-1 text-[11px] text-slate-500">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}</p></div><div className="text-right"><p className="text-xs font-bold">{money(order.totalAmount)}</p><p className="mt-1 text-[10px] font-semibold uppercase text-emerald-700">{order.status.replaceAll("_", " ")}</p></div></article>)}</div></section>}
    {project.workOrder && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Project tracking · {project.workOrder.providerName}</p><h2 className="mt-1 text-lg font-bold">{project.workOrder.status.replaceAll("_", " ")}</h2><p className="mt-1 text-sm text-emerald-900/70">{project.workOrder.notes || "Your designer will update the work order as the project progresses."}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">{project.workOrder.status === "COMPLETED" ? "Completed" : "In progress"}</span></div><div className="mt-4 grid gap-2 text-xs text-emerald-900/80 sm:grid-cols-3"><span>Scheduled start: <strong>{project.workOrder.scheduledStart ? new Date(project.workOrder.scheduledStart).toLocaleDateString("en-IN") : "To be scheduled"}</strong></span><span>Provider sign-off: <strong>{project.workOrder.providerSignoff ? "Complete" : "Pending"}</strong></span><span>Your sign-off: <strong>{project.workOrder.residentSignoff ? "Complete" : "Pending"}</strong></span></div></section>}
    {project.workOrder?.status === "COMPLETED" && (project.review ? <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Your review</h2><p className="mt-2 text-sm">{"★".repeat(project.review.rating)}{"☆".repeat(5 - project.review.rating)}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{project.review.comment}</p></section> : <form onSubmit={submitReview} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Review your completed project</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{[["rating", "Overall"], ["qualityRating", "Quality"], ["punctualityRating", "Punctuality"], ["behaviorRating", "Communication"]].map(([name, label]) => <label key={name} className="text-xs font-semibold text-slate-600">{label}<select name={name} required defaultValue="5" className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Okay</option><option value="2">2 · Poor</option><option value="1">1 · Bad</option></select></label>)}</div><textarea name="comment" rows={3} maxLength={2000} placeholder="Share a few details about your experience" className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /><Button type="submit" className="mt-3" disabled={submittingReview}>{submittingReview ? "Submitting…" : "Submit review"}</Button></form>)}
    <div><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" className="px-0" onClick={() => navigate("/services/interiors/projects")}><ArrowLeft className="mr-2 h-4 w-4" />My projects</Button><Button variant="outline" onClick={() => navigate(`/services/interiors/vendors?projectId=${project.id}`)}><Store className="mr-2 h-4 w-4" />Shop project materials</Button></div><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">Project #{project.id}</p><h1 className="mt-1 text-2xl font-bold">{project.title}</h1><p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{project.locality}</span><span>{project.propertyType} · {project.homeSize}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />Created {new Date(project.createdAt).toLocaleDateString("en-IN")}</span></p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-800">{project.status.replaceAll("_", " ")}</span></div></div>
    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Project brief</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.projectScope}</p>{(project.stylePreference || project.focusAreas?.length > 0) && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-600">Design preferences</p>{project.stylePreference && <p className="mt-1 text-sm text-slate-800">{project.stylePreference}</p>}{Boolean(project.focusAreas?.length) && <div className="mt-2 flex flex-wrap gap-1.5">{project.focusAreas.map((area) => <span key={area} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">{area}</span>)}</div>}</div>}<div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Budget range</p><p className="mt-1 text-sm font-bold">{money(project.budgetMin)} – {money(project.budgetMax)}</p></div>{project.preferredStart && <p className="mt-2 text-xs text-slate-500">Preferred start: {project.preferredStart}</p>}</article><article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Designer quotes</h2><span className="text-xs text-slate-500">{project.quotes.length} received</span></div>{project.quotes.length ? <div className="mt-4 space-y-3">{project.quotes.map((quote) => <div key={quote.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="text-sm font-bold">{quote.providerName}</h3>{quote.status === "ACCEPTED" && <BadgeCheck className="h-4 w-4 text-emerald-700" />}</div><p className="mt-1 text-xs text-slate-500">{quote.estimatedDurationDays ?? "—"} days · sent {new Date(quote.createdAt).toLocaleDateString("en-IN")}</p></div><p className="text-lg font-bold">{money(quote.quotedAmount)}</p></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4"><span>Materials <strong className="block text-slate-900">{money(quote.materialAllowance)}</strong></span><span>Labour <strong className="block text-slate-900">{money(quote.laborAmount)}</strong></span><span>GST / tax <strong className="block text-slate-900">{money(quote.taxAmount)}</strong></span><span>Total <strong className="block text-slate-900">{money(quote.quotedAmount)}</strong></span></div>{quote.notes && <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{quote.notes}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => downloadQuotePdf(project, quote)}><Download className="mr-2 h-3.5 w-3.5" />Download PDF</Button>{project.status !== "ASSIGNED" && <Button size="sm" disabled={acceptingQuote !== null || quote.status !== "SUBMITTED"} onClick={() => void acceptQuote(quote.id)}>{acceptingQuote === quote.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ReceiptText className="mr-2 h-3.5 w-3.5" />}Accept quote</Button>}</div></div>)}</div> : <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center"><p className="text-sm font-semibold">Waiting for designer quotes</p><p className="mt-1 text-xs text-slate-500">We’ll show proposals here as designers respond.</p></div>}</article></section>
    {project.quotes.some((quote) => quote.lineItems?.length) && <section className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">Itemized proposals</p><h2 className="mt-1 text-lg font-bold">Quotation and BOQ comparison</h2><p className="mt-1 text-xs text-slate-500">Compare quantities, unit rates, margins, GST and totals from each proposal.</p></div>{project.quotes.filter((quote) => quote.lineItems?.length).map((quote) => <article key={quote.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-bold">{quote.providerName}</h3><span className="text-sm font-bold">{money(quote.quotedAmount)}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2">Category / item</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit rate</th><th className="px-3 py-2">Margin</th><th className="px-3 py-2">GST</th><th className="px-4 py-2 text-right">Line total</th></tr></thead><tbody>{quote.lineItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-2"><span className="font-semibold">{item.category}</span><span className="ml-2 text-slate-600">{item.description}</span></td><td className="px-3 py-2">{item.quantity} {item.unit}</td><td className="px-3 py-2">{money(item.unitPrice)}</td><td className="px-3 py-2">{item.marginPercent}%</td><td className="px-3 py-2">{item.taxPercent}%</td><td className="px-4 py-2 text-right font-semibold">{money(item.lineTotal)}</td></tr>)}</tbody><tfoot className="border-t border-slate-200 bg-slate-50 font-bold"><tr><td colSpan={5} className="px-4 py-2 text-right">Total including taxes</td><td className="px-4 py-2 text-right">{money(quote.quotedAmount)}</td></tr></tfoot></table></div></article>)}</section>}
  </div>;
}
