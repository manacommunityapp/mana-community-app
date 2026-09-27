import type {
  CommerceCategory,
  BusinessPartner,
  CommunityOffer,
  OfferClaim,
  CommunityMarketEvent,
  MarketBooth,
  CommunityDemand,
  CommerceAnalytics,
  DealType,
} from '../../types/offers';

const OFFERS_API_URL = 'http://localhost:8102/api/offers';

// In-memory seed fallback for offline / mock resilience
const SEED_CATEGORIES: CommerceCategory[] = [
  { id: 'cat-health', name: 'Health & Medical', code: 'HEALTH_WELLNESS', icon: 'HeartPulse', displayOrder: 1, active: true },
  { id: 'cat-food', name: 'Food & Dining', code: 'FOOD_DINING', icon: 'Utensils', displayOrder: 2, active: true },
  { id: 'cat-beauty', name: 'Beauty & Salon', code: 'BEAUTY_SALON', icon: 'Sparkles', displayOrder: 3, active: true },
  { id: 'cat-fitness', name: 'Fitness & Sports', code: 'FITNESS_SPORTS', icon: 'Dumbbell', displayOrder: 4, active: true },
  { id: 'cat-home', name: 'Home & Interiors', code: 'HOME_INTERIORS', icon: 'Home', displayOrder: 5, active: true },
  { id: 'cat-tech', name: 'Tech & Electronics', code: 'TECH_ELECTRONICS', icon: 'Laptop', displayOrder: 6, active: true },
  { id: 'cat-kids', name: 'Kids & Education', code: 'KIDS_EDUCATION', icon: 'GraduationCap', displayOrder: 7, active: true },
  { id: 'cat-fashion', name: 'Fashion & Lifestyle', code: 'FASHION_LIFESTYLE', icon: 'ShoppingBag', displayOrder: 8, active: true },
];

const SEED_BUSINESSES: BusinessPartner[] = [
  {
    id: 'biz-dental',
    name: 'ABC Dental Clinic & Implant Centre',
    registeredEntityName: 'ABC Healthcare Pvt Ltd',
    categoryId: 'cat-health',
    categoryName: 'Health & Medical',
    tagline: 'Gentle dental care for the entire family',
    description: 'Multi-specialty dental clinic specializing in teeth cleaning, Invisalign, root canals, and kids dentistry.',
    address: 'Plot 42, Gachibowli Main Road, Opp Metro Station',
    city: 'Hyderabad',
    phone: '+91 98765 43210',
    distanceKm: 1.2,
    verificationStatus: 'COMMUNITY_PARTNER',
    partnershipTier: 'GOLD_PARTNER',
    averageRating: 4.9,
    reviewCount: 48,
    activeDealsCount: 2,
    totalRedemptions: 142,
  },
  {
    id: 'biz-salon',
    name: 'Glow Unisex Luxury Salon & Spa',
    registeredEntityName: 'Glow Spa Ventures',
    categoryId: 'cat-beauty',
    categoryName: 'Beauty & Salon',
    tagline: 'Premium hair, skin & bridal styling',
    description: 'Award-winning salon with certified stylists. Organic facials, precision haircuts, and rejuvenating head massages.',
    address: 'Shop 105, Nexus Mall Road',
    city: 'Hyderabad',
    phone: '+91 91234 56789',
    distanceKm: 0.8,
    verificationStatus: 'COMMUNITY_PARTNER',
    partnershipTier: 'SILVER_PARTNER',
    averageRating: 4.8,
    reviewCount: 74,
    activeDealsCount: 1,
    totalRedemptions: 210,
  },
  {
    id: 'biz-gym',
    name: 'FitPulse 24/7 Gym & Crossfit',
    registeredEntityName: 'FitPulse Health Club',
    categoryId: 'cat-fitness',
    categoryName: 'Fitness & Sports',
    tagline: 'Train without limits — 24/7 access',
    description: 'State of the art gym equipment, certified personal trainers, steam bath, and CrossFit arena.',
    address: 'Level 3, Prime Commercial Tower, Hitec City',
    city: 'Hyderabad',
    phone: '+91 99887 76655',
    distanceKm: 1.5,
    verificationStatus: 'VERIFIED',
    partnershipTier: 'SILVER_PARTNER',
    averageRating: 4.7,
    reviewCount: 53,
    activeDealsCount: 1,
    totalRedemptions: 89,
  },
  {
    id: 'biz-grocery',
    name: 'Fresh Basket Organic Supermarket',
    registeredEntityName: 'Fresh Organics Retail',
    categoryId: 'cat-food',
    categoryName: 'Food & Dining',
    tagline: 'Farm fresh organic fruits, veggies & cold-pressed oils',
    description: 'Direct from organic farms. Daily harvest deliveries, gourmet cheeses, cold-pressed oils, and gluten-free staples.',
    address: 'Door 12-4, Kondapur Main Road',
    city: 'Hyderabad',
    phone: '+91 94400 11223',
    distanceKm: 0.5,
    verificationStatus: 'COMMUNITY_PARTNER',
    partnershipTier: 'PLATINUM_PARTNER',
    averageRating: 4.9,
    reviewCount: 112,
    activeDealsCount: 1,
    totalRedemptions: 380,
  },
  {
    id: 'biz-tech',
    name: 'TechFix Quick Laptop & Smart Care',
    registeredEntityName: 'TechFix Solutions LLP',
    categoryId: 'cat-tech',
    categoryName: 'Tech & Electronics',
    tagline: 'Same-day doorstep laptop & phone repair',
    description: 'Certified chip-level engineers for MacBook, Windows laptops, iPad screen replacement, and RAM/SSD upgrades.',
    address: 'Shop 4, Gachibowli Outer Ring Rd',
    city: 'Hyderabad',
    phone: '+91 97000 88990',
    distanceKm: 2.0,
    verificationStatus: 'VERIFIED',
    partnershipTier: 'NONE',
    averageRating: 4.6,
    reviewCount: 36,
    activeDealsCount: 1,
    totalRedemptions: 64,
  },
];

const SEED_OFFERS: CommunityOffer[] = [
  {
    id: 'deal-dental-consult',
    businessId: 'biz-dental',
    businessName: 'ABC Dental Clinic & Implant Centre',
    categoryId: 'cat-health',
    categoryName: 'Health & Medical',
    title: 'Complete Dental Consultation + Digital Panoramic X-Ray',
    tagline: 'Comprehensive oral health assessment by senior dentist',
    description: 'Includes oral cavity examination, digital panoramic X-ray, plaque analysis, and personalized treatment roadmap.',
    dealType: 'COMMUNITY_PRICE',
    regularPrice: 1000,
    communityPrice: 600,
    discountPercentage: 40,
    savingsSummary: 'Save ₹400 (40% OFF)',
    termsAndConditions: 'Valid for one resident per voucher. Prior appointment required. Applicable Monday to Saturday.',
    eligibilityNote: 'Exclusive to Mana Residency & Green Valley residents',
    targetCommunityIds: ['comm-mana-residency', 'comm-green-valley'],
    targetCommunityNames: ['Mana Residency', 'Green Valley'],
    estimatedAudience: 2450,
    validFrom: '2026-09-01',
    validUntil: '2026-11-15',
    maxClaims: 100,
    claimedCount: 28,
    redeemedCount: 19,
    availableClaims: 72,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: true,
    viewCount: 420,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'deal-dental-scaling',
    businessId: 'biz-dental',
    businessName: 'ABC Dental Clinic & Implant Centre',
    categoryId: 'cat-health',
    categoryName: 'Health & Medical',
    title: 'Ultrasonic Teeth Scaling & Polishing',
    tagline: 'Get sparkling clean teeth & fluoride protection',
    description: 'Advanced painless ultrasonic scaling removes stubborn tartar, stain removal polishing with fluoride protection.',
    dealType: 'COMMUNITY_PRICE',
    regularPrice: 2200,
    communityPrice: 1399,
    discountPercentage: 36,
    savingsSummary: 'Save ₹801 (36% OFF)',
    termsAndConditions: 'Appointment mandatory. Valid 30 days from claim.',
    eligibilityNote: 'Exclusive to Mana Residency residents',
    targetCommunityIds: ['comm-mana-residency'],
    targetCommunityNames: ['Mana Residency'],
    estimatedAudience: 1500,
    validFrom: '2026-09-01',
    validUntil: '2026-10-31',
    maxClaims: 60,
    claimedCount: 18,
    redeemedCount: 12,
    availableClaims: 42,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: false,
    viewCount: 215,
    createdAt: '2026-09-05T11:00:00Z',
  },
  {
    id: 'deal-salon-spa',
    businessId: 'biz-salon',
    businessName: 'Glow Unisex Luxury Salon & Spa',
    categoryId: 'cat-beauty',
    categoryName: 'Beauty & Salon',
    title: 'Designer Haircut + Hair Spa + Scalp Massage Package',
    tagline: 'Signature styling package by senior hair artist',
    description: "Includes wash, deep conditioning L'Oréal hair spa, neck & shoulder pressure point massage, and blow-dry finish.",
    dealType: 'PERCENTAGE_OFF',
    regularPrice: 1500,
    communityPrice: 899,
    discountPercentage: 40,
    savingsSummary: 'Save ₹601 (40% OFF)',
    termsAndConditions: 'Valid for both men and women. Walk-in or book online.',
    eligibilityNote: 'Mana Residency Verified Members',
    targetCommunityIds: ['comm-mana-residency'],
    targetCommunityNames: ['Mana Residency'],
    estimatedAudience: 1500,
    validFrom: '2026-09-01',
    validUntil: '2026-10-25',
    maxClaims: 80,
    claimedCount: 42,
    redeemedCount: 31,
    availableClaims: 38,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: true,
    viewCount: 510,
    createdAt: '2026-09-03T14:30:00Z',
  },
  {
    id: 'deal-gym-pass',
    businessId: 'biz-gym',
    businessName: 'FitPulse 24/7 Gym & Crossfit',
    categoryId: 'cat-fitness',
    categoryName: 'Fitness & Sports',
    title: '3-Month Unlimited Fitness & CrossFit Pass',
    tagline: 'Get into peak shape with community fitness discount',
    description: 'Access all cardio, strength machines, steam room, group Zumba, and certified diet counseling sessions.',
    dealType: 'COMMUNITY_PRICE',
    regularPrice: 7500,
    communityPrice: 4999,
    discountPercentage: 33,
    savingsSummary: 'Save ₹2,501 (33% OFF)',
    termsAndConditions: 'Valid for new registrations or annual renewals.',
    eligibilityNote: 'Mana Community Residents Only',
    targetCommunityIds: ['comm-mana-residency'],
    targetCommunityNames: ['Mana Residency'],
    estimatedAudience: 1500,
    validFrom: '2026-09-01',
    validUntil: '2026-11-30',
    maxClaims: 50,
    claimedCount: 21,
    redeemedCount: 14,
    availableClaims: 29,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: false,
    viewCount: 340,
    createdAt: '2026-09-08T09:00:00Z',
  },
  {
    id: 'deal-organic-basket',
    businessId: 'biz-grocery',
    businessName: 'Fresh Basket Organic Supermarket',
    categoryId: 'cat-food',
    categoryName: 'Food & Dining',
    title: 'Organic Grocery Basket (10kg Assorted Produce)',
    tagline: 'Cold-pressed oils, organic rice, and freshly harvested veggies',
    description: 'Includes 5kg Sona Masoori organic rice, 1L wood-pressed groundnut oil, 2kg farm potatoes, 2kg onions, and 1kg carrots.',
    dealType: 'BUNDLE',
    regularPrice: 1450,
    communityPrice: 1099,
    discountPercentage: 24,
    savingsSummary: 'Save ₹351 (24% OFF)',
    termsAndConditions: 'Free doorstep delivery inside Mana Residency premises every morning.',
    eligibilityNote: 'Exclusive to Mana Residency',
    targetCommunityIds: ['comm-mana-residency'],
    targetCommunityNames: ['Mana Residency'],
    estimatedAudience: 1500,
    validFrom: '2026-09-01',
    validUntil: '2026-10-31',
    maxClaims: 120,
    claimedCount: 55,
    redeemedCount: 44,
    availableClaims: 65,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: true,
    viewCount: 680,
    createdAt: '2026-09-02T16:00:00Z',
  },
  {
    id: 'deal-laptop-service',
    businessId: 'biz-tech',
    businessName: 'TechFix Quick Laptop & Smart Care',
    categoryId: 'cat-tech',
    categoryName: 'Tech & Electronics',
    title: 'Free Doorstep Laptop Deep Cleaning & Thermal Paste Service',
    tagline: 'Boost your laptop speed and prevent overheating',
    description: 'Internal fan dust removal, Arctic MX-4 thermal paste renewal, keyboard sanitization, and hardware diagnostic check.',
    dealType: 'FREE_SERVICE',
    regularPrice: 800,
    communityPrice: 0,
    discountPercentage: 100,
    savingsSummary: 'Free Service (₹800 Value)',
    termsAndConditions: 'Free with any diagnostic or software tune-up. Doorstep visit included.',
    eligibilityNote: 'Mana Residency Residents',
    targetCommunityIds: ['comm-mana-residency'],
    targetCommunityNames: ['Mana Residency'],
    estimatedAudience: 1500,
    validFrom: '2026-09-01',
    validUntil: '2026-10-20',
    maxClaims: 40,
    claimedCount: 30,
    redeemedCount: 22,
    availableClaims: 10,
    isClaimable: true,
    status: 'PUBLISHED',
    featured: false,
    viewCount: 290,
    createdAt: '2026-09-09T18:00:00Z',
  },
];

const SEED_BOOTHS: MarketBooth[] = [
  { id: 'bth-1', marketEventId: 'evt-fest-1', boothNumber: 'A-01', zone: 'Health & Wellness', packageType: 'PREMIUM_BOOTH', price: 3500, isOccupied: true, assignedBusinessId: 'biz-dental', assignedBusinessName: 'ABC Dental Clinic & Implant Centre', assignedCategory: 'Health & Medical', todaysSpecialOffer: 'Free Dental Checkup + Toothbrush Kit + 40% Off Voucher', displayRow: 1, displayCol: 1 },
  { id: 'bth-2', marketEventId: 'evt-fest-1', boothNumber: 'A-02', zone: 'Beauty & Wellness', packageType: 'PREMIUM_BOOTH', price: 3500, isOccupied: true, assignedBusinessId: 'biz-salon', assignedBusinessName: 'Glow Unisex Luxury Salon & Spa', assignedCategory: 'Beauty & Salon', todaysSpecialOffer: 'Live Hair Styling Demo + 20% Spa Booking Discount', displayRow: 1, displayCol: 2 },
  { id: 'bth-3', marketEventId: 'evt-fest-1', boothNumber: 'A-03', zone: 'Food & Beverages', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: true, assignedBusinessId: 'biz-grocery', assignedBusinessName: 'Fresh Basket Organic Supermarket', assignedCategory: 'Food & Dining', todaysSpecialOffer: 'Organic Mango Pulp Tasting & Flat 20% Off Farm Baskets', displayRow: 1, displayCol: 3 },
  { id: 'bth-4', marketEventId: 'evt-fest-1', boothNumber: 'A-04', zone: 'Tech & Gadgets', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: true, assignedBusinessId: 'biz-tech', assignedBusinessName: 'TechFix Quick Laptop & Smart Care', assignedCategory: 'Tech & Electronics', todaysSpecialOffer: 'Free Screen Protector Fitting on all phones', displayRow: 1, displayCol: 4 },
  { id: 'bth-5', marketEventId: 'evt-fest-1', boothNumber: 'A-05', zone: 'Fashion & Boutiques', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 1, displayCol: 5 },
  { id: 'bth-6', marketEventId: 'evt-fest-1', boothNumber: 'A-06', zone: 'Kids & Games', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 1, displayCol: 6 },
  { id: 'bth-7', marketEventId: 'evt-fest-1', boothNumber: 'B-01', zone: 'Home & Decor', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 2, displayCol: 1 },
  { id: 'bth-8', marketEventId: 'evt-fest-1', boothNumber: 'B-02', zone: 'Food Court', packageType: 'FOOD_STALL', price: 2500, isOccupied: false, displayRow: 2, displayCol: 2 },
  { id: 'bth-9', marketEventId: 'evt-fest-1', boothNumber: 'B-03', zone: 'Fitness & Sports', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 2, displayCol: 3 },
  { id: 'bth-10', marketEventId: 'evt-fest-1', boothNumber: 'B-04', zone: 'Tech & Gaming', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 2, displayCol: 4 },
  { id: 'bth-11', marketEventId: 'evt-fest-1', boothNumber: 'B-05', zone: 'Handmade Crafts', packageType: 'BASIC_BOOTH', price: 2000, isOccupied: false, displayRow: 2, displayCol: 5 },
  { id: 'bth-12', marketEventId: 'evt-fest-1', boothNumber: 'B-06', zone: 'Bakery & Sweets', packageType: 'FOOD_STALL', price: 2500, isOccupied: false, displayRow: 2, displayCol: 6 },
];

const SEED_MARKET_EVENTS: CommunityMarketEvent[] = [
  {
    id: 'evt-fest-1',
    communityId: 'comm-mana-residency',
    communityName: 'Mana Residency',
    title: 'Mana Family Shopping Fest & Market Day',
    theme: 'Local Artisans, Food Carnival & Health Fair',
    description: 'Join us for an exciting evening of hyperlocal shopping! 20+ local stalls featuring live food counters, gourmet bakeries, handmade jewelry, organic groceries, and free health checkups.',
    eventDate: '2026-10-03',
    startTime: '16:00',
    endTime: '21:00',
    venue: 'Community Clubhouse Lawn & Amphitheatre',
    status: 'UPCOMING',
    totalBooths: 12,
    allocatedBooths: 4,
    availableBooths: 8,
    expectedVisitors: 1500,
    eventGuidelines: '1. Eco-friendly packaging mandatory. 2. Low-decibel music only after 8 PM. 3. Security QR pass required for all vendor staff.',
    entertainmentHighlights: 'Live Acoustic Music by Society Band (6 PM), Magic Show for Kids (7 PM), Lucky Draw Raffle (8:30 PM)',
    booths: SEED_BOOTHS,
    createdAt: '2026-09-20T10:00:00Z',
  },
];

const SEED_DEMANDS: CommunityDemand[] = [
  {
    id: 'dem-1',
    communityId: 'comm-mana-residency',
    communityName: 'Mana Residency',
    title: 'Weekend swimming coaching for kids (Beginner & Intermediate)',
    categoryId: 'cat-fitness',
    categoryName: 'Fitness & Sports',
    description: 'We need a certified NIS swimming coach to conduct Saturday & Sunday morning batches for age groups 6-12.',
    expectedFrequency: 'Every Saturday & Sunday',
    preferredTiming: '7:00 AM - 9:00 AM',
    interestedFamiliesCount: 34,
    userHasExpressedInterest: false,
    status: 'OPEN',
    createdByName: 'Ananya Sharma',
    createdAt: '2026-09-15T12:00:00Z',
  },
  {
    id: 'dem-2',
    communityId: 'comm-mana-residency',
    communityName: 'Mana Residency',
    title: 'Farm-Fresh Organic Vegetables Sunday Pop-up Stall',
    categoryId: 'cat-food',
    categoryName: 'Food & Dining',
    description: 'Direct delivery of certified organic greens, fresh herbs, pesticide-free tomatoes, and seasonal gourds.',
    expectedFrequency: 'Every Sunday Morning',
    preferredTiming: '7:30 AM - 11:30 AM',
    interestedFamiliesCount: 86,
    userHasExpressedInterest: true,
    status: 'OPEN',
    createdByName: 'Rajesh Kumar',
    createdAt: '2026-09-18T08:30:00Z',
  },
  {
    id: 'dem-3',
    communityId: 'comm-mana-residency',
    communityName: 'Mana Residency',
    title: 'Doorstep Bicycle Repair & Annual Maintenance Camp',
    categoryId: 'cat-home',
    categoryName: 'Home & Interiors',
    description: 'Tuning, brake cable replacement, lubrication, and tire fixes for kids and adult bicycles before winter.',
    expectedFrequency: 'Quarterly Camp',
    preferredTiming: 'Full Day Sunday',
    interestedFamiliesCount: 28,
    userHasExpressedInterest: false,
    status: 'OPEN',
    createdByName: 'Vikram Mehta',
    createdAt: '2026-09-21T15:00:00Z',
  },
];

const SEED_CLAIMS: OfferClaim[] = [
  {
    id: 'claim-1',
    offerId: 'deal-dental-consult',
    offerTitle: 'Complete Dental Consultation + Digital Panoramic X-Ray',
    dealType: 'COMMUNITY_PRICE',
    regularPrice: 1000,
    communityPrice: 600,
    savingsSummary: 'Save ₹400 (40% OFF)',
    businessId: 'biz-dental',
    businessName: 'ABC Dental Clinic & Implant Centre',
    businessAddress: 'Plot 42, Gachibowli Main Road, Opp Metro Station',
    businessPhone: '+91 98765 43210',
    communityId: 'comm-mana-residency',
    residentUserId: 'user-sandeep',
    residentName: 'Sandeep Patil',
    unitNumber: 'B-402',
    redemptionCode: 'MANA-8F29K',
    qrPayload: 'MANADEAL:deal-dental-consult:user-sandeep:MANA-8F29K',
    status: 'ACTIVE',
    validUntil: '2026-11-15',
    claimedAt: '2026-09-22T10:30:00Z',
  },
  {
    id: 'claim-2',
    offerId: 'deal-grocery-basket',
    offerTitle: 'Organic Grocery Basket (10kg Assorted Produce)',
    dealType: 'BUNDLE',
    regularPrice: 1450,
    communityPrice: 1099,
    savingsSummary: 'Save ₹351 (24% OFF)',
    businessId: 'biz-grocery',
    businessName: 'Fresh Basket Organic Supermarket',
    businessAddress: 'Door 12-4, Kondapur Main Road',
    businessPhone: '+91 94400 11223',
    communityId: 'comm-mana-residency',
    residentUserId: 'user-sandeep',
    residentName: 'Sandeep Patil',
    unitNumber: 'B-402',
    redemptionCode: 'MANA-4Q71P',
    qrPayload: 'MANADEAL:deal-organic-basket:user-sandeep:MANA-4Q71P',
    status: 'REDEEMED',
    validUntil: '2026-10-31',
    claimedAt: '2026-09-12T14:00:00Z',
    redeemedAt: '2026-09-13T18:20:00Z',
  },
];

class OffersApiService {
  private offers = [...SEED_OFFERS];
  private businesses = [...SEED_BUSINESSES];
  private claims = [...SEED_CLAIMS];
  private marketEvents = [...SEED_MARKET_EVENTS];
  private demands = [...SEED_DEMANDS];

  async getCategories(): Promise<CommerceCategory[]> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/categories`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return SEED_CATEGORIES;
  }

  async getOffers(communityId = 'comm-mana-residency', categoryId?: string, search?: string): Promise<CommunityOffer[]> {
    try {
      let url = `${OFFERS_API_URL}/deals?communityId=${communityId}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return this.offers.filter((o) => {
      if (categoryId && o.categoryId !== categoryId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.title.toLowerCase().includes(q) ||
          o.businessName.toLowerCase().includes(q) ||
          (o.description && o.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }

  async getOfferById(id: string): Promise<CommunityOffer> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/deals/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const found = this.offers.find((o) => o.id === id);
    if (!found) throw new Error('Offer not found');
    return found;
  }

  async claimOffer(req: {
    offerId: string;
    communityId: string;
    residentUserId: string;
    residentName?: string;
    unitNumber?: string;
  }): Promise<OfferClaim> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/deals/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const offer = this.offers.find((o) => o.id === req.offerId);
    if (!offer) throw new Error('Offer not found');

    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MANA-';
    for (let i = 0; i < 5; i++) {
      code += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
    }

    const newClaim: OfferClaim = {
      id: `claim-${Date.now()}`,
      offerId: offer.id,
      offerTitle: offer.title,
      dealType: offer.dealType,
      regularPrice: offer.regularPrice,
      communityPrice: offer.communityPrice,
      savingsSummary: offer.savingsSummary,
      businessId: offer.businessId,
      businessName: offer.businessName,
      communityId: req.communityId,
      residentUserId: req.residentUserId,
      residentName: req.residentName || 'Sandeep Patil',
      unitNumber: req.unitNumber || 'B-402',
      redemptionCode: code,
      qrPayload: `MANADEAL:${offer.id}:${req.residentUserId}:${code}`,
      status: 'ACTIVE',
      validUntil: offer.validUntil,
      claimedAt: new Date().toISOString(),
    };

    this.claims.unshift(newClaim);
    offer.claimedCount += 1;
    offer.availableClaims = Math.max(0, (offer.maxClaims || 100) - offer.claimedCount);
    return newClaim;
  }

  async getMyClaims(residentUserId = 'user-sandeep'): Promise<OfferClaim[]> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/deals/my-claims?residentUserId=${residentUserId}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return this.claims.filter((c) => c.residentUserId === residentUserId);
  }

  async redeemOffer(redemptionCode: string, businessId: string, staffName = 'Store Staff'): Promise<OfferClaim> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/deals/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionCode, businessId, staffName }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const claim = this.claims.find((c) => c.redemptionCode === redemptionCode.trim().toUpperCase());
    if (!claim) throw new Error('Invalid redemption voucher code');
    if (claim.status === 'REDEEMED') throw new Error('Voucher has already been redeemed');

    claim.status = 'REDEEMED';
    claim.redeemedAt = new Date().toISOString();

    const offer = this.offers.find((o) => o.id === claim.offerId);
    if (offer) offer.redeemedCount += 1;

    return claim;
  }

  async getBusinesses(categoryId?: string, search?: string): Promise<BusinessPartner[]> {
    try {
      let url = `${OFFERS_API_URL}/businesses`;
      if (categoryId) url += `?categoryId=${categoryId}`;
      if (search) url += `${categoryId ? '&' : '?'}search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return this.businesses.filter((b) => {
      if (categoryId && b.categoryId !== categoryId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.tagline && b.tagline.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }

  async getMarketEvents(communityId = 'comm-mana-residency'): Promise<CommunityMarketEvent[]> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/market-events?communityId=${communityId}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return this.marketEvents;
  }

  async getDemands(communityId = 'comm-mana-residency', userId = 'user-sandeep'): Promise<CommunityDemand[]> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/demands?communityId=${communityId}&userId=${userId}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return this.demands;
  }

  async toggleDemandInterest(demandId: string, residentUserId: string, residentName?: string, flatNumber?: string): Promise<CommunityDemand> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/demands/${demandId}/interest?residentUserId=${residentUserId}&residentName=${encodeURIComponent(residentName || '')}&flatNumber=${encodeURIComponent(flatNumber || '')}`, {
        method: 'POST',
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const dem = this.demands.find((d) => d.id === demandId);
    if (!dem) throw new Error('Demand not found');
    dem.userHasExpressedInterest = !dem.userHasExpressedInterest;
    dem.interestedFamiliesCount += dem.userHasExpressedInterest ? 1 : -1;
    return dem;
  }

  async createDemand(req: {
    communityId: string;
    communityName?: string;
    title: string;
    categoryId: string;
    description?: string;
    expectedFrequency?: string;
    preferredTiming?: string;
    createdByUserId: string;
    createdByName: string;
  }): Promise<CommunityDemand> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/demands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cat = SEED_CATEGORIES.find((c) => c.id === req.categoryId);
    const newDem: CommunityDemand = {
      id: `dem-${Date.now()}`,
      communityId: req.communityId,
      communityName: req.communityName || 'Mana Residency',
      title: req.title,
      categoryId: req.categoryId,
      categoryName: cat?.name || 'General',
      description: req.description,
      expectedFrequency: req.expectedFrequency,
      preferredTiming: req.preferredTiming,
      interestedFamiliesCount: 1,
      userHasExpressedInterest: true,
      status: 'OPEN',
      createdByName: req.createdByName,
      createdAt: new Date().toISOString(),
    };

    this.demands.unshift(newDem);
    return newDem;
  }

  async createOffer(req: any): Promise<CommunityOffer> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cat = SEED_CATEGORIES.find((c) => c.id === req.categoryId);
    const newOffer: CommunityOffer = {
      id: `deal-${Date.now()}`,
      businessId: req.businessId,
      businessName: req.businessName || 'Verified Partner',
      categoryId: req.categoryId,
      categoryName: cat?.name || 'General',
      title: req.title,
      tagline: req.tagline,
      description: req.description,
      dealType: req.dealType || 'COMMUNITY_PRICE',
      regularPrice: req.regularPrice,
      communityPrice: req.communityPrice,
      discountPercentage: req.discountPercentage || 25,
      savingsSummary: `Save ₹${(req.regularPrice || 1000) - (req.communityPrice || 750)}`,
      termsAndConditions: req.termsAndConditions,
      eligibilityNote: 'Mana Residency Residents',
      targetCommunityIds: req.targetCommunityIds || ['comm-mana-residency'],
      targetCommunityNames: req.targetCommunityNames || ['Mana Residency'],
      estimatedAudience: 1500,
      validFrom: req.validFrom || new Date().toISOString().split('T')[0],
      validUntil: req.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      maxClaims: req.maxClaims || 100,
      claimedCount: 0,
      redeemedCount: 0,
      availableClaims: req.maxClaims || 100,
      isClaimable: true,
      status: 'PUBLISHED',
      featured: false,
      viewCount: 1,
      createdAt: new Date().toISOString(),
    };

    this.offers.unshift(newOffer);
    return newOffer;
  }

  async getAnalytics(communityId = 'comm-mana-residency'): Promise<CommerceAnalytics> {
    try {
      const res = await fetch(`${OFFERS_API_URL}/admin/analytics?communityId=${communityId}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    return {
      totalActiveBusinesses: this.businesses.length,
      totalActiveOffers: this.offers.length,
      totalMarketEvents: this.marketEvents.length,
      totalClaims: this.claims.length,
      totalRedemptions: this.claims.filter((c) => c.status === 'REDEEMED').length,
      redemptionRate: 64.5,
      totalEstimatedSavings: 184500,
      categoryDistribution: {
        'Health & Medical': 2,
        'Food & Dining': 1,
        'Beauty & Salon': 1,
        'Fitness & Sports': 1,
        'Tech & Electronics': 1,
      },
      dealTypeDistribution: {
        COMMUNITY_PRICE: 3,
        PERCENTAGE_OFF: 1,
        BUNDLE: 1,
        FREE_SERVICE: 1,
      },
    };
  }
}

export const offersApi = new OffersApiService();
