import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  manaVendorService,
  type ManaVendor,
  type CreateManaVendorRequest,
  type UpdateManaVendorRequest,
} from "../../../../services/finance/manaVendorService";
import { useAuth } from "../../../../contexts/AuthContext";

// ── New Vendor Form ───────────────────────────────────────────────────────────

interface VendorFormProps {
  communityId: number;
  editing: ManaVendor | null;
  onSave: () => void;
  onCancel: () => void;
}

function VendorForm({ communityId, editing, onSave, onCancel }: VendorFormProps) {
  const [form, setForm] = useState<Partial<CreateManaVendorRequest>>({
    communityId,
    name: editing?.name ?? "",
    contactPerson: editing?.contactPerson ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    gstin: editing?.gstin ?? "",
    pan: editing?.pan ?? "",
    address: editing?.address ?? "",
    city: editing?.city ?? "",
    state: editing?.state ?? "",
    pincode: editing?.pincode ?? "",
    bankDetails: editing?.bankDetails ?? "",
    categories: editing?.categories ?? "",
  });
  const [saving, setSaving] = useState(false);

  const field = (label: string, key: keyof typeof form, placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: "#6b7094" }}>{label}</label>
      <input
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13 }}
      />
    </div>
  );

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Vendor name is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await manaVendorService.update(communityId, editing.id, form as UpdateManaVendorRequest);
        toast.success("Vendor updated");
      } else {
        await manaVendorService.create({ ...form, communityId } as CreateManaVendorRequest);
        toast.success("Vendor created");
      }
      onSave();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Vendor Master</p>
          <h1>{editing ? "Edit Vendor" : "New Vendor"}</h1>
          <p className="masthead-desc">
            {editing ? "Update vendor details in the unified master" : "Add a vendor to the unified master — available across all finance modules"}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Vendor Details</h2></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1/-1" }}>{field("Vendor Name *", "name", "e.g. Sharma & Co.")}</div>
            {field("Contact Person", "contactPerson")}
            {field("Email", "email")}
            {field("Phone", "phone")}
            {field("GSTIN", "gstin", "22AAAAA0000A1Z5")}
            {field("PAN", "pan")}
            {field("Categories", "categories", "e.g. Electrical, Plumbing")}
            {field("Bank Details", "bankDetails", "Account no. / IFSC")}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Address</h2></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1/-1" }}>{field("Street Address", "address")}</div>
            {field("City", "city")}
            {field("State", "state")}
            {field("Pincode", "pincode")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #dfe4f5", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: saving ? .6 : 1 }}
        >
          {saving ? "Saving…" : editing ? "Update Vendor" : "Create Vendor"}
        </button>
      </div>
    </section>
  );
}

// ── Main Table View ───────────────────────────────────────────────────────────

interface UnifiedVendorsViewProps {
  communityId: number;
}

export function UnifiedVendorsView({ communityId }: UnifiedVendorsViewProps) {
  const [vendors, setVendors] = useState<ManaVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManaVendor | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterModule, setFilterModule] = useState<"ALL" | "FINANCE" | "PROCUREMENT" | "MANUAL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await manaVendorService.list(communityId);
      setVendors(data);
    } catch {
      toast.error("Failed to load vendor master");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (v: ManaVendor) => {
    if (!confirm(`Deactivate vendor "${v.name}"? They will no longer appear in vendor pickers.`)) return;
    try {
      await manaVendorService.deactivate(communityId, v.id);
      toast.success("Vendor deactivated");
      load();
    } catch {
      toast.error("Failed to deactivate vendor");
    }
  };

  if (creating || editing) {
    return (
      <VendorForm
        communityId={communityId}
        editing={editing}
        onSave={() => { setCreating(false); setEditing(null); load(); }}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  const filtered = vendors.filter((v) => {
    const matchModule = filterModule === "ALL" || v.sourceModule === filterModule;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      (v.email ?? "").toLowerCase().includes(q) ||
      (v.gstin ?? "").toLowerCase().includes(q);
    return matchModule && matchSearch;
  });

  const MODULE_COLOR: Record<string, string> = {
    FINANCE: "#4f46e5",
    PROCUREMENT: "#16a34a",
    MANUAL: "#d97706",
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Vendor Master</p>
          <h1>Unified Vendors</h1>
          <p className="masthead-desc">
            Canonical vendor master — merged from Finance, Procurement, and manually added vendors
          </p>
        </div>
        <div className="masthead-actions">
          <button
            type="button"
            onClick={() => setCreating(true)}
            style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            + New Vendor
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Vendors ({filtered.length})</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or GST…"
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13, minWidth: 220 }}
            />
            <div className="tabs">
              {(["ALL", "FINANCE", "PROCUREMENT", "MANUAL"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`tab${filterModule === m ? " active" : ""}`}
                  onClick={() => setFilterModule(m)}
                >
                  {m === "ALL" ? "All" : m.charAt(0) + m.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: "14%" }}>Contact</th>
                <th style={{ width: "16%" }}>GSTIN</th>
                <th style={{ width: "10%" }}>Source</th>
                <th style={{ width: "9%" }}>Status</th>
                <th style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>No vendors found</td></tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.name}</div>
                      {v.email && <div style={{ fontSize: 11, color: "#8b8fc8" }}>{v.email}</div>}
                    </td>
                    <td style={{ color: "#6b7094", fontSize: 13 }}>
                      {v.contactPerson || "—"}
                      {v.phone && <div style={{ fontSize: 11 }}>{v.phone}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7094", fontFamily: "monospace" }}>
                      {v.gstin || "—"}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase",
                        color: MODULE_COLOR[v.sourceModule] ?? "#6b7094",
                        border: `1px solid ${MODULE_COLOR[v.sourceModule] ?? "#6b7094"}33`,
                        borderRadius: 999, padding: "2px 8px", fontWeight: 600,
                      }}>
                        {v.sourceModule}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, borderRadius: 999, padding: "3px 9px", fontWeight: 600,
                        background: v.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                        color: v.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditing(v)}
                          style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #dfe4f5", background: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        {v.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(v)}
                            style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #fee2e2", background: "#fff", fontSize: 12, cursor: "pointer", color: "#dc2626" }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
