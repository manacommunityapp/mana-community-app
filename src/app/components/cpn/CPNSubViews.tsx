import { useState } from "react";
import {
  Share2, Award, Users, Globe, ExternalLink, BookOpen, Star, Video, Play, Building2,
  MapPin, Store, Calendar, ArrowRight, Rocket, Shield, Handshake, Mail, MessageSquare,
  FileText, Plus, CheckCircle, Download, Eye, Trophy, Target, BarChart3, TrendingUp,
  Briefcase, Heart, UserPlus
} from "lucide-react";

// ── 1. REFERRAL MARKETPLACE ──────────────────────────────────────────────────
export function CPNReferrals() {
  const [referrals] = useState([
    { id: 1, company: "Google", role: "L5 Senior Software Engineer", postedBy: "Rahul V · B-201", reward: "₹50,000", positions: 3 },
    { id: 2, company: "Razorpay", role: "Senior Product Manager", postedBy: "Arjun Mehta · Villa 5", reward: "₹25,000", positions: 1 },
    { id: 3, company: "Swiggy", role: "Lead UI/UX Designer", postedBy: "Sneha Nair · A-102", reward: "₹30,000", positions: 2 },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Referral Marketplace
        </h2>
        <p className="text-indigo-150 text-xs mt-1 leading-relaxed">
          Refer neighbors for jobs in your company or request referrals from experts living in the community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {referrals.map((ref) => (
          <div key={ref.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-755 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-850">
                {ref.company}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Reward: {ref.reward}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs mt-3 leading-tight">{ref.role}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Posted by {ref.postedBy}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">{ref.positions} positions open</span>
              <button className="text-[10px] text-indigo-650 dark:text-indigo-400 font-black flex items-center gap-1 hover:underline cursor-pointer">
                Ask Referral <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2. FREELANCE PROJECTS ────────────────────────────────────────────────────
export function CPNFreelance() {
  const [projects] = useState([
    { id: 1, title: "E-Commerce Mobile App (React Native)", budget: "₹80,000 - ₹1,20,000", duration: "1 month", client: "Vikram S · Block C", proposals: 12 },
    { id: 2, title: "Company Website Design & SEO", budget: "₹45,000 - ₹60,000", duration: "3 weeks", client: "Ananya K · Block B", proposals: 8 },
    { id: 3, title: "AI Chatbot API Integration (Next.js)", budget: "₹35,000 - ₹50,000", duration: "2 weeks", client: "Amit D · Villa 12", proposals: 5 },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Globe className="w-5 h-5" /> Freelance Gigs & Projects
          </h2>
          <p className="text-blue-150 text-xs mt-1 leading-relaxed">
            Hire local talent for freelance projects or bid on community assignments with escrow protection.
          </p>
        </div>
        <button className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-black transition-all cursor-pointer">
          Post Project
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{proj.title}</h3>
              <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mt-2">
                <span>Budget: <strong className="text-slate-700 dark:text-slate-300">{proj.budget}</strong></span>
                <span>Duration: <strong>{proj.duration}</strong></span>
                <span>Client: <strong>{proj.client}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-450">{proj.proposals} proposals received</span>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                Submit Proposal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. LEARNING PLATFORM ─────────────────────────────────────────────────────
export function CPNLearning() {
  const [courses] = useState([
    { id: 1, title: "System Design for FAANG Interviews", instructor: "Dr. Kavitha Rao · Microsoft", rating: "4.9", students: "128", hours: "12 hrs", cost: "Free" },
    { id: 2, title: "Complete UI/UX Figma Masterclass", instructor: "Sneha Nair · Swiggy", rating: "4.8", students: "94", hours: "8 hrs", cost: "₹499" },
    { id: 3, title: "Next.js 14 Production-ready Scaffold", instructor: "Rahul V · Google", rating: "4.7", students: "73", hours: "6 hrs", cost: "Free" },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Community Academy & Learning
        </h2>
        <p className="text-purple-150 text-xs mt-1 leading-relaxed">
          Level up your skills with workshops, courses, and certifications created by resident tech leaders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center h-32 relative">
              <Play className="w-10 h-10 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1E1E36] p-2.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform" />
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold rounded">
                {course.cost}
              </span>
            </div>
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{course.title}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Instructor: {course.instructor}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-450 pt-2 border-t border-slate-105 dark:border-slate-800">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-400" />{course.rating}</span>
                <span>{course.students} students</span>
                <span>{course.hours}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. COMPANY PORTAL ────────────────────────────────────────────────────────
export function CPNCompanies() {
  const [companies] = useState([
    { id: 1, name: "Google", residents: 14, openJobs: 5, industry: "Tech / Software", logo: "G" },
    { id: 2, name: "Microsoft", residents: 8, openJobs: 2, industry: "Tech / Software", logo: "MS" },
    { id: 3, name: "Razorpay", residents: 5, openJobs: 4, industry: "Fintech", logo: "RP" },
    { id: 4, name: "Flipkart", residents: 12, openJobs: 3, industry: "E-Commerce", logo: "FK" },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Gated Company Directory
        </h2>
        <p className="text-emerald-150 text-xs mt-1 leading-relaxed">
          Discover which companies your neighbors work for. Tap into internal referrals and corporate connection networks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black text-sm flex items-center justify-center rounded-xl">
              {company.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-none">{company.name}</h3>
              <p className="text-[10px] text-slate-500 mt-1">{company.industry}</p>
              <div className="flex gap-4 mt-3 text-[10px] text-slate-655">
                <span><strong>{company.residents}</strong> neighbors work here</span>
                <span><strong>{company.openJobs}</strong> active openings</span>
              </div>
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 cursor-pointer">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5. BUSINESS DIRECTORY ────────────────────────────────────────────────────
export function CPNBusiness() {
  const [businesses] = useState([
    { id: 1, name: "Mana Tech Solutions", service: "IT Consulting & Custom Software", owner: "Amit D · Block C", rating: "4.9", contact: "+91 98765 43210" },
    { id: 2, name: "Cozy Designs Studio", service: "Interior Design & Architecture", owner: "Pooja R · Villa 22", rating: "4.8", contact: "+91 87654 32109" },
    { id: 3, name: "Smart Taxes", service: "CA, GST & Auditing Services", owner: "Sanjay M · Block A", rating: "4.7", contact: "+91 76543 21098" },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Store className="w-5 h-5" /> Local Business Directory
          </h2>
          <p className="text-cyan-150 text-xs mt-1 leading-relaxed">
            Support resident-owned businesses, consultants, and service agencies right in the community.
          </p>
        </div>
        <button className="px-4 py-2 bg-white text-cyan-700 hover:bg-cyan-50 rounded-xl text-xs font-black transition-all cursor-pointer">
          Register Business
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {businesses.map((biz) => (
          <div key={biz.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{biz.name}</h3>
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                  ★ {biz.rating}
                </span>
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1.5">{biz.service}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2">Owner: {biz.owner}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-450">{biz.contact}</span>
              <button className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black cursor-pointer hover:underline">Book Quote</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 6. STARTUP HUB ───────────────────────────────────────────────────────────
export function CPNStartups() {
  const [startups] = useState([
    { id: 1, name: "Krypton Health", pitch: "AI-driven local diagnostic dashboards", founders: "Dr. Kabir & Sneha Nair", status: "Seed Funded", raising: "₹1.5 Cr" },
    { id: 2, name: "ChargeSync", pitch: "Decentralized EV charging grids for apartments", founders: "Vikram Rao · Villa 8", status: "Bootstrap", raising: "₹80 L" },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Startup & Innovation Hub
          </h2>
          <p className="text-red-150 text-xs mt-1 leading-relaxed">
            Showcase your startup pitch, meet potential co-founders, or access community angel networks.
          </p>
        </div>
        <button className="px-4 py-2 bg-white text-red-750 hover:bg-red-50 rounded-xl text-xs font-black transition-all cursor-pointer">
          List Startup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startups.map((st) => (
          <div key={st.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-none">{st.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1.5">Founders: {st.founders}</p>
              </div>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[9px] font-bold rounded-lg border border-red-200 dark:border-red-900">
                {st.status}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed italic">"{st.pitch}"</p>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500">Target Raise: <strong className="text-slate-850 dark:text-white">{st.raising}</strong></span>
              <button className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black hover:underline cursor-pointer">View Pitch Deck →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 7. COLLABORATE ───────────────────────────────────────────────────────────
export function CPNCollaborate() {
  const [groups] = useState([
    { id: 1, name: "Mana Developers Alliance", goal: "Open-source projects & library development", members: 24, activity: "Active" },
    { id: 2, name: "Product Managers Guild", goal: "Case study sessions & GTM teardowns", members: 15, activity: "Meeting Sundays" },
    { id: 3, name: "Angel Investors Circle", goal: "Pitch screenings & investment pooling", members: 8, activity: "Bi-weekly" },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <Handshake className="w-5 h-5" /> Cross-Community Collaboration
        </h2>
        <p className="text-amber-150 text-xs mt-1 leading-relaxed">
          Form professional interest alliances, pool knowledge resources, and co-invest in early-stage deals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{group.name}</h3>
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{group.goal}</p>
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-450">{group.members} members · {group.activity}</span>
              <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors cursor-pointer">Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 8. RESUME BUILDER ────────────────────────────────────────────────────────
export function CPNResume() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-650 to-purple-650 rounded-2xl p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-base font-black flex items-center gap-2">
            <FileText className="w-5 h-5" /> AI Resume Optimizer
          </h2>
          <p className="text-indigo-150 text-xs mt-1 leading-relaxed">
            Format, parse, and optimize your resume for applicant tracking systems (ATS) using OpenAI GPT-4o algorithms.
          </p>
        </div>
        <button className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer">
          <Plus className="w-4 h-4" /> Upload PDF Resume
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <FileText className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Drag and drop your resume file here</h3>
          <p className="text-slate-400 text-[10px]">Supports DOCX, PDF up to 5 MB</p>
          <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-white dark:bg-[#1E1E36] hover:bg-slate-50 cursor-pointer">
            Browse Files
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-55 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-750">
            <h4 className="font-bold text-xs text-indigo-650 dark:text-indigo-455">ATS Keywords Matcher</h4>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1">Automatically extracts and suggests missing keywords based on the jobs you apply to.</p>
          </div>
          <div className="p-4 bg-slate-55 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-750">
            <h4 className="font-bold text-xs text-purple-650 dark:text-purple-455">One-click Export</h4>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1">Export in professional standard formats accepted globally by tech enterprises.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 9. ACHIEVEMENTS & GAMIFICATION ──────────────────────────────────────────
export function CPNGamification() {
  const [achievements] = useState([
    { id: 1, name: "Community Helper", desc: "Referred 3 neighbors for open job roles", points: 300, progress: 100, completed: true },
    { id: 2, name: "Knowledge Sharer", desc: "Published a technical article on the Professional Feed", points: 150, progress: 100, completed: true },
    { id: 3, name: "Guide of Mana", desc: "Host 5 mentorship sessions in community academy", points: 500, progress: 60, completed: false },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-350" /> CPN Achievements & Points
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            Complete networking milestones, earn badges, and redeem points for community privileges.
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/30">
          <div className="text-sm font-black">850 Points</div>
          <div className="text-[9px] text-amber-100">Current Level: Expert</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <div key={ach.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{ach.name}</h3>
                {ach.completed ? (
                  <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold">+{ach.points} pts</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{ach.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-[9px] text-slate-450 mb-1">
                <span>Progress</span>
                <span>{ach.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${ach.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 10. ANALYTICS DASHBOARD ──────────────────────────────────────────────────
export function CPNAnalytics() {
  const stats = [
    { label: "Profile Impressions", value: "1,240", change: "+18% vs last week", color: "text-indigo-650" },
    { label: "Search Appearances", value: "318", change: "+8% vs last week", color: "text-emerald-600" },
    { label: "Connection Requests", value: "48", change: "Similar to last week", color: "text-purple-650" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Analytics Dashboard
        </h2>
        <p className="text-indigo-150 text-xs mt-1">
          Monitor your professional visibility, search stats, and connection milestones within the community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((st) => (
          <div key={st.label} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{st.label}</p>
            <div className={`text-xl font-black mt-2 ${st.change.includes("+") ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
              {st.value}
            </div>
            <div className="text-[10px] text-emerald-650 dark:text-emerald-450 mt-1 font-bold">{st.change}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Top Job Skill Demand in Community</h3>
        <div className="space-y-2">
          {[
            { skill: "React / React Native", demand: "Heavy", count: "12 openings" },
            { skill: "AWS Cloud / DevOps", demand: "High", count: "8 openings" },
            { skill: "UI/UX Prototyping", demand: "Moderate", count: "4 openings" },
          ].map((item) => (
            <div key={item.skill} className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="font-bold text-slate-700 dark:text-slate-300">{item.skill}</span>
              <div className="flex gap-4 text-[10px]">
                <span className="text-indigo-650 font-bold uppercase">{item.demand}</span>
                <span className="text-slate-450">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 11. MY NETWORK (CONNECTIONS & DISCOVERY) ─────────────────────────────────
export function CPNNetwork() {
  const [connections, setConnections] = useState([
    { id: 1, name: "Sneha Patel", role: "UX Designer @ Swiggy", flat: "A-201", mutual: 5, avatar: "SP", connected: true },
    { id: 2, name: "Kiran Reddy", role: "Product @ Zepto", flat: "Villa 3", mutual: 12, avatar: "KR", connected: true },
    { id: 3, name: "Amit Sharma", role: "Backend Architect @ AWS", flat: "C-104", mutual: 8, avatar: "AS", connected: false },
  ]);

  const toggleConnect = (id: number) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-650 to-indigo-650 rounded-2xl p-6 text-white">
        <h2 className="text-base font-black flex items-center gap-2">
          <Users className="w-5 h-5" /> Professional Connections
        </h2>
        <p className="text-violet-150 text-xs mt-1 leading-relaxed">
          Manage your connections and expand your network with verified industry practitioners living near you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {connections.map((c) => (
          <div key={c.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-black text-lg flex items-center justify-center rounded-full mb-3 shadow-md shadow-indigo-500/10">
              {c.avatar}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">{c.name}</h3>
            <p className="text-[10px] text-slate-500 mt-1 truncate max-w-full">{c.role}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{c.flat} · {c.mutual} mutual connections</p>
            
            <button
              onClick={() => toggleConnect(c.id)}
              className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                c.connected
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}
            >
              {c.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
