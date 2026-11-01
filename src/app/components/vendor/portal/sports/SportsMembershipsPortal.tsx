import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  DollarSign,
  Phone,
  Mail,
  Building,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Save,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { sportsCoachingService } from "../../../../../services/sports/sportsCoachingService";
import type {
  AcademyBatch,
  BatchEnrollment,
  AttendanceRecord,
  SportsMembershipPlan,
  AttendanceState,
} from "../../../../../types/sportsCoaching";

type SubTab = "ROSTER" | "ATTENDANCE" | "PLANS";

export function SportsMembershipsPortal() {
  const [subTab, setSubTab] = useState<SubTab>("ROSTER");
  const [batches, setBatches] = useState<AcademyBatch[]>([]);
  const [enrollments, setEnrollments] = useState<BatchEnrollment[]>([]);
  const [plans, setPlans] = useState<SportsMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");

  // Attendance Tab State
  const [attBatchId, setAttBatchId] = useState("");
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceRecord[]>([]);

  // Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState<{
    batchId: string;
    studentName: string;
    studentAge: number;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    communityUnit: string;
  }>({
    batchId: "",
    studentName: "",
    studentAge: 10,
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    communityUnit: "Tower 2 - Flat 604",
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (attBatchId && attDate) {
      loadAttendance(attBatchId, attDate);
    }
  }, [attBatchId, attDate]);

  async function init() {
    setLoading(true);
    try {
      const [bData, eData, pData] = await Promise.all([
        sportsCoachingService.getBatches(),
        sportsCoachingService.getEnrollments(),
        sportsCoachingService.getMembershipPlans(),
      ]);
      setBatches(bData);
      setEnrollments(eData);
      setPlans(pData);
      if (bData.length > 0) {
        setAttBatchId(bData[0].id);
        setEnrollForm((prev) => ({ ...prev, batchId: bData[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load academy memberships");
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance(batchId: string, date: string) {
    try {
      const records = await sportsCoachingService.getAttendance(batchId, date);
      setAttendanceSheet(records);
    } catch (err) {
      toast.error("Failed to load attendance sheet");
    }
  }

  function handleAttendanceToggle(enrollmentId: string, newState: AttendanceState) {
    setAttendanceSheet((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, status: newState } : r))
    );
  }

  async function handleSaveAttendance() {
    if (!attBatchId) return;
    try {
      await sportsCoachingService.saveAttendance(attBatchId, attDate, attendanceSheet);
      toast.success("Attendance sheet saved successfully!");
    } catch (err) {
      toast.error("Failed to save attendance");
    }
  }

  async function handleMarkFeePaid(enrollmentId: string) {
    try {
      const updated = await sportsCoachingService.markFeePaid(enrollmentId);
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
      toast.success(`Fee marked as renewed for ${updated.studentName}! Next renewal in 30 days.`);
    } catch (err) {
      toast.error("Error updating fee status");
    }
  }

  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollForm.studentName || !enrollForm.parentPhone) {
      toast.error("Please enter student name and parent contact");
      return;
    }

    try {
      const newEnr = await sportsCoachingService.enrollStudent({
        batchId: enrollForm.batchId,
        studentName: enrollForm.studentName,
        studentAge: Number(enrollForm.studentAge),
        parentName: enrollForm.parentName,
        parentPhone: enrollForm.parentPhone,
        parentEmail: enrollForm.parentEmail,
        communityUnit: enrollForm.communityUnit,
      });
      setEnrollments((prev) => [newEnr, ...prev]);
      setShowEnrollModal(false);
      toast.success(`Student ${newEnr.studentName} enrolled successfully!`);
      // Reload batches to update counts
      const bData = await sportsCoachingService.getBatches();
      setBatches(bData);
    } catch (err) {
      toast.error("Failed to enroll student");
    }
  }

  const filteredEnrollments = enrollments.filter((e) => {
    if (selectedBatchFilter !== "ALL" && e.batchId !== selectedBatchFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.studentName.toLowerCase().includes(q) ||
        e.parentName.toLowerCase().includes(q) ||
        e.parentPhone.includes(q) ||
        e.communityUnit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Roster & Memberships</h1>
          <p className="text-xs text-slate-500">
            Track student enrollments, fee renewal dates, daily batch attendance, and academy membership packages.
          </p>
        </div>

        <button
          onClick={() => setShowEnrollModal(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setSubTab("ROSTER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === "ROSTER"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Enrolled Students ({enrollments.length})
        </button>

        <button
          onClick={() => setSubTab("ATTENDANCE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === "ATTENDANCE"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Daily Attendance Sheet
        </button>

        <button
          onClick={() => setSubTab("PLANS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === "PLANS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Membership Packages ({plans.length})
        </button>
      </div>

      {/* Sub-Tab 1: Student Roster */}
      {subTab === "ROSTER" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, parent, flat no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="font-bold text-slate-500 shrink-0">Filter Batch:</span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student & Age</th>
                    <th className="py-3 px-4">Parent & Contact</th>
                    <th className="py-3 px-4">Community Unit</th>
                    <th className="py-3 px-4">Assigned Batch</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Fee Renewal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((enr) => {
                      const isDue = !enr.feePaid || enr.status === "PENDING_PAYMENT";

                      return (
                        <tr key={enr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {enr.studentName}
                            <span className="block text-[11px] font-normal text-slate-400">
                              Age {enr.studentAge} • {enr.sport}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">{enr.parentName}</span>
                            <span className="text-[11px] text-slate-500 block">{enr.parentPhone}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">
                            {enr.communityUnit}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-indigo-700 block text-[11px]">
                              {enr.batchTitle}
                            </span>
                            <span className="text-[10px] text-slate-400">₹{enr.monthlyFee}/month</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  enr.attendancePercent >= 90 ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              <span>{enr.attendancePercent}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">{enr.renewalDate}</span>
                            {isDue ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                Fee Due
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                Paid & Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isDue ? (
                              <button
                                onClick={() => handleMarkFeePaid(enr.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">
                                {enr.paymentReference?.slice(0, 14)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Daily Attendance Sheet */}
      {subTab === "ATTENDANCE" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Select Batch:</span>
              <select
                value={attBatchId}
                onChange={(e) => setAttBatchId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.startTime} - {b.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
                />
              </div>

              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Attendance
              </button>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Roll Call Roster ({attendanceSheet.length} Students)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  Present: {attendanceSheet.filter((a) => a.status === "PRESENT").length}
                </span>
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  Absent: {attendanceSheet.filter((a) => a.status === "ABSENT").length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {attendanceSheet.map((record) => {
                const isPres = record.status === "PRESENT";
                const isAbs = record.status === "ABSENT";
                const isExc = record.status === "EXCUSED";

                return (
                  <div
                    key={record.enrollmentId}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{record.studentName}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Academy Student</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAttendanceToggle(record.enrollmentId, "PRESENT")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isPres
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        P
                      </button>
                      <button
                        onClick={() => handleAttendanceToggle(record.enrollmentId, "ABSENT")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isAbs
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleAttendanceToggle(record.enrollmentId, "EXCUSED")}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          isExc
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        E
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Membership Packages */}
      {subTab === "PLANS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {plan.sport}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {plan.residentDiscountPercent}% Resident Off
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>

                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-2xl font-black">₹{plan.price}</span>
                  <span className="text-xs text-slate-400">/ {plan.durationMonths} Months</span>
                </div>

                <p className="text-xs text-slate-500">
                  Includes up to {plan.sessionsLimit} structured academy coaching sessions.
                </p>

                {/* Perks */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Active Offer</span>
                <span className="text-emerald-700 font-bold">Enabled for Residents</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Enroll Student into Academy</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnrollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Training Batch</label>
                <select
                  value={enrollForm.batchId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, batchId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (₹{b.monthlyFee}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Student Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Advait Sharma"
                    value={enrollForm.studentName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Student Age</label>
                  <input
                    type="number"
                    min="4"
                    max="65"
                    value={enrollForm.studentAge}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentAge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kunal Sharma"
                    value={enrollForm.parentName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, parentName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98860 00000"
                    value={enrollForm.parentPhone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Apartment / Community Unit</label>
                <input
                  type="text"
                  placeholder="e.g. Tower 3 - 604, Prestige Shantiniketan"
                  value={enrollForm.communityUnit}
                  onChange={(e) => setEnrollForm({ ...enrollForm, communityUnit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
