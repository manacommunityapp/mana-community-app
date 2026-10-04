import { useState } from "react";
import {
  Building2, ShieldCheck, CreditCard, MapPin, Mail, Phone,
  FileText, CheckCircle2, Save
} from "lucide-react";

export function VendorBusinessProfile() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          Vendor Business Profile & GSTIN
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Maintain your legal entity details, tax credentials, bank settlement accounts and operating zones.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trade Name / Legal Entity</label>
            <input type="text" defaultValue="ABC Wholesale Foods & FMCG Supplies" className="w-full p-2.5 border border-slate-200 rounded-xl font-medium" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
            <input type="text" defaultValue="29AABCU9603R1ZM" className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Email</label>
            <input type="email" defaultValue="supply@abcwholesale.com" className="w-full p-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
            <input type="tel" defaultValue="+91 98450 12345" className="w-full p-2.5 border border-slate-200 rounded-xl" />
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 pt-4">Bank Settlement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
            <input type="text" defaultValue="HDFC Bank" className="w-full p-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Account Number</label>
            <input type="text" defaultValue="50200045678912" className="w-full p-2.5 border border-slate-200 rounded-xl font-mono" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
            <input type="text" defaultValue="HDFC0000128" className="w-full p-2.5 border border-slate-200 rounded-xl font-mono" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer">
            <Save className="w-4 h-4" /> Save Business Profile
          </button>
        </div>
      </div>
    </div>
  );
}
