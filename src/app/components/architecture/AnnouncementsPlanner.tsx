import { useState } from "react";
import {
  Megaphone, Shield, Wrench, Calendar, Users, BookOpen, AlertTriangle,
  User, CheckCircle2, Info, Send, Sparkles, Inbox, RefreshCw, HelpCircle
} from "lucide-react";

interface RoleConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  allowedTypes: string[];
  maxPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  channels: string[];
}

interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  defaultPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  draftTemplates: Record<string, { subject: string; body: string }>;
}

const ROLES: Record<string, RoleConfig> = {
  ADMIN: {
    title: "Community Admin (President/Secretary)",
    description: "Full administrative governance, policy changes, and general community announcements.",
    icon: <Shield className="w-4 h-4 text-indigo-600" />,
    allowedTypes: ["GENERAL", "MAINTENANCE", "SAFETY", "EVENT", "MEETING", "RULE_CHANGE"],
    maxPriority: "URGENT",
    channels: ["Email", "In-App Push", "SMS Broadcast"]
  },
  TREASURER: {
    title: "Treasurer / Finance Committee",
    description: "Authorized for maintenance collection, billing updates, and financial audits.",
    icon: <Users className="w-4 h-4 text-emerald-600" />,
    allowedTypes: ["GENERAL", "MAINTENANCE", "MEETING"],
    maxPriority: "HIGH",
    channels: ["Email", "In-App Push"]
  },
  SPORTS_DIRECTOR: {
    title: "Sports Coordinator / Director",
    description: "Manages sports leagues, tournament scheduling, and court booking notifications.",
    icon: <Sparkles className="w-4 h-4 text-sky-600" />,
    allowedTypes: ["GENERAL", "EVENT", "MEETING"],
    maxPriority: "NORMAL",
    channels: ["Email", "In-App Push"]
  },
  SECURITY_CHIEF: {
    title: "Security Head / Safety Committee",
    description: "Controls safety protocols, fire safety audits, and emergency alerts.",
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    allowedTypes: ["GENERAL", "SAFETY", "MEETING"],
    maxPriority: "URGENT",
    channels: ["In-App Push", "SMS Broadcast"]
  },
  RESIDENT: {
    title: "General Resident / Member",
    description: "Peer-to-peer notices, lost & found, and local hobby clubs.",
    icon: <User className="w-4 h-4 text-slate-600" />,
    allowedTypes: ["GENERAL", "EVENT"],
    maxPriority: "LOW",
    channels: ["In-App Push"]
  }
};

const TYPES: Record<string, TypeConfig> = {
  GENERAL: {
    label: "General Notice",
    icon: <Megaphone className="w-4 h-4" />,
    color: "text-indigo-600 bg-indigo-50/70 border-indigo-200",
    defaultPriority: "NORMAL",
    draftTemplates: {
      ADMIN: {
        subject: "📢 Monthly General Body Update - Community Progress",
        body: "Dear Residents,\n\nWe are pleased to share our monthly community update. Over the past month, we successfully completed the green-belt landscaping and upgraded the guest lobby lobby facilities. Please review the attached minutes from our monthly board meeting."
      },
      TREASURER: {
        subject: "🧾 Fiscal Year Audit Report Released",
        body: "Hello Everyone,\n\nThe financial audit report for the preceding fiscal year is now available. Transparency is our highest priority, so a detailed ledger breakdown has been pinned in the community portal for all members to view."
      },
      SPORTS_DIRECTOR: {
        subject: "🎾 New Multi-Sport Arena Bookings Opened",
        body: "Hey Sports Enthusiasts!\n\nReservations for the newly renovated multi-sport turf are officially open starting this Saturday. You can book your slots directly in the sports hub."
      },
      SECURITY_CHIEF: {
        subject: "🚗 Guest Vehicle Validation Guidelines",
        body: "Dear Residents,\n\nTo ensure seamless entry, please pre-register your visitors via the Visitor Pass module. Doing so saves gate check-in time and ensures community safety."
      },
      RESIDENT: {
        subject: "📦 Lost Package - Block C Courtyard",
        body: "Hi neighbors, I ordered a package yesterday which was marked delivered but isn't outside my door. If anyone picked it up by mistake, please drop a message. Thanks!"
      }
    }
  },
  MAINTENANCE: {
    label: "Maintenance & Repairs",
    icon: <Wrench className="w-4 h-4" />,
    color: "text-amber-600 bg-amber-50/70 border-amber-200",
    defaultPriority: "HIGH",
    draftTemplates: {
      ADMIN: {
        subject: "🚧 Elevators Refurbishment Schedule - Block B",
        body: "Please note that the main lift in Block B will undergo scheduled annual structural testing this Friday from 10:00 AM to 4:00 PM. Please use the service elevator during this window."
      },
      TREASURER: {
        subject: "🛠️ Q3 Maintenance Dues & Invoicing Update",
        body: "Dear Members,\n\nInvoices for the Q3 maintenance cycle have been generated. Kindly clear the outstanding balance by the 10th of next month to avoid late fee penalties."
      }
    }
  },
  SAFETY: {
    label: "Safety & Emergency",
    icon: <Shield className="w-4 h-4" />,
    color: "text-rose-600 bg-rose-50/70 border-rose-200",
    defaultPriority: "URGENT",
    draftTemplates: {
      ADMIN: {
        subject: "🔥 Scheduled Community Fire Drill",
        body: "Attention Residents,\n\nOur mandatory bi-annual community fire drill is scheduled for this Sunday at 11:00 AM. Please follow the instructions of the fire wardens in your respective blocks."
      },
      SECURITY_CHIEF: {
        subject: "⚠️ Urgent: Secure Parking Area Gates",
        body: "CRITICAL ALERT: There has been a report of stray animal entry in the lower basement parking. Please ensure you secure all basement lobby doors and lock your cars properly."
      }
    }
  },
  EVENT: {
    label: "Event & Celebration",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-violet-600 bg-violet-50/70 border-violet-200",
    defaultPriority: "NORMAL",
    draftTemplates: {
      ADMIN: {
        subject: "🎨 Independence Day Cultural Celebration",
        body: "We invite you all to celebrate Independence Day with flag hoisting at 9:00 AM in the central park, followed by cultural dances, drawing competitions, and high tea."
      },
      SPORTS_DIRECTOR: {
        subject: "🏆 Annual Badminton Super League Registrations",
        body: "Get ready to smash! Registrations for our premier Badminton Tournament open tonight. Men's, Women's, and Junior categories available. Cash prizes for finalists!"
      },
      RESIDENT: {
        subject: "🧸 Sunday Kids Play Date & Toy Exchange",
        body: "Calling parents with kids under 8! We are organizing a casual toy exchange and play session this Sunday afternoon at the community club room. RSVP if interested!"
      }
    }
  },
  MEETING: {
    label: "General Meeting",
    icon: <Users className="w-4 h-4" />,
    color: "text-teal-600 bg-teal-50/70 border-teal-200",
    defaultPriority: "HIGH",
    draftTemplates: {
      ADMIN: {
        subject: "🗣️ Annual General Meeting (AGM) Convocation",
        body: "Dear Residents,\n\nYou are formally invited to the Annual General Meeting on Sunday, July 26th. Agenda includes: new committee election, next year's budget approval, and safety policies."
      },
      TREASURER: {
        subject: "📊 Financial Budget Review Sync",
        body: "The Finance Committee is hosting an open sync this Friday to review community expenditure and pool budget allocations. All interested members are welcome."
      },
      SPORTS_DIRECTOR: {
        subject: "📅 Sports Committee Planning Session",
        body: "We are holding a quick planning meeting to decide the sports calendar for the upcoming winter season. Anyone wanting to volunteer can join!"
      },
      SECURITY_CHIEF: {
        subject: "👮 Security Guards Deployment & Training Sync",
        body: "Syncing up with security agency leads to review night petrol protocols. Residents are welcome to share feedback on security performance."
      }
    }
  },
  RULE_CHANGE: {
    label: "Governance / Rule Change",
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-orange-600 bg-orange-50/70 border-orange-200",
    defaultPriority: "HIGH",
    draftTemplates: {
      ADMIN: {
        subject: "📝 Revised Pet Walkways Policy",
        body: "IMPORTANT NOTICE:\n\nBased on feedback and safety concerns, pet walks are now strictly restricted to the Outer Promenade. Leashes are mandatory at all times. Fines will apply for non-compliance."
      }
    }
  }
};

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-800 border-amber-200",
  URGENT: "bg-red-100 text-red-700 border-red-200 animate-pulse"
};

export function AnnouncementsPlanner() {
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [selectedType, setSelectedType] = useState<string>("GENERAL");
  const [copied, setCopied] = useState<boolean>(false);

  const roleInfo = ROLES[selectedRole];
  
  // Resolve valid types for the selected role
  const allowedTypes = Object.keys(TYPES).filter(t => roleInfo.allowedTypes.includes(t));
  
  // Fallback to first allowed type if current type is not allowed for selected role
  const activeTypeKey = roleInfo.allowedTypes.includes(selectedType) ? selectedType : allowedTypes[0];
  const typeInfo = TYPES[activeTypeKey];

  // Resolve template
  const draft = typeInfo.draftTemplates[selectedRole] || typeInfo.draftTemplates["ADMIN"];

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-600" />
          Governance Announcement Framework
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          The community notice ecosystem coordinates role-based access, automated formatting, and routing. 
          Different committee members post announcements scoped to their respective areas to ensure relevant and structured messaging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Planner Configurator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Announcement Architect
            </h4>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">1. Select Publisher (Committee Member)</label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCopied(false);
                  }}
                  className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.title.split(" (")[0]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-gray-400 italic mt-0.5">{roleInfo.description}</p>
            </div>

            {/* Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">2. Select Announcement Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPES).map(([key, value]) => {
                  const isAllowed = roleInfo.allowedTypes.includes(key);
                  const isActive = activeTypeKey === key;
                  return (
                    <button
                      key={key}
                      disabled={!isAllowed}
                      onClick={() => {
                        setSelectedType(key);
                        setCopied(false);
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white border-transparent shadow-sm"
                          : isAllowed
                          ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer"
                          : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span className="scale-75 shrink-0">{value.icon}</span>
                      <span className="text-[10px] font-bold truncate">{value.label.split(" Notice")[0].split(" & ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Framework Recommendations */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <h5 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Delivery Matrix Recommendations
              </h5>
              <div className="grid grid-cols-2 gap-3 text-[10px] leading-relaxed">
                <div>
                  <span className="text-gray-400 block">Default Priority</span>
                  <span className={`inline-block px-2 py-0.5 mt-0.5 rounded border text-[9px] font-bold ${PRIORITY_COLORS[typeInfo.defaultPriority]}`}>
                    {typeInfo.defaultPriority}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Active Channels</span>
                  <span className="text-gray-800 font-semibold block mt-0.5">
                    {roleInfo.channels.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Generated Sample & Notice Board Preview */}
        <div className="lg:col-span-7 space-y-4">
          {/* Draft Code View */}
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Generated Draft Announcement
              </h4>
              <button
                onClick={handleCopy}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-gray-500" />
                    Copy Template
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-[11px] leading-normal text-gray-800 select-all">
                <span className="text-gray-400 font-semibold">Subject:</span> {draft.subject}
              </div>
              <textarea
                readOnly
                value={draft.body}
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-gray-800 resize-none outline-none select-all"
              />
            </div>
          </div>

          {/* Notice Board Preview Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Live Notice Board Mockup
            </h4>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative space-y-3 max-w-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 ${typeInfo.color}`}>
                    {typeInfo.icon}
                    {typeInfo.label}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${PRIORITY_COLORS[typeInfo.defaultPriority]}`}>
                    {typeInfo.defaultPriority}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">Just now</div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-950">{draft.subject.replace(/^[^\w\s\d]/, "").trim()}</h3>
                <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{draft.body}</p>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-3 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-[9px] font-bold text-indigo-600">
                    {selectedRole[0]}
                  </div>
                  <span>Posted by: <strong className="text-gray-700">{roleInfo.title.split(" (")[0]}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-indigo-500 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  <Inbox className="w-3 h-3" />
                  STOMP Broadcast Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Permission Matrix */}
      <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3.5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Announcements Scoping & Security Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold">
                <th className="pb-2">Role / Committee</th>
                <th className="pb-2">Authorized Category Scope</th>
                <th className="pb-2 text-center">Max Priority</th>
                <th className="pb-2">Target Audience</th>
                <th className="pb-2">Allowed Gateways</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {[
                { r: "Community Admin", scope: "ALL (General, Maintenance, Safety, Event, Meeting, Rule)", prio: "URGENT", aud: "Entire Community / Specific Blocks", gate: "Email, WebSockets, SMS Broadcast" },
                { r: "Treasurer", scope: "General, Maintenance, Meeting", prio: "HIGH", aud: "Defaulters / All Residents", gate: "Email, In-App WebSockets" },
                { r: "Sports Director", scope: "General, Event, Meeting", prio: "NORMAL", aud: "Registered Players / Sports Clubs", gate: "Email, In-App WebSockets" },
                { r: "Security Chief", scope: "General, Safety, Meeting", prio: "URGENT", aud: "Lobby Guards / All Blocks", gate: "In-App WebSockets, SMS Broadcast" },
                { r: "Resident", scope: "General, Event (Peer Announcements)", prio: "LOW", aud: "Neighbors / Club Members", gate: "In-App WebSockets" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                  <td className="py-2.5 font-bold text-gray-800">{row.r}</td>
                  <td className="py-2.5 font-mono text-[10px] text-indigo-600">{row.scope}</td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${PRIORITY_COLORS[row.prio as keyof typeof PRIORITY_COLORS]}`}>
                      {row.prio}
                    </span>
                  </td>
                  <td className="py-2.5">{row.aud}</td>
                  <td className="py-2.5 font-medium text-gray-700">{row.gate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
