import { useState } from "react";
import { toast } from "sonner";
import { Field } from "./ledgerShared";
import { ledgerFinanceService, type FinanceReceipt } from "../../../../services/ledgerFinanceService";

export function NewOtherIncomeView({ onCancel, onSave, onNavigateInvoice, onNavigateAdvance }: { onCancel: () => void; onSave: () => void; onNavigateInvoice: () => void; onNavigateAdvance: () => void }) {
  const [receivedFrom, setReceivedFrom] = useState("");
  const [depositTo, setDepositTo] = useState("");
  const [receivedDate, setReceivedDate] = useState("2026-07-03");
  const [amount, setAmount] = useState("0.0");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [description, setDescription] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: FinanceReceipt = {
      receiptType: "OTHER",
      receiptDate: receivedDate,
      amount: parseFloat(amount) || 0,
      paymentMode,
      reference: description || undefined,
    };
    try {
      const saved = await ledgerFinanceService.createReceipt(payload);
      toast.success(`Other Income Voucher ${saved.code ?? ""} saved successfully!`);
    } catch {
      toast.error("Failed to save income voucher.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Receipts</p>
          <h1>New Other Income</h1>
          <p className="masthead-desc">Record income received from other sources</p>
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
                className="tab" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
                onClick={onNavigateAdvance}
              >
                Advance Receipts
              </button>
              <button 
                type="button" 
                className="tab active" 
                style={{ fontSize: "11.5px", padding: "6px 12px", border: "none" }}
              >
                Other Income
              </button>
            </div>
          </div>

          <div className="form-grid">
            <Field label="Voucher Number">
              <input type="text" value="OINC/001" readOnly disabled style={{ background: "var(--bg)", cursor: "not-allowed", fontWeight: 600 }} />
            </Field>

            <Field label="Money Received From">
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <select value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} required style={{ flex: 1 }}>
                  <option value="">Select Account</option>
                  <option value="8138392">Discount on Purchase Account</option>
                  <option value="8138389">Sales Account - default income</option>
                </select>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => toast.info("New Account creation sheet is on the roadmap")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, fontSize: "12px", whiteSpace: "nowrap" }}
                >
                  + New Account
                </button>
              </div>
            </Field>

            <Field label="Deposit to Account">
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <select value={depositTo} onChange={(e) => setDepositTo(e.target.value)} required style={{ flex: 1 }}>
                  <option value="">Select Account</option>
                  <option value="8138425">Cash in hand</option>
                  <option value="8138426">Citi bank</option>
                  <option value="8138392">Discount on Purchase Account</option>
                  <option value="8138389">Sales Account - default income</option>
                  <option value="8138428">SBI bank</option>
                  <option value="8138427">Standard chartered bank</option>
                  <option value="8138397">tds receivable</option>
                </select>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => toast.info("New Account creation sheet is on the roadmap")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, fontSize: "12px", whiteSpace: "nowrap" }}
                >
                  + New Account
                </button>
              </div>
            </Field>

            <Field label="Receive Date">
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </Field>

            <Field label="Amount">
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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

          <Field label="Description">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter details or notes..." />
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

/* ============================ SMALL PARTS ============================ */
