import { useState } from "react";
import { Calculator, TrendingUp, IndianRupee, PieChart, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { calculateEmi, calculateSip, calculateLumpsum } from "../../../utils/mkitCalculators";

type CalcMode = "emi" | "sip" | "lumpsum";

export function EmiSipCalculatorView() {
  const [mode, setMode] = useState<CalcMode>("emi");

  // EMI state
  const [loanAmount, setLoanAmount] = useState<number>(2500000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // SIP / Lumpsum state
  const [sipMonthly, setSipMonthly] = useState<number>(10000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [investmentYears, setInvestmentYears] = useState<number>(10);

  const emiResult = calculateEmi(loanAmount, interestRate, tenureYears * 12);
  const sipResult = calculateSip(sipMonthly, expectedReturn, investmentYears);
  const lumpsumResult = calculateLumpsum(lumpsumAmount, expectedReturn, investmentYears);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl max-w-md">
        <button
          onClick={() => setMode("emi")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === "emi" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Loan EMI
        </button>
        <button
          onClick={() => setMode("sip")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === "sip" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          SIP
        </button>
        <button
          onClick={() => setMode("lumpsum")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === "lumpsum" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <PieChart className="w-4 h-4" />
          Lumpsum
        </button>
      </div>

      {mode === "emi" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Loan EMI Parameters
            </h3>

            {/* Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Loan Amount</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                  {formatCurrency(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="20000000"
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>₹50K</span>
                <span>₹1 Cr</span>
                <span>₹2 Cr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Annual Interest Rate (%)</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                  {interestRate}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5%</span>
                <span>12.5%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Tenure (Years)</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                  {tenureYears} Years ({tenureYears * 12} Mos)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1 Yr</span>
                <span>15 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Monthly Loan EMI</p>
                <h2 className="text-4xl font-extrabold text-white mt-1">
                  {formatCurrency(emiResult.monthlyEmi)}
                </h2>
                <p className="text-xs text-indigo-300 mt-1">Principal + Interest per month</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div>
                  <p className="text-xs text-indigo-200">Principal Amount</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(emiResult.principal)}</p>
                  <p className="text-xs text-indigo-300">{emiResult.principalRatioPercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-200">Total Interest</p>
                  <p className="text-lg font-bold text-amber-300 mt-0.5">{formatCurrency(emiResult.totalInterest)}</p>
                  <p className="text-xs text-amber-200/80">{emiResult.interestRatioPercent}%</p>
                </div>
              </div>

              {/* Progress ratio */}
              <div>
                <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
                  <span>Breakdown Ratio</span>
                  <span>Total: {formatCurrency(emiResult.totalPayment)}</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${emiResult.principalRatioPercent}%` }}
                    className="bg-indigo-400 h-full"
                    title={`Principal: ${emiResult.principalRatioPercent}%`}
                  />
                  <div
                    style={{ width: `${emiResult.interestRatioPercent}%` }}
                    className="bg-amber-400 h-full"
                    title={`Interest: ${emiResult.interestRatioPercent}%`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Calendar className="w-4 h-4 text-indigo-300" />
              {showAmortization ? "Hide Amortization Schedule" : "View Yearly Amortization"}
              {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Amortization Schedule Drawer */}
      {mode === "emi" && showAmortization && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Yearly Repayment Schedule ({tenureYears} Years)
          </h4>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3">Principal Paid</th>
                  <th className="py-2.5 px-3">Interest Paid</th>
                  <th className="py-2.5 px-3">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {emiResult.yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Year {row.year}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-medium">{formatCurrency(row.principalPaid)}</td>
                    <td className="py-2.5 px-3 text-amber-600 font-medium">{formatCurrency(row.interestPaid)}</td>
                    <td className="py-2.5 px-3 font-semibold">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIP & Lumpsum Mode */}
      {(mode === "sip" || mode === "lumpsum") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {mode === "sip" ? "Systematic Investment Plan (SIP)" : "Lumpsum Investment"}
            </h3>

            {mode === "sip" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-600">Monthly Investment</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                    {formatCurrency(sipMonthly)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="200000"
                  step="500"
                  value={sipMonthly}
                  onChange={(e) => setSipMonthly(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>₹500</span>
                  <span>₹1 Lakh</span>
                  <span>₹2 Lakh</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-600">Total Investment Amount</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                    {formatCurrency(lumpsumAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="5000000"
                  step="5000"
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>₹5K</span>
                  <span>₹25 Lakh</span>
                  <span>₹50 Lakh</span>
                </div>
              </div>
            )}

            {/* Expected Return */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Expected Annual Return (%)</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                  {expectedReturn}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Time Period */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Time Period (Years)</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                  {investmentYears} Years
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={investmentYears}
                onChange={(e) => setInvestmentYears(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1 Yr</span>
                <span>18 Yrs</span>
                <span>35 Yrs</span>
              </div>
            </div>
          </div>

          {/* Results Column */}
          {(() => {
            const activeResult = mode === "sip" ? sipResult : lumpsumResult;
            return (
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-emerald-200 font-medium">Expected Maturity Value</p>
                    <h2 className="text-4xl font-extrabold text-white mt-1">
                      {formatCurrency(activeResult.totalMaturityValue)}
                    </h2>
                    <p className="text-xs text-emerald-300 mt-1">
                      After {investmentYears} years @ {expectedReturn}% p.a.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <div>
                      <p className="text-xs text-emerald-200">Invested Amount</p>
                      <p className="text-lg font-bold text-white mt-0.5">
                        {formatCurrency(activeResult.investedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-200">Wealth Gain</p>
                      <p className="text-lg font-bold text-emerald-400 mt-0.5">
                        {formatCurrency(activeResult.estimatedReturns)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                      <span>Investment vs Wealth Gain</span>
                      <span>
                        +{Math.round((activeResult.estimatedReturns / (activeResult.investedAmount || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${Math.round(
                            (activeResult.investedAmount / (activeResult.totalMaturityValue || 1)) * 100
                          )}%`,
                        }}
                        className="bg-slate-300 h-full"
                        title="Invested"
                      />
                      <div
                        style={{
                          width: `${Math.round(
                            (activeResult.estimatedReturns / (activeResult.totalMaturityValue || 1)) * 100
                          )}%`,
                        }}
                        className="bg-emerald-400 h-full"
                        title="Returns"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-emerald-200 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Power of compounding: Your wealth multiplies by{" "}
                    <b>{(activeResult.totalMaturityValue / (activeResult.investedAmount || 1)).toFixed(1)}x</b> over {investmentYears} years.
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
