import { useEffect, useState } from "react";
import {
  Database, Server, Globe, Code, Layers, GitBranch, Shield,
  Activity, Box, ArrowRight, ChevronDown, ChevronRight, Loader2, AlertTriangle, Gauge,
} from "lucide-react";
import { schemaService, type DbTableSchema } from "../../../services/schemaService";

export type ArchTab = "overview" | "database" | "ddl" | "apis" | "websocket" | "folders" | "security" | "monitoring";

/** Fallback schema used only if the live DB schema can't be loaded. */
const FALLBACK_TABLES: DbTableSchema[] = [
  { name: "users",               columns: ["id","name","email","mobile","password_hash","community_id","flat_number","tower","profession","bio","profile_photo","role_id","status","verified_at","created_at"] },
  { name: "roles",               columns: ["id","name","description","created_at"] },
  { name: "permissions",         columns: ["id","name","module","action","description"] },
  { name: "user_roles",          columns: ["user_id","role_id","assigned_by","assigned_at"] },
  { name: "role_permissions",    columns: ["role_id","permission_id"] },
  { name: "communities",         columns: ["id","name","type","address","city","state","admin_id","invite_code","member_count","created_at"] },
  { name: "events",              columns: ["id","title","description","category","community_id","organizer_id","start_at","end_at","venue","capacity","rsvp_count","created_at"] },
  { name: "event_rsvps",         columns: ["event_id","user_id","status","rsvped_at"] },
  { name: "posts",               columns: ["id","author_id","community_id","content","type","media_urls","like_count","comment_count","created_at"] },
  { name: "comments",            columns: ["id","post_id","author_id","content","parent_id","created_at"] },
  { name: "jobs",                columns: ["id","title","company","location","type","salary_min","salary_max","description","skills","poster_id","community_id","status","created_at"] },
  { name: "job_referrals",       columns: ["job_id","referrer_id","referred_email","status","created_at"] },
  { name: "marketplace_listings",columns: ["id","title","description","price","category","condition","seller_id","community_id","images","status","created_at"] },
  { name: "services",            columns: ["id","name","category","description","provider_id","community_id","fee","availability","rating","review_count","created_at"] },
  { name: "appointments",        columns: ["id","service_id","user_id","scheduled_at","notes","status","created_at"] },
  { name: "sports",              columns: ["id","name","type","icon","active"] },
  { name: "sports_events",       columns: ["id","name","sport_id","community_id","format","sequence","scoring","start_date","end_date","venue_id","status","created_at"] },
  { name: "tournaments",         columns: ["id","sports_event_id","name","round_count","current_round","status","third_place","created_at"] },
  { name: "matches",             columns: ["id","tournament_id","round","player1_id","player2_id","court_id","scheduled_at","score_p1","score_p2","winner_id","status","is_bye"] },
  { name: "venues",              columns: ["id","name","community_id","address","capacity","active"] },
  { name: "courts",              columns: ["id","venue_id","name","sport","active"] },
  { name: "auctions",            columns: ["id","name","community_id","config","status","starts_at","ends_at","created_by","created_at"] },
  { name: "teams",               columns: ["id","auction_id","name","short_code","color","budget","spent","captain_id","created_at"] },
  { name: "player_registrations",columns: ["id","auction_id","user_id","sport","role","base_price","current_bid","team_id","status","sold_price","created_at"] },
  { name: "notifications",       columns: ["id","user_id","type","title","body","data","read","scheduled_at","sent_at","created_at"] },
  { name: "chat_conversations",  columns: ["id","type","name","community_id","created_by","created_at"] },
  { name: "chat_participants",   columns: ["conversation_id","user_id","joined_at","last_read_at"] },
  { name: "chat_messages",       columns: ["id","conversation_id","sender_id","content","type","metadata","delivered_at","read_at","created_at"] },
  { name: "audit_logs",          columns: ["id","user_id","action","module","resource_type","resource_id","old_value","new_value","ip_address","user_agent","created_at"] },
];

const DDL = `-- =====================================================
-- Mana Community PostgreSQL DDL
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  mobile        VARCHAR(15)   UNIQUE,
  password_hash TEXT          NOT NULL,
  community_id  UUID          REFERENCES communities(id),
  flat_number   VARCHAR(20),
  tower         VARCHAR(20),
  profession    VARCHAR(120),
  bio           TEXT,
  profile_photo TEXT,
  status        VARCHAR(20)   DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  verified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX idx_users_community ON users(community_id);
CREATE INDEX idx_users_email ON users(email);

-- Roles & Permissions
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(80) UNIQUE NOT NULL,
  module      VARCHAR(40) NOT NULL,
  action      VARCHAR(40) NOT NULL,
  description TEXT
);

CREATE TABLE user_roles (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id     UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Communities
CREATE TABLE communities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(120) NOT NULL,
  type         VARCHAR(30)  CHECK (type IN ('apartment','villa','school','college','sports','professional')),
  address      TEXT,
  city         VARCHAR(80),
  state        VARCHAR(80),
  admin_id     UUID         REFERENCES users(id),
  invite_code  VARCHAR(20)  UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  member_count INT          DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Posts & Feed
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  community_id  UUID        REFERENCES communities(id),
  content       TEXT        NOT NULL,
  type          VARCHAR(20) DEFAULT 'post' CHECK (type IN ('post','announcement','poll','event','job','marketplace')),
  media_urls    TEXT[],
  like_count    INT         DEFAULT 0,
  comment_count INT         DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_community ON posts(community_id, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);

-- Matches
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID        REFERENCES tournaments(id),
  round         INT         NOT NULL,
  player1_id    UUID        REFERENCES users(id),
  player2_id    UUID        REFERENCES users(id),
  court_id      UUID        REFERENCES courts(id),
  scheduled_at  TIMESTAMPTZ,
  score_p1      INT,
  score_p2      INT,
  winner_id     UUID        REFERENCES users(id),
  status        VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  is_bye        BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_matches_tournament ON matches(tournament_id, round);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);

-- Chat
CREATE TABLE chat_messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID        REFERENCES chat_conversations(id),
  sender_id        UUID        REFERENCES users(id),
  content          TEXT        NOT NULL,
  type             VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text','image','file','system')),
  metadata         JSONB,
  delivered_at     TIMESTAMPTZ,
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at DESC);

-- Audit Logs
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,
  module        VARCHAR(40) NOT NULL,
  resource_type VARCHAR(40),
  resource_id   UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_module ON audit_logs(module, created_at DESC);`;

const APIS = [
  { tag: "Auth",         endpoints: [["POST","/api/auth/register","Register new user"],["POST","/api/auth/login","Login & get JWT"],["POST","/api/auth/refresh","Refresh access token"],["POST","/api/auth/logout","Invalidate token"],["POST","/api/auth/verify-email","Email verification"],["POST","/api/auth/forgot-password","Send reset link"]] },
  { tag: "Users",        endpoints: [["GET","/api/users","List users (paginated)"],["GET","/api/users/{id}","Get user profile"],["PUT","/api/users/{id}","Update user profile"],["DELETE","/api/users/{id}","Delete user"],["POST","/api/users/bulk-import","CSV/XLS bulk import"],["GET","/api/users/template","Download import template"],["POST","/api/users/{id}/verify","Admin verify user"]] },
  { tag: "Communities",  endpoints: [["GET","/api/communities","List communities"],["POST","/api/communities","Create community"],["GET","/api/communities/{id}/members","List members"],["POST","/api/communities/join","Join via invite code"],["GET","/api/communities/{id}/stats","Community statistics"]] },
  { tag: "Feed & Posts", endpoints: [["GET","/api/posts","Community feed (paginated)"],["POST","/api/posts","Create post/poll/announcement"],["PUT","/api/posts/{id}","Update post"],["DELETE","/api/posts/{id}","Delete post"],["POST","/api/posts/{id}/like","Toggle like"],["POST","/api/posts/{id}/comments","Add comment"],["POST","/api/posts/{id}/vote","Vote on poll"]] },
  { tag: "Events",       endpoints: [["GET","/api/events","List events"],["POST","/api/events","Create event"],["POST","/api/events/{id}/rsvp","RSVP to event"],["GET","/api/events/{id}/attendees","List attendees"],["PUT","/api/events/{id}","Update event"]] },
  { tag: "Sports",       endpoints: [["GET","/api/sports/events","List sports events"],["POST","/api/sports/events","Create sports event"],["POST","/api/sports/events/{id}/schedule","Generate schedule"],["GET","/api/sports/matches","List matches"],["PUT","/api/sports/matches/{id}/score","Update match score"],["GET","/api/sports/rankings","Player rankings"],["GET","/api/sports/standings","Team standings"]] },
  { tag: "Auction",      endpoints: [["GET","/api/auctions","List auctions"],["POST","/api/auctions","Create auction"],["GET","/api/auctions/{id}/players","Player pool"],["POST","/api/auctions/{id}/bid","Place bid"],["POST","/api/auctions/{id}/sell","Mark player sold"],["GET","/api/auctions/{id}/results","Auction results"],["GET","/api/auctions/{id}/live","Live auction state (SSE)"]] },
  { tag: "Chat",         endpoints: [["GET","/api/conversations","List conversations"],["POST","/api/conversations","Create conversation"],["GET","/api/conversations/{id}/messages","Get messages"],["POST","/api/conversations/{id}/messages","Send message"],["PUT","/api/conversations/{id}/read","Mark as read"]] },
  { tag: "Admin",        endpoints: [["GET","/api/admin/users","All users with filters"],["POST","/api/admin/users","Create user (admin)"],["PUT","/api/admin/users/{id}/role","Assign role"],["GET","/api/admin/audit-logs","Audit logs"],["GET","/api/admin/approvals","Pending approvals"],["PUT","/api/admin/approvals/{id}","Approve/decline"],["GET","/api/admin/analytics","Dashboard analytics"]] },
];

const FOLDERS = {
  react: `src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── store/
│   │   ├── index.ts            (Redux store)
│   │   ├── authSlice.ts
│   │   ├── communitySlice.ts
│   │   ├── notifSlice.ts
│   │   └── chatSlice.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts     (STOMP/WebSocket)
│   │   ├── usePermissions.ts
│   │   └── useAuction.ts
│   ├── api/
│   │   ├── client.ts           (Axios instance + JWT interceptor)
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── posts.api.ts
│   │   ├── sports.api.ts
│   │   ├── auction.api.ts
│   │   └── chat.api.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── common/
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Charts.tsx
│   │   ├── IPLAuction.tsx
│   │   ├── ChatModule.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ArchitectureDocs.tsx
│   ├── pages/
│   │   ├── Overview.tsx
│   │   ├── Feed.tsx
│   │   ├── Events.tsx
│   │   ├── Jobs.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Services.tsx
│   │   ├── Sports.tsx
│   │   └── Auth/
│   │       ├── Login.tsx
│   │       └── Register.tsx
│   └── types/
│       ├── auth.types.ts
│       ├── sports.types.ts
│       └── auction.types.ts
├── styles/
│   ├── theme.css
│   └── fonts.css
└── main.tsx`,

  springboot: `commune-api/
├── src/main/java/com/commune/api/
│   ├── CommuneApiApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java      (JWT + RBAC)
│   │   ├── WebSocketConfig.java     (STOMP endpoints)
│   │   ├── CorsConfig.java
│   │   ├── RedisConfig.java
│   │   └── SwaggerConfig.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── PermissionEvaluator.java
│   │   └── UserDetailsServiceImpl.java
│   ├── websocket/
│   │   ├── ChatWebSocketController.java
│   │   ├── AuctionWebSocketController.java
│   │   └── NotificationWebSocketService.java
│   ├── domain/
│   │   ├── user/
│   │   │   ├── User.java (Entity)
│   │   │   ├── UserRepository.java
│   │   │   ├── UserService.java
│   │   │   └── UserController.java
│   │   ├── auction/
│   │   │   ├── Auction.java
│   │   │   ├── AuctionEngine.java   (Core bidding logic)
│   │   │   ├── AuctionService.java
│   │   │   └── AuctionController.java
│   │   ├── sports/
│   │   │   ├── SchedulerEngine.java (7 scheduling rules)
│   │   │   ├── TournamentService.java
│   │   │   └── MatchController.java
│   │   ├── chat/
│   │   │   ├── ChatMessage.java
│   │   │   ├── ChatService.java
│   │   │   └── ChatController.java
│   │   └── notification/
│   │       ├── NotificationScheduler.java
│   │       └── NotificationService.java
│   └── common/
│       ├── audit/AuditLogger.java
│       ├── exception/GlobalExceptionHandler.java
│       └── dto/ApiResponse.java
└── src/main/resources/
    ├── application.yml
    ├── application-dev.yml
    └── application-prod.yml`,
};

const WS_DESIGN = `/* ── WebSocket Architecture ────────────────────────────
   Spring Boot + STOMP + SockJS + JWT
─────────────────────────────────────────────────────── */

// 1. Connection endpoint
ws://api.commune.app/ws
  → SockJS fallback for HTTP polling

// 2. STOMP broker destinations
/topic/community/{id}/feed      → Community feed updates
/topic/community/{id}/chat/{cid}→ Group/Team chat messages
/topic/auction/{id}/bids        → Live bid updates
/topic/auction/{id}/state       → Auction state machine
/user/{userId}/notifications    → Personal notifications
/user/{userId}/direct           → Direct messages

// 3. Application destinations (client → server)
/app/chat.send                  → Send message
/app/auction.bid                → Place bid
/app/auction.control            → Start/pause/sell/skip

// 4. JWT Authentication
Connection handshake:
  StompHeaderAccessor.getFirstNativeHeader("Authorization")
  → "Bearer <JWT>" verified before subscription

// 5. Auction state machine
WAITING → LIVE → (SOLD | UNSOLD) → NEXT_PLAYER
         ↑ 30-second countdown timer
         ↑ Auto-extends 15s on new bid
         ↑ Publishes state to /topic/auction/{id}/state

// 6. Chat delivery
Message → ChatService → saved to DB
        → Broadcast to /topic/community/{id}/chat/{cid}
        → WebSocket push to participants
        → Offline users: FCM/APNs via NotificationScheduler`;

function CodeBlock({ code, lang = "sql" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs text-gray-400 hover:text-white transition-colors">{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre className="p-4 overflow-auto text-xs text-gray-300 font-mono leading-relaxed" style={{ maxHeight: 520 }}>{code}</pre>
    </div>
  );
}

function ApiAccordion() {
  const [open, setOpen] = useState<string | null>("Auth");
  const methodColor: Record<string, string> = { GET: "bg-blue-100 text-blue-700", POST: "bg-emerald-100 text-emerald-700", PUT: "bg-amber-100 text-amber-700", DELETE: "bg-red-100 text-red-700", PATCH: "bg-purple-100 text-purple-700" };
  return (
    <div className="space-y-2">
      {APIS.map(g => (
        <div key={g.tag} className="bg-white rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <button onClick={() => setOpen(open === g.tag ? null : g.tag)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold">{g.endpoints.length}</span>
              <span className="text-sm font-semibold text-gray-900">{g.tag}</span>
            </div>
            {open === g.tag ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
          {open === g.tag && (
            <div className="border-t border-gray-100">
              {g.endpoints.map(([method, path, desc], i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded w-14 text-center shrink-0 ${methodColor[method] ?? "bg-gray-100 text-gray-600"}`}>{method}</span>
                  <code className="text-xs font-mono text-gray-700 flex-1">{path}</code>
                  <span className="text-xs text-gray-400">{desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ERDiagram() {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [tables, setTables] = useState<DbTableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    schemaService.getDbSchema()
      .then(data => {
        if (cancelled) return;
        setTables(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        // Endpoint unavailable — fall back to the static schema so the view still renders.
        setTables(FALLBACK_TABLES);
        setError("Could not load the live database schema — showing the reference schema instead.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading database schema…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-sm text-gray-500 mb-4">All {tables.length} tables · Click a table to inspect columns</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {tables.map(t => (
          <div key={t.name} onMouseEnter={() => setHoveredTable(t.name)} onMouseLeave={() => setHoveredTable(null)}
            className={`bg-white rounded-xl border p-3 cursor-pointer transition-all ${hoveredTable === t.name ? "border-blue-400 shadow-md ring-2 ring-blue-100" : ""}`}
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-bold text-gray-800 font-mono">{t.name}</span>
            </div>
            {hoveredTable === t.name ? (
              <div className="space-y-0.5">
                {t.columns.map(c => (
                  <div key={c} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[10px] font-mono text-gray-600">{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">{t.columns.length} columns</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HLArchitecture() {
  const layers = [
    { label: "Client Layer", items: ["React 19 + Redux Toolkit","Axios + React Query","WebSocket (STOMP/SockJS)","JWT token management"], color: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
    { label: "API Gateway", items: ["AWS ALB","Rate limiting","SSL termination","JWT verification"], color: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
    { label: "Application Layer", items: ["Spring Boot 3.x","Spring Security","WebSocket/STOMP","Scheduled Jobs"], color: "#FFF7ED", border: "#FED7AA", text: "#9A3412" },
    { label: "Data Layer", items: ["PostgreSQL 15","Redis (cache/sessions)","S3 (media storage)","Elasticsearch (search)"], color: "#FDF4FF", border: "#E9D5FF", text: "#6B21A8" },
    { label: "Infrastructure", items: ["AWS ECS (Fargate)","RDS Multi-AZ","ElastiCache","CloudFront CDN"], color: "#F8FAFC", border: "#E2E8F0", text: "#475569" },
  ];
  return (
    <div className="space-y-3">
      {layers.map((l, i) => (
        <div key={l.label}>
          <div className="rounded-xl border p-4" style={{ background: l.color, borderColor: l.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: l.text }}>{l.label}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {l.items.map(item => (
                <div key={item} className="bg-white rounded-lg px-3 py-2 border text-xs font-medium text-gray-700" style={{ borderColor: l.border }}>
                  <Box className="w-3 h-3 mb-1" style={{ color: l.text }} />{item}
                </div>
              ))}
            </div>
          </div>
          {i < layers.length - 1 && <div className="flex justify-center my-1"><ArrowRight className="w-4 h-4 text-gray-300 rotate-90" /></div>}
        </div>
      ))}
    </div>
  );
}

const tabDefs: { id: ArchTab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Architecture",  icon: Layers },
  { id: "database",   label: "ER Diagram",    icon: Database },
  { id: "ddl",        label: "PostgreSQL DDL",icon: Code },
  { id: "apis",       label: "REST APIs",     icon: Globe },
  { id: "websocket",  label: "WebSocket",     icon: Activity },
  { id: "folders",    label: "Folder Structure", icon: GitBranch },
  { id: "security",   label: "Security",      icon: Shield },
  { id: "monitoring", label: "System Logs & Monitoring", icon: Gauge },
];

function ArchitectureContent({ tab }: { tab: ArchTab }) {
  return (
    <div>
      {tab === "overview"   && <HLArchitecture />}
      {tab === "database"   && <ERDiagram />}
      {tab === "ddl"        && <CodeBlock code={DDL} lang="postgresql" />}
      {tab === "apis"       && <ApiAccordion />}
      {tab === "websocket"  && <CodeBlock code={WS_DESIGN} lang="websocket-design" />}
      {tab === "folders"    && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div><p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Code className="w-4 h-4 text-blue-500" />React / Frontend</p><CodeBlock code={FOLDERS.react} lang="tree" /></div>
          <div><p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Server className="w-4 h-4 text-orange-500" />Spring Boot / Backend</p><CodeBlock code={FOLDERS.springboot} lang="tree" /></div>
        </div>
      )}
      {tab === "security" && (
        <div className="space-y-4">
          {[
            { title: "Authentication — JWT", items: ["RS256-signed access token (15 min TTL)","Refresh token (7 days, HttpOnly cookie)","Token rotation on every refresh","Blacklist via Redis on logout"] },
            { title: "Authorization — RBAC", items: ["6 roles: SUPER_ADMIN, COMMUNITY_ADMIN, SPORTS_ADMIN, AUCTION_ADMIN, VENDOR, MEMBER","Per-endpoint @PreAuthorize with custom PermissionEvaluator","Menu and API access dynamically computed from role_permissions","Community-scoped data isolation via row-level checks"] },
            { title: "WebSocket Security", items: ["JWT extracted from STOMP CONNECT header","Per-subscription topic authorization","Auto-disconnect on token expiry","CSRF protection via SockJS token"] },
            { title: "Data Security", items: ["Passwords hashed with BCrypt (12 rounds)","PII encrypted at rest (AES-256)","All SQL via JPA / parameterized queries (no raw SQL)","Audit log every mutation with old/new values + IP"] },
            { title: "Infrastructure Security", items: ["VPC with private subnets for DB and cache","ALB WAF rules (OWASP Top 10)","Secrets in AWS Secrets Manager","TLS 1.3 enforced, HSTS, no mixed content"] },
          ].map(s => (
            <div key={s.title} className="bg-white rounded-xl border p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" />{s.title}</h3>
              <ul className="space-y-2">{s.items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="w-4 h-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {tab === "monitoring" && (
        <div className="space-y-6">
          {/* Live Dashboard Quick Access Card */}
          <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-2xl border border-indigo-500/35 p-6 shadow-xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Operational Console
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-400" />
                  System Logs & Monitoring Dashboard
                </h3>
                <p className="text-sm text-indigo-200/80 max-w-2xl">
                  Real-time operational dashboard featuring circular gauges for system resource usage (CPU, RAM, Disk, JVM), runtime stats (Uptime, Active Threads, Log File Size), and a high-performance terminal logs streaming console with on-the-fly filtering.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = "/admin/logs"}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold text-center transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 whitespace-nowrap self-start md:self-center"
              >
                <Server className="w-4 h-4" />
                Launch Live Dashboard
              </button>
            </div>

            {/* Sub-grid of Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-500/20">
              {[
                { label: "Gauges", desc: "CPU, RAM, Disk, JVM usage" },
                { label: "Metrics", desc: "Uptime, threads, log file stats" },
                { label: "Terminal Stream", desc: "Level highlights, auto-scroll" },
                { label: "Search & Filters", desc: "Debug, Info, Warn, Error levels" },
              ].map(f => (
                <div key={f.label} className="bg-indigo-900/40 rounded-xl p-3 border border-indigo-500/10">
                  <p className="text-xs font-bold text-white">{f.label}</p>
                  <p className="text-[11px] text-indigo-300/80 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                Monitoring REST API Endpoints
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">GET</span>
                    <code className="text-xs font-mono font-semibold text-gray-800">/api/admin/system-stats</code>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Fetches real-time host CPU usage, RAM stats, Disk capacity, and JVM runtime memory usage percentages. No DB touch.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">GET</span>
                    <code className="text-xs font-mono font-semibold text-gray-800">/api/admin/logs</code>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Streams trailing lines from <code className="bg-gray-100 px-1 rounded">logs/mana-service.log</code> with optional filters for <code className="bg-gray-100 px-1 rounded">level</code> (INFO/WARN/ERROR) and keyword <code className="bg-gray-100 px-1 rounded font-normal font-mono">search</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                Configuration (application.yaml)
              </h3>
              <pre className="text-[11px] font-mono bg-gray-950 text-gray-300 p-4 rounded-xl overflow-x-auto leading-relaxed" style={{ maxHeight: 180 }}>
{`logging:
  file:
    name: logs/mana-service.log
  logback:
    rollingpolicy:
      max-file-size: 10MB
      total-size-cap: 100MB
      max-history: 7`}
              </pre>
              <p className="text-[11px] text-gray-500">
                Logs are written directly to a rolling file in the local filesystem, keeping database load at 0% and avoiding storage bloat.
              </p>
            </div>
          </div>

          {/* Standard logs items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              { title: "Application Logging", items: ["Structured logging via SLF4J + Logback (JSON in prod)","Per-request correlation/trace ID in the MDC","Log levels per environment (DEBUG local, INFO/WARN prod)","GlobalExceptionHandler logs every unhandled 500 with full stack trace"] },
              { title: "Audit Trail", items: ["AuditLogService records every sensitive mutation","Persisted to the audit_logs table (actor, action, module, old/new value, IP, user-agent)","Immutable, append-only history for compliance","Surfaced in-app under Admin → Logs"] },
              { title: "Centralised Aggregation", items: ["App logs shipped to AWS CloudWatch Logs","Configurable retention + full-text search","Filter by level, path, correlation ID","Optional ship-out to ELK / OpenSearch"] },
              { title: "Metrics & Health", items: ["Spring Boot Actuator: /actuator/health, /actuator/metrics","Micrometer → Prometheus registry","JVM, HTTP latency, DB connection-pool (HikariCP) & cache metrics","ALB target-group health checks on /actuator/health"] },
              { title: "Alerting & Dashboards", items: ["CloudWatch Alarms on error rate, p95 latency, CPU/memory","Grafana / CloudWatch dashboards for live KPIs","Notifications to email / Slack on threshold breach","5xx spike & DB-saturation alerts wired to on-call"] },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-xl border p-5 shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 className="text-sm font-semibold text-gray-950 mb-3 flex items-center gap-2"><Gauge className="w-4 h-4 text-indigo-500" />{s.title}</h3>
                <ul className="space-y-2">{s.items.map(i => <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="w-4 h-4 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ArchitectureDocs() {
  const [tab, setTab] = useState<ArchTab>("overview");
  return (
    <div className="p-1">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Architecture Docs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System design reference — data model, REST APIs, real-time layer and security.
        </p>
      </div>

      <div className="flex gap-0.5 mb-5 border-b border-gray-200 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabDefs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap -mb-px transition-all ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      <ArchitectureContent tab={tab} />
    </div>
  );
}
