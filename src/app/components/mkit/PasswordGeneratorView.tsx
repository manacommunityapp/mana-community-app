import { useState, useEffect } from "react";
import { KeyRound, Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { generatePassword, type PasswordGenOptions } from "../../../utils/mkitCalculators";

export function PasswordGeneratorView() {
  const [length, setLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(true);

  const [passwordData, setPasswordData] = useState(() =>
    generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      avoidAmbiguous: true,
    })
  );

  const [copied, setCopied] = useState<boolean>(false);

  const regenerate = (opts?: Partial<PasswordGenOptions>) => {
    const finalOpts: PasswordGenOptions = {
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      avoidAmbiguous,
      ...opts,
    };
    setPasswordData(generatePassword(finalOpts));
  };

  useEffect(() => {
    regenerate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, avoidAmbiguous]);

  const handleCopy = () => {
    navigator.clipboard.writeText(passwordData.password);
    setCopied(true);
    toast.success("Password copied securely to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: "pin" | "balanced" | "max") => {
    if (preset === "pin") {
      setLength(6);
      setIncludeUppercase(false);
      setIncludeLowercase(false);
      setIncludeNumbers(true);
      setIncludeSymbols(false);
      setAvoidAmbiguous(false);
    } else if (preset === "balanced") {
      setLength(16);
      setIncludeUppercase(true);
      setIncludeLowercase(true);
      setIncludeNumbers(true);
      setIncludeSymbols(true);
      setAvoidAmbiguous(true);
    } else if (preset === "max") {
      setLength(24);
      setIncludeUppercase(true);
      setIncludeLowercase(true);
      setIncludeNumbers(true);
      setIncludeSymbols(true);
      setAvoidAmbiguous(false);
    }
  };

  const strengthColorMap = {
    "Very Weak": "bg-red-500 text-red-700",
    Weak: "bg-orange-500 text-orange-700",
    Fair: "bg-amber-500 text-amber-700",
    Strong: "bg-emerald-500 text-emerald-700",
    "Very Strong": "bg-indigo-600 text-indigo-700",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Options Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Customize Password
            </h3>

            {/* Presets */}
            <div className="flex gap-1.5">
              <button
                onClick={() => applyPreset("balanced")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              >
                Standard (16)
              </button>
              <button
                onClick={() => applyPreset("pin")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                PIN (6)
              </button>
              <button
                onClick={() => applyPreset("max")}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Max (24)
              </button>
            </div>
          </div>

          {/* Length Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-600">Password Length</span>
              <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                {length} Characters
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="48"
              step="1"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>4</span>
              <span>16 (Recommended)</span>
              <span>48</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Special Symbols (!@#$)</span>
            </label>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidAmbiguous}
              onChange={(e) => setAvoidAmbiguous(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <span className="text-xs text-slate-600">
              Avoid lookalike / ambiguous characters (e.g., 0/O, 1/l, |)
            </span>
          </label>
        </div>

        {/* Right Password Display & Strength Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Generated Password</p>
              
              {/* Password Box */}
              <div className="mt-2 p-4 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between gap-3 backdrop-blur-sm">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white break-all select-all">
                  {passwordData.password}
                </span>
                <button
                  onClick={() => regenerate()}
                  title="Regenerate"
                  className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200 flex items-center gap-1">
                  {passwordData.score >= 3 ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  )}
                  Password Strength: <b className="text-white ml-1">{passwordData.strength}</b>
                </span>
                <span className="text-indigo-300">{passwordData.entropyBits} bits entropy</span>
              </div>

              {/* Strength bar segments */}
              <div className="grid grid-cols-4 gap-1.5 h-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all ${
                      passwordData.score >= step
                        ? step === 1
                          ? "bg-red-400"
                          : step === 2
                          ? "bg-amber-400"
                          : step === 3
                          ? "bg-emerald-400"
                          : "bg-indigo-400"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Password Copied!" : "Copy to Clipboard"}
            </button>
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-indigo-200/90 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Generated using cryptographically secure client-side randomness. Never transmitted across the internet.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
