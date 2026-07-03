import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { type LineItem, Field } from "./ledgerShared";
import { ledgerFinanceService, type FinanceDocument, type LedgerCustomer } from "../../../../services/ledgerFinanceService";

export function NewEstimateView(props: {
  lines: LineItem[];
  totals: { subtotal: number; discount: number; tax: number; grand: number; lineTotals: number[] };
  taxInclusive: boolean;
  setTaxInclusive: (v: boolean) => void;
  updateLine: (i: number, p: Partial<LineItem>) => void;
  addLine: () => void;
  removeLine: (i: number) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { lines, taxInclusive, setTaxInclusive, updateLine, addLine, removeLine, onCancel, onSave } = props;

  const [customerName, setCustomerName] = useState("");
  const [estimateDate, setEstimateDate] = useState("2026-07-03");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [exportEstimate, setExportEstimate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [otherChargeAmount, setOtherChargeAmount] = useState(0);
  const [showOtherCharge, setShowOtherCharge] = useState(false);

  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null);

  // Offcanvas Customer Form State
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustGstType, setNewCustGstType] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustCurrency, setNewCustCurrency] = useState("INR");
  const [newCustStartsFrom, setNewCustStartsFrom] = useState("2026-04-01");
  const [newCustOpeningBal, setNewCustOpeningBal] = useState(0);
  const [newCustBalType, setNewCustBalType] = useState("Cr");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustBillAddr1, setNewCustBillAddr1] = useState("");
  const [newCustBillAddr2, setNewCustBillAddr2] = useState("");
  const [newCustBillCity, setNewCustBillCity] = useState("");
  const [newCustBillState, setNewCustBillState] = useState("");
  const [newCustBillCountry, setNewCustBillCountry] = useState("India");
  const [newCustBillZipcode, setNewCustBillZipcode] = useState("");
  const [newCustSameAsBilling, setNewCustSameAsBilling] = useState(true);
  const [newCustShipAddr1, setNewCustShipAddr1] = useState("");
  const [newCustShipAddr2, setNewCustShipAddr2] = useState("");
  const [newCustShipCity, setNewCustShipCity] = useState("");
  const [newCustShipState, setNewCustShipState] = useState("");
  const [newCustShipCountry, setNewCustShipCountry] = useState("India");
  const [newCustShipZipcode, setNewCustShipZipcode] = useState("");

  const [customers, setCustomers] = useState<LedgerCustomer[]>([]);

  useEffect(() => {
    ledgerFinanceService.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await ledgerFinanceService.createCustomer({
      name: newCustName,
      email: newCustEmail || undefined,
      phone: newCustPhone || undefined,
      gstType: newCustGstType || undefined,
      gstin: newCustGstin || undefined,
      currency: newCustCurrency || undefined,
      openingBalance: newCustOpeningBal,
      balanceType: newCustBalType || undefined,
      startsFrom: newCustStartsFrom || undefined,
    }).catch(() => null);
    if (!created) { toast.error("Failed to create customer."); return; }
    setCustomers((prev) => [...prev, created]);
    setCustomerName(String(created.id));
    setShowNewCustomer(false);
    toast.success(`Customer "${newCustName}" created and selected!`);
    
    // Reset form fields
    setNewCustName("");
    setNewCustGstType("");
    setNewCustGstin("");
    setNewCustCurrency("INR");
    setNewCustStartsFrom("2026-04-01");
    setNewCustOpeningBal(0);
    setNewCustBalType("Cr");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustBillAddr1("");
    setNewCustBillAddr2("");
    setNewCustBillCity("");
    setNewCustBillState("");
    setNewCustBillCountry("India");
    setNewCustBillZipcode("");
    setNewCustSameAsBilling(true);
    setNewCustShipAddr1("");
    setNewCustShipAddr2("");
    setNewCustShipCity("");
    setNewCustShipState("");
    setNewCustShipCountry("India");
    setNewCustShipZipcode("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file format. Please upload an Image or PDF document only.");
        return;
      }
      setAttachment(file);
      toast.success(`File "${file.name}" attached successfully!`);
    }
  };

  const computedTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const lineTotals = lines.map((line) => {
      const gross = line.qty * line.cost;
      const discAmt = gross * (line.disc / 100);
      const taxable = gross - discAmt;
      
      let taxAmt = 0;
      let lineTotal = 0;
      
      if (taxInclusive) {
        // Tax is already included in unit cost
        taxAmt = taxable * line.tax / (100 + line.tax);
        lineTotal = taxable; // total includes tax
      } else {
        // Tax is exclusive, added on top
        taxAmt = taxable * (line.tax / 100);
        lineTotal = taxable + taxAmt;
      }
      
      subtotal += gross;
      totalDiscount += discAmt;
      totalTax += taxAmt;
      
      return lineTotal;
    });

    let grand = 0;
    if (taxInclusive) {
      grand = subtotal - totalDiscount + otherChargeAmount;
    } else {
      grand = subtotal - totalDiscount + totalTax + otherChargeAmount;
    }

    return { subtotal, discount: totalDiscount, tax: totalTax, grand, lineTotals };
  }, [lines, taxInclusive, otherChargeAmount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => String(c.id) === customerName);
    const payload: FinanceDocument = {
      type: "ESTIMATE",
      status: "Under review",
      customerId: cust?.id,
      customerName: cust?.name || undefined,
      docDate: estimateDate,
      notes: customerNotes || undefined,
      terms: termsAndConditions || undefined,
      taxInclusive,
      currency: "INR",
      subtotal: computedTotals.subtotal,
      discount: computedTotals.discount,
      tax: computedTotals.tax,
      otherCharges: otherChargeAmount,
      grandTotal: computedTotals.grand,
      items: lines.map((l, i) => ({
        item: l.item, description: l.description, qty: l.qty,
        cost: l.cost, disc: l.disc, tax: l.tax, lineTotal: computedTotals.lineTotals[i],
      })),
    };
    try {
      const saved = await ledgerFinanceService.createDocument(payload);
      toast.success(`Estimate ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save estimate.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Estimates</p>
          <h1>New Estimate</h1>
          <p className="masthead-desc">Create a new quote or sales estimate for your customer</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-grid">
            <Field label="Customer Name">
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <select value={customerName} onChange={(e) => setCustomerName(e.target.value)} required style={{ flex: 1 }}>
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewCustomer(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, fontSize: "12px", whiteSpace: "nowrap" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6"/></svg>
                  New Customer
                </button>
              </div>
            </Field>

            <Field label="Estimate #">
              <input type="text" value="EST/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
            </Field>

            <Field label="Date Of Issue">
              <input type="date" value={estimateDate} onChange={(e) => setEstimateDate(e.target.value)} required />
            </Field>

            <Field label="Place Of Supply">
              <select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} required>
                <option value="">Select State</option>
                <option value="35">Andaman and Nicobar Islands</option>
                <option value="37">Andhra Pradesh</option>
                <option value="12">Arunachal Pradesh</option>
                <option value="18">Assam</option>
                <option value="10">Bihar</option>
                <option value="4">Chandigarh</option>
                <option value="22">Chhattisgarh</option>
                <option value="26">Dadra and Nagar Haveli</option>
                <option value="25">Daman and Diu</option>
                <option value="7">Delhi</option>
                <option value="30">Goa</option>
                <option value="24">Gujarat</option>
                <option value="6">Haryana</option>
                <option value="2">Himachal Pradesh</option>
                <option value="1">Jammu and Kashmir</option>
                <option value="20">Jharkand</option>
                <option value="29">Karnataka</option>
                <option value="32">Kerala</option>
                <option value="31">Lakshadweep</option>
                <option value="23">Madhya Pradesh</option>
                <option value="27">Maharashtra</option>
                <option value="14">Manipur</option>
                <option value="17">Meghalaya</option>
                <option value="15">Mizoram</option>
                <option value="13">Nagaland</option>
                <option value="21">Odisha</option>
                <option value="97">Other Territory</option>
                <option value="34">Puducherry</option>
                <option value="3">Punjab</option>
                <option value="8">Rajasthan</option>
                <option value="11">Sikkim</option>
                <option value="33">Tamil Nadu</option>
                <option value="36">Telangana</option>
                <option value="16">Tripura</option>
                <option value="9">Uttar Pradesh</option>
                <option value="5">Uttarakhand</option>
                <option value="19">West Bengal</option>
              </select>
            </Field>
          </div>

          {/* Line Items Calculator table */}
          <div style={{ marginTop: 10 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Products & Services</h3>
            <div className="table-scroll">
              <table className="data" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Products</th>
                    <th style={{ width: "25%" }}>Description</th>
                    <th style={{ width: "10%" }}>Quantity</th>
                    <th style={{ width: "12%" }}>Unit Price</th>
                    <th style={{ width: "10%" }}>Discount</th>
                    <th style={{ width: "13%" }}>Tax Rate</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Amount</th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td>
                        <select 
                          value={line.item} 
                          onChange={(e) => updateLine(i, { item: e.target.value })} 
                          required
                          style={{ width: "100%" }}
                        >
                          <option value="">Select Product / Service</option>
                          <option value="Consulting">Consulting Services</option>
                          <option value="Software">Software License</option>
                          <option value="Hardware">Hardware Equipment</option>
                          <option value="Support">Annual Maintenance Support</option>
                        </select>
                      </td>
                      <td>
                        <textarea 
                          value={line.description} 
                          onChange={(e) => updateLine(i, { description: e.target.value })}
                          rows={1}
                          style={{ width: "100%", resize: "vertical", height: 34 }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={line.qty} 
                          onChange={(e) => updateLine(i, { qty: parseFloat(e.target.value) || 0 })} 
                          min={0} 
                          required
                          style={{ width: "100%" }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={line.cost} 
                          onChange={(e) => updateLine(i, { cost: parseFloat(e.target.value) || 0 })} 
                          min={0} 
                          required
                          style={{ width: "100%" }}
                        />
                      </td>
                      <td>
                        <div style={{ position: "relative" }}>
                          <input 
                            type="number" 
                            value={line.disc} 
                            onChange={(e) => updateLine(i, { disc: parseFloat(e.target.value) || 0 })} 
                            min={0} 
                            max={100}
                            style={{ width: "100%", paddingRight: 15 }}
                          />
                          <span style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", fontSize: 10.5, color: "var(--muted)" }}>%</span>
                        </div>
                      </td>
                      <td>
                        <select 
                          value={line.tax} 
                          onChange={(e) => updateLine(i, { tax: parseFloat(e.target.value) || 0 })}
                          style={{ width: "100%" }}
                        >
                          <option value="0">GST @Nil</option>
                          <option value="3">GST @3% (split tax)</option>
                          <option value="5">GST @5% (split tax)</option>
                          <option value="12">GST @12% (split tax)</option>
                          <option value="18">GST @18% (split tax)</option>
                          <option value="28">GST @28% (split tax)</option>
                          <option value="12">IGST @12%</option>
                          <option value="18">IGST @18%</option>
                          <option value="28">IGST @28%</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, paddingRight: 12 }}>
                        {computedTotals.lineTotals[i] ? computedTotals.lineTotals[i].toFixed(2) : "0.00"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {lines.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-ghost text-danger" 
                            onClick={() => removeLine(i)}
                            style={{ padding: 4 }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" strokeLinecap="round"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={8}>
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        onClick={addLine}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", fontSize: "13px" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                        New Row
                      </button>
                    </td>
                  </tr>

                  {/* CGST / SGST / IGST Splits block */}
                  {placeOfSupply && !taxInclusive && (
                    <>
                      {placeOfSupply === "36" ? (
                        <>
                          <tr style={{ background: "#fafbfc" }}>
                            <td colSpan={5} style={{ border: 0 }}></td>
                            <td style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: 500 }}>CGST (Local)</td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{(computedTotals.tax / 2).toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr style={{ background: "#fafbfc" }}>
                            <td colSpan={5} style={{ border: 0 }}></td>
                            <td style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: 500 }}>SGST (Local)</td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{(computedTotals.tax / 2).toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </>
                      ) : (
                        <tr style={{ background: "#fafbfc" }}>
                          <td colSpan={5} style={{ border: 0 }}></td>
                          <td style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: 500 }}>IGST (Interstate)</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{computedTotals.tax.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr style={{ borderTop: "2px solid var(--line)" }}>
                    <td colSpan={5} style={{ border: 0 }}></td>
                    <td>Subtotal</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{computedTotals.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colSpan={5} style={{ border: 0 }}></td>
                    <td>Discount</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{computedTotals.discount.toFixed(2)}</td>
                    <td></td>
                  </tr>

                  {!taxInclusive && (
                    <tr>
                      <td colSpan={5} style={{ border: 0 }}></td>
                      <td>Tax</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{computedTotals.tax.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  )}

                  {showOtherCharge ? (
                    <tr>
                      <td colSpan={5} style={{ border: 0 }}></td>
                      <td>Other Charge</td>
                      <td style={{ display: "flex", gap: 5, justifyContent: "flex-end", alignItems: "center" }}>
                        <input 
                          type="number" 
                          value={otherChargeAmount} 
                          onChange={(e) => setOtherChargeAmount(parseFloat(e.target.value) || 0)} 
                          style={{ width: "80px", textAlign: "right", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: "4px" }} 
                        />
                        <button type="button" className="btn btn-ghost text-danger" style={{ padding: 4 }} onClick={() => { setOtherChargeAmount(0); setShowOtherCharge(false); }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </td>
                      <td></td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ border: 0 }}></td>
                      <td colSpan={2}>
                        <button 
                          type="button" 
                          className="btn btn-ghost fs--1" 
                          onClick={() => setShowOtherCharge(true)}
                          style={{ padding: "4px 8px" }}
                        >
                          + Add Other Charge
                        </button>
                      </td>
                      <td></td>
                    </tr>
                  )}

                  <tr style={{ background: "var(--bg)", fontWeight: "bold" }}>
                    <td colSpan={5} style={{ border: 0 }}></td>
                    <td>Total</td>
                    <td style={{ textAlign: "right", color: "var(--ink)" }}>{computedTotals.grand.toFixed(2)}</td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colSpan={5} style={{ border: 0 }}></td>
                    <td>Tax Inclusive</td>
                    <td colSpan={2}>
                      <div className="btn-group" style={{ display: "inline-flex" }}>
                        <button 
                          type="button"
                          className={`btn btn-sm${taxInclusive ? " btn-primary" : " btn-white"}`}
                          onClick={() => setTaxInclusive(true)}
                          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        >
                          Yes
                        </button>
                        <button 
                          type="button"
                          className={`btn btn-sm${!taxInclusive ? " btn-primary" : " btn-white"}`}
                          onClick={() => setTaxInclusive(false)}
                          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        >
                          No
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={5} style={{ border: 0 }}></td>
                    <td>Exchange Rate In (INR)</td>
                    <td colSpan={2}>
                      <input 
                        type="text" 
                        value={exchangeRate} 
                        onChange={(e) => setExchangeRate(e.target.value)} 
                        style={{ width: "90px", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Notes & Terms */}
          <div className="row" style={{ marginTop: 10 }}>
            <div className="col-md-5">
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--ink)", display: "block", marginBottom: 6 }}>Customer Notes</label>
              <textarea 
                rows={4} 
                className="bg-focus form-control" 
                value={customerNotes} 
                onChange={(e) => setCustomerNotes(e.target.value)} 
                placeholder="Enter customer notes"
              />
            </div>
            <div className="col-md-2" />
            <div className="col-md-5">
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--ink)", display: "block", marginBottom: 6 }}>Terms and Conditions</label>
              <textarea 
                rows={4} 
                className="bg-focus form-control" 
                value={termsAndConditions} 
                onChange={(e) => setTermsAndConditions(e.target.value)} 
                placeholder="Enter terms and conditions"
              />
            </div>
          </div>

          {/* Attach file scanned proof & Export Toggle */}
          <div className="card bg-light mb-3 shadow-small" style={{ border: "1px solid var(--line)", background: "var(--bg)", marginTop: 15 }}>
            <div className="card-body" style={{ padding: "16px 20px" }}>
              <div className="row">
                <div className="col-sm-6">
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, verticalAlign: -1 }}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      Attach a Scanned Proof
                    </label>
                    <small className="fw-bold" style={{ fontSize: 11, color: "var(--muted-2)" }}>( Image & PDF Document Only )</small>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      style={{ marginTop: 6 }} 
                    />
                    {attachment && (
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--income)", fontWeight: 600 }}>
                        ✓ Attached: {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-sm-2" />

                <div className="col-sm-4">
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6, verticalAlign: -1 }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                      Export Estimate
                    </label>
                    <div className="btn-group" style={{ display: "inline-flex", marginTop: 6 }}>
                      <button 
                        type="button"
                        className={`btn btn-sm${exportEstimate ? " btn-primary" : " btn-white"}`}
                        onClick={() => setExportEstimate(true)}
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      >
                        Yes
                      </button>
                      <button 
                        type="button"
                        className={`btn btn-sm${!exportEstimate ? " btn-primary" : " btn-white"}`}
                        onClick={() => setExportEstimate(false)}
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-bar" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} style={{ padding: "8px 20px", height: "auto" }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px", height: "auto", background: "var(--income)", borderColor: "var(--income)", color: "#fff" }}>
              Save Estimate
            </button>
          </div>
        </form>
      </div>

      {showNewCustomer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          {/* Backdrop */}
          <div 
            onClick={() => setShowNewCustomer(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} 
          />
          {/* Panel */}
          <div 
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "550px",
              background: "#ffffff",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease-out"
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
                New Customer
              </h3>
              <button 
                type="button" 
                onClick={() => setShowNewCustomer(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Name *</label>
                <input 
                  type="text" 
                  value={newCustName} 
                  onChange={(e) => setNewCustName(e.target.value)} 
                  placeholder="Enter Name" 
                  required 
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>GSTIN Registration Type</label>
                <select 
                  value={newCustGstType} 
                  onChange={(e) => setNewCustGstType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px", background: "#fff" }}
                >
                  <option value="">Select Category</option>
                  <option value="Composition Scheme">Composition Scheme</option>
                  <option value="E-Commerce Operator">E-Commerce Operator</option>
                  <option value="Input Service Distributor">Input Service Distributor</option>
                  <option value="Registered">Registered</option>
                  <option value="Unregistered">Unregistered</option>
                </select>
              </div>

              {newCustGstType && newCustGstType !== "Unregistered" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>GSTIN</label>
                  <input 
                    type="text" 
                    value={newCustGstin} 
                    onChange={(e) => setNewCustGstin(e.target.value)} 
                    placeholder="Enter GSTIN 15 Character..." 
                    maxLength={15} 
                    minLength={15}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Currency *</label>
                <select 
                  value={newCustCurrency} 
                  onChange={(e) => setNewCustCurrency(e.target.value)} 
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px", background: "#fff" }}
                >
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                  <option value="AFN">AFN</option>
                  <option value="ALL">ALL</option>
                  <option value="AMD">AMD</option>
                  <option value="ANG">ANG</option>
                  <option value="AOA">AOA</option>
                  <option value="ARS">ARS</option>
                  <option value="AUD">AUD</option>
                  <option value="AWG">AWG</option>
                  <option value="AZN">AZN</option>
                  <option value="BAM">BAM</option>
                  <option value="BBD">BBD</option>
                  <option value="BDT">BDT</option>
                  <option value="BGN">BGN</option>
                  <option value="BHD">BHD</option>
                  <option value="BIF">BIF</option>
                  <option value="BMD">BMD</option>
                  <option value="BND">BND</option>
                  <option value="BOB">BOB</option>
                  <option value="BRL">BRL</option>
                  <option value="BSD">BSD</option>
                  <option value="BTN">BTN</option>
                  <option value="BWP">BWP</option>
                  <option value="BYR">BYR</option>
                  <option value="BZD">BZD</option>
                  <option value="CAD">CAD</option>
                  <option value="CDF">CDF</option>
                  <option value="CHF">CHF</option>
                  <option value="CLP">CLP</option>
                  <option value="CNY">CNY</option>
                  <option value="COP">COP</option>
                  <option value="CRC">CRC</option>
                  <option value="CUP">CUP</option>
                  <option value="CVE">CVE</option>
                  <option value="CZK">CZK</option>
                  <option value="DJF">DJF</option>
                  <option value="DKK">DKK</option>
                  <option value="DZD">DZD</option>
                  <option value="EEK">EEK</option>
                  <option value="EGP">EGP</option>
                  <option value="ERN">ERN</option>
                  <option value="ERO">ERO</option>
                  <option value="ETB">ETB</option>
                  <option value="EUR">EUR</option>
                  <option value="FIM">FIM</option>
                  <option value="FJD">FJD</option>
                  <option value="FKP">FKP</option>
                  <option value="GBP">GBP</option>
                  <option value="GEL">GEL</option>
                  <option value="GHC">GHC</option>
                  <option value="GIP">GIP</option>
                  <option value="GMD">GMD</option>
                  <option value="GNF">GNF</option>
                  <option value="GTQ">GTQ</option>
                  <option value="GWP">GWP</option>
                  <option value="GYD">GYD</option>
                  <option value="HKD">HKD</option>
                  <option value="HNL">HNL</option>
                  <option value="HRK">HRK</option>
                  <option value="HTG">HTG</option>
                  <option value="HUF">HUF</option>
                  <option value="IDR">IDR</option>
                  <option value="ILS">ILS</option>
                  <option value="IQD">IQD</option>
                  <option value="IRR">IRR</option>
                  <option value="ISK">ISK</option>
                  <option value="JMD">JMD</option>
                  <option value="JOD">JOD</option>
                  <option value="JPY">JPY</option>
                  <option value="KES">KES</option>
                  <option value="KGS">KGS</option>
                  <option value="KHR">KHR</option>
                  <option value="KMF">KMF</option>
                  <option value="KPW">KPW</option>
                  <option value="KRW">KRW</option>
                  <option value="KWD">KWD</option>
                  <option value="KYD">KYD</option>
                  <option value="KZT">KZT</option>
                  <option value="LAK">LAK</option>
                  <option value="LBP">LBP</option>
                  <option value="LKR">LKR</option>
                  <option value="LRD">LRD</option>
                  <option value="LSL">LSL</option>
                  <option value="LTL">LTL</option>
                  <option value="LVL">LVL</option>
                  <option value="LYD">LYD</option>
                  <option value="MAD">MAD</option>
                  <option value="MDL">MDL</option>
                  <option value="MGF">MGF</option>
                  <option value="MKD">MKD</option>
                  <option value="MMK">MMK</option>
                  <option value="MOP">MOP</option>
                  <option value="MRO">MRO</option>
                  <option value="MTL">MTL</option>
                  <option value="MUR">MUR</option>
                  <option value="MVR">MVR</option>
                  <option value="MWK">MWK</option>
                  <option value="MXN">MXN</option>
                  <option value="MYR">MYR</option>
                  <option value="MZM">MZM</option>
                  <option value="NGN">NGN</option>
                  <option value="NIO">NIO</option>
                  <option value="NOK">NOK</option>
                  <option value="NPR">NPR</option>
                  <option value="NZD">NZD</option>
                  <option value="OMR">OMR</option>
                  <option value="PAB">PAB</option>
                  <option value="PEN">PEN</option>
                  <option value="PGK">PGK</option>
                  <option value="PHP">PHP</option>
                  <option value="PKR">PKR</option>
                  <option value="PLN">PLN</option>
                  <option value="PYG">PYG</option>
                  <option value="QAR">QAR</option>
                  <option value="ROL">ROL</option>
                  <option value="RUR">RUR</option>
                  <option value="RWF">RWF</option>
                  <option value="SAR">SAR</option>
                  <option value="SBD">SBD</option>
                  <option value="SCR">SCR</option>
                  <option value="SDD">SDD</option>
                  <option value="SEK">SEK</option>
                  <option value="SGD">SGD</option>
                  <option value="SHP">SHP</option>
                  <option value="SKK">SKK</option>
                  <option value="SLL">SLL</option>
                  <option value="SOS">SOS</option>
                  <option value="SRG">SRG</option>
                  <option value="STD">STD</option>
                  <option value="SVC">SVC</option>
                  <option value="SYP">SYP</option>
                  <option value="SZL">SZL</option>
                  <option value="THB">THB</option>
                  <option value="TJS">TJS</option>
                  <option value="TMM">TMM</option>
                  <option value="TND">TND</option>
                  <option value="TOP">TOP</option>
                  <option value="TRY">TRY</option>
                  <option value="TTD">TTD</option>
                  <option value="TZS">TZS</option>
                  <option value="UAH">UAH</option>
                  <option value="UGX">UGX</option>
                  <option value="USD">USD</option>
                  <option value="UYU">UYU</option>
                  <option value="UZS">UZS</option>
                  <option value="VEF">VEF</option>
                  <option value="VND">VND</option>
                  <option value="VUV">VUV</option>
                  <option value="WST">WST</option>
                  <option value="XAF">XAF</option>
                  <option value="XCD">XCD</option>
                  <option value="XOF">XOF</option>
                  <option value="XPF">XPF</option>
                  <option value="YER">YER</option>
                  <option value="YUM">YUM</option>
                  <option value="ZAR">ZAR</option>
                  <option value="ZMK">ZMK</option>
                  <option value="ZWD">ZWD</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Starts From *</label>
                <input 
                  type="date" 
                  value={newCustStartsFrom} 
                  onChange={(e) => setNewCustStartsFrom(e.target.value)} 
                  required 
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Opening Balance</label>
                  <input 
                    type="number" 
                    value={newCustOpeningBal} 
                    onChange={(e) => setNewCustOpeningBal(parseFloat(e.target.value) || 0)} 
                    placeholder="0.00" 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Type</label>
                  <select 
                    value={newCustBalType} 
                    onChange={(e) => setNewCustBalType(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px", background: "#fff" }}
                  >
                    <option value="Cr">Cr</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Email</label>
                <input 
                  type="email" 
                  value={newCustEmail} 
                  onChange={(e) => setNewCustEmail(e.target.value)} 
                  placeholder="xyz@gmail.com..." 
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Phone Number</label>
                <input 
                  type="text" 
                  value={newCustPhone} 
                  onChange={(e) => setNewCustPhone(e.target.value)} 
                  placeholder="Enter Contact Number..." 
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              {/* Billing Address Details */}
              <div style={{ marginTop: 10, paddingTop: 15, borderTop: "1px dashed var(--line)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>Billing Address</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input 
                    type="text" 
                    value={newCustBillAddr1} 
                    onChange={(e) => setNewCustBillAddr1(e.target.value)} 
                    placeholder="Address Line 1" 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                  <input 
                    type="text" 
                    value={newCustBillAddr2} 
                    onChange={(e) => setNewCustBillAddr2(e.target.value)} 
                    placeholder="Address Line 2" 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <input 
                      type="text" 
                      value={newCustBillCity} 
                      onChange={(e) => setNewCustBillCity(e.target.value)} 
                      placeholder="City" 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                    />
                    <input 
                      type="text" 
                      value={newCustBillZipcode} 
                      onChange={(e) => setNewCustBillZipcode(e.target.value)} 
                      placeholder="Zipcode" 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <select 
                      value={newCustBillState} 
                      onChange={(e) => setNewCustBillState(e.target.value)} 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px", background: "#fff" }}
                    >
                      <option value="">Select State</option>
                      <option value="35">Andaman and Nicobar Islands</option>
                      <option value="37">Andhra Pradesh</option>
                      <option value="12">Arunachal Pradesh</option>
                      <option value="18">Assam</option>
                      <option value="10">Bihar</option>
                      <option value="4">Chandigarh</option>
                      <option value="22">Chhattisgarh</option>
                      <option value="26">Dadra and Nagar Haveli</option>
                      <option value="25">Daman and Diu</option>
                      <option value="7">Delhi</option>
                      <option value="30">Goa</option>
                      <option value="24">Gujarat</option>
                      <option value="6">Haryana</option>
                      <option value="2">Himachal Pradesh</option>
                      <option value="1">Jammu and Kashmir</option>
                      <option value="20">Jharkand</option>
                      <option value="29">Karnataka</option>
                      <option value="32">Kerala</option>
                      <option value="31">Lakshadweep</option>
                      <option value="23">Madhya Pradesh</option>
                      <option value="27">Maharashtra</option>
                      <option value="14">Manipur</option>
                      <option value="17">Meghalaya</option>
                      <option value="15">Mizoram</option>
                      <option value="13">Nagaland</option>
                      <option value="21">Odisha</option>
                      <option value="97">Other Territory</option>
                      <option value="34">Puducherry</option>
                      <option value="3">Punjab</option>
                      <option value="8">Rajasthan</option>
                      <option value="11">Sikkim</option>
                      <option value="33">Tamil Nadu</option>
                      <option value="36">Telangana</option>
                      <option value="16">Tripura</option>
                      <option value="9">Uttar Pradesh</option>
                      <option value="5">Uttarakhand</option>
                      <option value="19">West Bengal</option>
                    </select>
                    <input 
                      type="text" 
                      value={newCustBillCountry} 
                      onChange={(e) => setNewCustBillCountry(e.target.value)} 
                      placeholder="Country" 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Same as Billing Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <input 
                  type="checkbox" 
                  id="sameAsBilling"
                  checked={newCustSameAsBilling} 
                  onChange={(e) => setNewCustSameAsBilling(e.target.checked)} 
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="sameAsBilling" style={{ fontSize: "12.5px", cursor: "pointer", color: "var(--ink)" }}>Shipping address is same as billing address</label>
              </div>

              {/* Shipping Address Details (Visible only when sameAsBilling is unchecked) */}
              {!newCustSameAsBilling && (
                <div style={{ marginTop: 10, paddingTop: 15, borderTop: "1px dashed var(--line)", animation: "fadeIn 0.2s ease-out" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>Shipping Address</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input 
                      type="text" 
                      value={newCustShipAddr1} 
                      onChange={(e) => setNewCustShipAddr1(e.target.value)} 
                      placeholder="Address Line 1" 
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                    />
                    <input 
                      type="text" 
                      value={newCustShipAddr2} 
                      onChange={(e) => setNewCustShipAddr2(e.target.value)} 
                      placeholder="Address Line 2" 
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input 
                        type="text" 
                        value={newCustShipCity} 
                        onChange={(e) => setNewCustShipCity(e.target.value)} 
                        placeholder="City" 
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                      />
                      <input 
                        type="text" 
                        value={newCustShipZipcode} 
                        onChange={(e) => setNewCustShipZipcode(e.target.value)} 
                        placeholder="Zipcode" 
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <select 
                        value={newCustShipState} 
                        onChange={(e) => setNewCustShipState(e.target.value)} 
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px", background: "#fff" }}
                      >
                        <option value="">Select State</option>
                        <option value="35">Andaman and Nicobar Islands</option>
                        <option value="37">Andhra Pradesh</option>
                        <option value="12">Arunachal Pradesh</option>
                        <option value="18">Assam</option>
                        <option value="10">Bihar</option>
                        <option value="4">Chandigarh</option>
                        <option value="22">Chhattisgarh</option>
                        <option value="26">Dadra and Nagar Haveli</option>
                        <option value="25">Daman and Diu</option>
                        <option value="7">Delhi</option>
                        <option value="30">Goa</option>
                        <option value="24">Gujarat</option>
                        <option value="6">Haryana</option>
                        <option value="2">Himachal Pradesh</option>
                        <option value="1">Jammu and Kashmir</option>
                        <option value="20">Jharkand</option>
                        <option value="29">Karnataka</option>
                        <option value="32">Kerala</option>
                        <option value="31">Lakshadweep</option>
                        <option value="23">Madhya Pradesh</option>
                        <option value="27">Maharashtra</option>
                        <option value="14">Manipur</option>
                        <option value="17">Meghalaya</option>
                        <option value="15">Mizoram</option>
                        <option value="13">Nagaland</option>
                        <option value="21">Odisha</option>
                        <option value="97">Other Territory</option>
                        <option value="34">Puducherry</option>
                        <option value="3">Punjab</option>
                        <option value="8">Rajasthan</option>
                        <option value="11">Sikkim</option>
                        <option value="33">Tamil Nadu</option>
                        <option value="36">Telangana</option>
                        <option value="16">Tripura</option>
                        <option value="9">Uttar Pradesh</option>
                        <option value="5">Uttarakhand</option>
                        <option value="19">West Bengal</option>
                      </select>
                      <input 
                        type="text" 
                        value={newCustShipCountry} 
                        onChange={(e) => setNewCustShipCountry(e.target.value)} 
                        placeholder="Country" 
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13.5px" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowNewCustomer(false)}
                  style={{ height: "auto", padding: "8px 20px" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ height: "auto", padding: "8px 20px", background: "var(--income)", borderColor: "var(--income)", color: "#fff" }}
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

