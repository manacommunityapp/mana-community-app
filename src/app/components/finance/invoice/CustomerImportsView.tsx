import { useState } from "react";
import { toast } from "sonner";

export function CustomerImportsView({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; status: string; date: string }[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSize = (file.size / 1024).toFixed(1) + " KB";
      const newFile = {
        name: file.name,
        size: fileSize,
        status: "Processing",
        date: new Date().toISOString().split("T")[0]
      };
      setUploadedFiles([newFile, ...uploadedFiles]);
      toast.success(`File "${file.name}" uploaded successfully!`);

      // Mock processing completion
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: "Imported" } : f));
        toast.success(`File "${file.name}" successfully parsed and imported!`);
      }, 2000);
    }
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income / Customers</p>
          <h1>Import Customers</h1>
          <p className="masthead-desc">Import customer list files via standard spreadsheets</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Guidelines Box */}
          <div className="card shadow-sm" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Guidelines</h3>
            <ul style={{ paddingLeft: 18, fontSize: "12.5px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Ensure the file is in Excel (.xlsx) or CSV format.</li>
              <li>Columns must contain: <strong>Name</strong> (required), <strong>GST Type</strong>, <strong>GSTIN</strong>, <strong>Email</strong>, and <strong>Phone Number</strong>.</li>
              <li>Limit batch uploads to 1000 customer records at a time to prevent timeout errors.</li>
            </ul>
          </div>

          {/* Upload Box */}
          <div className="card shadow-sm" style={{ border: "1px dashed var(--income)", borderRadius: "12px", background: "#fcfdfe", padding: "40px", textAlign: "center" }}>
            <svg style={{ color: "var(--income)", marginBottom: 12 }} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14.5px", fontWeight: 600, color: "var(--ink)" }}>Drag and drop your customer list file here</h4>
            <p style={{ margin: "0 0 15px 0", fontSize: "12px", color: "var(--muted)" }}>Excel or CSV formats supported</p>
            <label className="btn btn-outline" style={{ display: "inline-flex", cursor: "pointer", height: "auto", padding: "8px 20px" }}>
              Choose File
              <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>

          {/* Uploaded Files Table */}
          {uploadedFiles.length > 0 && (
            <div className="card shadow-sm" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Uploaded Files</h3>
              <div className="table-scroll">
                <table className="data" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{f.name}</td>
                        <td>{f.size}</td>
                        <td>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            background: f.status === "Imported" ? "#def7ec" : "#fef08a",
                            color: f.status === "Imported" ? "#03543f" : "#854d0e"
                          }}>{f.status}</span>
                        </td>
                        <td>{f.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} style={{ padding: "8px 20px", height: "auto" }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave} style={{ padding: "8px 20px", height: "auto", background: "var(--income)", borderColor: "var(--income)", color: "#fff" }}>
              Finish Import
            </button>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="card shadow-sm" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", padding: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>Templates</h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>Download our template format containing sample data fields to quickly structure your customer profile details.</p>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => toast.success("Sample template spreadsheet download triggered!")}
            style={{ width: "100%", display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center", fontSize: "12.5px", padding: "6px 12px", height: "auto" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Download Template
          </button>
        </div>
      </div>
    </section>
  );
}

