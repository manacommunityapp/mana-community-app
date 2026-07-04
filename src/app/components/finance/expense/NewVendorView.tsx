import { useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type Vendor } from "../../../../services/ledgerFinanceService";

/* New Vendor — create form (Expenses group). Converted from vendor-react-pages/
   NewVendor.jsx into the shared .ledger-app theme; persists via the vendor API. */

export function NewVendorView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Please enter a vendor name."); return; }
    const payload: Vendor = {
      name: name.trim(),
      contactPerson: contact || undefined,
      email: email || undefined,
      phone: phone || undefined,
      gstin: gstin || undefined,
      pan: pan || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      pincode: pincode || undefined,
      status: "Active",
    };
    try {
      const saved = await ledgerFinanceService.createVendor(payload);
      toast.success(`Vendor "${saved.name}" saved successfully!`);
    } catch {
      toast.error("Failed to save vendor.");
      return;
    }
    onSave();
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>New Vendor</h1>
          <p className="masthead-desc">Create a new vendor</p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Vendor Name *</label>
            <input type="text" placeholder="Enter vendor name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Contact Person</label>
            <input type="text" placeholder="Enter contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="xyz@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="text" placeholder="Enter contact number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>GSTIN</label>
            <input type="text" maxLength={15} placeholder="Enter GSTIN 15 Character…" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </div>
          <div className="field">
            <label>PAN</label>
            <input type="text" maxLength={10} placeholder="Enter PAN" value={pan} onChange={(e) => setPan(e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Billing Address</label>
            <textarea rows={3} placeholder="Street Name… Lane No… Area…" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <label>City</label>
            <input type="text" placeholder="Enter city name" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>State</label>
            <input type="text" placeholder="Enter state" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="field">
            <label>Pincode</label>
            <input type="text" placeholder="Enter postal code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
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
