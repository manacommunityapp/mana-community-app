import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { assetService } from "../../../services/assetService";
import type { Asset } from "../../../services/assetService";
import { CheckCircle2, AlertTriangle, ArrowLeft, Clock, Calendar, ShieldCheck, Dumbbell, Hammer } from "lucide-react";
import { toast, Toaster } from "sonner";

export function AssetCheckout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [duration, setDuration] = useState("3 Hours");
  const [customDuration, setCustomDuration] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fallback to Sandeep if auth doesn't have flat/name
  const userName = user?.fullName || "Sandeep K.";
  const userFlat = (user as any)?.flatNo || (user as any)?.flatNumber || "A-402";

  useEffect(() => {
    if (id) {
      assetService.getAssetById(id).then(item => {
        if (item) {
          setAsset(item);
        } else {
          toast.error("Asset not found in database.");
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [id]);

  const refreshAsset = async () => {
    if (id) {
      const item = await assetService.getAssetById(id);
      if (item) setAsset(item);
    }
  };

  const handleCheckout = async () => {
    if (!asset) return;
    const finalDuration = duration === "Custom" ? customDuration || "Custom Time" : duration;
    
    const updated = await assetService.checkoutAsset(asset.id, userName, userFlat, finalDuration);
    if (updated) {
      setAsset(updated);
      setIsSuccess(true);
      toast.success("Checkout confirmed!");
    } else {
      toast.error("Checkout failed.");
    }
  };

  const handleForceCheckout = async () => {
    if (!asset) return;
    // Force check-in first
    await assetService.checkinAsset(asset.id);
    // Then checkout to current user
    const finalDuration = duration === "Custom" ? customDuration || "Custom Time" : duration;
    const updated = await assetService.checkoutAsset(asset.id, userName, userFlat, finalDuration);
    if (updated) {
      setAsset(updated);
      setIsSuccess(true);
      toast.success("Force override successful!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen text-[#0d0d2b] flex flex-col items-center justify-center p-6 text-center bg-white">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Item Not Found</h2>
        <p className="text-[#6b7094] mb-6">The scanned QR code link is invalid or the item was removed.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white rounded-xl transition-all font-bold cursor-pointer">
          Go to Feed
        </button>
      </div>
    );
  }

  const isBorrowedByOthers = asset.status === "BORROWED" && asset.borrowedBy !== userName;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#ecfdf5] text-[#065f46] flex flex-col justify-between p-6">
        <Toaster position="top-center" richColors />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-[#065f46]">Checkout Confirmed!</h1>
          <p className="text-[#047857] text-sm leading-relaxed mb-6">
            You have checked out <span className="font-semibold text-emerald-800">{asset.name}</span>. Please return it within the committed timeline.
          </p>
          
          <div className="w-full bg-white border border-[#10b981]/20 rounded-2xl p-4 text-left space-y-3 mb-8 shadow-sm">
            <div className="flex justify-between text-xs">
              <span className="text-[#047857]">Borrower:</span>
              <span className="font-bold text-[#065f46]">{userName} ({userFlat})</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#047857]">Duration:</span>
              <span className="font-bold text-[#065f46]">{duration === "Custom" ? customDuration : duration}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#047857]">Checked Out At:</span>
              <span className="font-bold text-[#065f46]">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => {
              setIsSuccess(false);
              refreshAsset();
            }} 
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white font-bold rounded-2xl transition-all text-center cursor-pointer border-none"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#0d0d2b] flex flex-col justify-between p-6 font-sans bg-white">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer border border-transparent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Asset Quick checkout</span>
          <h1 className="text-lg font-black text-[#0d0d2b] truncate max-w-[280px] mt-0.5">Checking Out: {asset.name}</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Status Card */}
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider">Asset Details</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
              asset.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"
            }`}>
              {asset.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {asset.id.includes("drill") ? "🔨" : asset.id.includes("ladder") ? "🪜" : asset.id.includes("ps5") ? "🎮" : "📦"}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0d0d2b] leading-tight">{asset.name}</h2>
              <p className="text-xs text-[#6b7094] mt-1 font-mono">Asset ID: #{asset.id}</p>
            </div>
          </div>
        </div>

        {/* Contextual Alert / Form */}
        {isBorrowedByOthers ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-amber-800 text-sm">Item Marked as Borrowed</h3>
                <p className="text-xs text-amber-700/90 leading-relaxed mt-1">
                  According to the database logs, <span className="font-bold text-amber-900">{asset.borrowedBy} ({asset.borrowedByFlat})</span> currently has this item.
                </p>
              </div>
            </div>
            
            <p className="text-xs text-[#6b7094] leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
              If you are physically holding this tool right now, please override the record to update the system log.
            </p>

            <div className="pt-2">
              <span className="text-xs text-[#6b7094] block mb-2 font-bold uppercase tracking-wider">Select Duration before overriding:</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="3 Hours">3 Hours</option>
                <option value="1 Day">1 Day</option>
                <option value="Custom">Custom Duration</option>
              </select>
              
              {duration === "Custom" && (
                <input
                  type="text"
                  placeholder="e.g. 5 Hours, 2 Days"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 space-y-3 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <label className="text-xs font-bold text-[#6b7094] block uppercase tracking-wider">How long do you need this?</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="3 Hours">3 Hours</option>
                <option value="1 Day">1 Day</option>
                <option value="Custom">Custom Duration</option>
              </select>

              {duration === "Custom" && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Enter custom duration (e.g. 1 Week)"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
            
            <div className="bg-indigo-50/50 border border-[#6366f1]/12 rounded-2xl p-4 flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[#6b7094] text-xs leading-relaxed">
                Checking out will log your name <span className="font-bold text-[#0d0d2b]">{userName} ({userFlat})</span> and check-out timestamp in the ledger.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action Button */}
      <div className="pt-6">
        {isBorrowedByOthers ? (
          <button
            onClick={handleForceCheckout}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 text-white font-bold text-base rounded-2xl transition-all text-center cursor-pointer border-none uppercase tracking-wider"
          >
            Found It Here (Force Checkout)
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white font-bold text-base rounded-2xl transition-all text-center cursor-pointer border-none"
          >
            Confirm Checkout
          </button>
        )}
      </div>
    </div>
  );
}
