import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type LedgerCustomer } from "../../../../services/ledgerFinanceService";
import { confirmAction } from "../../../../utils/AlertUtils";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: string;
  hasUnpaidInvoice: boolean;
  addedDate: string;
}

const toRow = (c: LedgerCustomer): CustomerRow => ({
  id: String(c.id),
  name: c.name,
  email: c.email || "N/A",
  phone: c.phone || "N/A",
  creditLimit: `₹${(c.openingBalance ?? 0).toFixed(2)}`,
  hasUnpaidInvoice: false,
  addedDate: (c.createdAt || "").split("T")[0] || "",
});

export function CustomersView({ onImportCustomers, canAdd = true }: { onImportCustomers: () => void; canAdd?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Customer Offcanvas State
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
  const [newCustShipZipcode, setNewCustShipZipcode] = useState("");
  const [newCustShipCountry, setNewCustShipCountry] = useState("India");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await ledgerFinanceService.getCustomers();
        setCustomers(list.map(toRow));
      } catch {
        toast.error("Failed to load customers.");
      }
    })();
  }, []);

  const handleDeleteCustomer = async (row: CustomerRow) => {
    const ok = await confirmAction("Delete customer?", `This will permanently remove "${row.name}".`);
    if (!ok) return;
    try {
      await ledgerFinanceService.deleteCustomer(Number(row.id));
      setCustomers((prev) => prev.filter((c) => c.id !== row.id));
      toast.success(`Customer "${row.name}" deleted.`);
    } catch {
      toast.error("Failed to delete customer.");
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error("Customer name is required!");
      return;
    }
    const payload = {
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      gstRegistrationType: newCustGstType,
      gstin: newCustGstin,
      currency: newCustCurrency,
      openingBalance: newCustOpeningBal,
      billingAddress: {
        addressLine1: newCustBillAddr1,
        addressLine2: newCustBillAddr2,
        city: newCustBillCity,
        state: newCustBillState,
        country: newCustBillCountry,
        zipCode: newCustBillZipcode,
      },
      shippingAddress: {
        addressLine1: newCustSameAsBilling ? newCustBillAddr1 : newCustShipAddr1,
        addressLine2: newCustSameAsBilling ? newCustBillAddr2 : newCustShipAddr2,
        city: newCustSameAsBilling ? newCustBillCity : newCustShipCity,
        state: newCustSameAsBilling ? newCustBillState : newCustShipState,
        country: newCustSameAsBilling ? newCustBillCountry : newCustShipCountry,
        zipCode: newCustSameAsBilling ? newCustBillZipcode : newCustShipZipcode,
      },
    };
    try {
      const created = await ledgerFinanceService.createCustomer(payload as any);
      setCustomers((prev) => [...prev, toRow(created)]);
      toast.success(`Customer "${newCustName}" created successfully!`);
    } catch {
      toast.error("Failed to create customer.");
      return;
    }
    setShowNewCustomer(false);

    // Reset Form
    setNewCustName("");
    setNewCustGstType("");
    setNewCustGstin("");
    setNewCustCurrency("INR");
    setNewCustOpeningBal(0);
    setNewCustBalType("Cr");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustBillAddr1("");
    setNewCustBillAddr2("");
    setNewCustBillCity("");
    setNewCustBillState("");
    setNewCustBillZipcode("");
    setNewCustSameAsBilling(true);
    setNewCustShipAddr1("");
    setNewCustShipAddr2("");
    setNewCustShipCity("");
    setNewCustShipState("");
    setNewCustShipZipcode("");
    setNewCustBillCountry("India");
    setNewCustShipCountry("India");
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [customers, searchQuery]);

  const thisMonth = new Date().toISOString().substring(0, 7);
  const newThisMonth = customers.filter(c => c.addedDate.startsWith(thisMonth)).length;
  const unpaidCount = customers.filter(c => c.hasUnpaidInvoice).length;

  const handleExport = () => {
    toast.success("Excel spreadsheet export triggered successfully! Downloading customers.xlsx...");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="view">
      <div className="masthead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="masthead-eyebrow">Income / Customers</p>
          <h1>Customers</h1>
          <p className="masthead-desc">Manage customer accounts, GST validation categories, and balances</p>
        </div>
        {canAdd && (
          <div ref={dropdownRef} className="btn-group shadow-sm" style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
          <button 
            type="button" 
            className="btn btn-primary d-flex align-items-center" 
            onClick={() => setShowNewCustomer(true)}
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: "8px 16px", background: "var(--income)", borderColor: "var(--income)", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New Customer
          </button>
          <button 
            type="button" 
            className="btn btn-primary dropdown-toggle-split" 
            onClick={() => setIsDropdownOpen(prev => !prev)}
            style={{ 
              borderTopLeftRadius: 0, 
              borderBottomLeftRadius: 0, 
              background: "var(--income)", 
              borderColor: "var(--income)", 
              borderLeft: "1px solid rgba(255,255,255,0.15)", 
              color: "#fff", 
              width: "32px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          {isDropdownOpen && (
            <ul 
              className="dropdown-menu shadow show" 
              style={{ 
                position: "absolute", 
                inset: "auto 0px 0px auto", 
                margin: "0px", 
                transform: "translate3d(0px, 44px, 0px)", 
                background: "#ffffff", 
                border: "1px solid #d8e2ef", 
                borderRadius: "8px", 
                padding: "6px", 
                listStyle: "none", 
                minWidth: "160px",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <li>
                <button 
                  type="button" 
                  className="dropdown-item" 
                  onClick={() => { onImportCustomers(); setIsDropdownOpen(false); }}
                  style={{ display: "block", width: "100%", padding: "6px 12px", border: "none", background: "none", color: "var(--ink)", textAlign: "left", fontSize: "12.5px", cursor: "pointer", borderRadius: "4px" }}
                >
                  Import Customers
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  className="dropdown-item" 
                  onClick={handleExport}
                  style={{ display: "block", width: "100%", padding: "6px 12px", border: "none", background: "none", color: "var(--ink)", textAlign: "left", fontSize: "12.5px", cursor: "pointer", borderRadius: "4px" }}
                >
                  Export Customers
                </button>
              </li>
            </ul>
          )}
        </div>
        )}
      </div>

      {/* Metrics Header */}
      <div className="card mb-3 mt-2 shadow-sm" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 4px 20px" }}>
          <div className="stat-grid cols-4" style={{ gap: 16 }}>
            {/* Total Customers */}
            <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #7baaf7", background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)" }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>Total Customers</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--ink)", marginTop: 4, lineHeight: 1.2 }}>{customers.length}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>All customers</small>
              </div>
            </div>
            {/* New This Month */}
            <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #4ade80", background: "linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)" }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>New This Month</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#16a34a", marginTop: 4, lineHeight: 1.2 }}>{newThisMonth}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>Added this month</small>
              </div>
            </div>
            {/* With Unpaid Invoices */}
            <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #fbbf24", background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>With Unpaid Invoices</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d97706", marginTop: 4, lineHeight: 1.2 }}>{unpaidCount}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>Outstanding dues</small>
              </div>
            </div>
            {/* Active Customers */}
            <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #a78bfa", background: "linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)" }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>Active Customers</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7c3aed", marginTop: 4, lineHeight: 1.2 }}>{customers.length}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>Invoiced last 3 months</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "1rem" }}>Customers</span>
              <span style={{ color: "var(--muted)", fontSize: "12px", whiteSpace: "nowrap" }}>{filteredCustomers.length} results</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="input-group" style={{ width: "350px", height: "38px" }}>
                <span className="input-group-text bg-white" style={{ borderRight: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/></svg></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Name, Email or Contact..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderLeft: 0, height: "38px" }}
                />
              </div>
              {searchQuery && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setSearchQuery("")}
                  style={{ padding: "6px 14px", height: "38px", fontSize: "13px" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll" style={{ overflowX: "auto" }}>
            <table className="data" style={{ width: "100%" }} id="customers">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Credit Limit</th>
                  <th>Email</th>
                  <th>Contact Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                      No Customers present.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{c.name}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "12.5px" }}>{c.creditLimit}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button 
                            type="button" 
                            className="btn btn-ghost" 
                            onClick={() => toast.info(`Viewing ${c.name} profile`)}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => toast.info(`Editing ${c.name}`)}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleDeleteCustomer(c)}
                            style={{ padding: "4px 10px", fontSize: "12px", color: "var(--expense)" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewCustomer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <div 
            onClick={() => setShowNewCustomer(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} 
          />
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
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
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

              {/* Shipping Address Details */}
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

