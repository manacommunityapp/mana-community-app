import React, { useState } from "react";
import {
  X,
  Bell,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Repeat
} from "lucide-react";
import type {
  PreventiveReminderDto,
  PreventiveReminderType,
  FamilyMemberDto
} from "../../../types/health";

interface AddReminderModalProps {
  familyMembers: FamilyMemberDto[];
  onClose: () => void;
  onAddReminder: (reminder: Omit<PreventiveReminderDto, "id">) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  familyMembers,
  onClose,
  onAddReminder
}) => {
  const [title, setTitle] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(familyMembers[0]?.id || "fam-1");
  const [reminderType, setReminderType] = useState<PreventiveReminderType>("VACCINATION");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [recurrence, setRecurrence] = useState<"ONCE" | "EVERY_3_MONTHS" | "EVERY_6_MONTHS" | "ANNUAL">("ANNUAL");
  const [inApp, setInApp] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a reminder title (e.g. Flu shot, Dental checkup)");
      return;
    }
    const mem = familyMembers.find(m => m.id === selectedMemberId);
    const memberName = mem?.fullName || "Family Member";
    const relationship = mem?.relationship || "Self";

    onAddReminder({
      title: title.trim(),
      targetMemberId: selectedMemberId,
      targetMemberName: memberName,
      relationship,
      reminderType,
      dueDate,
      recurrence,
      channels: { inApp, whatsapp, calendarSync },
      status: "PENDING",
      notes: notes.trim(),
      isUserControlled: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              User-Controlled Schedule
            </span>
            <span className="text-white/60 text-xs">• Private to Family</span>
          </div>
          <h2 className="text-xl font-black text-white">Add Vaccination / Check-up Reminder</h2>
          <p className="text-teal-100 text-xs mt-1">
            Stay on top of routine shots, pediatric boosters, mammograms, and lab panels.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Reminder Title
            </label>
            <input
              type="text"
              placeholder="e.g. Quadrivalent Influenza Vaccine, Annual Lipid & HbA1c Panel"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" /> Family Member
              </label>
              <select
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white"
              >
                {familyMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Category Type
              </label>
              <select
                value={reminderType}
                onChange={e => setReminderType(e.target.value as PreventiveReminderType)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white font-medium"
              >
                <option value="VACCINATION">💉 Vaccine / Booster</option>
                <option value="ANNUAL_CHECKUP">🩺 Routine Full Body Check</option>
                <option value="BLOOD_SUGAR_SCREENING">🩸 Blood Glucose / Lipid Panel</option>
                <option value="DENTAL_CHECKUP">🦷 Dental Cleaning & Scaling</option>
                <option value="EYE_CHECKUP">👁️ Comprehensive Eye Exam</option>
                <option value="CARDIAC_EVALUATION">❤️ Senior Cardiac / BP Screen</option>
                <option value="MEDICATION_REFILL">💊 Chronic Medication Refill</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> Next Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-teal-600" /> Recurrence Cycle
              </label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white"
              >
                <option value="ONCE">One-time only</option>
                <option value="EVERY_3_MONTHS">Every 3 Months</option>
                <option value="EVERY_6_MONTHS">Every 6 Months</option>
                <option value="ANNUAL">Annual (Every Year)</option>
              </select>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-teal-900 uppercase block tracking-wider">
              Alert Delivery Channels
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-teal-200">
                <input
                  type="checkbox"
                  checked={inApp}
                  onChange={e => setInApp(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-gray-800">In-App Push</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-teal-200">
                <input
                  type="checkbox"
                  checked={whatsapp}
                  onChange={e => setWhatsapp(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-gray-800">WhatsApp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-teal-200">
                <input
                  type="checkbox"
                  checked={calendarSync}
                  onChange={e => setCalendarSync(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-gray-800">Calendar .ics</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Clinician / Lab Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 12-hour fasting required, carry pediatrician card"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-md transition"
            >
              Schedule Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
