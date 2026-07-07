import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type FinanceDocument } from "../../../../services/ledgerFinanceService";

/* New Purchase Order — create form (Expenses group). Converted from
   new_purchase_order.html (+ new_vendor.html modal) into the .ledger-app theme.
   Persists as a FinanceDocument of type PURCHASE_ORDER. */

interface POLine {
  item: string;
  description: string;
  qty: number;
  cost: number;
  disc: number;   // percent
  taxPct: number; // percent
}
const emptyLine: POLine = { item: "", description: "", qty: 1, cost: 0, disc: 0, taxPct: 0 };

const TAX_OPTIONS = [
  { value: 0, label: "No Tax" },
  { value: 3, label: "GST @3% (split tax)" },
  { value: 5, label: "GST @5% (split tax)" },
  { value: 12, label: "GST @12% (split tax)" },
  { value: 18, label: "GST @18% (split tax)" },
  { value: 28, label: "GST @28% (split tax)" },
];

export function NewPurchaseOrderView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [vendors, setVendors] = useState<string[]>([]);
  const [vendor, setVendor] = useState("");
  const [issueDate, setIssueDate] = useState("2026-07-04");
  const [dueDate, setDueDate] = useState("");
  const [narration, setNarration] = useState("");
  const [terms, setTerms] = useState("");
  const [attachmentName, setAttachmentName] = useState("No file selected");

  const [lines, setLines] = useState<POLine[]>([{ ...emptyLine }]);

  // New Vendor modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [vName, setVName] = useState("");
  const [vGstType, setVGstType] = useState("");
  const [vGstin, setVGstin] = useState("");
  const [vStart, setVStart] = useState("2026-04-01");
  const [vOpening, setVOpening] = useState("0.0");
  const [vEmail, setVEmail] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vCurrency, setVCurrency] = useState("");
  const [vBillAddr, setVBillAddr] = useState("");
  const [vBillCity, setVBillCity] = useState("");
  const [vBillCountry, setVBillCountry] = useState("");
  const [vBillState, setVBillState] = useState("");
  const [vBillPin, setVBillPin] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [vShipAddr, setVShipAddr] = useState("");
  const [vShipCity, setVShipCity] = useState("");
  const [vShipCountry, setVShipCountry] = useState("");
  const [vShipState, setVShipState] = useState("");
  const [vShipPin, setVShipPin] = useState("");
  const [nameError, setNameError] = useState(false);

  const updateLine = (idx: number, patch: Partial<POLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    const nets = lines.map((l) => {
      const net = (l.qty || 0) * (l.cost || 0) * (1 - (l.disc || 0) / 100);
      subtotal += net;
      tax += net * ((l.taxPct || 0) / 100);
      return net;
    });
    return { subtotal, tax, grand: subtotal + tax, nets };
  }, [lines]);

  const COUNTRIES = ["India", "United States Of America", "United Kingdom Of Great Britain And Northern Ireland", "United Arab Emirates", "Australia", "Canada", "Singapore"];

  const openModal = () => {
    setVName(""); setVGstType(""); setVGstin(""); setVStart("2026-04-01"); setVOpening("0.0");
    setVEmail(""); setVPhone(""); setVCurrency(""); setVBillAddr(""); setVBillCity(""); setVBillCountry("");
    setVBillState(""); setVBillPin(""); setSameAsBilling(false); setVShipAddr(""); setVShipCity("");
    setVShipCountry(""); setVShipState(""); setVShipPin(""); setNameError(false); setModalOpen(true);
  };
  const saveVendor = () => {
    if (!vName.trim()) { setNameError(true); return; }
    setVendors((prev) => [...prev, vName.trim()]);
    setVendor(vName.trim());
    setModalOpen(false);
    toast.success(`Vendor "${vName.trim()}" created and selected!`);
  };

  const handleSave = async () => {
    if (!vendor.trim()) { toast.error("Please select a vendor."); return; }
    const payload: FinanceDocument = {
      type: "PURCHASE_ORDER",
      status: "Open",
      customerName: vendor,
      docDate: issueDate,
      dueDate: dueDate || undefined,
      notes: narration || undefined,
      terms: terms || undefined,
      currency: "INR",
      subtotal: totals.subtotal,
      discount: 0,
      tax: totals.tax,
      grandTotal: totals.grand,
      items: lines.map((l, i) => ({
        item: l.item || undefined,
        description: l.description || undefined,
        qty: l.qty,
        cost: l.cost,
        disc: l.disc,
        tax: l.taxPct,
        lineTotal: totals.nets[i],
      })),
    };
    try {
      const saved = await ledgerFinanceService.createDocument(payload);
      toast.success(`Purchase Order ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save purchase order.");
      return;
    }
    onSave();
  };

  const shipVal = (bill: string, ship: string) => (sameAsBilling ? bill : ship);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>New Purchase Order</h1>
          <p className="masthead-desc">Raise a purchase order for a vendor</p>
        </div>
      </div>

      {/* VENDOR & META */}
      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Vendor Name *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ flex: 1 }} value={vendor} onChange={(e) => setVendor(e.target.value)} required>
                <option value="">Select Vendor</option>
                {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <button type="button" className="btn btn-ghost" onClick={openModal} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>+ New Vendor</button>
            </div>
          </div>

          <div className="field">
            <label>Voucher Number #</label>
            <div className="readonly-field">PO/001</div>
          </div>

          <div className="field">
            <label>Date Of Issue *</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>

          <div className="field">
            <label>Due On</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LINE ITEMS */}
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
                <th style={{ width: "12%", textAlign: "right" }}>Amount *</th>
                <th style={{ width: "4%" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="col-item">
                    <select value={line.item} onChange={(e) => updateLine(idx, { item: e.target.value })}>
                      <option value="">Select Product</option>
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
                  <td className="col-total">{totals.nets[idx].toFixed(2)}</td>
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
            <div className="totals-row"><span>Subtotal</span><span className="amt">{totals.subtotal.toFixed(2)}</span></div>
            <div className="totals-row"><span>Discount</span><span className="amt">0.00</span></div>
            <div className="totals-row"><span>Total Tax</span><span className="amt">{totals.tax.toFixed(2)}</span></div>
            <div className="totals-row grand"><span>Total</span><span className="amt">{totals.grand.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* NARRATION & TERMS */}
      <div className="form-card">
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label>Narration</label>
            <textarea rows={4} value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
          <div className="field">
            <label>Terms and Conditions</label>
            <textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
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

      {/* NEW VENDOR MODAL */}
      <div className={`modal-overlay${modalOpen ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modal-card" style={{ maxWidth: 560 }}>
          <div className="modal-head">
            <h3>
              <span className="modal-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-4 4.4-6 7-6s5.8 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </span>
              New Vendor
            </h3>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
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
            <div className="field">
              <label>GSTIN Registration Type</label>
              <select value={vGstType} onChange={(e) => setVGstType(e.target.value)}>
                <option value="">Select Category</option>
                <option>Registered</option>
                <option>Unregistered</option>
                <option>Composition Scheme</option>
                <option>E-Commerce Operator</option>
                <option>Input Service Distributor</option>
              </select>
            </div>
            <div className="field">
              <label>GSTIN</label>
              <input type="text" maxLength={15} placeholder="Enter GSTIN 15 Character…" value={vGstin} onChange={(e) => setVGstin(e.target.value)} />
            </div>
            <div className="field">
              <label>Starts From *</label>
              <input type="date" value={vStart} onChange={(e) => setVStart(e.target.value)} />
            </div>
            <div className="field">
              <label>Opening Balance</label>
              <input type="text" placeholder="Enter Opening Balance" value={vOpening} onChange={(e) => setVOpening(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="xyz@gmail.com" value={vEmail} onChange={(e) => setVEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input type="text" placeholder="Enter Contact Number…" value={vPhone} onChange={(e) => setVPhone(e.target.value)} />
            </div>
            <div className="field">
              <label>Currency *</label>
              <select value={vCurrency} onChange={(e) => setVCurrency(e.target.value)}>
                <option value="">Select Currency</option>
                {["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>Billing Address</div>
            <div className="field">
              <label>Address</label>
              <textarea placeholder="Street Name… Lane No… Area…" value={vBillAddr} onChange={(e) => setVBillAddr(e.target.value)} />
            </div>
            <div className="field">
              <label>City</label>
              <input type="text" placeholder="Enter City Name…" value={vBillCity} onChange={(e) => setVBillCity(e.target.value)} />
            </div>
            <div className="field">
              <label>Country</label>
              <select value={vBillCountry} onChange={(e) => setVBillCountry(e.target.value)}>
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>State</label>
              <input type="text" placeholder="Enter State…" value={vBillState} onChange={(e) => setVBillState(e.target.value)} />
            </div>
            <div className="field">
              <label>Postal Code</label>
              <input type="text" placeholder="Enter Postal Code…" value={vBillPin} onChange={(e) => setVBillPin(e.target.value)} />
            </div>

            <div className="check-row">
              <input type="checkbox" id="po-same-as-billing" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
              <label htmlFor="po-same-as-billing">Same As Billing</label>
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>Shipping Address</div>
            <div className="field">
              <label>Address</label>
              <textarea placeholder="Street Name… Lane No… Area…" value={shipVal(vBillAddr, vShipAddr)} disabled={sameAsBilling} onChange={(e) => setVShipAddr(e.target.value)} />
            </div>
            <div className="field">
              <label>City</label>
              <input type="text" placeholder="Enter City Name…" value={shipVal(vBillCity, vShipCity)} disabled={sameAsBilling} onChange={(e) => setVShipCity(e.target.value)} />
            </div>
            <div className="field">
              <label>Country</label>
              <select value={shipVal(vBillCountry, vShipCountry)} disabled={sameAsBilling} onChange={(e) => setVShipCountry(e.target.value)}>
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>State</label>
              <input type="text" placeholder="Enter State…" value={shipVal(vBillState, vShipState)} disabled={sameAsBilling} onChange={(e) => setVShipState(e.target.value)} />
            </div>
            <div className="field">
              <label>Postal Code</label>
              <input type="text" placeholder="Enter Postal Code…" value={shipVal(vBillPin, vShipPin)} disabled={sameAsBilling} onChange={(e) => setVShipPin(e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={saveVendor}>
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
