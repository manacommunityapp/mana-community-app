import { useState, useEffect } from "react";
import {
  Gem, CheckCircle2, Plus, ExternalLink, Loader2, AlertCircle,
  FileText, Share2, Mail, Download, Copy, Check, X, Send,
  Building2, QrCode, CreditCard, Sparkles, HandHeart, ShieldCheck,
  Phone, User, Home, PlusCircle, Trash2, Settings2, Upload, PhoneCall,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventSponsorService, type EventSponsorResponse } from "../../../services/events/eventSponsorService";
import { eventProspectusService } from "../../../services/events/eventProspectusService";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";

/* ─── Interfaces ─── */
export interface SponsorPackageConfig {
  id: string;
  name: string;
  price: string;
  perks: string[];
  color: string;
  bg: string;
}

export interface DonationSchemeConfig {
  id: string;
  title: string;
  amount: string;
  desc: string;
}

export interface PaymentContactPerson {
  id: string;
  name: string;
  role: string;
  flatNo: string;
  phone: string;
}

export interface BankPaymentConfig {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  qrCodeUrl: string;
  paymentHelpline: string;
  taxBenefit: string;
  contacts: PaymentContactPerson[];
}

export const DEFAULT_PACKAGES: SponsorPackageConfig[] = [
  { id: "sp1", name: "Platinum",  price: "₹5,00,000", perks: ["Logo on main stage", "VIP 20 passes", "Full page ad", "Social media feature", "Brand in all materials"], color: "#6366f1", bg: "#eef2ff" },
  { id: "sp2", name: "Gold",      price: "₹2,00,000", perks: ["Logo on backdrop", "VIP 10 passes", "Half page ad", "Social media mention"], color: "#d97706", bg: "#fffbeb" },
  { id: "sp3", name: "Silver",    price: "₹75,000",   perks: ["Logo on flex banners", "5 VIP passes", "Quarter page ad"], color: "#64748b", bg: "#f8fafc" },
  { id: "sp4", name: "Bronze",    price: "₹25,000",   perks: ["Name in brochure", "2 passes", "Social mention"], color: "#4338ca", bg: "#eef2ff" },
];

export const DEFAULT_DONATION_SCHEMES: DonationSchemeConfig[] = [
  { id: "ds1", title: "Annadanam / Meal Sponsorship", amount: "₹5,000 / ₹25,000", desc: "Sponsor 100 to 500 meals for community feast" },
  { id: "ds2", title: "Grand Aarti & Puja Ritual", amount: "₹11,000", desc: "Main pooja seva & special family sankalpam" },
  { id: "ds3", title: "Cultural Program Sponsor", amount: "₹50,000", desc: "Sponsor dance performance or music concert stage" },
  { id: "ds4", title: "Trophy & Prize Distribution", amount: "₹15,000", desc: "Sponsor awards & trophies for competitions" },
];

export const DEFAULT_BANK_CONFIG: BankPaymentConfig = {
  accountName: "Mana Community Cultural & Event Trust",
  bankName: "State Bank of India (Main Branch)",
  accountNumber: "394820194820",
  ifscCode: "SBIN0004829",
  upiId: "manacommunity@sbi",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=manacommunity@sbi&pn=Mana%20Community%20Trust&cu=INR",
  paymentHelpline: "+91 98765 43210 / +91 98765 00000",
  taxBenefit: "Eligible for 80G Tax Exemption Certificate",
  contacts: [
    { id: "c1", name: "Ramesh Sharma", role: "Treasurer & Fundraising Lead", flatNo: "Flat B-402, Society Tower A", phone: "+91 98765 43210" },
    { id: "c2", name: "Priya Venkatesh", role: "Event Secretary", flatNo: "Flat C-105, Society Tower B", phone: "+91 98765 12345" },
  ],
};

const mockSponsors = [
  { name: "TechCorp India",    package: "Platinum", amount: "₹5,00,000", status: "Paid",    logo: "TC" },
  { name: "Sunrise Foods",     package: "Gold",     amount: "₹2,00,000", status: "Paid",    logo: "SF" },
  { name: "BlueStar Finance",  package: "Gold",     amount: "₹2,00,000", status: "Pending", logo: "BF" },
  { name: "GreenLeaf Exports", package: "Silver",   amount: "₹75,000",   status: "Paid",    logo: "GL" },
  { name: "Reliance Retail",   package: "Silver",   amount: "₹75,000",   status: "Paid",    logo: "RR" },
  { name: "PrimeHealth Clinic",package: "Silver",   amount: "₹75,000",   status: "Pending", logo: "PH" },
  { name: "Saraswati Textiles",package: "Bronze",   amount: "₹25,000",   status: "Paid",    logo: "ST" },
  { name: "Kiran AutoWorks",   package: "Bronze",   amount: "₹25,000",   status: "Paid",    logo: "KA" },
];

type SponsorRow = { name: string; package: string; amount: string; status: string; logo: string };

const statusStyle: Record<string, { bg: string; text: string }> = {
  Paid:      { bg: "bg-emerald-50", text: "text-emerald-700" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Pending:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  CANCELLED: { bg: "bg-rose-50",    text: "text-rose-700"    },
};

const pkgColor: Record<string, { bg: string; text: string }> = {
  Platinum: { bg: "bg-indigo-50", text: "text-indigo-700" },
  PLATINUM: { bg: "bg-indigo-50", text: "text-indigo-700" },
  Gold:     { bg: "bg-amber-50",  text: "text-amber-700"  },
  GOLD:     { bg: "bg-amber-50",  text: "text-amber-700"  },
  Silver:   { bg: "bg-slate-100", text: "text-slate-600"  },
  SILVER:   { bg: "bg-slate-100", text: "text-slate-600"  },
  Bronze:   { bg: "bg-indigo-50", text: "text-indigo-700" },
  BRONZE:   { bg: "bg-indigo-50", text: "text-indigo-700" },
};

function formatAmount(n: number | null): string {
  if (!n) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function mapLiveSponsors(data: EventSponsorResponse[]): SponsorRow[] {
  return data.map(s => ({
    name: s.name,
    package: s.tier,
    amount: formatAmount(s.amountPledged),
    status: s.amountReceived && s.amountReceived >= (s.amountPledged ?? 0) ? "Paid" : "Pending",
    logo: s.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
  }));
}

/* ─── Dynamic Prospectus Configuration Modal ─── */
export function ConfigureProspectusModal({
  isOpen,
  onClose,
  packages,
  setPackages,
  donationSchemes,
  setDonationSchemes,
  bankConfig,
  setBankConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  packages: SponsorPackageConfig[];
  setPackages: React.Dispatch<React.SetStateAction<SponsorPackageConfig[]>>;
  donationSchemes: DonationSchemeConfig[];
  setDonationSchemes: React.Dispatch<React.SetStateAction<DonationSchemeConfig[]>>;
  bankConfig: BankPaymentConfig;
  setBankConfig: React.Dispatch<React.SetStateAction<BankPaymentConfig>>;
}) {
  const [tab, setTab] = useState<"tiers" | "schemes" | "bank" | "contacts">("tiers");

  if (!isOpen) return null;

  /* Helper functions for Tiers */
  const addTier = () => {
    setPackages(prev => [
      ...prev,
      { id: `sp_${Date.now()}`, name: "New Tier", price: "₹50,000", perks: ["Stage Banner", "2 VIP Passes"], color: "#6366f1", bg: "#eef2ff" },
    ]);
  };

  const updateTier = (id: string, field: keyof SponsorPackageConfig, val: any) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const removeTier = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  /* Helper functions for Donation Schemes */
  const addScheme = () => {
    setDonationSchemes(prev => [
      ...prev,
      { id: `ds_${Date.now()}`, title: "New Seva / Donation Scheme", amount: "₹10,000", desc: "Sponsorship details" },
    ]);
  };

  const updateScheme = (id: string, field: keyof DonationSchemeConfig, val: string) => {
    setDonationSchemes(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const removeScheme = (id: string) => {
    setDonationSchemes(prev => prev.filter(s => s.id !== id));
  };

  /* Helper functions for Contacts */
  const addContact = () => {
    setBankConfig(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { id: `c_${Date.now()}`, name: "", role: "Event Committee Member", flatNo: "", phone: "" },
      ],
    }));
  };

  const updateContact = (id: string, field: keyof PaymentContactPerson, val: string) => {
    setBankConfig(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === id ? { ...c, [field]: val } : c),
    }));
  };

  const removeContact = (id: string) => {
    setBankConfig(prev => ({
      ...prev,
      contacts: prev.contacts.filter(c => c.id !== id),
    }));
  };

  const handleSave = () => {
    eventProspectusService.saveProspectus({
      bankName: bankConfig.bankName,
      accountName: bankConfig.accountName,
      accountNumber: bankConfig.accountNumber,
      ifscCode: bankConfig.ifscCode,
      upiId: bankConfig.upiId,
      qrCodeUrl: bankConfig.qrCodeUrl,
      helplines: bankConfig.helplines,
      contacts: bankConfig.contacts,
      packages: packages.map(p => ({
        id: p.id,
        title: p.name,
        amount: p.price,
        badge: p.badge || "Standard",
        features: p.perks,
        color: p.color,
        totalSlots: p.slots || "0",
        claimedSlots: p.claimed || "0",
      })),
      donations: donationSchemes.map(d => ({
        id: d.id,
        title: d.title,
        amount: d.amount,
        desc: d.desc,
        badge: d.badge || "80G Exempt",
        category: d.category || "General",
      })),
    }).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in-up border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Dynamic Prospectus Form Builder</h3>
              <p className="text-xs text-slate-400">Add/edit sponsorship tiers, donation schemes, bank details & contact persons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button onClick={() => setTab("tiers")} className={cn("flex-1 py-2 rounded-lg transition-all", tab === "tiers" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-800")}>
            Sponsorship Tiers ({packages.length})
          </button>
          <button onClick={() => setTab("schemes")} className={cn("flex-1 py-2 rounded-lg transition-all", tab === "schemes" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-800")}>
            Donation Schemes ({donationSchemes.length})
          </button>
          <button onClick={() => setTab("bank")} className={cn("flex-1 py-2 rounded-lg transition-all", tab === "bank" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-800")}>
            Bank & QR Details
          </button>
          <button onClick={() => setTab("contacts")} className={cn("flex-1 py-2 rounded-lg transition-all", tab === "contacts" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-800")}>
            Contact Persons ({bankConfig.contacts.length})
          </button>
        </div>

        {/* Dynamic Tiers Editor Tab */}
        {tab === "tiers" && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Corporate Sponsorship Tiers</span>
              <Button size="sm" variant="outline" onClick={addPackage} className="text-xs font-bold gap-1 border-indigo-200 text-indigo-600 bg-indigo-50">
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </Button>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-indigo-600 text-white text-[10px]">{pkg.badge || "Tier"}</Badge>
                    {packages.length > 1 && (
                      <button onClick={() => removePackage(pkg.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Tier Title</Label>
                      <Input value={pkg.name} onChange={e => updatePackage(pkg.id, "name", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input value={pkg.price} onChange={e => updatePackage(pkg.id, "price", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Total Slots</Label>
                      <Input value={pkg.slots || ""} onChange={e => updatePackage(pkg.id, "slots", Number(e.target.value))} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Perks & Benefits (Comma separated)</Label>
                    <Input value={pkg.perks.join(", ")} onChange={e => updatePackagePerks(pkg.id, e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Donation Schemes Editor Tab */}
        {tab === "schemes" && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Direct Donation & Seva Schemes</span>
              <Button size="sm" variant="outline" onClick={addDonationScheme} className="text-xs font-bold gap-1 border-indigo-200 text-indigo-600 bg-indigo-50">
                <Plus className="w-3.5 h-3.5" /> Add Seva Scheme
              </Button>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {donationSchemes.map((ds) => (
                <div key={ds.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-600 text-white text-[10px]">{ds.category || "Seva"}</Badge>
                    {donationSchemes.length > 1 && (
                      <button onClick={() => removeDonationScheme(ds.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Scheme Title</Label>
                      <Input value={ds.title} onChange={e => updateDonationScheme(ds.id, "title", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Suggested Amount</Label>
                      <Input value={ds.amount} onChange={e => updateDonationScheme(ds.id, "amount", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Badge Tag</Label>
                      <Input value={ds.badge || ""} onChange={e => updateDonationScheme(ds.id, "badge", e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input value={ds.desc} onChange={e => updateDonationScheme(ds.id, "desc", e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank & Online Payment Details Tab */}
        {tab === "bank" && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Bank Name</Label>
                <Input value={bankConfig.bankName} onChange={e => setBankConfig(prev => ({ ...prev, bankName: e.target.value }))} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Account Name</Label>
                <Input value={bankConfig.accountName} onChange={e => setBankConfig(prev => ({ ...prev, accountName: e.target.value }))} className="h-9 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Account Number</Label>
                <Input value={bankConfig.accountNumber} onChange={e => setBankConfig(prev => ({ ...prev, accountNumber: e.target.value }))} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">IFSC Code</Label>
                <Input value={bankConfig.ifscCode} onChange={e => setBankConfig(prev => ({ ...prev, ifscCode: e.target.value }))} className="h-9 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">UPI VPA ID</Label>
                <Input value={bankConfig.upiId} onChange={e => setBankConfig(prev => ({ ...prev, upiId: e.target.value }))} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">QR Code Scanner Image URL</Label>
                <Input value={bankConfig.qrCodeUrl} onChange={e => setBankConfig(prev => ({ ...prev, qrCodeUrl: e.target.value }))} className="h-9 text-xs" placeholder="https://..." />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Payment Contact Persons Tab */}
        {tab === "contacts" && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Payment Helplines & Contact Persons</span>
              <Button size="sm" variant="outline" onClick={addContact} className="text-xs font-bold gap-1 border-indigo-200 text-indigo-600 bg-indigo-50">
                <Plus className="w-3.5 h-3.5" /> Add Contact Person
              </Button>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {bankConfig.contacts.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 text-xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {c.name || "Contact Person"}
                    </span>
                    {bankConfig.contacts.length > 1 && (
                      <button onClick={() => removeContact(c.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Full Name</Label>
                      <Input value={c.name} onChange={e => updateContact(c.id, "name", e.target.value)} placeholder="e.g. Ramesh Sharma" className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Input value={c.role} onChange={e => updateContact(c.id, "role", e.target.value)} placeholder="e.g. Treasurer" className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Address / Flat No</Label>
                      <Input value={c.flatNo} onChange={e => updateContact(c.id, "flatNo", e.target.value)} placeholder="e.g. Flat B-402" className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={c.phone} onChange={e => updateContact(c.id, "phone", e.target.value)} placeholder="e.g. +91 98765 43210" className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button size="sm" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Done & Save Prospectus
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sponsorship Prospectus Modal ─── */
export function SponsorshipProspectusModal({
  isOpen,
  onClose,
  onOpenEmailModal,
  packages = DEFAULT_PACKAGES,
  donationSchemes = DEFAULT_DONATION_SCHEMES,
  bankConfig = DEFAULT_BANK_CONFIG,
  onOpenConfigModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmailModal: () => void;
  packages?: SponsorPackageConfig[];
  donationSchemes?: DonationSchemeConfig[];
  bankConfig?: BankPaymentConfig;
  onOpenConfigModal?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 animate-fade-in-up border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Sponsorship & Donation Prospectus</h3>
              <p className="text-xs text-slate-400">Official campaign packages, donation schemes & payment contact information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenConfigModal && (
              <button
                onClick={onOpenConfigModal}
                className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5" /> Edit Fields
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prospectus Content */}
        <div className="space-y-6 text-xs text-slate-700">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-white/20 text-white border-none">Official Prospectus 2026</Badge>
              <span className="text-[11px] opacity-80">Mana Community Foundation</span>
            </div>
            <h2 className="text-lg font-black text-white">Ganesh Utsav & Cultural Mahotsav 2026</h2>
            <p className="text-xs opacity-90">Join us as a sponsor or donor to empower our community festival, cultural stage events, and grand prasadam feasts.</p>
          </div>

          {/* Corporate Sponsorship Tiers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
              <Gem className="w-4 h-4 text-indigo-500" /> Corporate Sponsorship Tiers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map(pkg => (
                <div key={pkg.name} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{pkg.name} Sponsor</span>
                    <span className="font-black text-indigo-600 text-sm">{pkg.price}</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {pkg.perks.map(p => (
                      <li key={p} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Category-Wise Donation Schemes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
              <HandHeart className="w-4 h-4 text-emerald-500" /> Direct Donation & Seva Schemes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donationSchemes.map(d => (
                <div key={d.title} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{d.title}</span>
                    <span className="text-emerald-700">{d.amount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Bank Details + QR Code Scanner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Bank Account & Online Payment Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Account Name:</span>
                  <span className="font-semibold text-slate-800">{bankConfig.accountName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Bank Name:</span>
                  <span className="font-semibold text-slate-800">{bankConfig.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Number:</span>
                  <span className="font-semibold text-slate-800">{bankConfig.accountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">IFSC Code:</span>
                  <span className="font-semibold text-slate-800">{bankConfig.ifscCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">UPI ID for Online Payments:</span>
                  <span className="font-semibold text-indigo-600">{bankConfig.upiId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Helpline:</span>
                  <span className="font-semibold text-slate-800">{bankConfig.paymentHelpline}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Tax Exemption:</span>
                  <span className="font-semibold text-emerald-600">{bankConfig.taxBenefit}</span>
                </div>
              </div>

              {/* QR Code Scanner Display */}
              {bankConfig.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="w-28 h-28 bg-white p-1.5 rounded-lg shadow-2xs border border-slate-200 mb-1">
                    <img src={bankConfig.qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-indigo-600" /> Scan & Pay via UPI
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Person Details */}
          {bankConfig.contacts && bankConfig.contacts.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-600" /> Payment & Pledge Contact Persons
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bankConfig.contacts.map(c => (
                  <div key={c.id || c.name} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" /> {c.name}
                      </span>
                      <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{c.role}</span>
                    </div>
                    {c.flatNo && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Home className="w-3 h-3 text-slate-400" /> {c.flatNo}
                      </p>
                    )}
                    {c.phone && (
                      <p className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 pt-0.5">
                        <Phone className="w-3 h-3 text-indigo-500" /> {c.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prospectus Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5 text-xs font-bold">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Share Link"}
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs font-bold">
              <Download className="w-3.5 h-3.5" /> Print / Save PDF
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => { onClose(); onOpenEmailModal(); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold"
          >
            <Mail className="w-3.5 h-3.5" /> Send Prospectus via Email
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sponsorship Appeal Email Modal ─── */
export function SponsorshipAppealEmailModal({
  isOpen,
  onClose,
  packages = DEFAULT_PACKAGES,
  donationSchemes = DEFAULT_DONATION_SCHEMES,
  bankConfig = DEFAULT_BANK_CONFIG,
}: {
  isOpen: boolean;
  onClose: () => void;
  packages?: SponsorPackageConfig[];
  donationSchemes?: DonationSchemeConfig[];
  bankConfig?: BankPaymentConfig;
}) {
  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState("Sponsorship & Donation Appeal — Ganesh Utsav & Cultural Mahotsav 2026");
  const [message, setMessage] = useState(
    `Dear Member / Partner,\n\nWe cordially invite you to become an official Sponsor or Donor for our upcoming Ganesh Utsav & Cultural Mahotsav 2026.\n\nSponsorship Packages Available:\n${packages.map(p => `- ${p.name} Sponsor: ${p.price} (${p.perks.join(", ")})`).join("\n")}\n\nDonation Schemes:\n${donationSchemes.map(d => `- ${d.title}: ${d.amount}`).join("\n")}\n\nBank Account Details:\nAccount Name: ${bankConfig.accountName}\nBank: ${bankConfig.bankName}\nAccount No: ${bankConfig.accountNumber} | IFSC: ${bankConfig.ifscCode}\nUPI ID: ${bankConfig.upiId}\n\nPayment Contact Persons:\n${bankConfig.contacts.map(c => `- ${c.name} (${c.role}): ${c.flatNo} — Ph: ${c.phone}`).join("\n")}\n\nThank you for your generous support!\n\nBest regards,\nMana Community Event Committee`
  );
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1600);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in-up border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Send Sponsorship & Donation Appeal</h3>
              <p className="text-xs text-slate-400">Broadcast sponsorship prospectus & donation details via email</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Appeal Email Sent!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The sponsorship prospectus & donation appeal email has been sent successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Notification Channels - EMAIL AUTO SELECTED */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1.5">Notification Channels</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/70 flex items-center gap-2 font-bold text-indigo-700">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Email</span>
                  <Badge className="ml-auto text-[8px] bg-indigo-600 text-white px-1 py-0">Auto</Badge>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <span>SMS</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <span>Push</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <span>WhatsApp</span>
                </div>
              </div>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">
                ✓ Email channel is auto-selected by default for sponsorship & donation appeals.
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</Label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">All Community Members & Mailing Lists</option>
                <option value="corporate">Corporate Partners & Businesses</option>
                <option value="past">Past Donors & Sponsors</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Email Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Message Body */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Message Preview</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="text-xs min-h-[110px]"
                rows={5}
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending Email..." : "Send Sponsorship Email"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EventsSponsors() {
  const { useMock } = useEventMock();
  const [liveSponsors, setLiveSponsors] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dynamic Prospectus Configuration state
  const [customPackages, setCustomPackages] = useState<SponsorPackageConfig[]>(DEFAULT_PACKAGES);
  const [customDonationSchemes, setCustomDonationSchemes] = useState<DonationSchemeConfig[]>(DEFAULT_DONATION_SCHEMES);
  const [bankConfig, setBankConfig] = useState<BankPaymentConfig>(DEFAULT_BANK_CONFIG);

  // Modal states
  const [prospectusOpen, setProspectusOpen] = useState(false);
  const [emailAppealOpen, setEmailAppealOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    eventProspectusService.getProspectus()
      .then(data => {
        if (data.packages && data.packages.length > 0) {
          setCustomPackages(data.packages.map(p => ({
            id: p.id,
            name: p.title,
            price: p.amount,
            perks: p.features || [],
            color: p.color || "from-indigo-600 to-violet-600",
            slots: p.totalSlots || "5",
            claimed: p.claimedSlots || "0",
            badge: p.badge || "Standard",
          })));
        }
        if (data.donations && data.donations.length > 0) {
          setCustomDonationSchemes(data.donations.map(d => ({
            id: d.id,
            title: d.title,
            amount: d.amount,
            desc: d.desc,
            badge: d.badge || "80G Tax Exempt",
            category: d.category || "General",
          })));
        }
        if (data.bankName || data.upiId) {
          setBankConfig({
            bankName: data.bankName || "State Bank of India",
            accountName: data.accountName || "Mana Community Cultural Trust",
            accountNumber: data.accountNumber || "394820194829",
            ifscCode: data.ifscCode || "SBIN0004829",
            upiId: data.upiId || "manacommunity@sbi",
            qrCodeUrl: data.qrCodeUrl || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
            helplines: data.helplines || ["+91 98765 43210"],
            contacts: data.contacts || [],
          });
        }
      })
      .catch(() => {});

    if (useMock) return;
    setLoading(true);
    setError("");
    eventSponsorService.getAll()
      .then(data => setLiveSponsors(mapLiveSponsors(data)))
      .catch(e => setError(e.message ?? "Failed to load sponsors"))
      .finally(() => setLoading(false));
  }, [useMock]);

  const sponsors = useMock ? mockSponsors : liveSponsors;

  const totalCollected = useMock ? 1240000 : liveSponsors.filter(s => s.status === "Paid").reduce((a, s) => a + parseInt(s.amount.replace(/[^\d]/g, "") || "0"), 0);
  const totalTarget = useMock ? 1500000 : Math.max(totalCollected, 1);
  const pct = Math.round(totalCollected / totalTarget * 100);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Gem className="w-5 h-5 text-indigo-600" /> Event Sponsorships & Corporate Partners
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage sponsorship packages, generate proposals, and broadcast donation appeals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setProspectusOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold rounded-xl"
          >
            <FileText className="w-3.5 h-3.5" /> View Prospectus List
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfigOpen(true)}
            className="border-indigo-200 bg-white hover:bg-slate-50 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" /> Configure Prospectus Form
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEmailAppealOpen(true)}
            className="border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send Appeal Email
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading sponsors...
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Sponsors",  value: sponsors.length,                                                   color: "#6366f1" },
          { label: "Amount Collected",value: useMock ? "₹12.4L" : formatAmount(totalCollected),                 color: "#10b981" },
          { label: "Pending",         value: useMock ? "₹2.75L" : `${sponsors.filter(s => s.status === "Pending").length}`,  color: "#f59e0b" },
          { label: "Target Met",      value: `${pct}%`,                                                        color: "#4f46e5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Collection progress */}
      <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Sponsorship Collection</h2>
          <span className="text-xs sm:text-sm font-black text-indigo-600 flex-shrink-0">{formatAmount(totalCollected)} / {formatAmount(totalTarget)}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="animate-fade-in-up h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          {customPackages.map((pkg) => (
            <div key={pkg.id || pkg.name} className="text-center p-2 sm:p-3 rounded-xl" style={{ background: pkg.bg }}>
              <p className="font-black text-sm sm:text-lg" style={{ color: pkg.color }}>{pkg.price}</p>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: pkg.color }}>{pkg.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {customPackages.map((pkg) => (
          <div key={pkg.id || pkg.name}
            className="animate-fade-in-up bg-white rounded-2xl p-3 sm:p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow"
            style={{ borderColor: `${pkg.color}25` }}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: pkg.bg }}>
              <Gem className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: pkg.color }} />
            </div>
            <p className="font-black text-slate-900 text-sm sm:text-lg">{pkg.name}</p>
            <p className="font-bold mt-0.5" style={{ color: pkg.color }}>{pkg.price}</p>
            <ul className="mt-2.5 sm:mt-4 space-y-1.5">
              {pkg.perks.map(perk => (
                <li key={perk} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: pkg.color }} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sponsors table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Sponsors List</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProspectusOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all shadow-2xs"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> View Prospectus
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {sponsors.map((s) => {
            const ss = statusStyle[s.status] ?? statusStyle.Pending;
            const pc = pkgColor[s.package] ?? pkgColor.Bronze;
            return (
              <div key={s.name}
                className="animate-fade-in-up flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-black flex-shrink-0 shadow-sm">
                  {s.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{s.name}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${pc.bg} ${pc.text}`}>{s.package}</span>
                </div>
                <p className="font-black text-slate-800 text-xs sm:text-sm tabular-nums">{s.amount}</p>
                <span className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${ss.bg} ${ss.text}`}>{s.status}</span>
                <button className="text-slate-400 hover:text-indigo-500 transition-colors hidden sm:block">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prospectus Modal */}
      <SponsorshipProspectusModal
        isOpen={prospectusOpen}
        onClose={() => setProspectusOpen(false)}
        onOpenEmailModal={() => setEmailAppealOpen(true)}
        packages={customPackages}
        donationSchemes={customDonationSchemes}
        bankConfig={bankConfig}
        onOpenConfigModal={() => setConfigOpen(true)}
      />

      {/* Email Appeal Modal */}
      <SponsorshipAppealEmailModal
        isOpen={emailAppealOpen}
        onClose={() => setEmailAppealOpen(false)}
        packages={customPackages}
        donationSchemes={customDonationSchemes}
        bankConfig={bankConfig}
      />

      {/* Configure Prospectus Form Builder Modal */}
      <ConfigureProspectusModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        packages={customPackages}
        setPackages={setCustomPackages}
        donationSchemes={customDonationSchemes}
        setDonationSchemes={setCustomDonationSchemes}
        bankConfig={bankConfig}
        setBankConfig={setBankConfig}
      />
    </div>
  );
}
