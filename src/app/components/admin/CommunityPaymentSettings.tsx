import { useState, useEffect } from "react";
import {
  CreditCard,
  Loader2,
  Save,
  Info,
  Banknote,
  CheckSquare,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import {
  paymentConfigService,
  type CheckoutOptions,
  type CommunityPaymentSettings as CommunityPaymentSettingsType,
  type UpdateCommunityPaymentSettingsRequest,
} from "../../../services/payments/paymentConfigService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { useAuth } from "../../../contexts/AuthContext";

const GATEWAY_LABELS: Record<string, string> = {
  CASHFREE: "Cashfree",
  RAZORPAY: "Razorpay",
  MANA_PAY: "ManaPay",
  UPI_DIRECT: "UPI Direct",
  BBPS: "BBPS",
};

const MANUAL_MODE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI_MANUAL", label: "UPI (Manual)" },
  { value: "DEMAND_DRAFT", label: "Demand Draft" },
];

export function CommunityPaymentSettings() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null);
  const [settings, setSettings] = useState<CommunityPaymentSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<UpdateCommunityPaymentSettingsRequest>({
    allowedPaymentGateways: [],
    manualPaymentEnabled: true,
    manualPaymentModes: ["CASH", "UPI_MANUAL"],
    paymentInstructions: null,
    defaultGateway: null,
    cashierCanRecordPayment: true,
    fallbackGateway: null,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [opts, cfg] = await Promise.all([
        paymentConfigService.getCheckoutOptions(),
        paymentConfigService.getCommunityPaymentSettings(),
      ]);
      setCheckoutOptions(opts);
      setSettings(cfg);
      setForm({
        allowedPaymentGateways: cfg.allowedPaymentGateways ?? [],
        manualPaymentEnabled: cfg.manualPaymentEnabled,
        manualPaymentModes: cfg.manualPaymentModes ?? [],
        paymentInstructions: cfg.paymentInstructions,
        defaultGateway: cfg.defaultGateway,
        cashierCanRecordPayment: cfg.cashierCanRecordPayment,
        fallbackGateway: cfg.fallbackGateway,
      });
    } catch {
      showError("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await paymentConfigService.updateCommunityPaymentSettings(form);
      setSettings(updated);
      showSuccess("Payment settings saved");
    } catch {
      showError("Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  }

  function toggleGateway(gateway: string, checked: boolean) {
    setForm((prev) => {
      const current = prev.allowedPaymentGateways ?? [];
      const next = checked ? [...current, gateway] : current.filter((g) => g !== gateway);
      // Clear default/fallback if they point to the removed gateway
      return {
        ...prev,
        allowedPaymentGateways: next,
        defaultGateway: prev.defaultGateway === gateway && !checked ? null : prev.defaultGateway,
        fallbackGateway:
          prev.fallbackGateway === gateway && !checked ? null : prev.fallbackGateway,
      };
    });
  }

  function toggleManualMode(mode: string, checked: boolean) {
    setForm((prev) => {
      const current = prev.manualPaymentModes ?? [];
      return {
        ...prev,
        manualPaymentModes: checked
          ? [...current, mode]
          : current.filter((m) => m !== mode),
      };
    });
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Admin access required</p>
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

  // Platform-enabled gateways (from checkout-options) are the ceiling for what a community can pick
  const platformGateways = checkoutOptions?.gatewayOptions ?? [];
  const allowedGateways = form.allowedPaymentGateways ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5 text-white" />
            </div>
            Community Payment Settings
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-9">
            Configure payment methods available to your community members
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save Changes
        </button>
      </div>

      {/* Platform scope notice */}
      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        Options shown here are limited to gateways enabled by the platform administrator.
      </div>

      {/* Allowed Payment Gateways */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Allowed Payment Gateways
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Select which gateways your members can use at checkout
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {platformGateways.length === 0 ? (
            <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">
              No gateways enabled by platform administrator yet.
            </div>
          ) : (
            platformGateways.map((gw) => (
              <div key={gw} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`gw-${gw}`}
                    checked={allowedGateways.includes(gw)}
                    onCheckedChange={(checked) => toggleGateway(gw, Boolean(checked))}
                  />
                  <Label htmlFor={`gw-${gw}`} className="text-[13px] font-medium cursor-pointer">
                    {GATEWAY_LABELS[gw] ?? gw}
                  </Label>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Default and Fallback Gateways */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Gateway Preferences
          </p>
        </div>
        <div className="divide-y divide-border/50">
          <div className="px-4 py-3.5">
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">
              Default Gateway
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Pre-selected for members at checkout
            </p>
            <Select
              value={form.defaultGateway ?? "__none__"}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, defaultGateway: v === "__none__" ? null : v }))
              }
              disabled={allowedGateways.length === 0}
            >
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Use platform default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-muted-foreground">
                  Use platform default
                </SelectItem>
                {allowedGateways.map((gw) => (
                  <SelectItem key={gw} value={gw} className="text-xs">
                    {GATEWAY_LABELS[gw] ?? gw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="px-4 py-3.5">
            <Label className="text-xs font-semibold text-foreground mb-1.5 block">
              Fallback Gateway
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Used if the default gateway is unavailable (optional)
            </p>
            <Select
              value={form.fallbackGateway ?? "__none__"}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, fallbackGateway: v === "__none__" ? null : v }))
              }
              disabled={allowedGateways.length === 0}
            >
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="No fallback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-muted-foreground">
                  No fallback
                </SelectItem>
                {allowedGateways.map((gw) => (
                  <SelectItem key={gw} value={gw} className="text-xs">
                    {GATEWAY_LABELS[gw] ?? gw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Manual Payment */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Manual Payment (Offline)
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Allow admin/cashier to record cash, cheque and other offline payments
              </p>
            </div>
            <Switch
              checked={form.manualPaymentEnabled}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, manualPaymentEnabled: checked }))
              }
            />
          </div>
        </div>

        {form.manualPaymentEnabled && (
          <div className="divide-y divide-border/50">
            {/* Payment modes */}
            <div className="px-4 py-3.5">
              <Label className="text-xs font-semibold text-foreground mb-2 block">
                Accepted Payment Modes
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {MANUAL_MODE_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`mode-${value}`}
                      checked={(form.manualPaymentModes ?? []).includes(value)}
                      onCheckedChange={(checked) => toggleManualMode(value, Boolean(checked))}
                    />
                    <Label htmlFor={`mode-${value}`} className="text-xs cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cashier permission */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Banknote className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    Cashier can record payments
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Allow users with CASHIER role to record manual payments
                  </p>
                </div>
              </div>
              <Switch
                checked={form.cashierCanRecordPayment}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, cashierCanRecordPayment: checked }))
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Payment Instructions
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Shown to members at the checkout screen (optional)
          </p>
        </div>
        <div className="px-4 py-3.5">
          <textarea
            value={form.paymentInstructions ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                paymentInstructions: e.target.value === "" ? null : e.target.value,
              }))
            }
            rows={3}
            maxLength={1000}
            placeholder="e.g. For NEFT transfers, use account XXXX. Contact the office for cheque payments."
            className="w-full text-xs rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {(form.paymentInstructions ?? "").length}/1000
          </p>
        </div>
      </div>
    </div>
  );
}
