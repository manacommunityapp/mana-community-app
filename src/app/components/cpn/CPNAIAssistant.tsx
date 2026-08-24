import { useState } from "react";
import {
  Bot, Send, Mic, Sparkles, FileText, Target,
  MessageSquare, IndianRupee, Map, Mail, Swords,
  ChevronRight, User,
  RotateCcw, Download, Copy, CheckCheck
} from "lucide-react";

const Linkedin = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface Feature {
  id: string;
  icon: any;
  label: string;
  desc: string;
  color: string;
}

const AI_FEATURES: Feature[] = [
  { id: "resume",    icon: FileText,  label: "Resume Review",      desc: "Get detailed AI feedback on your resume",           color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900" },
  { id: "skill",     icon: Target,    label: "Skill Gap Analysis",  desc: "Find missing skills for your dream role",           color: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900" },
  { id: "interview", icon: Swords,    label: "Interview Prep",      desc: "Practice answers with AI coaching",                color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  { id: "salary",    icon: IndianRupee,label: "Salary Prediction",   desc: "Know your market value instantly",                  color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900" },
  { id: "roadmap",   icon: Map,       label: "Career Roadmap",      desc: "Plan your 5-year career path with AI",              color: "bg-pink-50 dark:bg-pink-955/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900" },
  { id: "cover",     icon: Mail,      label: "Cover Letter",        desc: "Generate tailored cover letters",                   color: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900" },
  { id: "mock",      icon: MessageSquare, label: "Mock Interview",  desc: "Simulate real interviews with AI",                  color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900" },
  { id: "linkedin",  icon: Linkedin, label: "LinkedIn Optimizer", desc: "Boost your LinkedIn profile score",              color: "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900" },
];

const SUGGESTED_PROMPTS = [
  "Review my resume for a Senior Java Developer role at a product company",
  "What skills do I need to transition from Software Engineer to Product Manager?",
  "Help me prepare for a System Design interview at FAANG",
  "Predict my salary for 6 years of experience in React and Node.js in Bangalore",
  "Create a career roadmap to become a CTO in 10 years",
  "Write a cover letter for a Data Scientist role at Flipkart",
];

const generateMockResponse = (input: string) => {
  if (input.toLowerCase().includes("resume"))
    return `**Resume Analysis Complete** ✅\n\nHere's my detailed feedback:\n\n**Strengths:**\n• Strong technical skills section (Java, Spring Boot, React)\n• Clear career progression visible\n• Good quantifiable achievements\n\n**Areas for Improvement:**\n• Add a professional summary at the top (2–3 sentences)\n• Quantify impact: "Improved API performance by 40%"\n• Use action verbs: "Architected", "Led", "Delivered"\n• Add relevant certifications (AWS, Google Cloud)\n\n**ATS Score: 74/100** — Your resume matches 74% of common job filters.\n\nWould you like me to rewrite specific sections?`;

  if (input.toLowerCase().includes("salary"))
    return `**Salary Prediction** 💰\n\nBased on your profile and market data:\n\n**Bangalore Market Rates (2024):**\n• P25: ₹18L – ₹22L\n• **P50 (Your Range): ₹24L – ₹30L ← You are here**\n• P75: ₹32L – ₹42L\n• P90: ₹45L+\n\n**Comparison by Company Type:**\n• Startups: ₹22L + ESOPs\n• Product MNCs (Google, Amazon): ₹35L–₹55L\n• Service Companies: ₹18L–₹24L\n\n**Tips to increase your salary:**\n1. Get an AWS or GCP certification (+15–20%)\n2. Target product companies directly\n3. Practice salary negotiation (most leave 15–20% on table)\n\nWant me to draft a salary negotiation script?`;

  return `**Great question!** 🤖\n\nI've analyzed your request. Here's a comprehensive breakdown:\n\n**Key Insights:**\n• Your community has 12 professionals in this domain who can help\n• Market trends show strong demand in this area\n• Based on industry data, here are my top recommendations...\n\n**Action Steps:**\n1. Start with foundational knowledge in the core area\n2. Build a small project to demonstrate skills\n3. Network with the 3 experts in your community\n4. Apply to 5–10 companies per week\n\nWould you like me to dive deeper into any specific area?`;
};

interface Message {
  role: "user" | "assistant";
  content: string;
  id: number;
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**"))
        return <p key={i} className="font-bold text-slate-900 dark:text-white mt-2 mb-1 text-xs">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("• "))
        return <p key={i} className="pl-3 text-slate-600 dark:text-slate-400 text-xs">• {line.slice(2)}</p>;
      if (/^\d+\./.test(line))
        return <p key={i} className="pl-3 text-slate-600 dark:text-slate-400 text-xs">{line}</p>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-700 dark:text-slate-300 text-xs">{line}</p>;
    });
  };

  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-indigo-600 text-white text-xs rounded-2xl rounded-br-sm px-4 py-3 max-w-lg shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="space-y-0.5">
            {formatContent(msg.content)}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-slate-400">AI Career Coach</span>
          <button onClick={handleCopy} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer">
            {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CPNAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handleSend = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    setMessages((prev) => [...prev, { role: "user", content: userMsg, id: Date.now() }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const response = generateMockResponse(userMsg);
    setMessages((prev) => [...prev, { role: "assistant", content: response, id: Date.now() + 1 }]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => { setMessages([]); setActiveFeature(null); };

  const handleFeatureClick = (feature: Feature) => {
    setActiveFeature(feature.id);
    const prompts: Record<string, string> = {
      resume: "Please review my resume and give me detailed feedback to improve it.",
      skill: "Analyze my skills and tell me what gaps I need to fill to become a Senior Full-Stack Engineer.",
      interview: "I have an interview at a product company next week. Help me prepare for the technical and HR rounds.",
      salary: "I have 5 years of experience in Java and Spring Boot in Bangalore. What should my salary expectations be?",
      roadmap: "Create a personalized 5-year career roadmap for me to become a Software Architect.",
      cover: "Help me write a compelling cover letter for a Senior Product Manager role at a fintech startup.",
      mock: "Let's do a mock interview. Start with an introduction question and then ask me 3 technical questions.",
      linkedin: "Review my LinkedIn profile and tell me how to optimize it for better visibility and job opportunities.",
    };
    handleSend(prompts[feature.id]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: 500 }}>
      {/* Left: Feature Panel */}
      <div className="lg:col-span-1">
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-bold text-xs">AI Career Coach</h2>
            </div>
            <p className="text-indigo-200 text-[10px] font-semibold leading-relaxed">
              Powered by GPT-4o. Your personal career advisor, available 24/7.
            </p>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-indigo-200 font-bold">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Active · Community Premium</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1">Choose a Feature</p>
            <div className="space-y-2">
              {AI_FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm cursor-pointer ${
                    activeFeature === feature.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : `${feature.color} hover:opacity-90`
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeFeature === feature.id ? "bg-indigo-100 dark:bg-[#1E1E36]" : "bg-white/70 dark:bg-[#1E1E36]/70"}`}>
                    <feature.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{feature.label}</div>
                    <div className="text-[10px] opacity-70 truncate mt-0.5">{feature.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Chat Interface */}
      <div className="lg:col-span-2 flex flex-col bg-slate-50 dark:bg-[#15152b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[calc(100vh-320px)] min-h-[500px]">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1E1E36] border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">AI Career Coach</p>
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClear} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-lg transition-colors cursor-pointer">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-lg transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Bot className="w-8 h-8 text-white animate-bounce" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Your AI Career Coach</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Ask me anything about your career journey</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-xs text-left p-3 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-750 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-[#1E1E36] border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-2 items-end bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your career coach anything..."
              rows={1}
              className="flex-1 bg-transparent resize-none text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 border-0 focus:outline-none px-2 py-1.5 max-h-32 focus:ring-0"
              style={{ scrollbarWidth: "none" }}
            />
            <div className="flex gap-1">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            ✨ Powered by GPT-4o · Community Pro Plan
          </p>
        </div>
      </div>
    </div>
  );
}
