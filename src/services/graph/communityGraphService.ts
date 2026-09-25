export type RecommendationType = "PERSON" | "EVENT" | "SPORT" | "TRIP" | "SERVICE" | "FOOD";

export interface RecommendationCard {
  id: string;
  type: RecommendationType;
  title: string;
  subtitle: string;
  description: string;
  score: number;
  tags: string[];
  actionLabel: string;
  actionPath: string;
  imagePlaceholderColor: string;
}

export interface CommunityProfile {
  id: string;
  name: string;
  flatNumber: string;
  tower: string;
  skills: string[];
  professions: string[];
  interests: string[];
  sports: string[];
  visibility: "PUBLIC" | "NEIGHBORS" | "PRIVATE";
}

const SAMPLE_RECOMMENDATIONS: RecommendationCard[] = [
  { id: "r-01", type: "PERSON", title: "Dr. Anita Nair", subtitle: "A-304 • Pediatrician", description: "Available for quick consultations on weekends. Expert in child nutrition.", score: 95, tags: ["Medical", "Child Care", "Weekends"], actionLabel: "View Profile", actionPath: "/discover", imagePlaceholderColor: "#6366f1" },
  { id: "r-02", type: "SPORT", title: "Badminton Doubles — Saturday", description: "2 spots open for mixed doubles. Intermediate level. Court A, 7 AM.", subtitle: "Sports • Court A", score: 92, tags: ["Badminton", "Saturday", "Intermediate"], actionLabel: "Join Now", actionPath: "/sports", imagePlaceholderColor: "#f59e0b" },
  { id: "r-03", type: "TRIP", title: "Coorg Coffee Trail", description: "Weekend outing organized by community member. 2 seats left!", subtitle: "Trip • Oct 12-14", score: 89, tags: ["Outing", "Coorg", "Weekend"], actionLabel: "Book Trip", actionPath: "/trips", imagePlaceholderColor: "#16a34a" },
  { id: "r-04", type: "EVENT", title: "Diwali Potluck Dinner", description: "Bring your favourite dish! Community hall, 7 PM. 45 families attending.", subtitle: "Event • Oct 28", score: 87, tags: ["Festive", "Food", "Community"], actionLabel: "RSVP", actionPath: "/events", imagePlaceholderColor: "#f97316" },
  { id: "r-05", type: "PERSON", title: "Raj Mehta", subtitle: "B-102 • Financial Advisor", description: "SEBI registered advisor. Offers free 30-min portfolio review for residents.", score: 85, tags: ["Finance", "Investment", "Free Consult"], actionLabel: "Connect", actionPath: "/discover", imagePlaceholderColor: "#0ea5e9" },
  { id: "r-06", type: "FOOD", title: "Rashmi's Tiffin Service", description: "Home-cooked South Indian meals. ₹2500/month. Limited slots.", subtitle: "Food • Home Chef", score: 83, tags: ["Tiffin", "South Indian", "Home Food"], actionLabel: "Order Now", actionPath: "/food", imagePlaceholderColor: "#ec4899" },
  { id: "r-07", type: "SERVICE", title: "AC Servicing Camp", description: "Group booking — 40% off for 10+ ACs. Oct 20-22.", subtitle: "Service • Home", score: 80, tags: ["AC", "Maintenance", "Discount"], actionLabel: "Book Slot", actionPath: "/vendor-marketplace", imagePlaceholderColor: "#8b5cf6" },
  { id: "r-08", type: "PERSON", title: "Priya Joshi", subtitle: "C-201 • Yoga Instructor", description: "Morning yoga sessions on the terrace. Free trial this Saturday.", score: 78, tags: ["Yoga", "Wellness", "Morning"], actionLabel: "Join Class", actionPath: "/discover", imagePlaceholderColor: "#10b981" },
  { id: "r-09", type: "SPORT", title: "Chess Tournament", description: "Inter-tower chess championship. Register by Oct 15. All ages welcome.", subtitle: "Sports • Chess", score: 76, tags: ["Chess", "Tournament", "All Ages"], actionLabel: "Register", actionPath: "/sports", imagePlaceholderColor: "#64748b" },
  { id: "r-10", type: "TRIP", title: "Kedarnath Yatra", description: "Spiritual pilgrimage. 13 seats remaining. Depart Nov 1.", subtitle: "Trip • Uttarakhand", score: 74, tags: ["Pilgrimage", "Spiritual", "Nov"], actionLabel: "Book Now", actionPath: "/trips", imagePlaceholderColor: "#7c3aed" },
  { id: "r-11", type: "EVENT", title: "Children's Day Art Competition", description: "Nov 14 at Clubhouse. Age groups 5-8, 9-12. Amazing prizes!", subtitle: "Event • Nov 14", score: 72, tags: ["Kids", "Art", "Competition"], actionLabel: "Register Child", actionPath: "/events", imagePlaceholderColor: "#f43f5e" },
  { id: "r-12", type: "SERVICE", title: "Group Home Insurance Deal", description: "Bajaj Allianz community plan. 25% discount for 20+ flats.", subtitle: "Service • Finance", score: 70, tags: ["Insurance", "Home", "Group Deal"], actionLabel: "Know More", actionPath: "/discover", imagePlaceholderColor: "#14b8a6" },
];

const SAMPLE_PROFILES: CommunityProfile[] = [
  { id: "p-1", name: "Dr. Anita Nair", flatNumber: "A-304", tower: "A", skills: ["Pediatrics", "Child Nutrition"], professions: ["Doctor"], interests: ["Reading", "Gardening"], sports: ["Walking"], visibility: "PUBLIC" },
  { id: "p-2", name: "Raj Mehta", flatNumber: "B-102", tower: "B", skills: ["Financial Planning", "Tax Advisory", "Wealth Management"], professions: ["Financial Advisor", "SEBI Registered"], interests: ["Cricket", "Stocks"], sports: ["Badminton", "Cricket"], visibility: "PUBLIC" },
  { id: "p-3", name: "Priya Joshi", flatNumber: "C-201", tower: "C", skills: ["Yoga", "Meditation", "Pranayama"], professions: ["Yoga Instructor"], interests: ["Cooking", "Nature"], sports: ["Yoga", "Swimming"], visibility: "PUBLIC" },
  { id: "p-4", name: "Suresh Kumar", flatNumber: "A-501", tower: "A", skills: ["Plumbing", "Electrical Work"], professions: ["Retired Engineer"], interests: ["Photography"], sports: ["Walking", "Chess"], visibility: "NEIGHBORS" },
  { id: "p-5", name: "Meera Pillai", flatNumber: "B-303", tower: "B", skills: ["Cooking", "Baking", "Catering"], professions: ["Home Chef"], interests: ["Music", "Travel"], sports: ["Zumba"], visibility: "PUBLIC" },
  { id: "p-6", name: "Kiran Shah", flatNumber: "C-404", tower: "C", skills: ["Web Development", "React", "Node.js"], professions: ["Software Engineer"], interests: ["Gaming", "Reading"], sports: ["Table Tennis", "Badminton"], visibility: "PUBLIC" },
  { id: "p-7", name: "Deepa Reddy", flatNumber: "A-202", tower: "A", skills: ["Tutoring", "Mathematics", "Science"], professions: ["School Teacher"], interests: ["Art", "Volunteering"], sports: ["Yoga", "Walking"], visibility: "NEIGHBORS" },
  { id: "p-8", name: "Arjun Nambiar", flatNumber: "B-401", tower: "B", skills: ["Legal Advisory", "Property Law"], professions: ["Advocate"], interests: ["Trekking", "Music"], sports: ["Cricket", "Swimming"], visibility: "PUBLIC" },
];

export const communityGraphService = {
  getPersonalizedFeed(): RecommendationCard[] {
    return [...SAMPLE_RECOMMENDATIONS].sort((a, b) => b.score - a.score);
  },

  searchCommunity(query: string): CommunityProfile[] {
    const q = query.toLowerCase();
    return SAMPLE_PROFILES.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.skills.some(s => s.toLowerCase().includes(q)) ||
      p.professions.some(pr => pr.toLowerCase().includes(q)) ||
      p.interests.some(i => i.toLowerCase().includes(q)) ||
      p.sports.some(s => s.toLowerCase().includes(q))
    );
  },

  getProfiles(filter?: { skill?: string; sport?: string; tower?: string }): CommunityProfile[] {
    let profiles = SAMPLE_PROFILES.filter(p => p.visibility !== "PRIVATE");
    if (filter?.skill) profiles = profiles.filter(p => p.skills.some(s => s.toLowerCase().includes(filter.skill!.toLowerCase())));
    if (filter?.sport) profiles = profiles.filter(p => p.sports.some(s => s.toLowerCase().includes(filter.sport!.toLowerCase())));
    if (filter?.tower) profiles = profiles.filter(p => p.tower === filter.tower);
    return profiles;
  },

  updateVisibility(_settings: Partial<CommunityProfile>): void {
    // In production, this would call an API
    console.log("Visibility updated:", _settings);
  },
};
