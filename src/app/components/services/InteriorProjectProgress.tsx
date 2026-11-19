import { useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { mediaService, type MediaResponse } from "../../../services/files/mediaService";
import { serviceProviderService } from "../../../services/vendor/servicePlatformService";
import { interiorsService, type InteriorWorkOrder } from "../../../services/interiors/interiorsService";

type Task = { id?: string; title: string; done: boolean; dueDate?: string };
type PhotoRef = { mediaId?: string; url?: string; name?: string } | string;

function parseArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; }
  catch { return []; }
}

function refs(value: string | null) {
  return parseArray<PhotoRef>(value).map((item) => typeof item === "string" ? { mediaId: item } : item);
}

export function InteriorProjectProgress({ workOrder, projectId, milestoneApprovals, onChanged }: { workOrder: InteriorWorkOrder; projectId: number; milestoneApprovals: string[]; onChanged: () => void }) {
  const tasks = parseArray<Task>(workOrder.checklistItems);
  const mediaRefs = [...refs(workOrder.beforePhotos), ...refs(workOrder.afterPhotos)];
  const [photos, setPhotos] = useState<Record<string, MediaResponse | null>>({});
  const [signingOff, setSigningOff] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const ids = [...refs(workOrder.beforePhotos), ...refs(workOrder.afterPhotos)]
      .map((item) => item.mediaId).filter((value): value is string => Boolean(value));
    void Promise.all(ids.map(async (id) => {
      try { return [id, await mediaService.getById(id)] as const; }
      catch { return [id, null] as const; }
    })).then((entries) => { if (active) setPhotos(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, [workOrder.beforePhotos, workOrder.afterPhotos]);

  const signOff = async () => {
    setSigningOff(true);
    try {
      await serviceProviderService.signoffWorkOrder(workOrder.id);
      toast.success("Project completion confirmed");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not confirm project completion");
    } finally { setSigningOff(false); }
  };

  const approveMilestone = async (milestoneId: string) => {
    setApproving(milestoneId);
    try {
      await interiorsService.approveMilestone(projectId, milestoneId);
      toast.success("Milestone approved");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve milestone");
    } finally { setApproving(null); }
  };

  const doneCount = tasks.filter((task) => task.done).length;

  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-700" /><h2 className="text-sm font-bold">Project milestones</h2></div><span className="text-xs text-slate-500">{doneCount}/{tasks.length} complete</span></div>
    {tasks.length ? <ol className="mt-3 space-y-2">{tasks.map((task, index) => { const approved = task.id ? milestoneApprovals.includes(task.id) : false; return <li key={task.id || `${index}-${task.title}`} className="flex flex-wrap items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 shrink-0 ${task.done ? "text-emerald-700" : "text-slate-300"}`} /><span className={task.done ? "text-slate-500 line-through" : "text-slate-700"}>{task.title || "Project task"}</span>{task.dueDate && <span className="text-xs text-slate-400">{task.dueDate}</span>}{task.done && (approved ? <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Approved</span> : task.id ? <Button size="sm" variant="outline" className="ml-auto h-7 px-2 text-[11px]" disabled={approving !== null} onClick={() => void approveMilestone(task.id!)}>{approving === task.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Approve milestone</Button> : null)}</li>; })}</ol> : <p className="mt-3 text-xs text-slate-500">Your designer has not added milestones yet.</p>}
    {workOrder.materialsUsed && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-700">Materials and procurement notes</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{workOrder.materialsUsed}</p></div>}
    {mediaRefs.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-700">Site photos</p><div className="mt-2 flex flex-wrap gap-2">{mediaRefs.map((ref, index) => { const src = (ref.mediaId ? photos[ref.mediaId]?.url : undefined) || ref.url; return src ? <a key={ref.mediaId || `${index}-${src}`} href={src} target="_blank" rel="noreferrer" className="block"><img src={src} alt={ref.name || "Interior project progress"} className="h-20 w-28 rounded-lg object-cover" loading="lazy" /></a> : <span key={index} className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">Photo {index + 1}</span>; })}</div></div>}
    {workOrder.status === "COMPLETED" && !workOrder.residentSignoff && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3"><div><p className="text-xs font-bold text-emerald-900">Designer marked this project complete</p><p className="mt-1 text-[11px] text-emerald-900/70">Review the work and confirm completion.</p></div><Button size="sm" onClick={() => void signOff()} disabled={signingOff}>{signingOff ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="mr-2 h-3.5 w-3.5" />}Confirm completion</Button></div>}
    {workOrder.residentSignoff && <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-4 w-4" />Completion confirmed</p>}
  </section>;
}
