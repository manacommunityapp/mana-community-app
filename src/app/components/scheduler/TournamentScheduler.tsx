import React, { useState, useEffect } from "react";
import { Loader2, Plus, Calendar, Trophy, X, Eye, MapPin, Users, Clock } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

import { tournamentService } from "../../../services/sports/tournamentService";
import type { TournamentTypeInfo, EventInfo, ConfigInfo, TournamentDropdownItem } from "../../../services/sports/tournamentService";
import { sportsService } from "../../../services/sports/sportsService";
import type { EventRegistration } from "../../../types/api";
import { venueService } from "../../../services/bookings/venueService";
import type { Venue } from "../../../types/api";

export function TournamentScheduler() {
  const { token, user } = useAuth() as any;
  const [types, setTypes] = useState<TournamentTypeInfo[]>([]);
  const [tournaments, setTournaments] = useState<TournamentDropdownItem[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<ConfigInfo | null>(null);
  const [viewMatches, setViewMatches] = useState<any[]>([]);
  const [viewPlayers, setViewPlayers] = useState<EventRegistration[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form State
  const [fTournamentId, setFTournamentId] = useState("");
  const [fName, setFName] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [fType, setFType] = useState("");
  const [fTeams, setFTeams] = useState("8");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fGroups, setFGroups] = useState("2");
  const [fAdvancing, setFAdvancing] = useState("2");
  const [fSwissRounds, setFSwissRounds] = useState("3");
  const [fDuration, setFDuration] = useState("90");
  const [fBreak, setFBreak] = useState("30");
  const [fVenueId, setFVenueId] = useState<number | null>(null);
  const [fPtsWin, setFPtsWin] = useState("2");
  const [fPtsDraw, setFPtsDraw] = useState("1");
  const [fPtsLoss, setFPtsLoss] = useState("0");
  const [fThirdPlace, setFThirdPlace] = useState(true);
  const [fSeeding, setFSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venueList, setVenueList] = useState<Venue[]>([]);

  useEffect(() => {
    loadData();
  }, [token]);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resTypes, resTournaments, resEvents, resConfigs] = await Promise.all([
        tournamentService.getTournamentTypes(),
        tournamentService.getTournamentsForDropdown(),
        tournamentService.getEventsForDropdown(),
        tournamentService.getConfigs(),
      ]);
      setTypes(resTypes);
      setTournaments(resTournaments);
      setEvents(resEvents);
      setConfigs(resConfigs);
    } catch (e) {
      console.error("Failed to load tournament data", e);
    }
    // Load venues
    try {
      const v = await venueService.getVenues(user?.communityId);
      setVenueList(v);
    } catch (e) {
      console.error('Failed to load venues', e);
    }
    setLoading(false);
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tournamentOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    // 1. Add canonical tournaments
    for (const t of tournaments) {
      if (t && t.id) {
        map.set(t.id.toString(), { id: t.id.toString(), name: t.name });
      }
    }
    // 2. Add any tournaments referenced in events that might not be in tournaments list
    for (const e of events) {
      if (e.tournamentId) {
        const tid = e.tournamentId.toString();
        if (!map.has(tid)) {
          map.set(tid, { id: tid, name: e.tournamentName || `Tournament #${tid}` });
        }
      }
    }
    return Array.from(map.values());
  }, [tournaments, events]);

  const hasStandaloneEvents = React.useMemo(() => {
    return events.some(e => !e.tournamentId && !e.tournamentName);
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (!fTournamentId) return [];
    if (fTournamentId === "standalone") {
      return events.filter(e => !e.tournamentId && !e.tournamentName);
    }
    return events.filter(e => {
      if (e.tournamentId && e.tournamentId.toString() === fTournamentId) return true;
      const t = tournamentOptions.find(opt => opt.id === fTournamentId);
      if (t && e.tournamentName && e.tournamentName.trim().toLowerCase() === t.name.trim().toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [fTournamentId, events, tournamentOptions]);

  const resetForm = () => {
    setEditingId(null);
    setFTournamentId("");
    setFName("");
    setFEvent("");
    setFType("");
    setFTeams("8");
    setFStartDate("");
    setFEndDate("");
    setFGroups("2");
    setFAdvancing("2");
    setFSwissRounds("3");
    setFDuration("90");
    setFBreak("30");
    setFVenueId(null);
    setFPtsWin("2");
    setFPtsDraw("1");
    setFPtsLoss("0");
    setFThirdPlace(true);
    setFSeeding(false);
  };

  const handleTournamentChange = (tId: string) => {
    setFTournamentId(tId);
    setFEvent("");
    if (!tId) {
      setFName("");
      return;
    }
    const t = tournamentOptions.find(opt => opt.id === tId);
    if (t) {
      setFName(t.name);
    } else if (tId === "standalone") {
      setFName("");
    }
  };

  const handleEventChange = (selectedEventId: string) => {
    setFEvent(selectedEventId);
    const matchedEvent = events.find(ev => ev.id.toString() === selectedEventId);
    if (matchedEvent) {
      const tourney = tournamentOptions.find(opt => opt.id === fTournamentId);
      if (tourney && tourney.name) {
        setFName(`${tourney.name} — ${matchedEvent.name}`);
      } else {
        setFName(matchedEvent.name);
      }
      if (matchedEvent.totalTeams !== undefined && matchedEvent.totalTeams > 0) {
        setFTeams(matchedEvent.totalTeams.toString());
      }
      if (matchedEvent.eventDateStart) {
        setFStartDate(matchedEvent.eventDateStart);
      }
      if (matchedEvent.eventDateEnd) {
        setFEndDate(matchedEvent.eventDateEnd);
      }
      if (matchedEvent.venueId) {
        setFVenueId(matchedEvent.venueId);
      }
    }
  };

  const openModal = (config?: ConfigInfo) => {
    if (config) {
      setEditingId(config.id);
      setFName(config.tournamentName || "");
      const evId = config.eventId ? config.eventId.toString() : "";
      setFEvent(evId);
      if (config.eventId) {
        const ev = events.find(e => e.id === config.eventId);
        if (ev) {
          if (ev.tournamentId) {
            setFTournamentId(ev.tournamentId.toString());
          } else if (ev.tournamentName) {
            const t = tournamentOptions.find(opt => opt.name.trim().toLowerCase() === ev.tournamentName?.trim().toLowerCase());
            setFTournamentId(t ? t.id : "standalone");
          } else {
            setFTournamentId("standalone");
          }
        } else {
          setFTournamentId("");
        }
      } else {
        setFTournamentId("");
      }
      setFType(config.tournamentType || "");
      setFTeams(config.totalTeams ? config.totalTeams.toString() : "8");
      setFStartDate(config.startDate || "");
      setFEndDate(config.endDate || "");
      setFGroups(config.numberOfGroups ? config.numberOfGroups.toString() : "2");
      setFAdvancing(config.teamsAdvancingPerGroup ? config.teamsAdvancingPerGroup.toString() : "2");
      setFSwissRounds(config.swissRounds ? config.swissRounds.toString() : "3");
      setFDuration(config.matchDurationMinutes ? config.matchDurationMinutes.toString() : "90");
      setFBreak(config.breakBetweenMatchesMinutes ? config.breakBetweenMatchesMinutes.toString() : "30");
      setFVenueId(config.venueId ?? null);
      setFPtsWin(config.pointsForWin !== undefined ? config.pointsForWin.toString() : "2");
      setFPtsDraw(config.pointsForDraw !== undefined ? config.pointsForDraw.toString() : "1");
      setFPtsLoss(config.pointsForLoss !== undefined ? config.pointsForLoss.toString() : "0");
      setFThirdPlace(config.thirdPlaceMatch !== false);
      setFSeeding(config.hasSeeding === true);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) { showToast("Tournament name is required", "error"); return; }
    if (!fType) { showToast("Select a tournament type", "error"); return; }

    const eventId = fEvent || null;
    let sportId = 1, communityId = 1;
    if (eventId) {
      const ev = events.find((e) => e.id.toString() === eventId);
      if (ev) { sportId = ev.sportId; communityId = ev.communityId; }
    }

    const body = {
      tournamentName: fName.trim(),
      sportId,
      communityId,
      eventId: eventId ? Number(eventId) : null,
      tournamentType: fType,
      totalTeams: Number(fTeams) || 8,
      teamIds: [],
      numberOfGroups: fType === "GROUP_KNOCKOUT" ? Number(fGroups) : null,
      teamsAdvancingPerGroup: fType === "GROUP_KNOCKOUT" ? Number(fAdvancing) : null,
      swissRounds: fType === "SWISS" ? Number(fSwissRounds) : null,
      thirdPlaceMatch: fThirdPlace,
      hasSeeding: fSeeding,
      startDate: fStartDate || null,
      endDate: fEndDate || null,
      matchDurationMinutes: Number(fDuration) || 90,
      breakBetweenMatchesMinutes: Number(fBreak) || 30,
      venueId: fVenueId,
      pointsForWin: Number(fPtsWin),
      pointsForDraw: Number(fPtsDraw),
      pointsForLoss: Number(fPtsLoss),
    };

    setSaving(true);
    try {
      if (editingId) {
        await tournamentService.updateConfig(editingId, body);
      } else {
        await tournamentService.createConfig(body);
      }
      showToast(editingId ? "Configuration updated!" : "Configuration saved!");
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      showToast("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatType = (t: string) => {
    const map: any = { KNOCKOUT: "Knockout", GROUP_KNOCKOUT: "Group+KO", ROUND_ROBIN: "Round Robin", DOUBLE_ELIMINATION: "Double Elim", SWISS: "Swiss", SUPER_LEAGUE: "Super League" };
    return map[t] || t;
  };

  const openScheduleDetails = async (config: ConfigInfo) => {
    setViewingConfig(config);
    setViewMatches([]);
    setViewPlayers([]);
    setViewError("");
    setViewLoading(true);
    const [matchesResult, playersResult] = await Promise.allSettled([
      tournamentService.getSavedMatchesByConfigId(config.id),
      config.eventId ? sportsService.getEventRegistrations(config.eventId) : Promise.resolve([] as EventRegistration[]),
    ]);
    if (matchesResult.status === "fulfilled") setViewMatches(matchesResult.value);
    else setViewError("Could not load the saved match schedule.");
    if (playersResult.status === "fulfilled") {
      setViewPlayers(playersResult.value.filter((player) => player.status === "CONFIRMED" || player.status === "REGISTERED"));
    } else {
      setViewError((current) => current ? `${current} Player registrations could not be loaded.` : "Player registrations could not be loaded.");
    }
    setViewLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 text-left">
      {toast && (
        <div className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-lg z-50 font-medium ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex h-[60px] min-h-[60px] max-h-[60px] w-full items-center justify-between gap-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3 py-0 shadow-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
          <h1 className="truncate text-xs font-bold leading-4 text-slate-900">Tournament configurations</h1>
          <span className="inline-flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 px-1 text-[8px] font-extrabold leading-none text-indigo-700">{configs.length}</span>
        </div>
        <button onClick={() => openModal()} aria-label="New configuration" title="New configuration" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
        ) : configs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Trophy className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-bold text-slate-800">No tournament configurations yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">Create a configuration to set the format, dates and match rules for a tournament.</p>
            <button onClick={() => openModal()} className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Create configuration</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tournament</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Event</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Teams</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Start date</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">View</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-indigo-50/40">
                    <td className="max-w-[260px] truncate px-4 py-3 text-sm font-bold text-slate-900">{c.tournamentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatType(c.tournamentType)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-600">{c.eventName || "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{c.totalTeams || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{c.startDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                        ${c.status === "DRAFT" ? "bg-slate-100 text-slate-600" :
                          c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                          c.status === "LIVE" ? "bg-indigo-50 text-indigo-700" :
                          "bg-sky-50 text-sky-700"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => void openScheduleDetails(c)} aria-label={`View ${c.tournamentName} schedule details`} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openModal(c)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 hover:text-indigo-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingConfig && (() => {
        const event = events.find((item) => item.id === viewingConfig.eventId);
        const venue = venueList.find((item) => item.id === viewingConfig.venueId);
        const dateLabel = (value?: string) => value ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not set";
        const matchDateLabel = (value?: string) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Time not set";
        const detail = (label: string, value: React.ReactNode) => (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <div className="mt-1 text-sm font-semibold text-slate-800">{value || "Not set"}</div>
          </div>
        );
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewingConfig(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="schedule-details-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><Calendar className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">Sports event schedule</p>
                    <h2 id="schedule-details-title" className="mt-1 truncate text-base font-extrabold text-slate-900 sm:text-lg">{viewingConfig.tournamentName}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{event ? `${event.sportName} · ${event.communityName}` : "Tournament configuration details"}</p>
                  </div>
                </div>
                <button onClick={() => setViewingConfig(null)} aria-label="Close schedule details" className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"><X className="h-4 w-4" /></button>
              </header>
              <div className="max-h-[min(70vh,620px)] space-y-4 overflow-y-auto p-4 sm:p-6">
                {viewLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading event players and schedule…</div>
                ) : (
                  <>
                    {viewError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">{viewError}</div>}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {detail("Format", formatType(viewingConfig.tournamentType))}
                      {detail("Registered players", <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-500" />{viewPlayers.length}</span>)}
                      {detail("Scheduled matches", viewMatches.length)}
                      {detail("Status", <span className="capitalize">{(viewingConfig.status || "Not set").toLowerCase()}</span>)}
                      {detail("Start date", dateLabel(viewingConfig.startDate))}
                      {detail("End date", dateLabel(viewingConfig.endDate))}
                      {detail("Venue", <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />{venue?.name || "Not set"}</span>)}
                    </div>
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-3">
                        <h3 className="m-0 inline-flex items-center gap-2 text-xs font-extrabold text-slate-800"><Users className="h-4 w-4 text-indigo-600" />Registered players</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{viewPlayers.length}</span>
                      </div>
                      {viewPlayers.length ? <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:gap-1 sm:p-2">
                        {viewPlayers.map((player) => <div key={player.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:rounded-lg sm:px-2.5">
                          <div className="min-w-0"><p className="m-0 truncate text-xs font-bold text-slate-800">{player.playerName || player.user?.fullName || "Player"}</p><p className="m-0 mt-0.5 truncate text-[10px] text-slate-500">{[player.category?.name, player.flatNumber].filter(Boolean).join(" · ") || player.status}</p></div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">{player.status}</span>
                        </div>)}
                      </div> : <p className="m-0 px-4 py-5 text-center text-xs text-slate-500">No confirmed or registered players are available for this event.</p>}
                    </section>
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-3">
                        <h3 className="m-0 inline-flex items-center gap-2 text-xs font-extrabold text-slate-800"><Calendar className="h-4 w-4 text-indigo-600" />Complete match schedule</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{viewMatches.length}</span>
                      </div>
                      {viewMatches.length ? <div className="divide-y divide-slate-100">
                        {viewMatches.map((match, index) => <article key={match.matchId ?? match.id ?? index} className="p-3.5 sm:p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">{match.roundName || match.groupName || `Match ${match.matchNumber ?? index + 1}`}{match.matchNumber ? ` · Match ${match.matchNumber}` : ""}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-600">{String(match.status || "SCHEDULED").replaceAll("_", " ")}</span>
                          </div>
                          <div className="my-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-slate-50 px-3 py-3">
                            <div className="min-w-0"><p className="m-0 truncate text-xs font-bold text-slate-800">{match.teamAName || match.homeName || "TBD"}</p>{match.scoreTeamA != null && <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">{match.scoreTeamA}</p>}</div>
                            <span className="text-[9px] font-bold text-slate-400">VS</span>
                            <div className="min-w-0 text-right"><p className="m-0 truncate text-xs font-bold text-slate-800">{match.teamBName || match.awayName || (match.isBye ? "BYE" : "TBD")}</p>{match.scoreTeamB != null && <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">{match.scoreTeamB}</p>}</div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{matchDateLabel(match.scheduledAt || match.matchDate || match.date)}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{match.venueName || venue?.name || "Venue not set"}{match.courtName ? ` · ${match.courtName}` : ""}</span>
                          </div>
                        </article>)}
                      </div> : <p className="m-0 px-4 py-5 text-center text-xs text-slate-500">No saved matches are available for this configuration yet.</p>}
                    </section>
                  </>
                )}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                  <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500">Match settings</h3>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
                    <div><span className="text-slate-400">Duration</span><p className="mb-0 mt-1 inline-flex items-center gap-1 font-semibold text-slate-800"><Clock className="h-3.5 w-3.5 text-indigo-500" />{viewingConfig.matchDurationMinutes ? `${viewingConfig.matchDurationMinutes} min` : "Not set"}</p></div>
                    <div><span className="text-slate-400">Break between matches</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.breakBetweenMatchesMinutes != null ? `${viewingConfig.breakBetweenMatchesMinutes} min` : "Not set"}</p></div>
                    <div><span className="text-slate-400">Groups</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.numberOfGroups ?? "—"}</p></div>
                    <div><span className="text-slate-400">Advancing per group</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.teamsAdvancingPerGroup ?? "—"}</p></div>
                    <div><span className="text-slate-400">Swiss rounds</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.swissRounds ?? "—"}</p></div>
                    <div><span className="text-slate-400">Points (W / D / L)</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.pointsForWin ?? 2} / {viewingConfig.pointsForDraw ?? 1} / {viewingConfig.pointsForLoss ?? 0}</p></div>
                  </div>
                </div>
              </div>
              <footer className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
                <button onClick={() => setViewingConfig(null)} className="min-h-9 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700">Close</button>
              </footer>
            </section>
          </div>
        );
      })()}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-5">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                {editingId ? "Edit Tournament Configuration" : "New Tournament Configuration"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close configuration" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tournament *
                  </label>
                  <select
                    value={fTournamentId}
                    onChange={(e) => handleTournamentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                  >
                    <option value="">— Select Tournament —</option>
                    {tournamentOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    {hasStandaloneEvents && (
                      <option value="standalone">— Standalone / Individual Events —</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sport Event / Category *
                  </label>
                  <select
                    value={fEvent}
                    onChange={(e) => handleEventChange(e.target.value)}
                    disabled={!fTournamentId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">
                      {!fTournamentId
                        ? "— Select Tournament First —"
                        : filteredEvents.length === 0
                        ? "— No events under this tournament —"
                        : "— Select Sport Event / Category —"}
                    </option>
                    {filteredEvents.map((e) => {
                      const rawFmt = e.formats || e.format;
                      const fmtList = Array.isArray(rawFmt) ? rawFmt : (rawFmt ? [rawFmt] : []);
                      const fmt = fmtList.map(f => String(f).toUpperCase() === 'SINGLES' ? 'Singles' : String(f).toUpperCase() === 'DOUBLES' ? 'Doubles' : String(f).toUpperCase().includes('MIXED') ? 'Mixed Doubles' : String(f).toUpperCase() === 'TEAM' ? 'Team' : f).join(' / ');
                      const fmtPart = fmt && !e.name.toLowerCase().includes(fmt.toLowerCase()) ? ` — ${fmt}` : '';
                      return (
                        <option key={e.id} value={e.id}>
                          {e.name}{fmtPart} {e.sportName ? `(${e.sportName})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Configuration Title / Schedule Name *
                </label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Monsoon Badminton Cup — Men's Doubles Championship"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Auto-populated when selecting a tournament and sport event, but customizable for your schedule.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tournament Type *</label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {types.map((t) => (
                    <button key={t.id} type="button" onClick={() => setFType(t.id)}
                      className={`min-h-[108px] rounded-xl border p-3.5 text-left transition-all ${fType === t.id ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/10" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"}`}>
                      <div className={`text-sm font-bold tracking-tight ${fType === t.id ? "text-indigo-700" : "text-slate-800"}`}>{t.name}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-snug">{t.description}</div>
                      <div className="text-[10px] mt-2 bg-indigo-50 text-indigo-700 inline-block px-2 py-0.5 rounded">{t.teamRange} teams</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Total Teams *</label>
                  <input type="number" min="2" max="128" value={fTeams} onChange={(e) => setFTeams(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date *</label>
                  <input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:light]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:light]" />
                </div>
              </div>

              {fType === "GROUP_KNOCKOUT" && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Number of Groups</label>
                    <input type="number" min="2" max="8" value={fGroups} onChange={(e) => setFGroups(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Advancing per Group</label>
                    <input type="number" min="1" max="8" value={fAdvancing} onChange={(e) => setFAdvancing(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </div>
              )}

              {fType === "SWISS" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Swiss Rounds</label>
                  <input type="number" min="1" max="20" value={fSwissRounds} onChange={(e) => setFSwissRounds(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Duration (min)</label>
                  <input type="number" value={fDuration} onChange={(e) => setFDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Break (min)</label>
                  <input type="number" value={fBreak} onChange={(e) => setFBreak(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Venue</label>
                  <select value={fVenueId ?? ''} onChange={(e) => setFVenueId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
                    <option value="">— Select Venue —</option>
                    {venueList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Win</label>
                  <input type="number" value={fPtsWin} onChange={(e) => setFPtsWin(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Draw</label>
                  <input type="number" value={fPtsDraw} onChange={(e) => setFPtsDraw(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Loss</label>
                  <input type="number" value={fPtsLoss} onChange={(e) => setFPtsLoss(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={fThirdPlace} onChange={(e) => setFThirdPlace(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  3rd Place Match
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={fSeeding} onChange={(e) => setFSeeding(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  Seeded Draw
                </label>
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
              <button onClick={() => setIsModalOpen(false)} className="min-h-10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Configuration" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
