import { useState, useMemo } from "react";
import { toast } from "sonner";
import { type LineItem, Field } from "../ledgerShared";
import { ledgerFinanceService, type FinanceReceipt } from "../../../../services/ledgerFinanceService";

export function NewAdvanceReceiptView({ onCancel, onSave, onNavigateInvoice, onNavigateOther }: { onCancel: () => void; onSave: () => void; onNavigateInvoice: () => void; onNavigateOther: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [depositTo, setDepositTo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [receivedDate, setReceivedDate] = useState("2026-07-03");

  const [lines, setLines] = useState<LineItem[]>([
    { item: "", description: "", qty: 1, cost: 0.0, disc: 0, tax: 0 }
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: FinanceReceipt = {
      receiptType: "ADVANCE",
      customerName: customerName || undefined,
      receiptDate: receivedDate,
      amount: totals.grand,
      paymentMode,
      notes: paymentDescription || undefined,
    };
    try {
      const saved = await ledgerFinanceService.createReceipt(payload);
      toast.success(`Advance Receipt ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save advance receipt.");
      return;
    }
    onSave();
  };

  const addLine = () => {
    setLines([...lines, { item: "", description: "", qty: 1, cost: 0.0, disc: 0, tax: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, key: keyof LineItem, val: any) => {
    setLines(lines.map((line, i) => {
      if (i === idx) {
        return { ...line, [key]: val };
      }
      return line;
    }));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lines.forEach((line) => {
      const base = line.qty * line.cost;
      const discount = base * (line.disc / 100);
      const taxable = base - discount;
      const taxAmount = taxable * (line.tax / 100);

      subtotal += base;
      totalDiscount += discount;
      totalTax += taxAmount;
    });

    const grand = subtotal - totalDiscount + totalTax;
    return { subtotal, discount: totalDiscount, tax: totalTax, grand };
  }, [lines]);

  // Tax details splitting
  const taxDetails = useMemo(() => {
    // If Place of Supply is Telangana (code "36"), split GST into CGST/SGST. Otherwise IGST.
    const isLocal = placeOfSupply === "36";
    const name = isLocal ? "CGST / SGST" : "IGST";
    const halfTax = totals.tax / 2;

    return { isLocal, name, halfTax };
  }, [placeOfSupply, totals.tax]);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Receipts</p>
          <h1>New Advance Receipt</h1>
          <p className="masthead-desc">Record advanced payments received from customers</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ marginBottom: 4 }}>
            <div 
              style={{
                display: "inline-flex",
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "3px",
                gap: "2px"
              }}
            >
              <button 
                type="button" 
                className="tab" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
                onClick={onNavigateInvoice}
              >
                Invoice Receipts
              </button>
              <button 
                type="button" 
                className="tab active" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
              >
                Advance Receipts
              </button>
              <button 
                type="button" 
                className="tab" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
                onClick={onNavigateOther}
              >
                Other Income
              </button>
            </div>
          </div>

          <div className="form-grid">
            <Field label="Customer Name">
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <select value={customerName} onChange={(e) => setCustomerName(e.target.value)} required style={{ flex: 1 }}>
                  <option value="">Select Customer</option>
                  <option value="8138389">Sales Account - default income</option>
                </select>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => toast.info("New Customer Creation Sheet is on the roadmap")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, fontSize: "12px", whiteSpace: "nowrap" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6"/></svg>
                  New Customer
                </button>
              </div>
            </Field>

            <Field label="Voucher Number">
              <input type="text" value="ARCPT/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
            </Field>

            <Field label="Receipt Date">
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </Field>

            <Field label="Deposit To">
              <select value={depositTo} onChange={(e) => setDepositTo(e.target.value)} required>
                <option value="">Select Account</option>
                <option value="8138425">Cash in hand</option>
                <option value="8138426">Citi bank</option>
                <option value="8138392">Discount on Purchase Account</option>
                <option value="8138389">Sales Account - default income</option>
                <option value="8138428">SBI bank</option>
                <option value="8138427">Standard chartered bank</option>
                <option value="8138397">tds receivable</option>
              </select>
            </Field>

            <Field label="Place of Supply">
              <select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} required>
                <option value="">Select State</option>
                <option value="36">Telangana</option>
                <option value="37">Andhra Pradesh</option>
                <option value="27">Maharashtra</option>
                <option value="29">Karnataka</option>
                <option value="33">Tamil Nadu</option>
                <option value="7">Delhi</option>
                <option value="24">Gujarat</option>
                <option value="19">West Bengal</option>
              </select>
            </Field>

            <Field label="Payment Mode">
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="ibank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </Field>
          </div>

          <Field label="Payment Description">
            <textarea rows={3} value={paymentDescription} onChange={(e) => setPaymentDescription(e.target.value)} placeholder="Payment description or reference details..." />
          </Field>

          <div style={{ marginTop: 10 }}>
            <h5 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Line Items</h5>
            <div className="table-scroll">
              <table className="data" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Products</th>
                    <th>Description</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Qty</th>
                    <th style={{ width: "12%", textAlign: "right" }}>Unit Price</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Discount %</th>
                    <th style={{ width: "18%" }}>Tax</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Amount (INR)</th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => {
                    const lineAmount = (line.qty * line.cost) * (1 - line.disc / 100);
                    return (
                      <tr key={idx} style={{ verticalAlign: "middle" }}>
                        <td>
                          <select value={line.item} onChange={(e) => updateLine(idx, "item", e.target.value)}>
                            <option value="">Select Item</option>
                            <option value="service">Consulting Hours</option>
                            <option value="goods">Product Inventory Item</option>
                          </select>
                        </td>
                        <td>
                          <textarea 
                            rows={1} 
                            value={line.description} 
                            onChange={(e) => updateLine(idx, "description", e.target.value)}
                            style={{ minHeight: 34, height: 34, paddingTop: 6, paddingBottom: 6 }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.qty} 
                            onChange={(e) => updateLine(idx, "qty", parseFloat(e.target.value) || 0)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.cost} 
                            onChange={(e) => updateLine(idx, "cost", parseFloat(e.target.value) || 0)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.disc} 
                            onChange={(e) => updateLine(idx, "disc", parseFloat(e.target.value) || 0)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <select value={line.tax} onChange={(e) => updateLine(idx, "tax", parseFloat(e.target.value) || 0)}>
                            <option value="0">GST @Nil (0%)</option>
                            <option value="3">GST @3%</option>
                            <option value="5">GST @5%</option>
                            <option value="12">GST @12%</option>
                            <option value="18">GST @18%</option>
                            <option value="28">GST @28%</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, paddingRight: 10 }}>
                          {lineAmount.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button 
                            type="button" 
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            style={{ background: "none", border: "none", color: "var(--expense)", cursor: lines.length === 1 ? "not-allowed" : "pointer", opacity: lines.length === 1 ? 0.3 : 1 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={8} style={{ padding: "8px 0" }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={addLine}
                        style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                      >
                        + New Row
                      </button>
                    </td>
                  </tr>

                  {/* GST breakdown split display */}
                  {totals.tax > 0 && (
                    <>
                      {taxDetails.isLocal ? (
                        <>
                          <tr className="totals-row">
                            <td colSpan={5} className="border-0"></td>
                            <td style={{ fontWeight: 500, color: "var(--muted)" }}>CGST</td>
                            <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{taxDetails.halfTax.toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr className="totals-row">
                            <td colSpan={5} className="border-0"></td>
                            <td style={{ fontWeight: 500, color: "var(--muted)" }}>SGST</td>
                            <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{taxDetails.halfTax.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </>
                      ) : (
                        <tr className="totals-row">
                          <td colSpan={5} className="border-0"></td>
                          <td style={{ fontWeight: 500, color: "var(--muted)" }}>IGST</td>
                          <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{totals.tax.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Subtotal</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{totals.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Discount</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{totals.discount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Total Tax</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{totals.tax.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="totals-row grand" style={{ borderTop: "1px solid var(--ink)", paddingTop: 12 }}>
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: "bold", color: "var(--ink)", fontSize: "14.5px" }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "15px", color: "var(--ink)", fontFamily: "'IBM Plex Mono', monospace" }}>{totals.grand.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="action-bar" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} style={{ padding: "8px 20px", height: "auto" }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px", height: "auto", background: "var(--income)", borderColor: "var(--income)", color: "#fff" }}>
              Save Receipt
            </button>
          </div>

        </form>
      </div>
    </section>
  );
}

