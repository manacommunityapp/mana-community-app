import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AcademyCategory,
  LearningType,
  ProgramLevel,
  ProgramMode,
  PricingType,
  AcademyProgram,
} from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";

interface CreateProgramModalProps {
  isOpen: boolean;
  categories: AcademyCategory[];
  onClose: () => void;
  onSuccess?: (program: AcademyProgram) => void;
}

export function CreateProgramModal({
  isOpen,
  categories,
  onClose,
  onSuccess,
}: CreateProgramModalProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "cat-tech");
  const [learningType, setLearningType] = useState<LearningType>("WORKSHOP");
  const [level, setLevel] = useState<ProgramLevel>("ALL_LEVELS");
  const [mode, setMode] = useState<ProgramMode>("IN_PERSON");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Clubhouse Hall 1");
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("17:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [capacity, setCapacity] = useState(20);
  const [pricingType, setPricingType] = useState<PricingType>("FREE");
  const [price, setPrice] = useState(0);
  const [prerequisites, setPrerequisites] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tags, setTags] = useState("");
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Multi-session builder
  const [sessions, setSessions] = useState<
    { title: string; sessionDate: string; startTime: string; description: string }[]
  >([
    {
      title: "Session 1: Core Fundamentals",
      sessionDate: new Date().toISOString().split("T")[0],
      startTime: "17:00",
      description: "Introductory session and setup",
    },
  ]);

  if (!isOpen) return null;

  const handleAddSession = () => {
    setSessions([
      ...sessions,
      {
        title: `Session ${sessions.length + 1}: Practical Application`,
        sessionDate: startDate,
        startTime,
        description: "",
      },
    ]);
  };

  const handleRemoveSession = (idx: number) => {
    if (sessions.length <= 1) return;
    setSessions(sessions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a program title");
      return;
    }

    setSubmitting(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const created = await academyApi.createProgram({
        title: title.trim(),
        categoryId,
        categoryName: cat?.name || "General",
        instructorId: "instr-sandeep",
        instructorName: "Sandeep Patil",
        learningType,
        level,
        mode,
        summary,
        description,
        location: mode === "ONLINE" ? undefined : location,
        onlineMeetingUrl: mode !== "IN_PERSON" ? onlineMeetingUrl : undefined,
        startDate,
        startTime,
        durationMinutes,
        capacity,
        pricingType,
        price: pricingType === "FREE" ? 0 : price,
        prerequisites,
        targetAudience,
        tags,
        certificateEnabled,
        sessions: sessions.map((s, idx) => ({
          sessionOrder: idx + 1,
          title: s.title,
          sessionDate: s.sessionDate,
          startTime: s.startTime,
          description: s.description,
        })),
      });

      toast.success("🎉 Learning program published to Mana Academy!");
      onSuccess?.(created);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create program");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Publish Learning Program
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Host a workshop or multi-session course for your neighbors
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-900 dark:text-white">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Program Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Java & Spring Boot Microservices Workshop"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Category & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Learning Type
              </label>
              <select
                value={learningType}
                onChange={(e) => setLearningType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              >
                <option value="WORKSHOP">Workshop (1–2 sessions)</option>
                <option value="COURSE">Multi-Week Course</option>
                <option value="KIDS_CLASS">Kids & Teens Class</option>
                <option value="FITNESS_SESSION">Fitness & Wellness</option>
                <option value="WEBINAR">Online Webinar</option>
                <option value="SKILL_SESSION">Skill Sharing Demo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Target Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              >
                <option value="ALL_LEVELS">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Mode & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Delivery Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              >
                <option value="IN_PERSON">In-Person (Clubhouse / Venue)</option>
                <option value="ONLINE">Online (Zoom / Meet)</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {mode === "ONLINE" ? "Meeting URL" : "Location / Venue"}
              </label>
              <input
                type="text"
                value={mode === "ONLINE" ? onlineMeetingUrl : location}
                onChange={(e) =>
                  mode === "ONLINE"
                    ? setOnlineMeetingUrl(e.target.value)
                    : setLocation(e.target.value)
                }
                placeholder={mode === "ONLINE" ? "https://zoom.us/j/..." : "e.g. Clubhouse Hall 1"}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          {/* Capacity, Dates & Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Capacity (Seats)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 20)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setPrice(p);
                  setPricingType(p > 0 ? "PAID" : "FREE");
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          {/* Summary & Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Short Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief 1-liner summary of what learners will achieve..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
          </div>

          {/* Multi-Session Builder */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400">
                  Course Sessions Timeline
                </h4>
                <p className="text-[11px] text-slate-500">
                  Define schedule and topics for each session
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSession}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Session
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map((sess, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={sess.title}
                    onChange={(e) => {
                      const updated = [...sessions];
                      updated[idx].title = e.target.value;
                      setSessions(updated);
                    }}
                    placeholder={`Session ${idx + 1} Title`}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none"
                  />
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Publish Learning Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
