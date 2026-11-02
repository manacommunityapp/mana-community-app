import React, { useState, useEffect } from "react";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Snowflake,
  Thermometer,
  ShieldCheck,
  Power,
  Plus,
  Clock,
  Layers,
  FileCheck,
  Sliders,
  TrendingUp,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  freshKitchenService,
  MOCK_FRESH_PRODUCTS,
} from "../../../../services/fresh-kitchen/freshKitchenService";
import type {
  VendorCapacity,
  FoodProductionBatch,
  CreateBatchReleaseRequest,
  BatchQaStatus,
} from "../../../../types/freshKitchen";

export function VendorProductionCapacityView() {
  const [capacity, setCapacity] = useState<VendorCapacity | null>(null);
  const [batches, setBatches] = useState<FoodProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTogglingSoldOut, setIsTogglingSoldOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Capacity Modal
  const [showEditCapacityModal, setShowEditCapacityModal] = useState(false);
  const [newMaxCapacity, setNewMaxCapacity] = useState<number>(500);
  const [newCutOffTime, setNewCutOffTime] = useState<string>("20:00");
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);

  // QA Batch Release Submission Modal
  const [showQaModal, setShowQaModal] = useState(false);
  const [batchForm, setBatchForm] = useState<CreateBatchReleaseRequest>({
    batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    productId: MOCK_FRESH_PRODUCTS[0].id,
    productName: MOCK_FRESH_PRODUCTS[0].name,
    quantityProduced: 200,
    unit: "Litres",
    phLevel: 4.4,
    recordedTemp: 3.2,
    fermentationHours: 14,
    qaInspectorName: "Ramanathan K. (QC Lead)",
    qaStatus: "PASSED",
    qaNotes: "Optimal sourness, aeration, and viscosity verified. Passed microbiological pre-check.",
    coldChainVerified: true,
    releaseSignature: "QC-APPROVED-SIG-99",
  });
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cap, bList] = await Promise.all([
        freshKitchenService.getVendorCapacity(),
        freshKitchenService.getProductionBatches(),
      ]);
      setCapacity(cap);
      setBatches(bList);
      setNewMaxCapacity(cap.maxDailyCapacityLitres);
      setNewCutOffTime(cap.cutOffTime || "20:00");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleSoldOut = async () => {
    if (!capacity) return;
    setIsTogglingSoldOut(true);
    try {
      const updated = await freshKitchenService.toggleVendorSoldOut(!capacity.isSoldOut);
      setCapacity(updated);
      showToast(
        updated.isSoldOut
          ? "Kitchen marked as SOLD OUT. New auto-orders and instant buys are paused."
          : "Kitchen opened! Accepting morning batter orders."
      );
    } finally {
      setIsTogglingSoldOut(false);
    }
  };

  const handleSaveCapacity = async () => {
    setIsUpdatingCapacity(true);
    try {
      const updated = await freshKitchenService.updateVendorCapacity({
        maxDailyCapacityLitres: newMaxCapacity,
        cutOffTime: newCutOffTime,
      });
      setCapacity(updated);
      setShowEditCapacityModal(false);
      showToast("Production capacity limits updated successfully.");
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  const handleProductSelectChange = (productId: string) => {
    const p = MOCK_FRESH_PRODUCTS.find((item) => item.id === productId);
    if (p) {
      setBatchForm((prev) => ({
        ...prev,
        productId: p.id,
        productName: p.name,
        unit: p.category === "CHUTNEY_PODI" ? "kg" : "Litres",
        fermentationHours: p.fermentationHours || 0,
      }));
    }
  };

  const handleSubmitBatchQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.coldChainVerified) {
      alert("Cold Chain (2°C - 4°C) must be verified before authorizing batch release.");
      return;
    }
    setIsSubmittingBatch(true);
    try {
      const created = await freshKitchenService.submitBatchQaRelease(batchForm);
      setBatches((prev) => [created, ...prev]);
      setShowQaModal(false);
      showToast(`Batch ${created.batchNumber} QA released successfully!`);
      // Regenerate batch number for next submission
      setBatchForm((prev) => ({
        ...prev,
        batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      }));
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading vendor capacity data...</p>
      </div>
    );
  }

  if (!capacity) return null;

  // Percentage color helper
  const getCapacityColor = (pct: number) => {
    if (pct >= 90) return { bar: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50" };
    if (pct >= 75) return { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
    return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const colors = getCapacityColor(capacity.capacityPercentage);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Kitchen Operations & Cold-Chain
              </span>
              {capacity.isSoldOut ? (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-300">
                  SOLD OUT / ORDERS LOCKED
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                  LIVE & ACCEPTING ORDERS
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Production Capacity & Batch QA Control
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live morning dispatch volume tracking, stone-grinder capacity thresholds, and cold-chain compliance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQaModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
            >
              <FileCheck className="w-4 h-4" />
              Submit Batch QA Release
            </button>

            <button
              onClick={handleToggleSoldOut}
              disabled={isTogglingSoldOut}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                capacity.isSoldOut
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {capacity.isSoldOut ? "Reopen Kitchen" : "Toggle SOLD OUT"}
            </button>

            <button
              onClick={() => setShowEditCapacityModal(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
              title="Edit Capacity"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Capacity Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Max Daily Capacity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Max Daily Grinding Limit</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {capacity.maxDailyCapacityLitres}
            <span className="text-xs font-normal text-slate-500 ml-1">Litres</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Cut-off: <b>{capacity.cutOffTime || "20:00"}</b> for next day 6 AM drop
          </div>
        </div>

        {/* Card 2: Booked Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Booked for Tomorrow</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {capacity.bookedCapacityLitres}
            <span className="text-xs font-normal text-slate-500 ml-1">Litres</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {capacity.activeOrdersCount || 142} resident orders scheduled
          </div>
        </div>

        {/* Card 3: Available Capacity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Remaining Headroom</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-900">
            {capacity.availableCapacityLitres}
            <span className="text-xs font-normal text-slate-500 ml-1">Litres</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {capacity.isSoldOut ? "Locked by Vendor" : "Open for instant orders"}
          </div>
        </div>

        {/* Card 4: Cold Chain Quality Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cold-Chain Monitor</span>
            <Thermometer className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 flex items-center gap-1.5">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            3.1°C
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold">
            Compliant with 2°C - 4°C Target
          </div>
        </div>
      </div>

      {/* Visual Capacity Utilization Progress Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-2">
            Capacity Utilization
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${colors.bg} ${colors.text}`}>
              {capacity.capacityPercentage}% Booked
            </span>
          </span>
          <span className="text-slate-500 font-normal">
            {capacity.bookedCapacityLitres}L of {capacity.maxDailyCapacityLitres}L utilized
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${Math.min(100, capacity.capacityPercentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>0 L (Idle)</span>
          <span>50% (Break-even: 250L)</span>
          <span>75% (Alert Threshold)</span>
          <span>100% (Full Cap: {capacity.maxDailyCapacityLitres}L)</span>
        </div>
      </div>

      {/* Production Batches List & QA Release Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Batch QA Release & Fermentation Logs ({batches.length})
            </h3>
            <p className="text-xs text-slate-500">
              Every batter and condiment batch must pass pH, aeration, and 2-4°C temperature checks before dispatch.
            </p>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Fermentation</th>
                <th className="py-3 px-4">pH Level</th>
                <th className="py-3 px-4">Cold-Chain Temp</th>
                <th className="py-3 px-4">QA Status</th>
                <th className="py-3 px-4">Inspector / Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {batch.batchNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {batch.productName}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {batch.quantityProduced} {batch.unit}
                  </td>
                  <td className="py-3.5 px-4">
                    {batch.fermentationHours ? `${batch.fermentationHours} Hours` : "Fresh Condiment"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {batch.phLevel ? batch.phLevel.toFixed(1) : "N/A"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      <Thermometer className="w-3 h-3 text-cyan-600" />
                      {batch.recordedTemp ? `${batch.recordedTemp}°C` : "2-4°C"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {batch.qaStatus === "PASSED" ? (
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 w-max">
                        <Check className="w-3 h-3 stroke-[3]" />
                        RELEASED
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-amber-300">
                        {batch.qaStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{batch.qaInspectorName}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {batch.releaseSignature || "AUTO-VERIFIED"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Capacity Modal ── */}
      {showEditCapacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Capacity Parameters
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Update Production Limits
                </h3>
              </div>
              <button
                onClick={() => setShowEditCapacityModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Max Daily Grinding Capacity (Litres):
                </label>
                <input
                  type="number"
                  value={newMaxCapacity}
                  onChange={(e) => setNewMaxCapacity(Number(e.target.value))}
                  min={50}
                  step={50}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daily Order Cut-off Time (24h format):
                </label>
                <input
                  type="text"
                  value={newCutOffTime}
                  onChange={(e) => setNewCutOffTime(e.target.value)}
                  placeholder="20:00"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Orders placed after this cut-off will roll over to the subsequent morning delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditCapacityModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCapacity}
                disabled={isUpdatingCapacity}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {isUpdatingCapacity ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Batch QA Release Modal ── */}
      {showQaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  FSSAI Quality Assurance
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Submit Production Batch QA Release
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative record certifying cold-chain temperature and fermentation acidity.
                </p>
              </div>
              <button
                onClick={() => setShowQaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBatchQa} className="space-y-4 my-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Batch Number:
                  </label>
                  <input
                    type="text"
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Product:
                  </label>
                  <select
                    value={batchForm.productId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {MOCK_FRESH_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Quantity Produced:
                  </label>
                  <input
                    type="number"
                    value={batchForm.quantityProduced}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, quantityProduced: Number(e.target.value) })
                    }
                    min={1}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    pH Level (4.2 - 4.6):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={batchForm.phLevel}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, phLevel: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Chamber Temp (°C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={batchForm.recordedTemp}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, recordedTemp: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fermentation Hours:
                  </label>
                  <input
                    type="number"
                    value={batchForm.fermentationHours}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, fermentationHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    QA Status:
                  </label>
                  <select
                    value={batchForm.qaStatus}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, qaStatus: e.target.value as BatchQaStatus })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="PASSED">PASSED (Release for dispatch)</option>
                    <option value="PENDING">PENDING (More testing)</option>
                    <option value="REJECTED">REJECTED (Do not dispatch)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Inspector Name & Authorization:
                </label>
                <input
                  type="text"
                  value={batchForm.qaInspectorName}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, qaInspectorName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quality & Microbe Assessment Notes:
                </label>
                <textarea
                  rows={2}
                  value={batchForm.qaNotes || ""}
                  onChange={(e) => setBatchForm({ ...batchForm, qaNotes: e.target.value })}
                  placeholder="Aroma, batter aeration, yeast activity, texture..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Mandatory Cold-Chain Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.coldChainVerified}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, coldChainVerified: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-cyan-950">
                  I certify that the 2°C - 4°C chilled cold chain is active and insulated packing is prepared.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQaModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingBatch ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  Authorize Batch Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default VendorProductionCapacityView;
