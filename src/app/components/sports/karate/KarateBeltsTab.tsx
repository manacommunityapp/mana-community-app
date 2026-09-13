import { useState } from "react";
import { Plus, Pencil, CheckCircle, XCircle } from "lucide-react";
import type { KarateBelt, KarateBeltRequest } from "../../../../services/sports/karateService";

interface Props {
  belts: KarateBelt[];
  onSave: (data: KarateBeltRequest, id?: number) => Promise<void>;
}

const EMPTY: KarateBeltRequest = {
  name: "", colorHex: "#FFFFFF", rank: 1, minClassesRequired: 0,
  minMonthsRequired: 0, description: "", active: true,
};

export function KarateBeltsTab({ belts, onSave }: Props) {
  const [editing, setEditing] = useState<KarateBelt | null>(null);
  const [form, setForm] = useState<KarateBeltRequest>({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }

  function openEdit(belt: KarateBelt) {
    setEditing(belt);
    setForm({
      name: belt.name, colorHex: belt.colorHex, rank: belt.rank,
      minClassesRequired: belt.minClassesRequired, minMonthsRequired: belt.minMonthsRequired,
      description: belt.description ?? "", active: belt.active, sportId,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form, editing?.id);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Belt Levels ({belts.length})</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Belt
        </button>
      </div>

      {/* Belt table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Belt</th>
              <th className="px-4 py-3 text-right">Min Classes</th>
              <th className="px-4 py-3 text-right">Min Months</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {belts.sort((a, b) => a.rank - b.rank).map(belt => (
              <tr key={belt.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-slate-600">#{belt.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0"
                      style={{ background: belt.colorHex }}
                    />
                    <span className="font-medium text-slate-800">{belt.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{belt.minClassesRequired}</td>
                <td className="px-4 py-3 text-right text-slate-600">{belt.minMonthsRequired}</td>
                <td className="px-4 py-3 text-center">
                  {belt.active
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                    : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(belt)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {belts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No belts configured yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-indigo-800">{editing ? "Edit Belt" : "New Belt"}</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Yellow Belt"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded cursor-pointer border border-slate-200" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} />
                <input className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rank</label>
              <input type="number" min={1} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min Classes</label>
              <input type="number" min={0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.minClassesRequired} onChange={e => setForm(f => ({ ...f, minClassesRequired: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min Months</label>
              <input type="number" min={0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.minMonthsRequired} onChange={e => setForm(f => ({ ...f, minMonthsRequired: +e.target.value }))} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              {saving ? "Saving…" : "Save Belt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
