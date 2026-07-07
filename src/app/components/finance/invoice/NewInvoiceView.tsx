import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { type LineItem, Field } from "../ledgerShared";
import { ledgerFinanceService, type FinanceDocument, type LedgerCustomer } from "../../../../services/ledgerFinanceService";

export function NewInvoiceView(props: {
  invoiceType: "credit" | "cash";
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
  const { invoiceType, lines, taxInclusive, setTaxInclusive, updateLine, addLine, removeLine, onCancel, onSave } = props;

  const [customerName, setCustomerName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-07-03");
  const [dueDate, setDueDate] = useState("2026-07-10");
  const [orderReference, setOrderReference] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  
  const [exportInvoice, setExportInvoice] = useState(false);
  const [shippingPortCode, setShippingPortCode] = useState("");
  const [shippingBillNumber, setShippingBillNumber] = useState("");
  const [shippingBillDate, setShippingBillDate] = useState("");
  
  const [showOtherCharge, setShowOtherCharge] = useState(false);
  const [otherChargeAmount, setOtherChargeAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState("1.0");

  const [cashMobile, setCashMobile] = useState("");
  const [cashGstin, setCashGstin] = useState("");
  const [cashEmail, setCashEmail] = useState("");
  const [cashCustomerName, setCashCustomerName] = useState("Cash invoice");
  const [cashAccountId, setCashAccountId] = useState("");

  // Offcanvas Customer Form State
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustGstType, setNewCustGstType] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustCurrency, setNewCustCurrency] = useState("INR");
  const [newCustStartsFrom, setNewCustStartsFrom] = useState("2026-04-01");
  const [newCustOpeningBal, setNewCustOpeningBal] = useState(0);
  const [newCustBalType, setNewCustBalType] = useState("Cr");

  const [customers, setCustomers] = useState<LedgerCustomer[]>([]);

  useEffect(() => {
    ledgerFinanceService.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  // Additional New Customer Fields
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

    if (exportInvoice) {
      if (shippingPortCode && shippingPortCode.length > 6) {
        toast.error("Shipping port code should not be greater than 6 characters.");
        return;
      }
      if (shippingBillNumber && shippingBillNumber.length > 7) {
        toast.error("Shipping bill number should not be greater than 7 characters.");
        return;
      }
    }

    const isCash = invoiceType === "cash";
    const cust = customers.find((c) => String(c.id) === customerName);
    const payload: FinanceDocument = {
      type: "INVOICE",
      status: "Unpaid",
      customerId: isCash ? undefined : cust?.id,
      customerName: isCash ? (cashCustomerName || undefined) : (cust?.name || undefined),
      docDate: invoiceDate,
      dueDate: dueDate || undefined,
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
      toast.success(`Invoice ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save invoice.");
      return;
    }
    onSave();
  };

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

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Invoices</p>
          <h1>{invoiceType === "credit" ? "New Invoice (Credit)" : "New Cash Invoice"}</h1>
          <p className="masthead-desc">Create a new {invoiceType === "credit" ? "credit invoice" : "cash invoice"} for your customer</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {invoiceType === "cash" ? (
            <div className="form-grid">
              <Field label="Customer Name">
                <input 
                  type="text" 
                  value={cashCustomerName} 
                  onChange={(e) => setCashCustomerName(e.target.value)} 
                  placeholder="Enter Name" 
                  required
                />
              </Field>
              <Field label="Account">
                <select value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
                  <option value="">Select Account</option>
                  <option value="8138425">Cash in hand</option>
                </select>
                <p style={{ margin: "4px 0 0 0", fontSize: "10.5px", color: "var(--muted-2)" }}>
                  Select a cash account you want to receive money from.
                </p>
              </Field>
              <Field label="Invoice #">
                <input type="text" value="INV/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
              </Field>
              <Field label="Date Of Issue">
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
              </Field>
              <Field label="Order Reference">
                <input type="text" value={orderReference} onChange={(e) => setOrderReference(e.target.value)} placeholder="Enter Reference Information" />
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
              <Field label="Mobile Number">
                <input type="text" value={cashMobile} onChange={(e) => setCashMobile(e.target.value)} placeholder="Enter Contact Number" />
              </Field>
              <Field label="GSTIN">
                <input type="text" value={cashGstin} onChange={(e) => setCashGstin(e.target.value)} placeholder="Enter GSTIN Number" />
              </Field>
              <Field label="Email">
                <input type="text" value={cashEmail} onChange={(e) => setCashEmail(e.target.value)} placeholder="Enter E-Mail Address" />
              </Field>
            </div>
          ) : (
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
                    New
                  </button>
                  {customerName && (
                    <button 
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        const cust = customers.find(c => String(c.id) === customerName);
                        toast.info(`Viewing details for: ${cust?.name || customerName}`);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Invoice #">
                <input type="text" value="INV/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
              </Field>
              <Field label="Date Of Issue">
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
              </Field>
              <Field label="Due On">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </Field>
              <Field label="Order Reference">
                <input type="text" value={orderReference} onChange={(e) => setOrderReference(e.target.value)} placeholder="Enter Reference Information" />
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
          )}

          <div style={{ marginTop: 10 }}>
            <h5 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Line Items</h5>
            <div className="table-scroll">
              <table className="data" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Item</th>
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
                    const lineAmount = computedTotals.lineTotals[idx] ?? 0;
                    return (
                      <tr key={idx} style={{ verticalAlign: "middle" }}>
                        <td>
                          <select value={line.item} onChange={(e) => updateLine(idx, { item: e.target.value })}>
                            <option value="">Select Product / Service</option>
                            <option value="service">Consulting Hours</option>
                            <option value="retainer">Design Retainer</option>
                            <option value="custom">Custom Item</option>
                          </select>
                        </td>
                        <td>
                          <textarea 
                            rows={1} 
                            value={line.description} 
                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                            style={{ minHeight: 34, height: 34, paddingTop: 6, paddingBottom: 6 }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.qty} 
                            onChange={(e) => updateLine(idx, { qty: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.cost} 
                            onChange={(e) => updateLine(idx, { cost: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={line.disc} 
                            onChange={(e) => updateLine(idx, { disc: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <select value={line.tax} onChange={(e) => updateLine(idx, { tax: parseFloat(e.target.value) || 0 })}>
                            <option value="0">GST @Nil (0%)</option>
                            <option value="3">GST @3%</option>
                            <option value="5">GST @5%</option>
                            <option value="12">GST @12%</option>
                            <option value="18">GST @18%</option>
                            <option value="28">GST @28%</option>
                            <option value="0">GST @Zero (0%)</option>
                            <option value="3">IGST @3%</option>
                            <option value="5">IGST @5%</option>
                            <option value="12">IGST @12%</option>
                            <option value="18">IGST @18%</option>
                            <option value="28">IGST @28%</option>
                            <option value="0">IGST @Nil (0%)</option>
                            <option value="0">IGST @Zero (0%)</option>
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
                      <div style={{ display: "flex", gap: 10 }}>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={addLine}
                          style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                        >
                          + New Row
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => setShowOtherCharge(true)}
                          style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                        >
                          + Add Other Charge
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Subtotal</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{computedTotals.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Discount</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{computedTotals.discount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Total Tax</td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{computedTotals.tax.toFixed(2)}</td>
                    <td></td>
                  </tr>

                  {showOtherCharge && (
                    <tr className="totals-row">
                      <td colSpan={5} className="border-0"></td>
                      <td style={{ fontWeight: 500, color: "var(--muted)" }}>Other Charge</td>
                      <td style={{ textAlign: "right" }}>
                        <input 
                          type="number" 
                          value={otherChargeAmount} 
                          onChange={(e) => setOtherChargeAmount(parseFloat(e.target.value) || 0)}
                          style={{ textAlign: "right", width: 100, display: "inline-block", padding: "4px 8px", fontSize: 13 }}
                        />
                      </td>
                      <td></td>
                    </tr>
                  )}

                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Tax Inclusive</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="btn-group" style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 6, padding: 2 }}>
                        <button 
                          type="button" 
                          className={`btn ${taxInclusive ? "btn-primary" : "btn-ghost"}`} 
                          onClick={() => setTaxInclusive(true)}
                          style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, height: "auto" }}
                        >
                          Yes
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${!taxInclusive ? "btn-primary" : "btn-ghost"}`} 
                          onClick={() => setTaxInclusive(false)}
                          style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, height: "auto" }}
                        >
                          No
                        </button>
                      </div>
                    </td>
                    <td></td>
                  </tr>

                  <tr className="totals-row">
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>Exchange Rate (INR)</td>
                    <td style={{ textAlign: "right" }}>
                      <input 
                        type="text" 
                        value={exchangeRate} 
                        onChange={(e) => setExchangeRate(e.target.value)} 
                        style={{ textAlign: "right", width: 80, display: "inline-block", padding: "4px 8px", fontSize: 13 }}
                      />
                    </td>
                    <td></td>
                  </tr>

                  <tr className="totals-row grand" style={{ borderTop: "1px solid var(--ink)", paddingTop: 12 }}>
                    <td colSpan={5} className="border-0"></td>
                    <td style={{ fontWeight: "bold", color: "var(--ink)", fontSize: "14.5px" }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "15px", color: "var(--ink)", fontFamily: "'IBM Plex Mono', monospace" }}>{computedTotals.grand.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <Field label="Customer Notes">
                <textarea rows={4} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Thank you for your business." />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Terms and Conditions">
                <textarea rows={4} value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} placeholder="Payment is due within 7 days of the invoice date." />
              </Field>
            </div>
          </div>

          {/* Export Invoice & Other Information Section */}
          <div className="card bg-light p-3" style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div>
                <label className="check-row" style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={exportInvoice} onChange={(e) => setExportInvoice(e.target.checked)} />
                  Export Invoice
                </label>
              </div>

              {exportInvoice && (
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 15 }}>
                  <Field label="Shipping Bill Port Code">
                    <select value={shippingPortCode} onChange={(e) => setShippingPortCode(e.target.value)} required>
                      <option value="">Select Port code</option>
                      <option value="INABG1">INABG1 Alibag</option>
                      <option value="INACH1">INACH1 Achra</option>
                      <option value="INADA6">INADA6 Adalaj</option>
                      <option value="INADC6">INADC6 CCIPL-SEZ/AHMEDABAD</option>
                      <option value="INADG6">INADG6 GIPL-SEZ/AHMEDABAD</option>
                      <option value="INADI1">INADI1 Androth Island</option>
                      <option value="INADM6">INADM6 MRPL-SEZ/AHMEDABAD</option>
                      <option value="INADR6">INADR6 CGRPL-SEZ/AHMEDABAD</option>
                      <option value="INAGI1">INAGI1 Agatti Island</option>
                      <option value="INAGR4">INAGR4 Agra</option>
                      <option value="INAGTB">INAGTB Agartala</option>
                    </select>
                  </Field>
                  <Field label="Export Bill No.">
                    <input 
                      type="text" 
                      value={shippingBillNumber} 
                      onChange={(e) => setShippingBillNumber(e.target.value)} 
                      placeholder="Export bill number" 
                      required
                    />
                  </Field>
                  <Field label="Export Bill Date">
                    <input 
                      type="date" 
                      value={shippingBillDate} 
                      onChange={(e) => setShippingBillDate(e.target.value)} 
                      required
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div className="action-bar" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} style={{ padding: "8px 20px", height: "auto" }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px", height: "auto", background: "var(--income)", borderColor: "var(--income)", color: "#fff" }}>
              Save Invoice
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

