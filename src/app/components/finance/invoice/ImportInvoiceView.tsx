import { useState } from "react";
import { toast } from "sonner";
import { parseInvoiceCsvOffThread, type CsvParseSummary } from "../../../../services/finance/csvLedgerParser";
import { useVirtualRows } from "../../../../hooks/useVirtualRows";

export function ImportInvoiceView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parseSummary, setParseSummary] = useState<CsvParseSummary | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: string; date: string }>>([
    { name: "june_invoices.csv", status: "Processed", date: "2026-06-28 14:32" },
    { name: "q2_invoice_import.xlsx", status: "Processed", date: "2026-06-15 11:20" },
  ]);

  const {
    containerRef: previewScrollRef,
    onScroll: handlePreviewScroll,
    visibleItems: visiblePreviewRows,
    topSpacerHeight,
    bottomSpacerHeight,
  } = useVirtualRows(parseSummary?.rows ?? [], { rowHeight: 42, viewportHeight: 320, overscan: 6 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setParseSummary(null);

    if (file.name.toLowerCase().endsWith(".csv")) {
      try {
        const summary = await parseInvoiceCsvOffThread(file);
        setParseSummary(summary);
        if (summary.errorCount > 0) {
          toast.warning(`Parsed ${summary.totalRows} rows off-thread: ${summary.errorCount} validation error(s) found.`);
        } else {
          toast.success(`Validated ${summary.validCount} CSV rows ready to import.`);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to parse CSV file.");
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please choose a file first.");
      return;
    }
    if (parseSummary && parseSummary.validCount === 0) {
      toast.error("No valid CSV rows to import. Fix validation errors first.");
      return;
    }

    setUploading(true);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const importedCount = parseSummary ? `${parseSummary.validCount} valid rows` : "Processed";

    setUploadedFiles((prev) => [
      { name: selectedFile.name, status: importedCount, date: formattedDate },
      ...prev,
    ]);
    setUploading(false);
    setSelectedFile(null);
    setParseSummary(null);
    toast.success(`Successfully imported ${importedCount}!`);
    onSave();
  };

  const handleDownloadSample = () => {
    toast.success("Sample CSV format: Invoice Number, Customer Name, Date, Place Of Supply, Amount, GSTIN");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Invoices</p>
          <h1>Invoice Import</h1>
          <p className="masthead-desc">Upload batch invoices via off-thread Web Worker validation</p>
        </div>
      </div>

      <div className="form-card">
        <h2 className="section-title">Import File</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              border: "2px dashed var(--line)",
              borderRadius: 12,
              padding: "30px 20px",
              textAlign: "center",
              background: "var(--bg)",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onClick={() => document.getElementById("import-file-selector")?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              {selectedFile ? selectedFile.name : "Click to select CSV / Excel / JSON file"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--muted-2)" }}>
              CSV files validate in a background Web Worker without freezing the browser
            </p>
          </div>
          <input
            type="file"
            id="import-file-selector"
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".csv,.xlsx,.xls,.json"
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
              Chosen file: <strong style={{ color: "var(--ink)" }}>{selectedFile ? selectedFile.name : "No file chosen"}</strong>
            </span>
            {selectedFile && (
              <button
                type="button"
                className="row-del"
                onClick={() => { setSelectedFile(null); setParseSummary(null); }}
                title="Clear selected file"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {parseSummary && (
        <div className="card table-card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <h2>Validation Preview ({parseSummary.validCount} valid / {parseSummary.errorCount} errors)</h2>
            <span className="tag">{parseSummary.totalRows} rows</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div ref={previewScrollRef} onScroll={handlePreviewScroll} className="table-scroll" style={{ maxHeight: 320, overflowY: "auto" }}>
              <table className="data" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status / Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {topSpacerHeight > 0 && (
                    <tr aria-hidden="true" style={{ height: topSpacerHeight }}>
                      <td colSpan={5} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                  {visiblePreviewRows.map((row) => (
                    <tr key={row.rowIndex} style={{ height: 42 }}>
                      <td>#{row.rowIndex}</td>
                      <td style={{ fontWeight: 600 }}>{row.invoiceNumber || "—"}</td>
                      <td>{row.customerName || "—"}</td>
                      <td className="amount">₹{row.amount.toFixed(2)}</td>
                      <td style={{ color: row.valid ? "var(--income)" : "#DC2626", fontSize: 12, fontWeight: 600 }}>
                        {row.valid ? "Valid" : row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                  {bottomSpacerHeight > 0 && (
                    <tr aria-hidden="true" style={{ height: bottomSpacerHeight }}>
                      <td colSpan={5} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card table-card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h2>Uploaded Files</h2>
          <span className="tag">{uploadedFiles.length} files</span>
        </div>
        <div className="card-body" style={{ padding: "0 0 8px 0" }}>
          <div className="table-scroll" style={{ padding: 0 }}>
            <table className="data" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 22 }}>File Name</th>
                  <th>Status</th>
                  <th style={{ paddingRight: 22, textAlign: "right" }}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500, color: "var(--ink)", paddingLeft: 22 }}>{file.name}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "var(--income-soft)",
                          color: "var(--income)",
                        }}
                      >
                        {file.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", paddingRight: 22, textAlign: "right" }}>
                      {file.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ borderLeft: "4px solid var(--gold)" }}>
        <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold)" }}>
          Tips To Remember!
        </h2>
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.5 }}>
          <li>
            Download sample format:{" "}
            <button
              type="button"
              onClick={handleDownloadSample}
              style={{ background: "none", border: "none", color: "var(--income)", textDecoration: "underline", padding: 0, font: "inherit", cursor: "pointer", fontWeight: 600 }}
            >
              Click Here
            </button>
          </li>
          <li>Place of supply and unique invoice numbers are mandatory.</li>
          <li>Optional 15-character Indian GSTIN is validated per row before import.</li>
        </ul>
      </div>

      <div className="action-bar">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Importing..." : "Upload / Import"}
        </button>
      </div>
    </section>
  );
}
