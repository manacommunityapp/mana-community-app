import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  HeartPulse
} from "lucide-react";
import type { HealthCampDto, FamilyMemberDto, HealthCampRegistrationDto } from "../../../types/health";
import { healthService } from "../../../services/healthService";

interface CampSlotBookingModalProps {
  camp: HealthCampDto;
  familyMembers: FamilyMemberDto[];
  onClose: () => void;
  onSuccess: (registration: HealthCampRegistrationDto) => void;
}

export const CampSlotBookingModal: React.FC<CampSlotBookingModalProps> = ({
  camp,
  familyMembers,
  onClose,
  onSuccess
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    familyMembers[0]?.id || "fam-1"
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    camp.timeSlots?.find(s => s.isAvailable)?.id || ""
  );
  const [phone, setPhone] = useState<string>("+91 98765 43210");
  const [flatNo, setFlatNo] = useState<string>("Tower B-402");
  const [notes, setNotes] = useState<string>("");
  const [fastingAcknowledged, setFastingAcknowledged] = useState<boolean>(!camp.fastingInstructions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPatient = familyMembers.find(f => f.id === selectedPatientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setErrorMsg("Please select an arrival time slot.");
      return;
    }
    if (camp.fastingInstructions && !fastingAcknowledged) {
      setErrorMsg("Please acknowledge the fasting instructions before reserving a slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const reg = await healthService.bookCampSlot({
        campId: camp.id,
        slotId: selectedSlotId,
        patientId: selectedPatientId,
        phone,
        flatNo,
        notes
      });
      onSuccess(reg);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to book camp slot. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="bg-emerald-400 text-teal-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-2">
            Time Slot Reservation
          </span>

          <h2 className="text-xl font-black leading-snug text-white pr-8">
            {camp.title}
          </h2>
          <p className="text-teal-200 text-xs mt-1">
            Partner: <strong>{camp.partnerProviderName}</strong> • {camp.venue}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {errorMsg}
            </div>
          )}

          {/* Logistics Overview Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[10px]">Date</span>
                <strong className="text-gray-900">{camp.date}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[10px]">Camp Hours</span>
                <strong className="text-gray-900">{camp.startTime} - {camp.endTime}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[10px]">Venue</span>
                <strong className="text-gray-900">{camp.venue}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[10px]">Fees</span>
                <strong className="text-emerald-700">{camp.isFree ? "Free Camp" : `₹${camp.feePerResident}`}</strong>
              </div>
            </div>
          </div>

          {/* 1. Patient / Dependent Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
              <span>Select Family Member / Patient:</span>
              <span className="text-[11px] text-teal-700 font-medium">Family Hub Link</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {familyMembers.map(member => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => setSelectedPatientId(member.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    selectedPatientId === member.id
                      ? "border-teal-600 bg-teal-50/70 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{member.fullName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {member.relationship} • {member.age} yrs • {member.gender}
                    </p>
                  </div>
                  {selectedPatientId === member.id && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Arrival Time Window (30-min slots) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Select 30-Minute Arrival Time Slot:
            </label>
            <p className="text-[11px] text-gray-500 mb-2.5">
              To avoid crowded queues, arrival is divided into capped batches.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {camp.timeSlots && camp.timeSlots.length > 0 ? (
                camp.timeSlots.map(slot => (
                  <button
                    type="button"
                    key={slot.id}
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2.5 rounded-xl border text-center transition text-xs font-semibold ${
                      !slot.isAvailable
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        : selectedSlotId === slot.id
                        ? "bg-teal-700 text-white border-teal-700 shadow"
                        : "bg-white text-gray-800 border-gray-200 hover:border-teal-500 hover:bg-teal-50/30"
                    }`}
                  >
                    <div className="font-mono">{slot.startTime}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {slot.isAvailable ? `${slot.capacity - slot.bookedCount} slots left` : "Full"}
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full p-3 bg-gray-50 rounded-xl text-xs text-gray-600 text-center">
                  General Admission: {camp.startTime} - {camp.endTime}
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number:</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Flat / Villa No:</label>
              <input
                type="text"
                required
                value={flatNo}
                onChange={e => setFlatNo(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Health Concern Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Notes or Current Medications (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Taking blood pressure meds; fasting for 12 hours"
              className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Fasting & Preparation Advisory */}
          {camp.fastingInstructions && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">Important Fasting Requirement:</strong>
                  <p className="text-amber-800 leading-relaxed">{camp.fastingInstructions}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 font-semibold text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fastingAcknowledged}
                  onChange={e => setFastingAcknowledged(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>I understand and agree to follow the fasting guidelines for {selectedPatient?.fullName || "the patient"}.</span>
              </label>
            </div>
          )}

          {/* Privacy Reassurance */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              🔒 <strong>Patient Confidentiality Guarantee:</strong> Only aggregated counts are counted for the event. Personal medical records and vitals are saved exclusively to your private Mana Health Vault.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Confirm & Generate Pass
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
