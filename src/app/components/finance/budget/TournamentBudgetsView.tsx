import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  tournamentBudgetService,
  type TournamentBudget,
  type TournamentBudgetRequest,
  type TournamentBudgetLineItemRequest,
} from "../../../../services/finance/tournamentBudgetService";
import { useAuth } from "../../../../contexts/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function FundingPill({ collected, planned }: { collected: number; planned: number }) {
  const funded = planned > 0 ? (collected / planned) * 100 : 0;
  const over = funded >= 100;
  return (
    <span style={{
      fontSize: 11, borderRadius: 999, padding: "2px 9px", fontWeight: 700,
      background: over ? "#dcfce7" : "#fef3c7",
      color: over ? "#16a34a" : "#d97706",
    }}>
      {funded.toFixed(0)}% funded
    </span>
  );
}

// ── Budget Editor ─────────────────────────────────────────────────────────────

interface EditorProps {
  communityId: number;
  tournamentId: number;
  tournamentName: string;
  existing: TournamentBudget | null;
  onSaved: () => void;
  onCancel: () => void;
}

function BudgetEditor({ communityId, tournamentId, tournamentName, existing, onSaved, onCancel }: EditorProps) {
  const [totalPlanned, setTotalPlanned] = useState(String(existing?.totalPlannedAmount ?? ""));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [lines, setLines] = useState<TournamentBudgetLineItemRequest[]>(
    existing?.lineItems.map((li) => ({
      category: li.category,
      description: li.description ?? "",
      plannedAmount: li.plannedAmount,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const addLine = () =>
    setLines((p) => [...p, { category: "", description: "", plannedAmount: 0 }]);

  const removeLine = (i: number) =>
    setLines((p) => p.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof TournamentBudgetLineItemRequest, value: string | number) =>
    setLines((p) => p.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)));

  const handleSave = async () => {
    if (!totalPlanned || parseFloat(totalPlanned) < 0) {
      toast.error("Enter a valid total planned amount");
      return;
    }
    setSaving(true);
    try {
      const req: TournamentBudgetRequest = {
        communityId,
        totalPlannedAmount: parseFloat(totalPlanned),
        notes: notes.trim() || undefined,
        lineItems: lines.filter((l) => l.category.trim()),
      };
      await tournamentBudgetService.save(tournamentId, req);
      toast.success("Budget saved");
      onSaved();
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    padding: "8px 12px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13, width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Tournament Budgets</p>
          <h1>{tournamentName}</h1>
          <p className="masthead-desc">
            Define the planned budget for this tournament; actual funding shows registration fees collected
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Budget Overview</h2></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, color: "#6b7094" }}>Total Planned Budget (INR) *</label>
              <input
                type="number"
                value={totalPlanned}
                onChange={(e) => setTotalPlanned(e.target.value)}
                placeholder="e.g. 75000"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, color: "#6b7094" }}>Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Spending Line Items</h2>
          <button
            type="button"
            onClick={addLine}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Line
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ width: "40%" }}>Description</th>
                <th style={{ width: "18%" }}>Amount (INR)</th>
                <th style={{ width: "6%" }} />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "#8b8fc8", padding: "24px 0", fontSize: 13 }}>No line items — click "+ Add Line" to add</td></tr>
              )}
              {lines.map((li, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={li.category}
                      onChange={(e) => updateLine(i, "category", e.target.value)}
                      placeholder="e.g. Prizes, Venue"
                      style={{ ...inputStyle, fontSize: 12 }}
                    />
                  </td>
                  <td>
                    <input
                      value={li.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                      placeholder="Details (optional)"
                      style={{ ...inputStyle, fontSize: 12 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={li.plannedAmount}
                      onChange={(e) => updateLine(i, "plannedAmount", parseFloat(e.target.value) || 0)}
                      style={{ ...inputStyle, fontSize: 12 }}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", fontSize: 16 }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Budget"}
        </button>
      </div>
    </section>
  );
}

// ── Main List View ────────────────────────────────────────────────────────────

export function TournamentBudgetsView() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? 0;
  const [budgets, setBudgets] = useState<TournamentBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ tournamentId: number; tournamentName: string; existing: TournamentBudget | null } | null>(null);
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tournamentBudgetService.listByCommunity(communityId);
      setBudgets(data);
    } catch {
      toast.error("Failed to load tournament budgets");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (b: TournamentBudget) => {
    if (!confirm(`Remove budget for "${b.tournamentName}"?`)) return;
    try {
      await tournamentBudgetService.delete(b.tournamentId);
      toast.success("Budget removed");
      load();
    } catch {
      toast.error("Failed to remove budget");
    }
  };

  if (editing) {
    return (
      <BudgetEditor
        communityId={communityId}
        tournamentId={editing.tournamentId}
        tournamentName={editing.tournamentName}
        existing={editing.existing}
        onSaved={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Module Budgets</p>
          <h1>Tournament Budgets</h1>
          <p className="masthead-desc">
            Plan budgets for tournaments — planned spend vs registration fees collected
          </p>
        </div>
      </div>

      {/* Quick-add */}
      <div className="card">
        <div className="card-head"><h2>Add Budget for Tournament</h2></div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "0 0 160px" }}>
              <label style={{ fontSize: 12, color: "#6b7094" }}>Tournament ID</label>
              <input
                type="number"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                placeholder="e.g. 7"
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 220px" }}>
              <label style={{ fontSize: 12, color: "#6b7094" }}>Tournament Name (label)</label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Cricket Premier League 2026"
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13 }}
              />
            </div>
            <button
              type="button"
              disabled={!addId}
              onClick={() =>
                setEditing({
                  tournamentId: Number(addId),
                  tournamentName: addName || `Tournament #${addId}`,
                  existing: null,
                })
              }
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: !addId ? 0.5 : 1 }}
            >
              Set Budget
            </button>
          </div>
        </div>
      </div>

      {/* Existing */}
      <div className="card">
        <div className="card-head"><h2>Budgets ({budgets.length})</h2></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tournament</th>
                <th style={{ width: "16%" }}>Planned</th>
                <th style={{ width: "16%" }}>Collected</th>
                <th style={{ width: "16%" }}>Funding</th>
                <th style={{ width: "14%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>Loading…</td></tr>
              ) : budgets.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>No tournament budgets yet</td></tr>
              ) : (
                budgets.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.tournamentName}</div>
                      <div style={{ fontSize: 11, color: "#8b8fc8" }}>ID #{b.tournamentId} · {b.lineItems.length} line item{b.lineItems.length !== 1 ? "s" : ""}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmt(b.totalPlannedAmount)}</td>
                    <td style={{ color: "#4f46e5", fontWeight: 600 }}>{fmt(b.totalCollectedAmount)}</td>
                    <td><FundingPill collected={b.totalCollectedAmount} planned={b.totalPlannedAmount} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditing({ tournamentId: b.tournamentId, tournamentName: b.tournamentName, existing: b })}
                          style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #dfe4f5", background: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #fee2e2", background: "#fff", fontSize: 12, cursor: "pointer", color: "#dc2626" }}
                        >
                          Remove
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
    </section>
  );
}
