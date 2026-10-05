import { useState } from "react";
import {
  ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle, FileText
} from "lucide-react";

export function VendorVerification() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Vendor Trust & Verification
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit required statutory licenses for Community Commerce verification badge.
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-emerald-900">Verified Commerce Partner</h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Your GST and FSSAI credentials have been verified. Your group deals are visible to all gated societies.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Uploaded Licenses</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="font-bold text-slate-900">FSSAI Food Business License</div>
                <div className="text-[10px] text-slate-400">Lic No: 11223344000123 • Valid until: 2028-04-30</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              VERIFIED
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="font-bold text-slate-900">GST Registration Certificate</div>
                <div className="text-[10px] text-slate-400">29AABCU9603R1ZM • Active Regular Taxpayer</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
