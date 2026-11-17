import { useState, useEffect } from "react";
import {
  CreditCard,
  Loader2,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Zap,
  Receipt,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  paymentConfigService,
  type PlatformPaymentConfig,
  type UpdatePlatformPaymentConfigRequest,
} from "../../../services/payments/paymentConfigService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { useAuth } from "../../../contexts/AuthContext";

const GATEWAY_META = [
  {
    key: "cashfreeEnabled" as const,
    label: "Cashfree",
    value: "CASHFREE",
    description: "Payment gateway for UPI, cards, net banking",
    icon: CreditCard,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "razorpayEnabled" as const,
    label: "Razorpay",
    value: "RAZORPAY",
    description: "Alternative payment gateway with broad coverage",
    icon: Zap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    key: "manaPayEnabled" as const,
    label: "ManaPay",
    value: "MANA_PAY",
    description: "Community-native wallet and payment hub",
    icon: Wallet,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "bbpsEnabled" as const,
    label: "BBPS",
    value: "BBPS",
    description: "Bharat Bill Payment System for utility bills",
    icon: Receipt,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export function SuperAdminPaymentSettings() {
  const { isSuperAdmin } = useAuth();
  const [config, setConfig] = useState<PlatformPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state — keep amounts as strings to avoid float precision
  const [form, setForm] = useState<UpdatePlatformPaymentConfigRequest>({
    cashfreeEnabled: false,
    razorpayEnabled: false,
    manaPayEnabled: false,
    bbpsEnabled: false,
    defaultGateway: "CASHFREE",
    convenienceFeePercent: "0",
    maxTransactionAmount: null,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const cfg = await paymentConfigService.getPlatformConfig();
      setConfig(cfg);
      setForm({
        cashfreeEnabled: cfg.cashfreeEnabled,
        razorpayEnabled: cfg.razorpayEnabled,
        manaPayEnabled: cfg.manaPayEnabled,
        bbpsEnabled: cfg.bbpsEnabled,
        defaultGateway: cfg.defaultGateway,
        convenienceFeePercent: String(cfg.convenienceFeePercent ?? "0"),
        maxTransactionAmount:
          cfg.maxTransactionAmount != null ? String(cfg.maxTransactionAmount) : null,
      });
    } catch {
      showError("Failed to load platform payment configuration");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await paymentConfigService.updatePlatformConfig(form);
      setConfig(updated);
      showSuccess("Platform payment settings saved");
    } catch {
      showError("Failed to save platform payment settings");
    } finally {
      setSaving(false);
    }
  }

  function toggleGateway(key: keyof UpdatePlatformPaymentConfigRequest, checked: boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: checked };
      // If the disabled gateway was the default, pick first remaining enabled one
      if (!checked) {
        const matchingMeta = GATEWAY_META.find((g) => g.key === key);
        if (matchingMeta && next.defaultGateway === matchingMeta.value) {
          const firstEnabled = GATEWAY_META.find(
            (g) => g.key !== key && Boolean(next[g.key as keyof typeof next])
          );
          next.defaultGateway = firstEnabled?.value ?? "";
        }
      }
      return next;
    });
  }

  const enabledGateways = GATEWAY_META.filter((g) => Boolean(form[g.key]));

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Super Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5 text-white" />
            </div>
            Platform Payment Settings
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-9">
            Control which payment gateways are available across all communities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-input/60 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Gateway Toggles */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Payment Gateways
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Enable or disable gateways platform-wide. Community admins choose from enabled ones.
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {GATEWAY_META.map(({ key, label, description, icon: Icon, color, bg }) => (
            <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{label}</div>
                  <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                </div>
              </div>
              <Switch
                checked={Boolean(form[key])}
                onCheckedChange={(checked) => toggleGateway(key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Default Gateway & Fees */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Transaction Settings
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {/* Default Gateway */}
          <div className="px-4 py-3.5">
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">
              Default Gateway
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Pre-selected at checkout when multiple gateways are available
            </p>
            <Select
              value={form.defaultGateway ?? ""}
              onValueChange={(v) => setForm((p) => ({ ...p, defaultGateway: v }))}
              disabled={enabledGateways.length === 0}
            >
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Select default" />
              </SelectTrigger>
              <SelectContent>
                {enabledGateways.length === 0 ? (
                  <SelectItem value="" disabled>
                    No gateways enabled
                  </SelectItem>
                ) : (
                  enabledGateways.map((g) => (
                    <SelectItem key={g.value} value={g.value} className="text-xs">
                      {g.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Convenience Fee */}
          <div className="px-4 py-3.5">
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">
              Convenience Fee %
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Added to transaction amount at checkout (0 = no fee). E.g. 1.5000
            </p>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.0001"
              value={form.convenienceFeePercent ?? "0"}
              onChange={(e) =>
                setForm((p) => ({ ...p, convenienceFeePercent: e.target.value }))
              }
              className="h-8 text-xs w-36"
              placeholder="0.0000"
            />
          </div>

          {/* Max Transaction Amount */}
          <div className="px-4 py-3.5">
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">
              Max Transaction Amount
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Optional cap per payment (leave blank for no limit). Amount in INR.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="1"
                value={form.maxTransactionAmount ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    maxTransactionAmount: e.target.value === "" ? null : e.target.value,
                  }))
                }
                className="h-8 text-xs w-36"
                placeholder="No limit"
              />
              {form.maxTransactionAmount && (
                <button
                  onClick={() => setForm((p) => ({ ...p, maxTransactionAmount: null }))}
                  className="text-[11px] text-muted-foreground hover:text-danger transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Config summary */}
      {config && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
