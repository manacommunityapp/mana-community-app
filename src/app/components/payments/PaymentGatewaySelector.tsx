import { useEffect } from "react";
import { CreditCard, Wallet, Smartphone, Landmark, Banknote, Info } from "lucide-react";
import type { CheckoutOptions } from "../../../services/payments/paymentConfigService";

const GATEWAY_META: Record<string, { label: string; desc: string; Icon: typeof CreditCard }> = {
  CASHFREE:  { label: "Cashfree",             desc: "UPI, Cards, Net Banking",      Icon: CreditCard   },
  RAZORPAY:  { label: "Razorpay",             desc: "UPI, Cards, Wallets",          Icon: Smartphone   },
  MANA_PAY:  { label: "ManaPay",              desc: "Community Wallet",             Icon: Wallet       },
  UPI_DIRECT:{ label: "UPI Direct",           desc: "Any UPI App",                  Icon: Landmark     },
};

const MANUAL_MODE_META: Record<string, string> = {
  CASH:         "Cash",
  CHEQUE:       "Cheque",
  BANK_TRANSFER:"Bank Transfer",
  UPI_MANUAL:   "UPI (Manual)",
  DEMAND_DRAFT: "Demand Draft",
};

interface Props {
  options: CheckoutOptions;
  selectedGateway: string;
  selectedManualMode?: string;
  onChange: (gateway: string, manualMode?: string) => void;
  orderAmount?: number;
}

export function PaymentGatewaySelector({ options, selectedGateway, selectedManualMode, onChange, orderAmount }: Props) {
  const visibleGateways = options.gatewayOptions.filter((g) => g !== "MANUAL");

  // Pre-select defaultGateway on first render if nothing is selected
  useEffect(() => {
    if (!selectedGateway && options.defaultGateway && visibleGateways.includes(options.defaultGateway)) {
      onChange(options.defaultGateway);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/* Online gateways */}
      {visibleGateways.length > 0 && (
        <div className="space-y-2">
          {visibleGateways.map((gw) => {
            const meta = GATEWAY_META[gw] ?? { label: gw, desc: "", Icon: CreditCard };
            const active = selectedGateway === gw;
            return (
              <button
                key={gw}
                type="button"
                onClick={() => onChange(gw)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-400"
                    : "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-violet-100" : "bg-gray-100"}`}>
                  <meta.Icon className={`w-4 h-4 ${active ? "text-violet-600" : "text-gray-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${active ? "text-violet-800" : "text-gray-800"}`}>{meta.label}</p>
                  {meta.desc && <p className="text-xs text-gray-500">{meta.desc}</p>}
                </div>
                <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${active ? "border-violet-600 bg-violet-600" : "border-gray-300"}`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Manual / offline payment */}
      {options.manualPaymentEnabled && options.manualPaymentModes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">or pay offline</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex flex-wrap gap-2">
            {options.manualPaymentModes.map((mode) => {
              const active = selectedGateway === "MANUAL" && selectedManualMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange("MANUAL", mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/40"
                  }`}
                >
                  <Banknote className="w-3 h-3" />
                  {MANUAL_MODE_META[mode] ?? mode}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Convenience fee note — shows calculated amounts when orderAmount is provided */}
      {options.convenienceFeePercent > 0 && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500 space-y-0.5">
          {orderAmount != null ? (
            <>
              <p className="flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>Convenience fee ({options.convenienceFeePercent}%):&nbsp;
                  <span className="font-semibold text-gray-700">
                    ₹{((orderAmount * options.convenienceFeePercent) / 100).toFixed(2)}
                  </span>
                </span>
              </p>
              <p className="flex items-center gap-1 pl-4">
                Total payable:&nbsp;
                <span className="font-semibold text-gray-800">
                  ₹{(orderAmount + (orderAmount * options.convenienceFeePercent) / 100).toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-400">(preview — final amount confirmed by server)</span>
              </p>
            </>
          ) : (
            <p className="flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              A {options.convenienceFeePercent}% convenience fee applies
            </p>
          )}
        </div>
      )}

      {/* Community payment instructions */}
      {options.paymentInstructions && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {options.paymentInstructions}
        </div>
      )}
    </div>
  );
}
