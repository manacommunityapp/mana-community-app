import Papa from "papaparse";
import { z } from "zod";

export const invoiceCsvRowSchema = z.object({
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  customerName: z.string().trim().min(1, "Customer name is required"),
  docDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  placeOfSupply: z.string().trim().min(2, "Place of supply is required"),
  amount: z.coerce.number().finite().positive("Amount must be > 0"),
  gstin: z
    .string()
    .trim()
    .optional()
    .transform((v) => v ?? "")
    .refine(
      (v) => v === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v),
      "Invalid 15-char Indian GSTIN"
    ),
});

export interface ValidatedCsvRow {
  rowIndex: number;
  invoiceNumber: string;
  customerName: string;
  docDate: string;
  placeOfSupply: string;
  amount: number;
  gstin: string;
  valid: boolean;
  errors: string[];
}

export interface CsvParseSummary {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: ValidatedCsvRow[];
}

/**
 * Validates already-parsed CSV objects against Indian ERP invoice rules
 * (duplicate invoice numbers, YYYY-MM-DD dates, mandatory Place of Supply, GSTIN).
 */
export function validateInvoiceCsvObjects(rawRows: Array<Record<string, unknown>>): CsvParseSummary {
  const seenNumbers = new Set<string>();
  const validated: ValidatedCsvRow[] = [];
  let validCount = 0;
  let errorCount = 0;

  rawRows.forEach((raw, idx) => {
    const normalized = {
      invoiceNumber: String(raw.invoiceNumber ?? raw["Invoice Number"] ?? raw.invoice_no ?? "").trim(),
      customerName: String(raw.customerName ?? raw["Customer Name"] ?? raw.customer ?? "").trim(),
      docDate: String(raw.docDate ?? raw["Date"] ?? raw.date ?? "").trim(),
      placeOfSupply: String(raw.placeOfSupply ?? raw["Place Of Supply"] ?? raw.state ?? "").trim(),
      amount: raw.amount ?? raw["Amount"] ?? raw.total ?? 0,
      gstin: String(raw.gstin ?? raw["GSTIN"] ?? "").trim(),
    };

    const parsed = invoiceCsvRowSchema.safeParse(normalized);
    const errors: string[] = [];

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(issue.message);
      }
    }

    const invKey = normalized.invoiceNumber.toUpperCase();
    if (invKey) {
      if (seenNumbers.has(invKey)) {
        errors.push(`Duplicate invoice number '${normalized.invoiceNumber}'`);
      } else {
        seenNumbers.add(invKey);
      }
    }

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else errorCount++;

    validated.push({
      rowIndex: idx + 1,
      invoiceNumber: normalized.invoiceNumber,
      customerName: normalized.customerName,
      docDate: normalized.docDate,
      placeOfSupply: normalized.placeOfSupply,
      amount: Number(normalized.amount) || 0,
      gstin: normalized.gstin,
      valid: isValid,
      errors,
    });
  });

  return {
    totalRows: validated.length,
    validCount,
    errorCount,
    rows: validated,
  };
}

/**
 * Offloads CSV tokenization to a background Web Worker via PapaParse (`worker: true`),
 * keeping the treasurer's browser UI responsive at 60fps for 10,000+ ledger rows.
 */
export function parseInvoiceCsvOffThread(file: File): Promise<CsvParseSummary> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      worker: typeof Worker !== "undefined",
      skipEmptyLines: true,
      complete: (results) => {
        resolve(validateInvoiceCsvObjects(results.data ?? []));
      },
      error: (err) => {
        reject(new Error(err?.message || "CSV parsing failed"));
      },
    });
  });
}
