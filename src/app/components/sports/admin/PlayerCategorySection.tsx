import { Plus, Loader2, Users, Edit2, Trash2, Clock } from "lucide-react";
import type { PlayerCategory, CommunityResponse } from "../../../../types/api";

interface PlayerCategorySectionProps {
  user: any;
  communities: CommunityResponse[];
  playerCategories: PlayerCategory[];
  showCategoryForm: boolean;
  setShowCategoryForm: (val: boolean) => void;
  editingCategoryId: number | null;
  categoryName: string;
  setCategoryName: (val: string) => void;
  categoryType: string;
  setCategoryType: (val: string) => void;
  categoryGender: string;
  setCategoryGender: (val: string) => void;
  categoryMinAge: string;
  setCategoryMinAge: (val: string) => void;
  categoryMaxAge: string;
  setCategoryMaxAge: (val: string) => void;
  categoryCommId: number | "";
  setCategoryCommId: (val: number | "") => void;
  categoryDescription: string;
  setCategoryDescription: (val: string) => void;
  categorySubmitting: boolean;
  resetCategoryForm: () => void;
  handleCategorySave: () => void;
  handleCategoryEdit: (c: PlayerCategory) => void;
  handleCategoryDelete: (id: number) => void;
  setActiveTab: (tab: any) => void;
}

export function PlayerCategorySection({
  user,
  communities,
  playerCategories,
  showCategoryForm,
  setShowCategoryForm,
  editingCategoryId,
  categoryName,
  setCategoryName,
  categoryType,
  setCategoryType,
  categoryGender,
  setCategoryGender,
  categoryMinAge,
  setCategoryMinAge,
  categoryMaxAge,
  setCategoryMaxAge,
  categoryCommId,
  setCategoryCommId,
  categoryDescription,
  setCategoryDescription,
  categorySubmitting,
  resetCategoryForm,
  handleCategorySave,
  handleCategoryEdit,
  handleCategoryDelete,
  setActiveTab,
}: PlayerCategorySectionProps) {
  return (
    <div className="space-y-4">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-800">Player Categories</h3>
          <p className="text-sm text-slate-500 mt-1">Manage player categories for events and tournaments</p>
        </div>
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "ADMIN", "SPORTS_ADMIN"].includes(user?.role || "") && (
            <button
              onClick={() => { resetCategoryForm(); setShowCategoryForm(!showCategoryForm); }}
              className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none shadow-sm"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
              }}
            >
              <Plus className="w-4 h-4" /> {showCategoryForm ? "Cancel" : "New Category"}
            </button>
          )}
          <button
            onClick={() => setActiveTab("sports-event")}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors bg-white cursor-pointer shadow-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Category Create/Edit Form */}
      {showCategoryForm && (
        <div 
          className="rounded-xl p-5 space-y-4 text-left"
          style={{
            background: "white",
            border: "1px solid rgba(99, 102, 241, 0.12)",
            boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
          }}
        >
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest border-b pb-2" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
            {editingCategoryId ? "Edit Category" : "Create New Category"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Category Name *</label>
              <input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Men's Open" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Category Type *</label>
              <div className="relative">
                <select value={categoryType} onChange={e => setCategoryType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors">
                  <option value="">Select...</option>
                  <option value="MENS">MENS</option>
                  <option value="WOMENS">WOMENS</option>
                  <option value="BOYS">BOYS</option>
                  <option value="GIRLS">GIRLS</option>
                  <option value="KIDS">KIDS</option>
                  <option value="SENIORS">SENIORS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <Clock className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Gender *</label>
              <div className="relative">
                <select value={categoryGender} onChange={e => setCategoryGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors">
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="ALL">All</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <Clock className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Min Age *</label>
              <input type="number" value={categoryMinAge} onChange={e => setCategoryMinAge(e.target.value)} placeholder="e.g. 18" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Max Age *</label>
              <input type="number" value={categoryMaxAge} onChange={e => setCategoryMaxAge(e.target.value)} placeholder="e.g. 45" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
            {user?.role === "SUPER_ADMIN" && (
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Community</label>
                <div className="relative">
                  <select value={categoryCommId} onChange={e => setCategoryCommId(e.target.value ? Number(e.target.value) : "")} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors">
                    <option value="">All Communities</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Clock className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}
            <div className="md:col-span-3">
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Description</label>
              <input value={categoryDescription} onChange={e => setCategoryDescription(e.target.value)} placeholder="Brief description of this category" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {editingCategoryId && (
              <button onClick={resetCategoryForm} className="flex-1 py-3 bg-transparent border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:border-red-500 hover:text-red-500 cursor-pointer transition-colors">Cancel</button>
            )}
            <button
              onClick={handleCategorySave}
              disabled={categorySubmitting}
              className="flex-[2] py-3 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
              }}
            >
              {categorySubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingCategoryId ? "Update Category" : "Create Category ↗")}
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div 
        className="rounded-xl p-5 text-left"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between border-b pb-2" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
          <span>All Categories</span>
          <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded text-[10px] font-bold">{playerCategories.length}</span>
        </div>
        <div className="space-y-3">
          {playerCategories.map(c => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500/20 transition-all">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" /> {c.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 ml-5 flex flex-wrap items-center gap-2">
                  {c.description && <span>{c.description}</span>}
                  {c.description && (c.minAge != null || c.gender) && <span>·</span>}
                  {c.minAge != null && c.maxAge != null && <span>Age: {c.minAge}–{c.maxAge}</span>}
                  {c.gender && <span>· {c.gender}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.categoryType && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded border bg-blue-50 text-blue-600 border-blue-200">{c.categoryType}</span>
                )}
                {c.type && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${c.type === "DEFAULT" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-indigo-50 text-indigo-600 border-indigo-200"}`}>{c.type}</span>
                )}
                {(user?.role === "SUPER_ADMIN" || (["ADMIN", "SPORTS_ADMIN"].includes(user?.role || "") && c.type !== "DEFAULT")) && (
                  <>
                    <button onClick={() => handleCategoryEdit(c)} className="text-[10px] px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer bg-white shadow-sm">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleCategoryDelete(c.id)} className="text-[10px] px-2.5 py-1.5 border border-slate-200 text-red-500 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer bg-white shadow-sm">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {playerCategories.length === 0 && (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm text-slate-400 italic">No player categories yet. Create your first category above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
