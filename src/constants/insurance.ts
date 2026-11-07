import type { InsuranceCategory, CatalogueItem, PolicyView } from '../types/insurance';

export const INSURANCE_NOTICE_VERSION = 'v1';

export interface CategoryMeta {
  key: InsuranceCategory;
  label: string;
  iconName: string;
  emoji: string;
  group: 'HEALTH' | 'LIFE' | 'MOTOR' | 'HOME' | 'TRAVEL' | 'SPORTS' | 'OTHER';
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'HEALTH',            label: 'Health Insurance',               iconName: 'HeartPulse',   emoji: '🩺', group: 'HEALTH', description: 'Individual hospitalization & critical illness cover' },
  { key: 'FAMILY_FLOATER',    label: 'Family Floater',                 iconName: 'Users',        emoji: '👨‍👩‍👧', group: 'HEALTH', description: 'Shared sum insured for spouse, kids & family' },
  { key: 'PARENTS',           label: "Senior Parents' Care",          iconName: 'Heart',        emoji: '👵', group: 'HEALTH', description: 'Pre-existing conditions & elder care cover' },
  { key: 'LIFE_TERM',         label: 'Term Life Insurance',            iconName: 'Shield',       emoji: '🛡️', group: 'LIFE',   description: 'Pure life protection & high sum assured' },
  { key: 'MOTOR_CAR',         label: 'Car Insurance',                  iconName: 'Car',          emoji: '🚗', group: 'MOTOR',  description: 'Comprehensive, zero depreciation & roadside assistance' },
  { key: 'MOTOR_TWO_WHEELER', label: 'Two-Wheeler Insurance',          iconName: 'Bike',         emoji: '🛵', group: 'MOTOR',  description: 'Own damage & third-party liability cover' },
  { key: 'HOME',              label: 'Home & Property',                iconName: 'Home',         emoji: '🏠', group: 'HOME',   description: 'Structure, fire, earthquake & contents protection' },
  { key: 'TRAVEL',            label: 'Travel Insurance',               iconName: 'Compass',      emoji: '✈️', group: 'TRAVEL', description: 'International medical, trip cancellation & baggage loss' },
  { key: 'PERSONAL_ACCIDENT', label: 'Personal Accident & Disability', iconName: 'Activity',     emoji: '🩹', group: 'OTHER',  description: 'Accidental injury, disability & loss of income' },
  { key: 'SPORTS_PA',              label: 'Sports Personal Accident',       iconName: 'Dumbbell',     emoji: '🏏', group: 'SPORTS', description: 'Player injury cover for sports & outdoor activities' },
  { key: 'SPORTS_EVENT_LIABILITY', label: 'Sports Event Liability',         iconName: 'ShieldAlert',  emoji: '🏟️', group: 'SPORTS', description: 'Third-party liability for tournaments & sporting events' },
  { key: 'SPORTS_TEAM_GROUP',      label: 'Team / Group Sports Cover',      iconName: 'Users',        emoji: '🤝', group: 'SPORTS', description: 'Group policy for teams, academies & sports clubs' },
];

export function categoryLabel(c: InsuranceCategory): string {
  return CATEGORIES.find((x) => x.key === c)?.label ?? c;
}

export function categoryFromParam(p?: string): InsuranceCategory | undefined {
  return CATEGORIES.find((c) => c.key === (p ?? '').toUpperCase())?.key;
}

// ───────────────────────── sports catalogue seeds ─────────────────────────
// Shown when the API returns no results or is unreachable in development.

export const SPORTS_CATALOGUE_SEEDS: CatalogueItem[] = [
  // ── Player Personal Accident ──────────────────────────────────────────────
  {
    productVersionId: 9001, productId: 901, category: 'SPORTS_PA',
    name: 'SportShield Personal Accident – Player Plan',
    versionNo: 2, insurerName: 'Digit General Insurance', partnerType: 'INSURER',
    irdaiRegistrationNo: '158', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ ageMin: 5, ageMax: 65, residency: 'India' }),
    coverageJson: JSON.stringify({ fractures: '₹1L', ligamentTears: '₹75K', hospitalization: '₹2L', deathPA: '₹10L' }),
    benefitsJson: JSON.stringify(['24h worldwide cover', 'Physio & rehab costs', 'Loss of income during recovery', 'Ambulance transport']),
    waitingPeriodsJson: JSON.stringify({ accidentCover: 'Immediate' }),
    exclusionsJson: JSON.stringify(['Pre-existing disabilities', 'Self-inflicted injuries', 'Professional athletes (separate plan available)']),
    partnerDisclosure: 'Digit General Insurance Limited. IRDAI Reg No. 158.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
  {
    productVersionId: 9002, productId: 902, category: 'SPORTS_PA',
    name: 'ActiveGuard Sports PA – Monthly',
    versionNo: 1, insurerName: 'Niva Bupa Health Insurance', partnerType: 'INSURER',
    irdaiRegistrationNo: '145', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ ageMin: 10, ageMax: 60, residency: 'India' }),
    coverageJson: JSON.stringify({ accidentalDeath: '₹5L', permanentDisability: '₹5L', medicalExpenses: '₹1.5L' }),
    benefitsJson: JSON.stringify(['Monthly renewable plan', 'Covers 20+ listed sports', 'Direct cashless at network hospitals']),
    waitingPeriodsJson: JSON.stringify({ accidentCover: 'Immediate' }),
    exclusionsJson: JSON.stringify(['Adventure sports require add-on', 'Amateur cricket league cover only']),
    partnerDisclosure: 'Niva Bupa Health Insurance Company Limited. IRDAI Reg No. 145.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
  // ── Event & Tournament Liability ─────────────────────────────────────────
  {
    productVersionId: 9011, productId: 911, category: 'SPORTS_EVENT_LIABILITY',
    name: 'EventShield Tournament Liability',
    versionNo: 1, insurerName: 'The New India Assurance Co. Ltd.', partnerType: 'INSURER',
    irdaiRegistrationNo: '190', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ organiserType: 'Individual / Club / Association', maxParticipants: 10000 }),
    coverageJson: JSON.stringify({ spectatorInjury: '₹25L/event', propertyDamage: '₹10L', legalDefence: '₹2L' }),
    benefitsJson: JSON.stringify(['Single or multi-day events', 'Covers volunteers & officials', 'Third-party bodily injury & property damage', 'Legal costs included']),
    waitingPeriodsJson: JSON.stringify({ cover: 'Effective from event start time' }),
    exclusionsJson: JSON.stringify(['Professional leagues & IPL-scale events', 'Alcohol-related incidents', 'Events without proper permissions']),
    partnerDisclosure: 'The New India Assurance Co. Ltd. IRDAI Reg No. 190.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
  {
    productVersionId: 9012, productId: 912, category: 'SPORTS_EVENT_LIABILITY',
    name: 'SpotOn Event & Venue Liability',
    versionNo: 2, insurerName: 'IndiaFirst Life Insurance', partnerType: 'INSURER',
    irdaiRegistrationNo: '143', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ organiserType: 'Club / School / RWA', maxParticipants: 5000 }),
    coverageJson: JSON.stringify({ thirdPartyBodily: '₹20L/event', equipmentDamage: '₹5L', cancellationCosts: '₹1L' }),
    benefitsJson: JSON.stringify(['Venue damage cover', 'Event cancellation partial refund', 'Up to 3 consecutive days', 'Digital policy in minutes']),
    waitingPeriodsJson: JSON.stringify({ cover: 'Immediate on payment' }),
    exclusionsJson: JSON.stringify(['Wilful negligence', 'High-adrenaline adventure (needs add-on)', 'Terrorism (separate cover available)']),
    partnerDisclosure: 'IndiaFirst Life Insurance Company Limited. IRDAI Reg No. 143.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
  // ── Team / Club Group Cover ───────────────────────────────────────────────
  {
    productVersionId: 9021, productId: 921, category: 'SPORTS_TEAM_GROUP',
    name: 'TeamShield Club Group Policy',
    versionNo: 3, insurerName: 'Digit General Insurance', partnerType: 'INSURER',
    irdaiRegistrationNo: '158', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ minMembers: 5, maxMembers: 300, ageMin: 10, ageMax: 65 }),
    coverageJson: JSON.stringify({ accidentalDeathPerMember: '₹5L', medicalExpenses: '₹1L/member', disability: '₹3L/member' }),
    benefitsJson: JSON.stringify(['Single policy covers all registered players', 'No individual declarations', 'Academy & coaching staff included', 'Tournament add-ons available']),
    waitingPeriodsJson: JSON.stringify({ accidentCover: 'Immediate from inception date' }),
    exclusionsJson: JSON.stringify(['Members below 10 or above 65', 'Unlisted / unapproved sports', 'Pre-existing physical disabilities']),
    partnerDisclosure: 'Digit General Insurance Limited. IRDAI Reg No. 158.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
  {
    productVersionId: 9022, productId: 922, category: 'SPORTS_TEAM_GROUP',
    name: 'SquadSafe Annual Team Cover',
    versionNo: 1, insurerName: 'Niva Bupa Health Insurance', partnerType: 'INSURER',
    irdaiRegistrationNo: '145', dataSource: 'SANDBOX',
    brochureUrl: null, policyWordingUrl: null,
    eligibilityJson: JSON.stringify({ minMembers: 2, maxMembers: 50, ageMin: 5, ageMax: 60 }),
    coverageJson: JSON.stringify({ fractures: '₹75K/member', hospitalization: '₹1.5L/member', physio: '₹25K/member' }),
    benefitsJson: JSON.stringify(['Ideal for school & college teams', 'Per-player premium as low as ₹199/year', 'Cashless at 10,000+ hospitals', 'Includes overseas tournaments (SAARC)']),
    waitingPeriodsJson: JSON.stringify({ accidentCover: '48h after policy inception' }),
    exclusionsJson: JSON.stringify(['Professional or paid athletes', 'Events outside stated sport', 'Members added mid-year require endorsement']),
    partnerDisclosure: 'Niva Bupa Health Insurance Company Limited. IRDAI Reg No. 145.',
    commercialDisclosure: 'Mana Community receives referral fees from partner insurers.',
    verifiedAt: '2026-10-01',
  },
];

export function getSportsCatalogueSeeds(category: InsuranceCategory): CatalogueItem[] {
  return SPORTS_CATALOGUE_SEEDS.filter((s) => s.category === category);
}

// ───────────────────────── masking ─────────────────────────

export function maskPolicyNumber(value?: string | null): string {
  if (!value) return '—';
  const clean = value.replace(/[^A-Za-z0-9]/g, '');
  if (clean.length <= 4) return 'XXXX';
  return 'XXXXXX' + clean.slice(-4);
}

// ───────────────────────── ids / expiry ─────────────────────────

export function newIdempotencyKey(now = Date.now(), rand = Math.random): string {
  return `q-${now.toString(36)}-${Math.floor(rand() * 1e9).toString(36)}`;
}

export function isExpired(validUntilIso: string, now: Date = new Date()): boolean {
  const t = Date.parse(validUntilIso);
  return Number.isNaN(t) || t <= now.getTime();
}

export function daysUntil(dateIso?: string | null, now: Date = new Date()): number | null {
  if (!dateIso) return null;
  const t = Date.parse(dateIso);
  if (Number.isNaN(t)) return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((t - startOfToday) / 86_400_000);
}

export type RenewalBucket = 'OVERDUE' | 'DUE_30' | 'DUE_60' | 'LATER' | 'UNKNOWN';

export function renewalBucket(p: Pick<PolicyView, 'expiryDate'>, now: Date = new Date()): RenewalBucket {
  const d = daysUntil(p.expiryDate, now);
  if (d === null) return 'UNKNOWN';
  if (d < 0) return 'OVERDUE';
  if (d <= 30) return 'DUE_30';
  if (d <= 60) return 'DUE_60';
  return 'LATER';
}

// ───────────────────────── redirects ─────────────────────────

export function isSafeHandoffUrl(url: string, allowedHost: string): boolean {
  try {
    if (!url || url.length > 2000 || /[\u0000-\u001f\\]/.test(url)) return false;
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    if (u.username || u.password) return false;
    return u.hostname.toLowerCase() === allowedHost.toLowerCase();
  } catch {
    return false;
  }
}

// ───────────────────────── comparison ─────────────────────────

export const SortKey = {
  NAME: 'NAME',
  INSURER: 'INSURER',
} as const;

export type SortKey = 'NAME' | 'INSURER';

export function sortCatalogue(items: CatalogueItem[], key: SortKey): CatalogueItem[] {
  const copy = [...items];
  copy.sort((a, b) =>
    key === 'INSURER'
      ? a.insurerName.localeCompare(b.insurerName) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
  return copy;
}

export interface ComparisonRow {
  label: string;
  values: string[];
  differs: boolean;
}

function parseJson(s?: string | null): any {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return s; }
}

function show(v: unknown): string {
  if (v === undefined || v === null || v === '') return 'Not provided';
  if (Array.isArray(v)) return v.length ? v.map(String).join(', ') : 'Not provided';
  if (typeof v === 'object') return Object.entries(v as object).map(([k, x]) => `${k}: ${String(x)}`).join('; ');
  return String(v);
}

export function buildComparison(items: CatalogueItem[]): ComparisonRow[] {
  const spec: Array<[string, (i: CatalogueItem) => unknown]> = [
    ['Insurer', (i) => i.insurerName],
    ['IRDAI registration', (i) => i.irdaiRegistrationNo],
    ['Product version', (i) => `v${i.versionNo}`],
    ['Eligibility', (i) => parseJson(i.eligibilityJson)],
    ['Coverage & sum insured', (i) => parseJson(i.coverageJson)],
    ['Benefits', (i) => parseJson(i.benefitsJson)],
    ['Waiting periods', (i) => parseJson(i.waitingPeriodsJson)],
    ['Exclusions, sub-limits, co-pay', (i) => parseJson(i.exclusionsJson)],
    ['Network & servicing', (i) => parseJson(i.networkJson)],
    ['Policy wording', (i) => i.policyWordingUrl],
    ['Data verified on', (i) => i.verifiedAt],
  ];
  return spec.map(([label, get]) => {
    const values = items.map((i) => show(get(i)));
    return { label, values, differs: new Set(values).size > 1 };
  });
}

export function buildPrintableSummary(items: CatalogueItem[]): string {
  const rows = buildComparison(items);
  const head = `Mana Insurance - Product Comparison (${new Date().toLocaleDateString('en-IN')})`;
  const names = items.map((i) => `${i.name} (${i.insurerName})`).join(' | ');
  const body = rows.map((r) => `${r.label}: ${r.values.join(' | ')}`).join('\n');
  const disclosures = items
    .map((i) => [i.partnerDisclosure, i.commercialDisclosure].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('\n');
  return [head, names, body, disclosures && `Disclosures:\n${disclosures}`,
    'This summary is informational. Premiums and cover depend on the insurer\'s underwriting and policy wording.']
    .filter(Boolean).join('\n\n');
}

// ───────────────────────── quote form validation ─────────────────────────

export type FieldErrors = Record<string, string>;

const PIN = /^[1-9][0-9]{5}$/;
const REG = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

export function normaliseRegNo(v: string): string {
  return v.replace(/[\s-]/g, '').toUpperCase();
}

export function validateQuoteFields(
  category: InsuranceCategory,
  f: Record<string, unknown>,
  today: Date = new Date(),
): FieldErrors {
  const e: FieldErrors = {};
  const int = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  const pin = () => { if (!PIN.test(String(f.pincode ?? ''))) e.pincode = 'Enter a valid 6-digit pincode'; };

  switch (category) {
    case 'HEALTH': case 'FAMILY_FLOATER': case 'PARENTS': {
      pin();
      const ages = f.memberAges;
      if (!Array.isArray(ages) || ages.length < 1 || ages.length > 12) e.memberAges = 'Provide 1 to 12 member ages';
      else if (!ages.every((a) => int(a, 0, 100))) e.memberAges = 'Each age must be 0 to 100';
      else if (category === 'PARENTS' && ages.some((a) => (a as number) < 18)) e.memberAges = "Parents' cover is for adults";
      break;
    }
    case 'LIFE_TERM':
      if (!int(f.age, 18, 65)) e.age = 'Age must be 18 to 65';
      if (!(typeof f.annualIncome === 'number' && f.annualIncome > 0)) e.annualIncome = 'Enter a positive income';
      if (typeof f.smoker !== 'boolean') e.smoker = 'Select yes or no';
      break;
    case 'MOTOR_CAR': case 'MOTOR_TWO_WHEELER':
      if (!REG.test(normaliseRegNo(String(f.registrationNumber ?? '')))) e.registrationNumber = 'Enter a valid registration number';
      pin();
      break;
    case 'HOME':
      pin();
      if (!String(f.propertyType ?? '').trim()) e.propertyType = 'Select a property type';
      if (!(typeof f.sumInsuredWanted === 'number' && f.sumInsuredWanted > 0)) e.sumInsuredWanted = 'Enter a positive amount';
      break;
    case 'TRAVEL': {
      if (!String(f.destination ?? '').trim()) e.destination = 'Enter a destination';
      const s = Date.parse(String(f.startDate ?? '')), en = Date.parse(String(f.endDate ?? ''));
      const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      if (Number.isNaN(s)) e.startDate = 'Enter a valid start date (YYYY-MM-DD)';
      else if (s < t0) e.startDate = 'Start date cannot be in the past';
      if (Number.isNaN(en)) e.endDate = 'Enter a valid end date (YYYY-MM-DD)';
      else if (!Number.isNaN(s) && en < s) e.endDate = 'End date must be on or after start date';
      else if (!Number.isNaN(s) && (en - s) / 86_400_000 > 365) e.endDate = 'Trip cannot exceed 365 days';
      if (!int(f.travellers, 1, 10)) e.travellers = 'Travellers must be 1 to 10';
      break;
    }
    case 'PERSONAL_ACCIDENT':
      if (!int(f.age, 18, 70)) e.age = 'Age must be 18 to 70';
      break;
    case 'SPORTS_PA':
      if (!int(f.age, 5, 70)) e.age = 'Age must be 5 to 70';
      if (!String(f.sport ?? '').trim()) e.sport = 'Select a sport';
      break;
    case 'SPORTS_EVENT_LIABILITY': {
      if (!String(f.eventName ?? '').trim()) e.eventName = 'Enter the event name';
      if (!int(f.expectedParticipants, 1, 10_000)) e.expectedParticipants = 'Expected participants must be 1 to 10,000';
      const evDate = Date.parse(String(f.eventDate ?? ''));
      const t0s = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      if (Number.isNaN(evDate)) e.eventDate = 'Enter a valid event date (YYYY-MM-DD)';
      else if (evDate < t0s) e.eventDate = 'Event date cannot be in the past';
      break;
    }
    case 'SPORTS_TEAM_GROUP':
      if (!String(f.teamName ?? '').trim()) e.teamName = 'Enter the team or club name';
      if (!int(f.memberCount, 2, 500)) e.memberCount = 'Members must be 2 to 500';
      if (!String(f.sport ?? '').trim()) e.sport = 'Select a sport';
      break;
    default:
      e.category = 'Quotes are not available for this category';
  }
  return e;
}