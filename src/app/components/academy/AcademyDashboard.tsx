import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  Share2,
  TrendingUp,
} from "lucide-react";
import type { AcademyCategory, AcademyProgram, AcademyInstructor, LearningType } from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";
import { ProgramDetailsModal } from "./ProgramDetailsModal";
import { CreateProgramModal } from "./CreateProgramModal";
import { BecomeInstructorModal } from "./BecomeInstructorModal";

export function AcademyDashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [programs, setPrograms] = useState<AcademyProgram[]>([]);
  const [instructors, setInstructors] = useState<AcademyInstructor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LearningType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeProgramForDetails, setActiveProgramForDetails] = useState<AcademyProgram | null>(null);
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [becomeInstructorOpen, setBecomeInstructorOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, progs, instrs] = await Promise.all([
        academyApi.getCategories(),
        academyApi.getPrograms(),
        academyApi.getInstructors(),
      ]);
      setCategories(cats);
      setPrograms(progs);
      setInstructors(instrs);
    } catch (err) {
      console.error("Failed to load academy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    const results = await academyApi.searchPrograms(searchQuery);
    setPrograms(results);
  };

  const filteredPrograms = programs.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (selectedType && p.learningType !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER & SEARCH ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-primary to-violet-950 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black tracking-wide uppercase border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Learn • Teach • Grow
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Learn From Your Community. Teach What You Love.
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-2 font-medium leading-relaxed">
            Hands-on coding bootcamps, sunrise yoga, chess coaching, kids robotics, and career masterclasses conducted right inside your community.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg border border-white/30 text-slate-900 dark:text-white"
          >
            <div className="pl-3 pr-2 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, skills, or workshops (e.g. Java, Yoga, Chess, Python...)"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setBecomeInstructorOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            ✨ Teach in Mana Academy
          </button>
          <button
            onClick={() => setCreateProgramOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
          >
            <PlusCircle className="w-4 h-4" />
            Host a Workshop
          </button>
        </div>
      </div>

      {/* ── CATEGORY EXPLORER TILES ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Explore Learning Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick a domain to discover sessions conducted by verified residents
            </p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center group cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary shadow-xs font-black"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── UPCOMING PROGRAMS & WORKSHOPS GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Featured Community Programs ({filteredPrograms.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live registrations open for upcoming workshops &amp; courses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((prog) => {
            const capacityPct = Math.min(
              100,
              Math.round((prog.enrolledCount / prog.capacity) * 100)
            );

            return (
              <div
                key={prog.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={prog.coverImageUrl}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase text-white">
                      {prog.learningType.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-[10px] font-black uppercase text-white">
                      {prog.level}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-300" />
                      {prog.startDate} • {prog.startTime}
                    </span>
                    <span className="bg-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                      {prog.pricingType === "FREE" ? "Free" : `₹${prog.price}`}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {prog.summary}
                    </p>
                  </div>

                  {/* Instructor & Location */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        👤 {prog.instructorName}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {prog.averageRating}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {prog.location || "Clubhouse"}
                      </span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {prog.enrolledCount}/{prog.capacity} seats
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          capacityPct >= 90 ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => setActiveProgramForDetails(prog)}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-primary-foreground font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Syllabus &amp; Enroll</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TEACH IN MANA ACADEMY BANNER ── */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase mb-1.5">
            Community Knowledge Network
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Have a skill or passion? Teach your neighbors in Mana Academy
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Whether it is coding, yoga, classical music, art, or cricket coaching — become an approved instructor and host sessions in the community clubhouse or online.
          </p>
        </div>
        <button
          onClick={() => setBecomeInstructorOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-black text-xs shadow-md hover:bg-amber-700 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 justify-center"
        >
          <Award className="w-4 h-4" />
          Become an Instructor
        </button>
      </div>

      {/* Modals */}
      {activeProgramForDetails && (
        <ProgramDetailsModal
          program={activeProgramForDetails}
          onClose={() => setActiveProgramForDetails(null)}
          onEnrollSuccess={() => {
            loadData();
            navigate("/academy/my-learning");
          }}
        />
      )}

      {createProgramOpen && (
        <CreateProgramModal
          isOpen={createProgramOpen}
          categories={categories}
          onClose={() => setCreateProgramOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {becomeInstructorOpen && (
        <BecomeInstructorModal
          isOpen={becomeInstructorOpen}
          onClose={() => setBecomeInstructorOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
