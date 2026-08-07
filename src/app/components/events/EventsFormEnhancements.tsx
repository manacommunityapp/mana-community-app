import { useState } from "react";
import {
  Mail, Bell, BellRing, Send, Clock, CheckCircle2, XCircle, Plus, Trash2,
  Users, UserPlus, ArrowUpDown, AlertCircle, CreditCard, IndianRupee,
  QrCode, Smartphone, CreditCard as CardIcon, Building2,
  Shield, UserCheck, ThumbsUp, ThumbsDown, Eye, RotateCcw,
  Languages, Globe, ChevronDown,
  Palette, Image, Type, Paintbrush,
  BarChart3, TrendingUp, TrendingDown, PieChart, Activity, MousePointer,
  LayoutTemplate, Copy, Star, Sparkles, FileText, Download,
  Calendar, Timer, Hash, Zap, Lock,
  Settings2, GitBranch, EyeOff, ChevronRight,
  ToggleLeft, Pencil, X, Check, Save,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";

/* ════════════════════════════════════════════════════════
   1. EMAIL NOTIFICATIONS
   ════════════════════════════════════════════════════════ */

interface EmailNotificationConfig {
  enabled: boolean;
  confirmationEmail: boolean;
  reminderEmail: boolean;
  reminderDaysBefore: number;
  updateEmail: boolean;
  cancellationEmail: boolean;
  waitlistEmail: boolean;
  customSenderName: string;
  customReplyTo: string;
  confirmationSubject: string;
  confirmationBody: string;
}

const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  enabled: true,
  confirmationEmail: true,
  reminderEmail: true,
  reminderDaysBefore: 2,
  updateEmail: true,
  cancellationEmail: true,
  waitlistEmail: true,
  customSenderName: "Mana Community Events",
  customReplyTo: "",
  confirmationSubject: "Registration Confirmed — {{eventName}}",
  confirmationBody: "Dear {{name}},\n\nThank you for registering for {{eventName}}!\n\nEvent Date: {{eventDate}}\nVenue: {{venue}}\nRegistration ID: {{regId}}\n\nPlease keep this email for your records.\n\nBest regards,\nMana Community",
};

export function EmailNotificationSettings({ config: initial, onChange }: {
  config?: EmailNotificationConfig;
  onChange: (config: EmailNotificationConfig) => void;
}) {
  const [config, setConfig] = useState<EmailNotificationConfig>(initial ?? DEFAULT_EMAIL_CONFIG);
  const [editingTemplate, setEditingTemplate] = useState(false);

  const update = <K extends keyof EmailNotificationConfig>(key: K, value: EmailNotificationConfig[K]) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    onChange(next);
  };

  const triggers = [
    { key: "confirmationEmail" as const, label: "Confirmation Email", desc: "Sent immediately after registration", icon: CheckCircle2, color: "text-emerald-500" },
    { key: "reminderEmail" as const, label: "Event Reminder", desc: `Sent ${config.reminderDaysBefore} day(s) before the event`, icon: BellRing, color: "text-amber-500" },
    { key: "updateEmail" as const, label: "Event Updates", desc: "Sent when event details change", icon: Bell, color: "text-blue-500" },
    { key: "cancellationEmail" as const, label: "Cancellation Notice", desc: "Sent when registration is cancelled", icon: XCircle, color: "text-rose-500" },
    { key: "waitlistEmail" as const, label: "Waitlist Notification", desc: "Sent when spot opens from waitlist", icon: UserPlus, color: "text-violet-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Email Notifications</h4>
            <p className="text-[10px] text-slate-400">Configure automated email triggers</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update("enabled", v)} />
      </div>

      {config.enabled && (
        <>
          {/* Sender Settings */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h5 className="text-xs font-semibold text-slate-600">Sender Settings</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Sender Name</Label>
                <Input className="h-8 text-xs" value={config.customSenderName}
                  onChange={e => update("customSenderName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reply-To Email</Label>
                <Input className="h-8 text-xs" type="email" placeholder="noreply@manacommunity.com"
                  value={config.customReplyTo} onChange={e => update("customReplyTo", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Email Triggers */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Email Triggers</h5>
            {triggers.map(t => (
              <div key={t.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-3">
                  <t.icon className={cn("w-4 h-4", t.color)} />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{t.label}</p>
                    <p className="text-[10px] text-slate-400">{t.desc}</p>
                  </div>
                </div>
                <Switch checked={config[t.key]} onCheckedChange={v => update(t.key, v)} />
              </div>
            ))}
          </div>

          {/* Reminder Timing */}
          {config.reminderEmail && (
            <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-700">Reminder Timing</p>
                <p className="text-[10px] text-amber-500">Send reminder before the event</p>
              </div>
              <div className="flex items-center gap-2">
                <Input className="w-16 h-7 text-xs text-center" type="number" min={1} max={30}
                  value={config.reminderDaysBefore}
                  onChange={e => update("reminderDaysBefore", Number(e.target.value))} />
                <span className="text-xs text-amber-600">days</span>
              </div>
            </div>
          )}

          {/* Email Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-600">Confirmation Template</h5>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1"
                onClick={() => setEditingTemplate(!editingTemplate)}>
                <Pencil className="w-3 h-3" /> {editingTemplate ? "Done" : "Edit"}
              </Button>
            </div>
            {editingTemplate ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Subject</Label>
                  <Input className="h-8 text-xs" value={config.confirmationSubject}
                    onChange={e => update("confirmationSubject", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Body</Label>
                  <Textarea className="text-xs min-h-[120px] font-mono" value={config.confirmationBody}
                    onChange={e => update("confirmationBody", e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {["{{name}}", "{{eventName}}", "{{eventDate}}", "{{venue}}", "{{regId}}"].map(v => (
                    <Badge key={v} variant="outline" className="text-[9px] cursor-pointer hover:bg-indigo-50">{v}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Send className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-600">Subject:</span>
                  <span className="text-slate-500">{config.confirmationSubject}</span>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-pre-line line-clamp-3">{config.confirmationBody}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   2. WAITLIST MANAGEMENT
   ════════════════════════════════════════════════════════ */

interface WaitlistConfig {
  enabled: boolean;
  maxWaitlistSize: number;
  autoPromote: boolean;
  promotionOrder: "fifo" | "priority" | "random";
  notifyOnSpotOpen: boolean;
  expiryHours: number;
  showPositionToUser: boolean;
}

const DEFAULT_WAITLIST_CONFIG: WaitlistConfig = {
  enabled: false,
  maxWaitlistSize: 100,
  autoPromote: true,
  promotionOrder: "fifo",
  notifyOnSpotOpen: true,
  expiryHours: 24,
  showPositionToUser: true,
};

const MOCK_WAITLIST = [
  { id: 1, name: "Sneha Patil", position: 1, joinedAt: "2h ago", email: "sneha@email.com", status: "waiting" as const },
  { id: 2, name: "Rohan Gupta", position: 2, joinedAt: "3h ago", email: "rohan@email.com", status: "waiting" as const },
  { id: 3, name: "Meera Joshi", position: 3, joinedAt: "5h ago", email: "meera@email.com", status: "notified" as const },
  { id: 4, name: "Arun Nair", position: 4, joinedAt: "6h ago", email: "arun@email.com", status: "waiting" as const },
  { id: 5, name: "Divya Shah", position: 5, joinedAt: "8h ago", email: "divya@email.com", status: "expired" as const },
];

export function WaitlistSettings({ config: initial, onChange }: {
  config?: WaitlistConfig;
  onChange: (config: WaitlistConfig) => void;
}) {
  const [config, setConfig] = useState<WaitlistConfig>(initial ?? DEFAULT_WAITLIST_CONFIG);

  const update = <K extends keyof WaitlistConfig>(key: K, value: WaitlistConfig[K]) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Waitlist Management</h4>
            <p className="text-[10px] text-slate-400">Auto-queue when capacity is full</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update("enabled", v)} />
      </div>

      {config.enabled && (
        <>
          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <Label className="text-xs">Max Waitlist Size</Label>
              <Input className="h-8 text-xs" type="number" min={1} value={config.maxWaitlistSize}
                onChange={e => update("maxWaitlistSize", Number(e.target.value))} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <Label className="text-xs">Offer Expiry</Label>
              <div className="flex items-center gap-2">
                <Input className="h-8 text-xs flex-1" type="number" min={1} value={config.expiryHours}
                  onChange={e => update("expiryHours", Number(e.target.value))} />
                <span className="text-xs text-slate-500">hours</span>
              </div>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2">
            {[
              { key: "autoPromote" as const, label: "Auto-Promote", desc: "Automatically offer spots to next in line" },
              { key: "notifyOnSpotOpen" as const, label: "Notify on Spot Open", desc: "Email/SMS when a spot becomes available" },
              { key: "showPositionToUser" as const, label: "Show Position", desc: "Let users see their waitlist position" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-700">{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </div>
                <Switch checked={config[opt.key] as boolean} onCheckedChange={v => update(opt.key, v)} />
              </div>
            ))}
          </div>

          {/* Promotion Order */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">Promotion Order</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "fifo", label: "First In, First Out", icon: ArrowUpDown },
                { id: "priority", label: "Priority Based", icon: Star },
                { id: "random", label: "Random", icon: Sparkles },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => update("promotionOrder", opt.id)}
                  className={cn("p-2.5 rounded-lg border-2 text-center transition-all",
                    config.promotionOrder === opt.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-200"
                  )}>
                  <opt.icon className={cn("w-4 h-4 mx-auto mb-1", config.promotionOrder === opt.id ? "text-emerald-600" : "text-slate-400")} />
                  <p className="text-[10px] font-medium text-slate-700">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Current Waitlist Preview */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Current Waitlist</h5>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {MOCK_WAITLIST.map((w, i) => (
                <div key={w.id} className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-slate-50")}>
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center">
                    {w.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{w.name}</p>
                    <p className="text-[10px] text-slate-400">{w.email} · {w.joinedAt}</p>
                  </div>
                  <Badge className={cn("text-[9px]",
                    w.status === "waiting" ? "bg-amber-50 text-amber-600" :
                    w.status === "notified" ? "bg-blue-50 text-blue-600" :
                    "bg-slate-100 text-slate-400"
                  )}>{w.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ThumbsUp className="w-3 h-3 text-emerald-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   3. PAYMENT INTEGRATION
   ════════════════════════════════════════════════════════ */

interface PaymentConfig {
  enabled: boolean;
  currency: string;
  baseAmount: number;
  familyMemberAmount: number;
  taxPercentage: number;
  allowFreeRegistration: boolean;
  paymentMethods: { upi: boolean; card: boolean; netbanking: boolean; cash: boolean };
  upiId: string;
  earlyBirdDiscount: { enabled: boolean; percentage: number; deadline: string };
  groupDiscount: { enabled: boolean; minMembers: number; percentage: number };
  refundPolicy: "full" | "partial" | "none";
}

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  enabled: false,
  currency: "INR",
  baseAmount: 500,
  familyMemberAmount: 300,
  taxPercentage: 18,
  allowFreeRegistration: false,
  paymentMethods: { upi: true, card: true, netbanking: true, cash: false },
  upiId: "",
  earlyBirdDiscount: { enabled: false, percentage: 20, deadline: "" },
  groupDiscount: { enabled: false, minMembers: 4, percentage: 15 },
  refundPolicy: "full",
};

export function PaymentSettings({ config: initial, onChange }: {
  config?: PaymentConfig;
  onChange: (config: PaymentConfig) => void;
}) {
  const [config, setConfig] = useState<PaymentConfig>(initial ?? DEFAULT_PAYMENT_CONFIG);

  const update = (patch: Partial<PaymentConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Payment Integration</h4>
            <p className="text-[10px] text-slate-400">Collect registration fees</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          {/* Pricing */}
          <div className="bg-violet-50 rounded-xl p-4 space-y-3">
            <h5 className="text-xs font-semibold text-violet-700">Pricing</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Base Fee</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input className="h-8 text-xs pl-7" type="number" value={config.baseAmount}
                    onChange={e => update({ baseAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Per Family Member</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input className="h-8 text-xs pl-7" type="number" value={config.familyMemberAmount}
                    onChange={e => update({ familyMemberAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GST %</Label>
                <Input className="h-8 text-xs" type="number" value={config.taxPercentage}
                  onChange={e => update({ taxPercentage: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-violet-600">Allow Free Registration</span>
              <Switch checked={config.allowFreeRegistration}
                onCheckedChange={v => update({ allowFreeRegistration: v })} />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Payment Methods</h5>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "upi" as const, label: "UPI / QR", icon: QrCode, color: "text-green-600" },
                { key: "card" as const, label: "Credit / Debit Card", icon: CardIcon, color: "text-blue-600" },
                { key: "netbanking" as const, label: "Net Banking", icon: Building2, color: "text-indigo-600" },
                { key: "cash" as const, label: "Cash at Venue", icon: IndianRupee, color: "text-amber-600" },
              ]).map(m => (
                <div key={m.key} className={cn("flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                  config.paymentMethods[m.key] ? "border-violet-300 bg-violet-50" : "border-slate-200")}>
                  <div className="flex items-center gap-2">
                    <m.icon className={cn("w-4 h-4", m.color)} />
                    <span className="text-xs font-medium text-slate-700">{m.label}</span>
                  </div>
                  <Switch checked={config.paymentMethods[m.key]}
                    onCheckedChange={v => update({ paymentMethods: { ...config.paymentMethods, [m.key]: v } })} />
                </div>
              ))}
            </div>
          </div>

          {config.paymentMethods.upi && (
            <div className="space-y-1">
              <Label className="text-xs">UPI ID</Label>
              <Input className="h-8 text-xs" placeholder="yourname@upi" value={config.upiId}
                onChange={e => update({ upiId: e.target.value })} />
            </div>
          )}

          {/* Discounts */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-slate-600">Discounts</h5>
            <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">Early Bird Discount</span>
                </div>
                <Switch checked={config.earlyBirdDiscount.enabled}
                  onCheckedChange={v => update({ earlyBirdDiscount: { ...config.earlyBirdDiscount, enabled: v } })} />
              </div>
              {config.earlyBirdDiscount.enabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Discount %</Label>
                    <Input className="h-7 text-xs" type="number" value={config.earlyBirdDiscount.percentage}
                      onChange={e => update({ earlyBirdDiscount: { ...config.earlyBirdDiscount, percentage: Number(e.target.value) } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Deadline</Label>
                    <Input className="h-7 text-xs" type="date" value={config.earlyBirdDiscount.deadline}
                      onChange={e => update({ earlyBirdDiscount: { ...config.earlyBirdDiscount, deadline: e.target.value } })} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-700">Group / Family Discount</span>
                </div>
                <Switch checked={config.groupDiscount.enabled}
                  onCheckedChange={v => update({ groupDiscount: { ...config.groupDiscount, enabled: v } })} />
              </div>
              {config.groupDiscount.enabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Min Members</Label>
                    <Input className="h-7 text-xs" type="number" value={config.groupDiscount.minMembers}
                      onChange={e => update({ groupDiscount: { ...config.groupDiscount, minMembers: Number(e.target.value) } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Discount %</Label>
                    <Input className="h-7 text-xs" type="number" value={config.groupDiscount.percentage}
                      onChange={e => update({ groupDiscount: { ...config.groupDiscount, percentage: Number(e.target.value) } })} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refund Policy */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">Refund Policy</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "full" as const, label: "Full Refund", desc: "100% refund on cancellation" },
                { id: "partial" as const, label: "Partial", desc: "50% refund with fee deduction" },
                { id: "none" as const, label: "No Refund", desc: "Non-refundable registration" },
              ]).map(r => (
                <button key={r.id} onClick={() => update({ refundPolicy: r.id })}
                  className={cn("p-2.5 rounded-lg border-2 text-center transition-all",
                    config.refundPolicy === r.id ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-200"
                  )}>
                  <p className={cn("text-xs font-medium", config.refundPolicy === r.id ? "text-violet-700" : "text-slate-600")}>{r.label}</p>
                  <p className="text-[9px] text-slate-400">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl p-4 text-white">
            <h5 className="text-xs font-semibold mb-3 opacity-80">Price Preview (Individual)</h5>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="opacity-70">Base Fee</span><span>₹{config.baseAmount}</span></div>
              <div className="flex justify-between"><span className="opacity-70">GST ({config.taxPercentage}%)</span><span>₹{Math.round(config.baseAmount * config.taxPercentage / 100)}</span></div>
              <hr className="border-white/20" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{Math.round(config.baseAmount * (1 + config.taxPercentage / 100))}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   4. APPROVAL WORKFLOW
   ════════════════════════════════════════════════════════ */

interface ApprovalConfig {
  enabled: boolean;
  autoApproveRules: { type: "all" | "category" | "capacity"; categories: string[]; capacityThreshold: number };
  requireDocuments: boolean;
  documentTypes: string[];
  notifyAdminOnNew: boolean;
  notifyUserOnDecision: boolean;
  approvalDeadlineHours: number;
}

const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  enabled: false,
  autoApproveRules: { type: "all", categories: [], capacityThreshold: 80 },
  requireDocuments: false,
  documentTypes: ["Aadhaar Card", "Society ID"],
  notifyAdminOnNew: true,
  notifyUserOnDecision: true,
  approvalDeadlineHours: 48,
};

const MOCK_PENDING = [
  { id: 1, name: "Amit Sharma", category: "VIP", submittedAt: "1h ago", documents: true },
  { id: 2, name: "Priya Iyer", category: "Family", submittedAt: "2h ago", documents: true },
  { id: 3, name: "Karan Mehta", category: "Individual", submittedAt: "4h ago", documents: false },
];

export function ApprovalWorkflowSettings({ config: initial, onChange }: {
  config?: ApprovalConfig;
  onChange: (config: ApprovalConfig) => void;
}) {
  const [config, setConfig] = useState<ApprovalConfig>(initial ?? DEFAULT_APPROVAL_CONFIG);

  const update = (patch: Partial<ApprovalConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Approval Workflow</h4>
            <p className="text-[10px] text-slate-400">Review registrations before confirming</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          {/* Auto-Approve Rules */}
          <div className="bg-cyan-50 rounded-xl p-4 space-y-3">
            <h5 className="text-xs font-semibold text-cyan-700">Auto-Approve Rules</h5>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "all" as const, label: "Approve All", desc: "Auto-approve everyone" },
                { id: "category" as const, label: "By Category", desc: "Auto-approve specific categories" },
                { id: "capacity" as const, label: "By Capacity", desc: "Auto-approve until threshold" },
              ]).map(r => (
                <button key={r.id} onClick={() => update({ autoApproveRules: { ...config.autoApproveRules, type: r.id } })}
                  className={cn("p-2.5 rounded-lg border-2 text-left transition-all",
                    config.autoApproveRules.type === r.id ? "border-cyan-500 bg-white" : "border-slate-200 hover:border-cyan-200"
                  )}>
                  <p className={cn("text-xs font-medium", config.autoApproveRules.type === r.id ? "text-cyan-700" : "text-slate-600")}>{r.label}</p>
                  <p className="text-[9px] text-slate-400">{r.desc}</p>
                </button>
              ))}
            </div>
            {config.autoApproveRules.type === "capacity" && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-cyan-600">Until</span>
                <Input className="w-20 h-7 text-xs" type="number" value={config.autoApproveRules.capacityThreshold}
                  onChange={e => update({ autoApproveRules: { ...config.autoApproveRules, capacityThreshold: Number(e.target.value) } })} />
                <span className="text-xs text-cyan-600">% capacity</span>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-2">
            {[
              { key: "requireDocuments", label: "Require Documents", desc: "Ask for ID proof during registration" },
              { key: "notifyAdminOnNew", label: "Notify Admin", desc: "Alert admin when new registration arrives" },
              { key: "notifyUserOnDecision", label: "Notify User", desc: "Email user when approved/rejected" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-700">{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </div>
                <Switch checked={(config as any)[opt.key]}
                  onCheckedChange={v => update({ [opt.key]: v })} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600">Approval Deadline</span>
            <Input className="w-20 h-7 text-xs" type="number" value={config.approvalDeadlineHours}
              onChange={e => update({ approvalDeadlineHours: Number(e.target.value) })} />
            <span className="text-xs text-slate-500">hours</span>
          </div>

          {/* Pending Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-600">Pending Approvals</h5>
              <Badge className="bg-amber-50 text-amber-600 text-[9px]">{MOCK_PENDING.length} pending</Badge>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {MOCK_PENDING.map((p, i) => (
                <div key={p.id} className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-slate-50")}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-700">{p.name}</p>
                      <Badge variant="outline" className="text-[9px]">{p.category}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {p.submittedAt}
                      {p.documents ? " · Docs attached" : " · No docs"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 px-2 text-[10px] bg-emerald-500 hover:bg-emerald-600 gap-1">
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-rose-500 hover:bg-rose-50 gap-1">
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   5. MULTI-LANGUAGE FORMS
   ════════════════════════════════════════════════════════ */

interface LanguageConfig {
  enabled: boolean;
  defaultLanguage: string;
  availableLanguages: string[];
  autoDetect: boolean;
}

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  enabled: false,
  defaultLanguage: "en",
  availableLanguages: ["en"],
  autoDetect: true,
};

export function MultiLanguageSettings({ config: initial, onChange }: {
  config?: LanguageConfig;
  onChange: (config: LanguageConfig) => void;
}) {
  const [config, setConfig] = useState<LanguageConfig>(initial ?? DEFAULT_LANGUAGE_CONFIG);

  const update = (patch: Partial<LanguageConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  };

  const toggleLang = (code: string) => {
    const langs = config.availableLanguages.includes(code)
      ? config.availableLanguages.filter(l => l !== code)
      : [...config.availableLanguages, code];
    if (langs.length === 0) return;
    update({
      availableLanguages: langs,
      defaultLanguage: langs.includes(config.defaultLanguage) ? config.defaultLanguage : langs[0],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <Languages className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Multi-Language Forms</h4>
            <p className="text-[10px] text-slate-400">Offer forms in regional languages</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-700">Auto-Detect Language</p>
              <p className="text-[10px] text-slate-400">Detect user's browser language automatically</p>
            </div>
            <Switch checked={config.autoDetect} onCheckedChange={v => update({ autoDetect: v })} />
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Available Languages</h5>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => {
                const active = config.availableLanguages.includes(lang.code);
                const isDefault = config.defaultLanguage === lang.code;
                return (
                  <button key={lang.code} onClick={() => toggleLang(lang.code)}
                    className={cn("flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all relative",
                      active ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-rose-200"
                    )}>
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex-1">
                      <p className={cn("text-xs font-medium", active ? "text-rose-700" : "text-slate-600")}>{lang.label}</p>
                      <p className="text-[10px] text-slate-400">{lang.native}</p>
                    </div>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-rose-500" />
                    )}
                    {isDefault && (
                      <Badge className="absolute -top-2 right-2 text-[8px] bg-rose-500">Default</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {config.availableLanguages.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">Default Language</Label>
              <div className="flex flex-wrap gap-2">
                {config.availableLanguages.map(code => {
                  const lang = LANGUAGES.find(l => l.code === code)!;
                  return (
                    <button key={code} onClick={() => update({ defaultLanguage: code })}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all",
                        config.defaultLanguage === code ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-rose-200"
                      )}>
                      <span className="text-sm">{lang.flag}</span>
                      <span className="text-xs font-medium">{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Translation Preview */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Translation Preview</h5>
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
              {[
                { en: "First Name", hi: "पहला नाम", mr: "पहिले नाव", gu: "પહેલું નામ" },
                { en: "Email Address", hi: "ईमेल पता", mr: "ईमेल पत्ता", gu: "ઈમેલ સરનામું" },
                { en: "Register", hi: "पंजीकरण करें", mr: "नोंदणी करा", gu: "નોંધણી કરો" },
              ].map((row, i) => (
                <div key={i} className={cn("py-2", i > 0 && "border-t border-slate-100")}>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {config.availableLanguages.slice(0, 4).map(code => (
                      <div key={code} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[8px]">{code.toUpperCase()}</Badge>
                        <span className="text-slate-600">{(row as any)[code] ?? row.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   6. CUSTOM BRANDING
   ════════════════════════════════════════════════════════ */

interface BrandingConfig {
  enabled: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl: string;
  bannerUrl: string;
  showPoweredBy: boolean;
  customCss: string;
  borderRadius: "none" | "small" | "medium" | "large";
}

const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  enabled: false,
  primaryColor: "#4f46e5",
  accentColor: "#7c3aed",
  backgroundColor: "#f8fafc",
  fontFamily: "Inter",
  logoUrl: "",
  bannerUrl: "",
  showPoweredBy: true,
  customCss: "",
  borderRadius: "medium",
};

const PRESET_THEMES = [
  { name: "Indigo Violet", primary: "#4f46e5", accent: "#7c3aed", bg: "#f8fafc" },
  { name: "Emerald Teal", primary: "#059669", accent: "#0d9488", bg: "#f0fdf4" },
  { name: "Rose Pink", primary: "#e11d48", accent: "#ec4899", bg: "#fff1f2" },
  { name: "Amber Orange", primary: "#d97706", accent: "#ea580c", bg: "#fffbeb" },
  { name: "Cyan Blue", primary: "#0891b2", accent: "#2563eb", bg: "#ecfeff" },
  { name: "Slate Dark", primary: "#1e293b", accent: "#475569", bg: "#f1f5f9" },
];

export function CustomBrandingSettings({ config: initial, onChange }: {
  config?: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
}) {
  const [config, setConfig] = useState<BrandingConfig>(initial ?? DEFAULT_BRANDING_CONFIG);

  const update = (patch: Partial<BrandingConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Custom Branding</h4>
            <p className="text-[10px] text-slate-400">Customize form appearance</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          {/* Theme Presets */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Theme Presets</h5>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.map(theme => (
                <button key={theme.name}
                  onClick={() => update({ primaryColor: theme.primary, accentColor: theme.accent, backgroundColor: theme.bg })}
                  className={cn("p-2 rounded-lg border-2 transition-all",
                    config.primaryColor === theme.primary ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-indigo-200"
                  )}>
                  <div className="flex gap-1 mb-1.5">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: theme.bg }} />
                  </div>
                  <p className="text-[10px] font-medium text-slate-600">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "primaryColor" as const, label: "Primary" },
              { key: "accentColor" as const, label: "Accent" },
              { key: "backgroundColor" as const, label: "Background" },
            ]).map(c => (
              <div key={c.key} className="space-y-1">
                <Label className="text-xs">{c.label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={config[c.key]}
                    onChange={e => update({ [c.key]: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0" />
                  <Input className="h-8 text-xs flex-1 font-mono" value={config[c.key]}
                    onChange={e => update({ [c.key]: e.target.value })} />
                </div>
              </div>
            ))}
          </div>

          {/* Font & Border Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Font Family</Label>
              <div className="flex flex-wrap gap-1.5">
                {["Inter", "Poppins", "Roboto", "Noto Sans"].map(f => (
                  <button key={f} onClick={() => update({ fontFamily: f })}
                    className={cn("px-2.5 py-1 rounded-md text-xs border transition-all",
                      config.fontFamily === f ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium" : "border-slate-200 text-slate-600"
                    )} style={{ fontFamily: f }}>{f}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Border Radius</Label>
              <div className="flex gap-1.5">
                {([
                  { id: "none" as const, label: "None", r: "rounded-none" },
                  { id: "small" as const, label: "Sm", r: "rounded" },
                  { id: "medium" as const, label: "Md", r: "rounded-lg" },
                  { id: "large" as const, label: "Lg", r: "rounded-2xl" },
                ]).map(b => (
                  <button key={b.id} onClick={() => update({ borderRadius: b.id })}
                    className={cn("flex-1 py-2 border-2 transition-all", b.r,
                      config.borderRadius === b.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                    )}>
                    <span className="text-[10px] font-medium text-slate-600">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logo & Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Logo URL</Label>
              <Input className="h-8 text-xs" placeholder="https://..." value={config.logoUrl}
                onChange={e => update({ logoUrl: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banner Image URL</Label>
              <Input className="h-8 text-xs" placeholder="https://..." value={config.bannerUrl}
                onChange={e => update({ bannerUrl: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-700">Show "Powered by Mana Community"</span>
            <Switch checked={config.showPoweredBy} onCheckedChange={v => update({ showPoweredBy: v })} />
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Live Preview</h5>
            <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ backgroundColor: config.backgroundColor }}>
              {config.bannerUrl ? (
                <div className="h-20 bg-slate-200 flex items-center justify-center">
                  <Image className="w-6 h-6 text-slate-400" />
                </div>
              ) : (
                <div className="h-16" style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }} />
              )}
              <div className="p-4 space-y-3">
                <h4 className="font-bold text-sm" style={{ color: config.primaryColor, fontFamily: config.fontFamily }}>
                  Event Registration
                </h4>
                <div className={cn("bg-white p-3 border border-slate-200 space-y-2",
                  config.borderRadius === "none" ? "rounded-none" : config.borderRadius === "small" ? "rounded" : config.borderRadius === "medium" ? "rounded-lg" : "rounded-2xl"
                )}>
                  <div className="h-7 bg-slate-100 rounded w-full" />
                  <div className="h-7 bg-slate-100 rounded w-full" />
                  <div className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})`, fontFamily: config.fontFamily }}>
                    Register Now
                  </div>
                </div>
                {config.showPoweredBy && (
                  <p className="text-[9px] text-center text-slate-400">Powered by Mana Community</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   7. ANALYTICS DASHBOARD
   ════════════════════════════════════════════════════════ */

const MOCK_ANALYTICS = {
  views: 2847,
  starts: 1420,
  completions: 1198,
  dropOffs: 222,
  conversionRate: 84.4,
  avgTime: "3m 42s",
  peakHour: "6:00 PM",
  topSource: "WhatsApp",
  daily: [
    { day: "Mon", views: 380, regs: 42 },
    { day: "Tue", views: 420, regs: 58 },
    { day: "Wed", views: 350, regs: 38 },
    { day: "Thu", views: 510, regs: 72 },
    { day: "Fri", views: 480, regs: 65 },
    { day: "Sat", views: 390, regs: 48 },
    { day: "Sun", views: 317, regs: 35 },
  ],
  demographics: {
    gender: [{ label: "Male", value: 58 }, { label: "Female", value: 38 }, { label: "Other", value: 4 }],
    age: [{ label: "0-17", value: 15 }, { label: "18-30", value: 32 }, { label: "31-50", value: 35 }, { label: "51+", value: 18 }],
    type: [{ label: "Individual", value: 62 }, { label: "Family", value: 38 }],
  },
  dropOffSteps: [
    { step: "Type Selection", rate: 5 },
    { step: "Personal Details", rate: 8 },
    { step: "Family Members", rate: 12 },
    { step: "Additional Info", rate: 18 },
    { step: "Review & Submit", rate: 3 },
  ],
  sources: [
    { name: "WhatsApp", count: 480, pct: 40 },
    { name: "Direct Link", count: 312, pct: 26 },
    { name: "Society App", count: 216, pct: 18 },
    { name: "Email", count: 120, pct: 10 },
    { name: "Poster QR", count: 70, pct: 6 },
  ],
};

export function AnalyticsDashboard() {
  const a = MOCK_ANALYTICS;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">Analytics Dashboard</h4>
          <p className="text-[10px] text-slate-400">Real-time form performance metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Views", value: a.views.toLocaleString(), icon: Eye, color: "bg-blue-500", change: "+12.3%" },
          { label: "Completions", value: a.completions.toLocaleString(), icon: CheckCircle2, color: "bg-emerald-500", change: "+8.7%" },
          { label: "Conversion", value: `${a.conversionRate}%`, icon: TrendingUp, color: "bg-violet-500", change: "+2.1%" },
          { label: "Avg. Time", value: a.avgTime, icon: Clock, color: "bg-amber-500", change: "-0.5m" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", kpi.color)}>
                <kpi.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] text-slate-400">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
            <p className="text-[10px] text-emerald-500 font-medium">{kpi.change} vs last week</p>
          </div>
        ))}
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" /> Daily Trend (Last 7 Days)
        </h5>
        <div className="flex items-end gap-3 h-36">
          {a.daily.map(d => {
            const maxViews = Math.max(...a.daily.map(x => x.views));
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
                  <span className="text-[9px] text-slate-500 font-medium">{d.regs}</span>
                  <div className="w-full flex gap-0.5 justify-center" style={{ height: `${(d.views / maxViews) * 100}%` }}>
                    <div className="flex-1 bg-indigo-200 rounded-t" />
                    <div className="flex-1 bg-violet-400 rounded-t" style={{ height: `${(d.regs / d.views) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{d.day}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-200" /><span className="text-[10px] text-slate-400">Views</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-violet-400" /><span className="text-[10px] text-slate-400">Registrations</span></div>
        </div>
      </div>

      {/* Funnel & Drop-offs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Drop-off by Step
          </h5>
          <div className="space-y-2">
            {a.dropOffSteps.map(step => (
              <div key={step.step} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">{step.step}</span>
                  <span className={cn("font-medium", step.rate > 10 ? "text-rose-500" : "text-slate-400")}>{step.rate}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", step.rate > 10 ? "bg-rose-400" : "bg-slate-300")}
                    style={{ width: `${step.rate * 3}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-500" /> Demographics
          </h5>
          <div className="space-y-4">
            {([
              { label: "Registration Type", data: a.demographics.type, colors: ["#4f46e5", "#7c3aed"] },
              { label: "Gender", data: a.demographics.gender, colors: ["#2563eb", "#ec4899", "#8b5cf6"] },
              { label: "Age Group", data: a.demographics.age, colors: ["#06b6d4", "#10b981", "#f59e0b", "#ef4444"] },
            ]).map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-medium text-slate-500 mb-1">{group.label}</p>
                <div className="flex h-3 rounded-full overflow-hidden mb-1">
                  {group.data.map((d, i) => (
                    <div key={d.label} style={{ width: `${d.value}%`, backgroundColor: group.colors[i] }}
                      className="transition-all" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {group.data.map((d, i) => (
                    <div key={d.label} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.colors[i] }} />
                      <span className="text-[9px] text-slate-500">{d.label} {d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MousePointer className="w-4 h-4 text-indigo-500" /> Traffic Sources
        </h5>
        <div className="space-y-2">
          {a.sources.map(src => (
            <div key={src.name} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-24">{src.name}</span>
              <div className="flex-1 h-5 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${src.pct}%` }}>
                  {src.pct >= 15 && <span className="text-[9px] text-white font-medium">{src.count}</span>}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 w-8 text-right">{src.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   8. TEMPLATE LIBRARY
   ════════════════════════════════════════════════════════ */

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fieldsCount: number;
  usageCount: number;
  rating: number;
  tags: string[];
  isOfficial: boolean;
  isSaved: boolean;
}

const MOCK_TEMPLATES: FormTemplate[] = [
  { id: "t1", name: "Community Festival Registration", description: "Complete festival registration with family, dietary, and accessibility fields", category: "Festival", fieldsCount: 18, usageCount: 234, rating: 4.8, tags: ["festival", "family", "dietary"], isOfficial: true, isSaved: false },
  { id: "t2", name: "Sports Event Sign-up", description: "Quick registration for sports events with team and jersey size selection", category: "Sports", fieldsCount: 10, usageCount: 156, rating: 4.5, tags: ["sports", "team", "jersey"], isOfficial: true, isSaved: false },
  { id: "t3", name: "Workshop / Seminar", description: "Professional event registration with company info and session preferences", category: "Workshop", fieldsCount: 12, usageCount: 89, rating: 4.3, tags: ["workshop", "professional"], isOfficial: true, isSaved: false },
  { id: "t4", name: "Kids Activity / Camp", description: "Child-focused registration with parent/guardian info and emergency contacts", category: "Kids", fieldsCount: 16, usageCount: 178, rating: 4.7, tags: ["kids", "camp", "guardian"], isOfficial: true, isSaved: false },
  { id: "t5", name: "Religious Ceremony", description: "Puja, ceremony, or prayer meeting registration with prasad and seva preferences", category: "Religious", fieldsCount: 14, usageCount: 312, rating: 4.9, tags: ["puja", "religious", "ceremony"], isOfficial: true, isSaved: false },
  { id: "t6", name: "Annual General Meeting", description: "Minimal AGM registration with member ID verification and voting eligibility", category: "Meeting", fieldsCount: 8, usageCount: 67, rating: 4.1, tags: ["agm", "voting", "member"], isOfficial: true, isSaved: false },
  { id: "t7", name: "Navratri 2025 Form (Saved)", description: "Custom form saved from Navratri 2025 event", category: "Custom", fieldsCount: 15, usageCount: 1, rating: 0, tags: ["navratri", "custom"], isOfficial: false, isSaved: true },
  { id: "t8", name: "Diwali 2025 Detailed (Saved)", description: "Detailed form with payment from Diwali 2025", category: "Custom", fieldsCount: 20, usageCount: 1, rating: 0, tags: ["diwali", "payment"], isOfficial: false, isSaved: true },
];

export function TemplateLibrary({ onApply }: { onApply: (template: FormTemplate) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState<"official" | "saved">("official");

  const categories = ["all", "Festival", "Sports", "Workshop", "Kids", "Religious", "Meeting", "Custom"];

  const filtered = MOCK_TEMPLATES.filter(t => {
    if (tab === "official" && !t.isOfficial) return false;
    if (tab === "saved" && !t.isSaved) return false;
    if (category !== "all" && t.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <LayoutTemplate className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">Template Library</h4>
          <p className="text-[10px] text-slate-400">Ready-to-use form templates for every occasion</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("official")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            tab === "official" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-orange-50"
          )}>
          <Sparkles className="w-3 h-3" /> Official Templates
        </button>
        <button onClick={() => setTab("saved")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            tab === "saved" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-orange-50"
          )}>
          <Save className="w-3 h-3" /> My Saved Templates
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search templates..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {categories.filter(c => tab === "saved" ? c === "all" || c === "Custom" : c !== "Custom").map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all",
                category === c ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400 hover:bg-orange-50"
              )}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {t.isOfficial && <Badge className="text-[8px] bg-orange-100 text-orange-600">Official</Badge>}
                {t.isSaved && <Badge className="text-[8px] bg-indigo-100 text-indigo-600">Saved</Badge>}
                <Badge variant="outline" className="text-[8px]">{t.category}</Badge>
              </div>
              <span className="text-[10px] text-slate-400">{t.fieldsCount} fields</span>
            </div>
            <h5 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">
              {t.name}
            </h5>
            <p className="text-[10px] text-slate-500 mb-3 line-clamp-2">{t.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {t.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400" /> {t.rating}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">{t.usageCount} uses</span>
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </Button>
                <Button size="sm" className="h-7 text-[10px] gap-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => onApply(t)}>
                  <Copy className="w-3 h-3" /> Use
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <LayoutTemplate className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No templates found</p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   9. AUTO-CLOSE RULES
   ════════════════════════════════════════════════════════ */

interface AutoCloseConfig {
  enabled: boolean;
  closeByDate: { enabled: boolean; date: string; time: string };
  closeByCapacity: { enabled: boolean; threshold: number };
  closeByPercentage: { enabled: boolean; percentage: number };
  showCountdown: boolean;
  showSpotsLeft: boolean;
  closedMessage: string;
  redirectUrl: string;
}

const DEFAULT_AUTO_CLOSE_CONFIG: AutoCloseConfig = {
  enabled: false,
  closeByDate: { enabled: true, date: "", time: "23:59" },
  closeByCapacity: { enabled: true, threshold: 500 },
  closeByPercentage: { enabled: false, percentage: 95 },
  showCountdown: true,
  showSpotsLeft: true,
  closedMessage: "Registration for this event has been closed. Thank you for your interest!",
  redirectUrl: "",
};

export function AutoCloseSettings({ config: initial, onChange }: {
  config?: AutoCloseConfig;
  onChange: (config: AutoCloseConfig) => void;
}) {
  const [config, setConfig] = useState<AutoCloseConfig>(initial ?? DEFAULT_AUTO_CLOSE_CONFIG);

  const update = (patch: Partial<AutoCloseConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
            <Timer className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Auto-Close Rules</h4>
            <p className="text-[10px] text-slate-400">Automatically close registration</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          {/* Close Conditions */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-slate-600">Close Conditions</h5>

            {/* By Date */}
            <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all",
              config.closeByDate.enabled ? "border-pink-300 bg-pink-50" : "border-slate-200")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">Close by Date & Time</p>
                    <p className="text-[10px] text-slate-400">Stop accepting registrations after this date</p>
                  </div>
                </div>
                <Switch checked={config.closeByDate.enabled}
                  onCheckedChange={v => update({ closeByDate: { ...config.closeByDate, enabled: v } })} />
              </div>
              {config.closeByDate.enabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Date</Label>
                    <Input className="h-8 text-xs" type="date" value={config.closeByDate.date}
                      onChange={e => update({ closeByDate: { ...config.closeByDate, date: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Time</Label>
                    <Input className="h-8 text-xs" type="time" value={config.closeByDate.time}
                      onChange={e => update({ closeByDate: { ...config.closeByDate, time: e.target.value } })} />
                  </div>
                </div>
              )}
            </div>

            {/* By Capacity */}
            <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all",
              config.closeByCapacity.enabled ? "border-pink-300 bg-pink-50" : "border-slate-200")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-pink-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">Close by Capacity</p>
                    <p className="text-[10px] text-slate-400">Close when max registrations reached</p>
                  </div>
                </div>
                <Switch checked={config.closeByCapacity.enabled}
                  onCheckedChange={v => update({ closeByCapacity: { ...config.closeByCapacity, enabled: v } })} />
              </div>
              {config.closeByCapacity.enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-pink-600">Max registrations:</span>
                  <Input className="w-24 h-7 text-xs" type="number" value={config.closeByCapacity.threshold}
                    onChange={e => update({ closeByCapacity: { ...config.closeByCapacity, threshold: Number(e.target.value) } })} />
                </div>
              )}
            </div>

            {/* By Percentage */}
            <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all",
              config.closeByPercentage.enabled ? "border-pink-300 bg-pink-50" : "border-slate-200")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">Close by Fill Percentage</p>
                    <p className="text-[10px] text-slate-400">Close when capacity reaches threshold</p>
                  </div>
                </div>
                <Switch checked={config.closeByPercentage.enabled}
                  onCheckedChange={v => update({ closeByPercentage: { ...config.closeByPercentage, enabled: v } })} />
              </div>
              {config.closeByPercentage.enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-pink-600">Close at:</span>
                  <Input className="w-20 h-7 text-xs" type="number" min={1} max={100}
                    value={config.closeByPercentage.percentage}
                    onChange={e => update({ closeByPercentage: { ...config.closeByPercentage, percentage: Number(e.target.value) } })} />
                  <span className="text-xs text-pink-600">% capacity</span>
                </div>
              )}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-600">Display Options</h5>
            {[
              { key: "showCountdown" as const, label: "Show Countdown Timer", desc: "Display time remaining on the registration page" },
              { key: "showSpotsLeft" as const, label: "Show Spots Remaining", desc: "Display available spots count to registrants" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-700">{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </div>
                <Switch checked={config[opt.key]}
                  onCheckedChange={v => update({ [opt.key]: v })} />
              </div>
            ))}
          </div>

          {/* Closed Message */}
          <div className="space-y-2">
            <Label className="text-xs">Closed Message</Label>
            <Textarea className="text-xs min-h-[60px]" value={config.closedMessage}
              onChange={e => update({ closedMessage: e.target.value })} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Redirect URL (optional)</Label>
            <Input className="h-8 text-xs" placeholder="https://your-website.com/event-info"
              value={config.redirectUrl} onChange={e => update({ redirectUrl: e.target.value })} />
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   10. CONDITIONAL LOGIC
   ════════════════════════════════════════════════════════ */

interface ConditionalRule {
  id: string;
  name: string;
  triggerField: string;
  operator: string;
  value: string;
  action: "show" | "hide" | "require" | "skip_step";
  targetField: string;
  enabled: boolean;
}

const MOCK_RULES: ConditionalRule[] = [
  { id: "r1", name: "Show Family Fields", triggerField: "Registration Type", operator: "equals", value: "Family", action: "show", targetField: "Family Members Section", enabled: true },
  { id: "r2", name: "Require Medical Info for Seniors", triggerField: "Age", operator: "greater_than", value: "60", action: "require", targetField: "Medical Conditions", enabled: true },
  { id: "r3", name: "Hide Payment for Volunteers", triggerField: "Category", operator: "equals", value: "Volunteer", action: "hide", targetField: "Payment Section", enabled: true },
  { id: "r4", name: "Show Dietary for Meal Events", triggerField: "Include Meals", operator: "equals", value: "Yes", action: "show", targetField: "Dietary Preference", enabled: false },
];

const OPERATORS = [
  { id: "equals", label: "Equals" },
  { id: "not_equals", label: "Does Not Equal" },
  { id: "contains", label: "Contains" },
  { id: "greater_than", label: "Greater Than" },
  { id: "less_than", label: "Less Than" },
  { id: "is_empty", label: "Is Empty" },
  { id: "is_not_empty", label: "Is Not Empty" },
];

const ACTIONS = [
  { id: "show", label: "Show Field", icon: Eye, color: "text-emerald-500" },
  { id: "hide", label: "Hide Field", icon: EyeOff, color: "text-slate-500" },
  { id: "require", label: "Make Required", icon: AlertCircle, color: "text-amber-500" },
  { id: "skip_step", label: "Skip Step", icon: ChevronRight, color: "text-blue-500" },
];

export function ConditionalLogicSettings() {
  const [rules, setRules] = useState<ConditionalRule[]>(MOCK_RULES);
  const [editingRule, setEditingRule] = useState<ConditionalRule | null>(null);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: `r${Date.now()}`,
      name: "New Rule",
      triggerField: "",
      operator: "equals",
      value: "",
      action: "show",
      targetField: "",
      enabled: true,
    };
    setEditingRule(newRule);
  };

  const saveRule = (rule: ConditionalRule) => {
    setRules(prev => {
      const exists = prev.find(r => r.id === rule.id);
      if (exists) return prev.map(r => r.id === rule.id ? rule : r);
      return [...prev, rule];
    });
    setEditingRule(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Conditional Logic</h4>
            <p className="text-[10px] text-slate-400">Show/hide fields based on user answers</p>
          </div>
        </div>
        <Button size="sm" className="gap-1 text-xs bg-slate-700 hover:bg-slate-800" onClick={addRule}>
          <Plus className="w-3 h-3" /> Add Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map(rule => {
          const action = ACTIONS.find(a => a.id === rule.action);
          return (
            <div key={rule.id} className={cn("bg-white rounded-xl border p-4 transition-all",
              rule.enabled ? "border-slate-200" : "border-slate-100 opacity-60")}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {action && <action.icon className={cn("w-4 h-4", action.color)} />}
                  <span className="text-sm font-medium text-slate-800">{rule.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setEditingRule(rule)}>
                    <Pencil className="w-3 h-3 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                    onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">When</span>
                <Badge className="bg-indigo-50 text-indigo-700">{rule.triggerField || "—"}</Badge>
                <Badge variant="outline" className="text-slate-500">{OPERATORS.find(o => o.id === rule.operator)?.label ?? rule.operator}</Badge>
                <Badge className="bg-amber-50 text-amber-700">{rule.value || "—"}</Badge>
                <span className="text-slate-500">then</span>
                <Badge className={cn(
                  rule.action === "show" ? "bg-emerald-50 text-emerald-700" :
                  rule.action === "hide" ? "bg-slate-100 text-slate-600" :
                  rule.action === "require" ? "bg-amber-50 text-amber-700" :
                  "bg-blue-50 text-blue-700"
                )}>{action?.label ?? rule.action}</Badge>
                <Badge className="bg-violet-50 text-violet-700">{rule.targetField || "—"}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-8">
          <GitBranch className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No conditional rules yet</p>
          <p className="text-xs text-slate-300">Add rules to dynamically control form behavior</p>
        </div>
      )}

      {/* Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingRule(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800">
              {rules.find(r => r.id === editingRule.id) ? "Edit Rule" : "New Rule"}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Rule Name</Label>
                <Input className="h-8 text-xs" value={editingRule.name}
                  onChange={e => setEditingRule({ ...editingRule, name: e.target.value })} />
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Condition</p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">When field</Label>
                    <Input className="h-7 text-xs" placeholder="e.g. Registration Type"
                      value={editingRule.triggerField}
                      onChange={e => setEditingRule({ ...editingRule, triggerField: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Operator</Label>
                      <select className="w-full h-7 text-xs border border-slate-200 rounded-md px-2"
                        value={editingRule.operator}
                        onChange={e => setEditingRule({ ...editingRule, operator: e.target.value })}>
                        {OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Value</Label>
                      <Input className="h-7 text-xs" placeholder="e.g. Family"
                        value={editingRule.value}
                        onChange={e => setEditingRule({ ...editingRule, value: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Action</p>
                <div className="grid grid-cols-4 gap-1">
                  {ACTIONS.map(a => (
                    <button key={a.id} onClick={() => setEditingRule({ ...editingRule, action: a.id as any })}
                      className={cn("p-2 rounded-lg border-2 text-center transition-all",
                        editingRule.action === a.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                      )}>
                      <a.icon className={cn("w-4 h-4 mx-auto mb-0.5", a.color)} />
                      <p className="text-[9px] font-medium text-slate-600">{a.label}</p>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Target field</Label>
                  <Input className="h-7 text-xs" placeholder="e.g. Family Members Section"
                    value={editingRule.targetField}
                    onChange={e => setEditingRule({ ...editingRule, targetField: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingRule(null)}>Cancel</Button>
              <Button className="flex-1 bg-slate-700 hover:bg-slate-800 gap-1"
                disabled={!editingRule.name.trim() || !editingRule.triggerField.trim()}
                onClick={() => saveRule(editingRule)}>
                <Check className="w-3.5 h-3.5" /> Save Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FORM SETTINGS PANEL (Tabbed)
   ════════════════════════════════════════════════════════ */

type SettingsTab = "email" | "waitlist" | "payment" | "approval" | "language" | "branding" | "auto_close" | "conditional" | "analytics" | "templates";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: any; color: string }[] = [
  { id: "email",       label: "Email",        icon: Mail,           color: "bg-amber-500"  },
  { id: "waitlist",    label: "Waitlist",      icon: UserPlus,       color: "bg-emerald-500" },
  { id: "payment",     label: "Payment",       icon: CreditCard,     color: "bg-violet-500" },
  { id: "approval",    label: "Approval",      icon: Shield,         color: "bg-cyan-500"   },
  { id: "language",    label: "Language",       icon: Languages,      color: "bg-rose-500"   },
  { id: "branding",    label: "Branding",       icon: Palette,        color: "bg-indigo-500" },
  { id: "auto_close",  label: "Auto-Close",    icon: Timer,          color: "bg-pink-500"   },
  { id: "conditional", label: "Logic",          icon: GitBranch,      color: "bg-slate-600"  },
  { id: "analytics",   label: "Analytics",      icon: BarChart3,      color: "bg-teal-500"   },
  { id: "templates",   label: "Templates",      icon: LayoutTemplate, color: "bg-orange-500" },
];

export function FormSettingsPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("email");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-50 w-full max-w-2xl h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-full duration-300"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800">Form Settings & Enhancements</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Bar */}
        <div className="bg-white px-5 py-2 border-b border-slate-100 overflow-x-auto hide-scrollbar shrink-0">
          <div className="flex gap-1">
            {SETTINGS_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
                  activeTab === t.id
                    ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                )}>
                <t.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "email" && <EmailNotificationSettings onChange={() => {}} />}
          {activeTab === "waitlist" && <WaitlistSettings onChange={() => {}} />}
          {activeTab === "payment" && <PaymentSettings onChange={() => {}} />}
          {activeTab === "approval" && <ApprovalWorkflowSettings onChange={() => {}} />}
          {activeTab === "language" && <MultiLanguageSettings onChange={() => {}} />}
          {activeTab === "branding" && <CustomBrandingSettings onChange={() => {}} />}
          {activeTab === "auto_close" && <AutoCloseSettings onChange={() => {}} />}
          {activeTab === "conditional" && <ConditionalLogicSettings />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "templates" && <TemplateLibrary onApply={() => {}} />}
        </div>
      </div>
    </div>
  );
}
