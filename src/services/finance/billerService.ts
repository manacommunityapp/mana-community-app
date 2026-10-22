// billerService.ts — BBPS (Bharat Bill Payment System) service for web app
// Hybrid fallback: tries backend first, falls back to in-memory mock data.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export type BillerCategory =
  | "ELECTRICITY" | "GAS" | "WATER" | "BROADBAND" | "DTH"
  | "FASTAG" | "MUNICIPAL_TAX" | "CREDIT_CARD"
  | "EDUCATION" | "LPG" | "LANDLINE";

export interface Biller {
  id: string;
  name: string;
  shortName: string;
  category: BillerCategory;
  icon: string;
  state: string;
  consumerIdLabel: string;
  consumerIdHint: string;
  consumerIdLength?: number;
}

export interface FetchedBill {
  billerId: string;
  billerName: string;
  consumerId: string;
  customerName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  amount: number;
  overdueAmount?: number;
  units?: number;
  periodFrom: string;
  periodTo: string;
  status: "DUE" | "OVERDUE" | "PAID";
}

export interface BillPayResult {
  upiIntentUrl: string;
  phonePeUrl: string;
  transactionRef: string;
  amount: number;
}

// ── Static fallback catalogue ────────────────────────────────────────────────

const ELECTRICITY_BILLERS: Biller[] = [
  { id: "BESCOM",           name: "BESCOM – Bangalore Electricity Supply Company", shortName: "BESCOM",       category: "ELECTRICITY", icon: "⚡", state: "Karnataka",   consumerIdLabel: "RR Number (Consumer Account No.)", consumerIdHint: "e.g. 9123456789",    consumerIdLength: 10 },
  { id: "TSSPDCL",          name: "TSSPDCL – Telangana Southern Power Distribution", shortName: "TSSPDCL",   category: "ELECTRICITY", icon: "⚡", state: "Telangana",   consumerIdLabel: "Service Number (CA Number)",       consumerIdHint: "e.g. 0012345678",    consumerIdLength: 10 },
  { id: "TATA_POWER_MUMBAI",name: "Tata Power – Mumbai Distribution",               shortName: "Tata Power", category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Number",                 consumerIdHint: "e.g. 4001234567",    consumerIdLength: 10 },
  { id: "ADANI_ELECTRICITY",name: "Adani Electricity – Mumbai",                     shortName: "Adani",      category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Account Number",         consumerIdHint: "e.g. 100023456" },
  { id: "MSEDCL",           name: "MSEDCL – Maharashtra State Electricity",         shortName: "MSEDCL",     category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Number",                 consumerIdHint: "e.g. 020012345678" },
  { id: "TNEB",             name: "TNEB – Tamil Nadu Electricity Board",            shortName: "TNEB",       category: "ELECTRICITY", icon: "⚡", state: "Tamil Nadu",  consumerIdLabel: "Consumer Number (EB No.)",        consumerIdHint: "e.g. 001234567890" },
  { id: "BSES_RAJDHANI",    name: "BSES Rajdhani – South & West Delhi",             shortName: "BSES Rajdhani", category: "ELECTRICITY", icon: "⚡", state: "Delhi",   consumerIdLabel: "Consumer Account Number (CA)",    consumerIdHint: "e.g. 50012345678" },
  { id: "BSES_YAMUNA",      name: "BSES Yamuna – East & Central Delhi",             shortName: "BSES Yamuna",  category: "ELECTRICITY", icon: "⚡", state: "Delhi",   consumerIdLabel: "Consumer Account Number (CA)",    consumerIdHint: "e.g. 30012345678" },
];

const GAS_BILLERS: Biller[] = [
  { id: "MGL", name: "MGL – Mahanagar Gas Limited",    shortName: "MGL", category: "GAS", icon: "🔥", state: "Maharashtra", consumerIdLabel: "Business Partner (BP) Number", consumerIdHint: "e.g. 200012345" },
  { id: "IGL", name: "IGL – Indraprastha Gas Limited", shortName: "IGL", category: "GAS", icon: "🔥", state: "Delhi",       consumerIdLabel: "BP Number",                    consumerIdHint: "e.g. 100009876" },
];

const WATER_BILLERS: Biller[] = [
  { id: "BWSSB",      name: "BWSSB – Bangalore Water Supply",  shortName: "BWSSB",   category: "WATER", icon: "💧", state: "Karnataka",   consumerIdLabel: "Consumer ID",            consumerIdHint: "e.g. 1234567890",  consumerIdLength: 10 },
  { id: "MCGM_WATER", name: "MCGM – Mumbai Water Supply",      shortName: "MCGM",    category: "WATER", icon: "💧", state: "Maharashtra", consumerIdLabel: "Consumer Number",        consumerIdHint: "e.g. 010123456789" },
  { id: "HMWSSB",     name: "HMWSSB – Hyderabad Metro Water",  shortName: "HMWSSB",  category: "WATER", icon: "💧", state: "Telangana",   consumerIdLabel: "Service Connection No.", consumerIdHint: "e.g. HYD2012345" },
  { id: "DJB",        name: "DJB – Delhi Jal Board",           shortName: "DJB",     category: "WATER", icon: "💧", state: "Delhi",       consumerIdLabel: "K Number",               consumerIdHint: "e.g. K-1234567" },
  { id: "CMWSSB",     name: "CMWSSB – Chennai Metro Water",    shortName: "CMWSSB",  category: "WATER", icon: "💧", state: "Tamil Nadu",  consumerIdLabel: "Consumer ID",            consumerIdHint: "e.g. 12345678" },
];

const BROADBAND_BILLERS: Biller[] = [
  { id: "JIO_FIBER",        name: "Jio Fiber – Reliance Jio",   shortName: "Jio Fiber", category: "BROADBAND", icon: "📡", state: "All India", consumerIdLabel: "Account Number / Mobile",     consumerIdHint: "e.g. 10-digit Jio number" },
  { id: "AIRTEL_BROADBAND", name: "Airtel Xstream Fiber",       shortName: "Airtel",    category: "BROADBAND", icon: "📡", state: "All India", consumerIdLabel: "Airtel Account Number",        consumerIdHint: "e.g. 123456789012" },
  { id: "ACT_BROADBAND",    name: "ACT Fibernet",               shortName: "ACT",       category: "BROADBAND", icon: "📡", state: "Multi",     consumerIdLabel: "Subscriber ID",               consumerIdHint: "e.g. ACT12345678" },
  { id: "BSNL_BROADBAND",   name: "BSNL Bharat Fiber / FTTH",  shortName: "BSNL",      category: "BROADBAND", icon: "📡", state: "All India", consumerIdLabel: "CA Number / Landline Number", consumerIdHint: "e.g. 01112345678" },
];

const DTH_BILLERS: Biller[] = [
  { id: "TATA_PLAY",  name: "Tata Play (formerly Tata Sky)", shortName: "Tata Play",  category: "DTH", icon: "📺", state: "All India", consumerIdLabel: "Subscriber ID (RM ID)", consumerIdHint: "e.g. 1234567890",    consumerIdLength: 10 },
  { id: "DISH_TV",    name: "Dish TV",                       shortName: "Dish TV",    category: "DTH", icon: "📺", state: "All India", consumerIdLabel: "VC Number",             consumerIdHint: "e.g. 01234567890",   consumerIdLength: 11 },
  { id: "AIRTEL_DTH", name: "Airtel Digital TV",             shortName: "Airtel DTH", category: "DTH", icon: "📺", state: "All India", consumerIdLabel: "Customer ID",           consumerIdHint: "e.g. 3012345678",    consumerIdLength: 10 },
  { id: "SUN_DIRECT", name: "Sun Direct DTH",                shortName: "Sun Direct", category: "DTH", icon: "📺", state: "South",     consumerIdLabel: "Smart Card Number",     consumerIdHint: "e.g. 1234567890123", consumerIdLength: 13 },
  { id: "D2H",        name: "D2H (Videocon D2H)",            shortName: "D2H",        category: "DTH", icon: "📺", state: "All India", consumerIdLabel: "Customer ID",           consumerIdHint: "e.g. 123456789" },
];

const FASTAG_BILLERS: Biller[] = [
  { id: "NHAI_ONE",     name: "NHAI – National Highways Authority (One FASTag)", shortName: "NHAI",         category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. KA01AB1234" },
  { id: "HDFC_FASTAG",  name: "HDFC Bank FASTag",                                shortName: "HDFC FASTag",  category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. MH02CD5678" },
  { id: "SBI_FASTAG",   name: "SBI FASTag – State Bank of India",                shortName: "SBI FASTag",   category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. DL03EF9012" },
  { id: "ICICI_FASTAG", name: "ICICI Bank FASTag",                               shortName: "ICICI FASTag", category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. TN04GH3456" },
  { id: "PAYTM_FASTAG", name: "Paytm Payments Bank FASTag",                      shortName: "Paytm FASTag", category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. KA05IJ7890" },
  { id: "AXIS_FASTAG",  name: "Axis Bank FASTag",                                shortName: "Axis FASTag",  category: "FASTAG", icon: "🚗", state: "All India", consumerIdLabel: "Vehicle Registration Number", consumerIdHint: "e.g. GJ06KL2345" },
];

const MUNICIPAL_TAX_BILLERS: Biller[] = [
  { id: "GHMC",       name: "GHMC – Greater Hyderabad Municipal Corporation", shortName: "GHMC",       category: "MUNICIPAL_TAX", icon: "🏛️", state: "Telangana",   consumerIdLabel: "PTIN (Property Tax ID No.)",  consumerIdHint: "e.g. 123456789" },
  { id: "BBMP",       name: "BBMP – Bruhat Bengaluru Mahanagara Palike",      shortName: "BBMP",       category: "MUNICIPAL_TAX", icon: "🏛️", state: "Karnataka",   consumerIdLabel: "PID Number / Application ID", consumerIdHint: "e.g. 1234567890" },
  { id: "BMC",        name: "BMC – Brihanmumbai Municipal Corporation",        shortName: "BMC",        category: "MUNICIPAL_TAX", icon: "🏛️", state: "Maharashtra", consumerIdLabel: "Property Account Number",    consumerIdHint: "e.g. 0123456789" },
  { id: "MCD",        name: "MCD – Municipal Corporation of Delhi",            shortName: "MCD",        category: "MUNICIPAL_TAX", icon: "🏛️", state: "Delhi",       consumerIdLabel: "Property ID / UPIC No.",     consumerIdHint: "e.g. D0123456" },
  { id: "PCMC",       name: "PCMC – Pimpri-Chinchwad Municipal Corporation",   shortName: "PCMC",       category: "MUNICIPAL_TAX", icon: "🏛️", state: "Maharashtra", consumerIdLabel: "Property Number",            consumerIdHint: "e.g. PCM/1234/567" },
  { id: "NMMC",       name: "NMMC – Navi Mumbai Municipal Corporation",        shortName: "NMMC",       category: "MUNICIPAL_TAX", icon: "🏛️", state: "Maharashtra", consumerIdLabel: "Assessment Number",          consumerIdHint: "e.g. 12345678" },
  { id: "CMC_CHENNAI",name: "Greater Chennai Corporation",                      shortName: "Chennai Corp",category: "MUNICIPAL_TAX", icon: "🏛️", state: "Tamil Nadu", consumerIdLabel: "Zone-Division-Bill No.",    consumerIdHint: "e.g. 1-2-12345678" },
];

const CREDIT_CARD_BILLERS: Biller[] = [
  { id: "HDFC_CC",    name: "HDFC Bank Credit Card",          shortName: "HDFC",      category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 4111 1111 1111 1111", consumerIdLength: 16 },
  { id: "SBI_CC",     name: "SBI Card – State Bank Credit",   shortName: "SBI Card",  category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 5425 2334 3010 9903", consumerIdLength: 16 },
  { id: "ICICI_CC",   name: "ICICI Bank Credit Card",         shortName: "ICICI",     category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 4000 0566 5566 5556", consumerIdLength: 16 },
  { id: "AXIS_CC",    name: "Axis Bank Credit Card",          shortName: "Axis",      category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 5425 2334 3010 9903", consumerIdLength: 16 },
  { id: "KOTAK_CC",   name: "Kotak Mahindra Bank Credit Card",shortName: "Kotak",     category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 4111 1111 1111 1111", consumerIdLength: 16 },
  { id: "AMEX_CC",    name: "American Express India",          shortName: "Amex",      category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Card Number (15 digits)",        consumerIdHint: "e.g. 3714 496353 98431",   consumerIdLength: 15 },
  { id: "INDUSIND_CC",name: "IndusInd Bank Credit Card",       shortName: "IndusInd",  category: "CREDIT_CARD", icon: "💳", state: "All India", consumerIdLabel: "Credit Card Number (16 digits)", consumerIdHint: "e.g. 4111 1111 1111 1111", consumerIdLength: 16 },
];

const EDUCATION_BILLERS: Biller[] = [
  { id: "CBSE",          name: "CBSE – Central Board of Secondary Education", shortName: "CBSE",       category: "EDUCATION", icon: "🎓", state: "All India", consumerIdLabel: "Application / Roll Number", consumerIdHint: "e.g. 3012345678" },
  { id: "DU",            name: "Delhi University Fee Portal",                 shortName: "DU",         category: "EDUCATION", icon: "🎓", state: "Delhi",     consumerIdLabel: "Enrollment Number",        consumerIdHint: "e.g. DU2024001234" },
  { id: "BITS",          name: "BITS Pilani – Fee Payment",                   shortName: "BITS Pilani",category: "EDUCATION", icon: "🎓", state: "Rajasthan", consumerIdLabel: "Student ID (BITS ID)",     consumerIdHint: "e.g. 2024A7PS1234G" },
  { id: "AMITY",         name: "Amity University Fee Portal",                 shortName: "Amity",      category: "EDUCATION", icon: "🎓", state: "Multi",     consumerIdLabel: "Enrollment Number",        consumerIdHint: "e.g. A2024123456" },
  { id: "VTU",           name: "VTU – Visvesvaraya Technological University", shortName: "VTU",        category: "EDUCATION", icon: "🎓", state: "Karnataka", consumerIdLabel: "USN (University Seat No.)",consumerIdHint: "e.g. 1RV21CS001" },
  { id: "SCHOOL_GENERIC",name: "School Fee Payment (Generic)",                shortName: "School Fee", category: "EDUCATION", icon: "🎓", state: "All India", consumerIdLabel: "Admission / Roll Number",  consumerIdHint: "e.g. 2024-12345" },
];

const LPG_BILLERS: Biller[] = [
  { id: "HP_GAS",     name: "HP Gas – Hindustan Petroleum LPG", shortName: "HP Gas",    category: "LPG", icon: "🟢", state: "All India", consumerIdLabel: "LPG Consumer ID", consumerIdHint: "e.g. HP123456789" },
  { id: "BHARAT_GAS", name: "Bharat Gas – BPCL LPG",           shortName: "Bharat Gas",category: "LPG", icon: "🔵", state: "All India", consumerIdLabel: "LPG Consumer ID", consumerIdHint: "e.g. BG987654321" },
  { id: "INDANE_GAS", name: "Indane Gas – IOCL LPG",           shortName: "Indane Gas",category: "LPG", icon: "🔴", state: "All India", consumerIdLabel: "LPG Consumer ID", consumerIdHint: "e.g. IG456789012" },
];

const LANDLINE_BILLERS: Biller[] = [
  { id: "BSNL_LANDLINE",  name: "BSNL Landline / PSTN",        shortName: "BSNL",       category: "LANDLINE", icon: "☎️", state: "All India",   consumerIdLabel: "Telephone Number",          consumerIdHint: "e.g. 01123456789" },
  { id: "MTNL_DELHI",     name: "MTNL Delhi – Landline",       shortName: "MTNL Delhi", category: "LANDLINE", icon: "☎️", state: "Delhi",       consumerIdLabel: "Telephone / Account Number",consumerIdHint: "e.g. 01123456789" },
  { id: "MTNL_MUMBAI",    name: "MTNL Mumbai – Landline",      shortName: "MTNL Mumbai",category: "LANDLINE", icon: "☎️", state: "Maharashtra", consumerIdLabel: "Telephone / Account Number",consumerIdHint: "e.g. 02223456789" },
  { id: "AIRTEL_LANDLINE",name: "Airtel Landline / Broadband", shortName: "Airtel",     category: "LANDLINE", icon: "☎️", state: "All India",   consumerIdLabel: "Airtel Account Number",     consumerIdHint: "e.g. 123456789012" },
  { id: "ACT_LANDLINE",   name: "ACT Fibernet – Voice",        shortName: "ACT",        category: "LANDLINE", icon: "☎️", state: "Multi",       consumerIdLabel: "Subscriber ID",             consumerIdHint: "e.g. ACT12345678" },
];

const BILL_AMOUNTS: Record<BillerCategory, () => number> = {
  ELECTRICITY:   () => Math.round((150 + Math.random() * 80) * 6.5 + 180),
  GAS:           () => 680 + Math.floor(Math.random() * 400),
  WATER:         () => 320 + Math.floor(Math.random() * 200),
  BROADBAND:     () => 699 + Math.floor(Math.random() * 400),
  DTH:           () => 299 + Math.floor(Math.random() * 300),
  FASTAG:        () => 200 + Math.floor(Math.random() * 300),
  MUNICIPAL_TAX: () => 4500 + Math.floor(Math.random() * 6000),
  CREDIT_CARD:   () => 3200 + Math.floor(Math.random() * 12000),
  EDUCATION:     () => 15000 + Math.floor(Math.random() * 25000),
  LPG:           () => 850 + Math.floor(Math.random() * 200),
  LANDLINE:      () => 320 + Math.floor(Math.random() * 300),
};

const STATIC_CATALOGUE: Record<BillerCategory, Biller[]> = {
  ELECTRICITY:   ELECTRICITY_BILLERS,
  GAS:           GAS_BILLERS,
  WATER:         WATER_BILLERS,
  BROADBAND:     BROADBAND_BILLERS,
  DTH:           DTH_BILLERS,
  FASTAG:        FASTAG_BILLERS,
  MUNICIPAL_TAX: MUNICIPAL_TAX_BILLERS,
  CREDIT_CARD:   CREDIT_CARD_BILLERS,
  EDUCATION:     EDUCATION_BILLERS,
  LPG:           LPG_BILLERS,
  LANDLINE:      LANDLINE_BILLERS,
};

function generateFallbackBill(billerId: string, billerName: string, consumerId: string, category?: BillerCategory): FetchedBill {
  const now = new Date();
  const periodFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodTo = new Date(now.getFullYear(), now.getMonth(), 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
  if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

  const amount = category ? BILL_AMOUNTS[category]() : 999;
  const units = category === "ELECTRICITY" ? 150 + Math.floor(Math.random() * 80) : undefined;
  const ts = Date.now() % 1_000_000;
  const prefix = billerId.substring(0, 4).toUpperCase();

  return {
    billerId, billerName, consumerId,
    customerName: "Resident Account",
    billNumber: `BBPS-${prefix}-${ts}`,
    billDate: periodFrom.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    amount, units,
    periodFrom: periodFrom.toISOString().split("T")[0],
    periodTo: periodTo.toISOString().split("T")[0],
    status: "DUE",
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const billerService = {
  async getBillersByCategory(category: BillerCategory): Promise<Biller[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/billers?category=${category}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch { /* fallthrough */ }
    return STATIC_CATALOGUE[category] ?? [];
  },

  async fetchBill(billerId: string, billerName: string, consumerId: string, category?: BillerCategory): Promise<FetchedBill> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/bill/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billerId, consumerId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.billNumber) return data;
      }
    } catch { /* fallthrough */ }
    return generateFallbackBill(billerId, billerName, consumerId, category);
  },

  async payBill(bill: FetchedBill): Promise<BillPayResult> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/bill/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billNumber: bill.billNumber, billerId: bill.billerId, amount: bill.amount, method: "UPI" }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.upiIntentUrl) return data;
      }
    } catch { /* fallthrough */ }
    const tr = `MANA${Date.now()}`;
    const pa = "bbps@setu";
    const pn = "Mana+Pay+BBPS";
    return {
      upiIntentUrl: `upi://pay?pa=${pa}&pn=${pn}&am=${bill.amount.toFixed(2)}&cu=INR&tr=${tr}&tn=BBPS+Bill+Payment`,
      phonePeUrl: `phonepe://pay?pa=${pa}&pn=${pn}&am=${bill.amount.toFixed(2)}&cu=INR&tr=${tr}`,
      transactionRef: tr,
      amount: bill.amount,
    };
  },
};
