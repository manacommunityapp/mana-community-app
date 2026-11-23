import { useState, useEffect, useCallback } from "react";
import {
  Zap, Droplet, Flame, Wifi, Tv, Car, Landmark, CreditCard,
  Search, CheckCircle2, AlertCircle, ArrowRight, RefreshCw,
  ShieldCheck, FileText, Download, Clock, ChevronRight
} from "lucide-react";
import {
  billerService,
  type BillerCategory,
  type BillerDto,
  type FetchedBillDto
} from "../../../services/finance/billerService";

interface CategoryMeta {
  key: BillerCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryMeta[] = [
  { key: "ELECTRICITY", label: "Electricity", icon: <Zap size={18} />, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { key: "WATER", label: "Water", icon: <Droplet size={18} />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { key: "GAS", label: "Piped Gas", icon: <Flame size={18} />, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  { key: "BROADBAND", label: "Broadband", icon: <Wifi size={18} />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { key: "DTH", label: "DTH / Cable", icon: <Tv size={18} />, color: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
  { key: "FASTAG", label: "FASTag", icon: <Car size={18} />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  { key: "MUNICIPAL_TAX", label: "Property Tax", icon: <Landmark size={18} />, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" }
];

export function BbpsUtilityPaymentHub() {
  const [activeCategory, setActiveCategory] = useState<BillerCategory>("ELECTRICITY");
  const [billers, setBillers] = useState<BillerDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBiller, setSelectedBiller] = useState<BillerDto | null>(null);
  const [consumerId, setConsumerId] = useState("");
  const [loadingBillers, setLoadingBillers] = useState(false);

  // Fetch Bill State
  const [fetchingBill, setFetchingBill] = useState(false);
  const [fetchedBill, setFetchedBill] = useState<FetchedBillDto | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Payment State
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const loadBillers = useCallback(async (cat: BillerCategory) => {
    setLoadingBillers(true);
    try {
      const data = await billerService.getBillersByCategory(cat);
      setBillers(data);
      setSelectedBiller(data[0] || null);
      setFetchedBill(null);
      setPaymentSuccess(false);
      setFetchError("");
    } catch (e) {
      console.error("Failed to load billers", e);
    } finally {
      setLoadingBillers(false);
    }
  }, []);

  useEffect(() => {
    loadBillers(activeCategory);
  }, [activeCategory, loadBillers]);

  const handleFetchBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiller || !consumerId.trim()) return;
    setFetchingBill(true);
    setFetchError("");
    setFetchedBill(null);
    setPaymentSuccess(false);
    try {
      const bill = await billerService.fetchBill(selectedBiller.id, consumerId.trim());
      setFetchedBill(bill);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch bill from biller. Check your Consumer ID.");
    } finally {
      setFetchingBill(false);
    }
  };

  const handlePayBill = async () => {
    if (!fetchedBill || !selectedBiller) return;
    setPaying(true);
    try {
      const res = await billerService.payBill({
        billerId: selectedBiller.id,
        consumerId: fetchedBill.consumerId,
        amount: fetchedBill.amount,
        billNumber: fetchedBill.billNumber
      });
      setPaymentRef(res.transactionRef);
      setPaymentSuccess(true);
      setFetchedBill(null);
    } catch (err: any) {
      alert("Payment failed: " + (err.message || "Please try again"));
    } finally {
      setPaying(false);
    }
  };

  const filteredBillers = billers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* BBPS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Zap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Utility Bill Payments</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <ShieldCheck size={14} className="text-blue-600" /> BBPS Certified
              </span>
            </div>
            <p className="text-sm text-gray-500">Pay electricity, water, gas, broadband, and municipal taxes via Bharat BillPay</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>NPCI Instant Settlement & GST Invoicing</span>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isActive = cat.key === activeCategory;
          return (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                setSearch("");
                setConsumerId("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition border ${
                isActive
                  ? `${cat.bg} ${cat.color} shadow-xs ring-2 ring-blue-500/20`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Biller List */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Biller</h3>
            <span className="text-xs text-gray-400">{filteredBillers.length} operators</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by state or board name..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loadingBillers ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <RefreshCw size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
                Loading authorized billers...
              </div>
            ) : filteredBillers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No billers found.</p>
            ) : (
              filteredBillers.map(b => {
                const isSelected = selectedBiller?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBiller(b);
                      setFetchedBill(null);
                      setFetchError("");
                      setPaymentSuccess(false);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-xs"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                        {b.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{b.shortName}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{b.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {b.state}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Bill Fetch & Payment Panel */}
        <div className="lg:col-span-7 space-y-6">
          {selectedBiller ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedBiller.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedBiller.name}</h2>
                    <p className="text-xs text-gray-500">Authorized BBPS Utility Provider · {selectedBiller.state}</p>
                  </div>
                </div>
              </div>

              {/* Payment Success View */}
              {paymentSuccess ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Utility Bill Paid Successfully!</h3>
                    <p className="text-sm text-gray-500 mt-1">Transaction Ref: <span className="font-mono font-bold text-gray-800">{paymentRef}</span></p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md mx-auto text-xs text-emerald-800">
                    Receipt has been stored in your Community Finance Vault. BBPS updates the service board within 2 hours.
                  </div>
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setFetchedBill(null);
                      setConsumerId("");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
                  >
                    Pay Another Bill
                  </button>
                </div>
              ) : (
                <>
                  {/* Fetch Bill Form */}
                  <form onSubmit={handleFetchBill} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {selectedBiller.consumerIdLabel} *
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={consumerId}
                          onChange={e => setConsumerId(e.target.value)}
                          placeholder={selectedBiller.consumerIdHint}
                          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={fetchingBill || !consumerId.trim()}
                          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                        >
                          {fetchingBill ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" /> Fetching...
                            </>
                          ) : (
                            <>
                              Fetch Bill <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        You can find this on your physical bill statement or SMS notification from {selectedBiller.shortName}.
                      </p>
                    </div>

                    {fetchError && (
                      <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{fetchError}</span>
                      </div>
                    )}
                  </form>

                  {/* Fetched Bill Details Card */}
                  {fetchedBill && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/80 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bill Statement</span>
                          <h4 className="text-base font-bold text-gray-900">{fetchedBill.customerName}</h4>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Due Date: {fetchedBill.dueDate}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-blue-100 text-xs">
                        <div>
                          <p className="text-gray-400">Bill Number</p>
                          <p className="font-mono font-bold text-gray-800">{fetchedBill.billNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Bill Date</p>
                          <p className="font-semibold text-gray-800">{fetchedBill.billDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Units Consumed</p>
                          <p className="font-semibold text-gray-800">{fetchedBill.units ? `${fetchedBill.units} kWh` : "Standard"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Consumer Account</p>
                          <p className="font-mono font-bold text-gray-800">{fetchedBill.consumerId}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div>
                          <p className="text-xs text-gray-500">Total Payable Amount</p>
                          <p className="text-3xl font-extrabold text-gray-900">
                            ₹{fetchedBill.amount.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <button
                          onClick={handlePayBill}
                          disabled={paying}
                          className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                        >
                          {paying ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" /> Processing Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard size={18} /> Pay ₹{fetchedBill.amount.toLocaleString("en-IN")} Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400 space-y-2">
              <Zap size={36} className="mx-auto text-gray-300" />
              <p className="font-medium">Select a utility operator to fetch and pay your bill</p>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs text-gray-600 flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">BBPS Assured Transaction Security</p>
              <p className="text-gray-500 mt-0.5">
                All bill settlements are processed through NPCI authorized Bharat Bill Payment Operating Units (BBPOU). Instant payment receipts and dispute resolution tracking are guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default BbpsUtilityPaymentHub;
