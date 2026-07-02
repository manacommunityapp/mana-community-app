import { Briefcase, Building2, MapPin, DollarSign, Clock, Users, Plus, Upload } from "lucide-react";

export function Jobs() {
  const jobs = [
    {
      id: 1,
      title: "Senior Frontend Engineer",
      company: "TechCorp India",
      location: "Hybrid (Bangalore)",
      type: "Full-time",
      salary: "₹25L - ₹35L",
      postedBy: "Rahul Verma (Tower A)",
      isReferral: true,
      posted: "2 days ago"
    },
    {
      id: 2,
      title: "Product Marketing Manager",
      company: "GrowthX",
      location: "Remote",
      type: "Full-time",
      salary: "₹18L - ₹24L",
      postedBy: "Neha Singh (Villa 12)",
      isReferral: true,
      posted: "5 days ago"
    },
    {
      id: 3,
      title: "Part-time Math Tutor",
      company: "Local Learning Center",
      location: "On-site (Community Club)",
      type: "Part-time",
      salary: "₹500/hr",
      postedBy: "Community Admin",
      isReferral: false,
      posted: "1 week ago"
    }
  ];

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Professional Network</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Jobs & Referrals</h1>
          <p className="text-[#6b7094] text-sm mt-1">Leverage your trusted community network for career growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#374151] text-xs font-bold rounded-xl transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload Resume
          </button>
          <button className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            Post a Job
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex items-center gap-4">
          <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0d0d2b]">42</div>
            <div className="text-xs text-[#6b7094] font-semibold mt-0.5">Active Job Openings</div>
          </div>
        </div>
        
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex items-center gap-4">
          <div className="h-11 w-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0d0d2b]">18</div>
            <div className="text-xs text-[#6b7094] font-semibold mt-0.5">Internal Referrals Available</div>
          </div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex items-center gap-4">
          <div className="h-11 w-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0d0d2b]">156</div>
            <div className="text-xs text-[#6b7094] font-semibold mt-0.5">Companies in Network</div>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
        <div className="px-6 py-4.5 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#0d0d2b]">Recent Job Postings</h2>
          <button className="text-xs text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer">View All</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 hover:bg-indigo-50/20 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base font-extrabold text-[#0d0d2b]">{job.title}</h3>
                    {job.isReferral && (
                      <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        Referral Available
                      </span>
                    )}
                  </div>
                  <div className="text-[#374151] font-semibold text-sm mb-3.5">{job.company}</div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6b7094]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#6b7094]" /> {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#6b7094]" /> {job.type}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#6b7094]" /> {job.salary}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start sm:items-end gap-2.5 sm:w-48">
                  <button className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-all cursor-pointer">
                    {job.isReferral ? "Ask for Referral" : "Apply Now"}
                  </button>
                  <div className="text-[10px] text-[#6b7094] text-left sm:text-right font-medium">
                    Posted by {job.postedBy} • {job.posted}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
