import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  cfbosAccountingService,
  type AccountTreeNode,
  type AccountType,
} from "../../../../services/finance/cfbosAccountingService";

const TYPE_COLOR: Record<AccountType, string> = {
  ASSET: "#4f46e5",
  LIABILITY: "#dc2626",
  EQUITY: "#7c3aed",
  INCOME: "#16a34a",
  EXPENSE: "#d97706",
};

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expense",
};

function fmt(n: number): string {
  if (!n && n !== 0) return "—";
  const abs = Math.abs(n);
  const formatted =
    abs >= 10_000_000
      ? `₹${(abs / 10_000_000).toFixed(2)} Cr`
      : abs >= 100_000
      ? `₹${(abs / 100_000).toFixed(2)} L`
      : `₹${abs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  return n < 0 ? `(${formatted})` : formatted;
}

interface AccountRowProps {
  node: AccountTreeNode;
  depth: number;
}

function AccountRow({ node, depth }: AccountRowProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const color = TYPE_COLOR[node.accountType] ?? "#6b7094";

  return (
    <>
      <tr>
        <td style={{ paddingLeft: 16 + depth * 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasChildren && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: "1px solid #dfe4f5", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#6b7094", flexShrink: 0,
                }}
              >
                {expanded ? "−" : "+"}
              </button>
            )}
            {!hasChildren && <span style={{ width: 20, flexShrink: 0 }} />}
            <span style={{ fontWeight: depth === 0 ? 700 : 500 }}>{node.code}</span>
          </div>
        </td>
        <td style={{ paddingLeft: depth * 24 }}>
          <span style={{ fontWeight: depth === 0 ? 600 : 400 }}>{node.name}</span>
          {node.isSystemAccount && (
            <span style={{
              marginLeft: 8, fontSize: 10, letterSpacing: ".06em",
              textTransform: "uppercase", color: "#8b8fc8",
              border: "1px solid #dfe4f5", borderRadius: 999, padding: "1px 7px",
            }}>
              System
            </span>
          )}
        </td>
        <td>
          <span style={{
            display: "inline-block", fontSize: 11, letterSpacing: ".06em",
            textTransform: "uppercase", color, border: `1px solid ${color}33`,
            borderRadius: 999, padding: "2px 9px", fontWeight: 600,
          }}>
            {TYPE_LABEL[node.accountType] ?? node.accountType}
          </span>
        </td>
        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {fmt(node.currentBalance)}
        </td>
      </tr>
      {hasChildren && expanded &&
        node.children.map((child) => (
          <AccountRow key={child.id} node={child} depth={depth + 1} />
        ))}
    </>
  );
}

export function ChartOfAccountsView() {
  const [tree, setTree] = useState<AccountTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AccountType | "ALL">("ALL");

  useEffect(() => {
    cfbosAccountingService
      .getAccountTree()
      .then(setTree)
      .catch(() => toast.error("Failed to load Chart of Accounts"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType === "ALL"
    ? tree
    : tree.filter((n) => n.accountType === filterType);

  const totalBalance = filtered.reduce((s, n) => s + (n.currentBalance ?? 0), 0);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Accounting</p>
          <h1>Chart of Accounts</h1>
          <p className="masthead-desc">Double-entry account hierarchy with live running balances</p>
        </div>
        <div className="masthead-actions">
          <div className="tabs">
            {(["ALL", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`tab${filterType === t ? " active" : ""}`}
                onClick={() => setFilterType(t)}
              >
                {t === "ALL" ? "All" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8b8fc8" }}>
          Loading accounts…
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h2>Accounts ({filtered.length} groups)</h2>
            <span className="tag">Balance: {fmt(totalBalance)}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>Code</th>
                  <th>Account Name</th>
                  <th style={{ width: "14%" }}>Type</th>
                  <th style={{ width: "18%", textAlign: "right" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>
                      No accounts found
                    </td>
                  </tr>
                ) : (
                  filtered.map((node) => (
                    <AccountRow key={node.id} node={node} depth={0} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
