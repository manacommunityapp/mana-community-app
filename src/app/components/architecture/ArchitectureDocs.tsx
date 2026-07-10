import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Database, Server, Globe, Code, Layers, GitBranch, Shield,
  Activity, Box, ArrowRight, ChevronDown, ChevronRight, Loader2, AlertTriangle, Gauge,
} from "lucide-react";
import { schemaService, type DbTableSchema } from "../../../services/schemaService";
import { apiCatalogService, type ApiGroup } from "../../../services/apiCatalogService";
import { buildInfo, formatBuildTime } from "../../../utils/buildInfo";

export type ArchTab = "overview" | "database" | "apis" | "websocket" | "folders" | "security" | "monitoring";

const FALLBACK_TABLES: DbTableSchema[] = [
  { name: "community",                     columns: ["id","name","type","invite_code","city","state","area","subtype","created_at"] },
  { name: "roles",                         columns: ["id","name","community_id"] },
  { name: "app_user",                      columns: ["id","full_name","email","phone","password_hash","date_of_birth","gender","role","role_id","kyc_status","govt_id_type","govt_id_number","flat_no","block","profile_pic_url","community_id","is_active","failed_login_attempts","locked_until","created_at","updated_at"] },
  { name: "role_permissions",              columns: ["id","role","role_id","user_id","permission_key"] },
  { name: "user_profile",                  columns: ["id","user_id","bio","skills","cover_pic_url","posts_count","connections_count","events_attended_count","items_sold_count","jobs_posted_count","sports_played_count","created_at","updated_at"] },
  { name: "email_otp",                     columns: ["id","email","code_hash","expires_at","attempts","consumed","verified","verified_at","created_at"] },
  { name: "community_module",              columns: ["id","community_id","module_key","enabled","created_at","updated_at"] },
  { name: "sports_meta",                   columns: ["id","name","icon","icon_url","format","active","community_id","created_at","updated_at"] },
  { name: "player_category",              columns: ["id","name","category_type","description","gender","type","min_age","max_age","community_id"] },
  { name: "venue",                         columns: ["id","name","address","area","city","pin_code","map_link","capacity","venue_type","venue_category","opening_time","closing_time","contact_name","contact_number","contact_email","community_id"] },
  { name: "court",                         columns: ["id","venue_id","name","color","opening_time","closing_time"] },
  { name: "sports_event",                  columns: ["id","uuid","name","sport_id","community_id","venue_id","tournament_id","created_by","event_date_start","event_date_end","registration_date_start","registration_date_end","format","tournament_type","gender","min_age","max_age","max_participants","status","active","created_at","updated_at"] },
  { name: "event_category",               columns: ["event_id","category_id"] },
  { name: "sports_event_registration",     columns: ["id","event_id","user_id","partner_user_id","category_id","player_name","email","flat_number","match_type","role","age","status","captain_nomination","captain_confirmation","registered_at","updated_at"] },
  { name: "sports_event_sponsor",          columns: ["id","event_id","tournament_id","category","name","url","created_at"] },
  { name: "sports_event_dispute_committee", columns: ["sports_event_id","user_id"] },
  { name: "sports_notification_scheduler", columns: ["id","event_id","tournament_id","trigger_key","label","offset_minutes","enabled","title","body","recipients","channels","priority","is_custom","sent","notify_at","created_at","updated_at"] },
  { name: "tournament_config",             columns: ["id","tournament_name","tournament_type","status","community_id","event_id","sport_id","venue_id","created_by","total_teams","number_of_groups","teams_per_group","teams_advancing_per_group","swiss_rounds","match_duration_minutes","break_between_matches_minutes","points_for_win","points_for_draw","points_for_loss","start_date","end_date","created_at","updated_at"] },
  { name: "tournament_group",              columns: ["id","config_id","group_name","group_order"] },
  { name: "tournament_match",              columns: ["id","config_id","group_id","round","round_number","swiss_round_number","match_number","bracket_slot","team_a_id","team_b_id","winner_team_id","score_teama","score_teamb","status","venue_id","court_id","scheduled_at","started_at","completed_at","reminder_sent","created_at"] },
  { name: "group_team_standing",           columns: ["id","group_id","team_id","seed_rank","played","won","drawn","lost","points","runs_for","runs_against","net_run_rate","qualified","eliminated"] },
  { name: "schedule_generation_log",       columns: ["id","config_id","event_id","community_id","generated_by","action","status","tournament_type","total_teams","total_matches","duration_ms","created_at"] },
  { name: "auction_config",               columns: ["id","season_name","auction_format","status","unsold_rule","sport_id","event_id","created_by","total_teams","total_players","budget_per_team","base_price","bid_increment_default","bid_increment_threshold","bid_increment_above","bid_timer_seconds","rtm_enabled","created_at","updated_at"] },
  { name: "auction_config_category",       columns: ["id","config_id","category_name"] },
  { name: "auction_dispute_committee",     columns: ["id","config_id","user_id","member_name","role","added_at"] },
  { name: "auction_player",               columns: ["id","config_id","user_id","assigned_team_id","player_name","player_role","category","age","base_price","sold_price","queue_order","rtm_used","status","stats_json","sold_at"] },
  { name: "auction_team",                 columns: ["id","event_id","config_id","owner_user_id","captain_user_id","team_name","owner_name","color_hex","total_budget","remaining_budget","spent","captain_nomination","captain_confirmation","created_at"] },
  { name: "auction_bid",                  columns: ["id","config_id","player_id","team_id","bid_by_user_id","bid_amount","increment_used","is_rtm","bid_at"] },
  { name: "auction_session_log",           columns: ["id","config_id","player_id","team_id","performed_by_user_id","action","amount","notes","logged_at"] },
  { name: "post",                          columns: ["id","user_id","community_id","content","image_url","is_official","likes_count","comments_count","created_at","updated_at"] },
  { name: "post_comment",                 columns: ["id","post_id","user_id","content","created_at","updated_at"] },
  { name: "post_like",                    columns: ["id","post_id","user_id","created_at"] },
  { name: "notification",                 columns: ["id","user_id","community_id","type","category","title","body","icon","action_url","reference_type","reference_id","priority","channels","is_read","is_dismissed","read_at","expires_at","created_at"] },
  { name: "chat_conversation",            columns: ["id","type","title","community_id","last_message","last_message_at","created_at","updated_at"] },
  { name: "chat_participant",             columns: ["id","conversation_id","user_id","last_read_at","created_at"] },
  { name: "chat_message",                columns: ["id","conversation_id","sender_id","type","content","created_at"] },
  { name: "audit_log",                    columns: ["id","user_id","action","module","resource_type","resource_id","old_value","new_value","ip_address","correlation_id","created_at"] },
  { name: "user_sessions",               columns: ["id","user_id","device","browser","ip_address","login_time","logout_time","status"] },
];

const WS_DESIGN = `/* ── WebSocket Architecture ────────────────────────────
   Spring Boot 3.x + STOMP + native WebSocket + JWT
─────────────────────────────────────────────────────── */

// 1. Connection endpoint
ws://<host>/ws
  → Native WebSocket (no SockJS)
  → CORS: allowed-origins from application.yaml

// 2. STOMP broker destinations (server → client)
/topic/conversation/{conversationId}  → Group/direct chat messages
/topic/chat-user/{userId}             → Chat presence & delivery events
/topic/notifications/{userId}         → Personal push notifications
/topic/auction/{configId}             → Live auction events (bids, sold, passed, status)

// 3. Application destinations (client → server)
/app/chat.send                        → Send chat message

// 4. JWT Authentication on CONNECT
StompHeaderAccessor.getFirstNativeHeader("Authorization")
  → "Bearer <JWT>" validated via JwtTokenProvider
  → Dev shortcut: "Bearer mock-token-{userId}" (local profile only)
  → User principal set as authenticated STOMP session

// 5. In-memory simple broker
Prefixes: /topic, /queue, /user
  → No external broker (RabbitMQ/ActiveMQ) — simple broker only
  → Sufficient for single-instance deployment

// 6. Auction STOMP event types (sent to /topic/auction/{configId})
{
  type: "BID_PLACED",     payload: AuctionBidResponse
  type: "PLAYER_PICKED",  payload: PlayerWithBidResponse
  type: "PLAYER_SOLD",    payload: { playerId, playerName, teamId, teamName, soldPrice }
  type: "PLAYER_PASSED",  payload: { playerId, playerName, newStatus, queueOrder }
  type: "STATUS_CHANGED", payload: { configId, oldStatus, newStatus }
}

// 7. Chat message flow
Client /app/chat.send → ChatService.sendMessage()
  → Persisted to chat_message table
  → Broadcast to /topic/conversation/{conversationId}
  → Presence event to /topic/chat-user/{userId} per participant

// 8. Push notifications (AiWebSocketPushService)
Server-side event → pushToUser(userId, PushEvent)
  → Sent to /topic/notifications/{userId}
  → Types: MATCH_REMINDER, SCHEDULE_UPDATE, AI_ALERT
  → Ephemeral (not persisted — offline users see in-app notifications)`;

const FOLDERS = {
  react: `mana-community-app/src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── components/
│       ├── admin/           (AdminPanel, LogsDashboard, AuditTrail)
│       ├── architecture/    (ArchitectureDocs)
│       ├── assets/          (Asset management)
│       ├── bookings/        (Facility bookings)
│       ├── chat/            (ChatModule, conversations)
│       ├── commons/
│       │   ├── error/       (ErrorBoundary, RootErrorElement)
│       │   ├── guards/      (PermissionGuard, AuthGuard)
│       │   ├── layout/      (Layout, Sidebar, Header)
│       │   ├── login/       (Login page)
│       │   ├── register/    (Registration flow)
│       │   └── verification/ (Email/OTP verification)
│       ├── community/       (Community management)
│       ├── events/          (Event listings)
│       ├── finance/
│       │   ├── expense/     (Expense tracker)
│       │   └── invoice/     (Invoice management)
│       ├── helpdesk/        (Support tickets)
│       ├── inventory/       (Stock management)
│       ├── jobs/            (Job board)
│       ├── marketplace/     (Buy/sell listings)
│       ├── medical/         (Health records)
│       ├── notices/         (Notice board)
│       ├── polling/         (Polls & surveys)
│       ├── profile/         (ProfileDashboard)
│       ├── scheduler/       (Tournament scheduler)
│       ├── sports/
│       │   ├── admin/       (SportsAdmin, useSportsAdminState hook)
│       │   └── hooks/       (Sports-specific hooks)
│       ├── ui/              (Shared UI primitives)
│       └── visitors/        (Visitor management)
├── config/                  (App configuration)
├── constants/               (Shared constants)
├── contexts/                (React contexts)
├── hooks/                   (Global custom hooks)
├── services/                (API service layer — apiClient, schemaService, etc.)
├── styles/                  (Global CSS, theme)
├── types/                   (TypeScript type definitions)
└── utils/                   (Utility functions — buildInfo, etc.)`,

  springboot: `mana-community-service/src/main/java/com/manacommunity/api/
├── ManaCommunityApplication.java
├── ai/
│   ├── config/          (ChatAgentConfig — Ollama/Spring AI)
│   ├── controller/      (AI chat endpoints)
│   ├── dto/             (AI request/response DTOs)
│   ├── service/         (AiWebSocketPushService, chat agent)
│   └── tool/            (AI function-calling tools)
├── booking/             (controller, dto, entity, repository, service)
├── config/
│   ├── SecurityConfig.java        (JWT + RBAC filter chains)
│   ├── WebSocketConfig.java       (STOMP /ws endpoint + JWT auth)
│   ├── WebConfig.java             (CORS)
│   ├── SchemaConstraintPatcher.java (startup schema fixes)
│   └── TableDropperConfig.java
├── constants/           (PermissionConstants)
├── controller/          (35 REST controllers — sports, auction, admin, etc.)
├── dto/                 (Request/response DTOs, chat/, dashboard/, scheduler/)
├── email/               (EmailService, templates)
├── events/              (controller, dto, entity, repository, service)
├── exception/           (GlobalExceptionHandler, custom exceptions)
├── finance/             (Billing, Budget, Expense — controller/dto/entity/repo/service)
├── helpdesk/            (controller, dto, entity, repository, service)
├── inventory/           (config, controller, dto, entity, mapper, repository, service)
├── jobs/                (controller, dto, entity, repository, service)
├── marketplace/         (controller, dto, entity, repository, service)
├── model/               (JPA entities — AppUser, SportsEvent, AuctionConfig, etc.)
├── noticeboard/         (controller, dto, entity, repository, service)
├── polling/             (controller, dto, entity, repository, service)
├── repository/          (JPA repositories + scheduler/)
├── retail/              (controller, dto, entity, repository, service)
├── scheduler/           (NotificationScheduler, MatchReminderScheduler)
├── security/            (JwtTokenProvider, JwtAuthFilter, AuditService, MaskingUtil)
├── service/
│   ├── impl/            (Service implementations)
│   ├── sample/data/     (Seeders — UserSeeder, SportsEventSeeder, etc.)
│   └── scheduler/       (Scheduled tasks, seeding/)
├── sms/                 (Twilio SMS/WhatsApp integration)
├── user/
│   ├── controller/      (AuthController, UserController)
│   ├── dto/             (Auth DTOs)
│   ├── model/           (AppUser entity)
│   ├── repository/      (AppUserRepository)
│   ├── security/        (UserPrincipal, UserDetailsService)
│   └── service/         (LoggedInUserService, ResolvedUser)
└── visitor/             (controller, dto, entity, repository, service)

src/main/resources/
├── application.yaml          (shared config)
├── application-local.yaml    (ddl-auto: create, mock-auth)
├── application-dev.yaml
├── application-prod.yaml     (ddl-auto: validate, PostgreSQL)
├── application-test.yaml     (H2 in-memory)
├── logback-spring.xml        (multi-file rolling log strategy)
└── db/sql/v1.0.0/            (migration scripts for prod)`,
};

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

function LiveApiAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const methodColor: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-emerald-100 text-emerald-700",
    PUT: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
    PATCH: "bg-purple-100 text-purple-700",
  };

  useEffect(() => {
    let cancelled = false;
    apiCatalogService.getApiCatalog()
      .then(data => { if (!cancelled) setGroups(data); })
      .catch(() => { if (!cancelled) setError("Could not load the live API catalog — the backend may be unreachable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading API catalog from backend…
      </div>
    );
  }

  if (error || groups.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{error ?? "No API endpoints found."}</span>
      </div>
    );
  }

  const totalEndpoints = groups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-3">{groups.length} controllers · {totalEndpoints} endpoints — live from backend introspection</p>
      {groups.map(g => (
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
              {g.endpoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded w-16 text-center shrink-0 ${methodColor[ep.method] ?? "bg-gray-100 text-gray-600"}`}>{ep.method}</span>
                  <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                  <span className="text-xs text-gray-400 font-mono">{ep.handler}()</span>
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
    { label: "Client Layer", items: ["React 19 + Vite","Axios + custom hooks","STOMP WebSocket (native)","JWT token management"], color: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
    { label: "Application Layer", items: ["Spring Boot 3.x","Spring Security (JWT + RBAC)","STOMP/WebSocket broker","Scheduled jobs (cron)"], color: "#FFF7ED", border: "#FED7AA", text: "#9A3412" },
    { label: "Data Layer", items: ["PostgreSQL 15","JPA / Hibernate","Local filesystem (logs, uploads)","In-memory STOMP broker"], color: "#FDF4FF", border: "#E9D5FF", text: "#6B21A8" },
    { label: "Observability", items: ["Logback (multi-file rolling)","Micrometer + Prometheus","Grafana dashboards","Correlation ID tracing"], color: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
    { label: "Infrastructure", items: ["AWS EC2 (single instance)","PostgreSQL (same host)","Nginx reverse proxy","HTTPS / Let's Encrypt"], color: "#F8FAFC", border: "#E2E8F0", text: "#475569" },
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
  { id: "apis",       label: "REST APIs",     icon: Globe },
  { id: "websocket",  label: "WebSocket",     icon: Activity },
  { id: "folders",    label: "Folder Structure", icon: GitBranch },
  { id: "security",   label: "Security",      icon: Shield },
  { id: "monitoring", label: "System Logs & Monitoring", icon: Gauge },
];

function ArchitectureContent({ tab }: { tab: ArchTab }) {
  const navigate = useNavigate();
  return (
    <div>
      {tab === "overview"   && <HLArchitecture />}
      {tab === "database"   && <ERDiagram />}
      {tab === "apis"       && <LiveApiAccordion />}
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
            { title: "Authentication — JWT (HMAC-SHA)", items: [
              "HMAC-SHA256 signed access token (15 min TTL, configurable via JWT_EXPIRATION_MS)",
              "Refresh token (7 days TTL) — returned in JSON response body",
              "Token rotation on every refresh call (/api/auth/refresh)",
              "Session tracking via user_sessions DB table (device, browser, IP, login/logout time)",
              "Mock-token shortcut for local dev (mock-token-{userId}, local profile only)",
            ]},
            { title: "Authorization — Permission-key RBAC", items: [
              "Roles: SUPER_ADMIN, COMMUNITY_ADMIN, SPORTS_ADMIN, plus per-user permission keys",
              "Per-endpoint checks via PermissionCheckService.requireAnyPermission()",
              "Granular permission_key system (role_permissions table: role + user-level overrides)",
              "Community-scoped data isolation via ResolvedUser.scopeCommunityId()",
              "Community-level module gating (community_module table — enable/disable features per community)",
            ]},
            { title: "WebSocket Security", items: [
              "JWT extracted from STOMP CONNECT frame Authorization header",
              "Validated via JwtTokenProvider before session establishment",
              "UsernamePasswordAuthenticationToken set as STOMP session principal",
              "Mock-auth restricted to local profile via @PostConstruct validation",
            ]},
            { title: "Data Security", items: [
              "Passwords hashed with BCrypt (Spring Security default rounds)",
              "PII field encryption via FieldEncryptionService (AES)",
              "All SQL via JPA parameterized queries — no raw string concatenation",
              "Sensitive data masking in logs via MaskingUtil (email, mobile, Aadhaar, tokens)",
              "Audit trail for every sensitive mutation (audit_log table + AUDIT logger)",
            ]},
            { title: "API Hardening", items: [
              "Per-IP rate limiting (configurable requests-per-minute, fixed window)",
              "File upload size limits (max-file-size: 5MB, max-request-size: 6MB)",
              "Tomcat max-http-form-post-size: 2MB (large-payload DoS mitigation)",
              "Server header suppressed, error details never exposed to client",
              "reCAPTCHA + OTP gates on public event registration (configurable, off by default)",
            ]},
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
                onClick={() => navigate("/architecture/logs")}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold text-center transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 whitespace-nowrap self-start md:self-center"
              >
                <Server className="w-4 h-4" />
                Launch Live Dashboard
              </button>
            </div>
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
                Log Architecture (logback-spring.xml)
              </h3>
              <pre className="text-[11px] font-mono bg-gray-950 text-gray-300 p-4 rounded-xl overflow-x-auto leading-relaxed" style={{ maxHeight: 200 }}>
{`Log files (daily + 10MB rolling, 30-day retention, gzip):
  mana-service.log   — primary app log (admin dashboard reads this)
  error.log          — ERROR level only
  security.log       — SECURITY_AUDIT (auth/login events)
  audit.log          — AUDIT (business mutation mirror)
  scheduler.log      — tournament scheduler
  auction.log        — AUCTION module logger
  chat.log           — CHAT module logger (metadata only, never content)
  notification.log   — NOTIFICATION module logger

Every log line: [cid=<correlationId> uid=<userId>]
  MDC correlation id auto-set by CorrelationIdFilter
  Echoed on response header + ErrorResponse for support`}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              { title: "Application Logging", items: ["Structured logging via SLF4J + Logback","Per-request correlation ID in MDC (X-Correlation-Id header)","Log levels per environment (DEBUG local, INFO/WARN prod)","Slow-API detection: WARN at 2s, ERROR at 5s (PERFORMANCE logger)","GlobalExceptionHandler logs every unhandled 500 with correlation ID"] },
              { title: "Audit Trail", items: ["AuditService records every sensitive mutation (after success)","Persisted to audit_log table (actor, action, module, old/new value, IP, correlation ID)","Immutable, append-only — action/module stored as strings (not DB enums)","Mirrored to AUDIT logger for file-based analysis","Surfaced in-app under Admin → Audit Trail"] },
              { title: "Metrics & Prometheus", items: ["Spring Boot Actuator: /actuator/health, /actuator/metrics, /actuator/prometheus","Micrometer → Prometheus registry (self-hosted, free)","Custom: chat_messages_sent_total, auction_bids_placed_total, admin_logs_fetch_errors_total","JVM, HTTP latency, HikariCP connection pool — auto-exported","Docker-compose stack: Prometheus + Grafana with auto-provisioned dashboards"] },
              { title: "Alerting & Dashboards", items: ["Grafana dashboard: app up, 5xx rate, JVM heap, request rate, p95 latency, chat/auction rates","AdminLogsServerError alert: fires on any 5xx to /api/admin/logs","Alert rules in prometheus/alerts.yml (Alertmanager routing to Slack/email: ready to enable)","Health endpoint public for load-balancer probes; /actuator/prometheus SUPER_ADMIN-only"] },
              { title: "Session & Security Audit", items: ["Auth events → SECURITY_AUDIT logger → security.log (emails masked)","Sessions tracked in user_sessions table (device, browser, IP, login/logout)","Concurrent active sessions flagged as MULTIPLE_DEVICE_LOGIN","JWT is stateless — user_sessions is an observability trail, not a session store"] },
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

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs">
          <span className="font-semibold text-indigo-700">Deployment</span>
          <span className="text-gray-600">
            Version <span className="font-mono font-semibold text-gray-900">{buildInfo.version}</span>
          </span>
          <span className="text-gray-600 flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono font-semibold text-gray-900">{buildInfo.branch}</span>
            <span className="text-gray-400">@ {buildInfo.commit}</span>
          </span>
          <span className="text-gray-600">
            Deployed <span className="font-semibold text-gray-900">{formatBuildTime()}</span>
          </span>
        </div>
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
