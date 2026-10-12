import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Bell,
  Trophy,
  GraduationCap,
  Lock,
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Video,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  EyeOff,
  Flame,
  Droplets,
  Moon,
  Activity,
  Weight,
  Sparkles,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import type {
  PreventiveReminderDto,
  FitnessChallengeDto,
  WellnessWebinarDto,
  ClinicallySupervisedProgramDto,
  VoluntaryHealthGoalDto,
  FamilyMemberDto
} from "../../../types/health";
import { healthService } from "../../../services/healthService";
import { AddReminderModal } from "./AddReminderModal";
import { ClinicalProgramEnrollModal } from "./ClinicalProgramEnrollModal";

interface PreventiveWellnessHubProps {
  familyMembers: FamilyMemberDto[];
}

export const PreventiveWellnessHub: React.FC<PreventiveWellnessHubProps> = ({ familyMembers }) => {
  const [subTab, setSubTab] = useState<
    "reminders" | "challenges" | "webinars" | "clinical_programs" | "goals"
  >("reminders");

  const [reminders, setReminders] = useState<PreventiveReminderDto[]>([]);
  const [challenges, setChallenges] = useState<FitnessChallengeDto[]>([]);
  const [webinars, setWebinars] = useState<WellnessWebinarDto[]>([]);
  const [clinicalPrograms, setClinicalPrograms] = useState<ClinicallySupervisedProgramDto[]>([]);
  const [goals, setGoals] = useState<VoluntaryHealthGoalDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [selectedClinicalProgram, setSelectedClinicalProgram] = useState<ClinicallySupervisedProgramDto | null>(null);

  // Quick edit goal prompt modal state
  const [editingGoal, setEditingGoal] = useState<VoluntaryHealthGoalDto | null>(null);
  const [newGoalVal, setNewGoalVal] = useState<number | "">("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [r, ch, wb, cp, gl] = await Promise.all([
        healthService.getPreventiveReminders(),
        healthService.getFitnessChallenges(),
        healthService.getWellnessWebinars(),
        healthService.getClinicalPrograms(),
        healthService.getVoluntaryGoals()
      ]);
      setReminders(r);
      setChallenges(ch);
      setWebinars(wb);
      setClinicalPrograms(cp);
      setGoals(gl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleReminder = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    await healthService.toggleReminderStatus(id, nextStatus as any);
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, status: nextStatus as any } : r))
    );
  };

  const handleDeleteReminder = async (id: string) => {
    await healthService.deletePreventiveReminder(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAddReminder = async (newRem: Omit<PreventiveReminderDto, "id">) => {
    const created = await healthService.addPreventiveReminder(newRem);
    setReminders(prev => [created, ...prev]);
  };

  const handleToggleChallenge = async (chId: string) => {
    const updated = await healthService.toggleChallengeEnrollment(chId);
    setChallenges(prev => prev.map(c => (c.id === chId ? updated : c)));
  };

  const handleToggleWebinar = async (wbId: string) => {
    const updated = await healthService.toggleWebinarRegistration(wbId);
    setWebinars(prev => prev.map(w => (w.id === wbId ? updated : w)));
  };

  const handleConfirmClinicalEnrollment = async (progId: string) => {
    const updated = await healthService.enrollClinicalProgram(progId);
    setClinicalPrograms(prev => prev.map(p => (p.id === progId ? updated : p)));
  };

  const handleSaveGoal = async () => {
    if (!editingGoal || newGoalVal === "") return;
    const updated = await healthService.updateVoluntaryGoalValue(editingGoal.id, Number(newGoalVal));
    setGoals(prev => prev.map(g => (g.id === updated.id ? updated : g)));
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading Preventive Health & Wellness Hub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner with Strict Privacy Assurance */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                Preventive Health & Wellness
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-emerald-300" />
                Strictly Confidential by Default
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Stay Proactive, Live Healthier
            </h2>

            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl font-medium leading-relaxed">
              Family vaccination schedules, fitness step challenges, Mana Academy wellness webinars, and certified doctor-led diabetes & weight-management programs.
            </p>

            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 max-w-xl text-xs text-teal-100 flex items-start gap-2.5 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Leakage Privacy Guarantee:</strong> Sensitive clinical programs, individual conditions, and health metrics are <em>never</em> shared in resident group chats or community feeds.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowAddReminderModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              + Add Reminder
            </button>
            <button
              onClick={() => setSubTab("clinical_programs")}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-emerald-300" />
              Doctor Clinical Programs
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Bar */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "reminders", label: "🔔 Reminders & Check-ups", count: reminders.length },
          { id: "challenges", label: "🏃 Fitness & Walking", count: challenges.length },
          { id: "webinars", label: "🎓 Mana Academy Webinars", count: webinars.length },
          { id: "clinical_programs", label: "🔒 Clinical Doctor Programs (Private)", count: clinicalPrograms.length },
          { id: "goals", label: "🎯 My Health Goals", count: goals.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              subTab === tab.id
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                subTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── SUB-TAB 1: REMINDERS & CHECK-UPS ── */}
      {subTab === "reminders" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-900">
                User-Controlled Vaccination & Routine Screening Reminders
              </h3>
              <p className="text-xs text-gray-500">
                Automated timely reminders with WhatsApp & calendar alerts. Completely controlled by you.
              </p>
            </div>
            <button
              onClick={() => setShowAddReminderModal(true)}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Reminder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map(rem => {
              const isDone = rem.status === "COMPLETED";
              return (
                <div
                  key={rem.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDone
                      ? "bg-gray-50/70 border-gray-200 opacity-80"
                      : "bg-white border-teal-200 shadow-xs hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                          {rem.reminderType.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">• Recurrence: {rem.recurrence}</span>
                      </div>
                      <h4 className={`text-base font-extrabold ${isDone ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {rem.title}
                      </h4>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <strong>{rem.targetMemberName}</strong> ({rem.relationship})
                      </p>
                      {rem.notes && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {rem.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                        <span className="font-bold flex items-center gap-1 text-teal-700">
                          <Calendar className="w-3 h-3" /> Due: {rem.dueDate}
                        </span>
                        <span>• Alerts: {rem.channels.whatsapp ? "WhatsApp" : ""}{rem.channels.calendarSync ? " + Calendar" : ""}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleReminder(rem.id, rem.status)}
                        className={`p-2 rounded-xl border transition ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-50 text-gray-500 hover:text-emerald-700 border-gray-200"
                        }`}
                        title={isDone ? "Mark as pending" : "Mark as completed"}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: FITNESS & WALKING CHALLENGES ── */}
      {subTab === "challenges" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Community Fitness & Walking Challenges
              </h3>
              <p className="text-xs text-gray-500">
                Sync steps, maintain activity streaks, and join society walking quests with anonymous pseudonym settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {challenges.map(ch => (
              <div
                key={ch.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        {ch.rewardBadge}
                      </span>
                      <h4 className="text-lg font-black text-gray-900 mt-1.5">{ch.title}</h4>
                      <p className="text-xs text-gray-500">{ch.subtitle}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                      {ch.participantsCount} Walkers
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{ch.description}</p>

                  {/* Progress & Target */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">Target Goal: {ch.targetGoal.toLocaleString()} {ch.unit}</span>
                      {ch.isEnrolled && (
                        <span className="font-extrabold text-emerald-700">
                          Your Progress: {ch.userProgress.toLocaleString()} {ch.unit}
                        </span>
                      )}
                    </div>
                    {ch.isEnrolled && (
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round((ch.userProgress / ch.targetGoal) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Leaderboard with Anonymous Names */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase">
                      <span>Top Walker Pseudonyms</span>
                      <span>Score</span>
                    </div>
                    <div className="space-y-1.5">
                      {ch.topLeaderboard.map(lead => (
                        <div
                          key={lead.id}
                          className={`flex justify-between items-center p-2 rounded-xl text-xs ${
                            lead.isCurrentUser
                              ? "bg-teal-50 border border-teal-200 font-bold text-teal-900"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{lead.avatarIcon || "🚶"}</span>
                            <span>#{lead.rank} {lead.displayName}</span>
                          </div>
                          <span className="font-mono font-bold">{lead.currentValue.toLocaleString()} {ch.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Anonymous Alias Protected
                  </div>
                  <button
                    onClick={() => handleToggleChallenge(ch.id)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition shadow-xs ${
                      ch.isEnrolled
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-teal-700 hover:bg-teal-800 text-white"
                    }`}
                  >
                    {ch.isEnrolled ? "Leave Challenge" : "Join Walking Challenge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: MANA ACADEMY WEBINARS ── */}
      {subTab === "webinars" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Mana Academy Wellness Webinars
              </h3>
              <p className="text-xs text-gray-500">
                Live interactive workshops with endocrinologists, cardiologists, and certified physiotherapists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webinars.map(web => (
              <div
                key={web.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                      {web.academyModule}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">{web.durationMinutes} mins</span>
                  </div>

                  <h4 className="text-base font-black text-gray-900 leading-tight">
                    {web.title}
                  </h4>

                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs">
                    <p className="font-extrabold text-indigo-950">{web.speakerName}</p>
                    <p className="text-[11px] text-indigo-800">{web.speakerDesignation}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{web.speakerCredentials}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1 font-semibold text-gray-800">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {web.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" /> {web.scheduledTime}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                      Session Agenda:
                    </span>
                    <div className="space-y-1 text-xs text-gray-700">
                      {web.keyTakeaways.slice(0, 3).map((take, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{take}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {web.registeredCount} Residents Registered
                  </span>
                  <button
                    onClick={() => handleToggleWebinar(web.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 ${
                      web.isUserRegistered
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    {web.isUserRegistered ? "Registered ✓" : "Register Free"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: CLINICAL DOCTOR PROGRAMS (STRICTLY CONFIDENTIAL) ── */}
      {subTab === "clinical_programs" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-black">
                Qualified Doctor-Led Clinical Care Programs
              </h3>
            </div>
            <p className="text-xs text-indigo-200 max-w-2xl">
              1-on-1 evidence-based medical interventions for diabetes remission, metabolic weight optimization, and senior cardiovascular care.
            </p>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-xs text-emerald-300 flex items-center gap-2 font-semibold">
              <EyeOff className="w-4 h-4 shrink-0" />
              <span>
                Confidentiality Assurance: Individual enrollment and health data are strictly private and never exposed to other society residents or community groups.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {clinicalPrograms.map(prog => {
              const isActive = prog.enrollmentStatus === "ACTIVE";
              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">
                        {prog.durationWeeks} Weeks Clinical Care
                      </span>
                      {isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Active
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Private Intake Open
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-gray-900 leading-snug">
                      {prog.title}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed">{prog.tagline}</p>

                    {/* Attending Physician */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                        Supervising Physician
                      </span>
                      <strong className="text-gray-900 block font-bold">{prog.programLead.doctorName}</strong>
                      <span className="text-gray-600 text-[11px] block">{prog.programLead.specialty}</span>
                      <span className="text-gray-400 text-[10px] font-mono block">
                        Reg #{prog.programLead.registrationNumber} • {prog.programLead.hospitalAffiliation}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1 text-xs text-gray-700 pt-1">
                      {prog.inclusionHighlights.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="text-[11px]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    {isActive ? (
                      <div className="space-y-1 text-xs">
                        <span className="text-emerald-800 font-bold block">
                          Next Check-in: {prog.nextClinicalReviewDate}
                        </span>
                        <span className="text-gray-500 text-[11px] block">
                          Assigned: {prog.assignedDietitianOrCoach}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedClinicalProgram(prog)}
                        className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-black hover:to-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        Enroll Privately
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 5: VOLUNTARY HEALTH GOALS ── */}
      {subTab === "goals" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Voluntary Personal Health Goals
              </h3>
              <p className="text-xs text-gray-500">
                Track personal targets for daily steps, hydration, restorative sleep, and blood glucose. Strictly confidential.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4 hover:border-teal-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">{goal.title}</h4>
                      <span className="text-[11px] text-gray-400">Streak: {goal.streakDays} Days 🔥</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Private
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-2xl font-black text-gray-900">
                        {goal.currentValue}
                      </span>
                      <span className="text-gray-500 font-bold self-end">
                        Target: {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-400 text-[11px]">Last: {goal.lastLoggedDate}</span>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setNewGoalVal(goal.currentValue);
                      }}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                    >
                      Log Entry →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminderModal && (
        <AddReminderModal
          familyMembers={familyMembers}
          onClose={() => setShowAddReminderModal(false)}
          onAddReminder={handleAddReminder}
        />
      )}

      {/* Clinical Program Enroll Modal */}
      {selectedClinicalProgram && (
        <ClinicalProgramEnrollModal
          program={selectedClinicalProgram}
          onClose={() => setSelectedClinicalProgram(null)}
          onConfirmEnrollment={handleConfirmClinicalEnrollment}
        />
      )}

      {/* Edit Voluntary Goal Quick Prompt */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <h4 className="font-black text-base text-gray-900">Log Entry: {editingGoal.title}</h4>
            <p className="text-xs text-gray-500">Unit: {editingGoal.unit} (Target: {editingGoal.targetValue})</p>
            <input
              type="number"
              step="any"
              value={newGoalVal}
              onChange={e => setNewGoalVal(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl p-3 focus:bg-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-xs"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
