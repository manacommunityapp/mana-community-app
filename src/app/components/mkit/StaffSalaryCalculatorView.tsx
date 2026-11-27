import { useState } from "react";
import { UserCheck, IndianRupee, Calendar, Copy, Check, Share2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { calculateStaffSalary } from "../../../utils/mkitCalculators";

const ROLE_PRESETS = [
  { label: "House Maid", defaultSalary: 5000 },
  { label: "Cook / Chef", defaultSalary: 9000 },
  { label: "Driver", defaultSalary: 18000 },
  { label: "Nanny / Babysitter", defaultSalary: 12000 },
  { label: "Gardener", defaultSalary: 4000 },
];

export function StaffSalaryCalculatorView() {
  const [staffName, setStaffName] = useState<string>("Lakshmi");
  const [role, setRole] = useState<string>("House Maid");
  const [monthlySalary, setMonthlySalary] = useState<number>(8000);
  const [totalDays, setTotalDays] = useState<number>(30);
  const [allowedLeaves, setAllowedLeaves] = useState<number>(2);
  const [leavesTaken, setLeavesTaken] = useState<number>(4);
  const [advancePaid, setAdvancePaid] = useState<number>(1000);
  const [bonus, setBonus] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const res = calculateStaffSalary({
    staffName,
    role,
    monthlySalary,
    totalDaysInMonth: totalDays,
    paidLeavesAllowed: allowedLeaves,
    leavesTaken,
    advancePaid,
    bonusOrExtra: bonus,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(res.shareableSalarySlip);
    setCopied(true);
    toast.success("Salary slip copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(res.shareableSalarySlip)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Domestic Staff Details & Monthly Pay
            </h3>
            <p className="text-xs text-slate-500">Calculate pro-rata wage deductions, advances, and WhatsApp slips</p>
          </div>

          {/* Role Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Role Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {ROLE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setRole(p.label);
                    setMonthlySalary(p.defaultSalary);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    role === p.label
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Monthly Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Staff Name</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Staff Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Monthly Agreed Salary (₹)</label>
              <input
                type="number"
                min="500"
                step="500"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Leaves Configuration */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Days in Month</label>
              <input
                type="number"
                min="28"
                max="31"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Allowed Paid Off</label>
              <input
                type="number"
                min="0"
                max="10"
                value={allowedLeaves}
                onChange={(e) => setAllowedLeaves(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Leaves Taken</label>
              <input
                type="number"
                min="0"
                max="31"
                value={leavesTaken}
                onChange={(e) => setLeavesTaken(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-rose-600"
              />
            </div>
          </div>

          {/* Advance & Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Advance Paid / Loan (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bonus / Extra Work (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={bonus}
                onChange={(e) => setBonus(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Output Salary Slip Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Net Salary Payable</p>
              <h2 className="text-5xl font-black text-emerald-400 mt-1">
                ₹{res.netPayable.toLocaleString("en-IN")}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Payable to <b>{staffName}</b> ({role})
              </p>
            </div>

            {/* Breakdown Sheet */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-indigo-200">
                <span>Calculated Daily Wage:</span>
                <span className="font-bold text-white">₹{res.dailyWage}/day</span>
              </div>
              <div className="flex justify-between text-indigo-200">
                <span>Base Monthly Salary:</span>
                <span className="font-bold text-white">₹{monthlySalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Unpaid Leave ({res.unpaidLeaves} days):</span>
                <span className="font-bold">-₹{res.leaveDeduction.toLocaleString("en-IN")}</span>
              </div>
              {bonus > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>Bonus / Extra Work:</span>
                  <span className="font-bold">+₹{bonus.toLocaleString("en-IN")}</span>
                </div>
              )}
              {advancePaid > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Advance Deducted:</span>
                  <span className="font-bold">-₹{advancePaid.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-extrabold text-white">
                <span>Final Payout:</span>
                <span className="text-emerald-400">₹{res.netPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Slip Copied!" : "Copy Slip"}
              </button>
              <button
                onClick={handleWhatsApp}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp Slip
              </button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sends a transparent breakdown slip directly to your staff's WhatsApp to avoid disputes.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
