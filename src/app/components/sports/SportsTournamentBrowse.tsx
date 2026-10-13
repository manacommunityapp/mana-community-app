import { useState, useEffect, useMemo, useCallback } from "react";
import { Trophy, Calendar, Users, MapPin, Loader2, ChevronRight, Search, Medal, TrendingUp, ChevronDown } from "lucide-react";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { sportsService } from "../../../services/sports/sportsService";
import { tournamentService } from "../../../services/sports/tournamentService";
import type { SportsEvent } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { SportsTournamentStandings } from "./SportsTournamentStandings";

type BrowseTab = "open" | "my" | "closed";

export function SportsTournamentBrowse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BrowseTab>("open");
  const [openTournaments, setOpenTournaments] = useState<DashboardTournamentCard[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<DashboardTournamentCard[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("All");

  useEffect(() => {
    Promise.all([
      sportsDashboardService.getOpenTournaments().catch(() => []),
      sportsDashboardService.getClosedTournaments().catch(() => []),
      sportsService.getMyTournaments().catch(() => []),
    ]).then(([open, closed, my]) => {
      setOpenTournaments(open);
      setClosedTournaments(closed);
      setMyRegistrations(my);
    }).finally(() => setLoading(false));
  }, []);

  const tabs: { key: BrowseTab; label: string; icon: typeof Trophy; count: number }[] = [
    { key: "open", label: "Open", icon: Trophy, count: openTournaments.length },
    { key: "my", label: "My Tournaments", icon: Medal, count: myRegistrations.length },
    { key: "closed", label: "Completed", icon: Calendar, count: closedTournaments.length },
  ];

  const allSports = useMemo(() => {
    const sports = new Set<string>();
    for (const t of [...openTournaments, ...closedTournaments]) {
      for (const ev of t.events || []) {
        if (ev.sportName) sports.add(ev.sportName);
      }
    }
    for (const ev of myRegistrations) {
      if (ev.sportName) sports.add(ev.sportName);
    }
    return ["All", ...Array.from(sports).sort()];
  }, [openTournaments, closedTournaments, myRegistrations]);

  const matchesSportFilter = useCallback((t: DashboardTournamentCard) => {
    if (sportFilter === "All") return true;
    return t.events?.some(ev => ev.sportName === sportFilter);
  }, [sportFilter]);

  const filteredOpen = useMemo(() => {
    let list = openTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q));
  }, [openTournaments, search, sportFilter, matchesSportFilter]);

  const filteredClosed = useMemo(() => {
    let list = closedTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q));
  }, [closedTournaments, search, sportFilter, matchesSportFilter]);

  const filteredMy = useMemo(() => {
    let list = myRegistrations;
    if (sportFilter !== "All") list = list.filter(ev => ev.sportName === sportFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q));
  }, [myRegistrations, search, sportFilter]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 13 }}>Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={20} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>Tournaments</span>
        </div>
        <div style={{ position: "relative", minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            style={{
              width: "100%", fontSize: 12, padding: "7px 12px 7px 30px", borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)",
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(148,163,184,0.06)", borderRadius: 10, marginBottom: 16 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? "var(--card)" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              color: active ? "var(--text)" : "var(--muted)",
              fontWeight: active ? 700 : 500, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              transition: "all 0.15s",
            }}>
              <Icon size={12} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                  background: active ? "rgba(212,160,23,0.15)" : "rgba(148,163,184,0.1)",
                  color: active ? "var(--gold)" : "var(--muted)",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sport Filter Pills */}
      {allSports.length > 2 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 12, WebkitOverflowScrolling: "touch" }}>
          {allSports.map(sport => {
            const active = sportFilter === sport;
            return (
              <button key={sport} onClick={() => setSportFilter(sport)} style={{
                padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                background: active ? "rgba(212,160,23,0.15)" : "rgba(148,163,184,0.08)",
                color: active ? "var(--gold)" : "var(--muted)",
                fontWeight: active ? 700 : 500, fontSize: 11, whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}>
                {sport}
              </button>
            );
          })}
        </div>
      )}

      {/* Open Tournaments */}
      {activeTab === "open" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredOpen.length === 0 ? (
            <EmptyState message="No open tournaments" />
          ) : filteredOpen.map(t => (
            <TournamentCard key={t.id} tournament={t} onClick={() => navigate(`/sports/schedule/${t.id}`)} />
          ))}
        </div>
      )}

      {/* My Tournaments */}
      {activeTab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredMy.length === 0 ? (
            <EmptyState message="You haven't joined any tournaments yet" />
          ) : filteredMy.map(ev => (
            <MyTournamentCard key={ev.id} event={ev} onClick={() => navigate(`/sports/schedule/${ev.id}`)} />
          ))}
        </div>
      )}

      {/* Closed Tournaments */}
      {activeTab === "closed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredClosed.length === 0 ? (
            <EmptyState message="No completed tournaments" />
          ) : filteredClosed.map(t => (
            <TournamentCard key={t.id} tournament={t} completed onClick={() => navigate(`/sports/schedule/${t.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament, completed, onClick }: {
  tournament: DashboardTournamentCard; completed?: boolean; onClick: () => void;
}) {
  const eventCount = tournament.events?.length ?? 0;
  const [showStandings, setShowStandings] = useState(false);
  const [configIds, setConfigIds] = useState<number[]>([]);

  useEffect(() => {
    if (showStandings && configIds.length === 0) {
      tournamentService.getConfigs()
        .then(configs => {
          const ids = configs
            .filter((c: any) => tournament.events?.some(e => e.id === c.eventId))
            .map((c: any) => c.id);
          setConfigIds(ids);
        })
        .catch(() => setConfigIds([]));
    }
  }, [showStandings]);

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.12)", background: "rgba(148,163,184,0.02)",
    }}>
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{tournament.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: completed ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)",
              color: completed ? "#10b981" : "#3b82f6", textTransform: "uppercase",
            }}>
              {completed ? "Completed" : tournament.registrationStatus || "Open"}
            </span>
          </div>

          {tournament.communityName && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{tournament.communityName}</div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {tournament.eventDateStart && (
              <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Calendar size={10} /> {new Date(tournament.eventDateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {tournament.eventDateEnd && ` - ${new Date(tournament.eventDateEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
              </span>
            )}
            {eventCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Trophy size={10} /> {eventCount} event{eventCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Event chips */}
          {tournament.events?.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
              {tournament.events.slice(0, 4).map(ev => (
                <span key={ev.id} style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 6,
                  background: "rgba(148,163,184,0.08)", color: "var(--muted)",
                }}>
                  {ev.sportName || ev.name}
                  {ev.registeredCount != null && ` (${ev.registeredCount})`}
                </span>
              ))}
              {tournament.events.length > 4 && (
                <span style={{ fontSize: 9, color: "var(--muted)" }}>+{tournament.events.length - 4} more</span>
              )}
            </div>
          )}
        </div>
        <ChevronRight size={16} style={{ color: "var(--muted)", opacity: 0.5 }} />
      </div>

      {/* Standings toggle */}
      <div style={{ marginTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)", paddingTop: 6 }}>
        <button onClick={() => setShowStandings(!showStandings)} style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
          border: "1px solid rgba(148,163,184,0.15)", background: showStandings ? "rgba(212,160,23,0.08)" : "transparent",
          color: showStandings ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <TrendingUp size={10} /> Standings
          <ChevronDown size={10} style={{ transform: showStandings ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {showStandings && configIds.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <SportsTournamentStandings configId={configIds[0]} inline />
          </div>
        )}
        {showStandings && configIds.length === 0 && (
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>No tournament config found for standings</div>
        )}
      </div>
    </div>
  );
}

function MyTournamentCard({ event, onClick }: { event: SportsEvent; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
      border: "1px solid rgba(212,160,23,0.15)", background: "rgba(212,160,23,0.03)",
      transition: "transform 0.1s, box-shadow 0.1s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{event.name}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {event.sportName && (
              <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Trophy size={10} /> {event.sportName}
              </span>
            )}
            {event.eventDateStart && (
              <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Calendar size={10} /> {new Date(event.eventDateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {event.venueName && (
              <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={10} /> {event.venueName}
              </span>
            )}
            {event.registrationStatus && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                background: "rgba(212,160,23,0.12)", color: "var(--gold)",
              }}>
                {event.registrationStatus}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--muted)", opacity: 0.5 }} />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
      <Trophy size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
      <div style={{ fontSize: 12 }}>{message}</div>
    </div>
  );
}
