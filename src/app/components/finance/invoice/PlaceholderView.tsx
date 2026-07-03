import { EmptyBlock } from "./ledgerShared";

export function PlaceholderView({ title }: { title: string }) {
  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Finance</p>
          <h1 style={{ textTransform: "capitalize" }}>{title.replace(/-/g, " ")}</h1>
          <p className="masthead-desc">This part of the ledger hasn't been built yet.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body" style={{ paddingTop: 20 }}>
          <EmptyBlock title="Not built yet" text="This section is on the roadmap. Head back to the Dashboard, Invoices, or Receipts to see what's live." />
        </div>
      </div>
    </section>
  );
}

