import { EmptyBlock } from "./ledgerShared";

export function DashboardView({ periodTab, setPeriodTab }: { periodTab: number; setPeriodTab: (i: number) => void }) {
  const periods = ["This Month", "Last 6 Months", "Financial Year"];
  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Overview</p>
          <h1>Income &amp; Expense</h1>
        </div>
        <div className="tabs">
          {periods.map((p, i) => (
            <button key={p} className={`tab${periodTab === i ? " active" : ""}`} onClick={() => setPeriodTab(i)}>{p}</button>
          ))}
        </div>
      </div>

      <div className="hero">
        <div className="hero-top">
          <div>
            <p className="hero-label">Net position · July 2026</p>
            <div className="hero-figures">
              <dl className="figure income"><dt>Income</dt><dd><span className="cur">INR</span>0.00</dd></dl>
              <dl className="figure expense"><dt>Expense</dt><dd><span className="cur">INR</span>0.00</dd></dl>
            </div>
          </div>
          <div className="stamp"><div className="stamp-inner"><span className="amt">₹0.00</span><span className="sub">Net · Nil</span></div></div>
        </div>
        <div className="hero-chart">
          <svg width="200" height="64" viewBox="0 0 200 64" fill="none">
            <line x1="0" y1="32" x2="200" y2="32" stroke="#3A5646" strokeWidth="1" strokeDasharray="3 4" />
            <path d="M0 32 L200 32" stroke="#7FD9A8" strokeWidth="1.5" strokeDasharray="2 3" />
            <circle cx="100" cy="32" r="3" fill="#EFEBDD" />
          </svg>
          <p>No entries posted yet this period. Once you raise an invoice or record an expense, this line will start tracking <strong>income against expense</strong>, day by day.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-head"><h2>Recent Activities</h2><span className="tag">Live</span></div>
          <div className="card-body">
            <div className="activity-row"><span className="dot" /><div>
              <p>You added <span className="who">New signup for startup</span> as owner</p>
              <p className="when">7 minutes ago</p>
            </div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Top 15 Selling Items</h2><span className="tag">This Month</span></div>
          <div className="card-body">
            <EmptyBlock title="No sales yet" text="Your top-selling items will show here once invoices are raised." />
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-head"><h2>Cash &amp; Bank Balance</h2><span className="tag">4 Accounts</span></div>
          <div className="card-body">
            <table>
              <thead><tr><th>Account</th><th style={{ textAlign: "right" }}>Value (INR)</th></tr></thead>
              <tbody>
                {["Cash in hand", "Citi Bank", "SBI Bank", "Standard Chartered Bank"].map((a) => (
                  <tr key={a}><td className="acct"><span className="swatch" />{a}</td><td className="amount">0.00</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Invoices by Status</h2><span className="tag">All time</span></div>
          <div className="card-body">
            <EmptyBlock title="No invoices yet" text="Create an invoice to see the status breakdown." noTop />
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-head"><h2>Top 5 Unpaid Invoices</h2><span className="tag">Receivables</span></div>
          <div className="card-body"><EmptyBlock title="You're all caught up" text="No overdue invoices right now." /></div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Top 5 Payables</h2><span className="tag">Payables</span></div>
          <div className="card-body"><EmptyBlock title="No payables due" text="You don't have any overdue purchase bills at the moment." /></div>
        </div>
      </div>

      <p className="footnote">Statement generated 03 Jul 2026 · Figures in Indian Rupees (INR)</p>
    </section>
  );
}

