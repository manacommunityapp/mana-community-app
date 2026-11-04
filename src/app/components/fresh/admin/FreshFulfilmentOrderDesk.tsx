import React, { useState, useEffect } from 'react';
import {
  PackageCheck, Split, Scale, AlertOctagon, CheckCircle2, Clock,
  Truck, ThermometerSnowflake, QrCode, KeyRound, ShieldAlert,
  ArrowRight, Search, RefreshCw, DollarSign, Loader2, AlertTriangle, Plus
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type {
  FulfilmentGroupDto, FulfilmentItemDto, WeightAdjustmentDto,
  ProductRecallDto, InitiateRecallRequest
} from '../../../../types/freshVendor';

export function FreshFulfilmentOrderDesk() {
  const [activeTab, setActiveTab] = useState<'FULFILMENT' | 'WEIGHTS' | 'RECALLS'>('FULFILMENT');
  const [orderIdInput, setOrderIdInput] = useState<number | ''>(500);
  const [groups, setGroups] = useState<FulfilmentGroupDto[]>([]);
  const [recalls, setRecalls] = useState<ProductRecallDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [splitting, setSplitting] = useState(false);

  // Weight Adjustment Modal states
  const [weighingItem, setWeighingItem] = useState<FulfilmentItemDto | null>(null);
  const [actualWeightG, setActualWeightG] = useState<number | ''>('');
  const [weightReason, setWeightReason] = useState('');
  const [submittingWeight, setSubmittingWeight] = useState(false);

  // Recall Modal states
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallProductId, setRecallProductId] = useState<number | ''>('');
  const [recallBatchId, setRecallBatchId] = useState<number | ''>('');
  const [recallSeverity, setRecallSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR'>('MAJOR');
  const [recallReason, setRecallReason] = useState('');
  const [recallRootCause, setRecallRootCause] = useState('');
  const [submittingRecall, setSubmittingRecall] = useState(false);

  const loadGroups = async () => {
    if (!orderIdInput) return;
    try {
      setLoading(true);
      const data = await freshVendorService.getOrderFulfilmentGroups(Number(orderIdInput));
      setGroups(data || []);
    } catch (err) {
      console.error('Failed to load fulfilment groups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitOrder = async () => {
    if (!orderIdInput) return;
    try {
      setSplitting(true);
      const data = await freshVendorService.splitOrderIntoGroups(Number(orderIdInput));
      setGroups(data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to split order into fulfilment groups');
    } finally {
      setSplitting(false);
    }
  };

  const loadRecalls = async () => {
    try {
      setLoading(true);
      const data = await freshVendorService.getAllProductRecalls();
      setRecalls(data || []);
    } catch (err) {
      console.error('Failed to load recalls', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'FULFILMENT') {
      loadGroups();
    } else if (activeTab === 'RECALLS') {
      loadRecalls();
    }
  }, [activeTab]);

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighingItem || !actualWeightG) return;

    try {
      setSubmittingWeight(true);
      await freshVendorService.recordActualWeight({
        fulfilmentItemId: weighingItem.id,
        actualWeightG: Number(actualWeightG),
        reason: weightReason || 'Scale recorded weight at hub dispatch',
      });
      setWeighingItem(null);
      setActualWeightG('');
      setWeightReason('');
      await loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to record actual weight');
    } finally {
      setSubmittingWeight(false);
    }
  };

  const handleInitiateRecallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallProductId || !recallReason) return;

    try {
      setSubmittingRecall(true);
      const payload: InitiateRecallRequest = {
        vendorProductId: Number(recallProductId),
        batchId: recallBatchId ? Number(recallBatchId) : undefined,
        severity: recallSeverity,
        reason: recallReason,
        detailedRootCause: recallRootCause,
        initiatedByUserId: 1, // Central Admin / QA Director
      };

      await freshVendorService.initiateProductRecall(payload);
      setShowRecallModal(false);
      resetRecallForm();
      await loadRecalls();
    } catch (err: any) {
      alert(err.message || 'Failed to initiate product recall');
    } finally {
      setSubmittingRecall(false);
    }
  };

  const handleProcessRefunds = async (recallId: number) => {
    try {
      await freshVendorService.processRecallRefunds(recallId);
      await loadRecalls();
      alert('All customer refunds and food safety notifications processed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to process recall refunds');
    }
  };

  const resetRecallForm = () => {
    setRecallProductId('');
    setRecallBatchId('');
    setRecallSeverity('MAJOR');
    setRecallReason('');
    setRecallRootCause('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
            <PackageCheck className="w-4 h-4" /> Fulfilment Operations & Safety Desk
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white m-0">
            Order Splitting, Loose Catch & Recall Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl m-0">
            Manage multi-vendor split orders across direct vendors and Mana hubs. Record loose catch scale weights with 15% tolerance checks, and execute emergency batch recalls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecallModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
          >
            <AlertOctagon className="w-4 h-4" /> Emergency Recall
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('FULFILMENT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'FULFILMENT'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Split className="w-4 h-4" /> Order Fulfilment Groups ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('RECALLS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'RECALLS'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Product Recalls & Food Safety ({recalls.length})
        </button>
      </div>

      {/* ── FULFILMENT GROUPS VIEW ── */}
      {activeTab === 'FULFILMENT' && (
        <div className="space-y-6">
          {/* Order Search & Split Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700">Order ID:</span>
              <input
                type="number"
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 500"
                className="w-32 text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={loadGroups}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Fetch Groups
              </button>
            </div>

            <button
              onClick={handleSplitOrder}
              disabled={splitting || !orderIdInput}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {splitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Split className="w-4 h-4" />}
              Split Mixed Order Automatically
            </button>
          </div>

          {/* Fulfilment Groups Cards */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading fulfilment groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 m-0">No Fulfilment Groups for Order #{orderIdInput}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Click <strong>"Split Mixed Order Automatically"</strong> to partition items by vendor, hub and cold-chain constraints.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {groups.map(grp => (
                <div key={grp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {grp.groupReference}
                        </span>
                        {grp.requiresColdChain && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                            <ThermometerSnowflake className="w-3 h-3 text-cyan-600" /> Cold Chain (2°C–4°C)
                          </span>
                        )}
                        {grp.isHandoverLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> LOCKED ({grp.failedOtpAttempts || 5} Failed OTPs)
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 m-0">
                        {grp.vendorBusinessName || 'Mana Central Fulfillment Hub'}
                      </h4>
                      <p className="text-[11px] text-slate-500 m-0">
                        Owner: <strong>{grp.fulfilmentOwnerType}</strong> &bull; Mode: <strong>{grp.deliveryMode}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {grp.status}
                      </span>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        ₹{grp.subtotalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Security Tokens */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Doorstep OTP</div>
                        <div className="font-mono font-black text-slate-900">{grp.handoverOtp}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">QR Token</div>
                        <div className="font-mono text-[10px] truncate max-w-[120px] font-semibold text-slate-700">
                          {grp.qrCodeToken}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Fulfilment Items ({grp.items.length})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {grp.items.map(item => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{item.productName}</div>
                            <div className="text-[11px] text-slate-500">
                              Qty: {item.requestedQuantity} {item.unitOfMeasure} @ ₹{item.unitPrice.toFixed(2)}
                              {item.isWeightAdjusted && (
                                <span className="ml-2 font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                  Scaled ({item.pickedQuantity} {item.unitOfMeasure})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              ₹{item.billedPrice.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setWeighingItem(item);
                                setActualWeightG(item.requestedQuantity * 1000);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Record Loose Scale Weight"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT RECALLS VIEW ── */}
      {activeTab === 'RECALLS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
              <p className="text-sm font-semibold">Auditing recall incidents...</p>
            </div>
          ) : recalls.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 m-0">Zero Food Safety Recalls</h3>
              <p className="text-xs text-slate-500 mt-1">All released batches comply with cold-chain and lab standards.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recalls.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {r.recallReference}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {r.severity} SEVERITY
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2 m-0">
                        {r.productName} {r.batchNumber ? `(Batch: ${r.batchNumber})` : ''}
                      </h3>
                      <p className="text-xs text-rose-800 font-medium mt-1 m-0">
                        Reason: {r.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-lg font-black text-slate-900">₹{r.totalRefundAmount.toFixed(2)}</div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">
                          {r.affectedOrdersCount} Orders / {r.affectedCustomersCount} Residents
                        </div>
                      </div>

                      {r.status === 'INITIATED' && (
                        <button
                          onClick={() => handleProcessRefunds(r.id)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                        >
                          Execute Customer Refunds
                        </button>
                      )}
                    </div>
                  </div>

                  {r.detailedRootCause && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Root Cause Investigation:</span> {r.detailedRootCause}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCALE WEIGHT RECORDING MODAL ── */}
      {weighingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 m-0 mb-1 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Loose Catch Scale Weigher
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter certified scale weight for <strong>{weighingItem.productName}</strong>. System applies 15% tolerance gate.
            </p>

            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requested Weight: {weighingItem.requestedQuantity} {weighingItem.unitOfMeasure}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Scale weight in Grams (e.g. 950 or 1050)"
                    value={actualWeightG}
                    onChange={e => setActualWeightG(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Grams
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="Scale calibration reference / trim details"
                  value={weightReason}
                  onChange={e => setWeightReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWeighingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWeight}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submittingWeight && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Record & Adjust Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EMERGENCY RECALL MODAL ── */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-rose-600 m-0 mb-1 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" /> Initiate Emergency Product Recall
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly quarantines stock batches, blocks doorstep scanner delivery, and computes customer refunds.
            </p>

            <form onSubmit={handleInitiateRecallSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Product ID *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1001"
                    value={recallProductId}
                    onChange={e => setRecallProductId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch ID (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 40"
                    value={recallBatchId}
                    onChange={e => setRecallBatchId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recall Severity *</label>
                <select
                  value={recallSeverity}
                  onChange={e => setRecallSeverity(e.target.value as any)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Microbiological / Toxin / Safety hazard)</option>
                  <option value="MAJOR">MAJOR (Cold-chain breakdown &gt; 8°C / Fermentation breach)</option>
                  <option value="MINOR">MINOR (Labelling discrepancy / Net weight error)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recall Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chiller compressor failure resulting in 12°C breach"
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Root Cause Investigation</label>
                <textarea
                  rows={2}
                  placeholder="Detailed root cause and preventive measures taken"
                  value={recallRootCause}
                  onChange={e => setRecallRootCause(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecallModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRecall}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submittingRecall && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Execute Emergency Recall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
