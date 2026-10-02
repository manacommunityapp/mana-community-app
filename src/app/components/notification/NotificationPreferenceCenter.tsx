import React, { useState, useEffect } from "react";
import {
  Bell,
  Moon,
  ShieldAlert,
  Smartphone,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  Save,
  Send,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import {
  unifiedNotificationService,
  type NotificationPreferenceDto,
  type NotificationCategory,
  type NotificationChannel,
  type UnifiedNotificationRequest,
  type UnifiedNotificationResult
} from "../../../services/notification/unifiedNotificationService";

interface Props {
  userId?: number;
}

const CATEGORIES: { key: NotificationCategory; label: string; desc: string; defaultChannels: NotificationChannel[] }[] = [
  { key: "EMERGENCY_SOS", label: "🚨 Emergency & SOS Alerts", desc: "Fire alarms, medical panic alerts, gate lockdowns", defaultChannels: ["IN_APP", "PUSH", "SMS", "WHATSAPP", "EMAIL"] },
  { key: "GATE_ACCESS", label: "🛡️ Gate & Visitor Access", desc: "Visitor entry approvals, delivery OTPs, barrier passes", defaultChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
  { key: "FINANCIAL_BILLING", label: "💳 Maintenance & Billing", desc: "Monthly invoices, payment receipts, overdue reminders", defaultChannels: ["IN_APP", "PUSH", "EMAIL", "WHATSAPP"] },
  { key: "HELPDESK_TICKET", label: "🛠️ Helpdesk & Complaints", desc: "Ticket status updates, technician arrival notifications", defaultChannels: ["IN_APP", "PUSH"] },
  { key: "COMMUNITY_NOTICE", label: "📢 Notices & Circulars", desc: "Official society announcements and AGM circulars", defaultChannels: ["IN_APP", "PUSH", "EMAIL"] },
  { key: "AMENITY_BOOKING", label: "🏸 Amenity & EV Charging", desc: "Slot confirmations, EV charging complete alerts", defaultChannels: ["IN_APP", "PUSH"] },
  { key: "CHAT_MESSAGE", label: "💬 Resident Direct Chat", desc: "New messages from neighbors and group chats", defaultChannels: ["IN_APP", "PUSH"] },
];

const CHANNELS: { key: NotificationChannel; label: string; icon: React.ReactNode }[] = [
  { key: "IN_APP", label: "In-App Feed", icon: <Bell className="w-4 h-4 text-indigo-500" /> },
  { key: "PUSH", label: "Mobile Push", icon: <Smartphone className="w-4 h-4 text-blue-500" /> },
  { key: "EMAIL", label: "Email", icon: <Mail className="w-4 h-4 text-emerald-500" /> },
  { key: "SMS", label: "SMS Text", icon: <Phone className="w-4 h-4 text-amber-500" /> },
  { key: "WHATSAPP", label: "WhatsApp", icon: <MessageSquare className="w-4 h-4 text-green-500" /> },
];

export const NotificationPreferenceCenter: React.FC<Props> = ({ userId = 1 }) => {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(true);
  const [quietHoursStart, setQuietHoursStart] = useState<string>("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>("07:00");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Test modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testCategory, setTestCategory] = useState<NotificationCategory>("GATE_ACCESS");
  const [testTitle, setTestTitle] = useState("Visitor Arrived at Main Gate");
  const [testBody, setTestBody] = useState("Swiggy delivery agent #402 is requesting entry approval.");
  const [testResult, setTestResult] = useState<UnifiedNotificationResult | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await unifiedNotificationService.getPreferences(userId);
      const prefMap: Record<string, boolean> = {};

      if (data && data.length > 0) {
        data.forEach((p) => {
          prefMap[`${p.category}_${p.channel}`] = p.isEnabled;
          if (p.quietHoursEnabled !== undefined) setQuietHoursEnabled(p.quietHoursEnabled);
          if (p.quietHoursStart) setQuietHoursStart(p.quietHoursStart);
          if (p.quietHoursEnd) setQuietHoursEnd(p.quietHoursEnd);
          if (p.timezone) setTimezone(p.timezone);
        });
      } else {
        // Defaults
        CATEGORIES.forEach((cat) => {
          CHANNELS.forEach((chan) => {
            prefMap[`${cat.key}_${chan.key}`] = cat.defaultChannels.includes(chan.key);
          });
        });
      }
      setPreferences(prefMap);
    } catch (err) {
      console.error("Failed to load preferences", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (cat: NotificationCategory, chan: NotificationChannel) => {
    // SOS is always forced on
    if (cat === "EMERGENCY_SOS") return;

    const key = `${cat}_${chan}`;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      for (const cat of CATEGORIES) {
        for (const chan of CHANNELS) {
          const key = `${cat.key}_${chan.key}`;
          const isEnabled = preferences[key] ?? true;

          await unifiedNotificationService.updatePreference(userId, {
            category: cat.key,
            channel: chan.key,
            isEnabled,
            quietHoursEnabled,
            quietHoursStart,
            quietHoursEnd,
            timezone,
          });
        }
      }
      setSuccessMsg("Notification preferences and quiet hours saved successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSaving(false);
    }
  };

  const executeTestSend = async () => {
    setSendingTest(true);
    try {
      const result = await unifiedNotificationService.orchestrate({
        recipientUserId: userId,
        category: testCategory,
        title: testTitle,
        body: testBody,
      });
      setTestResult(result);
    } catch (err) {
      console.error("Test send failed", err);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Bell className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Notification Preferences & Multi-Channel Router</h1>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Control delivery channels, set night quiet hours, and manage automated WhatsApp, SMS, and Push notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setTestResult(null);
              setTestModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Test Dispatch
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quiet Hours Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-800/60 rounded-xl text-indigo-300">
              <Moon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Night Quiet Hours & Do Not Disturb
                {quietHoursEnabled && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold rounded-full">
                    Active
                  </span>
                )}
              </h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Mutes intrusive SMS, Push, and WhatsApp notifications during sleep hours. In-app inbox stays updated.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        {quietHoursEnabled && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
          </div>
        )}

        <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Emergency Override:</strong> Critical SOS, fire panic triggers, and security gate lockdowns ALWAYS bypass quiet hours on all channels.
          </span>
        </div>
      </div>

      {/* Preferences Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Channel Subscriptions by Category</h2>
          <p className="text-slate-500 text-sm mt-0.5">Toggle delivery channels for each notification type</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Notification Category</th>
                {CHANNELS.map((chan) => (
                  <th key={chan.key} className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {chan.icon}
                      <span>{chan.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {CATEGORIES.map((cat) => (
                <tr key={cat.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800">{cat.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{cat.desc}</div>
                  </td>

                  {CHANNELS.map((chan) => {
                    const key = `${cat.key}_${chan.key}`;
                    const isEnabled = preferences[key] ?? true;
                    const isSos = cat.key === "EMERGENCY_SOS";

                    return (
                      <td key={chan.key} className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            disabled={isSos}
                            onChange={() => handleToggle(cat.key, chan.key)}
                            className="sr-only peer"
                          />
                          <div
                            className={`w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                              isSos
                                ? "bg-red-500 opacity-80 cursor-not-allowed"
                                : "peer-checked:bg-indigo-600"
                            }`}
                          ></div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Dispatch Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Simulate Multi-Channel Notification
              </h3>
              <button
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value as NotificationCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Body Text</label>
                <textarea
                  rows={3}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {testResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Dispatch Result: #{testResult.notificationId}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      testResult.overallDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {testResult.overallDelivered ? "Delivered" : "Suppressed/Pending"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  {testResult.channelReports.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
                    >
                      <span className="font-medium text-slate-800">{r.channel}</span>
                      <span
                        className={`font-semibold ${
                          r.status === "DELIVERED"
                            ? "text-emerald-600"
                            : r.status === "SUPPRESSED_QUIET_HOURS"
                            ? "text-indigo-600"
                            : r.status === "OPTED_OUT"
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={executeTestSend}
                disabled={sendingTest}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Trigger Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
