import { useState } from "react";
import { toast } from "sonner";

export function ImportInvoiceView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: string; date: string }>>([
    { name: "june_invoices.csv", status: "Processed", date: "2026-06-28 14:32" },
    { name: "q2_invoice_import.xlsx", status: "Processed", date: "2026-06-15 11:20" },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please choose a file first.");
      return;
    }
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast.success(`Successfully imported ${selectedFile.name}!`);
          const now = new Date();
          const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setUploadedFiles(prevFiles => [
            { name: selectedFile.name, status: "Processed", date: formattedDate },
            ...prevFiles
          ]);
          setSelectedFile(null);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleDownloadSample = () => {
    toast.success("Sample template saved to C:\\Users\\sande\\Downloads\\invoice_file.csv");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Invoices</p>
          <h1>Invoice Import</h1>
          <p className="masthead-desc">Upload batch invoices directly into your ledger accounts</p>
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
              transition: "border-color 0.15s"
            }}
            onClick={() => document.getElementById("import-file-selector")?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              {selectedFile ? selectedFile.name : "Click to select file"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--muted-2)" }}>
              Supports CSV, XLSX, XLS, and JSON formats
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
                onClick={() => setSelectedFile(null)} 
                title="Clear selected file"
                style={{ verticalAlign: "middle" }}
              >
                ✕
              </button>
            )}
          </div>

          {uploading && (
            <div style={{ width: "100%", background: "var(--bg)", borderRadius: 6, height: 8, overflow: "hidden", marginTop: 5 }}>
              <div style={{ width: `${progress}%`, background: "var(--income)", height: "100%", transition: "width 0.15s ease" }} />
            </div>
          )}
        </div>
      </div>

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
                          color: "var(--income)"
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/></svg>
          Tips To Remember !
        </h2>
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.5 }}>
          <li>
            Download a sample file to see the expected format.{" "}
            <button 
              type="button" 
              onClick={handleDownloadSample} 
              style={{ background: "none", border: "none", color: "var(--income)", textDecoration: "underline", padding: 0, font: "inherit", cursor: "pointer", fontWeight: 600 }}
            >
              Click Here
            </button>{" "}
            to download a sample invoice file.
          </li>
          <li>Place of supply is mandatory for Indian Customers.</li>
          <li>Duplicate invoice numbers will be rejected. Please ensure they are unique.</li>
          <li>Verify tax account end dates before adding taxes to avoid them being ignored.</li>
          <li>For Indian customer, if customer is new then please fill GSTIN field (optional).</li>
          <li>If invoice is export invoice then fill shipping port code, export bill no. and export bill date.</li>
          <li>Shipping port code should be not greater than 6.</li>
          <li>Shipping port bill number should not be greater than 7.</li>
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

