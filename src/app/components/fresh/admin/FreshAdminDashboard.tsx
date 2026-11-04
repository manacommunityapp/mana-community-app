import React, { useState } from 'react';
import {
  Activity, ShieldCheck, Thermometer, Truck, BadgeDollarSign,
  CheckCircle, AlertTriangle, ArrowUpRight, Clock, Users, Package, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router';

export const FreshAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mana Fresh Central Operations Command</h1>
              <p className="text-sm text-gray-500">Real-time network oversight, cold-chain compliance & automated reconciliation</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cold-Chain Compliance</span>
            <Thermometer className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">99.8%</p>
          <span className="text-xs text-emerald-600 font-medium">All chilling zones ≤ 4.0°C</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Morning Delivery Drops</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">94.2%</p>
          <span className="text-xs text-blue-600 font-medium">1,480 of 1,570 completed by 07:30 AM</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Batch Production</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">18 Runs</p>
          <span className="text-xs text-purple-600 font-medium">Across 8 licensed fresh vendors</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Price Approvals</span>
            <BadgeDollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">3 Items</p>
          <button
            onClick={() => navigate('/vendor-admin/fresh/pricing')}
            className="text-xs text-amber-600 font-semibold hover:underline mt-0.5 inline-block"
          >
            Review margins & approve →
          </button>
        </div>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Compliance Desks */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Operational Desks</h2>

          <div
            onClick={() => navigate('/vendor-admin/fresh/capabilities')}
            className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-emerald-300 shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Vendor Capability Verification</h3>
                  <p className="text-xs text-gray-400">FSSAI license check & cold-chain audit</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => navigate('/vendor-admin/fresh/pricing')}
            className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-amber-300 shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <BadgeDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Pricing Margin Simulator & Gate</h3>
                  <p className="text-xs text-gray-400">Review vendor cost + 10% Mana commission</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => navigate('/vendor-admin/fresh/dispatch')}
            className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-cyan-300 shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Central Dispatch & Route Logistics</h3>
                  <p className="text-xs text-gray-400">Community morning crates & drop sequencing</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div
            onClick={() => navigate('/vendor-admin/fresh/settlements')}
            className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-purple-300 shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Vendor Settlements & Payouts</h3>
                  <p className="text-xs text-gray-400">Weekly bank transfer reconciliation & UTR</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Right: Active Community Waves & Quality Watchlist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Morning Dispatch Waves Status</h3>
                <p className="text-xs text-gray-400">Community clusters receiving morning deliveries</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                Live Wave 1 Active
              </span>
            </div>

            <div className="space-y-3">
              {[
                { community: 'Prestige Lakeside Habitat', batches: 'RUN-20261104-PL01', drops: '42 / 45', temp: '3.2°C', status: 'IN_TRANSIT' },
                { community: 'Sobha Dream Acres', batches: 'RUN-20261104-PL02', drops: '30 / 30', temp: '2.9°C', status: 'COMPLETED' },
                { community: 'Godrej Woodsman Estate', batches: 'RUN-20261104-GW03', drops: '18 / 20', temp: '3.5°C', status: 'IN_TRANSIT' },
              ].map(c => (
                <div key={c.community} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{c.community}</span>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{c.batches}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{c.drops} Drops</div>
                      <div className="text-cyan-600 font-medium">Core Temp: {c.temp}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                      c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Automated FSSAI & Cold-Chain Safeguards
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Any batch recording storage temperature exceeding <strong>4.0°C</strong> or lacking verified quality release sign-off
              is automatically barred from dispatch route allocation. Unreleased lots cannot be scanned by community delivery runners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreshAdminDashboard;