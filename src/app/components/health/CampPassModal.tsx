import React from "react";
import {
  X,
  Printer,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  User,
  HeartPulse,
  Share2
} from "lucide-react";
import type { HealthCampDto, HealthCampRegistrationDto } from "../../../types/health";

interface CampPassModalProps {
  registration: HealthCampRegistrationDto;
  camp?: HealthCampDto;
  onClose: () => void;
}

export const CampPassModal: React.FC<CampPassModalProps> = ({
  registration,
  camp,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verified Health Camp Pass
            </span>
            <span className="text-white/60 text-xs">• Mana Health</span>
          </div>

          <h2 className="text-xl font-black leading-tight text-white pr-8">
            {registration.campTitle}
          </h2>
          <p className="text-teal-200 text-xs mt-1">
            {camp?.partnerProviderName || "Accredited Hospital Partner"}
          </p>
        </div>

        {/* Pass Body */}
        <div className="p-6 space-y-6">
          {/* Token Number & QR Code Banner */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 border-2 border-teal-200/80 rounded-2xl p-5 flex items-center justify-between shadow-inner">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Arrival Token Number
              </span>
              <p className="text-3xl font-black text-teal-900 tracking-tight font-mono">
                {registration.tokenNumber}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold pt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Slot: {registration.slotTime}
              </div>
            </div>

            {/* Styled QR Code Box */}
            <div className="bg-white p-2.5 rounded-xl border border-teal-200 shadow-sm flex flex-col items-center justify-center">
              <QrCode className="w-16 h-16 text-teal-950" />
              <span className="text-[9px] font-mono font-bold text-gray-500 mt-0.5">SCAN ON ARRIVAL</span>
            </div>
          </div>

          {/* Participant Credentials */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-[11px] mb-1">
                <User className="w-3.5 h-3.5 text-teal-700" />
                Participant / Patient
              </div>
              <p className="font-bold text-gray-900 text-sm">{registration.patientName}</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {registration.patientAge ? `${registration.patientAge} yrs` : ""} •{" "}
                {registration.patientGender || "N/A"} ({registration.patientRelationship || "Resident"})
              </p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-[11px] mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                Venue & Flat
              </div>
              <p className="font-bold text-gray-900 text-sm">{camp?.venue || "Clubhouse Hall"}</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Flat: {registration.flatNo || "Tower B-402"}</p>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" /> Camp Date:
              </span>
              <strong className="text-gray-900">{camp?.date || "Upcoming"}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-700" /> Arrival Time Window:
              </span>
              <strong className="text-teal-900 bg-teal-100/60 px-2 py-0.5 rounded font-mono">
                {registration.slotTime}
              </strong>
            </div>
          </div>

          {/* Fasting / Preparation Checklist */}
          {camp?.fastingInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Fasting Advisory:</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{camp.fastingInstructions}</p>
              </div>
            </div>
          )}

          {camp?.preparationNotes && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
              <HeartPulse className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-blue-950">Preparation Checklist:</strong>
                <p className="mt-0.5 text-blue-800">{camp.preparationNotes}</p>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Clinical results, vital measurements, and doctor summaries will be privately synced to your{" "}
              <strong className="text-teal-900">Mana Health Vault</strong> and are never shared publicly.
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
          >
            Close
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
