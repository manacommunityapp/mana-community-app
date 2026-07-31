import { useState } from "react";
import {
  ThumbsUp, MessageCircle, Share2, Bookmark,
  BookmarkCheck, Image as ImageIcon, Video, Link as LinkIcon,
  MoreHorizontal, Send, Sparkles, Hash, TrendingUp,
  Briefcase, UserPlus, Award
} from "lucide-react";

interface Author {
  name: string;
  role: string;
  avatar: string;
  flat: string;
  verified: boolean;
}

interface Post {
  id: number;
  author: Author;
  time: string;
  type: string;
  content: string;
  hashtags: string[];
  reactions: { like: number; celebrate: number; insightful: number };
  comments: number;
  saved: boolean;
  isAnnouncement?: boolean;
  isJob?: boolean;
  jobTag?: string;
}

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    author: { name: "Priya Sharma", role: "Senior Engineer @ Google", avatar: "PS", flat: "A-304", verified: true },
    time: "2h ago",
    type: "achievement",
    content: "Thrilled to announce that I've just received an offer from Google as Senior Software Engineer! 🎉\n\nThis journey wasn't easy — 6 rounds of interviews, countless mock sessions, and incredible support from our community here at Mana Gardens. A huge thanks to Rahul (B-201) for the referral and to our CPN mentorship group!\n\n#CareerGrowth #GoogleHire #ManaGardens",
    hashtags: ["CareerGrowth", "GoogleHire", "ManaGardens"],
    reactions: { like: 84, celebrate: 42, insightful: 12 },
    comments: 18,
    saved: false,
    isAnnouncement: true,
  },
  {
    id: 2,
    author: { name: "Vikram Rao", role: "Founder @ BuildRight", avatar: "VR", flat: "Villa 8", verified: false },
    time: "5h ago",
    type: "job",
    content: "🔥 We're hiring! BuildRight is looking for a Senior React Developer (Remote-friendly).\n\nAs a fellow resident here in our community, I'd love to give preference to our neighbors first!\n\n✅ 4+ years React experience\n✅ Strong TypeScript skills\n✅ Salary: ₹22L-₹32L\n\nDM me or click Apply. Community members get priority screening! 🏠",
    hashtags: ["Hiring", "ReactJS", "CommunityJobs"],
    reactions: { like: 47, celebrate: 5, insightful: 8 },
    comments: 22,
    saved: true,
    isJob: true,
    jobTag: "React Developer • Remote • ₹22L-32L",
  },
  {
    id: 3,
    author: { name: "Ananya Krishnan", role: "AI/ML Engineer @ Infosys", avatar: "AK", flat: "B-102", verified: true },
    time: "Yesterday",
    type: "article",
    content: "Just published my article: \"How I cracked System Design interviews in 3 weeks\" 📝\n\nKey areas I focused on:\n→ Distributed systems fundamentals\n→ Database design patterns\n→ Real-world case studies (Twitter, Uber, Netflix)\n→ Mock interviews with our community group\n\nLink in comments! Happy to mentor anyone preparing for FAANG interviews.",
    hashtags: ["SystemDesign", "FAANG", "TechCareers"],
    reactions: { like: 132, celebrate: 0, insightful: 67 },
    comments: 34,
    saved: false,
  },
];

const TRENDING_TOPICS = [
  { tag: "HiringNow", count: "142 posts" },
  { tag: "SystemDesign", count: "89 posts" },
  { tag: "StartupHiring", count: "76 posts" },
  { tag: "AICareer", count: "54 posts" },
  { tag: "RemoteJobs", count: "48 posts" },
];

const SUGGESTED_PEOPLE = [
  { name: "Arjun Nair", role: "DevOps @ AWS", flat: "C-506", mutual: 8, avatar: "AN" },
  { name: "Sneha Patel", role: "UX Designer @ Swiggy", flat: "A-201", mutual: 5, avatar: "SP" },
  { name: "Kiran Reddy", role: "Product @ Zepto", flat: "Villa 3", mutual: 12, avatar: "KR" },
];

function Avatar({ initials, size = "md", color = "indigo" }: { initials: string; size?: "sm" | "md" | "lg"; color?: "indigo" | "violet" | "emerald" | "amber" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const colors = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  };
  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full flex items-center justify-center font-black flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ReactionBar({ post, onReact, onSave }: { post: Post; onReact: (id: number, type: string) => void; onSave: (id: number) => void }) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="relative">
        <button
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
          onClick={() => onReact(post.id, "like")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] hover:text-indigo-600 transition-colors font-bold"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{post.reactions.like + post.reactions.celebrate + post.reactions.insightful}</span>
        </button>
        {showReactions && (
          <div
            className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg px-2 py-1.5 z-10"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {["👍", "🎉", "💡", "❤️", "🤔"].map((emoji) => (
              <button key={emoji} className="text-lg hover:scale-125 transition-transform px-1">{emoji}</button>
            ))}
          </div>
        )}
      </div>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] hover:text-indigo-600 transition-colors font-bold">
        <MessageCircle className="w-4 h-4" />
        <span>{post.comments}</span>
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] transition-colors font-bold">
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <button
        onClick={() => onSave(post.id)}
        className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors font-bold ${
          post.saved ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644]"
        }`}
      >
        {post.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
    </div>
  );
}

function PostCard({ post, onReact, onSave }: { post: Post; onReact: (id: number, type: string) => void; onSave: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 280;
  const displayContent = isLong && !expanded ? post.content.slice(0, 280) + "…" : post.content;

  return (
    <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar initials={post.author.avatar} color="indigo" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white text-xs">{post.author.name}</span>
            {post.author.verified && (
              <span className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{post.author.role} · {post.author.flat}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{post.time}</div>
        </div>

        {post.isAnnouncement && (
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" /> Achievement
          </span>
        )}
        {post.isJob && (
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Job
          </span>
        )}
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#262644]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-2">
        {displayContent}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-600 dark:text-indigo-400 font-bold ml-1 hover:underline cursor-pointer"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Job Tag */}
      {post.jobTag && (
        <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{post.jobTag}</span>
          </div>
          <button className="text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            Apply Now
          </button>
        </div>
      )}

      {/* Hashtags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {post.hashtags.map((tag) => (
          <button key={tag} className="text-[10px] text-indigo-600 dark:text-indigo-450 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
            #{tag}
          </button>
        ))}
      </div>

      {/* Reaction counts */}
      {(post.reactions.like + post.reactions.celebrate + post.reactions.insightful) > 0 && (
        <div className="text-[10px] text-slate-400 mb-2">
          {["👍", "🎉", "💡"].join(" ")} {post.reactions.like + post.reactions.celebrate + post.reactions.insightful} reactions · {post.comments} comments
        </div>
      )}

      <ReactionBar post={post} onReact={onReact} onSave={onSave} />
    </div>
  );
}

function PostComposer() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <Avatar initials="ME" color="indigo" />
        <div className="flex-1">
          <textarea
            placeholder="Share an update, job opportunity, or achievement with your community..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            rows={focused || text ? 3 : 1}
            className="w-full resize-none text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 border-0 focus:outline-none bg-transparent transition-all"
          />
          {(focused || text) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-1">
                {[
                  { icon: ImageIcon, label: "Photo" },
                  { icon: Video, label: "Video" },
                  { icon: Briefcase, label: "Job" },
                  { icon: LinkIcon, label: "Link" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors font-bold cursor-pointer">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                disabled={!text.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CPNFeed() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = ["all", "jobs", "achievements", "articles", "events"];

  const handleReact = (postId: number, type: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, reactions: { ...p.reactions, like: p.reactions.like + 1 } } : p
    ));
  };

  const handleSave = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                activeFilter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* AI Insight Banner */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-indigo-200 dark:border-indigo-850 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-indigo-950 dark:text-indigo-350">AI Insight for you</p>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed font-semibold">
              3 neighbors are hiring React developers this week. Your profile matches 85%+ of requirements.
            </p>
          </div>
          <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer">View →</button>
        </div>

        <PostComposer />

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onReact={handleReact} onSave={handleSave} />
        ))}
      </div>

      {/* Right: Sidebar */}
      <div className="space-y-4">
        {/* Profile Snapshot */}
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-black text-lg mb-2">
              ME
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-xs">Alex Johnson</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Software Engineer · Tower A</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Profile 72% complete</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3">
            {[["248", "Connections"], ["1.2K", "Views"], ["12", "Matches"]].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <div className="font-black text-slate-900 dark:text-white text-xs">{val}</div>
                <div className="text-[9px] text-slate-400">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Trending in Your Community
          </h3>
          <div className="space-y-2">
            {TRENDING_TOPICS.map((t, i) => (
              <button key={t.tag} className="w-full flex items-center justify-between py-1.5 text-slate-700 dark:text-slate-350 hover:text-indigo-600 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-xs font-bold group-hover:text-indigo-600">{t.tag}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* People You May Know */}
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-3">People You May Know</h3>
          <div className="space-y-3">
            {SUGGESTED_PEOPLE.map((p) => (
              <div key={p.name} className="flex items-start gap-3 justify-between">
                <Avatar initials={p.avatar} size="sm" color="violet" />
                <div className="flex-1 min-w-0 ml-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{p.role}</p>
                  <p className="text-[9px] text-slate-400">{p.flat} · {p.mutual} mutual</p>
                </div>
                <button className="text-[10px] px-2 py-1 border border-indigo-300 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer">
                  <UserPlus className="w-3 h-3" />
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
