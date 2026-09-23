import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, ArrowLeft, Plus, X, Search, HelpCircle, Upload, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { confirmAction } from "../../../utils/AlertUtils";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportMeta, MatchFormat } from "../../../types/api";
import { cn } from "../ui/utils";

const PREDEFINED_EMOJIS = ["🏏", "⚽", "🏸", "🏀", "🏐", "🎱", "🎳", "🎯", "♟️", "🚴", "🏃", "🏊", "🏓", "🎾", "🤾", "🪢", "🏆", "🎮", "🏹", "🥊"];

export interface AdminSportsMetaProps {
  isTab?: boolean;
}

export function AdminSportsMeta({ isTab = false }: AdminSportsMetaProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [sports, setSports] = useState<SportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<MatchFormat[]>(["SINGLES"]);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      if (!isTab) {
        toast.error("Administrative privileges required");
        navigate("/");
      }
      return;
    }
    fetchSports();
  }, [isAdmin, isTab]);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const data = await sportsService.getSportsMeta();
      setSports(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sports metadata list");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sport: SportMeta) => {
    setEditingId(sport.id);
    setName(sport.name);
    setIcon(sport.icon || "🏆");
    setIconUrl(sport.iconUrl || null);
    setSelectedFormats(sport.formats || ["SINGLES"]);
    setActive(sport.active !== false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmAction("Deactivate Sport", "Are you sure you want to deactivate this sport meta?"))) return;
    try {
      await sportsService.deleteSport(id);
      toast.success("Sport deactivated successfully");
      fetchSports();
    } catch (err) {
      toast.error("Failed to delete/deactivate sport");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setIcon("🏆");
    setIconUrl(null);
    setSelectedFormats(["SINGLES"]);
    setActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Sport name is required");
      return;
    }

    if (selectedFormats.length === 0) {
      toast.error("Please select at least one format");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      icon: icon || "🏆",
      iconUrl: iconUrl || undefined,
      formats: selectedFormats,
      active
    };

    try {
      if (editingId) {
        await sportsService.updateSport(editingId, payload);
        toast.success("Sport updated successfully!");
      } else {
        await sportsService.createSport(payload);
        toast.success("Sport created successfully!");
      }
      resetForm();
      fetchSports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save sport metadata");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("Icon file size must be less than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconUrl(reader.result as string);
        toast.success("Custom icon uploaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read icon file");
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredSports = sports.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.formats && s.formats.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      <Toaster position="top-center" richColors />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 text-left">
          {!isTab && (
            <button
              onClick={() => navigate("/admin")}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
              Sports Meta Management
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
              Configure and manage active sports metadata and baseline rules in the system
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="px-3.5 py-2 text-white text-xs sm:text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs hover:brightness-105 shrink-0 self-start sm:self-auto"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
          }}
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> New Sport Meta
            </>
          )}
        </button>
      </div>

      {/* Inline Creation / Edition Form */}
      {showForm && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-indigo-700 uppercase tracking-wider">
                {editingId ? "Edit Sport Metadata" : "Create New Sport Meta"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Set name, default supported match formats, and icon
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Sport Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Sport Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Pickleball, Box Cricket"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>

              {/* Format selection */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Default Formats * <span className="text-[11px] text-slate-400 lowercase font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {(["SINGLES", "DOUBLES", "MIXED_DOUBLES", "TEAM"] as MatchFormat[]).map(fmt => {
                    const isSel = selectedFormats.includes(fmt);
                    const label = fmt === "SINGLES" ? "Singles" 
                                : fmt === "DOUBLES" ? "Doubles" 
                                : fmt === "MIXED_DOUBLES" ? "Mixed Doubles" 
                                : "Team Sport";
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          setSelectedFormats(prev => {
                            if (prev.includes(fmt)) {
                              if (prev.length === 1) {
                                toast.warning("Please select at least one format");
                                return prev;
                              }
                              return prev.filter(f => f !== fmt);
                            } else {
                              return [...prev, fmt];
                            }
                          });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                          isSel
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs ring-1 ring-indigo-200"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        )}
                      >
                        {isSel && <Check className="w-3 h-3 text-indigo-600" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Icon selection & Status Row */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                    Sport Icon Preview
                  </label>
                  {iconUrl ? (
                    <div className="w-9 h-9 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-center overflow-hidden shadow-xs">
                      <img src={iconUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                    </div>
                  ) : (
                    <span className="text-xl px-2.5 py-0.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                      {icon}
                    </span>
                  )}
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-10 h-5.5 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-slate-300"} relative`}>
                      <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-xs ${active ? "translate-x-4.5" : ""}`} />
                    </div>
                  </label>
                  <span className={cn("text-xs font-bold", active ? "text-emerald-600" : "text-slate-400")}>
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Standard Emojis */}
                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Standard Emojis
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                    {PREDEFINED_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setIcon(emoji);
                          setIconUrl(null);
                        }}
                        className={cn(
                          "text-lg p-1.5 rounded-lg border transition-all hover:scale-105 cursor-pointer",
                          !iconUrl && icon === emoji 
                            ? "bg-indigo-50 border-indigo-400 shadow-xs" 
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                    {/* Custom Text Emoji input */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Custom</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="🏆"
                        value={!iconUrl ? icon : ""}
                        onChange={e => {
                          setIcon(e.target.value || "🏆");
                          setIconUrl(null);
                        }}
                        className="w-7 text-center text-xs font-semibold border-none outline-none text-slate-800 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom File Upload */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Custom Image Upload
                  </span>
                  <div className="relative group min-h-[80px] bg-slate-50 hover:bg-indigo-50/30 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 mb-1 transition-colors" />
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-700 block transition-colors">
                      {iconUrl ? "Replace Icon File" : "Upload Custom Icon"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">PNG/JPG &lt; 500KB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 bg-white cursor-pointer text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingId ? "Update Metadata" : "Save Sport Meta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Listing Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            System Sports <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-xs font-bold">{filteredSports.length}</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sports meta..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs sm:text-[13px] text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500">Fetching sports meta configuration...</p>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <p className="text-xs sm:text-[13px] text-slate-600 font-medium">No sports metadata configurations found.</p>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Configure your first baseline sport by clicking "New Sport Meta" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSports.map(s => {
              const isEditable = s.communityId != null || user?.role === "SUPER_ADMIN";
              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    s.active 
                      ? "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs" 
                      : "bg-slate-50/60 border-slate-200/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {s.iconUrl ? (
                      <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                        <img src={s.iconUrl} alt={s.name} className="w-9 h-9 rounded-lg object-cover" />
                      </div>
                    ) : (
                      <span className="text-2xl leading-none px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs shrink-0">
                        {s.icon || "🏆"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">{s.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] sm:text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                          {s.formats?.join(", ") || "SINGLES"}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                          s.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {s.active ? "Active" : "Inactive"}
                        </span>
                        {s.communityId ? (
                          <span className="text-[10px] sm:text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[110px]" title={`ID: ${s.communityId}`}>
                            {s.community?.name || `Community #${s.communityId}`}
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            System Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isEditable ? (
                      <>
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-md cursor-not-allowed flex items-center gap-1" title="System default sport (read-only)">
                        <span className="text-[9px] font-bold uppercase tracking-wider">Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
