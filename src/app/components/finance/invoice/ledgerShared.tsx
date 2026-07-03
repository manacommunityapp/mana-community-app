/* ──────────────────────────────────────────────────────────────────────────
   Ledger — shared primitives used across every Income/Expense sub-view.
   Line-item model, money formatter, and the small presentational helpers
   (Field / EmptyBlock / StatCard). Kept in one place so each sub-menu file
   stays focused on its own screen.
   ────────────────────────────────────────────────────────────────────────── */

export interface LineItem {
  item: string;
  description: string;
  qty: number;
  cost: number;
  disc: number; // percent
  tax: number;  // percent
}

export const emptyLine: LineItem = { item: "", description: "", qty: 0, cost: 0, disc: 0, tax: 0 };
export const money = (n: number) => n.toFixed(2);

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

export function EmptyBlock({ title, text, noTop }: { title: string; text: string; noTop?: boolean }) {
  return (
    <div className="empty" style={noTop ? { borderTop: "none", marginTop: 0, paddingTop: 8 } : undefined}>
      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" stroke="#5C6B60" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
      <h3>{title}</h3><p>{text}</p>
    </div>
  );
}

export function StatCard({ cls, label, amt, value, sub }: { cls: string; label: string; amt?: boolean; value?: string; sub: string }) {
  return (
    <div className={`stat-card ${cls}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-amt">{amt ? <><span className="cur">INR</span>0.00</> : value}</p>
      <p className="stat-sub">{sub}</p>
    </div>
  );
}
