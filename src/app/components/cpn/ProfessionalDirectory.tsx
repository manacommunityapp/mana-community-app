import { useState } from "react";
import {
  Search, SlidersHorizontal, Users, GraduationCap, Briefcase,
  Star, MessageSquare, CheckCircle, Award, Sparkles,
  ExternalLink, Building2, BookOpen, Send, Calendar, Globe, Filter
} from "lucide-react";
import { toast } from "react-toastify";

interface DiscoverableNeighbor {
  id: string;
  fullName: string;
  profession: string;
  company: string;
  experienceYears: number;
  location: string;
  communityName: string;
  headline: string;
  canHelpWith: string;
  lookingFor: string;
  skills: string[];
  isMentor: boolean;
  isFreelancer: boolean;
  teachesInAcademy: boolean;
  academyCourses?: string;
  reputationScore: number;
  contactPreference: string;
  avatar: string;
}

const MOCK_NEIGHBORS: DiscoverableNeighbor[] = [
  {
    id: "1",
    fullName: "Sandeep Kumar",
    profession: "Staff Software Engineer",
    company: "Google Cloud",
    experienceYears: 8,
    location: "Block B · 402",
    communityName: "Mana Residency",
    headline: "Staff Software Engineer · Distributed Systems & Cloud",
    canHelpWith: "System Design, AWS / GCP, Spring Boot, Architecture Teardowns",
    lookingFor: "Startups, AI Agents, Angel Opportunities",
    skills: ["Java", "Spring Boot", "AWS", "Kubernetes", "PostgreSQL", "System Design"],
    isMentor: true,
    isFreelancer: true,
    teachesInAcademy: true,
    academyCourses: "System Design for Scalable Microservices",
    reputationScore: 98,
    contactPreference: "IN_APP_MESSAGE",
    avatar: "SK",
  },
  {
    id: "2",
    fullName: "Pooja Ramanathan",
    profession: "Lead Chartered Accountant (CA)",
    company: "Ramanathan & Co.",
    experienceYears: 10,
    location: "Villa 14",
    communityName: "Mana Residency",
    headline: "Senior Partner · Corporate Tax, GST & Startup Audits",
    canHelpWith: "Income Tax filing, Startup Incorporation, GST Audits, NRI Property Tax",
    lookingFor: "Tech entrepreneurs seeking audit & financial compliance",
    skills: ["Corporate Tax", "GST", "Startup Audits", "NRI Investments", "Financial Modeling"],
    isMentor: true,
    isFreelancer: true,
    teachesInAcademy: true,
    academyCourses: "Personal Finance & Smart Tax Planning for Techies",
    reputationScore: 96,
    contactPreference: "IN_APP_MESSAGE",
    avatar: "PR",
  },
  {
    id: "3",
    fullName: "Arjun Mehta",
    profession: "Principal Product Manager",
    company: "Razorpay",
    experienceYears: 7,
    location: "Block A · 101",
    communityName: "Mana Residency",
    headline: "Product Leader · Payments & Growth Architecture",
    canHelpWith: "PM Interview Prep, PRD Reviews, GTM Strategy, Fintech API Design",
    lookingFor: "Early-stage SaaS founders",
    skills: ["Product Strategy", "Fintech", "GTM", "User Research", "Agile Roadmap"],
    isMentor: true,
    isFreelancer: false,
    teachesInAcademy: false,
    reputationScore: 94,
    contactPreference: "IN_APP_MESSAGE",
    avatar: "AM",
  },
  {
    id: "4",
    fullName: "Sneha Nair",
    profession: "Lead Product Designer",
    company: "Swiggy",
    experienceYears: 6,
    location: "Block C · 304",
    communityName: "Mana Residency",
    headline: "Design Systems & Consumer Mobile UX Specialist",
    canHelpWith: "Figma Portfolios, Mobile UX Audits, Design System Architecture",
    lookingFor: "Freelance mobile app design projects",
    skills: ["Figma", "Design Systems", "iOS / Android UX", "User Prototyping"],
    isMentor: true,
    isFreelancer: true,
    teachesInAcademy: true,
    academyCourses: "Figma Masterclass: Mobile UX in Practice",
    reputationScore: 92,
    contactPreference: "IN_APP_MESSAGE",
    avatar: "SN",
  },
  {
    id: "5",
    fullName: "Adv. Rajesh Varma",
    profession: "Senior Corporate & IP Lawyer",
    company: "Varma Law Associates",
    experienceYears: 12,
    location: "Villa 22",
    communityName: "Mana Residency",
    headline: "Advocate · IP Trademarks, Contracts & Property Due Diligence",
    canHelpWith: "Property document verification, Founder Agreements, Trademark Filings",
    lookingFor: "Community consultation",
    skills: ["Property Law", "Founder Agreements", "IP Trademarks", "Contract Review"],
    isMentor: false,
    isFreelancer: true,
    teachesInAcademy: false,
    reputationScore: 97,
    contactPreference: "IN_APP_MESSAGE",
    avatar: "RV",
  },
];

export function ProfessionalDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MENTORS" | "FREELANCERS" | "ACADEMY" | "TECH" | "LEGAL_FINANCE">("ALL");
  const [selectedNeighbor, setSelectedNeighbor] = useState<DiscoverableNeighbor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingTopic, setBookingTopic] = useState("System Design / Career Advice");

  const filteredNeighbors = MOCK_NEIGHBORS.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      n.fullName.toLowerCase().includes(q) ||
      n.profession.toLowerCase().includes(q) ||
      n.company.toLowerCase().includes(q) ||
      n.canHelpWith.toLowerCase().includes(q) ||
      n.skills.some((s) => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeFilter === "MENTORS") return n.isMentor;
    if (activeFilter === "FREELANCERS") return n.isFreelancer;
    if (activeFilter === "ACADEMY") return n.teachesInAcademy;
    if (activeFilter === "TECH") return n.skills.some((s) => ["Java", "AWS", "Product Strategy", "Figma"].includes(s));
    if (activeFilter === "LEGAL_FINANCE") return n.skills.some((s) => ["Corporate Tax", "Property Law", "GST"].includes(s));

    return true;
  });

  const handleBookSession = () => {
    toast.success(`Mentorship session requested with ${selectedNeighbor?.fullName}! Notification sent in-app.`);
    setBookingModalOpen(false);
  };

  const handleSendMessage = (neighbor: DiscoverableNeighbor) => {
    toast.info(`Opened private in-app conversation with ${neighbor.fullName}. PII is protected.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Verified Professional Directory</h2>
            <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full backdrop-blur-md">
              Hyperlocal & Privacy-Protected
            </span>
          </div>
          <p className="text-indigo-150 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Discover verified engineers, lawyers, CAs, product managers, and founders living in your community. Ask for skill help, book 1:1 mentorship, or hire resident consultants.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[160px]">
          <div className="text-2xl font-black">{MOCK_NEIGHBORS.length}</div>
          <div className="text-[11px] text-indigo-200 font-bold">Verified Professionals in Community</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by skill (AWS, Java, CA, Lawyer, Tax, Figma), name, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[
            { key: "ALL", label: "All Professionals" },
            { key: "MENTORS", label: "🎓 Mentors & Guides" },
            { key: "FREELANCERS", label: "💼 Freelance & Consultants" },
            { key: "ACADEMY", label: "📚 Academy Instructors" },
            { key: "TECH", label: "💻 Tech & Product" },
            { key: "LEGAL_FINANCE", label: "⚖️ CA & Legal Counsel" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.key
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Neighbor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNeighbors.map((neighbor) => (
          <div
            key={neighbor.id}
            className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {neighbor.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">{neighbor.fullName}</h3>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{neighbor.profession}</p>
                    <p className="text-[10px] text-slate-500">{neighbor.company} · {neighbor.location}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-[10px] font-black rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                  ★ {neighbor.reputationScore}
                </span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {neighbor.isMentor && (
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                    🎓 Mentor
                  </span>
                )}
                {neighbor.isFreelancer && (
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[9px] font-bold rounded-lg border border-blue-200 dark:border-blue-800">
                    💼 Consultant
                  </span>
                )}
                {neighbor.teachesInAcademy && (
                  <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[9px] font-bold rounded-lg border border-purple-200 dark:border-purple-800">
                    📚 Academy Instructor
                  </span>
                )}
              </div>

              {/* Can Help With Highlight */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div className="text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Can help neighbors with:
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {neighbor.canHelpWith}
                </p>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {neighbor.skills.slice(0, 4).map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-medium rounded-md">
                    {s}
                  </span>
                ))}
                {neighbor.skills.length > 4 && (
                  <span className="px-2 py-0.5 text-slate-400 text-[9px]">+{neighbor.skills.length - 4} more</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => handleSendMessage(neighbor)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>

              {neighbor.isMentor && (
                <button
                  onClick={() => {
                    setSelectedNeighbor(neighbor);
                    setBookingModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book 1:1
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && selectedNeighbor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Book 1:1 Mentorship Session</h3>
              </div>
              <button onClick={() => setBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Request a 30-minute community consultation with <strong>{selectedNeighbor.fullName}</strong> ({selectedNeighbor.profession} at {selectedNeighbor.company}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Session Topic</label>
              <select
                value={bookingTopic}
                onChange={(e) => setBookingTopic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
              >
                <option value="System Design / Architecture Review">System Design / Architecture Review</option>
                <option value="Career Mentorship & FAANG Prep">Career Mentorship & Interview Guidance</option>
                <option value="Startup Pitch & Tech Advisory">Startup Tech Advisory & Co-Founder Chat</option>
                <option value="Tax & Legal Due Diligence">Tax, GST & Legal Advisory</option>
              </select>
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300">
              💡 Mentorship is hosted inside the community clubhouse or via private Google Meet.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSession}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
