import React, { useState } from "react";
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  ShieldCheck,
  User,
  GraduationCap,
  Loader2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { academyApi } from "../../../services/academy/academyApi";
import type { AcademyInstructor } from "../../../types/academy";

interface BecomeInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (instructor: AcademyInstructor) => void;
}

export function BecomeInstructorModal({
  isOpen,
  onClose,
  onSuccess,
}: BecomeInstructorModalProps) {
  const [fullName, setFullName] = useState("Sandesh Patil");
  const [profession, setProfession] = useState("Principal Software Engineer");
  const [tower, setTower] = useState("Tower A");
  const [flatNumber, setFlatNumber] = useState("A-204");
  const [skills, setSkills] = useState("Java, Spring Boot, AWS, Docker, Microservices");
  const [experienceYears, setExperienceYears] = useState(10);
  const [bio, setBio] = useState(
    "Senior technologist passionate about hands-on community workshops in modern backend engineering, cloud architecture, and system design."
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const popularSkills = [
    "Java", "Python", "Spring Boot", "React", "AWS", "Yoga", "Zumba", "Chess",
    "Guitar", "Vocal Music", "Kids Coding", "Drawing & Sketching", "French", "Baking"
  ];

  const handleToggleSkill = (skill: string) => {
    const list = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.includes(skill)) {
      setSkills(list.filter((s) => s !== skill).join(", "));
    } else {
      setSkills([...list, skill].join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !skills.trim()) {
      toast.error("Please fill in your name and core skills");
      return;
    }

    setSubmitting(true);
    try {
      const created = await academyApi.applyAsInstructor({
        communityId: "comm-mana-1",
        residentUserId: "user-current",
        fullName: fullName.trim(),
        profession: profession.trim(),
        tower,
        flatNumber,
        skills: skills.trim(),
        experienceYears,
        bio: bio.trim(),
      });

      toast.success("🎉 Congratulations! Your Instructor Profile is active on Mana Academy.");
      onSuccess?.(created);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit instructor application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-primary to-violet-950 p-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Share Your Expertise
          </div>
          <h3 className="text-lg sm:text-xl font-black">Teach in Mana Academy</h3>
          <p className="text-xs text-white/80 mt-1">
            Empower your neighbors by conducting workshops, fitness classes, and skill sessions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-slate-900 dark:text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Profession / Title
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Yoga Trainer, Senior Architect"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tower &amp; Flat
              </label>
              <input
                type="text"
                value={`${tower} • ${flatNumber}`}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none opacity-80"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          {/* Skills Input & Quick Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Teaching Skills &amp; Topics * (Comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Java, Python, Drawing, Yoga, Chess"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              required
            />
            
            <div className="flex flex-wrap gap-1.5 pt-1">
              {popularSkills.map((s) => {
                const isSelected = skills.toLowerCase().includes(s.toLowerCase());
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleSkill(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    + {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Short Bio &amp; Teaching Philosophy
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell neighbors about your experience and what you plan to teach..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold outline-none resize-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>
              Verified community instructors can create workshops, manage class rosters, and issue completion certificates.
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Register as Instructor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
