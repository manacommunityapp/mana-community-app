import React, { useState } from 'react';
import {
  Factory, CheckCircle2, AlertOctagon, Snowflake, Thermometer,
  Plus, Play, Check, X, ShieldAlert, FileText, ArrowRight, RefreshCw, BarChart2
} from 'lucide-react';

type BatchStatus = 'IN_PRODUCTION' | 'FERMENTING' | 'QUALITY_INSPECTION' | 'RELEASED' | 'QUARANTINED' | 'REJECTED';

interface QualityCheckItem {
  name: string;
  measuredValue: string;
  passed: boolean;
}

interface ProductionBatch {
  id: number;
  batchNumber: string;
  recipeName: string;
  productName: string;
  productionDate: string;
  rawInputQty: number;
  actualOutputQty: number;
  yieldPercent: number;
  wastageQty: number;
  status: BatchStatus;
  storageTempCelsius: number;
  expiryTimestamp: string;
  qualityChecks: QualityCheckItem[];
  releaseRemarks?: string;
}

const INITIAL_BATCHES: ProductionBatch[] = [
  {
    id: 1,
    batchNumber: 'BATCH-20261104-BT01',
    recipeName: 'Standard Idli Batter (BOM-01)',
    productName: 'Organic Idli Dosa Batter (1L)',
    productionDate: '2026-11-04',
    rawInputQty: 100,
    actualOutputQty: 92,
    yieldPercent: 92.0,
    wastageQty: 8,
    status: 'QUALITY_INSPECTION',
    storageTempCelsius: 3.5,
    expiryTimestamp: '2026-11-07 18:00',
    qualityChecks: [
      { name: 'Sensory / Aroma', measuredValue: 'Normal fermented aroma', passed: true },
      { name: 'pH / Acidity', measuredValue: '4.8 pH', passed: true },
      { name: 'Packaging Seal Integrity', measuredValue: 'Sealed 100%', passed: true },
    ]
  },
  {
    id: 2,
    batchNumber: 'BATCH-20261104-FC02',
    recipeName: 'Diced Papaya & Pineapple Mix',
    productName: 'Fresh Cut Tropical Fruit Bowl (250g)',
    productionDate: '2026-11-04',
    rawInputQty: 50,
    actualOutputQty: 42.5,
    yieldPercent: 85.0,
    wastageQty: 7.5,
    status: 'RELEASED',
    storageTempCelsius: 2.8,
    expiryTimestamp: '2026-11-05 20:00',
    qualityChecks: [
      { name: 'Visual Inspection', measuredValue: 'No browning, crisp texture', passed: true },
      { name: 'Core Temperature', measuredValue: '2.8°C', passed: true },
      { name: 'Modified Atmosphere Seal', measuredValue: 'Pass', passed: true },
    ],
    releaseRemarks: 'Released by Quality Manager. Cold-chain verified at 2.8°C.'
  },
  {
    id: 3,
    batchNumber: 'BATCH-20261104-NB03',
    recipeName: 'High Protein Athlete Fuel Box',
    productName: 'Sprouts & Paneer Salad Bowl',
    productionDate: '2026-11-04',
    rawInputQty: 30,
    actualOutputQty: 0,
    yieldPercent: 0,
    wastageQty: 0,
    status: 'IN_PRODUCTION',
    storageTempCelsius: 4.0,
    expiryTimestamp: '2026-11-06 12:00',
    qualityChecks: []
  }
];

export const FreshProcessingProductionHub: React.FC = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>(INITIAL_BATCHES);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  // New Batch Form State
  const [newBatchName, setNewBatchName] = useState('Standard Idli Batter (BOM-01)');
  const [newProductName, setNewProductName] = useState('Organic Idli Dosa Batter (1L)');
  const [newRawQty, setNewRawQty] = useState(100);
  const [newTargetTemp, setNewTargetTemp] = useState(3.0);

  // Output Modal State
  const [outputQty, setOutputQty] = useState(90);
  const [wastageQty, setWastageQty] = useState(10);
  const [wastageReason, setWastageReason] = useState('Skinning and grain residue');

  // QC Gate Modal State
  const [qcCoreTemp, setQcCoreTemp] = useState(3.2);
  const [qcSensoryPassed, setQcSensoryPassed] = useState(true);
  const [qcSealPassed, setQcSealPassed] = useState(true);
  const [qcRemarks, setQcRemarks] = useState('Verified cold storage and seal integrity.');

  const filteredBatches = batches.filter(b => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newB: ProductionBatch = {
      id: Date.now(),
      batchNumber: `BATCH-20261104-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      recipeName: newBatchName,
      productName: newProductName,
      productionDate: new Date().toISOString().split('T')[0],
      rawInputQty: Number(newRawQty),
      actualOutputQty: 0,
      yieldPercent: 0,
      wastageQty: 0,
      status: 'IN_PRODUCTION',
      storageTempCelsius: Number(newTargetTemp),
      expiryTimestamp: '2026-11-07 18:00',
      qualityChecks: []
    };
    setBatches([newB, ...batches]);
    setIsNewBatchModalOpen(false);
  };

  const handleRecordOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const yieldPct = (outputQty / selectedBatch.rawInputQty) * 100;
    setBatches(batches.map(b => {
      if (b.id === selectedBatch.id) {
        return {
          ...b,
          actualOutputQty: Number(outputQty),
          wastageQty: Number(wastageQty),
          yieldPercent: Number(yieldPct.toFixed(1)),
          status: 'QUALITY_INSPECTION'
        };
      }
      return b;
    }));
    setIsOutputModalOpen(false);
    setSelectedBatch(null);
  };

  const handleQualityGateDecision = (decision: 'RELEASED' | 'QUARANTINED') => {
    if (!selectedBatch) return;
    const checks: QualityCheckItem[] = [
      { name: 'Core Temperature', measuredValue: `${qcCoreTemp}°C`, passed: qcCoreTemp <= 4.0 },
      { name: 'Sensory & Freshness', measuredValue: qcSensoryPassed ? 'Pass' : 'Fail', passed: qcSensoryPassed },
      { name: 'Packaging Seal Integrity', measuredValue: qcSealPassed ? 'Airtight' : 'Damaged', passed: qcSealPassed }
    ];

    const allPassed = checks.every(c => c.passed) && decision === 'RELEASED';
    const finalStatus: BatchStatus = allPassed ? 'RELEASED' : 'QUARANTINED';

    setBatches(batches.map(b => {
      if (b.id === selectedBatch.id) {
        return {
          ...b,
          status: finalStatus,
          storageTempCelsius: qcCoreTemp,
          qualityChecks: checks,
          releaseRemarks: qcRemarks
        };
      }
      return b;
    }));
    setIsQualityModalOpen(false);
    setSelectedBatch(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mana Fresh Production & Cold-Chain Hub</h1>
              <p className="text-sm text-gray-500">BOM recipe execution, batch yield analytics & cold-chain quality gate</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsNewBatchModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Start Production Batch
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Production</span>
            <Play className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'IN_PRODUCTION').length}
          </p>
          <span className="text-xs text-blue-600 font-medium">Active processing runs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quality Gate Check</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'QUALITY_INSPECTION').length}
          </p>
          <span className="text-xs text-amber-600 font-medium">Awaiting QA & Temp verification</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Released / Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'RELEASED').length}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Cleared for dispatch routing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Yield Rate</span>
            <BarChart2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(batches.filter(b => b.yieldPercent > 0).reduce((acc, b) => acc + b.yieldPercent, 0) /
              (batches.filter(b => b.yieldPercent > 0).length || 1)).toFixed(1)}%
          </p>
          <span className="text-xs text-purple-600 font-medium">Production efficiency</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {['ALL', 'IN_PRODUCTION', 'QUALITY_INSPECTION', 'RELEASED', 'QUARANTINED'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === tab ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/75 text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Recipe & Product</th>
                <th className="py-3.5 px-4">Input / Output</th>
                <th className="py-3.5 px-4">Yield %</th>
                <th className="py-3.5 px-4">Storage Temp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBatches.map(batch => (
                <tr key={batch.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-900 font-mono text-xs">{batch.batchNumber}</span>
                    <div className="text-[11px] text-gray-400">Date: {batch.productionDate}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-800">{batch.productName}</div>
                    <div className="text-xs text-emerald-600">{batch.recipeName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-gray-800">{batch.actualOutputQty}</span> / {batch.rawInputQty} kg/L
                    {batch.wastageQty > 0 && (
                      <div className="text-[11px] text-rose-500">Wastage: {batch.wastageQty} kg</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      batch.yieldPercent >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {batch.yieldPercent > 0 ? `${batch.yieldPercent}%` : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg w-max">
                      <Thermometer className="w-3.5 h-3.5" />
                      {batch.storageTempCelsius}°C
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      batch.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700' :
                      batch.status === 'QUALITY_INSPECTION' ? 'bg-amber-50 text-amber-700' :
                      batch.status === 'QUARANTINED' ? 'bg-rose-50 text-rose-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {batch.status === 'RELEASED' && <CheckCircle2 className="w-3 h-3" />}
                      {batch.status === 'QUALITY_INSPECTION' && <ShieldAlert className="w-3 h-3" />}
                      {batch.status === 'QUARANTINED' && <AlertOctagon className="w-3 h-3" />}
                      {batch.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {batch.status === 'IN_PRODUCTION' && (
                      <button
                        onClick={() => { setSelectedBatch(batch); setOutputQty(batch.rawInputQty * 0.9); setIsOutputModalOpen(true); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                      >
                        Record Output
                      </button>
                    )}
                    {batch.status === 'QUALITY_INSPECTION' && (
                      <button
                        onClick={() => { setSelectedBatch(batch); setQcCoreTemp(batch.storageTempCelsius); setIsQualityModalOpen(true); }}
                        className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        Quality Gate
                      </button>
                    )}
                    {batch.status === 'RELEASED' && (
                      <span className="text-xs text-gray-400 font-medium">Ready for Dispatch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Start New Processing Batch</h2>
              <button onClick={() => setIsNewBatchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select BOM Recipe</label>
                <select
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white"
                >
                  <option value="Standard Idli Batter (BOM-01)">Standard Idli Batter (BOM-01)</option>
                  <option value="Diced Papaya & Pineapple Mix">Diced Papaya & Pineapple Mix (BOM-02)</option>
                  <option value="High Protein Athlete Fuel Box">High Protein Athlete Fuel Box (BOM-03)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Raw Material Input Quantity (kg / L)</label>
                <input
                  type="number"
                  value={newRawQty}
                  onChange={(e) => setNewRawQty(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cold Storage Target (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTargetTemp}
                  onChange={(e) => setNewTargetTemp(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                >
                  Initiate Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Output Modal */}
      {isOutputModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Record Production Output & Yield</h2>
              <button onClick={() => setIsOutputModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordOutput} className="space-y-4">
              <p className="text-xs text-gray-500">
                Batch: <strong className="text-gray-800">{selectedBatch.batchNumber}</strong> | Initial Input: <strong>{selectedBatch.rawInputQty} kg/L</strong>
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actual Finished Output (kg / L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={outputQty}
                  onChange={(e) => setOutputQty(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Wastage / Scrap (kg / L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wastageQty}
                  onChange={(e) => setWastageQty(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Wastage Reason</label>
                <input
                  type="text"
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-medium">
                Calculated Yield: {((outputQty / selectedBatch.rawInputQty) * 100).toFixed(1)}%
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOutputModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                >
                  Submit for QC Gate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quality Gate Inspection & Cold Chain Gate Modal */}
      {isQualityModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Cold-Chain Quality Gate Release</h2>
              <button onClick={() => setIsQualityModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <div className="font-semibold text-blue-900">Batch: {selectedBatch.batchNumber}</div>
                <div className="text-blue-700">Output: {selectedBatch.actualOutputQty} units | Yield: {selectedBatch.yieldPercent}%</div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Cold-Chain Core Temperature Verified (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={qcCoreTemp}
                  onChange={(e) => setQcCoreTemp(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  required
                />
                <span className="text-[11px] text-gray-400">Standard mandate: Must be ≤ 4.0°C</span>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={qcSensoryPassed}
                    onChange={(e) => setQcSensoryPassed(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Sensory Inspection (Color, aroma, crispness) PASSED
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={qcSealPassed}
                    onChange={(e) => setQcSealPassed(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Modified Atmosphere / Hermetic Seal PASSED
                </label>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">QA Release Remarks</label>
                <textarea
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => handleQualityGateDecision('QUARANTINED')}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold"
                >
                  Quarantine Batch
                </button>
                <button
                  type="button"
                  onClick={() => handleQualityGateDecision('RELEASED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Authorize Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshProcessingProductionHub;