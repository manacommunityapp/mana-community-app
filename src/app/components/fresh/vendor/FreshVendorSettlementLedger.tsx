import React, { useState } from 'react';
import {
  BadgeDollarSign, TrendingUp, ArrowDownRight, ArrowUpRight,
  Download, CheckCircle, Clock, FileSpreadsheet, ShieldCheck
} from 'lucide-react';

interface SettlementItem {
  id: number;
  reference: string;
  period: string;
  grossAmount: number;
  manaCommission: number;
  deliveryFees: number;
  gatewayFee: number;
  netPayout: number;
  status: 'PROCESSED' | 'APPROVED' | 'PENDING';
  utrNumber?: string;
  processedDate?: string;
}

const SETTLEMENTS: SettlementItem[] = [
  {
    id: 1,
    reference: 'SETTLE-FRESH-20261028-V12-4A1B',
    period: '21 Oct 2026 – 27 Oct 2026',
    grossAmount: 48500.00,
    manaCommission: 4850.00,
    deliveryFees: 2400.00,
    gatewayFee: 970.00,
    netPayout: 45080.00,
    status: 'PROCESSED',
    utrNumber: 'HDFC261028994821',
    processedDate: '28 Oct 2026'
  },
  {
    id: 2,
    reference: 'SETTLE-FRESH-20261104-V12-9B7C',
    period: '28 Oct 2026 – 03 Nov 2026',
    grossAmount: 62400.00,
    manaCommission: 6240.00,
    deliveryFees: 3100.00,
    gatewayFee: 1248.00,
    netPayout: 58012.00,
    status: 'APPROVED',
    utrNumber: 'Pending Bank Transfer'
  }
];

export const FreshVendorSettlementLedger: React.FC = () => {
  const [settlements] = useState<SettlementItem[]>(SETTLEMENTS);

  const totalGross = settlements.reduce((a, b) => a + b.grossAmount, 0);
  const totalNet = settlements.reduce((a, b) => a + b.netPayout, 0);
  const totalCommission = settlements.reduce((a, b) => a + b.manaCommission, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mana Fresh Vendor Settlements & Payouts</h1>
              <p className="text-sm text-gray-500">Weekly automated reconciliation, commission statements & bank transfers</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => alert('Exporting full settlement ledger CSV...')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Statement
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Orders Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-gray-500">Daily baskets & group buys</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mana Platform Commission</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-amber-600 font-medium">Standard 10% fresh vendor fee</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Bank Payout</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-emerald-600 font-medium">Transferred to registered current account</span>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Reconciliation Statements</h2>
          <span className="text-xs text-gray-400">Weekly payout cycle: Tuesday 12:00 PM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/75 text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Statement Reference</th>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Gross Sales</th>
                <th className="py-3.5 px-4">Commission (10%)</th>
                <th className="py-3.5 px-4">Net Payout</th>
                <th className="py-3.5 px-4">Bank UTR Reference</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-900 font-mono text-xs">{item.reference}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800 text-xs">{item.period}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-800">₹{item.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-4 text-amber-700">₹{item.manaCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">₹{item.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{item.utrNumber || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700' :
                      item.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status === 'PROCESSED' && <CheckCircle className="w-3.5 h-3.5" />}
                      {item.status === 'APPROVED' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {item.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FreshVendorSettlementLedger;