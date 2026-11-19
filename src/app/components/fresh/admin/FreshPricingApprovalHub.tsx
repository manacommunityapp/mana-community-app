import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, DollarSign, Package, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface PricingRecord {
  id: number;
  vendorProductId: number;
  productName: string;
  vendorCostPrice: number;
  manaCommissionPct: number;
  deliveryFee: number;
  packagingFee: number;
  gstRatePct: number;
  residentSellingPrice: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  adminApproved: boolean;
  adminApprovedAt?: string;
}

// Mock data for demonstration
const MOCK_PENDING: PricingRecord[] = [
  {
    id: 1, vendorProductId: 101, productName: 'Alphonso Mangoes (Grade A)',
    vendorCostPrice: 150, manaCommissionPct: 10, deliveryFee: 10, packagingFee: 5,
    gstRatePct: 5, residentSellingPrice: 184.80, effectiveFrom: '2026-11-01',
    isActive: true, adminApproved: false
  },
  {
    id: 2, vendorProductId: 102, productName: 'Idli Batter (1 litre)',
    vendorCostPrice: 55, manaCommissionPct: 10, deliveryFee: 5, packagingFee: 3,
    gstRatePct: 5, residentSellingPrice: 68.25, effectiveFrom: '2026-11-01',
    isActive: true, adminApproved: false
  },
  {
    id: 3, vendorProductId: 103, productName: 'Chicken Curry Cut (500g)',
    vendorCostPrice: 180, manaCommissionPct: 12, deliveryFee: 15, packagingFee: 8,
    gstRatePct: 5, residentSellingPrice: 229.74, effectiveFrom: '2026-11-02',
    isActive: true, adminApproved: false
  },
];

const FreshPricingApprovalHub: React.FC = () => {
  const [pending, setPending] = useState<PricingRecord[]>(MOCK_PENDING);
  const [approved, setApproved] = useState<PricingRecord[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = async (record: PricingRecord) => {
    setProcessing(record.id);
    try {
      await new Promise(r => setTimeout(r, 600)); // mock API call
      setPending(prev => prev.filter(p => p.id !== record.id));
      setApproved(prev => [...prev, { ...record, adminApproved: true, adminApprovedAt: new Date().toISOString() }]);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await new Promise(r => setTimeout(r, 600)); // mock API call
      setPending(prev => prev.filter(p => p.id !== id));
    } finally {
      setProcessing(null);
    }
  };

  const margin = (r: PricingRecord) =>
    ((r.residentSellingPrice - r.vendorCostPrice) / r.residentSellingPrice * 100).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Approval Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve vendor-submitted pricing before it goes live to residents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={24} className="text-amber-600" />
          <div>
            <div className="text-2xl font-bold text-amber-800">{pending.length}</div>
            <div className="text-xs text-amber-600">Pending Review</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600" />
          <div>
            <div className="text-2xl font-bold text-green-800">{approved.length}</div>
            <div className="text-xs text-green-600">Approved Today</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp size={24} className="text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-blue-800">
              {pending.length > 0 ? `${margin(pending[0])}%` : '—'}
            </div>
            <div className="text-xs text-blue-600">Avg Mana Margin</div>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          Pending Approval
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
            All pricing has been reviewed!
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(record => (
              <div key={record.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-gray-500" />
                      <span className="font-semibold text-gray-900">{record.productName}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Product #{record.vendorProductId}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                      Effective from: {record.effectiveFrom}
                    </div>
                    <div className="grid grid-cols-5 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Vendor Cost</div>
                        <div className="font-semibold">₹{record.vendorCostPrice}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Commission</div>
                        <div className="font-semibold">{record.manaCommissionPct}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Fees</div>
                        <div className="font-semibold">₹{record.deliveryFee + record.packagingFee}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">GST</div>
                        <div className="font-semibold">{record.gstRatePct}%</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <div className="text-xs text-green-600 mb-0.5">Resident Price</div>
                        <div className="font-bold text-green-700">₹{record.residentSellingPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Mana margin: <span className="font-semibold text-gray-700">{margin(record)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(record)}
                      disabled={processing === record.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      <CheckCircle size={15} />
                      {processing === record.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(record.id)}
                      disabled={processing === record.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 text-sm font-medium"
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved today */}
      {approved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            Approved This Session
          </h2>
          <div className="space-y-2">
            {approved.map(record => (
              <div key={record.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="font-medium text-gray-800">{record.productName}</span>
                  <span className="text-sm text-gray-500">→ ₹{record.residentSellingPrice.toFixed(2)}</span>
                </div>
                <div className="text-xs text-green-600 font-medium">Live</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshPricingApprovalHub;