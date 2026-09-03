import { useEffect, useState, useCallback } from "react";
import {
  Building2, MapPin, Users, Globe, Loader2, ShieldCheck,
  Plus, Pencil, Trash2, X, Search, Inbox, Layers, Home, Info, AlertCircle,
  Eye, CheckCircle2, LayoutGrid,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { communityService } from "../../../services/community/communityService";
import { confirmAction } from "../../../utils/AlertUtils";
import type { CommunityResponse, BlockConfigResponse } from "../../../types/api";

const COMMUNITY_TYPES = [
  { value: "APARTMENT", label: "Apartment / Society" },
  { value: "COLLEGE", label: "College / University" },
  { value: "SCHOOL", label: "School" },
  { value: "OFFICE", label: "Office / Corporate" },
  { value: "CLUB", label: "Sports Club / Gym" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  COMMUNITY_TYPES.map((t) => [t.value, t.label])
);

interface BlockFormItem {
  blockName: string;
  totalFloors: number;
  flatsPerFloor: number;
}

const DEFAULT_BLOCKS_FORM: BlockFormItem[] = [
  { blockName: "A", totalFloors: 10, flatsPerFloor: 11 },
  { blockName: "B", totalFloors: 10, flatsPerFloor: 11 },
  { blockName: "C", totalFloors: 10, flatsPerFloor: 12 },
  { blockName: "D", totalFloors: 10, flatsPerFloor: 11 },
];

const emptyForm = {
  name: "",
  type: "APARTMENT",
  subtype: "",
  city: "",
  state: "",
  area: "",
  inviteCode: "",
  blockConfigs: DEFAULT_BLOCKS_FORM as BlockFormItem[],
};

type FormData = typeof emptyForm;

const generateFlatsList = (floor: number, flatsPerFloor: number): string[] => {
  const base = floor * 100;
  return Array.from({ length: flatsPerFloor }, (_, i) => String(base + i + 1));
};

export function AdminCommunity() {
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal: null = closed, "create" = new, or the community being edited.
  const [modal, setModal] = useState<null | "create" | CommunityResponse>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Flats Preview Modal State
  const [showFlatsPreview, setShowFlatsPreview] = useState(false);
  const [previewBlock, setPreviewBlock] = useState<string>("ALL");
  const [previewFloor, setPreviewFloor] = useState<number | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await communityService.getCommunities();
      setCommunities(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load communities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      blockConfigs: DEFAULT_BLOCKS_FORM.map((b) => ({ ...b })),
    });
    setModal("create");
  };

  const openEdit = async (c: CommunityResponse) => {
    let blocks: BlockFormItem[] = [];
    if (c.blockConfigs && c.blockConfigs.length > 0) {
      blocks = c.blockConfigs.map((b) => ({
        blockName: b.blockName,
        totalFloors: b.totalFloors || 10,
        flatsPerFloor: b.flatsPerFloor || 11,
      }));
    } else if (c.type === "APARTMENT") {
      try {
        const dbBlocks = await communityService.getBlockConfigs(c.id);
        if (Array.isArray(dbBlocks) && dbBlocks.length > 0) {
          blocks = dbBlocks.map((b) => ({
            blockName: b.blockName,
            totalFloors: b.totalFloors || 10,
            flatsPerFloor: b.flatsPerFloor || 11,
          }));
        }
      } catch {
        blocks = DEFAULT_BLOCKS_FORM.map((b) => ({ ...b }));
      }
    }

    setForm({
      name: c.name || "",
      type: c.type || "APARTMENT",
      subtype: c.subtype || "",
      city: c.city || "",
      state: c.state || "",
      area: c.area || "",
      inviteCode: c.inviteCode || "",
      blockConfigs: blocks.length > 0 ? blocks : DEFAULT_BLOCKS_FORM.map((b) => ({ ...b })),
    });
    setModal(c);
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const handleBlockChange = (index: number, field: keyof BlockFormItem, value: any) => {
    setForm((prev) => {
      const updated = [...prev.blockConfigs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, blockConfigs: updated };
    });
  };

  const handleAddBlock = () => {
    setForm((prev) => {
      const existingNames = prev.blockConfigs.map((b) => b.blockName.toUpperCase());
      const nextChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("")
        .find((char) => !existingNames.includes(char)) || `B${prev.blockConfigs.length + 1}`;
      return {
        ...prev,
        blockConfigs: [
          ...prev.blockConfigs,
          { blockName: nextChar, totalFloors: 10, flatsPerFloor: 11 },
        ],
      };
    });
  };

  const handleRemoveBlock = (index: number) => {
    setForm((prev) => ({
      ...prev,
      blockConfigs: prev.blockConfigs.filter((_, i) => i !== index),
    }));
  };

  const totalCalculatedFlats = form.blockConfigs.reduce(
    (sum, b) => sum + (Number(b.totalFloors) || 0) * (Number(b.flatsPerFloor) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.type) {
      toast.error("Name, type and city are required");
      return;
    }

    if (form.type === "APARTMENT") {
      if (form.blockConfigs.length === 0) {
        toast.error("Apartment community must have at least 1 block configured");
        return;
      }
      for (const b of form.blockConfigs) {
        if (!b.blockName?.trim()) {
          toast.error("All blocks must have a valid block name");
          return;
        }
        if (Number(b.totalFloors) <= 0 || Number(b.flatsPerFloor) <= 0) {
          toast.error(`Block ${b.blockName} must have positive floor and flats count`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        type: form.type,
        subtype: form.subtype?.trim() || undefined,
        city: form.city.trim(),
        state: form.state?.trim() || undefined,
        area: form.area?.trim() || undefined,
        inviteCode: form.inviteCode?.trim() || undefined,
        blockConfigs: form.type === "APARTMENT"
          ? form.blockConfigs.map((b) => ({
              blockName: b.blockName.trim().toUpperCase(),
              totalFloors: Number(b.totalFloors),
              flatsPerFloor: Number(b.flatsPerFloor),
            }))
          : undefined,
      };

      if (modal === "create") {
        await communityService.createCommunity(payload);
        toast.success(`Community "${form.name}" created with ${form.blockConfigs.length} blocks (${totalCalculatedFlats} flats) saved to database`);
      } else if (modal && typeof modal === "object") {
        await communityService.updateCommunity(modal.id, payload);
        toast.success(`Community "${form.name}" and block configurations updated in database`);
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save community");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: CommunityResponse) => {
    const ok = await confirmAction(
      "Delete Community",
      `Deactivate "${c.name}"? It will be hidden from the platform but its data is preserved.`
    );
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await communityService.deleteCommunity(c.id);
      toast.success(`Community "${c.name}" deleted`);
      setCommunities((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete community");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = communities.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.area?.toLowerCase().includes(q) ||
      c.inviteCode?.toLowerCase().includes(q)
    );
  });

  // Filtered blocks and floors for the Flats Preview Modal
  const previewBlocksList = previewBlock === "ALL"
    ? form.blockConfigs
    : form.blockConfigs.filter((b) => b.blockName.toUpperCase() === previewBlock.toUpperCase());

  const maxFloorsInSelection = Math.max(
    ...form.blockConfigs.map((b) => Number(b.totalFloors) || 1),
    1
  );

  return (
    <div className="space-y-5">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            Community Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, edit and manage communities and database block configurations.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          <Plus className="w-4 h-4" /> New Community
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city or code..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading communities...
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive font-medium mb-3">{error}</p>
          <button onClick={load} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-accent transition-colors">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{search ? "No communities match your search." : "No communities yet."}</p>
          {!search && (
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors">
              <Plus className="w-4 h-4" /> Create your first community
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const blockCount = c.blockConfigs?.length || (c.type === "APARTMENT" ? 4 : 0);
            const flatTotal = c.blockConfigs?.reduce((a, b) => a + (b.totalFlats || (b.totalFloors * b.flatsPerFloor)), 0) || (c.type === "APARTMENT" ? 450 : 0);

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{c.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {TYPE_LABEL[c.type] || c.type}
                        </span>
                        {c.type === "APARTMENT" && blockCount > 0 && (
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                            {blockCount} Blocks · {flatTotal} Flats (DB Configured)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {[c.area, c.city, c.state].filter(Boolean).join(", ") || "No location set"}
                    </span>
                  </div>
                  {c.inviteCode && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-mono uppercase">{c.inviteCode}</span>
                    </div>
                  )}
                  {c.subtype && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{c.subtype}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 mt-auto border-t border-border">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 mt-2 text-xs font-semibold rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 mt-2 text-xs font-semibold rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
          <div
            className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                {modal === "create" ? "New Community" : "Edit Community"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <section className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> General Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Community Name *">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Skyline Towers"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Community Type *">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className={`${inputCls} cursor-pointer`}
                    >
                      {COMMUNITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Subtype / Category">
                    <input
                      value={form.subtype}
                      onChange={(e) => setForm({ ...form, subtype: e.target.value })}
                      placeholder="e.g. Premium Residential"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Invite Code" hint="Optional code for users to join">
                    <input
                      value={form.inviteCode}
                      onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
                      placeholder="e.g. SKY-2024"
                      className={`${inputCls} uppercase`}
                    />
                  </Field>
                </div>
              </section>

              {/* Block & Flat Configuration preview and edit for APARTMENT communities */}
              {form.type === "APARTMENT" && (
                <section className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" /> Block & Flat Database Configuration
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        These block details will be saved to the database table <code className="text-indigo-600 font-mono">community_block_config</code>.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200">
                      Total: {totalCalculatedFlats} Flats
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {form.blockConfigs.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {b.blockName || "?"}
                          </span>
                          <div className="flex-1 sm:w-28">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Block Name</label>
                            <input
                              type="text"
                              value={b.blockName}
                              maxLength={4}
                              onChange={(e) => handleBlockChange(idx, "blockName", e.target.value.toUpperCase())}
                              className="w-full px-2.5 py-1 bg-input-background border border-border rounded-lg text-xs font-bold text-foreground uppercase"
                              placeholder="A"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 w-full sm:w-auto flex-1">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Total Floors</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={b.totalFloors}
                              onChange={(e) => handleBlockChange(idx, "totalFloors", Number(e.target.value))}
                              className="w-full px-2.5 py-1 bg-input-background border border-border rounded-lg text-xs font-semibold text-foreground"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Flats / Floor</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={b.flatsPerFloor}
                              onChange={(e) => handleBlockChange(idx, "flatsPerFloor", Number(e.target.value))}
                              className="w-full px-2.5 py-1 bg-input-background border border-border rounded-lg text-xs font-semibold text-foreground"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Capacity</span>
                            <span className="text-xs font-bold text-indigo-600">
                              {(Number(b.totalFloors) || 0) * (Number(b.flatsPerFloor) || 0)} flats
                            </span>
                          </div>
                          {form.blockConfigs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(idx)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete Block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddBlock}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Block
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewBlock("ALL");
                          setPreviewFloor("ALL");
                          setShowFlatsPreview(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Check Flats Layout
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Flats are indexed per floor (e.g. Fl 1: 101–111, Fl 10: 1001–1011).</span>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> Location Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="City *">
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Bangalore"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Karnataka"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Area / Locality">
                    <input
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      placeholder="e.g. Whitefield"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60 inline-flex items-center gap-2 min-w-[140px] justify-center cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (modal === "create" ? "Create Community" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flats Layout Check Preview Modal */}
      {showFlatsPreview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowFlatsPreview(false)}
        >
          <div
            className="bg-card w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Database Flats Layout Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Check all block & flat combinations that will be saved in PostgreSQL for {form.name || "this community"}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total: {totalCalculatedFlats} Flats
                </span>
                <button
                  onClick={() => setShowFlatsPreview(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toggles Bar */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-border space-y-3 shrink-0">
              {/* Block Toggle */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-500" /> Block:
                </span>
                <button
                  type="button"
                  onClick={() => { setPreviewBlock("ALL"); setPreviewFloor("ALL"); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    previewBlock === "ALL"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  All Blocks ({form.blockConfigs.length})
                </button>
                {form.blockConfigs.map((b) => {
                  const bCapacity = (Number(b.totalFloors) || 0) * (Number(b.flatsPerFloor) || 0);
                  const isSelected = previewBlock.toUpperCase() === b.blockName.toUpperCase();
                  return (
                    <button
                      key={b.blockName}
                      type="button"
                      onClick={() => { setPreviewBlock(b.blockName); setPreviewFloor("ALL"); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <span>Block {b.blockName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {bCapacity}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Floor Toggle */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
                  <Home className="w-3 h-3 text-indigo-500" /> Floor:
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewFloor("ALL")}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                    previewFloor === "ALL"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  All Floors
                </button>
                {Array.from({ length: maxFloorsInSelection }, (_, i) => i + 1).map((fl) => {
                  const isSelected = previewFloor === fl;
                  return (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setPreviewFloor(fl)}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      Floor {fl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flats Grid Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {previewBlocksList.map((b) => {
                const totalFloors = Number(b.totalFloors) || 0;
                const flatsPerFloor = Number(b.flatsPerFloor) || 0;
                const floorsToRender = previewFloor === "ALL"
                  ? Array.from({ length: totalFloors }, (_, i) => i + 1)
                  : (Number(previewFloor) <= totalFloors ? [Number(previewFloor)] : []);

                return (
                  <div key={b.blockName} className="space-y-4 bg-muted/20 border border-border p-4 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                          {b.blockName}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Block {b.blockName}</h4>
                          <p className="text-[11px] text-muted-foreground">
                            {totalFloors} Floors · {flatsPerFloor} Flats per Floor · Total: {totalFloors * flatsPerFloor} Flats
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200">
                        {floorsToRender.length} Floor{floorsToRender.length === 1 ? "" : "s"} Displayed
                      </span>
                    </div>

                    {floorsToRender.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-3 italic">
                        Floor {previewFloor} does not exist in Block {b.blockName} (max {totalFloors} floors).
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {floorsToRender.map((fl) => {
                          const flats = generateFlatsList(fl, flatsPerFloor);
                          return (
                            <div key={fl} className="bg-card border border-border/80 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                  Floor {fl}
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  {flats.length} flats ({flats[0]} – {flats[flats.length - 1]})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {flats.map((flatNo) => (
                                  <span
                                    key={flatNo}
                                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                  >
                                    {flatNo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-border bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                These flat numbers are calculated in real-time from your block configuration and validated on resident registration.
              </span>
              <button
                type="button"
                onClick={() => setShowFlatsPreview(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
              >
                Done / Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-indigo-500 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground ml-0.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/70 ml-0.5">{hint}</p>}
    </div>
  );
}
