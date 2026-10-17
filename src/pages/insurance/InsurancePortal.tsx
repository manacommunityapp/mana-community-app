import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { InsuranceHeader } from "./InsuranceHeader";
import { InsuranceOverviewTab } from "./InsuranceOverviewTab";
import { InsuranceCatalogueTab } from "./InsuranceCatalogueTab";
import { InsuranceCompareTab } from "./InsuranceCompareTab";
import { InsurancePoliciesTab } from "./InsurancePoliciesTab";
import { InsuranceClaimsTab } from "./InsuranceClaimsTab";
import { InsuranceGroupTab } from "./InsuranceGroupTab";
import { InsuranceConsentsTab } from "./InsuranceConsentsTab";
import { AddPolicyModal, ClaimModal, GroupModal } from "./InsuranceModals";
import { sortCatalogue, SortKey, INSURANCE_NOTICE_VERSION } from "../../constants/insurance";
import { insuranceService } from "../../services/insuranceService";
import type {
  CatalogueItem,
  PolicyView,
  PolicyCreateInput,
  ClaimCaseView,
  GroupEnquiryView,
  GroupEnquiryInput,
  ConsentView,
  InsuranceCategory,
} from "../../types/insurance";

export const InsurancePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "catalogue" | "compare" | "policies" | "claims" | "group" | "consents"
  >("overview");

  // Catalogue
  const [selectedCategory, setSelectedCategory] = useState<InsuranceCategory>("HEALTH");
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("NAME");
  const [shortlist, setShortlist] = useState<CatalogueItem[]>([]);

  // Policies
  const [policies, setPolicies] = useState<PolicyView[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState<Partial<PolicyCreateInput>>({ category: "HEALTH" });
  const [policyFormErrors, setPolicyFormErrors] = useState<Record<string, string>>({});
  const [policySubmitting, setPolicySubmitting] = useState(false);

  // Claims
  const [claims, setClaims] = useState<ClaimCaseView[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimType, setNewClaimType] = useState("");
  const [newClaimDesc, setNewClaimDesc] = useState("");
  const [newClaimPolicyId, setNewClaimPolicyId] = useState<number | undefined>(undefined);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Group Enquiries
  const [groupEnquiries, setGroupEnquiries] = useState<GroupEnquiryView[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState<Partial<GroupEnquiryInput>>({
    coverageScope: "COMMON_PROPERTY",
    contactMethod: "EMAIL",
    approxMembers: 50,
  });
  const [groupConsentChecked, setGroupConsentChecked] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  // Consents
  const [consents, setConsents] = useState<ConsentView[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  useEffect(() => {
    loadPolicies();
    loadConsents();
  }, []);

  useEffect(() => {
    if (activeTab === "catalogue" || activeTab === "overview") {
      loadCatalogue(selectedCategory);
    }
    if (activeTab === "claims") {
      loadClaims();
    }
    if (activeTab === "group") {
      loadGroupEnquiries();
    }
    if (activeTab === "consents") {
      loadConsents();
    }
  }, [activeTab, selectedCategory]);

  const loadCatalogue = async (cat: InsuranceCategory) => {
    setCatalogueLoading(true);
    setCatalogueError(null);
    try {
      const data = await insuranceService.catalogue(cat);
      setCatalogueItems(data);
    } catch {
      setCatalogueError("Unable to fetch insurance catalogue. Products may be temporarily unavailable.");
    } finally {
      setCatalogueLoading(false);
    }
  };

  const loadPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const data = await insuranceService.policies();
      setPolicies(data);
    } catch {
      // Gracefully silent
    } finally {
      setPoliciesLoading(false);
    }
  };

  const loadClaims = async () => {
    setClaimsLoading(true);
    try {
      const data = await insuranceService.claimCases();
      setClaims(data);
    } catch {
      showFeedback("error", "Failed to load claims assistance requests.");
    } finally {
      setClaimsLoading(false);
    }
  };

  const loadGroupEnquiries = async () => {
    setGroupLoading(true);
    try {
      const data = await insuranceService.groupEnquiries();
      setGroupEnquiries(data);
    } catch {
      showFeedback("error", "Failed to load group insurance enquiries.");
    } finally {
      setGroupLoading(false);
    }
  };

  const loadConsents = async () => {
    setConsentsLoading(true);
    try {
      const data = await insuranceService.consents();
      setConsents(data);
    } catch {
      // Gracefully silent
    } finally {
      setConsentsLoading(false);
    }
  };

  const toggleShortlist = (item: CatalogueItem) => {
    const exists = shortlist.some((x) => x.productVersionId === item.productVersionId);
    if (exists) {
      setShortlist(shortlist.filter((x) => x.productVersionId !== item.productVersionId));
    } else {
      if (shortlist.length >= 4) {
        showFeedback("error", "You can compare up to 4 insurance products side-by-side.");
        return;
      }
      setShortlist([...shortlist, item]);
    }
  };

  const sortedCatalogue = useMemo(() => {
    return sortCatalogue(catalogueItems, sortKey);
  }, [catalogueItems, sortKey]);

  const handleAddPolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newPolicy.insurerName?.trim()) errs.insurerName = "Insurer name is required.";
    if (!newPolicy.productName?.trim()) errs.productName = "Product name is required.";
    if (!newPolicy.category) errs.category = "Category is required.";

    if (Object.keys(errs).length > 0) {
      setPolicyFormErrors(errs);
      return;
    }

    setPolicySubmitting(true);
    try {
      await insuranceService.createPolicy(newPolicy as PolicyCreateInput);
      showFeedback("success", "Policy tracked successfully in your Mana Vault.");
      setShowAddPolicyModal(false);
      setNewPolicy({ category: "HEALTH" });
      setPolicyFormErrors({});
      loadPolicies();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to save policy.");
    } finally {
      setPolicySubmitting(false);
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!window.confirm("Remove this policy from your Mana Community tracker?")) {
      return;
    }
    try {
      await insuranceService.deletePolicy(id);
      showFeedback("success", "Policy record removed from Mana.");
      loadPolicies();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to remove policy.");
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimType.trim()) {
      showFeedback("error", "Please specify the claim type.");
      return;
    }
    setClaimSubmitting(true);
    try {
      await insuranceService.createClaimCase({
        policyId: newClaimPolicyId,
        claimType: newClaimType.trim(),
        description: newClaimDesc.trim() || undefined,
      });
      showFeedback("success", "Claims assistance request opened. Our support team will follow up.");
      setShowNewClaimModal(false);
      setNewClaimType("");
      setNewClaimDesc("");
      loadClaims();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to submit claim request.");
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupConsentChecked) {
      showFeedback("error", "Please accept the consent disclosure to proceed.");
      return;
    }
    if (!groupForm.organisationName || !groupForm.coverageSought) {
      showFeedback("error", "Please complete all mandatory organisation fields.");
      return;
    }
    setGroupSubmitting(true);
    try {
      const consent = await insuranceService.grantConsent("GROUP_ENQUIRY", INSURANCE_NOTICE_VERSION);
      await insuranceService.createGroupEnquiry({
        organisationName: groupForm.organisationName!,
        organisationType: groupForm.organisationType || "Housing Society / RWA",
        coverageScope: groupForm.coverageScope || "COMMON_PROPERTY",
        coverageSought: groupForm.coverageSought!,
        approxMembers: Number(groupForm.approxMembers) || 5,
        requirements: groupForm.requirements,
        contactMethod: groupForm.contactMethod || "EMAIL",
        consentId: consent.id,
      });
      showFeedback("success", "Group insurance enquiry recorded. A representative will contact your RWA.");
      setShowNewGroupModal(false);
      setGroupForm({ coverageScope: "COMMON_PROPERTY", contactMethod: "EMAIL", approxMembers: 50 });
      setGroupConsentChecked(false);
      loadGroupEnquiries();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to submit group enquiry.");
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleWithdrawConsent = async (id: number) => {
    try {
      await insuranceService.withdrawConsent(id);
      showFeedback("success", "Data sharing consent withdrawn.");
      loadConsents();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to withdraw consent.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <InsuranceHeader
        onTrackPolicy={() => setShowAddPolicyModal(true)}
        onExplore={() => setActiveTab("catalogue")}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-2 sm:gap-6 text-sm font-semibold">
        {[
          { key: "overview", label: "Overview & Dashboard" },
          { key: "catalogue", label: "Product Catalogue" },
          { key: "compare", label: `Compare (${shortlist.length})` },
          { key: "policies", label: `My Policies (${policies.length})` },
          { key: "claims", label: "Claims Assistance" },
          { key: "group", label: "RWA & Group Plans" },
          { key: "consents", label: "Privacy & Consents" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-4 px-2 whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.key
                ? "border-emerald-600 text-emerald-700 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <InsuranceOverviewTab
          policies={policies}
          loadingPolicies={policiesLoading}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onOpenAddPolicy={() => setShowAddPolicyModal(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "catalogue" && (
        <InsuranceCatalogueTab
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          items={sortedCatalogue}
          loading={catalogueLoading}
          error={catalogueError}
          sortKey={sortKey}
          onSortChange={(k) => setSortKey(k)}
          shortlist={shortlist}
          onToggleShortlist={toggleShortlist}
          onNavigateToCompare={() => setActiveTab("compare")}
        />
      )}

      {activeTab === "compare" && (
        <InsuranceCompareTab
          shortlist={shortlist}
          onRemoveItem={(item) => toggleShortlist(item)}
          onClearAll={() => setShortlist([])}
          onNavigateToCatalogue={() => setActiveTab("catalogue")}
        />
      )}

      {activeTab === "policies" && (
        <InsurancePoliciesTab
          policies={policies}
          loading={policiesLoading}
          onOpenAddModal={() => setShowAddPolicyModal(true)}
          onDeletePolicy={handleDeletePolicy}
          onOpenClaimModal={(policyId) => {
            setNewClaimPolicyId(policyId);
            setShowNewClaimModal(true);
          }}
        />
      )}

      {activeTab === "claims" && (
        <InsuranceClaimsTab
          claims={claims}
          loading={claimsLoading}
          onOpenNewClaimModal={() => {
            setNewClaimPolicyId(undefined);
            setShowNewClaimModal(true);
          }}
        />
      )}

      {activeTab === "group" && (
        <InsuranceGroupTab
          enquiries={groupEnquiries}
          loading={groupLoading}
          onOpenNewGroupModal={() => setShowNewGroupModal(true)}
        />
      )}

      {activeTab === "consents" && (
        <InsuranceConsentsTab
          consents={consents}
          loading={consentsLoading}
          onWithdrawConsent={handleWithdrawConsent}
        />
      )}

      {/* Modals */}
      <AddPolicyModal
        isOpen={showAddPolicyModal}
        onClose={() => setShowAddPolicyModal(false)}
        policy={newPolicy}
        onPolicyChange={setNewPolicy}
        onSubmit={handleAddPolicySubmit}
        errors={policyFormErrors}
        submitting={policySubmitting}
      />

      <ClaimModal
        isOpen={showNewClaimModal}
        onClose={() => setShowNewClaimModal(false)}
        policies={policies}
        policyId={newClaimPolicyId}
        onPolicyIdChange={setNewClaimPolicyId}
        claimType={newClaimType}
        onClaimTypeChange={setNewClaimType}
        claimDesc={newClaimDesc}
        onClaimDescChange={setNewClaimDesc}
        onSubmit={handleClaimSubmit}
        submitting={claimSubmitting}
      />

      <GroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        form={groupForm}
        onFormChange={setGroupForm}
        consentChecked={groupConsentChecked}
        onConsentChange={setGroupConsentChecked}
        onSubmit={handleGroupSubmit}
        submitting={groupSubmitting}
      />
    </div>
  );
};