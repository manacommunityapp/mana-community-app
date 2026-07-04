import { useState } from "react";
import { toast } from "sonner";
import { Field } from "../ledgerShared";
import { ledgerFinanceService, type FinanceReceipt } from "../../../../services/ledgerFinanceService";

export function NewReceiptView({ onCancel, onSave, onNavigateAdvance, onNavigateOther }: { onCancel: () => void; onSave: () => void; onNavigateAdvance: () => void; onNavigateOther: () => void }) {
  const [receivedFrom, setReceivedFrom] = useState("8138389"); // Sales Account - default income
  const [depositTo, setDepositTo] = useState("8138425"); // Cash in hand
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amount, setAmount] = useState("0.0");
  const [tdsAmount, setTdsAmount] = useState("0.0");
  const [receivedDate, setReceivedDate] = useState("2026-07-03");
  const [description, setDescription] = useState("");
  const [showTds, setShowTds] = useState(false);
  const [exchangeRate, setExchangeRate] = useState("0.0");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: FinanceReceipt = {
      receiptType: "INVOICE",
      receiptDate: receivedDate,
      amount: parseFloat(amount) || 0,
      paymentMode,
      reference: description || undefined,
    };
    try {
      const saved = await ledgerFinanceService.createReceipt(payload);
      toast.success(`Receipt ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save receipt.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Receipts</p>
          <h1>New Receipt</h1>
          <p className="masthead-desc">Record receipt vouchers for invoices or other incomes</p>
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
                className="tab active" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
              >
                Invoice Receipts
              </button>
              <button 
                type="button" 
                className="tab" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
                onClick={onNavigateAdvance}
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
            <Field label="Money Received From">
              <select value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)}>
                <option value="8138389">Sales Account - default income</option>
                <option value="8138392">Discount on Purchase Account</option>
              </select>
            </Field>

            <Field label="Voucher Number">
              <input type="text" value="RCPT/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
            </Field>

            <Field label="Receive Date">
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </Field>

            <Field label="Deposit to Account">
              <select value={depositTo} onChange={(e) => setDepositTo(e.target.value)}>
                <option value="8138425">Cash in hand</option>
                <option value="8138426">Citi bank</option>
                <option value="8138392">Discount on Purchase Account</option>
                <option value="8138389">Sales Account - default income</option>
                <option value="8138428">SBI bank</option>
                <option value="8138427">Standard chartered bank</option>
                <option value="8138397">tds receivable</option>
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

            <Field label="Amount">
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>

            <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "13px", color: "var(--ink)", fontWeight: 500, cursor: "pointer" }}>
                <input type="checkbox" checked={showTds} onChange={(e) => setShowTds(e.target.checked)} style={{ width: 14, height: 14 }} />
                Apply TDS Amount
              </label>

              {showTds && (
                <div style={{ maxWidth: "50%" }}>
                  <Field label="TDS Amount">
                    <input type="text" value={tdsAmount} onChange={(e) => setTdsAmount(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {receivedFrom === "8138392" && (
              <Field label="Exchange Rate In INR">
                <input type="text" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
              </Field>
            )}
          </div>

          <div 
            style={{
              border: "1px solid var(--line)",
              borderRadius: "10px",
              padding: "16px 18px",
              background: "#fafbfc",
              marginTop: 6
            }}
          >
            <h5 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>
              Showing Unpaid Invoices for the Selected Customer
            </h5>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--bg)", borderRadius: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/></svg>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted)", fontWeight: 500 }}>
                There are no records.
              </p>
            </div>
          </div>

          <Field label="Description">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter payment references or notes..." />
          </Field>

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

