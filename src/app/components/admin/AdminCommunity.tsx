import { useEffect, useState, useCallback } from "react";
import {
  Building2, MapPin, Users, Globe, Loader2, ShieldCheck,
  Plus, Pencil, Trash2, X, Search, Inbox,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { communityService } from "../../../services/communityService";
import { confirmAction } from "../../../utils/AlertUtils";
import type { CommunityResponse } from "../../../types/api";

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

const emptyForm = {
  name: "",
  type: "APARTMENT",
  subtype: "",
  city: "",
  state: "",
  area: "",
  inviteCode: "",
};

type FormData = typeof emptyForm;

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
    setForm(emptyForm);
    setModal("create");
  };

  const openEdit = (c: CommunityResponse) => {
    setForm({
      name: c.name || "",
      type: c.type || "APARTMENT",
      subtype: c.subtype || "",
      city: c.city || "",
      state: c.state || "",
      area: c.area || "",
      inviteCode: c.inviteCode || "",
    });
    setModal(c);
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.type) {
      toast.error("Name, type and city are required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await communityService.createCommunity(form);
        toast.success(`Community "${form.name}" created`);
      } else if (modal) {
        await communityService.updateCommunity(modal.id, form);
        toast.success(`Community "${form.name}" updated`);
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
            Create, edit and manage communities on the platform.
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
          {filtered.map((c) => (
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
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                      {TYPE_LABEL[c.type] || c.type}
                    </span>
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
          ))}
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
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60 inline-flex items-center gap-2 min-w-[140px] justify-center"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (modal === "create" ? "Create Community" : "Save Changes")}
                </button>
              </div>
            </form>
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
