import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type FinanceDocument } from "../../../../services/ledgerFinanceService";

/* New Expense — create form (Expenses group). Converted from new-expense.html:
   paid/unpaid toggle, expense line items with GST/IGST tax breakdown, notes,
   proof attachment, and an inline "New Account" modal for Paid-From. */

type TaxKey = "0" | "gst3" | "gst5" | "gst12" | "gst18" | "gst28" | "igst5" | "igst12" | "igst18" | "igst28";
const TAX_RATES: Record<TaxKey, { label: string; pct: number; split: boolean }> = {
  "0": { label: "No Tax", pct: 0, split: false },
  gst3: { label: "GST @3% (split tax)", pct: 3, split: true },
  gst5: { label: "GST @5% (split tax)", pct: 5, split: true },
  gst12: { label: "GST @12% (split tax)", pct: 12, split: true },
  gst18: { label: "GST @18% (split tax)", pct: 18, split: true },
  gst28: { label: "GST @28% (split tax)", pct: 28, split: true },
  igst5: { label: "IGST @5%", pct: 5, split: false },
  igst12: { label: "IGST @12%", pct: 12, split: false },
  igst18: { label: "IGST @18%", pct: 18, split: false },
  igst28: { label: "IGST @28%", pct: 28, split: false },
};
const TAX_KEYS = Object.keys(TAX_RATES) as TaxKey[];

interface ExpenseLine {
  type: string;
  description: string;
  taxKey: TaxKey;
  amount: number;
}
const emptyExpenseLine: ExpenseLine = { type: "", description: "", taxKey: "0", amount: 0 };

const EXPENSE_TYPES = ["Travelling Allowance", "Payment Gateway Charges", "Shipping Charge", "Depreciation Account", "Office Supplies"];

export function NewExpenseView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [expenseType, setExpenseType] = useState<"paid" | "unpaid">("paid");
  const [accounts, setAccounts] = useState(["Cash in hand", "Citi Bank", "SBI Bank", "Standard Chartered Bank"]);
  const [paidFrom, setPaidFrom] = useState("");
  const [recordDate, setRecordDate] = useState("2026-07-04");
  const [dueDate, setDueDate] = useState("2026-07-11");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("No file selected");

  const [lines, setLines] = useState<ExpenseLine[]>([{ ...emptyExpenseLine }]);

  // New Account modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newAcctName, setNewAcctName] = useState("");
  const [newAcctGroup, setNewAcctGroup] = useState("");
  const [newAcctStart, setNewAcctStart] = useState("2026-04-01");
  const [newAcctOpening, setNewAcctOpening] = useState("0.00");
  const [nameError, setNameError] = useState(false);

  const updateLine = (idx: number, patch: Partial<ExpenseLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyExpenseLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const l of lines) {
      const amt = l.amount || 0;
      subtotal += amt;
      tax += amt * (TAX_RATES[l.taxKey].pct / 100);
    }
    return { subtotal, tax, grand: subtotal + tax };
  }, [lines]);

  const openModal = () => {
    setNewAcctName(""); setNewAcctGroup(""); setNewAcctStart("2026-04-01"); setNewAcctOpening("0.00");
    setNameError(false); setModalOpen(true);
  };
  const saveAccount = () => {
    const name = newAcctName.trim();
    if (!name) { setNameError(true); return; }
    setAccounts((prev) => [...prev, name]);
    setPaidFrom(name);
    setModalOpen(false);
  };

  const handleSave = async () => {
    const payload: FinanceDocument = {
      type: "EXPENSE",
      status: expenseType === "paid" ? "Paid" : "Unpaid",
      customerName: paidFrom || undefined,
      docDate: recordDate,
      dueDate: expenseType === "unpaid" ? dueDate : undefined,
      notes: notes || undefined,
      currency: "INR",
      subtotal: totals.subtotal,
      tax: totals.tax,
      grandTotal: totals.grand,
      items: lines.map((l) => {
        const pct = TAX_RATES[l.taxKey].pct;
        return {
          item: l.type || undefined,
          description: l.description || undefined,
          qty: 1,
          cost: l.amount,
          disc: 0,
          tax: pct,
          lineTotal: l.amount + l.amount * (pct / 100),
        };
      }),
    };
    try {
      const saved = await ledgerFinanceService.createDocument(payload);
      toast.success(`Expense ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save expense.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>New Expense</h1>
          <p className="masthead-desc">Record a business expense</p>
        </div>
      </div>

      {/* VOUCHER & META */}
      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Voucher Number</label>
            <div className="readonly-field">EXP/001</div>
          </div>

          <div className="field">
            <label>Expense Type</label>
            <div className="segmented">
              <label className={expenseType === "paid" ? "checked" : ""} onClick={() => setExpenseType("paid")}>
                <input type="radio" name="expenseType" checked={expenseType === "paid"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Paid
              </label>
              <label className={expenseType === "unpaid" ? "checked unpaid-checked" : ""} onClick={() => setExpenseType("unpaid")}>
                <input type="radio" name="expenseType" checked={expenseType === "unpaid"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Unpaid
              </label>
            </div>
          </div>

          <div className="field">
            <label>Paid From</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ flex: 1 }} value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)}>
                <option value="">Select Account</option>
                {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button type="button" className="btn btn-ghost" onClick={openModal} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>+ New</button>
            </div>
          </div>

          <div className="field">
            <label>Record Date</label>
            <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
          </div>

          <div className={`field conditional-field${expenseType === "unpaid" ? " show" : ""}`}>
            <label>Due On</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LINE ITEMS */}
      <div className="form-card">
        <h2 className="section-title">Expense Items</h2>
        <div className="table-scroll" style={{ padding: 0 }}>
          <table className="item-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Type Of Expense</th>
                <th style={{ width: "32%" }}>Description</th>
                <th style={{ width: "22%" }}>Tax</th>
                <th style={{ width: "18%", textAlign: "right" }}>Amount (INR)</th>
                <th style={{ width: "6%" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const tax = TAX_RATES[line.taxKey];
                const taxAmt = (line.amount || 0) * (tax.pct / 100);
                return (
                  <tr key={idx}>
                    <td className="col-item">
                      <select value={line.type} onChange={(e) => updateLine(idx, { type: e.target.value })}>
                        <option value="">Select Expense Type</option>
                        {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="col-desc">
                      <textarea rows={1} placeholder="Description" maxLength={250} value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </td>
                    <td className="col-tax">
                      <select className="taxsel" value={line.taxKey} onChange={(e) => updateLine(idx, { taxKey: e.target.value as TaxKey })}>
                        {TAX_KEYS.map((k) => <option key={k} value={k}>{TAX_RATES[k].label}</option>)}
                      </select>
                      <div className={`tax-breakdown${tax.pct > 0 ? " show" : ""}`}>
                        {tax.pct > 0 && (tax.split ? (
                          <>
                            <div className="tb-row"><span>CGST</span><span>{(taxAmt / 2).toFixed(2)}</span></div>
                            <div className="tb-row"><span>SGST</span><span>{(taxAmt / 2).toFixed(2)}</span></div>
                          </>
                        ) : (
                          <div className="tb-row"><span>IGST</span><span>{taxAmt.toFixed(2)}</span></div>
                        ))}
                      </div>
                    </td>
                    <td className="col-total">
                      <input type="number" className="amt" step="0.01" min={0} value={line.amount}
                        onChange={(e) => updateLine(idx, { amount: parseFloat(e.target.value) || 0 })} />
                    </td>
                    <td className="col-del">
                      <button type="button" className="row-del" aria-label="Remove line" onClick={() => removeLine(idx)} disabled={lines.length === 1} style={lines.length === 1 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="button" className="add-line" onClick={addLine}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          New Expense
        </button>

        <div className="totals-wrap">
          <div className="totals">
            <div className="totals-row"><span>Subtotal</span><span className="amt">{totals.subtotal.toFixed(2)}</span></div>
            <div className="totals-row"><span>Total Tax</span><span className="amt">{totals.tax.toFixed(2)}</span></div>
            <div className="totals-row grand"><span>Total</span><span className="amt">{totals.grand.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* NOTES & ATTACHMENT */}
      <div className="form-card">
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field">
            <label>Expense Notes</label>
            <textarea placeholder="Enter some notes" style={{ minHeight: 96 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="upload-row" style={{ marginTop: 16 }}>
          <div className="upload-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16.5 6.5 8 15a3 3 0 1 0 4.2 4.2l8-8a5 5 0 1 0-7-7l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="upload-text">
            <strong>Attach a Scanned Proof</strong>
            <span>Image &amp; PDF document only · <span>{attachmentName}</span></span>
          </div>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setAttachmentName(e.target.files && e.target.files.length ? e.target.files[0].name : "No file selected")} />
        </div>
      </div>

      <div className="action-bar">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Save
        </button>
      </div>

      {/* NEW ACCOUNT MODAL */}
      <div className={`modal-overlay${modalOpen ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modal-card">
          <div className="modal-head">
            <h3>
              <span className="modal-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M2 10h20" stroke="currentColor" strokeWidth="1.6" /><circle cx="7" cy="14.5" r="1" fill="currentColor" /></svg>
              </span>
              New Account
            </h3>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="field">
              <label>Account Name</label>
              <input type="text" placeholder="e.g. HDFC Current Account" value={newAcctName}
                onChange={(e) => { setNewAcctName(e.target.value); setNameError(false); }}
                style={nameError ? { borderColor: "var(--expense)" } : undefined} />
            </div>
            <div className="field">
              <label>Account Group</label>
              <select value={newAcctGroup} onChange={(e) => setNewAcctGroup(e.target.value)}>
                <option value="">Select Account Group</option>
                <option value="bank">Bank Accounts</option>
                <option value="cash">Cash Accounts</option>
                <option value="secured">Secured Loan Accounts</option>
                <option value="unsecured">Unsecured Loan Accounts</option>
              </select>
            </div>
            <div className="field">
              <label>Start From</label>
              <input type="date" value={newAcctStart} onChange={(e) => setNewAcctStart(e.target.value)} />
            </div>
            <div className="field">
              <label>Opening Balance</label>
              <input type="number" step="0.01" value={newAcctOpening} onChange={(e) => setNewAcctOpening(e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={saveAccount}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </section>
  );
}
