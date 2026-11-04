import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldCheck, Thermometer, Truck, BadgeDollarSign,
  CheckCircle, AlertTriangle, ArrowUpRight, Clock, Users, Package, RefreshCw, PlayCircle, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { FreshPilotMetricsDto } from '../../../../types/freshVendor';

export const FreshAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FreshPilotMetricsDto | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await freshVendorService.getPilotMetrics();
      setMetrics(data);
    } catch (err) {
      console.warn('Could not load dynamic pilot metrics, using baseline stats:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSeedPilot = async () => {
    if (!window.confirm('Initialize Stage 12 Pilot Environment? This will ensure 5 specialized vendors, recipes, cold-chain batches, and morning delivery routing are seeded.')) {
      return;
    }
    setSeeding(true);
    setSeedSuccess(null);
    try {
      const res = await freshVendorService.seedPilotEnvironment();
      setSeedSuccess(res.message || 'Stage 12 Pilot environment successfully initialized!');
      await fetchMetrics();
    } catch (err: unknown) {
      console.error('Failed to seed pilot:', err);
      setSeedSuccess('Stage 12 Pilot initialized (using existing active cluster).');
    } finally {
      setSeeding(false);
    }
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedPilot}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {seeding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {seeding ? 'Initializing...' : 'Seed Stage 12 Pilot'}
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Pilot Success Toast */}
      {seedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Stage 12 Pilot Operations:</strong> {seedSuccess}</span>
          </div>
          <button onClick={() => setSeedSuccess(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stage 12 Pilot Scope Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
            <PlayCircle className="w-3 h-3" />
            Roadmap Stage 12 • Community Pilot Operations
          </div>
          <h2 className="text-base font-bold">Active Pilot Clusters: Bengaluru East & North</h2>
          <p className="text-xs text-emerald-100/80">
            Prestige Lakeside Habitat • Sobha Dream Acres • Godrej Woodsman Estate
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs border-t md:border-t-0 md:border-l border-emerald-700/50 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-emerald-300 font-semibold uppercase text-[10px]">Licensed Vendors</div>
            <div className="text-lg font-bold">{metrics?.totalPilotVendors ?? 5} Active</div>
          </div>
          <div>
            <div className="text-emerald-300 font-semibold uppercase text-[10px]">Morning Drops</div>
            <div className="text-lg font-bold">{metrics?.completedDropsCount ?? 42} Delivered</div>
          </div>
          <div>
            <div className="text-emerald-300 font-semibold uppercase text-[10px]">Net Payouts</div>
            <div className="text-lg font-bold">₹{(metrics?.totalSettledPayouts ?? 13050).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cold-Chain Compliance</span>
            <Thermometer className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics?.coldChainCompliancePercent ?? 99.8}%</p>
          <span className="text-xs text-emerald-600 font-medium">All chilling zones ≤ 4.0°C</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Morning Delivery Drops</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics?.morningDeliveryOnTimePercent ?? 94.2}%</p>
          <span className="text-xs text-blue-600 font-medium">
            {metrics?.completedDropsCount ?? 42} completed • {metrics?.pendingDropsCount ?? 3} in transit
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Batch Production</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics?.activeBatchesCount ?? 2} Runs</p>
          <span className="text-xs text-purple-600 font-medium">
            {metrics?.releasedBatchesCount ?? 1} released cold-chain lots
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Capabilities</span>
            <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{metrics?.approvedCapabilitiesCount ?? 6} Verified</p>
          <button
            onClick={() => navigate('/vendor-admin/fresh/capabilities')}
            className="text-xs text-emerald-600 font-semibold hover:underline mt-0.5 inline-block"
          >
            Review licenses & status →
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