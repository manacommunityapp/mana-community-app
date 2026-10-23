const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExperienceCategory = 'MOVIES' | 'LIVE_EVENTS' | 'SPORTS' | 'KIDS_FAMILY' | 'WORKSHOPS' | 'OUTINGS' | 'ONLINE';
export type BookingStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED';
export type PartnerCategory = 'RESTAURANT' | 'SPORTS_VENUE' | 'ACTIVITY_CENTER' | 'COACHING' | 'ENTERTAINMENT' | 'WELLNESS' | 'RETAIL';
export type InterestTag = 'CRICKET' | 'SWIMMING' | 'BADMINTON' | 'FOOTBALL' | 'TENNIS' | 'CYCLING' | 'YOGA' | 'FITNESS' | 'DANCE' | 'MEDITATION' | 'MOVIES' | 'MUSIC' | 'THEATRE' | 'COMEDY' | 'COOKING' | 'PHOTOGRAPHY' | 'ART_CRAFTS' | 'READING' | 'TREKKING' | 'TRAVEL' | 'GAMING' | 'KIDS_ACTIVITIES';

export interface Experience {
  id: string; title: string; category: ExperienceCategory; emoji: string; backdropColor: string;
  description: string; organizerName: string; organizerVerified: boolean;
  venue: string; venueArea: string; startDate: string; startTime: string;
  durationMins?: number; isFree: boolean; priceIndividual?: number; priceGroup?: number;
  groupMinSize?: number; groupCurrentSize?: number; visibility: string;
  capacity: number; registeredCount: number; status: string; isFeatured: boolean;
  tags: string[]; ageSuitability?: string; refundPolicy?: string;
}

export interface Booking {
  bookingId: string; experienceId: string; experienceTitle: string;
  category: ExperienceCategory; emoji: string; backdropColor: string;
  ticketType: string; attendeeCount: number; totalAmount: number;
  originalAmount: number; discountAmount: number; couponCode?: string;
  status: BookingStatus; bookedAt: string; qrData: string;
  refundStatus: string; familyMembers?: { name: string; age?: number }[];
}

export interface BookRequest {
  experienceId: string; name: string; phone: string; attendeeCount: number;
  ticketType: string; couponCode?: string;
  familyMembers?: { name: string; age?: number }[];
}

export interface CouponResult {
  valid: boolean; code: string; discountType: string; discountValue: number;
  discountAmount: number; finalAmount: number; message: string;
}

export interface Partner {
  id: string; name: string; category: PartnerCategory; emoji: string; backdropColor: string;
  tagline: string; area: string; rating: number; reviewCount: number;
  isVerified: boolean; isFeatured: boolean; discountForMembers?: string;
  contactPhone?: string; bookingUrl?: string; amenities: string[];
  openHours?: string; priceRange: string;
}

export interface CoachingSession {
  sessionId: string; partnerName: string; sport: string; emoji: string;
  coachName: string; coachBio: string; level: string;
  durationMins: number; pricePerSession: number; groupSizeMax: number;
  availableSlots: { date: string; time: string; spotsLeft: number }[];
  venue: string; area: string;
}

export interface Review {
  reviewId: string; experienceId: string; reviewerName: string; reviewerInitials: string;
  rating: number; title: string; body: string; attendedDate: string;
  createdAt: string; helpfulCount: number; verifiedAttendee: boolean;
}

export interface InterestMatch {
  residentName: string; residentInitials: string; flat: string;
  sharedInterests: InterestTag[]; matchScore: number; openToGroup: boolean;
}

export interface ItineraryItem {
  experienceId: string; experienceTitle: string; emoji: string; backdropColor: string;
  date: string; startTime: string; venue: string; venueArea: string;
  price?: number; isFree: boolean; notes?: string;
}

export interface BuddyRecommendation {
  experience: Experience; reason: string; matchScore: number;
}

// ── Category Meta ─────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<ExperienceCategory | 'ALL', { label: string; emoji: string; color: string; bg: string }> = {
  ALL:         { label: 'All',           emoji: '✨', color: '#4F46E5', bg: '#EEF2FF' },
  MOVIES:      { label: 'Movies',        emoji: '🎬', color: '#1A1A2E', bg: '#E8E9F5' },
  LIVE_EVENTS: { label: 'Live Events',   emoji: '🎤', color: '#7C3AED', bg: '#F5F3FF' },
  SPORTS:      { label: 'Sports',        emoji: '🏆', color: '#059669', bg: '#ECFDF5' },
  KIDS_FAMILY: { label: 'Kids & Family', emoji: '👨‍👩‍👧', color: '#D97706', bg: '#FEF3C7' },
  WORKSHOPS:   { label: 'Workshops',     emoji: '🎓', color: '#0891B2', bg: '#ECFEFF' },
  OUTINGS:     { label: 'Outings',       emoji: '🌿', color: '#15803D', bg: '#DCFCE7' },
  ONLINE:      { label: 'Online',        emoji: '💻', color: '#2563EB', bg: '#DBEAFE' },
};

export const INTEREST_META: Record<InterestTag, { label: string; emoji: string; category: string }> = {
  CRICKET: { label: 'Cricket', emoji: '🏏', category: 'Sports' },
  SWIMMING: { label: 'Swimming', emoji: '🏊', category: 'Sports' },
  BADMINTON: { label: 'Badminton', emoji: '🏸', category: 'Sports' },
  FOOTBALL: { label: 'Football', emoji: '⚽', category: 'Sports' },
  TENNIS: { label: 'Tennis', emoji: '🎾', category: 'Sports' },
  CYCLING: { label: 'Cycling', emoji: '🚴', category: 'Sports' },
  YOGA: { label: 'Yoga', emoji: '🧘', category: 'Wellness' },
  FITNESS: { label: 'Fitness', emoji: '💪', category: 'Wellness' },
  DANCE: { label: 'Dance', emoji: '💃', category: 'Wellness' },
  MEDITATION: { label: 'Meditation', emoji: '🌿', category: 'Wellness' },
  MOVIES: { label: 'Movies', emoji: '🎬', category: 'Entertainment' },
  MUSIC: { label: 'Music', emoji: '🎵', category: 'Entertainment' },
  THEATRE: { label: 'Theatre', emoji: '🎭', category: 'Entertainment' },
  COMEDY: { label: 'Comedy', emoji: '😂', category: 'Entertainment' },
  COOKING: { label: 'Cooking', emoji: '👨‍🍳', category: 'Hobbies' },
  PHOTOGRAPHY: { label: 'Photography', emoji: '📸', category: 'Hobbies' },
  ART_CRAFTS: { label: 'Art & Crafts', emoji: '🎨', category: 'Hobbies' },
  READING: { label: 'Reading', emoji: '📚', category: 'Hobbies' },
  TREKKING: { label: 'Trekking', emoji: '🥾', category: 'Adventure' },
  TRAVEL: { label: 'Travel', emoji: '✈️', category: 'Adventure' },
  GAMING: { label: 'Gaming', emoji: '🎮', category: 'Adventure' },
  KIDS_ACTIVITIES: { label: 'Kids Activities', emoji: '🧒', category: 'Family' },
};

// ── Mock fallbacks (mirror backend) ──────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0];

const MOCK_EXPERIENCES: Experience[] = [
  { id: 'exp-001', title: 'Morning Yoga & Meditation', category: 'WORKSHOPS', emoji: '🧘', backdropColor: '#059669', description: 'Start your day with peaceful yoga and guided meditation.', organizerName: 'Priya Wellness', organizerVerified: true, venue: 'Club Lawn', venueArea: 'Phase 1', startDate: plusDays(2), startTime: '07:00', durationMins: 60, isFree: true, visibility: 'OPEN', capacity: 25, registeredCount: 18, status: 'UPCOMING', isFeatured: true, tags: ['yoga', 'wellness'], ageSuitability: 'All ages', refundPolicy: 'Non-refundable' },
  { id: 'exp-002', title: 'Photography Walk: Golden Hour', category: 'OUTINGS', emoji: '📸', backdropColor: '#D97706', description: 'Golden-hour photography walk around community gardens.', organizerName: 'Lens Club Mana', organizerVerified: false, venue: 'Garden Walk', venueArea: 'East Wing', startDate: plusDays(3), startTime: '06:30', durationMins: 90, isFree: false, priceIndividual: 150, visibility: 'OPEN', capacity: 20, registeredCount: 12, status: 'UPCOMING', isFeatured: false, tags: ['photography', 'outdoors'], ageSuitability: '12+', refundPolicy: 'Refundable till 24h before' },
  { id: 'exp-003', title: 'Community Cricket T20', category: 'SPORTS', emoji: '🏏', backdropColor: '#0891B2', description: 'Thrilling T20 match between community blocks. Gear provided!', organizerName: 'Sports Committee', organizerVerified: true, venue: 'Sports Complex', venueArea: 'Block D', startDate: plusDays(4), startTime: '10:00', durationMins: 180, isFree: false, priceIndividual: 150, priceGroup: 120, groupMinSize: 8, groupCurrentSize: 14, visibility: 'OPEN', capacity: 44, registeredCount: 28, status: 'UPCOMING', isFeatured: true, tags: ['cricket', 'sports', 'team'], ageSuitability: '15+', refundPolicy: 'Refundable till 48h before' },
  { id: 'exp-004', title: 'Bollywood Movie Night', category: 'MOVIES', emoji: '🎬', backdropColor: '#7C3AED', description: 'Outdoor screening under the stars with popcorn and snacks.', organizerName: 'Entertainment Club', organizerVerified: true, venue: 'Community Hall', venueArea: 'Main Block', startDate: plusDays(5), startTime: '19:30', durationMins: 180, isFree: false, priceIndividual: 200, visibility: 'OPEN', capacity: 100, registeredCount: 67, status: 'UPCOMING', isFeatured: true, tags: ['movies', 'entertainment', 'family'], ageSuitability: 'All ages', refundPolicy: 'Non-refundable' },
  { id: 'exp-005', title: 'North Indian Cooking Workshop', category: 'WORKSHOPS', emoji: '👨‍🍳', backdropColor: '#DB2777', description: 'Learn authentic recipes from a professional chef. Ingredients included!', organizerName: 'Chef Anita Kumar', organizerVerified: true, venue: 'Community Kitchen', venueArea: 'Block B', startDate: plusDays(6), startTime: '11:00', durationMins: 150, isFree: false, priceIndividual: 350, visibility: 'MEMBERS_ONLY', capacity: 16, registeredCount: 16, status: 'UPCOMING', isFeatured: false, tags: ['cooking', 'food', 'workshop'], ageSuitability: '18+', refundPolicy: 'Refundable till 48h before' },
  { id: 'exp-006', title: 'Kids Art & Craft Fiesta', category: 'KIDS_FAMILY', emoji: '🎨', backdropColor: '#F59E0B', description: 'Fun art session for kids with expert instructors. Materials provided!', organizerName: 'Little Artists Club', organizerVerified: false, venue: 'Activity Hall', venueArea: 'Block A', startDate: plusDays(7), startTime: '10:30', durationMins: 120, isFree: false, priceIndividual: 250, priceGroup: 800, groupMinSize: 3, visibility: 'OPEN', capacity: 30, registeredCount: 22, status: 'UPCOMING', isFeatured: false, tags: ['kids', 'art', 'family'], ageSuitability: '4-12 yrs', refundPolicy: 'Refundable till 24h before' },
];

const MOCK_PARTNERS: Partner[] = [
  { id: 'p-001', name: 'Chaitime Café', category: 'RESTAURANT', emoji: '☕', backdropColor: '#92400E', tagline: '20% off for residents', area: 'Phase 1', rating: 4.5, reviewCount: 128, isVerified: true, isFeatured: true, discountForMembers: '20% off all orders', contactPhone: '9876543210', amenities: ['Dine-in', 'Takeaway', 'Home Delivery'], openHours: '7am – 10pm', priceRange: '₹₹' },
  { id: 'p-002', name: 'AquaArena Swim Club', category: 'SPORTS_VENUE', emoji: '🏊', backdropColor: '#0891B2', tagline: 'Members swim free daily', area: 'Block D', rating: 4.8, reviewCount: 234, isVerified: true, isFeatured: true, discountForMembers: 'Members swim free 6-8am & 6-8pm', contactPhone: '9876543211', amenities: ['Heated Pool', 'Lockers', 'Coaching', 'Kids Pool'], openHours: '5am – 10pm', priceRange: '₹₹₹' },
  { id: 'p-003', name: 'Elite Cricket Academy', category: 'COACHING', emoji: '🏏', backdropColor: '#059669', tagline: 'BCCI-certified coaches', area: 'Block D', rating: 4.7, reviewCount: 189, isVerified: true, isFeatured: false, discountForMembers: '15% off monthly packages', contactPhone: '9876543212', amenities: ['Nets', 'Video Analysis', 'Gear Rental', 'All Levels'], openHours: '6am – 8pm', priceRange: '₹₹₹' },
  { id: 'p-004', name: 'MindBody Wellness', category: 'WELLNESS', emoji: '🧘', backdropColor: '#7C3AED', tagline: 'Yoga · Meditation · Therapy', area: 'Block C', rating: 4.6, reviewCount: 156, isVerified: false, isFeatured: false, discountForMembers: '10% off first session', contactPhone: '9876543213', amenities: ['Yoga Studio', 'Meditation Room', 'Therapy', 'Online Classes'], openHours: '6am – 9pm', priceRange: '₹₹' },
];

// ── Service ───────────────────────────────────────────────────────────────────

export const experiencesService = {
  async getExperiences(params?: { featured?: boolean; category?: string; query?: string }): Promise<Experience[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.featured) qs.set('featured', 'true');
      if (params?.category) qs.set('category', params.category);
      if (params?.query) qs.set('query', params.query);
      const r = await fetch(`${API_BASE}/v1/experiences?${qs}`);
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    let result = [...MOCK_EXPERIENCES];
    if (params?.featured) result = result.filter(e => e.isFeatured);
    if (params?.category) result = result.filter(e => e.category === params.category);
    if (params?.query) result = result.filter(e => e.title.toLowerCase().includes(params.query!.toLowerCase()) || e.tags.some(t => t.includes(params.query!.toLowerCase())));
    return result;
  },

  async getExperience(id: string): Promise<Experience | null> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/${id}`);
      if (r.ok) { const d = await r.json(); if (d.experience) return d.experience; }
    } catch {}
    return MOCK_EXPERIENCES.find(e => e.id === id) ?? null;
  },

  async bookExperience(req: BookRequest): Promise<{ bookingId: string; upiIntentUrl: string; totalAmount: number; discountAmount: number; qrData: string }> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/book`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
      if (r.ok) return r.json();
    } catch {}
    const base = req.attendeeCount * 200;
    const bookingId = `EXP-${Date.now()}`;
    return { bookingId, upiIntentUrl: `upi://pay?pa=manaexperiences@ybl&am=${base}`, totalAmount: base, discountAmount: 0, qrData: `EXP-QR-${bookingId}` };
  },

  async getMyBookings(): Promise<Booking[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/my-bookings`);
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    return MOCK_EXPERIENCES.slice(0, 3).map((e, i) => ({
      bookingId: `EXP-${1001 + i}`, experienceId: e.id, experienceTitle: e.title,
      category: e.category, emoji: e.emoji, backdropColor: e.backdropColor,
      ticketType: 'GENERAL', attendeeCount: 2,
      totalAmount: (e.priceIndividual ?? 0) * 2, originalAmount: (e.priceIndividual ?? 0) * 2,
      discountAmount: 0, status: 'CONFIRMED' as BookingStatus,
      bookedAt: plusDays(-(i + 1)), qrData: `EXP-QR-EXP-${1001 + i}`, refundStatus: 'NONE',
    }));
  },

  async validateCoupon(code: string, experienceId: string, originalAmount: number): Promise<CouponResult> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/coupons/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, experienceId, originalAmount }) });
      if (r.ok) return r.json();
    } catch {}
    const codes: Record<string, { type: string; value: number }> = { MANA10: { type: 'PERCENT', value: 10 }, FLAT200: { type: 'FLAT', value: 200 }, SAVE50: { type: 'PERCENT', value: 50 }, WELCOME: { type: 'FLAT', value: 100 } };
    const c = codes[code.toUpperCase()];
    if (!c) return { valid: false, code, discountType: '', discountValue: 0, discountAmount: 0, finalAmount: originalAmount, message: 'Invalid coupon code' };
    const disc = c.type === 'PERCENT' ? originalAmount * c.value / 100 : Math.min(c.value, originalAmount);
    return { valid: true, code, discountType: c.type, discountValue: c.value, discountAmount: disc, finalAmount: originalAmount - disc, message: c.type === 'PERCENT' ? `${c.value}% off applied!` : `₹${c.value} off applied!` };
  },

  async joinWaitlist(experienceId: string, name: string, phone: string) {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experienceId, name, phone }) });
      if (r.ok) return r.json();
    } catch {}
    return { waitlistId: `WL-${Date.now()}`, experienceId, position: Math.floor(Math.random() * 10 + 1), name, phone, joinedAt: today() };
  },

  async requestRefund(bookingId: string, reason: string, amount: number) {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, reason, amount }) });
      if (r.ok) return r.json();
    } catch {}
    return { refundId: `RFD-${Date.now()}`, bookingId, reason, amountRequested: amount, status: 'REQUESTED', requestedAt: today(), estimatedDays: 5 };
  },

  async getPartners(category?: string): Promise<Partner[]> {
    try {
      const qs = category ? `?category=${category}` : '';
      const r = await fetch(`${API_BASE}/v1/experiences/partners${qs}`);
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    return category ? MOCK_PARTNERS.filter(p => p.category === category) : MOCK_PARTNERS;
  },

  async getCoachingSessions(sport?: string): Promise<CoachingSession[]> {
    try {
      const qs = sport ? `?sport=${sport}` : '';
      const r = await fetch(`${API_BASE}/v1/experiences/coaching${qs}`);
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    return [];
  },

  async getExperienceReviews(experienceId: string): Promise<Review[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/${experienceId}/reviews`);
      if (r.ok) { const d = await r.json(); if (Array.isArray(d)) return d; }
    } catch {}
    return [];
  },

  async submitReview(req: { experienceId: string; bookingId: string; rating: number; title: string; body: string; reviewerName: string }): Promise<Review> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
      if (r.ok) return r.json();
    } catch {}
    return { reviewId: `rv-${Date.now()}`, experienceId: req.experienceId, reviewerName: req.reviewerName, reviewerInitials: req.reviewerName.slice(0, 2).toUpperCase(), rating: req.rating, title: req.title, body: req.body, attendedDate: today(), createdAt: today(), helpfulCount: 0, verifiedAttendee: true, photosCount: 0 };
  },

  async getUserInterests(): Promise<InterestTag[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/buddy/interests`);
      if (r.ok) return r.json();
    } catch {}
    return ['CRICKET', 'MOVIES', 'YOGA'];
  },

  async saveUserInterests(interests: InterestTag[]): Promise<void> {
    try { await fetch(`${API_BASE}/v1/experiences/buddy/interests`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interests }) }); } catch {}
  },

  async getBuddyRecommendations(interests: InterestTag[]): Promise<BuddyRecommendation[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/buddy/recommendations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interests }) });
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    return MOCK_EXPERIENCES.slice(0, 4).map(e => ({ experience: e, reason: 'Recommended for you', matchScore: 75 + Math.floor(Math.random() * 20) }));
  },

  async buildItinerary(interests: InterestTag[], weekend: 'THIS' | 'NEXT'): Promise<ItineraryItem[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/buddy/itinerary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interests, weekend }) });
      if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) return d; }
    } catch {}
    const now = new Date();
    const dayOfWeek = now.getDay();
    let daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
    if (weekend === 'NEXT') daysToSat += 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return [
      { experienceId: 'exp-001', experienceTitle: 'Morning Yoga & Meditation', emoji: '🧘', backdropColor: '#059669', date: fmt(sat), startTime: '07:00', venue: 'Club Lawn', venueArea: 'Phase 1', isFree: true, notes: 'Bring your mat' },
      { experienceId: 'exp-003', experienceTitle: 'Community Cricket T20', emoji: '🏏', backdropColor: '#0891B2', date: fmt(sat), startTime: '10:00', venue: 'Sports Complex', venueArea: 'Block D', price: 150, isFree: false, notes: 'Gear provided' },
      { experienceId: 'exp-004', experienceTitle: 'Bollywood Movie Night', emoji: '🎬', backdropColor: '#7C3AED', date: fmt(sat), startTime: '19:30', venue: 'Community Hall', venueArea: 'Main Block', price: 200, isFree: false, notes: 'Popcorn included 🍿' },
      { experienceId: 'exp-002', experienceTitle: 'Photography Walk', emoji: '📸', backdropColor: '#D97706', date: fmt(sun), startTime: '06:30', venue: 'Garden Walk', venueArea: 'East Wing', isFree: true, notes: 'Golden hour shoot' },
    ];
  },

  async getInterestMatches(): Promise<InterestMatch[]> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/buddy/matches`);
      if (r.ok) return r.json();
    } catch {}
    return [
      { residentName: 'Arjun Mehta', residentInitials: 'AM', flat: 'A-304', sharedInterests: ['CRICKET', 'BADMINTON', 'CYCLING'], matchScore: 92, openToGroup: true },
      { residentName: 'Priya Sharma', residentInitials: 'PS', flat: 'B-102', sharedInterests: ['YOGA', 'MEDITATION', 'PHOTOGRAPHY'], matchScore: 88, openToGroup: true },
      { residentName: 'Kavya Reddy', residentInitials: 'KR', flat: 'A-207', sharedInterests: ['DANCE', 'MUSIC', 'COOKING'], matchScore: 76, openToGroup: true },
    ];
  },

  async sendBuddyMessage(text: string): Promise<{ id: string; role: string; text: string; createdAt: string }> {
    try {
      const r = await fetch(`${API_BASE}/v1/experiences/buddy/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      if (r.ok) return r.json();
    } catch {}
    const lower = text.toLowerCase();
    let response = "I'd love to help! Ask me to suggest experiences, plan your weekend, or find residents with similar interests. 😊";
    if (lower.includes('weekend') || lower.includes('plan')) response = "Use the Itinerary Planner tab to generate your personalised weekend schedule! 🗓️";
    else if (lower.includes('free') || lower.includes('budget')) response = "Free this week: Morning Yoga (Club Lawn), Photography Walk (East Wing). Want to add these to your plan? 🎁";
    else if (lower.includes('family') || lower.includes('kid')) response = "Kids' Art Fiesta is on Saturday — perfect for families with children aged 4-12. All materials provided! 👨‍👩‍👧";
    else if (lower.includes('sport') || lower.includes('cricket')) response = "Cricket T20 is on Saturday at 10am with spots available! Also morning Yoga daily at 7am. 🏏";
    return { id: `msg-${Date.now()}`, role: 'buddy', text: response, createdAt: today() };
  },
};
