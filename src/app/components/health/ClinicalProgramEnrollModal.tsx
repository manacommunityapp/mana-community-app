import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  UserCheck,
  CheckCircle,
  FileCheck,
  Clock,
  Building,
  HeartPulse,
  EyeOff
} from "lucide-react";
import type { ClinicallySupervisedProgramDto } from "../../../types/health";

interface ClinicalProgramEnrollModalProps {
  program: ClinicallySupervisedProgramDto;
  onClose: () => void;
  onConfirmEnrollment: (programId: string) => void;
}

export const ClinicalProgramEnrollModal: React.FC<ClinicalProgramEnrollModalProps> = ({
  program,
  onClose,
  onConfirmEnrollment
}) => {
  const [patientName, setPatientName] = useState("Sandeep Varma");
  const [preferredSlot, setPreferredSlot] = useState("Weekday Evenings (6:00 PM - 8:00 PM)");
  const [agreedConfidentiality, setAgreedConfidentiality] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleEnroll = () => {
    setSubmitting(true);
    setTimeout(() => {
      onConfirmEnrollment(program.id);
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-300" />
              100% Private Clinical Care
            </span>
            <span className="text-white/60 text-xs">• Never Disclosed to Community</span>
          </div>
          <h2 className="text-xl font-black text-white">{program.title}</h2>
          <p className="text-indigo-200 text-xs mt-1">
            Supervised by {program.programLead.doctorName} ({program.programLead.specialty})
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Explicit Privacy Banner */}
          <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-emerald-950 block font-black">
                Privacy & Medical Discretion Covenant
              </strong>
              <p className="text-emerald-800 leading-relaxed">
                {program.privacyGuaranteeNotice}
              </p>
              <span className="text-[11px] text-emerald-700 block font-semibold pt-0.5">
                • Vitals, lab markers, and progress logs are visible ONLY to you and your assigned clinician.
              </span>
            </div>
          </div>

          {/* Lead Physician Verification Card */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider block">
              Attending Medical Specialist
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">{program.programLead.doctorName}</h4>
                <p className="text-xs text-gray-600">{program.programLead.specialty}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Reg #{program.programLead.registrationNumber} • {program.programLead.hospitalAffiliation}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> Verified MD
              </span>
            </div>
          </div>

          {/* Program Highlights */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Clinical Inclusions ({program.durationWeeks} Weeks Protocol)
            </h4>
            <div className="space-y-1.5 text-xs text-gray-700">
              {program.inclusionHighlights.map((inc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intake Preferences */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Enrolling Member
              </label>
              <input
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Preferred 1-on-1 Consultation Window
              </label>
              <select
                value={preferredSlot}
                onChange={e => setPreferredSlot(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 focus:bg-white"
              >
                <option value="Weekday Mornings (8:00 AM - 10:00 AM)">Weekday Mornings (8:00 AM - 10:00 AM)</option>
                <option value="Weekday Evenings (6:00 PM - 8:00 PM)">Weekday Evenings (6:00 PM - 8:00 PM)</option>
                <option value="Saturday Morning (9:00 AM - 12:00 PM)">Saturday Morning (9:00 AM - 12:00 PM)</option>
              </select>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
            <input
              type="checkbox"
              checked={agreedConfidentiality}
              onChange={e => setAgreedConfidentiality(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
            />
            <span className="text-gray-700 leading-relaxed">
              I authorize direct confidential tele-health communication with the assigned clinician. I understand my records will be stored encrypted inside my personal Mana Health Vault.
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnroll}
              disabled={!agreedConfidentiality || submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-black hover:to-indigo-950 text-white text-xs font-extrabold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? "Initiating Private Intake..." : "Confirm Private Enrollment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
