import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Camera, UploadCloud, AlertCircle, Loader2, Sparkles, Building2, Calendar, FileText, IndianRupee, Link, ChevronLeft } from "lucide-react";
import { assetService } from "../../../services/assetService";
import type { Asset } from "../../../services/assetService";
import { useAuth } from "../../../contexts/AuthContext";
import { toast, Toaster } from "sonner";

const VENDORS = [
  "BuildMart Hardware",
  "GreenScape Landscaping",
  "Electra World",
  "SuperGamer Zone",
  "FastFix Maintenance Ltd"
];

const CATEGORIES = [
  { value: "CapEx_Asset", label: "CapEx (Capital Asset Purchase)" },
  { value: "OpEx_Consumable", label: "OpEx (Consumables/Supplies)" },
  { value: "OpEx_Maintenance", label: "OpEx (Repairs & Maintenance)" },
  { value: "OpEx_Other", label: "OpEx (Other Operations)" }
];

export function ExpenseUpload({ isNested = false, onSubmitSuccess }: { isNested?: boolean; onSubmitSuccess?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("");
  const [ocrComplete, setOcrComplete] = useState(false);

  // Form State (parsed by OCR)
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<"CapEx_Asset" | "OpEx_Consumable" | "OpEx_Maintenance" | "OpEx_Other">("OpEx_Maintenance");
  
  const [linkAsset, setLinkAsset] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    assetService.getAssets().then(setAssets).catch(console.error);
  }, []);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      startOCRSimulation(file.name);
    }
  };

  const startOCRSimulation = (fileName: string) => {
    setIsProcessing(true);
    setOcrComplete(false);
    
    // Rotate processing messages for ultra-premium feel
    const messages = [
      "AI reading receipt totals...",
      "Extracting invoice date & number...",
      "Analyzing vendor invoice structures...",
      "Pre-populating expense parameters..."
    ];
    
    let step = 0;
    setProcessingText(messages[0]);
    const interval = setInterval(() => {
      step++;
      if (step < messages.length) {
        setProcessingText(messages[step]);
      }
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
      setOcrComplete(true);
      toast.success("Receipt scanned successfully by AI OCR!");

      // Simulate smart OCR parsing based on file names or random defaults
      const isLawnmower = fileName.toLowerCase().includes("lawn") || fileName.toLowerCase().includes("garden");
      
      if (isLawnmower) {
        setVendor("GreenScape Landscaping");
        setInvoiceNumber("INV-99081");
        setInvoiceDate(new Date().toISOString().split("T")[0]);
        setAmount(3200);
        setCategory("OpEx_Maintenance");
        setLinkAsset(true);
        // Prefill Honda Lawnmower
        const lawn = assets.find(a => a.id.includes("lawnmower"));
        if (lawn) setSelectedAssetId(lawn.id);
      } else {
        // General defaults
        setVendor(VENDORS[Math.floor(Math.random() * VENDORS.length)]);
        setInvoiceNumber(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        setInvoiceDate(new Date().toISOString().split("T")[0]);
        setAmount(parseFloat((500 + Math.random() * 5000).toFixed(2)));
        setCategory("OpEx_Maintenance");
      }
    }, 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !invoiceNumber || !invoiceDate || amount <= 0) {
      toast.error("Please fill all pre-filled fields correctly.");
      return;
    }

    await assetService.createExpense({
      invoiceNumber,
      invoiceDate,
      vendorName: vendor,
      totalAmount: amount,
      category,
      uploadedBy: user?.fullName || "Committee Member",
      receiptUrl: previewUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
      assetId: linkAsset ? selectedAssetId : undefined,
      upiId: `${vendor.toLowerCase().replace(/\s+/g, "")}@okaxis`,
      bankDetails: `${vendor} Operations, ICICI Bank, A/C: ${Math.floor(1000000000 + Math.random() * 9000000000)}, IFSC: ICIC0000011`
    });

    toast.success("Expense submitted to Treasurer approval queue!");
    setTimeout(() => {
      if (onSubmitSuccess) {
        onSubmitSuccess();
        // Reset local states to allow new scan
        setSelectedFile(null);
        setPreviewUrl(null);
        setOcrComplete(false);
      } else {
        navigate("/admin");
      }
    }, 1500);
  };

  return (
    <div className={isNested ? "text-[#0d0d2b] font-sans" : "min-h-screen text-[#0d0d2b] p-6 font-sans"}>
      {!isNested && <Toaster position="top-center" richColors />}
      
      {/* Header */}
      {!isNested && (
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Committee procurement</span>
            <h1 className="text-lg font-bold">1-Click Invoice Upload</h1>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto space-y-6">
        
        {/* Upload target area */}
        {!previewUrl && !isProcessing && (
          <div 
            onClick={triggerUpload}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-500/50 bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px] shadow-[0_4px_20px_rgba(99,102,241,0.03)]"
          >
            <input 
              type="file" 
              accept="image/*,application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="font-bold text-sm text-[#0d0d2b]">Tap to Snap or Upload Receipt</h3>
            <p className="text-xs text-[#6b7094] mt-2 max-w-[240px]">
              Launches native mobile camera or library to process invoice automatically.
            </p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="border border-slate-200 bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[220px] space-y-4 animate-pulse shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              <Sparkles className="h-5 w-5 text-indigo-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-indigo-600 text-sm tracking-wide">{processingText}</h3>
              <p className="text-[10px] text-[#6b7094]">Volunteers do zero manual entry. Please wait.</p>
            </div>
          </div>
        )}

        {/* Form area showing after OCR */}
        {ocrComplete && previewUrl && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-300">
            
            {/* Quick Preview Thumbnail */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-center shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <img src={previewUrl} alt="Receipt Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-indigo-600" /> AI OCR Pre-fill Complete
                </p>
                <h4 className="text-sm font-bold text-[#0d0d2b] truncate mt-1">Processed: {selectedFile?.name}</h4>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setOcrComplete(false);
                  }}
                  className="text-xs text-red-600 hover:text-red-500 mt-1 cursor-pointer font-medium"
                >
                  Clear and Resnap
                </button>
              </div>
            </div>

            {/* Fields form */}
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              
              <div>
                <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Vendor Name
                </label>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">Select Vendor</option>
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText className="h-3.5 w-3.5" /> Invoice No.
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <IndianRupee className="h-3.5 w-3.5" /> Total Amount (INR)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-lg font-bold text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  Expense Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Asset Linker Toggle */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkAsset}
                    onChange={(e) => setLinkAsset(e.target.checked)}
                    className="h-4.5 w-4.5 bg-white border-slate-200 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#0d0d2b]">Is this for a specific asset?</span>
                    <p className="text-[10px] text-[#6b7094] mt-0.5">Links charge directly to tool/machine TCO lifecycle</p>
                  </div>
                </label>

                {linkAsset && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="">Select Target Asset</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} (#{a.id})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-md shadow-indigo-500/20 transition-all text-center cursor-pointer"
            >
              Submit Expense for Approval
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
