import { describe, it, expect } from "vitest";
import { validateInvoiceCsvObjects } from "./csvLedgerParser";

describe("Treasurer Bulk Invoice CSV Parser & Validator", () => {
  it("validates valid invoice rows and catches duplicates, bad dates, and malformed GSTINs", () => {
    const raw = [
      {
        "Invoice Number": "INV-101",
        "Customer Name": "Greenwood Maintenance",
        Date: "2026-11-25",
        "Place Of Supply": "Karnataka",
        Amount: "15400.50",
        GSTIN: "29ABCDE1234F1Z5",
      },
      {
        "Invoice Number": "INV-101", // duplicate!
        "Customer Name": "Second Vendor",
        Date: "25/11/2026", // bad format!
        "Place Of Supply": "",
        Amount: "-10",
        GSTIN: "INVALID123",
      },
    ];

    const summary = validateInvoiceCsvObjects(raw);

    expect(summary.totalRows).toBe(2);
    expect(summary.validCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.rows[0].valid).toBe(true);
    expect(summary.rows[1].valid).toBe(false);
    expect(summary.rows[1].errors.some((e) => e.includes("Duplicate"))).toBe(true);
    expect(summary.rows[1].errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
    expect(summary.rows[1].errors.some((e) => e.includes("GSTIN"))).toBe(true);
  });
});
