import { useState, useEffect } from "react";
import {
  FilePlus,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
import type { HomeServiceRequirement, RequirementResponse, ServiceCategory, DayOfWeek } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

const ALL_DAYS: { id: DayOfWeek; label: string }[] = [
  { id: "MONDAY", label: "Mon" },
  { id: "TUESDAY", label: "Tue" },
  { id: "WEDNESDAY", label: "Wed" },
  { id: "THURSDAY", label: "Thu" },
  { id: "FRIDAY", label: "Fri" },
  { id: "SATURDAY", label: "Sat" },
];

export function HomeServiceRequirements() {
  const [requirements, setRequirements] = useState<HomeServiceRequirement[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedReqResponses, setSelectedReqResponses] = useState<{
    req: HomeServiceRequirement;
    responses: RequirementResponse[];
  } | null>(null);

  const [showPostModal, setShowPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Post requirement form state
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<"MONTHLY" | "DAILY" | "WEEKLY" | "ONE_TIME">("MONTHLY");
  const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ]);
  const [startDate, setStartDate] = useState("2026-10-01");
  const [preferredStartTime, setPreferredStartTime] = useState("08:00");
  const [preferredEndTime, setPreferredEndTime] = useState("10:00");
  const [budgetMin, setBudgetMin] = useState(3000);
  const [budgetMax, setBudgetMax] = useState(4000);
  const [tower, setTower] = useState("B");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reqs, cats] = await Promise.all([
      homeServiceApi.getRequirements(),
      homeServiceApi.getCategories(),
    ]);
    setRequirements(reqs);
    setCategories(cats);
    if (cats.length > 0) setCategoryId(cats[0].id);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await homeServiceApi.createRequirement({
      categoryId,
      frequency,
      preferredDays,
      startDate,
      preferredStartTime,
      preferredEndTime,
      budgetMin,
      budgetMax,
      tower,
      description,
    });
    setShowPostModal(false);
    setDescription("");
    setSubmitting(false);
    loadData();
  };

  const viewResponses = async (req: HomeServiceRequirement) => {
    const responses = await homeServiceApi.getResponsesForRequirement(req.id);
    setSelectedReqResponses({ req, responses });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Community Home Help Requirements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Post your custom home service needs and receive competitive quotes from verified community workers
          </p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Post New Requirement
        </button>
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map((req) => (
          <div
            key={req.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary">
                    {req.categoryName}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-1.5">
                    Needs {req.categoryName} ({req.frequency})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tower {req.tower} • Posted by {req.creatorName}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Budget</span>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    ₹{req.budgetMin} - ₹{req.budgetMax}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {req.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium space-y-1">
                <div>Start Date: <span className="font-bold text-slate-700 dark:text-slate-300">{req.startDate}</span></div>
                <div>Slot: <span className="font-bold text-slate-700 dark:text-slate-300">{req.preferredStartTime} - {req.preferredEndTime}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {req.responsesCount || 0} Worker Bids Received
              </span>
              <button
                onClick={() => viewResponses(req)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                View Quotes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-lg w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Post Home Help Requirement
              </h3>
              <button onClick={() => setShowPostModal(false)} className="p-1 rounded-full text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Service Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    <option value="MONTHLY">Monthly Contract</option>
                    <option value="DAILY">Daily Helper</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="ONE_TIME">One-Time Visit</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Tower</label>
                  <select
                    value={tower}
                    onChange={(e) => setTower(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    <option value="A">Tower A</option>
                    <option value="B">Tower B</option>
                    <option value="C">Tower C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Budget Min (₹)</label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Budget Max (₹)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Description &amp; Needs</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your flat size (e.g. 3BHK), timing preferences, tasks needed..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  {submitting ? "Posting..." : "Post Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Responses Modal */}
      {selectedReqResponses && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-lg w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Worker Quotes for {selectedReqResponses.req.categoryName}
                </h3>
                <p className="text-xs text-slate-500">
                  Compare bids and select your preferred worker
                </p>
              </div>
              <button
                onClick={() => setSelectedReqResponses(null)}
                className="p-1 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-80 overflow-y-auto text-xs">
              {selectedReqResponses.responses.length > 0 ? (
                selectedReqResponses.responses.map((resp) => (
                  <div
                    key={resp.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {resp.workerName}
                        </h4>
                        <span className="text-[11px] font-semibold text-amber-600">
                          ⭐ {resp.workerRating.toFixed(1)} ({resp.workerReviewCount} reviews) • {resp.workerExperienceYears} Yrs Exp
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-primary">
                          ₹{resp.proposedPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{resp.message}"
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          alert(`Accepted ${resp.workerName}'s quote! Booking created.`);
                          setSelectedReqResponses(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
                      >
                        Accept Quote &amp; Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-400 font-bold">
                  No responses received yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
