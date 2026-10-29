import { useState } from "react";
import {
  User, Shield, Sparkles, CheckCircle, Save,
  Eye, EyeOff, Lock, Unlock, Mail, Phone,
  FileText, Briefcase, GraduationCap, Globe,
  Award, Zap, Plus, X, AlertCircle, Info, Sliders
} from "lucide-react";
import { toast } from "react-toastify";

export function MyProfessionalProfile() {
  const [activeTab, setActiveTab] = useState<"profile" | "privacy">("profile");

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: "Sandeep Kumar",
    headline: "Staff Software Engineer · Cloud & Distributed Systems",
    profession: "Staff Software Engineer",
    company: "Google Cloud",
    experienceYears: 8,
    industry: "Technology & Cloud Platforms",
    summary: "Senior engineer passionate about high-throughput distributed systems, event-driven architectures, and community knowledge sharing. Open to advising early-stage resident startups.",
    location: "Bangalore, India",
    communityName: "Mana Residency",
    lookingFor: "Startups, Angel Deals, AI Collaboration",
    canHelpWith: "System Design, AWS / GCP Architecture, Spring Boot Microservices, Career Mentorship",
    interests: "Distributed Systems, Kubernetes, LLM Agents, FinTech, High-Scale Databases",
    servicesOffered: "Architecture Review, Technical Mentoring, Startup Tech Due Diligence",
    availability: "Saturdays 10 AM - 1 PM",
    isOpenToWork: false,
    isMentor: true,
    isFreelancer: true,
    teachesInAcademy: true,
    academyCourses: "System Design for Scalable Microservices, Cloud Architecture Mastery",
    githubUrl: "https://github.com/sandeep-mana",
    linkedinUrl: "https://linkedin.com/in/sandeep-mana",
    portfolioUrl: "https://sandeep.dev",
    skills: ["Java", "Spring Boot", "AWS", "Kubernetes", "PostgreSQL", "System Design", "Microservices", "Kafka"],
  });

  const [newSkill, setNewSkill] = useState("");

  // Privacy Matrix State
  const [privacy, setPrivacy] = useState({
    isDiscoverable: true,
    visibilityScope: "COMMUNITY_ONLY", // "COMMUNITY_ONLY" | "PUBLIC" | "PRIVATE"
    showProfession: true,
    showSkills: true,
    showCompany: true,
    showEmail: false,
    showPhone: false,
    showResume: false,
    allowRecruiterContact: true,
    allowMentorshipRequests: true,
    contactPreference: "IN_APP_MESSAGE", // "IN_APP_MESSAGE" | "EMAIL" | "PHONE"
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleSaveProfile = () => {
    toast.success("Professional Profile updated successfully!");
  };

  const handleSavePrivacy = () => {
    toast.success("Privacy Matrix & Access Controls saved!");
  };

  return (
    <div className="space-y-6">
      {/* Hero Card with Completion Meter */}
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-indigo-200 text-indigo-950 font-black text-2xl rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{profile.fullName}</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Community Verified
                </span>
              </div>
              <p className="text-indigo-200 text-xs sm:text-sm font-semibold mt-1">
                {profile.profession} · {profile.company}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-indigo-150">
                <span>📍 {profile.communityName}</span>
                <span>•</span>
                <span>⭐ {profile.experienceYears} Years Experience</span>
                {profile.isMentor && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">🎓 Verified Mentor</span>
                  </>
                )}
                {profile.teachesInAcademy && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-300 font-bold">📚 Academy Instructor</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI Score Badge */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 min-w-[200px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-black text-indigo-100 mb-1.5">
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Profile Strength</span>
              <span className="text-white font-bold">92%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style={{ width: "92%" }} />
            </div>
            <p className="text-[10px] text-indigo-200 mt-2">
              Excellent! Your profile is highly visible for neighbor mentorship and referrals.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" /> Professional Profile & Skills
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-2 pb-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === "privacy"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" /> Privacy Matrix & Access Controls
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Core Professional Identity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Let neighbors know your background, current role, and expertise.</p>
              </div>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>

            {/* Grid 1: Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Profession / Title</label>
                <input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                  placeholder="e.g. Chartered Accountant, Software Architect"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Current Company</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="e.g. Google Cloud, Deloitte, Self-Employed"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  value={profile.experienceYears}
                  onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Industry / Domain</label>
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  placeholder="e.g. FinTech, Healthcare, Architecture"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Weekly Availability</label>
                <input
                  type="text"
                  value={profile.availability}
                  onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                  placeholder="e.g. Weekends 10 AM - 1 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Headline & Summary */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Professional Headline</label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">About & Bio</label>
              <textarea
                rows={3}
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            {/* Hyperlocal Community Exchange: Can Help With & Looking For */}
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200">Hyperlocal Skill Exchange & Collaboration</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    🤝 What I Can Help Neighbors With (Mentorship & Advice)
                  </label>
                  <input
                    type="text"
                    value={profile.canHelpWith}
                    onChange={(e) => setProfile({ ...profile, canHelpWith: e.target.value })}
                    placeholder="e.g. AWS Migration, Resume Review, Tax Planning, Seed Pitching"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1E1E36] border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Neighbors will see this when searching for skill mentors.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    🎯 What I Am Looking For (Collaborators / Opportunities)
                  </label>
                  <input
                    type="text"
                    value={profile.lookingFor}
                    onChange={(e) => setProfile({ ...profile, lookingFor: e.target.value })}
                    placeholder="e.g. Startup Co-Founders, Angel Investment Deals, AI Hackathons"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1E1E36] border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Connect with neighbors working on aligned initiatives.</p>
                </div>
              </div>
            </div>

            {/* Skills & Tag Management */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">Verified Skills & Tools</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-850 shadow-xs"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add a new skill (e.g. Docker, Figma, Tax Law)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Ecosystem Badges & Flags */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isMentor}
                  onChange={(e) => setProfile({ ...profile, isMentor: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Active Mentor</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Accept 1:1 30-minute mentoring calls from neighbors</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isFreelancer}
                  onChange={(e) => setProfile({ ...profile, isFreelancer: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Freelance Consultant</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Available for local client projects & contract gigs</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.teachesInAcademy}
                  onChange={(e) => setProfile({ ...profile, teachesInAcademy: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">Mana Academy Instructor</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Host workshops & masterclasses in community clubhouse</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy Matrix Switchboard */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Privacy Matrix & Granular Controls
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You have 100% control over what neighbors and recruiters see. Phone and Email are protected by default.
                </p>
              </div>
              <button
                onClick={handleSavePrivacy}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Privacy Settings
              </button>
            </div>

            {/* Global Discoverability Switch */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${privacy.isDiscoverable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-200 text-slate-600"}`}>
                  {privacy.isDiscoverable ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Discoverable to Verified Community Neighbors
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    When turned off, your profile will not show in skill search or neighbor directory.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.isDiscoverable}
                  onChange={(e) => setPrivacy({ ...privacy, isDiscoverable: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Granular Field Visibility Switches */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Field-Level Visibility Permissions
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Show Profession */}
                <div className="p-3.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Show Profession & Title</div>
                    <div className="text-[10px] text-slate-500">Visible on your card in neighbor searches</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showProfession}
                    onChange={(e) => setPrivacy({ ...privacy, showProfession: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Show Company */}
                <div className="p-3.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Show Current Employer</div>
                    <div className="text-[10px] text-slate-500">If hidden, displays "Confidential Company"</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showCompany}
                    onChange={(e) => setPrivacy({ ...privacy, showCompany: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Show Skills */}
                <div className="p-3.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Show Skill & Tool Tags</div>
                    <div className="text-[10px] text-slate-500">Allows skill-based matching for mentorship</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showSkills}
                    onChange={(e) => setPrivacy({ ...privacy, showSkills: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Show Resume */}
                <div className="p-3.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Allow Direct Resume Download</div>
                    <div className="text-[10px] text-slate-500">Otherwise available only after referral approval</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showResume}
                    onChange={(e) => setPrivacy({ ...privacy, showResume: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Show Phone (Strict default OFF) */}
                <div className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Show Phone Number
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">Recommended OFF — Use in-app messaging instead</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showPhone}
                    onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Show Email (Strict default OFF) */}
                <div className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Show Email Address
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">Recommended OFF — Prevents external spam</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showEmail}
                    onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Communication Channel */}
            <div className="p-4 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-black text-slate-900 dark:text-white mb-1.5">
                Default Communication Preference
              </label>
              <select
                value={privacy.contactPreference}
                onChange={(e) => setPrivacy({ ...privacy, contactPreference: e.target.value })}
                className="w-full sm:w-80 px-3.5 py-2.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="IN_APP_MESSAGE">💬 In-App Chat (Recommended & Private)</option>
                <option value="EMAIL">✉️ Masked Community Relay Email</option>
                <option value="PHONE">📞 Direct Call (If authorized)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
