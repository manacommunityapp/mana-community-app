import React, { useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  DollarSign,
  Calendar,
  Building,
  User,
  Trash2,
  Info
} from "lucide-react";
import type {
  BenefitCategoryKey,
  HealthBenefitWalletDto,
  HealthcareClaimDto
} from "../../../types/health";
import { healthService } from "../../../services/healthService";

interface SubmitBenefitClaimModalProps {
  wallet: HealthBenefitWalletDto;
  onClose: () => void;
  onClaimSubmitted: (newClaim: HealthcareClaimDto) => void;
  preselectedCategory?: BenefitCategoryKey;
}

export const SubmitBenefitClaimModal: React.FC<SubmitBenefitClaimModalProps> = ({
  wallet,
  onClose,
  onClaimSubmitted,
  preselectedCategory = "CONSULTATIONS"
}) => {
  const [category, setCategory] = useState<BenefitCategoryKey>(preselectedCategory);
  const [patientName, setPatientName] = useState(wallet.program.coveredMembers[0]?.name || "Sandeep Varma");
  const [patientRelationship, setPatientRelationship] = useState("Self");
  const [serviceName, setServiceName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [billAmount, setBillAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Attachments state
  const [documents, setDocuments] = useState<
    { name: string; documentType: "PRESCRIPTION" | "BILL_INVOICE" | "DIAGNOSTIC_REPORT" | "PAYMENT_RECEIPT"; fileSize: string }[]
  >([
    { name: "Medical_Invoice_Receipt.pdf", documentType: "BILL_INVOICE", fileSize: "240 KB" }
  ]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<"PRESCRIPTION" | "BILL_INVOICE" | "DIAGNOSTIC_REPORT" | "PAYMENT_RECEIPT">("PRESCRIPTION");

  const selectedCatObj = wallet.categories.find(c => c.category === category);
  const remainingAllowance = selectedCatObj?.remainingAllowance || 0;
  const numAmount = typeof billAmount === "number" ? billAmount : 0;
  const coPayPercent = selectedCatObj?.coPayPercent ?? 10;
  const coPayAmount = Math.round((numAmount * coPayPercent) / 100);
  const eligibleAmountAfterCoPay = Math.max(0, numAmount - coPayAmount);
  const estimatedApproved = Math.min(remainingAllowance, eligibleAmountAfterCoPay);
  const estimatedOutOfPocket = Math.max(0, numAmount - estimatedApproved);

  const handleAddSampleDoc = () => {
    if (!newDocName.trim()) return;
    setDocuments(prev => [
      ...prev,
      {
        name: newDocName.endsWith(".pdf") || newDocName.endsWith(".jpg") ? newDocName : `${newDocName}.pdf`,
        documentType: newDocType,
        fileSize: `${Math.floor(120 + Math.random() * 400)} KB`
      }
    ]);
    setNewDocName("");
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleBeneficiaryChange = (name: string) => {
    setPatientName(name);
    const member = wallet.program.coveredMembers.find(m => m.name === name);
    if (member) {
      setPatientRelationship(member.relation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Please enter a valid bill amount greater than ₹0");
      return;
    }
    if (!providerName.trim()) {
      setErrorMsg("Please enter the hospital, clinic, or pharmacy name");
      return;
    }
    if (!serviceName.trim()) {
      setErrorMsg("Please enter service description (e.g. Cardiologist consultation, Blood profile, Antibiotics)");
      return;
    }
    if (documents.length === 0) {
      setErrorMsg("Please attach at least one invoice/receipt document");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const claim = await healthService.submitReimbursementClaim({
        category,
        serviceName,
        patientName,
        patientRelationship,
        providerName,
        billNumber: billNumber || `BILL-${Math.floor(10000 + Math.random() * 90000)}`,
        treatmentDate,
        billAmount: numAmount,
        documents,
        notes
      });
      onClaimSubmitted(claim);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit claim. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-400/20 text-blue-200 border border-blue-400/40 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              MediBuddy Model • Direct Claim Filing
            </span>
            <span className="text-white/60 text-xs">• Non-Stored Allowance Ledger</span>
          </div>
          <h2 className="text-xl font-black text-white">File Healthcare Reimbursement Claim</h2>
          <p className="text-blue-100 text-xs mt-1">
            Claim expenses against your community healthcare subsidy pool. Payouts credited upon scrutiny.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Beneficiary & Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Beneficiary Member
              </label>
              <select
                value={patientName}
                onChange={e => handleBeneficiaryChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {wallet.program.coveredMembers.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.relation}) • Card #{m.cashlessCardNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Benefit Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as BenefitCategoryKey)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {wallet.categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.label} (Remaining: ₹{cat.remainingAllowance})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Live Allowance Pill */}
          {selectedCatObj && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>{selectedCatObj.label}</strong>: Available cap is <strong>₹{selectedCatObj.remainingAllowance}</strong> of ₹{selectedCatObj.totalAllowance}.
                </span>
              </div>
              <span className="font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                Co-pay: {selectedCatObj.coPayPercent}%
              </span>
            </div>
          )}

          {/* Provider & Service Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Hospital / Clinic / Pharmacy
              </label>
              <input
                type="text"
                placeholder="e.g. Manipal Hospital, Apollo Clinic, MedPlus"
                value={providerName}
                onChange={e => setProviderName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. General Physician OPD, Complete Blood Count, BP Meds"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bill Number, Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Bill / Invoice No.
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-991"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Treatment Date
              </label>
              <input
                type="date"
                value={treatmentDate}
                onChange={e => setTreatmentDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Bill Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                placeholder="₹ Amount"
                value={billAmount}
                onChange={e => setBillAmount(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Co-pay & Out-of-pocket Estimate Card */}
          {numAmount > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Live Settlement Breakdown Estimate
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-gray-500 block text-[11px]">Billed</span>
                  <strong className="text-gray-900 text-sm">₹{numAmount}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-amber-700 block text-[11px]">Co-Pay ({coPayPercent}%)</span>
                  <strong className="text-amber-800 text-sm">₹{coPayAmount}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-emerald-700 block text-[11px]">Reimbursable</span>
                  <strong className="text-emerald-700 text-sm font-black">₹{estimatedApproved}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-purple-700 block text-[11px]">Out-of-Pocket</span>
                  <strong className="text-purple-800 text-sm">₹{estimatedOutOfPocket}</strong>
                </div>
              </div>
              {numAmount > remainingAllowance && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Bill exceeds category allowance cap. The excess ₹{numAmount - remainingAllowance} will be borne as out-of-pocket.
                </p>
              )}
            </div>
          )}

          {/* Document Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Supporting Documents (Bills & Prescriptions)
            </label>

            {/* Existing Documents List */}
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-800">{doc.name}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded">
                      {doc.documentType}
                    </span>
                    <span className="text-gray-400">({doc.fileSize})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Document Row */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap pt-1">
              <input
                type="text"
                placeholder="Attachment title (e.g. Doctor_Rx_Report.pdf)"
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
              />
              <select
                value={newDocType}
                onChange={e => setNewDocType(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
              >
                <option value="PRESCRIPTION">Prescription</option>
                <option value="BILL_INVOICE">Tax Invoice</option>
                <option value="DIAGNOSTIC_REPORT">Lab Report</option>
                <option value="PAYMENT_RECEIPT">Receipt</option>
              </select>
              <button
                type="button"
                onClick={handleAddSampleDoc}
                className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                + Add File
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Accepted formats: PDF, JPG, PNG. Direct integration syncs with your Mana Health Vault.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Emergency night consultation, doctor advised immediate nebulization"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center gap-2"
            >
              {submitting ? "Submitting Claim..." : "Submit Claim for Reimbursement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
