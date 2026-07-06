import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type Vendor, type VendorPayment, type FinanceDocument } from "../../../../services/ledgerFinanceService";

/* New Vendor Payment — create form (Expenses group → Vendor Payments). A
   voucher-type tab group switches between three flows via `kind`:
     • "paid"    → Against Purchases / Expenses (paymentType PAID_BILL, PYMT/001)
     • "advance" → GST Advance Payment          (paymentType ADVANCE,  APYMT/001)
     • "other"   → Other Payment                (paymentType OTHER,    OPAY/001)
   The "paid" flow (from new_payment_voucher.html) allocates against the vendor's
   unpaid PURCHASE / EXPENSE documents. "advance" / "other" (from
   new_advance_payment.html) capture line items. Persists the voucher total via
   the vendor-payments API. */

type PaymentKind = "paid" | "advance" | "other";

interface PayLine { item: string; description: string; qty: number; cost: number; disc: number; taxPct: number }
const emptyLine: PayLine = { item: "", description: "", qty: 1, cost: 0, disc: 0, taxPct: 0 };

const TAX_OPTIONS = [
  { value: 0, label: "No Tax" },
  { value: 3, label: "GST @3% (split tax)" },
  { value: 5, label: "GST @5% (split tax)" },
  { value: 12, label: "GST @12% (split tax)" },
  { value: 18, label: "GST @18% (split tax)" },
  { value: 28, label: "GST @28% (split tax)" },
];

const ACCOUNTS = ["Cash in hand", "Citi bank", "SBI bank", "Standard chartered bank", "tds receivable"];

const ACCOUNT_GROUPS = ["Bank Accounts", "Cash Accounts", "Current Liabilities", "Other Current Assets", "Secured Loan Accounts", "TDS Receivable", "Unsecured Loan Accounts"];

// Ledger accounts a miscellaneous "Other Payment" can be paid to.
const PAY_TO_ACCOUNTS = [
  "adjustment on purchase", "adjustment on sales", "Basic", "Bonus", "Dearness Allowance",
  "Depreciation Account", "Discount on Sales Account", "Gain or loss on fluctuation in foreign currency",
  "House Rent Allowance", "Interest on Loans Account", "other charge on purchase", "Payment Gateway Charge",
  "Payment Gateway Charges", "Purchase Account - default expense", "shipping charge", "Travelling Allowance",
  "CGST @1.5 on purchases", "CGST @2.5 on purchases", "CGST @6.0 on purchases", "CGST @9.0 on purchases", "CGST @14.0 on purchases",
  "SGST @1.5 on purchases", "SGST @2.5 on purchases", "SGST @6.0 on purchases", "SGST @9.0 on purchases", "SGST @14.0 on purchases",
  "IGST @3% on purchases", "IGST @5% on purchases", "IGST @12% on purchases", "IGST @18% on purchases", "IGST @28% on purchases",
  "GST @3% on purchases", "GST @5% on purchases", "GST @12% on purchases", "GST @18% on purchases", "GST @28% on purchases",
];

const PAYMENT_MODES = [
  { value: "ibank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Credit/Debit Card" },
];

const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkand", "Karnataka", "Kerala", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Other Territory", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttarakhand", "Uttar Pradesh", "West Bengal"];

const TDS_SECTIONS = [
  "Sec.193 - Interest on Debentures",
  "Sec.194 - Deemed Dividend",
  "Sec. 194A - Interest on Securities",
  "Sec. 194B - Winnings from Lotteries or Puzzle or Game",
  "Sec. 194 BB - Winnings from Horse Race",
  "Sec. 194 C 1- Payment to Contractors",
  "Sec. 194 C 2- Payment to Sub-Contractors or for Advertisements",
  "Sec. 194 D- Payment of Insurance Commission",
  "Sec. 194 EE -Payment of NSS Deposits",
  "Sec. 194 F -Repurchase of units by Mutual Funds or UTI",
  "Sec. 194 G - Commission on Sale of Lottery tickets",
  "Sec. 194 H - Commission or Brokerage",
  "Sec. 194 I - Rent of Land or Building or Furniture or Plant and Machinery",
  "Sec. 194 IA - Transfer of Immovable Property",
  "Sec. 194 J - Professional or technical services or royalty",
  "Sec. 194 J 1 - Remuneration or commission to director of the company",
  "Sec. 194 L - Compensation on acquisition of Capital Asset",
  "Sec. 194 LA - Compensation on acquisition of certain immovable property",
];

export function NewVendorPaymentView({ kind, onSwitchKind, onCancel, onSave }: { kind: PaymentKind; onSwitchKind: (kind: PaymentKind) => void; onCancel: () => void; onSave: () => void }) {
  const isPaid = kind === "paid";
  const isAdvance = kind === "advance";
  const isOther = kind === "other";
  const voucherNo = kind === "advance" ? "APYMT/001" : kind === "other" ? "OPAY/001" : "PYMT/001";
  const accountLabel = isAdvance ? "Deposit To" : isPaid ? "Pay From" : "Paid From";
  const dateLabel = isAdvance ? "Receipt Date" : "Payment Date";
  const title = kind === "advance" ? "New Advance Payment" : kind === "other" ? "New Other Payment" : "New Payment";
  const subtitle = kind === "advance" ? "Record a GST advance payment to a vendor"
    : kind === "other" ? "Record a miscellaneous payment not against a vendor bill"
    : "Pay against unpaid purchases / expenses for a vendor";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [payDate, setPayDate] = useState("2026-07-05");
  const [accounts, setAccounts] = useState<string[]>(ACCOUNTS);
  const [account, setAccount] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [tdsSection, setTdsSection] = useState("");
  const [description, setDescription] = useState("");

  // other: single payee account + amount + optional TDS
  const [toAccount, setToAccount] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [tdsAmount, setTdsAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [chequeDate, setChequeDate] = useState("");

  // advance / other: line items
  const [lines, setLines] = useState<PayLine[]>([{ ...emptyLine }]);

  // paid: allocation against unpaid documents
  const [unpaidDocs, setUnpaidDocs] = useState<FinanceDocument[]>([]);
  const [allocations, setAllocations] = useState<Record<number, number>>({});

  // New Vendor modal
  const [vendorModal, setVendorModal] = useState(false);
  const [vName, setVName] = useState("");
  const [nameError, setNameError] = useState(false);

  // New Account modal (paid)
  const [accountModal, setAccountModal] = useState(false);
  const [accName, setAccName] = useState("");
  const [accGroup, setAccGroup] = useState("");
  const [accStart, setAccStart] = useState("2026-04-01");
  const [accOpening, setAccOpening] = useState("0.0");
  const [accError, setAccError] = useState(false);

  useEffect(() => {
    (async () => {
      try { setVendors(await ledgerFinanceService.getVendors()); } catch { /* non-fatal */ }
    })();
  }, []);

  // Load the selected vendor's unpaid purchases / expenses for the paid flow.
  useEffect(() => {
    if (!isPaid) return;
    const vendor = vendors.find((v) => String(v.id) === vendorId);
    if (!vendor) { setUnpaidDocs([]); setAllocations({}); return; }
    (async () => {
      try {
        const [pur, exp] = await Promise.all([
          ledgerFinanceService.getDocuments("PURCHASE"),
          ledgerFinanceService.getDocuments("EXPENSE"),
        ]);
        const unpaid = [...pur, ...exp].filter((d) =>
          (d.customerName || "").toLowerCase() === vendor.name.toLowerCase() &&
          (d.status || "").toLowerCase() !== "paid");
        setUnpaidDocs(unpaid);
        setAllocations({});
      } catch { /* non-fatal */ }
    })();
  }, [isPaid, vendorId, vendors]);

  const updateLine = (idx: number, patch: Partial<PayLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const lineTotals = useMemo(() => {
    let subtotal = 0, tax = 0;
    const nets = lines.map((l) => {
      const net = (l.qty || 0) * (l.cost || 0) * (1 - (l.disc || 0) / 100);
      subtotal += net;
      tax += net * ((l.taxPct || 0) / 100);
      return net;
    });
    return { subtotal, tax, grand: subtotal + tax, nets };
  }, [lines]);

  const allocatedTotal = useMemo(() => Object.values(allocations).reduce((s, a) => s + (a || 0), 0), [allocations]);
  const grandTotal = isPaid ? allocatedTotal : isOther ? (parseFloat(otherAmount) || 0) : lineTotals.grand;

  const saveVendor = async () => {
    if (!vName.trim()) { setNameError(true); return; }
    try {
      const created = await ledgerFinanceService.createVendor({ name: vName.trim(), status: "Active" });
      setVendors((prev) => [...prev, created]);
      if (created.id != null) setVendorId(String(created.id));
      setVendorModal(false);
      setVName("");
      toast.success(`Vendor "${created.name}" created and selected!`);
    } catch {
      toast.error("Failed to create vendor.");
    }
  };

  const openAccountModal = () => {
    setAccName(""); setAccGroup(""); setAccStart("2026-04-01"); setAccOpening("0.0");
    setAccError(false); setAccountModal(true);
  };
  const saveAccount = () => {
    if (!accName.trim()) { setAccError(true); return; }
    setAccounts((prev) => [...prev, accName.trim()]);
    setAccount(accName.trim());
    setAccountModal(false);
    toast.success(`Account "${accName.trim()}" added and selected!`);
  };

  const handleSave = async () => {
    let payeeId: number | undefined;
    let payeeName: string;
    if (isOther) {
      if (!toAccount) { toast.error("Please select a Pay To account."); return; }
      if (grandTotal <= 0) { toast.error("Please enter an amount."); return; }
      payeeName = toAccount;
    } else {
      const vendor = vendors.find((v) => String(v.id) === vendorId);
      if (!vendor) { toast.error("Please select a vendor."); return; }
      if (isPaid && grandTotal <= 0) { toast.error("Enter a payment amount against at least one bill."); return; }
      payeeId = vendor.id;
      payeeName = vendor.name;
    }
    const modeLabel = PAYMENT_MODES.find((m) => m.value === mode)?.label || mode;
    const notes = [
      description,
      isPaid && tdsSection ? `TDS Section: ${tdsSection}` : "",
      isOther && tdsApplicable && tdsSection ? `TDS Section: ${tdsSection}` : "",
      isOther && tdsApplicable && tdsAmount ? `TDS Amount: ${tdsAmount}` : "",
    ].filter(Boolean).join(" | ") || undefined;
    const payload: VendorPayment = {
      paymentType: kind === "advance" ? "ADVANCE" : kind === "other" ? "OTHER" : "PAID_BILL",
      vendorId: payeeId,
      vendorName: payeeName,
      paymentDate: payDate,
      amount: grandTotal,
      paymentMode: modeLabel,
      paidFrom: account || undefined,
      reference: reference || undefined,
      status: isAdvance ? "Unallocated" : "Paid",
      notes,
    };
    try {
      const saved = await ledgerFinanceService.createVendorPayment(payload);
      toast.success(`${isAdvance ? "Advance payment" : "Payment"} ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save payment.");
      return;
    }
    onSave();
  };

  const voucherTabs = (
    <div className="tabs" style={{ marginBottom: 16 }}>
      <button type="button" className={`tab${kind === "paid" ? " active" : ""}`} onClick={() => kind !== "paid" && onSwitchKind("paid")}>Against Purchases / Expenses</button>
      <button type="button" className={`tab${kind === "advance" ? " active" : ""}`} onClick={() => kind !== "advance" && onSwitchKind("advance")}>Advance Payment</button>
      <button type="button" className={`tab${kind === "other" ? " active" : ""}`} onClick={() => kind !== "other" && onSwitchKind("other")}>Other Payment</button>
    </div>
  );

  const vendorSelect = (label: string) => (
    <div className="field">
      <label>{label} *</label>
      <div style={{ display: "flex", gap: 8 }}>
        <select style={{ flex: 1 }} value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
          <option value="">Select Vendor</option>
          {vendors.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
        </select>
        <button type="button" className="btn btn-ghost" onClick={() => { setVName(""); setNameError(false); setVendorModal(true); }} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>+ New Vendor</button>
      </div>
    </div>
  );

  const paymentModeFields = (
    <>
      <div className="field">
        <label>Payment Mode *</label>
        <select value={mode} onChange={(e) => { setMode(e.target.value); setReference(""); setChequeDate(""); }} required>
          {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      {mode === "ibank" && (
        <div className="field">
          <label>Reference Number</label>
          <input type="text" placeholder="Transaction / UTR Number" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      )}
      {mode === "cheque" && (
        <>
          <div className="field">
            <label>Cheque Number</label>
            <input type="text" placeholder="Enter Cheque Number" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="field">
            <label>Cheque Date</label>
            <input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
          </div>
        </>
      )}
      {mode === "card" && (
        <div className="field">
          <label>Card Last 4 Digits</label>
          <input type="text" maxLength={4} placeholder="1234" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      )}
    </>
  );

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Vendor Payments</p>
          <h1>{title}</h1>
          <p className="masthead-desc">{subtitle}</p>
        </div>
      </div>

      {voucherTabs}

      {/* ============ AGAINST PURCHASES / EXPENSES ============ */}
      {isPaid && (
        <>
          <div className="form-card">
            <div className="form-grid">
              {vendorSelect("Pay To")}
              <div className="field">
                <label>Voucher Number</label>
                <div className="readonly-field">{voucherNo}</div>
              </div>
              <div className="field">
                <label>{accountLabel} *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ flex: 1 }} value={account} onChange={(e) => setAccount(e.target.value)} required>
                    <option value="">Select Account</option>
                    {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button type="button" className="btn btn-ghost" onClick={openAccountModal} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>+ New Account</button>
                </div>
              </div>
              <div className="field">
                <label>{dateLabel} *</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* UNPAID PURCHASES / EXPENSES */}
          <div className="form-card">
            <h2 className="section-title">Showing Unpaid Purchases / Expenses for Selected Vendor</h2>
            {unpaidDocs.length === 0 ? (
              <div className="empty-inline" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 2px", color: "var(--muted)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <strong>There are no records.</strong>
              </div>
            ) : (
              <div className="table-scroll" style={{ padding: 0 }}>
                <table className="item-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Voucher Number</th>
                      <th style={{ width: "18%" }}>Date</th>
                      <th style={{ width: "16%" }}>Type</th>
                      <th style={{ width: "18%", textAlign: "right" }}>Amount</th>
                      <th style={{ width: "24%", textAlign: "right" }}>Payment Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidDocs.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{d.code || `#${d.id}`}</td>
                        <td>{d.docDate || ""}</td>
                        <td>{d.type === "EXPENSE" ? "Expense" : "Purchase"}</td>
                        <td style={{ textAlign: "right" }}>{(d.grandTotal ?? 0).toFixed(2)}</td>
                        <td className="col-cost">
                          <input type="number" className="cost" step="0.01" min={0} max={d.grandTotal ?? undefined}
                            value={d.id != null ? (allocations[d.id] ?? "") : ""}
                            onChange={(e) => d.id != null && setAllocations((prev) => ({ ...prev, [d.id as number]: parseFloat(e.target.value) || 0 }))} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div className="field">
                <label>TDS Section</label>
                <select value={tdsSection} onChange={(e) => setTdsSection(e.target.value)}>
                  <option value="">Select Account</option>
                  {TDS_SECTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-grid">
              {paymentModeFields}
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="totals-wrap">
              <div className="totals">
                <div className="totals-row grand"><span>Total Payment</span><span className="amt">{grandTotal.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ ADVANCE PAYMENT (line items) ============ */}
      {isAdvance && (
        <>
          <div className="form-card">
            <div className="form-grid">
              {vendorSelect("Vendor Name")}
              <div className="field">
                <label>Voucher Number</label>
                <div className="readonly-field">{voucherNo}</div>
              </div>
              <div className="field">
                <label>{dateLabel} *</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
              <div className="field">
                <label>{accountLabel} *</label>
                <select value={account} onChange={(e) => setAccount(e.target.value)} required>
                  <option value="">Select Account</option>
                  {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {isAdvance && (
                <div className="field">
                  <label>Place Of Supply *</label>
                  <select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} required>
                    <option value="">Select State</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Payment Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {paymentModeFields}
            </div>
          </div>

          <div className="form-card">
            <h2 className="section-title">Line Items</h2>
            <div className="table-scroll" style={{ padding: 0 }}>
              <table className="item-table">
                <thead>
                  <tr>
                    <th style={{ width: "18%" }}>Item *</th>
                    <th style={{ width: "22%" }}>Description</th>
                    <th style={{ width: "8%" }}>Qty *</th>
                    <th style={{ width: "12%" }}>Unit cost *</th>
                    <th style={{ width: "10%" }}>Discount %</th>
                    <th style={{ width: "16%" }}>Tax</th>
                    <th style={{ width: "12%", textAlign: "right" }}>Amount (INR) *</th>
                    <th style={{ width: "4%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="col-item">
                        <select value={line.item} onChange={(e) => updateLine(idx, { item: e.target.value })}>
                          <option value="">Select Item</option>
                          <option value="Raw Material A">Raw Material A</option>
                          <option value="Packaging Boxes">Packaging Boxes</option>
                          <option value="Office Furniture">Office Furniture</option>
                        </select>
                      </td>
                      <td className="col-desc"><textarea rows={1} value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} /></td>
                      <td className="col-qty"><input type="number" className="qty" step="1" min={0} value={line.qty} onChange={(e) => updateLine(idx, { qty: parseFloat(e.target.value) || 0 })} /></td>
                      <td className="col-cost"><input type="number" className="cost" step="0.01" min={0} value={line.cost} onChange={(e) => updateLine(idx, { cost: parseFloat(e.target.value) || 0 })} /></td>
                      <td className="col-disc"><div className="disc-cell"><input type="number" className="disc" step="0.1" min={0} value={line.disc} onChange={(e) => updateLine(idx, { disc: parseFloat(e.target.value) || 0 })} /><span>%</span></div></td>
                      <td className="col-tax">
                        <select value={line.taxPct} onChange={(e) => updateLine(idx, { taxPct: parseFloat(e.target.value) || 0 })}>
                          {TAX_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="col-total">{lineTotals.nets[idx].toFixed(2)}</td>
                      <td className="col-del">
                        <button type="button" className="row-del" aria-label="Remove line" onClick={() => removeLine(idx)} disabled={lines.length === 1} style={lines.length === 1 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="add-line" onClick={addLine}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Row
            </button>

            <div className="totals-wrap">
              <div className="totals">
                <div className="totals-row"><span>Subtotal</span><span className="amt">{lineTotals.subtotal.toFixed(2)}</span></div>
                <div className="totals-row"><span>Discount</span><span className="amt">0.00</span></div>
                <div className="totals-row"><span>Total Tax</span><span className="amt">{lineTotals.tax.toFixed(2)}</span></div>
                <div className="totals-row grand"><span>Total</span><span className="amt">{lineTotals.grand.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ OTHER PAYMENT (single amount + TDS) ============ */}
      {isOther && (
        <>
          <div className="form-card">
            <div className="form-grid">
              <div className="field">
                <label>Pay To *</label>
                <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
                  <option value="">Select Account</option>
                  {PAY_TO_ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Voucher Number</label>
                <div className="readonly-field">{voucherNo}</div>
              </div>
              <div className="field">
                <label>{accountLabel} *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ flex: 1 }} value={account} onChange={(e) => setAccount(e.target.value)} required>
                    <option value="">Select Account</option>
                    {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button type="button" className="btn btn-ghost" onClick={openAccountModal} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>+ New Account</button>
                </div>
              </div>
              <div className="field">
                <label>{dateLabel} *</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
              <div className="field">
                <label>Amount *</label>
                <input type="number" step="0.01" min={0} maxLength={11} placeholder="0.00" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} required />
              </div>
              <div className="field">
                <label>TDS Applicable?</label>
                <div className="segmented">
                  <label className={!tdsApplicable ? "checked" : ""} onClick={() => setTdsApplicable(false)}>
                    <input type="radio" name="tdsApplicable" checked={!tdsApplicable} readOnly />
                    <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    No
                  </label>
                  <label className={tdsApplicable ? "checked" : ""} onClick={() => setTdsApplicable(true)}>
                    <input type="radio" name="tdsApplicable" checked={tdsApplicable} readOnly />
                    <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Yes
                  </label>
                </div>
              </div>

              {tdsApplicable && (
                <>
                  <div className="field">
                    <label>TDS Section *</label>
                    <select value={tdsSection} onChange={(e) => setTdsSection(e.target.value)}>
                      <option value="">Select Section</option>
                      {TDS_SECTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>TDS Amount *</label>
                    <input type="number" step="0.01" min={0} placeholder="0.00" value={tdsAmount} onChange={(e) => setTdsAmount(e.target.value)} />
                  </div>
                </>
              )}

              {paymentModeFields}

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="totals-wrap">
              <div className="totals">
                <div className="totals-row grand"><span>Total Payment</span><span className="amt">{grandTotal.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="action-bar">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Save
        </button>
      </div>

      {/* NEW VENDOR MODAL */}
      <div className={`modal-overlay${vendorModal ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setVendorModal(false); }}>
        <div className="modal-card" style={{ maxWidth: 460 }}>
          <div className="modal-head">
            <h3>
              <span className="modal-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-4 4.4-6 7-6s5.8 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </span>
              New Vendor
            </h3>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setVendorModal(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="field">
              <label>Name *</label>
              <input type="text" placeholder="Enter Name" value={vName}
                onChange={(e) => { setVName(e.target.value); setNameError(false); }}
                style={nameError ? { borderColor: "var(--expense)" } : undefined} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={saveVendor}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setVendorModal(false)}>Cancel</button>
          </div>
        </div>
      </div>

      {/* NEW ACCOUNT MODAL */}
      <div className={`modal-overlay${accountModal ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setAccountModal(false); }}>
        <div className="modal-card" style={{ maxWidth: 460 }}>
          <div className="modal-head">
            <h3><span className="modal-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" /></svg></span>New Account</h3>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setAccountModal(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="field">
              <label>Account Name *</label>
              <input type="text" placeholder="Enter Account Name" value={accName}
                onChange={(e) => { setAccName(e.target.value); setAccError(false); }}
                style={accError ? { borderColor: "var(--expense)" } : undefined} />
            </div>
            <div className="field">
              <label>Account Group *</label>
              <select value={accGroup} onChange={(e) => setAccGroup(e.target.value)}>
                <option value="">Select Account</option>
                {ACCOUNT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Start From</label>
              <input type="date" value={accStart} onChange={(e) => setAccStart(e.target.value)} />
            </div>
            <div className="field">
              <label>Opening Balance</label>
              <input type="text" maxLength={18} value={accOpening} onChange={(e) => setAccOpening(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={saveAccount}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAccountModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </section>
  );
}
