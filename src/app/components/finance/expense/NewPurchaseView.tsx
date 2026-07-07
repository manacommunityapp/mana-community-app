import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type FinanceDocument } from "../../../../services/ledgerFinanceService";

/* New Purchase — create form (Expenses group). Converted from new-purchase.html:
   vendor + meta, cash-purchase toggle, purchase line items with discount and
   GST/IGST tax breakdown, tax-inclusive toggle, notes/terms and an import-purchase
   section that reveals bill-of-entry fields. */

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

interface PurchaseLine {
  item: string;
  description: string;
  qty: number;
  cost: number;
  disc: number;
  taxKey: TaxKey;
}
const emptyLine: PurchaseLine = { item: "", description: "", qty: 0, cost: 0, disc: 0, taxKey: "0" };

const PRODUCTS = ["Raw Material A", "Packaging Boxes", "Office Furniture"];
const VENDORS = ["Anand Traders", "Sri Balaji Suppliers", "Metro Wholesale Co."];

export function NewPurchaseView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [vendor, setVendor] = useState("");
  const [issueDate, setIssueDate] = useState("2026-07-04");
  const [dueDate, setDueDate] = useState("2026-07-04");
  const [quotationRef, setQuotationRef] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [cashPurchase, setCashPurchase] = useState<"no" | "yes">("no");
  const [cashAccount, setCashAccount] = useState("");
  const [taxInclusive, setTaxInclusive] = useState<"no" | "yes">("no");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [importPurchase, setImportPurchase] = useState<"no" | "yes">("no");
  const [billEntryNo, setBillEntryNo] = useState("");
  const [billValue, setBillValue] = useState("");
  const [billEntryDate, setBillEntryDate] = useState("");

  const [lines, setLines] = useState<PurchaseLine[]>([{ ...emptyLine }]);

  const updateLine = (idx: number, patch: Partial<PurchaseLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const totals = useMemo(() => {
    let subtotal = 0, discount = 0, tax = 0;
    const lineTotals = lines.map((l) => {
      const gross = (l.qty || 0) * (l.cost || 0);
      const discAmt = gross * ((l.disc || 0) / 100);
      const taxable = gross - discAmt;
      const taxAmt = taxable * (TAX_RATES[l.taxKey].pct / 100);
      subtotal += gross; discount += discAmt; tax += taxAmt;
      return taxable + taxAmt;
    });
    return { subtotal, discount, tax, grand: subtotal - discount + tax, lineTotals };
  }, [lines]);

  const handleSave = async () => {
    const payload: FinanceDocument = {
      type: "PURCHASE",
      status: cashPurchase === "yes" ? "Paid" : "Unpaid",
      customerName: vendor || undefined,
      docDate: issueDate,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
      taxInclusive: taxInclusive === "yes",
      currency: "INR",
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      grandTotal: totals.grand,
      items: lines.map((l, i) => ({
        item: l.item || undefined,
        description: l.description || undefined,
        qty: l.qty,
        cost: l.cost,
        disc: l.disc,
        tax: TAX_RATES[l.taxKey].pct,
        lineTotal: totals.lineTotals[i],
      })),
    };
    try {
      const saved = await ledgerFinanceService.createDocument(payload);
      toast.success(`Purchase ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save purchase.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>New Purchase</h1>
          <p className="masthead-desc">Record a stock purchase from a vendor</p>
        </div>
      </div>

      {/* VENDOR & META */}
      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Vendor Name</label>
            <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="">Select Vendor</option>
              {VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="field">
            <label>&nbsp;</label>
            {vendor && (
              <button type="button" className="btn btn-ghost" onClick={() => toast.info(`Viewing ${vendor} details`)} style={{ alignSelf: "flex-start", padding: "10px 16px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-4 4.4-6 7-6s5.8 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                View Details
              </button>
            )}
          </div>

          <div className="field">
            <label>Purchase #</label>
            <div className="readonly-field">PUR/001</div>
          </div>

          <div className="field">
            <label>Date Of Issue</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>

          <div className="field">
            <label>Due On</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="field">
            <label>Quotation Reference</label>
            <input type="text" placeholder="Enter reference" value={quotationRef} onChange={(e) => setQuotationRef(e.target.value)} />
          </div>

          <div className="field">
            <label>Quotation Date</label>
            <input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
          </div>

          <div className="field">
            <label>Is This Cash Purchase?</label>
            <div className="segmented">
              <label className={cashPurchase === "no" ? "checked" : ""} onClick={() => setCashPurchase("no")}>
                <input type="radio" name="cashPurchase" checked={cashPurchase === "no"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                No
              </label>
              <label className={cashPurchase === "yes" ? "checked" : ""} onClick={() => setCashPurchase("yes")}>
                <input type="radio" name="cashPurchase" checked={cashPurchase === "yes"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Yes
              </label>
            </div>
          </div>

          <div className={`field conditional-field${cashPurchase === "yes" ? " show" : ""}`}>
            <label>Cash Account</label>
            <select value={cashAccount} onChange={(e) => setCashAccount(e.target.value)}>
              <option value="">Please Select</option>
              <option value="cash">Cash in hand</option>
            </select>
          </div>
        </div>
      </div>

      {/* LINE ITEMS */}
      <div className="form-card">
        <h2 className="section-title">Purchase Items</h2>
        <div className="table-scroll" style={{ padding: 0 }}>
          <table className="item-table">
            <thead>
              <tr>
                <th style={{ width: "17%" }}>Item</th>
                <th style={{ width: "20%" }}>Description</th>
                <th style={{ width: "8%" }}>Qty</th>
                <th style={{ width: "11%" }}>Unit cost</th>
                <th style={{ width: "10%" }}>Discount %</th>
                <th style={{ width: "17%" }}>Tax</th>
                <th style={{ width: "13%", textAlign: "right" }}>Amount</th>
                <th style={{ width: "4%" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const tax = TAX_RATES[line.taxKey];
                const gross = (line.qty || 0) * (line.cost || 0);
                const taxable = gross - gross * ((line.disc || 0) / 100);
                const taxAmt = taxable * (tax.pct / 100);
                return (
                  <tr key={idx}>
                    <td className="col-item">
                      <select value={line.item} onChange={(e) => updateLine(idx, { item: e.target.value })}>
                        <option value="">Select Product / Service</option>
                        {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="col-desc"><textarea rows={1} placeholder="Description" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} /></td>
                    <td className="col-qty"><input type="number" className="qty" step="0.1" min={0} value={line.qty} onChange={(e) => updateLine(idx, { qty: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="col-cost"><input type="number" className="cost" step="0.01" min={0} value={line.cost} onChange={(e) => updateLine(idx, { cost: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="col-disc"><div className="disc-cell"><input type="number" className="disc" step="0.1" min={0} value={line.disc} onChange={(e) => updateLine(idx, { disc: parseFloat(e.target.value) || 0 })} /><span>%</span></div></td>
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
                    <td className="col-total">{totals.lineTotals[idx].toFixed(2)}</td>
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="add-line" onClick={addLine}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Row
          </button>
          <button type="button" className="add-line" onClick={addLine} style={{ color: "var(--gold)", background: "#F7F1E1", borderColor: "var(--gold)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Other Charge
          </button>
        </div>

        <div className="totals-wrap">
          <div className="totals">
            <div className="totals-row"><span>Subtotal</span><span className="amt">{totals.subtotal.toFixed(2)}</span></div>
            <div className="totals-row"><span>Discount</span><span className="amt">{totals.discount.toFixed(2)}</span></div>
            <div className="totals-row"><span>Total Tax</span><span className="amt">{totals.tax.toFixed(2)}</span></div>
            <div className="tax-toggle" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span>Tax Inclusive</span>
              <div className="segmented" style={{ transform: "scale(.9)", transformOrigin: "right center" }}>
                <label className={taxInclusive === "no" ? "checked" : ""} onClick={() => setTaxInclusive("no")}>
                  <input type="radio" name="taxInclusive" checked={taxInclusive === "no"} readOnly />No
                </label>
                <label className={taxInclusive === "yes" ? "checked" : ""} onClick={() => setTaxInclusive("yes")}>
                  <input type="radio" name="taxInclusive" checked={taxInclusive === "yes"} readOnly />Yes
                </label>
              </div>
            </div>
            <div className="totals-row grand"><span>Total</span><span className="amt">{totals.grand.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* NOTES */}
      <div className="form-card">
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label>Customer Notes</label>
            <textarea placeholder="Enter some notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="field">
            <label>Terms and Conditions</label>
            <textarea placeholder="Enter terms and conditions" value={terms} onChange={(e) => setTerms(e.target.value)} />
          </div>
        </div>
      </div>

      {/* OTHER INFORMATION */}
      <div className="form-card">
        <h2 className="section-title">Other Information</h2>
        <div className="form-grid" style={{ gridTemplateColumns: "auto 1fr" }}>
          <div className="field">
            <label>Import Purchase</label>
            <div className="segmented">
              <label className={importPurchase === "no" ? "checked" : ""} onClick={() => setImportPurchase("no")}>
                <input type="radio" name="importPurchase" checked={importPurchase === "no"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                No
              </label>
              <label className={importPurchase === "yes" ? "checked" : ""} onClick={() => setImportPurchase("yes")}>
                <input type="radio" name="importPurchase" checked={importPurchase === "yes"} readOnly />
                <svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Yes
              </label>
            </div>
          </div>
          <div />
        </div>

        <div className={`conditional-field${importPurchase === "yes" ? " show" : ""}`} style={{ marginTop: 16 }}>
          <div className="form-grid">
            <div className="field">
              <label>Bill of Entry Number</label>
              <input type="text" placeholder="Enter bill number" value={billEntryNo} onChange={(e) => setBillEntryNo(e.target.value)} />
            </div>
            <div className="field">
              <label>Bill of Value</label>
              <input type="number" placeholder="Enter bill amount" value={billValue} onChange={(e) => setBillValue(e.target.value)} />
            </div>
            <div className="field">
              <label>Bill of Entry Date</label>
              <input type="date" value={billEntryDate} onChange={(e) => setBillEntryDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Save
        </button>
      </div>
    </section>
  );
}
