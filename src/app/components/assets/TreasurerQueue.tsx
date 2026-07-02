import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Clipboard, Check, X, ShieldAlert, Award, FileText, ArrowUpRight, IndianRupee, Calendar, User, Search, CheckCircle2, ChevronRight, AlertCircle, Copy } from "lucide-react";
import { assetService } from "../../../services/assetService";
import type { Expense, Asset } from "../../../services/assetService";
import { useAuth } from "../../../contexts/AuthContext";
import { toast, Toaster } from "sonner";

export function TreasurerQueue({ isNested = false }: { isNested?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<Asset | null>(null);
  
  // Rejection input state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    assetService.getExpenses().then(setExpenses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedExpense?.assetId) {
      assetService.getAssetById(selectedExpense.assetId).then(asset => {
        setLinkedAsset(asset || null);
      }).catch(() => {
        setLinkedAsset(null);
      });
    } else {
      setLinkedAsset(null);
    }
  }, [selectedExpense]);

  const refreshExpenses = async () => {
    try {
      const data = await assetService.getExpenses();
      setExpenses(data);
      if (selectedExpense) {
        const updated = await assetService.getExpenseById(selectedExpense.id);
        setSelectedExpense(updated || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPaymentDetails = (exp: Expense) => {
    const details = exp.upiId || exp.bankDetails || "";
    if (details) {
      navigator.clipboard.writeText(details);
      toast.success("UPI ID / Payment details copied to clipboard!");
    } else {
      toast.error("No payment details found.");
    }
  };

  const handleApprove = async (exp: Expense) => {
    // Copy payment details to clipboard automatically
    handleCopyPaymentDetails(exp);
    
    // Call service to approve (which also increments asset TCO automatically!)
    const approved = await assetService.approveExpense(exp.id, "Approved by Treasurer");
    if (approved) {
      toast.success("Expense Approved! Payment details copied to clipboard.");
      await refreshExpenses();
      setSelectedExpense(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    if (!rejectionNotes.trim()) {
      toast.error("Please enter a reason for rejection.");
      return;
    }

    const rejected = await assetService.rejectExpense(selectedExpense.id, rejectionNotes);
    if (rejected) {
      toast.success("Expense request rejected.");
      setIsRejecting(false);
      setRejectionNotes("");
      await refreshExpenses();
      setSelectedExpense(null);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch = 
      e.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;

  return (
    <div className={isNested ? "text-[#0d0d2b] flex flex-col md:flex-row font-sans w-full" : "min-h-screen text-[#0d0d2b] flex flex-col md:flex-row font-sans"}>
      {!isNested && <Toaster position="top-center" richColors />}

      {/* Main List Section */}
      <div className={`flex-1 flex flex-col p-6 ${selectedExpense ? "hidden md:flex" : "flex"}`}>
        
        {/* Header */}
        {!isNested && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/admin")} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Treasury audits</span>
                <h1 className="text-lg font-bold">Quick-Approval Queue</h1>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 text-xs font-semibold">
                {pendingCount} Pending
              </span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7094]" />
            <input
              type="text"
              placeholder="Search vendor, invoice, or submitter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 text-[#6b7094] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="CapEx_Asset">CapEx</option>
            <option value="OpEx_Maintenance">Maintenance</option>
            <option value="OpEx_Consumable">Consumable</option>
          </select>
        </div>

        {/* Expense List Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#6b7094] text-sm">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              All caught up! No expenditures pending.
            </div>
          ) : (
            filtered.map((exp) => (
              <div 
                key={exp.id}
                onClick={() => {
                  setSelectedExpense(exp);
                  setIsRejecting(false);
                }}
                className={`bg-white border rounded-2xl p-4 shadow-[0_4px_20px_rgba(99,102,241,0.03)] transition-all hover:bg-slate-50 cursor-pointer flex justify-between items-center ${
                  selectedExpense?.id === exp.id ? "border-indigo-500/80 bg-indigo-50/30" : "border-[#6366f1]/12"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate text-[#0d0d2b]">{exp.vendorName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      exp.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border border-yellow-200" :
                      exp.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                      "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#6b7094]">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {exp.invoiceDate}</span>
                    <span className="truncate flex items-center gap-1"><User className="h-3 w-3" /> {exp.uploadedBy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-sm text-indigo-600">₹{exp.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-[#6b7094]">{exp.category.split("_")[1] || exp.category}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6b7094]" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Split-Screen Detail View (Desktop) / Expandable Drawer (Mobile) */}
      {selectedExpense && (
        <div className="w-full md:w-[460px] lg:w-[580px] bg-white border-l border-slate-200 flex flex-col h-full sticky top-0 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="font-bold text-base text-[#0d0d2b]">Expense Verification</h2>
              <p className="text-xs text-[#6b7094] mt-0.5">Invoice: {selectedExpense.invoiceNumber}</p>
            </div>
            <button 
              onClick={() => {
                setSelectedExpense(null);
                setIsRejecting(false);
              }}
              className="p-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Split Screen View: Receipt Image proof side-by-side with parsed fields */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Uploaded Receipt Image</span>
              <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50">
                <img 
                  src={selectedExpense.receiptUrl} 
                  alt="Invoice receipt proof" 
                  className="w-full h-full object-cover opacity-90"
                />
                <button 
                  onClick={() => window.open(selectedExpense.receiptUrl, "_blank")}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all text-[#0d0d2b] border border-slate-200 shadow-sm"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> Full Size
                </button>
              </div>
            </div>

            {/* Parsed Fields Information */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Parsed Database Records</span>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#6b7094]">Vendor:</span>
                  <p className="font-semibold text-[#0d0d2b] mt-0.5">{selectedExpense.vendorName}</p>
                </div>
                <div>
                  <span className="text-[#6b7094]">Amount:</span>
                  <p className="font-bold text-indigo-600 mt-0.5 text-sm">₹{selectedExpense.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[#6b7094]">Invoice Number:</span>
                  <p className="font-semibold text-[#0d0d2b] mt-0.5">{selectedExpense.invoiceNumber}</p>
                </div>
                <div>
                  <span className="text-[#6b7094]">Invoice Date:</span>
                  <p className="font-semibold text-[#0d0d2b] mt-0.5">{selectedExpense.invoiceDate}</p>
                </div>
                <div>
                  <span className="text-[#6b7094]">Expense Category:</span>
                  <p className="font-semibold text-[#0d0d2b] mt-0.5">{selectedExpense.category}</p>
                </div>
                <div>
                  <span className="text-[#6b7094]">Uploaded By:</span>
                  <p className="font-semibold text-[#0d0d2b] mt-0.5">{selectedExpense.uploadedBy}</p>
                </div>
              </div>

              {/* Linked Asset */}
              {selectedExpense.assetId && (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[#6b7094]">Linked Asset:</span>
                  <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200">
                    {linkedAsset?.name || `Asset #${selectedExpense.assetId}`}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Details Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-[0_4px_20px_rgba(99,102,241,0.03)]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Payment Settlement info</span>
                <button 
                  onClick={() => handleCopyPaymentDetails(selectedExpense)}
                  className="p-1 hover:bg-slate-100 rounded text-[#6b7094] hover:text-[#0d0d2b] transition-all cursor-pointer"
                  title="Copy settlement info"
                >
                  <Copy className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="text-xs space-y-2">
                {selectedExpense.upiId && (
                  <div className="flex justify-between">
                    <span className="text-[#6b7094]">UPI ID:</span>
                    <span className="font-mono text-[#374151]">{selectedExpense.upiId}</span>
                  </div>
                )}
                {selectedExpense.bankDetails && (
                  <div>
                    <span className="text-[#6b7094] block mb-1">Bank Account:</span>
                    <p className="font-mono text-[#374151] text-[11px] bg-slate-50 p-2 rounded border border-slate-200 leading-normal">{selectedExpense.bankDetails}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Micro input for rejection notes */}
            {isRejecting && (
              <form onSubmit={handleConfirmReject} className="space-y-3 bg-red-50 border border-red-200 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold text-red-600 block">Provide Rejection Reason (Required)</label>
                <input 
                  type="text" 
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Total amount does not match invoice details"
                  className="w-full bg-white border border-red-200 rounded-xl px-3 py-3 text-xs text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-400"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Confirm Reject
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Drawer Actions Footer */}
          {selectedExpense.status === "PENDING" && !isRejecting && (
            <div className="p-4 border-t border-slate-200 flex gap-3 bg-slate-50/60">
              <button 
                onClick={() => setIsRejecting(true)}
                className="flex-1 py-4 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button 
                onClick={() => handleApprove(selectedExpense)}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Approve & Pay
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
