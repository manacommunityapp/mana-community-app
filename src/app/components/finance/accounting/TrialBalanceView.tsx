import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  cfbosAccountingService,
  type TrialBalance,
  type TrialBalanceLine,
  type FiscalYear,
} from "../../../../services/finance/cfbosAccountingService";

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const TYPE_COLOR: Record<string, string> = {
  ASSET: "#4f46e5",
  LIABILITY: "#dc2626",
  EQUITY: "#7c3aed",
  INCOME: "#16a34a",
  EXPENSE: "#d97706",
};

function fmt(n: number): string {
  if (!n && n !== 0) return "—";
  return `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function groupByType(lines: TrialBalanceLine[]): Record<string, TrialBalanceLine[]> {
  return lines.reduce((acc, line) => {
    const key = line.accountType || "OTHER";
    acc[key] = acc[key] ?? [];
    acc[key].push(line);
    return acc;
  }, {} as Record<string, TrialBalanceLine[]>);
}

export function TrialBalanceView() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFyId, setSelectedFyId] = useState<number | null>(null);
  const [data, setData] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [fyLoading, setFyLoading] = useState(true);

  useEffect(() => {
    cfbosAccountingService
      .getFiscalYears()
      .then((fys) => {
        setFiscalYears(fys);
        const current = fys.find((f) => f.isCurrent) ?? fys[0];
        if (current) setSelectedFyId(current.id);
      })
      .catch(() => toast.error("Failed to load fiscal years"))
      .finally(() => setFyLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFyId) return;
    setLoading(true);
    cfbosAccountingService
      .getTrialBalance(selectedFyId)
      .then(setData)
      .catch(() => toast.error("Failed to generate trial balance"))
      .finally(() => setLoading(false));
  }, [selectedFyId]);

  const groups = data ? groupByType(data.lines) : {};
  const orderedKeys = [...TYPE_ORDER.filter((t) => groups[t]), ...Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t))];

  const balanced = data ? Math.abs(data.totalDebit - data.totalCredit) < 0.01 : false;

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Accounting</p>
          <h1>Trial Balance</h1>
          <p className="masthead-desc">
            Aggregate debit and credit balances per account — confirms double-entry integrity
          </p>
        </div>
        <div className="masthead-actions">
          {fyLoading ? (
            <span style={{ color: "#8b8fc8", fontSize: 13 }}>Loading fiscal years…</span>
          ) : (
            <select
              value={selectedFyId ?? ""}
              onChange={(e) => setSelectedFyId(Number(e.target.value))}
              style={{
                padding: "9px 14px", borderRadius: 8, border: "1px solid #dfe4f5",
                fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer",
              }}
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name} {fy.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8b8fc8" }}>
          Generating trial balance…
        </div>
      )}

      {!loading && data && (
        <>
          {/* Balance check banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
            borderRadius: 12, marginBottom: 20,
            background: balanced ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${balanced ? "#bbf7d0" : "#fecaca"}`,
          }}>
            <span style={{ fontSize: 20 }}>{balanced ? "✓" : "⚠"}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: balanced ? "#166534" : "#991b1b" }}>
                {balanced ? "Books are balanced" : "Books are out of balance"}
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: balanced ? "#15803d" : "#b91c1c" }}>
                Total Debit: {fmt(data.totalDebit)} · Total Credit: {fmt(data.totalCredit)}
                {!balanced && ` · Difference: ${fmt(Math.abs(data.totalDebit - data.totalCredit))}`}
              </p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7094" }}>Fiscal Year</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{data.fiscalYearName}</p>
            </div>
          </div>

          {/* Account type sections */}
          {orderedKeys.map((type) => {
            const lines = groups[type] ?? [];
            const typeDebit = lines.reduce((s, l) => s + (l.debitBalance ?? 0), 0);
            const typeCredit = lines.reduce((s, l) => s + (l.creditBalance ?? 0), 0);
            const color = TYPE_COLOR[type] ?? "#6b7094";

            return (
              <div key={type} className="card" style={{ marginBottom: 16 }}>
                <div className="card-head">
                  <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: color, flexShrink: 0, display: "inline-block",
                    }} />
                    {type}
                  </h2>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                      Dr: {fmt(typeDebit)}
                    </span>
                    <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                      Cr: {fmt(typeCredit)}
                    </span>
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "12%" }}>Code</th>
                        <th>Account Name</th>
                        <th style={{ width: "18%", textAlign: "right" }}>Debit Balance</th>
                        <th style={{ width: "18%", textAlign: "right" }}>Credit Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.accountCode}>
                          <td style={{ color: "#6b7094" }}>{line.accountCode}</td>
                          <td>{line.accountName}</td>
                          <td style={{
                            textAlign: "right", fontVariantNumeric: "tabular-nums",
                            color: line.debitBalance > 0 ? "#4f46e5" : "#cbd5e1",
                            fontWeight: line.debitBalance > 0 ? 600 : 400,
                          }}>
                            {line.debitBalance > 0 ? fmt(line.debitBalance) : "—"}
                          </td>
                          <td style={{
                            textAlign: "right", fontVariantNumeric: "tabular-nums",
                            color: line.creditBalance > 0 ? "#dc2626" : "#cbd5e1",
                            fontWeight: line.creditBalance > 0 ? 600 : 400,
                          }}>
                            {line.creditBalance > 0 ? fmt(line.creditBalance) : "—"}
                          </td>
                        </tr>
                      ))}
                      {/* Type subtotal */}
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={2} style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: ".04em", textTransform: "uppercase", color: "#6b7094" }}>
                          {type} Total
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#4f46e5" }}>
                          {typeDebit > 0 ? fmt(typeDebit) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#dc2626" }}>
                          {typeCredit > 0 ? fmt(typeCredit) : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand totals */}
          <div className="card" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}>
            <div className="card-head" style={{ padding: "18px 22px" }}>
              <h2 style={{ color: "#fff", margin: 0 }}>Grand Total</h2>
              <div style={{ display: "flex", gap: 32 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: ".07em", textTransform: "uppercase" }}>
                    Total Debit
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{fmt(data.totalDebit)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: ".07em", textTransform: "uppercase" }}>
                    Total Credit
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{fmt(data.totalCredit)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !data && !fyLoading && fiscalYears.length === 0 && (
        <div className="card">
          <div className="card-body">
            <div className="empty">
              <div className="glyph">📅</div>
              <h3>No Fiscal Years Configured</h3>
              <p>Create a fiscal year to generate the trial balance.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
