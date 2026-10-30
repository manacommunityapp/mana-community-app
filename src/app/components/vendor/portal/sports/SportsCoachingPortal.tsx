import { useState, useEffect } from "react";
import {
  Users,
  Dumbbell,
  Plus,
  Star,
  Award,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { sportsCoachingService } from "../../../../../services/sports/sportsCoachingService";
import type {
  SportsCoach,
  AcademyBatch,
  AgeGroup,
  SkillLevel,
} from "../../../../../types/sportsCoaching";
import type { SportType } from "../../../../../types/sportsVendor";

const AVAILABLE_SPORTS: SportType[] = [
  "BADMINTON",
  "TENNIS",
  "CRICKET",
  "FOOTBALL",
  "BASKETBALL",
  "SWIMMING",
  "SQUASH",
  "TABLE_TENNIS",
  "PICKLEBALL",
  "VOLLEYBALL",
];

const AGE_GROUPS: { key: AgeGroup; label: string }[] = [
  { key: "UNDER_10", label: "Under 10 (Kids)" },
  { key: "UNDER_14", label: "Under 14 (Juniors)" },
  { key: "UNDER_18", label: "Under 18 (Teens)" },
  { key: "ADULTS", label: "Adults (18+)" },
  { key: "ALL_AGES", label: "All Ages Open" },
];

const SKILL_LEVELS: { key: SkillLevel; label: string }[] = [
  { key: "BEGINNER", label: "Beginner / Grassroots" },
  { key: "INTERMEDIATE", label: "Intermediate / Academy" },
  { key: "ADVANCED", label: "Advanced / Competitive Squad" },
  { key: "ALL_LEVELS", label: "All Skill Levels" },
];

export function SportsCoachingPortal() {
  const [activeTab, setActiveTab] = useState<"BATCHES" | "COACHES">("BATCHES");
  const [coaches, setCoaches] = useState<SportsCoach[]>([]);
  const [batches, setBatches] = useState<AcademyBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Coach Form
  const [coachForm, setCoachForm] = useState<{
    fullName: string;
    phone: string;
    email: string;
    sport: SportType;
    experienceYears: number;
    hourlyRate: number;
    bio: string;
    certificationTitle: string;
    certificationBody: string;
  }>({
    fullName: "",
    phone: "",
    email: "",
    sport: "BADMINTON",
    experienceYears: 6,
    hourlyRate: 800,
    bio: "",
    certificationTitle: "BWF Level 1 Coach",
    certificationBody: "Badminton World Federation",
  });

  // Batch Form
  const [batchForm, setBatchForm] = useState<{
    coachId: string;
    title: string;
    sport: SportType;
    ageGroup: AgeGroup;
    skillLevel: SkillLevel;
    maxCapacity: number;
    daysOfWeek: string;
    startTime: string;
    endTime: string;
    monthlyFee: number;
    quarterlyFee: number;
    courtName: string;
    description: string;
  }>({
    coachId: "",
    title: "",
    sport: "BADMINTON",
    ageGroup: "UNDER_14",
    skillLevel: "INTERMEDIATE",
    maxCapacity: 12,
    daysOfWeek: "MON, WED, FRI",
    startTime: "16:30",
    endTime: "17:30",
    monthlyFee: 3000,
    quarterlyFee: 8000,
    courtName: "Court 1",
    description: "Systematic footwork, racquet speed, and match endurance coaching.",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cData, bData] = await Promise.all([
        sportsCoachingService.getCoaches(),
        sportsCoachingService.getBatches(),
      ]);
      setCoaches(cData);
      setBatches(bData);
      if (cData.length > 0 && !batchForm.coachId) {
        setBatchForm((prev) => ({ ...prev, coachId: cData[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load coaching data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCoach(e: React.FormEvent) {
    e.preventDefault();
    if (!coachForm.fullName || !coachForm.phone) {
      toast.error("Please enter coach name and phone");
      return;
    }

    try {
      const saved = await sportsCoachingService.saveCoach({
        fullName: coachForm.fullName,
        phone: coachForm.phone,
        email: coachForm.email,
        sport: coachForm.sport,
        experienceYears: Number(coachForm.experienceYears),
        hourlyRate: Number(coachForm.hourlyRate),
        bio: coachForm.bio,
        certifications: [
          {
            title: coachForm.certificationTitle,
            issuingBody: coachForm.certificationBody,
            year: new Date().getFullYear() - 2,
          },
        ],
      });
      setCoaches((prev) => [...prev, saved]);
      setShowCoachModal(false);
      toast.success("Coach profile onboarded successfully!");
    } catch (err) {
      toast.error("Failed to onboard coach");
    }
  }

  async function handleSaveBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!batchForm.title) {
      toast.error("Please enter batch title");
      return;
    }

    try {
      const days = batchForm.daysOfWeek.split(",").map((s) => s.trim().toUpperCase());
      const saved = await sportsCoachingService.saveBatch({
        coachId: batchForm.coachId,
        title: batchForm.title,
        sport: batchForm.sport,
        ageGroup: batchForm.ageGroup,
        skillLevel: batchForm.skillLevel,
        maxCapacity: Number(batchForm.maxCapacity),
        daysOfWeek: days,
        startTime: batchForm.startTime,
        endTime: batchForm.endTime,
        monthlyFee: Number(batchForm.monthlyFee),
        quarterlyFee: Number(batchForm.quarterlyFee),
        courtName: batchForm.courtName,
        description: batchForm.description,
      });
      setBatches((prev) => [...prev, saved]);
      setShowBatchModal(false);
      toast.success("Academy training batch created!");
    } catch (err) {
      toast.error("Failed to create academy batch");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Coaches & Academy Batches</h1>
          <p className="text-xs text-slate-500">
            Manage certified sports trainers, student batches, age groups, schedules, and academy tuition fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "BATCHES" ? (
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Academy Batch
            </button>
          ) : (
            <button
              onClick={() => setShowCoachModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Certified Coach
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("BATCHES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "BATCHES"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Academy Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab("COACHES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "COACHES"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Certified Trainers ({coaches.length})
        </button>
      </div>

      {/* Tab 1: Academy Batches */}
      {activeTab === "BATCHES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => {
            const fillPercent = Math.round((batch.enrolledCount / batch.maxCapacity) * 100);

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {batch.sport}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{batch.title}</h3>

                  <p className="text-xs text-slate-500 line-clamp-2">{batch.description}</p>

                  <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Coach: <strong>{batch.coachName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{batch.daysOfWeek.join(" • ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{batch.startTime} - {batch.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{batch.courtName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {/* Capacity Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Roster Capacity</span>
                      <span className="font-bold text-slate-800">
                        {batch.enrolledCount} / {batch.maxCapacity} Students ({fillPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPercent >= 90 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Fee & Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Monthly Tuition</span>
                      <span className="text-sm font-black text-slate-900">₹{batch.monthlyFee}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {batch.ageGroup.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Coaches */}
      {activeTab === "COACHES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4"
            >
              <div className="flex items-start gap-3">
                <img
                  src={coach.profilePicUrl}
                  alt={coach.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{coach.fullName}</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-semibold">{coach.sport} Specialist</p>
                  <p className="text-[11px] text-slate-400">{coach.experienceYears} Years Coaching Exp</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{coach.bio}</p>

              {/* Certifications */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Accreditations
                </span>
                {coach.certifications.map((cert) => (
                  <div key={cert.title} className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{cert.title}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">1-on-1 Rate</span>
                  <span className="font-black text-slate-900 text-sm">₹{coach.hourlyRate} / hr</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{coach.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({coach.reviewCount})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Coach Modal */}
      {showCoachModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Onboard Sports Coach</h3>
              <button onClick={() => setShowCoachModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCoach} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coach Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Prakash Padukone"
                  value={coachForm.fullName}
                  onChange={(e) => setCoachForm({ ...coachForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport Specialization</label>
                  <select
                    value={coachForm.sport}
                    onChange={(e) => setCoachForm({ ...coachForm, sport: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {AVAILABLE_SPORTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={coachForm.experienceYears}
                    onChange={(e) => setCoachForm({ ...coachForm, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98860 00000"
                    value={coachForm.phone}
                    onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">1-on-1 Rate / Hr (₹)</label>
                  <input
                    type="number"
                    min="200"
                    step="50"
                    value={coachForm.hourlyRate}
                    onChange={(e) => setCoachForm({ ...coachForm, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Certification / Accreditation</label>
                <input
                  type="text"
                  placeholder="e.g., BWF Level 2 High Performance Coach"
                  value={coachForm.certificationTitle}
                  onChange={(e) => setCoachForm({ ...coachForm, certificationTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coach Bio & Coaching Philosophy</label>
                <textarea
                  rows={2}
                  placeholder="Former national athlete, youth development specialist..."
                  value={coachForm.bio}
                  onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoachModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Onboard Coach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Academy Batch</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Batch Title</label>
                <input
                  type="text"
                  placeholder="e.g. Junior Badminton Foundations (U-12)"
                  value={batchForm.title}
                  onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={batchForm.sport}
                    onChange={(e) => setBatchForm({ ...batchForm, sport: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {AVAILABLE_SPORTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Coach</label>
                  <select
                    value={batchForm.coachId}
                    onChange={(e) => setBatchForm({ ...batchForm, coachId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.sport})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age Group</label>
                  <select
                    value={batchForm.ageGroup}
                    onChange={(e) => setBatchForm({ ...batchForm, ageGroup: e.target.value as AgeGroup })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {AGE_GROUPS.map((a) => (
                      <option key={a.key} value={a.key}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skill Level</label>
                  <select
                    value={batchForm.skillLevel}
                    onChange={(e) => setBatchForm({ ...batchForm, skillLevel: e.target.value as SkillLevel })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {SKILL_LEVELS.map((sl) => (
                      <option key={sl.key} value={sl.key}>{sl.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Days (comma-sep)</label>
                  <input
                    type="text"
                    value={batchForm.daysOfWeek}
                    onChange={(e) => setBatchForm({ ...batchForm, daysOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={batchForm.startTime}
                    onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={batchForm.endTime}
                    onChange={(e) => setBatchForm({ ...batchForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={batchForm.monthlyFee}
                    onChange={(e) => setBatchForm({ ...batchForm, monthlyFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Capacity (Students)</label>
                  <input
                    type="number"
                    min="4"
                    max="30"
                    value={batchForm.maxCapacity}
                    onChange={(e) => setBatchForm({ ...batchForm, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
