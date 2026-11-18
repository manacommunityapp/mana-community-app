import { useEffect, useState, type ChangeEvent } from "react";
import { Loader2, Plus, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { mediaService, type MediaResponse } from "../../../services/files/mediaService";
import { serviceProviderService } from "../../../services/vendor/servicePlatformService";
import type { CspWorkOrderResponse } from "../../../types/api";

type Task = { id: string; title: string; done: boolean; dueDate?: string };
type MediaRef = { mediaId?: string; url?: string; name?: string };

function createTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; }
  catch { return []; }
}

function dateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function InteriorWorkOrderWorkspace({ workOrder, onSaved }: { workOrder: CspWorkOrderResponse; onSaved: () => void }) {
  const [notes, setNotes] = useState(workOrder.notes || "");
  const [materials, setMaterials] = useState(workOrder.materialsUsed || "");
  const [tasks, setTasks] = useState<Task[]>(() => parseArray<Partial<Task>>(workOrder.checklistItems).map((task) => ({ ...task, id: task.id || createTaskId(), title: task.title || "", done: Boolean(task.done) })));
  const [start, setStart] = useState(dateTimeLocal(workOrder.scheduledStart));
  const [end, setEnd] = useState(dateTimeLocal(workOrder.scheduledEnd));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [photos, setPhotos] = useState<Record<string, MediaResponse | null>>({});
  const photoRefs = [...parseArray<MediaRef | string>(workOrder.beforePhotos), ...parseArray<MediaRef | string>(workOrder.afterPhotos)]
    .map((item) => typeof item === "string" ? { mediaId: item } : item)
    .filter((item) => item.mediaId || item.url);

  useEffect(() => {
    let active = true;
    const ids = photoRefs.map((item) => item.mediaId).filter((value): value is string => Boolean(value));
    void Promise.all(ids.map(async (id) => {
      try { return [id, await mediaService.getById(id)] as const; }
      catch { return [id, null] as const; }
    })).then((entries) => { if (active) setPhotos(Object.fromEntries(entries)); });
    return () => { active = false; };
  // The saved photo references are the only changing media inputs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrder.beforePhotos, workOrder.afterPhotos]);

  const save = async () => {
    setSaving(true);
    try {
      await serviceProviderService.updateWorkOrderProgress(workOrder.id, {
        notes,
        materialsUsed: materials,
        checklistItems: JSON.stringify(tasks),
        scheduledStart: start || undefined,
        scheduledEnd: end || undefined,
      });
      toast.success("Project workspace saved");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save project progress");
    } finally { setSaving(false); }
  };

  const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>, context: "before" | "after") => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    if (!files.length) return;
    setUploading(context);
    try {
      const uploaded = await Promise.all(files.slice(0, 8).map((file) => fileUploadService.upload(file, "INTERIORS", String(workOrder.id), undefined, context)));
      const newRefs = uploaded.flatMap((file) => file.id ? [{ mediaId: String(file.id), name: file.originalName }] : []);
      const refs = parseArray<MediaRef | string>(context === "before" ? workOrder.beforePhotos : workOrder.afterPhotos)
        .map((item) => typeof item === "string" ? { mediaId: item } : item);
      const nextRefs = [...refs, ...newRefs];
      await serviceProviderService.updateWorkOrderProgress(workOrder.id, {
        [context === "before" ? "beforePhotos" : "afterPhotos"]: JSON.stringify(nextRefs),
      });
      const resolved = await Promise.all(uploaded.filter((file) => file.id).map(async (file) => [String(file.id), await mediaService.getById(String(file.id))] as const));
      setPhotos((current) => ({ ...current, ...Object.fromEntries(resolved) }));
      toast.success(`${uploaded.length} project photo${uploaded.length === 1 ? "" : "s"} uploaded`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload project photos");
    } finally { setUploading(null); }
  };

  const updateTask = (index: number, changes: Partial<Task>) => setTasks((items) => items.map((task, taskIndex) => taskIndex === index ? { ...task, ...changes } : task));

  return <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer text-sm font-bold text-slate-800">Project workspace · schedule, tasks, materials and site photos</summary>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Visit / start<input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-600">Estimated finish<input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" /></label></div>
        <label className="block text-xs font-semibold text-slate-600">Project notes<textarea rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Site visit notes, decisions and customer updates" /></label>
        <label className="block text-xs font-semibold text-slate-600">Materials / procurement notes<textarea rows={2} value={materials} onChange={(e) => setMaterials(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Material, quantity, vendor or delivery note" /></label>
      </div>
      <div>
        <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-slate-700">Tasks and milestones</h3><Button size="sm" variant="outline" onClick={() => setTasks((items) => [...items, { id: createTaskId(), title: "", done: false }])}><Plus className="mr-1 h-3 w-3" />Add task</Button></div>
        <div className="mt-2 space-y-2">{tasks.map((task, index) => <div key={`${index}-${task.title}`} className="flex items-center gap-2"><input type="checkbox" checked={task.done} onChange={(e) => updateTask(index, { done: e.target.checked })} aria-label={`Mark ${task.title || "task"} done`} /><input value={task.title} onChange={(e) => updateTask(index, { title: e.target.value })} placeholder="e.g. Finalise kitchen layout" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs" /><button type="button" aria-label="Remove task" onClick={() => setTasks((items) => items.filter((_, i) => i !== index))} className="rounded p-1 text-slate-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></div>)}{!tasks.length && <p className="rounded-lg bg-white p-3 text-xs text-slate-500">Add site visit, design approval, procurement and installation milestones.</p>}</div>
      </div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {(["before", "after"] as const).map((context) => {
        const refs = parseArray<MediaRef | string>(context === "before" ? workOrder.beforePhotos : workOrder.afterPhotos).map((item) => typeof item === "string" ? { mediaId: item } : item);
        return <div key={context} className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold capitalize text-slate-700">{context === "before" ? "Before / progress photos" : "Completion photos"}</p><label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold">{uploading === context ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}Upload<input type="file" accept="image/*" multiple className="hidden" disabled={uploading !== null} onChange={(e) => void uploadPhotos(e, context)} /></label></div><div className="mt-2 flex flex-wrap gap-2">{refs.map((ref, index) => { const media = ref.mediaId ? photos[ref.mediaId] : null; const src = media?.url || ref.url; return src ? <img key={ref.mediaId || `${index}-${src}`} src={src} alt={ref.name || `${context} project photo`} className="h-16 w-20 rounded-md object-cover" loading="lazy" /> : <span key={index} className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">Photo {index + 1}</span>; })}{!refs.length && <p className="text-[11px] text-slate-400">No photos added yet.</p>}</div></div>;
      })}
    </div>
    <div className="mt-3 flex justify-end"><Button size="sm" onClick={() => void save()} disabled={saving || uploading !== null}>{saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}Save project workspace</Button></div>
  </details>;
}
