import React from "react";
import {
  X,
  Printer,
  Building2,
  Calendar,
  CheckCircle2,
  Users,
  Award,
  AlertTriangle,
  Stethoscope,
  HeartHandshake
} from "lucide-react";
import type { HealthCampDto } from "../../../types/health";

interface CampPartnerReportModalProps {
  camp: HealthCampDto;
  onClose: () => void;
}

export const CampPartnerReportModal: React.FC<CampPartnerReportModalProps> = ({
  camp,
  onClose
}) => {
  const report = camp.partnerReport;
  const stats = camp.aggregateStats;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Official Partner Report
            </span>
            <span className="text-white/60 text-xs">• Community Health Committee</span>
          </div>

          <h2 className="text-xl font-black text-white pr-8">
            {report?.campTitle || camp.title}
          </h2>
          <p className="text-teal-200 text-xs mt-1 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            {camp.partnerHospital?.name || camp.partnerProviderName} • {camp.partnerHospital?.accreditation || "Accredited"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm max-h-[75vh] overflow-y-auto">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                Total Screened
              </span>
              <strong className="text-2xl font-black text-teal-950 mt-1 block">
                {report?.totalScreeningsConducted || stats?.totalAttended || camp.totalSlots}
              </strong>
              <span className="text-[11px] text-teal-700 font-medium">Residents</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Turnout Rate
              </span>
              <strong className="text-2xl font-black text-emerald-950 mt-1 block">
                {stats?.attendanceRatePercent || 92}%
              </strong>
              <span className="text-[11px] text-emerald-700 font-medium">Of Capacity</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Satisfaction
              </span>
              <strong className="text-2xl font-black text-blue-950 mt-1 block">
                {stats?.satisfactionRate || 98}%
              </strong>
              <span className="text-[11px] text-blue-700 font-medium">Resident Rating</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Clinical Referrals
              </span>
              <strong className="text-2xl font-black text-amber-950 mt-1 block">
                {stats?.referralsCount || 0}
              </strong>
              <span className="text-[11px] text-amber-700 font-medium">Advised Specialist</span>
            </div>
          </div>

          {/* Lead Doctor & Clinical Team */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="text-gray-500 font-medium text-[11px]">Lead Clinician</p>
                <p className="font-extrabold text-gray-900 text-sm">
                  {report?.leadDoctorName || camp.partnerHospital?.leadDoctor || "Chief Medical Officer"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-[11px] block">Camp Date</span>
              <strong className="text-gray-800">{camp.date}</strong>
            </div>
          </div>

          {/* Key Findings Summary */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              Executive Epidemiological Summary
            </h4>
            <p className="text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200/80 leading-relaxed">
              {report?.keyFindingsSummary ||
                "Overall community participation demonstrated proactive engagement in preventive wellness. Early markers of chronic conditions were detected and flagged for lifestyle or medical modification."}
            </p>
          </div>

          {/* Demographic & Indicator Distributions */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  Age Cohort Participation
                </h5>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Senior Citizens (60+ yrs)</span>
                    <strong className="text-gray-900">{stats.ageBreakdown.seniors} residents</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adults (18-59 yrs)</span>
                    <strong className="text-gray-900">{stats.ageBreakdown.adults} residents</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Children & Teens (0-17 yrs)</span>
                    <strong className="text-gray-900">{stats.ageBreakdown.kids} residents</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
                  Health Indicators Overview
                </h5>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Optimal Blood Pressure</span>
                    <strong className="text-emerald-700 font-bold">{stats.bpSummary.normal} normal</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Borderline / Elevated BP</span>
                    <strong className="text-amber-700 font-bold">{stats.bpSummary.elevated + stats.bpSummary.stage1OrHigher} cases</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Blood Sugar Flagged</span>
                    <strong className="text-red-700 font-bold">{stats.sugarSummary.preDiabetic + stats.sugarSummary.diabetic} cases</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preventive Recommendations */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Partner Recommendations for Society RWA
            </h4>
            <div className="space-y-2">
              {report?.preventiveRecommendations && report.preventiveRecommendations.length > 0 ? (
                report.preventiveRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No custom recommendations reported.</p>
              )}
            </div>
          </div>

          {/* Follow-up Clinic Details */}
          {report?.followUpClinicDays && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <strong className="text-gray-900 block font-bold mb-0.5">Partner Follow-up Consultation Window:</strong>
              <span className="text-gray-600">{report.followUpClinicDays}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
          >
            Close Report
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export Official Report
          </button>
        </div>
      </div>
    </div>
  );
};
