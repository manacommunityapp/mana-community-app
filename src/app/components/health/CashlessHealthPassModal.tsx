import React from "react";
import {
  X,
  Printer,
  QrCode,
  ShieldCheck,
  Building,
  User,
  AlertCircle,
  PhoneCall,
  CheckCircle,
  Clock,
  Share2
} from "lucide-react";
import type { CashlessPreAuthDto, BenefitProgramDto } from "../../../types/health";

interface CashlessHealthPassModalProps {
  preAuth: CashlessPreAuthDto;
  program: BenefitProgramDto;
  onClose: () => void;
}

export const CashlessHealthPassModal: React.FC<CashlessHealthPassModalProps> = ({
  preAuth,
  program,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 p-6 text-white relative">
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
              Verified Cashless Pre-Auth
            </span>
            <span className="text-white/60 text-xs">• MediBuddy Protocol</span>
          </div>

          <h2 className="text-xl font-black leading-tight text-white pr-8">
            Digital Cashless Healthcare Pass
          </h2>
          <p className="text-teal-200 text-xs mt-1">
            {program.planName} • Guaranteed Hospital / Clinic Credit
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Card Meta Box */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl border-2 border-dashed border-teal-300 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-teal-800 tracking-wider">
                  Pre-Auth Approval Code
                </span>
                <p className="text-base font-black text-gray-900 font-mono tracking-wider">
                  {preAuth.approvalCode}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-500 block uppercase">Pre-Auth ID</span>
                <span className="font-mono text-xs font-bold text-teal-700">{preAuth.preAuthId}</span>
              </div>
            </div>

            {/* QR Code and Key Verification Details */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-sm shrink-0 flex flex-col items-center">
                <QrCode className="w-24 h-24 text-teal-950" />
                <span className="text-[10px] text-teal-700 font-mono font-bold mt-1">SCAN AT DESK</span>
              </div>

              <div className="space-y-2 text-xs flex-1 w-full">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teal-600" /> Beneficiary
                  </span>
                  <span className="font-extrabold text-gray-900">{preAuth.beneficiaryName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Policy Number</span>
                  <span className="font-mono font-semibold text-gray-700">{program.policyNumber}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-teal-600" /> Network Provider
                  </span>
                  <span className="font-bold text-gray-900 text-right max-w-[160px] truncate" title={preAuth.networkProviderName}>
                    {preAuth.networkProviderName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Valid Until
                  </span>
                  <span className="font-bold text-emerald-700">{preAuth.validUntil}</span>
                </div>
              </div>
            </div>

            {/* Cashless Allowance Bar */}
            <div className="bg-white rounded-xl p-3 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">Pre-Authorized Cashless Cap</span>
                <span className="text-lg font-black text-emerald-600">₹{preAuth.eligibleCashlessCap}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-500 block">Patient Out-of-Pocket</span>
                <span className="text-sm font-extrabold text-gray-900">₹0 (100% Cashless)</span>
              </div>
            </div>
          </div>

          {/* Desk Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Hospital Admission & Reception Instructions
            </h4>
            <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-700">
              {preAuth.instructions.map((inst, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Helpdesk Notice */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-cyan-700 shrink-0" />
              <div>
                <span className="font-bold text-cyan-900 block">24x7 TPA Cashless Helpline</span>
                <span className="text-cyan-700 font-mono text-[11px]">{program.tpaHelpdeskNumber}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-cyan-200 text-cyan-900 px-2 py-1 rounded">
              Priority Escalation
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Pass
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl hover:bg-gray-50 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
