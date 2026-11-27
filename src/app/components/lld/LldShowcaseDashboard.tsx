import React, { useState, useEffect } from "react";
import {
  Calculator, Shield, Bell, RefreshCw, CheckCircle, XCircle,
  ArrowRight, Gauge, AlertTriangle, Zap, Clock
} from "lucide-react";
import * as lldService from "../../../services/lld/lldShowcaseService";

type Tab = "feeEngine" | "rateLimiter" | "notifRouter";

export function LldShowcaseDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("feeEngine");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "feeEngine", label: "Fee & Penalty Engine", icon: <Calculator className="w-4 h-4" /> },
    { key: "rateLimiter", label: "Rate Limiter", icon: <Shield className="w-4 h-4" /> },
    { key: "notifRouter", label: "Notification Router", icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Low-Level Design Showcase</h1>
        <p className="text-gray-500 mt-1">Pluggable fee engine, sliding-window rate limiter, multi-channel notification router</p>
      </div>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>{tab.icon}{tab.label}</button>
          ))}
        </nav>
      </div>
      {activeTab === "feeEngine" && <FeeEnginePanel />}
      {activeTab === "rateLimiter" && <RateLimiterPanel />}
      {activeTab === "notifRouter" && <NotifRouterPanel />}
    </div>
  );
}

// ── Fee Engine Panel ──

function FeeEnginePanel() {
  const [rules, setRules] = useState<lldService.RuleInfo[]>([]);
  const [result, setResult] = useState<lldService.InvoiceBreakdown | null>(null);
  const [form, setForm] = useState({
    flatAreaSqft: "1200", flatType: "2BHK", overdueMonths: "2", outstandingAmount: "5000",
    gstExempt: false, hasActiveWaiver: false,
  });

  useEffect(() => { lldService.listFeeRules().then(r => setRules(r.data)).catch(() => {}); }, []);

  const calculate = async () => {
    try {
      const res = await lldService.calculateFees({
        communityId: 1, residentId: 1, flatNo: "A-101",
        flatAreaSqft: form.flatAreaSqft, flatType: form.flatType,
        overdueMonths: parseInt(form.overdueMonths), outstandingAmount: form.outstandingAmount,
        gstExempt: form.gstExempt, hasActiveWaiver: form.hasActiveWaiver,
      });
      setResult(res.data);
    } catch { console.error("Calculate failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>Strategy Pattern:</strong> Each fee rule implements <code>FeeRule</code> interface. Rules are registered by priority
        and evaluated in order. No if-else chains — add new rules by implementing the interface.
      </div>

      {/* Rules table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 font-semibold text-sm">Registered Rules (priority order)</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead><tr>
            <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Rule ID</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Description</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Priority</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {rules.map(r => (
              <tr key={r.ruleId}><td className="px-4 py-2 text-sm font-mono">{r.ruleId}</td>
                <td className="px-4 py-2 text-sm">{r.description}</td>
                <td className="px-4 py-2 text-sm">{r.priority}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculator */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Fee Calculator</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-xs text-gray-500">Area (sqft)</label>
            <input value={form.flatAreaSqft} onChange={e => setForm({...form, flatAreaSqft: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1" /></div>
          <div><label className="text-xs text-gray-500">Flat Type</label>
            <select value={form.flatType} onChange={e => setForm({...form, flatType: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              {["1BHK","2BHK","3BHK","4BHK","VILLA","STUDIO"].map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500">Overdue Months</label>
            <input value={form.overdueMonths} onChange={e => setForm({...form, overdueMonths: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1" /></div>
          <div><label className="text-xs text-gray-500">Outstanding (₹)</label>
            <input value={form.outstandingAmount} onChange={e => setForm({...form, outstandingAmount: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.gstExempt}
            onChange={e => setForm({...form, gstExempt: e.target.checked})} /> GST Exempt</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasActiveWaiver}
            onChange={e => setForm({...form, hasActiveWaiver: e.target.checked})} /> Active Waiver</label>
        </div>
        <button onClick={calculate} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <Calculator className="w-4 h-4 inline mr-1" /> Calculate
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Invoice Breakdown</h3>
          <div className="space-y-2">
            {result.lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-medium">₹{item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t-2 border-gray-200 space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{result.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-orange-600"><span>Penalties</span><span>₹{result.penalties.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-blue-600"><span>GST (18%)</span><span>₹{result.gst.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{result.grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rate Limiter Panel ──

function RateLimiterPanel() {
  const [stats, setStats] = useState<Record<string, lldService.RateLimitInfo>>({});
  const [testPartner, setTestPartner] = useState("swiggy");
  const [testResult, setTestResult] = useState<lldService.RateLimitDecision | null>(null);
  const [burstCount, setBurstCount] = useState(0);

  const loadStats = () => { lldService.getPartnerStats().then(r => setStats(r.data)).catch(() => {}); };
  useEffect(() => { loadStats(); }, []);

  const testRate = async () => {
    const res = await lldService.checkRate(testPartner, 1);
    setTestResult(res.data);
    loadStats();
  };

  const burstTest = async () => {
    setBurstCount(0);
    let allowed = 0;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await lldService.checkRate(testPartner, 1);
        if (res.data.allowed) allowed++;
      } catch { break; }
    }
    setBurstCount(allowed);
    loadStats();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>Sliding Window:</strong> Tracks per-request timestamps in a ConcurrentLinkedDeque. Expired entries evicted on each check.
        Meal-hour burst: 3x base limit during lunch (11–14) and dinner (18–22) hours. Dual key: partner + society.
      </div>

      {/* Partner stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(stats).map(([partner, info]) => (
          <div key={partner} className="bg-white border rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase">{partner}</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${info.remaining > 0 ? "text-green-600" : "text-red-600"}`}>{info.used}</span>
              <span className="text-gray-400">/ {info.limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${info.remaining > 0 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, (info.used / info.limit) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Test controls */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Test Rate Limiter</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">Partner</label>
            <select value={testPartner} onChange={e => setTestPartner(e.target.value)}
              className="border rounded px-3 py-2 text-sm mt-1">
              {["swiggy","zomato","dunzo","blinkit","amazon"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={testRate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            Single Request
          </button>
          <button onClick={burstTest} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
            <Zap className="w-4 h-4 inline mr-1" /> Burst 20 Requests
          </button>
          <button onClick={loadStats} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.allowed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {testResult.allowed ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
            {testResult.code}: {testResult.currentCount}/{testResult.limit}
            {!testResult.allowed && ` — retry in ${testResult.retryAfterMs}ms`}
          </div>
        )}
        {burstCount > 0 && (
          <div className="mt-2 text-sm text-gray-600">Burst test: {burstCount}/20 requests allowed</div>
        )}
      </div>
    </div>
  );
}

// ── Notification Router Panel ──

function NotifRouterPanel() {
  const [channels, setChannels] = useState<lldService.ChannelInfo[]>([]);
  const [result, setResult] = useState<lldService.RoutingResult | null>(null);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [form, setForm] = useState({
    urgency: "HIGH", title: "Visitor at gate", body: "John from Amazon is at Gate 1",
    category: "VISITOR_ARRIVAL", phone: "+919876543210", dndOverride: false,
  });

  useEffect(() => { lldService.listChannels().then(r => setChannels(r.data)).catch(() => {}); }, []);

  const send = async () => {
    setResult(null);
    try {
      const res = await lldService.sendNotification({
        recipientId: 1, recipientPhone: form.phone, urgency: form.urgency,
        title: form.title, body: form.body, category: form.category, dndOverride: form.dndOverride,
      });
      setResult(res.data);
    } catch { console.error("Send failed"); }
  };

  const toggleDnd = async () => {
    const newState = !dndEnabled;
    await lldService.setDnd(1, newState);
    setDndEnabled(newState);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>Chain of Responsibility + 10s Fallback:</strong> Channels tried in priority order (Push → VoIP → WhatsApp → SMS).
        If a channel fails or times out in 10s, falls through to the next. DND suppresses non-urgent notifications.
      </div>

      {/* Channel list */}
      <div className="flex gap-3">
        {channels.map((ch, i) => (
          <React.Fragment key={ch.channelId}>
            <div className="bg-white border rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-xs text-gray-500">Priority {ch.priority}</div>
              <div className="font-semibold text-sm mt-1">{ch.channelId}</div>
            </div>
            {i < channels.length - 1 && <ArrowRight className="w-5 h-5 text-gray-300 self-center" />}
          </React.Fragment>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Test Notification Dispatch</h3>
          <button onClick={toggleDnd} className={`px-3 py-1.5 rounded-lg text-sm ${
            dndEnabled ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
            {dndEnabled ? "DND: ON" : "DND: OFF"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500">Urgency</label>
            <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              {["CRITICAL","HIGH","MEDIUM","LOW"].map(u => <option key={u}>{u}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              {["VISITOR_ARRIVAL","PAYMENT_DUE","MAINTENANCE_UPDATE","SECURITY_ALERT","GENERAL"].map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500">Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1" /></div>
          <div className="col-span-2"><label className="text-xs text-gray-500">Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm mt-1" /></div>
          <label className="flex items-center gap-2 text-sm self-end">
            <input type="checkbox" checked={form.dndOverride} onChange={e => setForm({...form, dndOverride: e.target.checked})} />
            Force DND Override
          </label>
        </div>
        <button onClick={send} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <Bell className="w-4 h-4 inline mr-1" /> Send Notification
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`border rounded-lg p-4 ${result.delivered ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2 font-semibold text-sm mb-3">
            {result.delivered ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            {result.delivered ? "Delivered" : result.failureReason}
          </div>
          <div className="space-y-2">
            {result.attempts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded text-sm ${
                a.success ? "bg-green-100" : "bg-red-100"}`}>
                <div className="flex items-center gap-2">
                  {a.success ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium">{a.channelId}</span>
                  {a.messageId && <span className="text-xs text-gray-500">({a.messageId})</span>}
                  {a.errorReason && <span className="text-xs text-red-600">{a.errorReason}</span>}
                </div>
                <span className="text-xs"><Clock className="w-3 h-3 inline" /> {a.deliveryTimeMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
