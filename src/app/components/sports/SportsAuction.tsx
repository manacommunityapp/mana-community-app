import { useState, useEffect, useCallback, useRef } from "react";
import { safeStorage } from "../../../utils/storage";
import { useParams, useSearchParams, useNavigate as useRouterNavigate } from "react-router";
import { toast } from "sonner";
import {
  Gavel,
  TrendingUp,
  CheckCircle,
  Trophy,
  LayoutDashboard,
  Activity,
  Settings,
  Users,
  Search,
  FileText,
  CalendarDays,
  ExternalLink,
  Timer,
  Download
} from "lucide-react";
import { auctionService } from "../../../services/sports/auctionService";
import { sportsService } from "../../../services/sports/sportsService";
import { userService } from "../../../services/common/userService";
import { stompClient } from "../../../services/chat/stompClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU,
  VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG,
  VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION,
  VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL,
  VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS,
  VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN,
} from "../../../constants/permissions";
import type { AuctionPlayer, AuctionTeam, PlayerWithBidResponse, AuctionStatsResponse, EventRegistration, AuctionEvent } from "../../../types/api";
import "./SportsAuction.css";

// ─── Fallback Data ─────────────────────────────────────────────
const FALLBACK_COLORS = ["#f97316", "#16a085", "#2e86de", "#e67e22", "#e03e3e", "#27ae60", "#d4a017", "#8a9ab0"];
const FALLBACK_EMOJIS = ["🔥", "👑", "🦅", "⚔️", "🛡️", "🔥", "👑", "⚡"];

const mapTeamData = (summary: any, idx: number): AuctionTeam => {
  const budgetVal = summary.totalBudget ?? summary.budget ?? 0;
  const spentVal = summary.spent ?? 0;
  const nameVal = summary.teamName || summary.name || `Team ${idx + 1}`;
  return {
    ...summary,
    id: summary.id,
    name: nameVal,
    teamName: nameVal,
    ownerName: summary.ownerName || summary.ownerUser?.fullName || summary.ownerUser?.name || 'Not Assigned',
    color: summary.colorHex || summary.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    colorHex: summary.colorHex || summary.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    emoji: summary.emoji || FALLBACK_EMOJIS[idx % FALLBACK_EMOJIS.length],
    budget: budgetVal,
    totalBudget: budgetVal,
    remainingBudget: summary.remainingBudget ?? (budgetVal - spentVal),
    spent: spentVal,
    players: summary.players || [],
  };
};

export function SportsAuction() {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  // Granular permission flags — each maps to a specific sidebar section / tab
  const canViewSportsMenu    = hasAnyPermission(VIEW_SPORTS_MENU,          CREATE_EDIT_SPORTS_MENU);
  const canViewAuctionConfig = hasAnyPermission(VIEW_AUCTION_CONFIG,       CREATE_EDIT_AUCTION_CONFIG);
  const canEditAuctionConfig = hasPermission(CREATE_EDIT_AUCTION_CONFIG);
  const canViewLiveAuction   = hasAnyPermission(VIEW_LIVE_AUCTION,         CREATE_EDIT_LIVE_AUCTION);
  const canEditLiveAuction   = hasPermission(CREATE_EDIT_LIVE_AUCTION);
  const canViewTeams         = hasAnyPermission(VIEW_TEAMS_DASHBOARD,       CREATE_EDIT_TEAMS_DASHBOARD);
  const canEditTeams         = hasPermission(CREATE_EDIT_TEAMS_DASHBOARD);
  const canViewPlayerPool    = hasAnyPermission(VIEW_PLAYER_POOL,           CREATE_EDIT_PLAYER_POOL);
  const canEditPlayerPool    = hasPermission(CREATE_EDIT_PLAYER_POOL);
  const canViewRegistrations = hasAnyPermission(VIEW_EVENT_REGISTRATIONS,  CREATE_EDIT_EVENT_REGISTRATIONS);
  const canViewResults       = hasAnyPermission(VIEW_AUCTION_RESULTS,       CREATE_EDIT_AUCTION_RESULTS);
  const isAdmin              = hasPermission(CREATE_EDIT_SPORTS_MAIN);

  // Kept for backward compat with any code that still references isAuctionAdmin
  const isAuctionAdmin = canEditAuctionConfig || canEditLiveAuction;
  const { eventId } = useParams();
  const routerNavigate = useRouterNavigate();

  // Navigation State
  type TabType = 'overview' | 'config' | 'live' | 'teams' | 'players' | 'registrations' | 'results' | 'badminton' | 'football' | 'volleyball' | string;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabType) || (eventId ? "live" : "overview");
  const setActiveTab = (tab: TabType) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    }, { replace: true });
  };

  // Config State
  const [sport, setSport] = useState("cricket");
  const [committee, setCommittee] = useState<Array<{ id: number, name: string }>>([]);
  const [newMember, setNewMember] = useState("");
  const [categories, setCategories] = useState(["Batsmen", "Bowlers", "All-rounders"]);
  const [basePrice, setBasePrice] = useState(1000);
  const [bidIncrementDefault, setBidIncrementDefault] = useState(1000);
  const [bidIncrementThreshold, setBidIncrementThreshold] = useState(10000);
  const [bidIncrementAbove, setBidIncrementAbove] = useState(5000);
  const [totalTeamsConfig, setTotalTeamsConfig] = useState(8);
  const [totalPlayersConfig, setTotalPlayersConfig] = useState(43);
  const [budgetPerTeamConfig, setBudgetPerTeamConfig] = useState(100000);
  const [unsoldRule, setUnsoldRule] = useState("ROTATION_AUCTION");
  const [auctionStatus, setAuctionStatus] = useState("DRAFT");
  const [seasonName, setSeasonName] = useState("Season 2026");
  const [auctionFormat, setAuctionFormat] = useState("OPEN_AUCTION");
  const [bidTimerSeconds, setBidTimerSeconds] = useState(30);

  // Event Selection State
  const [availableConfigs, setAvailableConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(eventId ? Number(eventId) : null);

  // Live Auction State
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Auction — dynamic state
  const [livePlayer, setLivePlayer] = useState<PlayerWithBidResponse | null>(null);
  const [liveBidHistory, setLiveBidHistory] = useState<Array<{ team: string; amount: number; time: string }>>([]);
  const [biddingTeamId, setBiddingTeamId] = useState<number | null>(null);
  const [configExistsForCommunity, setConfigExistsForCommunity] = useState<boolean | null>(null);
  const [auctionStats, setAuctionStats] = useState<AuctionStatsResponse | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [eventMap, setEventMap] = useState<Array<{ id: number, name: string }>>([]);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [newTeamBudget, setNewTeamBudget] = useState(100000);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Search / Filter State
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerStatusFilter, setPlayerStatusFilter] = useState<string>("ALL");
  const [registrationSearchQuery, setRegistrationSearchQuery] = useState("");

  // Bid Timer State
  const [bidTimeLeft, setBidTimeLeft] = useState<number | null>(null);
  const bidTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch available configs on mount — scoped to user's community
  useEffect(() => {
    // Check if any auction config exists for this community (no sportId filter)
    auctionService.checkConfigExists().then(result => {
      setConfigExistsForCommunity(result.configExists);
    }).catch(() => setConfigExistsForCommunity(false));

    // Fetch all community configs
    auctionService.getAllCommunityConfigs().then(configs => {
      setAvailableConfigs(configs);
      if (configs.length > 0 && !selectedConfigId) {
        const completed = configs.filter(c => c.status === 'COMPLETED');
        if (completed.length > 0) {
          setSelectedConfigId(completed[0].id);
        } else {
          setSelectedConfigId(configs[0].id);
        }
      }
    }).catch(err => console.error("Failed to fetch configs", err));
  }, []);

  // Fetch from backend when selectedConfigId changes
  useEffect(() => {
    if (!selectedConfigId) return;
    const configIdToFetch = selectedConfigId;

    Promise.all([
      auctionService.getConfig(configIdToFetch).catch(() => null),
      auctionService.getPlayers(configIdToFetch).catch(() => []),
      auctionService.getTeamsSummary(configIdToFetch).catch(() => []),
      auctionService.getAuctionStats(configIdToFetch).catch(() => null),
      auctionService.getRegistrationCount(configIdToFetch).catch(() => 0),
    ]).then(([config, p, t, stats, regCount]) => {
      if (config) {
        setAuctionStatus(config.status);
        setSport(config.sportName.toLowerCase());
        setSelectedEventId(config.eventId || null);
        setBasePrice(config.basePrice);
        setBidIncrementDefault(config.bidIncrementDefault);
        setBidIncrementThreshold(config.bidIncrementThreshold);
        setBidIncrementAbove(config.bidIncrementAbove);
        setTotalTeamsConfig(config.totalTeams);
        setTotalPlayersConfig(config.totalPlayers);
        setBudgetPerTeamConfig(config.budgetPerTeam);
        setUnsoldRule(config.unsoldRule);
        if (config.categories?.length) setCategories(config.categories);
        if (config.committeeMembers?.length) {
          setCommittee((config.committeeMembers as string[]).map((name, idx) => ({ id: idx + 1, name })));
        }

        if (config.status === "LIVE" || config.status === "ACTIVE") {
          auctionService.getCurrentPlayer(configIdToFetch)
            .then(player => {
              setLivePlayer(player);
              setLiveBidHistory([{ team: "Current Bid", amount: player.currentBid, time: new Date().toLocaleTimeString() }]);
            })
            .catch(() => setLivePlayer(null));
        }
      }

      if (regCount !== undefined) setRegistrationCount(regCount);
      if (stats) setAuctionStats(stats);
      if (p && p.length) setPlayers(p);
      if (t && t.length) {
        const mappedTeams = t.map((summary: any, idx: number) => {
          const teamObj = mapTeamData(summary, idx);
          const teamPlayers = (p || []).filter((player: any) => player.assignedTeam?.id === summary.id || (player as any).assignedTeamId === summary.id).map((pl: any) => ({
            name: pl.name || (pl as any).playerName || 'Player',
            soldPrice: pl.soldPrice || pl.basePrice || 0,
            category: pl.category || pl.role || 'Player'
          }));
          return {
            ...teamObj,
            players: teamPlayers.length > 0 ? teamPlayers : teamObj.players
          };
        });
        setTeams(mappedTeams);
      }
    }).catch((err) => {
      console.error("Failed to load auction data:", err);
    }).finally(() => setLoading(false));
  }, [selectedConfigId]);

  // Fetch community events and event map only when a tab that needs them is active
  const eventsLoadedRef = useRef(false);
  const needsEvents = activeTab === 'overview' || activeTab === 'config' || activeTab === 'live' || activeTab === 'registrations' || activeTab === 'results';
  useEffect(() => {
    if (eventsLoadedRef.current || !needsEvents) return;
    eventsLoadedRef.current = true;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const communityId = user?.communityId || undefined;

    if (isSuperAdmin) {
      const fetchEvents = communityId ? sportsService.getCommunityEvents(communityId) : sportsService.getAllTournaments();
      fetchEvents.then(events => setCommunityEvents(events)).catch(err => console.error("Failed to fetch all events", err));
      sportsService.getEventMap(communityId).then(map => setEventMap(map)).catch(err => console.error("Failed to fetch event map", err));
    } else if (communityId) {
      sportsService.getCommunityEvents(communityId).then(events => setCommunityEvents(events)).catch(err => console.error("Failed to fetch community events", err));
      sportsService.getEventMap(communityId).then(map => setEventMap(map)).catch(err => console.error("Failed to fetch event map", err));
    }
  }, [user?.communityId, user?.role, needsEvents]);

  // Fetch confirmed player count and committee when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      sportsService.getConfirmedCount(selectedEventId)
        .then(count => setRegistrationCount(count))
        .catch(err => console.error("Failed to fetch registration count", err));

      Promise.all([
        sportsService.getEventRegistrations(selectedEventId),
        sportsService.getEventById(selectedEventId)
      ]).then(([regs, event]) => {
        const confirmed = regs.filter(r => r.status === 'CONFIRMED').map(r => ({
          id: r.user?.id || r.id,
          name: r.playerName || r.user?.fullName || 'Unknown',
          role: r.role || r.category?.name || 'Player'
        }));
        setEventRegistrations(confirmed);

        // Hydrate committee
        if (event.disputeCommitteeIds) {
          const ids = event.disputeCommitteeIds.split(',').map(Number);
          const members = confirmed.filter(r => ids.includes(Number(r.id)));
          setCommittee(members);
        } else {
          setCommittee([]);
        }

        // Fetch all community users for this event's community
        if (event.community?.id) {
          userService.getCommunityUsers(event.community.id)
            .then(users => setCommunityUsers(users.map(u => ({ id: u.id, name: u.fullName || 'Unnamed User' }))))
            .catch(() => setCommunityUsers([]));
        }
      }).catch(err => console.error("Failed to fetch event data", err));
    } else {
      setRegistrationCount(0);
      setEventRegistrations([]);
      setCommunityUsers([]);
      setCommittee([]);
    }
  }, [selectedEventId]);

  // ─── WebSocket: subscribe to live auction events ───────────────────────
  useEffect(() => {
    if (!selectedConfigId || (auctionStatus !== 'LIVE' && auctionStatus !== 'ACTIVE')) return;

    const unsub = stompClient.subscribe(`/topic/auction/${selectedConfigId}`, (data: unknown) => {
      const event = data as AuctionEvent;
      switch (event.type) {
        case 'BID_PLACED': {
          const bid = event.payload;
          setBiddingTeamId(bid.teamId);
          setLiveBidHistory(prev => [
            { team: bid.teamName, amount: bid.bidAmount, time: new Date(bid.bidAt || event.timestamp).toLocaleTimeString() },
            ...prev
          ]);
          auctionService.getCurrentPlayer(selectedConfigId).then(p => setLivePlayer(p)).catch(() => {});
          resetBidTimer();
          break;
        }
        case 'PLAYER_PICKED': {
          const player = event.payload as PlayerWithBidResponse;
          setLivePlayer(player);
          setLiveBidHistory([{ team: "Base Price", amount: player.basePrice, time: new Date(event.timestamp).toLocaleTimeString() }]);
          setBiddingTeamId(null);
          startBidTimer();
          toast.info(`🏏 ${player.playerName} is up for auction!`);
          break;
        }
        case 'PLAYER_SOLD': {
          const sold = event.payload;
          toast.success(`🎉 ${sold.playerName} SOLD to ${sold.teamName} for ₹${sold.soldPrice?.toLocaleString('en-IN')}!`);
          setTeams(prev => prev.map(t =>
            t.id === sold.teamId
              ? { ...t, spent: t.spent + sold.soldPrice, remainingBudget: t.budget - (t.spent + sold.soldPrice), players: [...(t.players || []), { name: sold.playerName, soldPrice: sold.soldPrice, category: '' }] }
              : t
          ));
          stopBidTimer();
          auctionService.getAuctionStats(selectedConfigId).then(s => setAuctionStats(s)).catch(() => {});
          break;
        }
        case 'PLAYER_PASSED': {
          toast.info(`${event.payload.playerName} passed`);
          stopBidTimer();
          auctionService.getAuctionStats(selectedConfigId).then(s => setAuctionStats(s)).catch(() => {});
          break;
        }
        case 'STATUS_CHANGED': {
          const { newStatus } = event.payload;
          setAuctionStatus(newStatus);
          if (newStatus === 'COMPLETED') { stopBidTimer(); toast.success('🏆 Auction completed!'); }
          break;
        }
      }
    });

    const unsubConnect = stompClient.onConnect(() => setWsConnected(true));
    const unsubDisconnect = stompClient.onDisconnect(() => setWsConnected(false));
    setWsConnected(stompClient.connected);

    return () => { unsub(); unsubConnect(); unsubDisconnect(); };
  }, [selectedConfigId, auctionStatus]);

  // ─── Bid Timer ─────────────────────────────────────────────────────────
  const startBidTimer = useCallback(() => {
    if (!bidTimerSeconds || bidTimerSeconds <= 0) return;
    stopBidTimer();
    setBidTimeLeft(bidTimerSeconds);
    bidTimerRef.current = setInterval(() => {
      setBidTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (bidTimerRef.current) clearInterval(bidTimerRef.current);
          bidTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [bidTimerSeconds]);

  const resetBidTimer = useCallback(() => {
    startBidTimer();
  }, [startBidTimer]);

  const stopBidTimer = useCallback(() => {
    if (bidTimerRef.current) { clearInterval(bidTimerRef.current); bidTimerRef.current = null; }
    setBidTimeLeft(null);
  }, []);

  useEffect(() => { return () => stopBidTimer(); }, [stopBidTimer]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const nav = (tab: string) => setActiveTab(tab);
  const configId = selectedConfigId ?? 0;


  const toggleCat = (cat: string) => {
    if (categories.includes(cat)) setCategories(categories.filter(c => c !== cat));
    else setCategories([...categories, cat]);
  };

  const handleSaveConfig = async () => {
    const payload = {
      sportId: selectedEventId ? (communityEvents.find(e => e.id === selectedEventId)?.sport?.id ?? 1) : 1,
      eventId: selectedEventId || undefined,
      seasonName,
      auctionFormat,
      totalTeams: totalTeamsConfig,
      totalPlayers: totalPlayersConfig,
      budgetPerTeam: budgetPerTeamConfig,
      basePrice,
      bidIncrementDefault,
      bidIncrementThreshold,
      bidIncrementAbove,
      bidTimerSeconds,
      rtmEnabled: true,
      unsoldRule,
      categories,
      committeeMembers: committee.map(c => c.name),
    };

    try {
      if (selectedConfigId) {
        await auctionService.updateConfig(selectedConfigId, payload);
      } else {
        const created = await auctionService.createConfig(payload);
        setSelectedConfigId(created.id);
      }

      // Save committee to sports event table
      if (selectedEventId) {
        await sportsService.updateCommittee(selectedEventId, committee.map(c => Number(c.id)));
      }

      toast.success('Auction configuration saved!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save config');
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedConfigId) {
      toast.error("Please select an auction configuration first.");
      return;
    }
    if (!newTeamName.trim() || !selectedOwnerId) {
      toast.error("Please provide team name and select a captain.");
      return;
    }

    const owner = communityUsers.find(u => u.id === selectedOwnerId);
    
    setIsCreatingTeam(true);
    try {
      await auctionService.createTeam({
        configId: selectedConfigId,
        teamName: newTeamName,
        ownerName: owner?.name || "Unknown",
        ownerUserId: selectedOwnerId,
        totalBudget: newTeamBudget,
        colorHex: '#D4A017' // Default gold
      });
      toast.success("Team created successfully!");
      setShowAddTeam(false);
      setNewTeamName("");
      setSelectedOwnerId(null);
      // Refresh teams list
      const updatedTeams = await auctionService.getTeamsSummary(selectedConfigId);
      setTeams(updatedTeams.map((summary, idx) => mapTeamData(summary, idx)));
    } catch (err: any) {
      toast.error(err?.message || "Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConfigId) return;

    if (newStatus === 'LIVE' || newStatus === 'ACTIVE') {
      if (teams.length < 2) {
        toast.error("Cannot start auction: At least 2 teams must be configured.");
        return;
      }
      if (players.length === 0) {
        toast.error("Cannot start auction: Player pool is empty.");
        return;
      }
    }

    try {
      await auctionService.updateStatus(selectedConfigId, newStatus);
      setAuctionStatus(newStatus);
      if (newStatus === 'LIVE') {
        fetchNextPlayer();
      }
      toast.success(`Auction is now ${newStatus}`);
    } catch (err: any) {
      let msg = err?.message || `Failed to change status to ${newStatus}`;
      if (msg.startsWith("{")) {
        try { msg = JSON.parse(msg).message || msg; } catch { }
      }
      toast.error(msg);
    }
  };

  // ── Live Auction Handlers ──────────────────────────────────────────
  const fetchNextPlayer = useCallback(async () => {
    try {
      const player = await auctionService.getRandomPlayer(configId);
      setLivePlayer(player);
      setLiveBidHistory([
        { team: "Base Price", amount: player.basePrice, time: new Date().toLocaleTimeString() }
      ]);
      setBiddingTeamId(null);
      startBidTimer();
      toast.success(`🏏 ${player.playerName} is up for auction!`);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("No more players") || msg.includes("empty")) {
        toast.info("🏁 All players have been auctioned!");
        setLivePlayer(null);
      } else {
        toast.error("Failed to pick next player");
      }
    }
  }, [configId]);

  const handleTeamBid = async (team: AuctionTeam) => {
    if (!livePlayer) return;
    const bidAmount = livePlayer.nextBid;
    const remaining = team.budget - team.spent;
    if (remaining < bidAmount) {
      toast.error(`${team.name} doesn't have enough budget (₹${remaining.toLocaleString('en-IN')} < ₹${bidAmount.toLocaleString('en-IN')})`);
      return;
    }
    try {
      await auctionService.placeBid({
        configId,
        playerId: livePlayer.playerId,
        teamId: team.id,
        bidAmount
      });
      setBiddingTeamId(team.id);
      setLiveBidHistory(prev => [
        { team: team.teamName, amount: bidAmount, time: new Date().toLocaleTimeString() },
        ...prev
      ]);
      // Refresh live player data from backend to get the updated nextBid
      const updated = await auctionService.getCurrentPlayer(configId);
      setLivePlayer(updated);
      resetBidTimer();
      toast.success(`${team.name} bids ₹${bidAmount.toLocaleString('en-IN')}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Bid failed');
    }
  };

  const handleExportTeams = () => {
    if (teams.length === 0) { toast.error('No teams to export'); return; }
    const headers = ['#', 'Team Name', 'Owner', 'Budget', 'Spent', 'Remaining', 'Players'];
    const rows = teams.map((t, i) => [
      i + 1, t.teamName || t.name || '', t.ownerName || t.ownerUser?.name || '',
      t.totalBudget ?? t.budget ?? 0, t.spent ?? 0, t.remainingBudget ?? (t.budget - t.spent) ?? 0,
      t.playerCount ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `teams-${seasonName.replace(/\s+/g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Teams CSV downloaded');
  };

  const handleExportResults = () => {
    if (teams.length === 0) { toast.error('No results to export'); return; }
    const headers = ['Team', 'Player', 'Role', 'Sold Price', 'Category'];
    const rows: string[][] = [];
    teams.forEach(team => {
      const teamPlayers = players.filter(p => p.status === 'SOLD' && (p.assignedTeam?.id === team.id || (p as any).assignedTeamId === team.id));
      if (teamPlayers.length === 0) {
        rows.push([team.teamName || team.name || '', '(no players)', '', '', '']);
      } else {
        teamPlayers.forEach(p => {
          rows.push([
            team.teamName || team.name || '',
            (p as any).playerName || p.name || '',
            (p as any).playerRole || p.role || '',
            String(p.soldPrice || 0),
            p.category || ''
          ]);
        });
      }
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `auction-results-${seasonName.replace(/\s+/g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Auction results CSV downloaded');
  };

  const handleSoldPlayer = async () => {
    if (!livePlayer || !biddingTeamId) {
      toast.error("No bid has been placed yet!");
      return;
    }
    const soldTeam = teams.find(t => t.id === biddingTeamId);
    try {
      await auctionService.soldPlayer(livePlayer.playerId, biddingTeamId);
      toast.success(`🎉 ${livePlayer.playerName} SOLD to ${soldTeam?.name} for ₹${livePlayer.currentBid.toLocaleString('en-IN')}!`);
      // Update team budget and squad locally
      setTeams(prev => prev.map(t =>
        t.id === biddingTeamId
          ? {
              ...t,
              spent: t.spent + livePlayer.currentBid,
              remainingBudget: t.budget - (t.spent + livePlayer.currentBid),
              players: [...(t.players || []), { name: livePlayer.playerName, soldPrice: livePlayer.currentBid, category: livePlayer.category || livePlayer.playerRole || 'Player' }]
            }
          : t
      ));
      // Refresh players list and live stats
      auctionService.getPlayers(configId).then(p => { if (p.length) setPlayers(p); }).catch(() => { });
      auctionService.getAuctionStats(configId).then(stats => setAuctionStats(stats)).catch(() => { });
      // Load next player
      await fetchNextPlayer();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark player as sold');
    }
  };

  const handlePassPlayer = async () => {
    if (!livePlayer) return;
    try {
      await auctionService.passPlayer(livePlayer.playerId);
      setBiddingTeamId(null);
      toast.info(`${livePlayer.playerName} passed — back to queue`);
      // Refresh live stats
      auctionService.getAuctionStats(configId).then(stats => setAuctionStats(stats)).catch(() => { });
      await fetchNextPlayer();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to pass player');
    }
  };

  // Creation States
  const [newPlayer, setNewPlayer] = useState({
    name: "", category: "BATSMEN", role: "Right-Hand Bat", age: 25,
    basePrice: 1000, matches: 0, runs: 0, wickets: 0, strikeRate: 0, economy: 0
  });

  const handleCreatePlayer = async () => {
    if (!newPlayer.name) { toast.error("Player name is required"); return; }
    if (!selectedConfigId) { toast.error("Please select an auction configuration first."); return; }
    try {
      const created = await auctionService.createPlayer(selectedConfigId, {
        playerName: newPlayer.name, category: newPlayer.category, playerRole: newPlayer.role,
        age: newPlayer.age, basePrice: newPlayer.basePrice, matches: newPlayer.matches,
        runs: newPlayer.runs, wickets: newPlayer.wickets, strikeRate: newPlayer.strikeRate, economy: newPlayer.economy
      });
      toast.success('Player added to pool!');
      const newPObj: AuctionPlayer = {
        id: created.id, name: created.name || newPlayer.name,
        initials: (newPlayer.name.match(/\b\w/g) || []).join('').substring(0, 2).toUpperCase(),
        role: newPlayer.role, age: newPlayer.age, basePrice: newPlayer.basePrice, status: "QUEUED"
      };
      setPlayers([...players, newPObj]);
      setNewPlayer({ ...newPlayer, name: "", matches: 0, runs: 0, wickets: 0 });
    } catch (err) {
      toast.error('Failed to create player');
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────
  const NavItem = ({ id, label, icon: Icon, isLive }: { id: string, label: string, icon: any, isLive?: boolean }) => (
    <button
      className={`nav-item ${activeTab === id ? 'active' : ''} ${isLive ? 'live-dot' : ''}`}
      onClick={() => nav(id)}
    >
      {Icon && <Icon className="nav-icon" size={16} />}
      <span className="nav-text">{label}</span>
      <div className="active-indicator" />
    </button>
  );
  const queuedPlayersList = players.filter(p => p.status === 'QUEUED' || p.status === 'queue');
  const frontendQueuedCount = queuedPlayersList.filter(p => p.role?.toLowerCase() !== 'captain' && p.category?.toLowerCase() !== 'captain').length;
  const queuedCount = auctionStats?.queuedPlayers ?? frontendQueuedCount;

  // Filter sports events to only include those configured or flagged for auction
  const auctionEvents = communityEvents.filter(ev =>
    Boolean(ev.auctionEnabled) ||
    availableConfigs.some(c => c.eventId === ev.id) ||
    Boolean(ev.auctionStatus)
  );
  const auctionEventMap = auctionEvents.length > 0
    ? auctionEvents.map(ev => ({ id: ev.id, name: ev.name }))
    : eventMap.filter(em => availableConfigs.some(c => c.eventId === em.id));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center', color: '#6b7094' }}>
          <div className="spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading Auction Hub...
        </div>
      </div>
    );
  }

  return (
    <div className="auction-hub-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <Gavel className="brand-icon" />
          </div>
          <div className="brand-title">Auction Hub</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <NavItem id="overview" label="Overview" icon={LayoutDashboard} />
        </div>
        {canViewSportsMenu && (
          <div className="nav-section">
            <div className="nav-label">Sports Menu</div>
            <NavItem id="cricket" label="Cricket" icon={Activity} />
            <NavItem id="badminton" label="Badminton" icon={Activity} />
            <NavItem id="football" label="Football" icon={Activity} />
            <NavItem id="volleyball" label="Volleyball" icon={Activity} />
          </div>
        )}
        <div className="nav-section">
          <div className="nav-label">Auction</div>
          {canViewAuctionConfig   && <NavItem id="config"        label="Auction Config" icon={Settings} />}
          {canViewLiveAuction     && <NavItem id="live"          label="Live Auction" isLive icon={Gavel} />}
          {canViewTeams           && <NavItem id="teams"         label="Teams" icon={Users} />}
          {canViewPlayerPool      && <NavItem id="players"       label="Player Pool" icon={Search} />}
          {canViewRegistrations   && <NavItem id="registrations" label="Registrations" icon={FileText} />}
          {canViewResults         && <NavItem id="results"       label="Auction Results" icon={Trophy} />}
        </div>
        <div className="nav-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 }}>
          <div className="nav-label">Quick Links</div>
          <button className="nav-item" onClick={() => routerNavigate('/sports/schedule')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
            <CalendarDays size={16} /> Schedule <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Auction Hub</div><div className="page-sub">Select a sport to configure its auction rules</div></div>
            </div>

            {/* Quick stats grid */}
            {(() => {
              const activeAuctionsCount = availableConfigs.filter(c => c.status === 'LIVE' || c.status === 'ACTIVE').length;
              
              // Find if user is captain/owner of any team
              const myTeam = teams.find(t => t.ownerUser?.id === Number(user?.userId));
              // Count user's active bids
              const myActiveBidsCount = (livePlayer && biddingTeamId && myTeam && biddingTeamId === myTeam.id) ? 1 : 0;
              
              const soldPlayersCount = auctionStats?.soldPlayers ?? players.filter(p => p.status === 'SOLD').length;
              const totalPoolValue = "₹" + (auctionStats?.totalBudget ?? teams.reduce((acc, t) => acc + t.budget, 0)).toLocaleString('en-IN');

              return (
                <div className="grid4 mb-4 sm:mb-[18px]">
                  {[
                    { label: "Active Auctions", value: activeAuctionsCount.toString(), icon: Gavel, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
                    { label: "My Active Bids", value: myActiveBidsCount.toString(), icon: TrendingUp, color: "#4f46e5", bg: "rgba(99,102,241,0.12)" },
                    { label: "Players Sold", value: soldPlayersCount.toString(), icon: CheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
                    { label: "Total Pool", value: totalPoolValue, icon: Trophy, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
                  ].map((s) => (
                    <div key={s.label} className="stat-card flex items-center gap-2.5 p-2.5 sm:p-[12px_14px] rounded-xl bg-white border border-indigo-500/[0.12] shadow-[0_2px_8px_rgba(99,102,241,0.03)]">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                        <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: s.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[16px] sm:text-lg font-extrabold text-slate-900 leading-tight m-0">{s.value}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-[var(--muted)] mt-0.5 sm:mt-[3px] mb-0 uppercase tracking-wide">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="grid3 mb-3 sm:mb-4">
              {auctionEvents.length > 0 ? auctionEvents.map(ev => {
                // Find if an auction config exists for this event
                const auctionConfig = availableConfigs.find(c => c.eventId === ev.id);
                const isLive = auctionConfig?.status === 'LIVE';
                const emoji = ev.sport?.name.toLowerCase().includes('cricket') ? '🏏' :
                  ev.sport?.name.toLowerCase().includes('badminton') ? '🏸' :
                    ev.sport?.name.toLowerCase().includes('football') ? '⚽' : '🏆';

                return (
                  <div
                    key={ev.id}
                    className={`card ${auctionConfig ? 'card-gold' : ''} relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px] p-3.5 sm:p-[18px_20px] ${(auctionConfig || canEditAuctionConfig) ? 'cursor-pointer' : 'cursor-default'} ${auctionConfig ? '' : 'opacity-[0.88]'}`}
                    onClick={() => {
                      if (auctionConfig) {
                        setSelectedConfigId(auctionConfig.id);
                        nav('live');
                      } else if (canEditAuctionConfig) {
                        setSport(ev.sport?.name.toLowerCase() || 'cricket');
                        setSelectedEventId(ev.id);
                        nav('config');
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/[0.08] flex items-center justify-center text-xl sm:text-[22px]">
                          {emoji}
                        </div>
                        <div>
                          {auctionConfig ? (
                            <span className={`tag ${isLive ? 'tag-live' : 'tag-green'}`}>
                              {isLive ? '● Live Now' : 'Auction Active'}
                            </span>
                          ) : (
                            <span className="tag tag-blue">Setup Pending</span>
                          )}
                        </div>
                      </div>

                      <div className="text-[15px] sm:text-base font-extrabold text-slate-900">{ev.name}</div>
                      <div className="text-[11px] sm:text-xs text-[var(--muted)] mt-1 font-medium">
                        {ev.sport?.name} · {ev.status}
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-3.5 pt-2.5 border-t border-indigo-500/[0.08] flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-500">
                        {auctionConfig ? 'Enter Auction Room' : 'Configure Rules'}
                      </span>
                      <span className="text-[13px] text-indigo-500">→</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full text-center p-8 sm:p-10 text-[var(--muted)] bg-white rounded-2xl border border-dashed border-slate-300">
                  <div className="text-3xl sm:text-[32px] mb-2">🏆</div>
                  <div className="font-bold text-slate-900 text-sm sm:text-[15px]">No Auction Events Found</div>
                  <div className="text-[11px] sm:text-xs mt-1">No auction sports events configured for your community yet.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONFIG */}
        {activeTab === 'config' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Auction Configuration</div><div className="page-sub">{sport.charAt(0).toUpperCase() + sport.slice(1)} · {seasonName} · Dynamically configurable rules</div></div>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center sm:mr-3">
                  <span className="text-xs sm:text-[13px] text-[var(--muted)]">Select Event:</span>
                  <select
                    className="fselect w-full sm:w-auto sm:min-w-[200px] py-1.5 px-3"
                    value={selectedEventId || ''}
                    onChange={e => {
                      const eid = e.target.value ? Number(e.target.value) : null;
                      setSelectedEventId(eid);
                      if (eid) {
                        const firstConfig = availableConfigs.find(c => c.eventId === eid);
                        if (firstConfig) setSelectedConfigId(firstConfig.id);
                        else setSelectedConfigId(null);
                      }
                    }}
                  >
                    <option value="">Select Sports Event...</option>
                    {auctionEventMap.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
                {canEditAuctionConfig && <button className="btn btn-gold w-full sm:w-auto min-h-[44px] sm:min-h-0" onClick={handleSaveConfig}>Save & Apply ↗</button>}
              </div>
            </div>

            <div className="grid2">
              <div>
                <div className="card card-gold mb-3 sm:mb-4">
                  <div className="sec-title">Sport Selection</div>
                  <div className="form-row">
                    <div className="fgrp">
                      <div className="flabel">Sport</div>
                      <select className="fselect" value={sport} onChange={e => setSport(e.target.value)}>
                        <option value="cricket">Cricket</option>
                        <option value="badminton">Badminton</option>
                        <option value="football">Football</option>
                      </select>
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Mapped Event</div>
                      <select
                        className="fselect"
                        value={selectedEventId || ""}
                        onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select Event...</option>
                        {auctionEventMap.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Auction Format</div>
                      <select className="fselect" value={auctionFormat} onChange={e => setAuctionFormat(e.target.value)}>
                        <option value="OPEN_AUCTION">Open Auction</option>
                        <option value="SILENT_AUCTION">Silent Auction</option>
                        <option value="DRAFT_FORMAT">Draft Format</option>
                      </select>
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Season Name</div>
                      <input className="finput" type="text" value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="e.g. Season 2026" />
                    </div>
                    <div className="fgrp">
                      <div className="flabel">Bid Timer (seconds)</div>
                      <input className="finput" type="number" min={10} max={120} value={bidTimerSeconds} onChange={e => setBidTimerSeconds(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="card card-gold mb-3 sm:mb-4">
                  <div className="sec-title">Auction Rules</div>
                  <div className="rule-box">
                    <div className="rule-title">Teams & Players</div>
                    <div className="form-row">
                      <div className="fgrp"><div className="flabel">Participating Teams</div><input className="finput" type="number" value={totalTeamsConfig} onChange={e => setTotalTeamsConfig(Number(e.target.value))} /></div>
                      <div className="fgrp"><div className="flabel">Players in Pool</div><input className="finput" type="number" value={totalPlayersConfig} onChange={e => setTotalPlayersConfig(Number(e.target.value))} /></div>
                    </div>
                    <div className="fgrp"><div className="flabel">Team Budget (₹)</div><input className="finput" type="number" value={budgetPerTeamConfig} onChange={e => setBudgetPerTeamConfig(Number(e.target.value))} /></div>
                  </div>
                  <div className="rule-box">
                    <div className="rule-title">Bidding Rules</div>
                    <div className="form-row">
                      <div className="fgrp"><div className="flabel">Base Price (₹)</div><input className="finput" type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} /></div>
                      <div className="fgrp"><div className="flabel">Default Increment (₹)</div><input className="finput" type="number" value={bidIncrementDefault} onChange={e => setBidIncrementDefault(Number(e.target.value))} /></div>
                    </div>
                    <div className="form-row">
                      <div className="fgrp">
                        <div className="flabel">Threshold Amount (₹)</div>
                        <input className="finput" type="number" value={bidIncrementThreshold} onChange={e => setBidIncrementThreshold(Number(e.target.value))} title="Bid amount at which the increment changes" />
                      </div>
                      <div className="fgrp">
                        <div className="flabel">Increment Above Threshold (₹)</div>
                        <input className="finput" type="number" value={bidIncrementAbove} onChange={e => setBidIncrementAbove(Number(e.target.value))} title="The new increment amount once the threshold is reached" />
                      </div>
                    </div>
                  </div>
                  <div className="rule-box">
                    <div className="rule-title">Player Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {['Batsmen', 'Bowlers', 'All-rounders', 'Wicket-Keepers'].map(cat => (
                        <button
                          key={cat}
                          className={`btn btn-outline btn-sm min-h-[36px] sm:min-h-0 ${categories.includes(cat) ? 'active-chip text-[var(--gold)] border-[rgba(212,160,23,0.5)] bg-[rgba(212,160,23,0.08)]' : ''}`}
                          onClick={canEditAuctionConfig ? () => toggleCat(cat) : undefined}
                          disabled={!canEditAuctionConfig}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="card card-gold mb-3 sm:mb-4">
                  <div className="sec-title">Dispute Committee</div>

                  <div className="relative">
                    <div className="fselect-multi flex flex-wrap gap-1.5 py-2 px-3 bg-[#1a1d21] border border-[#333] rounded-lg min-h-[44px] items-center cursor-text" onClick={() => document.getElementById('committee-search')?.focus()}>

                      {committee.map((c, i) => (
                        <div key={i} className="committee-chip flex items-center gap-1.5 bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.3)] py-1 px-2.5 rounded-md text-xs text-[var(--gold)]">
                          <span className="committee-avatar w-[18px] h-[18px] text-[10px]">{(c.name?.[0] || '?').toUpperCase()}</span>
                          {c.name || 'Unknown'}
                          <span className="cursor-pointer text-base leading-none ml-1" onClick={(e) => { e.stopPropagation(); setCommittee(committee.filter(item => item.id !== c.id)); }}>×</span>
                        </div>
                      ))}

                      <input
                        id="committee-search"
                        className="flex-1 border-none bg-transparent outline-none text-white text-[13px] min-w-[120px] py-1 px-0"
                        placeholder={committee.length === 0 ? "Search & select confirmed players..." : ""}
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        disabled={!selectedEventId}
                      />
                    </div>

                    {userSearchQuery.length >= 2 && document.activeElement === document.getElementById('committee-search') && (
                      <div className="search-results-dropdown absolute top-full left-0 right-0 bg-[#1a1d21] border border-[#444] rounded-lg z-[100] max-h-[250px] overflow-y-auto mt-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                        {communityUsers
                          .filter(u =>
                            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) &&
                            !committee.find(c => c.id === u.id)
                          )
                          .map(u => (
                            <div
                              key={u.id}
                              className="search-item p-3 sm:p-[12px_16px] cursor-pointer text-[13px] border-b border-[#2a2d32] transition-colors min-h-[44px] sm:min-h-0 flex flex-col justify-center"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCommittee([...committee, { id: u.id, name: u.name }]);
                                toast.success(`${u.name} added`);
                                setUserSearchQuery("");
                              }}
                            >
                              <div className="font-semibold text-[var(--text)]">{u.name}</div>
                              <div className="text-[11px] text-[var(--muted)] mt-0.5">Community Member</div>
                            </div>
                          ))}
                        {communityUsers.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) && !committee.find(c => c.id === u.id)).length === 0 && (
                          <div className="p-5 text-center text-xs text-[var(--muted)]">
                            {selectedEventId ? "No matching community users found" : "Please select an event above to see players"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card card-gold">
                  <div className="sec-title">Unsold Player Rule</div>
                  <select className="fselect w-full mb-2.5" value={unsoldRule} onChange={e => setUnsoldRule(e.target.value)}>
                    <option value="ROTATION_AUCTION">All players will be sold — rotation auction</option>
                    <option value="RESERVE_POOL">Unsold players enter reserve pool</option>
                  </select>
                  <div className="text-[11px] text-[var(--muted)] leading-relaxed p-2 bg-[rgba(212,160,23,0.05)] rounded-md border border-[rgba(212,160,23,0.15)]">
                    Current Rule: Teams must wait for their turn in the auction rotation. All players will be sold out.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE AUCTION */}
        {activeTab === 'live' && (
          <div className="page active">
            <div className="page-hdr">
              <div>
                <div className="page-title">Live Auction</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center">
                  <span className="text-[11px] sm:text-xs text-[var(--muted)]">Select Event:</span>
                  <select className="fselect w-full sm:w-auto sm:min-w-[150px] py-1 px-2 text-xs" value={selectedEventId || ''} onChange={e => { const eid = e.target.value ? Number(e.target.value) : null; setSelectedEventId(eid); if (eid) { const firstConfig = availableConfigs.find(c => c.eventId === eid); if (firstConfig) setSelectedConfigId(firstConfig.id); else setSelectedConfigId(null); } }}>
                    <option value="">All Events</option>
                    {auctionEventMap.map(ev => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center sm:ml-2">
                  <span className="text-[11px] sm:text-xs text-[var(--muted)]">Auction:</span>
                  <select className="fselect w-full sm:w-auto sm:min-w-[150px] py-1 px-2 text-xs sm:mr-2" value={selectedConfigId || ''} onChange={e => setSelectedConfigId(Number(e.target.value))}>
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).map(c => (<option key={c.id} value={c.id}>{c.seasonName} ({c.status})</option>))}
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).length === 0 && (<option value="">No Auction Found</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {auctionStatus === 'LIVE' && <span className="tag tag-live">● Auction Live</span>}
                {(auctionStatus === 'LIVE' || auctionStatus === 'ACTIVE') && (
                  <span className={`tag ${wsConnected ? 'tag-green' : 'tag-amber'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                    {wsConnected ? '⚡ Real-time' : '📡 Polling'}
                  </span>
                )}
                {(auctionStatus === 'PAUSED' || auctionStatus === 'ACTIVE') && <span className="tag tag-blue">⏸ Paused</span>}
                {auctionStatus === 'COMPLETED' && <span className="tag tag-green">🏆 Completed</span>}
                {canEditLiveAuction && auctionStatus !== 'LIVE' && auctionStatus !== 'COMPLETED' && (<button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('LIVE')}>▶ Start</button>)}
                {canEditLiveAuction && auctionStatus === 'LIVE' && (<button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('ACTIVE')}>⏸ Pause</button>)}
                {canEditLiveAuction && (auctionStatus === 'LIVE' || auctionStatus === 'ACTIVE') && (<button className="btn btn-outline btn-sm text-[var(--red)] border-[var(--red)] min-h-[36px] sm:min-h-0" onClick={() => { if (window.confirm("Are you sure you want to stop the auction? This cannot be undone.")) { handleStatusChange('COMPLETED'); } }}>⏹ Stop</button>)}
                {canEditAuctionConfig && (<button className="btn btn-outline btn-sm" onClick={() => nav('config')}>Edit Rules</button>)}
              </div>
            </div>

            {/* Stats Row */}
            {(() => {
              const totalPlayers = registrationCount || auctionStats?.totalPlayers || players.length;
              const soldCount = auctionStats?.soldPlayers ?? players.filter(p => p.status === 'SOLD').length;
              const totalSpent = auctionStats?.totalSpent ?? teams.reduce((s, t) => s + t.spent, 0);
              const totalTeams = auctionStats?.totalTeams ?? teams.length;
              const totalBudget = auctionStats?.totalBudget ?? teams.reduce((s, t) => s + t.budget, 0);
              return (
                <div className="stat-grid">
                  <div className="stat-card"><div className="stat-val">{totalPlayers}</div><div className="stat-label">Confirmed Players</div><div className="stat-sub"><span className="text-[var(--green)]">{soldCount} sold</span></div></div>
                  <div className="stat-card"><div className="stat-val text-[var(--green)]">{soldCount}</div><div className="stat-label">Players Sold</div><div className="stat-sub"><span className="text-[var(--muted)]">₹{totalSpent.toLocaleString('en-IN')} spent</span></div></div>
                  <div className="stat-card"><div className="stat-val text-[var(--amber)]">{totalTeams}</div><div className="stat-label">Teams</div><div className="stat-sub"><span className="text-[var(--muted)]">₹{totalBudget.toLocaleString('en-IN')} budget</span></div></div>
                  {queuedCount > 0 && (
                    <div className="stat-card"><div className="stat-val text-[var(--blue)]">{queuedCount}</div><div className="stat-label">In Queue</div><div className="stat-sub"><span className="text-[var(--gold)]">Waiting</span></div></div>
                  )}
                </div>
              );
            })()}

            {/* Main Content */}
            {(!selectedConfigId || configExistsForCommunity === false) ? (
              <div className="auction-stage text-center py-10 sm:py-[60px] px-4 sm:px-6">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⚙️</div>
                <div className="player-name-big mb-2">No Auction Configured</div>
                <div className="text-[12px] sm:text-[13px] text-[var(--muted)] max-w-[440px] mx-auto mb-5 sm:mb-6 leading-relaxed">No auction configuration has been created for your community's open registration events yet. Create one to define teams, player pools, and bidding rules.</div>
                {canEditAuctionConfig && (<button className="btn btn-gold py-3 sm:py-3.5 px-8 sm:px-10 text-sm sm:text-base min-h-[48px] sm:min-h-0" onClick={() => nav('config')}>⚙️ Create Auction Config</button>)}
              </div>
            ) : (auctionStatus === 'DRAFT' || auctionStatus === 'ACTIVE') && !livePlayer ? (
              <div className="auction-stage text-center py-10 sm:py-[60px] px-4 sm:px-6">
                {(() => {
                  const hasTeams = teams.length >= 2;
                  const playerCount = registrationCount || eventRegistrations.length || players.length;
                  const hasPlayers = playerCount > 0;
                  const isReady = hasTeams && hasPlayers;
                  return isReady ? (
                    <>
                      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🏏</div>
                      <div className="player-name-big mb-2">Ready to Start?</div>
                      <div className="text-[12px] sm:text-[13px] text-[var(--muted)] max-w-[400px] mx-auto mb-5 sm:mb-6">{canEditLiveAuction ? "Everything looks good! Click below to begin the auction. Teams can bid by clicking their card." : "The auction has not started yet. Please wait for an administrator to begin."}</div>
                      {canEditLiveAuction ? (<button className="btn btn-gold py-3 sm:py-3.5 px-8 sm:px-10 text-sm sm:text-base min-h-[48px] sm:min-h-0" onClick={() => handleStatusChange('LIVE')}>🚀 Start Auction</button>) : (<div className="tag tag-gold py-2 px-4">Waiting for Admin</div>)}
                    </>
                  ) : (
                    <>
                      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⚙️</div>
                      <div className="player-name-big mb-2">Setup Incomplete</div>
                      <div className="text-[12px] sm:text-[13px] text-[var(--muted)] max-w-[420px] mx-auto mb-3 sm:mb-4">Complete the following before starting the auction:</div>
                      <div className="inline-flex flex-col gap-2.5 text-left mb-5 sm:mb-6">
                        <div className="flex items-center gap-2 text-[13px]"><span className={`text-base ${hasTeams ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{hasTeams ? '✅' : '❌'}</span><span className={hasTeams ? 'text-[var(--green)]' : 'text-slate-100'}>Teams — {teams.length} configured {!hasTeams && '(minimum 2 required)'}</span></div>
                        <div className="flex items-center gap-2 text-[13px]"><span className={`text-base ${hasPlayers ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{hasPlayers ? '✅' : '❌'}</span><span className={hasPlayers ? 'text-[var(--green)]' : 'text-slate-100'}>Player Pool — {playerCount} players {!hasPlayers && '(at least 1 required)'}</span></div>
                      </div>
                      {(canEditAuctionConfig || canEditTeams || canEditPlayerPool) && (
                        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
                          {canEditAuctionConfig && (<button className="btn btn-gold py-3 sm:py-3.5 px-6 sm:px-8 text-sm sm:text-[15px] min-h-[48px] sm:min-h-0" onClick={() => nav('config')}>⚙️ Configure Auction</button>)}
                          {canEditTeams && !hasTeams && (<button className="btn btn-outline py-3 sm:py-3.5 px-6 sm:px-8 text-sm sm:text-[15px] min-h-[48px] sm:min-h-0" onClick={() => nav('teams')}>+ Add Teams</button>)}
                          {canEditPlayerPool && hasTeams && !hasPlayers && (<button className="btn btn-outline py-3 sm:py-3.5 px-6 sm:px-8 text-sm sm:text-[15px] min-h-[48px] sm:min-h-0" onClick={() => nav('players')}>+ Add Players</button>)}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : auctionStatus === 'COMPLETED' ? (
              <div className="auction-stage text-center py-10 sm:py-[60px] px-4 sm:px-6">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🏆</div>
                <div className="player-name-big mb-2">Auction Complete!</div>
                <div className="text-[12px] sm:text-[13px] text-[var(--muted)] mb-5 sm:mb-6">The auction has been stopped or all players have been auctioned. Check the Results tab for final rosters.</div>
                <button className="btn btn-outline min-h-[44px] sm:min-h-0" onClick={() => nav('results')}>View Results ↗</button>
              </div>
            ) : auctionStatus === 'LIVE' && !livePlayer ? (
              <div className="auction-stage text-center py-10 sm:py-[60px] px-4 sm:px-6">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🏁</div>
                <div className="player-name-big mb-2">Auction Queue Empty</div>
                <div className="text-[12px] sm:text-[13px] text-[var(--muted)] mb-5 sm:mb-6">All players from the queue have been auctioned. Click below to close the auction.</div>
                {canEditLiveAuction && (<button className="btn btn-gold btn-green py-3 sm:py-3.5 px-8 sm:px-10 text-sm sm:text-base min-h-[48px] sm:min-h-0 !bg-[var(--green)] !border-[var(--green)] text-white" onClick={() => handleStatusChange('COMPLETED')}>Close Auction</button>)}
              </div>
            ) : livePlayer ? (
              <div className="grid2">
                <div>
                  <div className="auction-stage">
                    <div className="flex justify-between mb-3 sm:mb-4">
                      <span className="tag tag-gold">{livePlayer.category || 'Player'}</span>
                      <span className="text-[10px] sm:text-[11px] text-[var(--muted)]">Base ₹{livePlayer.basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="player-spotlight">
                      <div className="player-ring">{(livePlayer.playerName.match(/\b\w/g) || []).join('').substring(0, 2).toUpperCase()}</div>
                      <div className="player-name-big">{livePlayer.playerName}</div>
                      <div className="player-role">{livePlayer.playerRole || livePlayer.category}</div>
                      {(() => {
                        let stats: any = {};
                        try { stats = livePlayer.statsJson ? JSON.parse(livePlayer.statsJson) : {}; } catch { }
                        return (
                          <div className="stats-row">
                            <div className="pstat"><div className="pstat-val">{livePlayer.age || '-'}</div><div className="pstat-lbl">Age</div></div>
                            {Object.keys(stats).length > 0 ? (
                              Object.entries(stats).slice(0, 3).map(([key, val]) => (
                                <div className="pstat" key={key}><div className="pstat-val">{String(val) || '-'}</div><div className="pstat-lbl">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div></div>
                              ))
                            ) : (
                              <div className="pstat"><div className="pstat-val">{livePlayer.playerRole || '-'}</div><div className="pstat-lbl">Role</div></div>
                            )}
                          </div>
                        );
                      })()}
                      <div className="bid-box">
                        <div className="bid-lbl">Current Bid</div>
                        <div className="bid-amount">₹{livePlayer.currentBid.toLocaleString('en-IN')}</div>
                        <div className="bid-team">{livePlayer.currentBidTeamName || 'No bids yet — click a team to bid'}</div>
                      </div>
                      {bidTimeLeft !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '12px 0', padding: '8px 16px', borderRadius: 8, background: bidTimeLeft <= 5 ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)' }}>
                          <Timer size={16} style={{ color: bidTimeLeft <= 5 ? '#ef4444' : 'var(--gold)' }} />
                          <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: bidTimeLeft <= 5 ? '#ef4444' : bidTimeLeft <= 10 ? '#f59e0b' : 'var(--gold)' }}>
                            {bidTimeLeft}s
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>remaining</span>
                        </div>
                      )}
                      <div className="text-[10px] sm:text-[11px] text-[var(--muted)] mb-2.5">Next bid: ₹{livePlayer.nextBid.toLocaleString('en-IN')} (increment: ₹{livePlayer.nextIncrement.toLocaleString('en-IN')})</div>
                      {isAuctionAdmin ? (
                        <div className="bid-actions">
                          <button className="bid-sold" onClick={handleSoldPlayer} disabled={!biddingTeamId}>SOLD!</button>
                          <button className="bid-pass" onClick={handlePassPlayer}>PASS</button>
                          {queuedCount > 0 ? (
                            <button className="btn btn-outline btn-sm flex-[0.8] min-h-[44px] sm:min-h-0" onClick={fetchNextPlayer}>NEXT ↻</button>
                          ) : (
                            <button className="btn btn-gold btn-sm flex-[0.8] min-h-[44px] sm:min-h-0 !bg-[var(--green)] !border-[var(--green)] text-white" onClick={() => handleStatusChange('COMPLETED')}>Close Auction</button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-5"><span className="tag tag-blue py-2 px-5 tracking-wider">VIEW ONLY MODE</span></div>
                      )}
                    </div>
                  </div>
                  <div className="card mt-3 sm:mt-3.5">
                    <div className="sec-title">Bid History — {livePlayer.playerName}</div>
                    <div className="bid-history">
                      {liveBidHistory.map((b, i) => (
                        <div className="bid-entry" key={i}>
                          <span className="text-[var(--muted)]">{b.team} <span className="text-[10px]">{b.time}</span></span>
                          <span className={i === 0 ? 'text-[var(--gold)]' : 'text-[var(--text)]'}>₹{b.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-3"><div className="sec-title !m-0">🏆 Click a team to place their bid</div></div>
                  <div className="team-bid-grid grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {teams.map(team => {
                      const remaining = team.budget - team.spent;
                      const canBid = remaining >= livePlayer.nextBid;
                      const isBidding = team.id === biddingTeamId;
                      const pct = Math.round((remaining / team.budget) * 100) || 0;
                      return (
                        <div key={team.id} className={`team-bid-card ${isBidding ? 'highest' : ''} ${(!canBid || !isAuctionAdmin) ? 'disabled' : ''} ${(isAuctionAdmin && canBid) ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => isAuctionAdmin && canBid && handleTeamBid(team)}>
                          <div className="flex justify-between items-center mb-2">
                            <div className={`team-name ${isBidding ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>{team.emoji} {team.name}</div>
                            {isBidding && <span className="tag tag-green text-[8px]">Highest</span>}
                          </div>
                          <div className="team-budget text-[12px] sm:text-[13px] text-[var(--muted)] mt-1">
                            Remaining: <span className="text-[var(--text)] font-semibold">₹{remaining.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="prog-bar my-1.5"><div className="prog-fill" style={{ width: `${pct}%`, background: isBidding ? 'var(--green)' : team.color || 'var(--amber)' }}></div></div>
                          <div className="flex justify-between items-center mt-1.5">
                            <div className="team-players">Spent: ₹{team.spent.toLocaleString('en-IN')}</div>
                            {canBid ? (<span className="tag tag-gold text-[9px]">BID ₹{livePlayer.nextBid.toLocaleString('en-IN')}</span>) : (<span className="tag tag-red text-[9px]">No Budget</span>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Teams Dashboard</div><div className="page-sub">{teams.length} teams configured for current auction</div></div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                {canEditTeams && (
                  <button className="btn btn-gold min-h-[44px] sm:min-h-0" onClick={() => setShowAddTeam(!showAddTeam)}>
                    {showAddTeam ? '✕ Cancel' : '+ Create Team'}
                  </button>
                )}
                <button className="btn btn-outline min-h-[44px] sm:min-h-0" onClick={handleExportTeams}>Export CSV ↗</button>
              </div>
            </div>

            {showAddTeam && (
              <div className="card card-gold mb-4 sm:mb-6 p-4 sm:p-6">
                <div className="sec-title">Create New Team</div>
                <div className="create-team-grid grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-end">
                  <div className="fgrp">
                    <div className="flabel">Team Name</div>
                    <input className="finput" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Royal Challengers" />
                  </div>
                  <div className="fgrp">
                    <div className="flabel">Captain / Owner</div>
                    <select className="fselect" value={selectedOwnerId || ''} onChange={e => setSelectedOwnerId(Number(e.target.value))}>
                      <option value="">Select Captain...</option>
                      {communityUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fgrp">
                    <div className="flabel">Auction Budget (₹)</div>
                    <input className="finput" type="number" value={newTeamBudget} onChange={e => setNewTeamBudget(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-gold h-[42px] min-h-[44px] sm:min-h-[42px] w-full sm:w-auto" onClick={handleCreateTeam} disabled={isCreatingTeam}>
                    {isCreatingTeam ? 'Creating...' : 'Confirm Team'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid4 mb-4 sm:mb-5">
              <div className="stat-card"><div className="stat-val">{teams.length}</div><div className="stat-label">Total Teams</div></div>
              <div className="stat-card"><div className="stat-val text-[var(--gold)]">₹{(teams.reduce((acc, t) => acc + (t.budget || 0), 0) / 100000).toFixed(1)}L</div><div className="stat-label">Total Budget</div></div>
              <div className="stat-card"><div className="stat-val text-[var(--green)]">{teams.reduce((acc, t) => acc + (t.players?.length || 0), 0)}</div><div className="stat-label">Players Assigned</div></div>
              <div className="stat-card"><div className="stat-val text-[var(--amber)]">₹{(teams.reduce((acc, t) => acc + (t.spent || 0), 0) / 100000).toFixed(1)}L</div><div className="stat-label">Total Spent</div></div>
            </div>

            <div className="grid2">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {teams.length > 0 ? teams.map((team, idx) => {
                  const budget = team.budget || 0;
                  const spent = team.spent || 0;
                  const rem = budget - spent;
                  const pct = budget > 0 ? Math.round((rem / budget) * 100) : 0;
                  return (
                    <div key={team.id} className="card !mb-0 bg-white rounded-[14px]" style={{ borderLeft: `4px solid ${team.color || 'var(--gold)'}` }}>
                      <div className="flex justify-between mb-2.5 sm:mb-3">
                        <div>
                           <div className="font-extrabold text-[15px] sm:text-base text-slate-900">{team.name}</div>
                           <div className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5 font-medium">Captain: {team.ownerName || 'Not Assigned'}</div>
                        </div>
                        <div className="tag tag-gold h-fit">Team #{idx + 1}</div>
                      </div>
                      <div className="flex flex-wrap gap-3 sm:gap-5 mb-2.5">
                        <div><div className="font-extrabold text-base sm:text-lg text-slate-900">₹{(rem || 0).toLocaleString('en-IN')}</div><div className="text-[9px] text-[var(--muted)] uppercase font-bold">Remaining</div></div>
                        <div><div className="font-extrabold text-base sm:text-lg text-amber-600">₹{(spent || 0).toLocaleString('en-IN')}</div><div className="text-[9px] text-[var(--muted)] uppercase font-bold">Spent</div></div>
                        <div className="ml-auto text-right"><div className="font-extrabold text-base sm:text-lg text-emerald-600">{team.players?.length || 0}</div><div className="text-[9px] text-[var(--muted)] uppercase font-bold">Squad</div></div>
                      </div>
                      <div className="prog-bar mb-3"><div className="prog-fill" style={{ width: `${pct}%`, background: team.color || 'var(--gold)' }}></div></div>

                      {team.players && team.players.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-[var(--muted)] uppercase mb-2 tracking-wide">Purchased Squad ({team.players.length})</div>
                          <div className="flex flex-wrap gap-1.5">
                            {team.players.map((pl, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-1.5 bg-slate-50 py-1 px-2 rounded-lg border border-slate-200 text-xs">
                                <span className="text-slate-900 font-semibold">{pl.name}</span>
                                {pl.category && <span className="text-[10px] text-[var(--muted)] bg-slate-200 py-px px-1.5 rounded font-semibold">{pl.category}</span>}
                                <span className="text-emerald-600 font-bold text-[11px]">₹{(pl.soldPrice || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-[var(--muted)] italic text-center">
                          No players purchased yet
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 sm:py-[60px] px-5 text-[var(--muted)] bg-white/[0.02] rounded-xl border border-dashed border-[#333]">
                    <div className="text-4xl mb-3 sm:mb-4">🛡️</div>
                    <div className="text-base sm:text-lg font-medium text-[var(--text)]">No Teams Found</div>
                    <div className="text-[12px] sm:text-[13px] mt-2">Start by creating your first team for the auction.</div>
                  </div>
                )}
              </div>
              {/* Captain Nominations Panel */}
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="sec-title">👑 Captain Nominations</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                    Players can nominate themselves as team captains. Admins confirm nominations below.
                  </div>
                  {teams.filter(t => t.captainNomination && !t.captainConfirmation).length > 0 ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {teams.filter(t => t.captainNomination && !t.captainConfirmation).map(team => (
                        <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{team.captainUser?.name || team.ownerName || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Nominated for: {team.name}</div>
                          </div>
                          {canEditTeams && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-gold btn-sm" style={{ padding: '4px 12px', fontSize: 11 }} onClick={async () => {
                                try {
                                  await auctionService.confirmCaptainByTeamId(team.id, true);
                                  toast.success(`Captain confirmed for ${team.name}`);
                                  setTeams(prev => prev.map(t => t.id === team.id ? { ...t, captainConfirmation: true } : t));
                                } catch (err: any) { toast.error(err?.message || 'Failed to confirm'); }
                              }}>✓ Confirm</button>
                              <button className="btn btn-outline btn-sm" style={{ padding: '4px 12px', fontSize: 11, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={async () => {
                                try {
                                  await auctionService.confirmCaptainByTeamId(team.id, false);
                                  toast.info(`Captain nomination rejected for ${team.name}`);
                                  setTeams(prev => prev.map(t => t.id === team.id ? { ...t, captainNomination: false } : t));
                                } catch (err: any) { toast.error(err?.message || 'Failed to reject'); }
                              }}>✕ Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {teams.filter(t => t.captainConfirmation).length > 0 ? (
                        <>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                          All captain nominations have been confirmed.
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                          No pending captain nominations.
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirmed Captains */}
                {teams.filter(t => t.captainConfirmation).length > 0 && (
                  <div className="card">
                    <div className="sec-title" style={{ color: 'var(--green)' }}>✅ Confirmed Captains</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {teams.filter(t => t.captainConfirmation).map(team => (
                        <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.05)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.12)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: team.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {(team.captainUser?.name || team.ownerName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{team.captainUser?.name || team.ownerName}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Captain — {team.name}</div>
                          </div>
                          <span className="tag tag-green" style={{ fontSize: 9 }}>Confirmed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Player Pool</div><div className="page-sub">{eventRegistrations.length} Confirmed Participants from Registration</div></div>
              <div className="flex gap-3 items-center">
                 <span className="text-xs sm:text-[13px] text-[var(--muted)]">Pool for Event ID: {selectedEventId || 'None'}</span>
                 {canEditPlayerPool && selectedConfigId && (
                   <label className="btn btn-outline btn-sm cursor-pointer flex items-center gap-1.5">
                     <Download size={14} style={{ transform: 'rotate(180deg)' }} /> Upload CSV
                     <input type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file || !selectedConfigId) return;
                       try {
                         await auctionService.uploadPlayers(selectedConfigId, file);
                         toast.success(`Players uploaded from ${file.name}`);
                         const refreshed = await auctionService.getPlayers(selectedConfigId);
                         if (refreshed.length) setPlayers(refreshed);
                       } catch (err: any) {
                         toast.error(err?.message || 'Upload failed');
                       }
                       e.target.value = '';
                     }} />
                   </label>
                 )}
              </div>
            </div>

            {/* Player Pool Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Registered', value: eventRegistrations.length, color: 'var(--gold)' },
                { label: 'In Pool', value: players.length, color: 'var(--blue)' },
                { label: 'Sold', value: players.filter(p => p.status === 'SOLD').length, color: 'var(--green)' },
                { label: 'Queued', value: players.filter(p => p.status === 'QUEUED' || p.status === 'queue').length, color: 'var(--amber)' },
                { label: 'Unsold', value: players.filter(p => p.status === 'PASSED').length, color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input className="finput" placeholder="Search registered players..." value={playerSearchQuery} onChange={e => setPlayerSearchQuery(e.target.value)} style={{ paddingLeft: 32, fontSize: 12 }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {(() => {
                    const filtered = eventRegistrations.filter(p =>
                      !playerSearchQuery || p.name?.toLowerCase().includes(playerSearchQuery.toLowerCase()) || p.role?.toLowerCase().includes(playerSearchQuery.toLowerCase())
                    );
                    return filtered.length > 0 ? filtered.map(p => (
                      <div key={p.id} className="player-row bg-[rgba(212,160,23,0.05)] border border-[rgba(212,160,23,0.1)] min-h-[48px] sm:min-h-0">
                        <div className="player-avatar av-bat !bg-[var(--gold)] !text-black">{p.name[0].toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="text-[12px] sm:text-[13px] font-semibold text-[var(--text)]">{p.name}</div>
                          <div className="text-[10px] text-[var(--muted)]">Role: {p.role}</div>
                        </div>
                        <div className="text-right">
                          <span className="tag tag-green">Confirmed</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center p-8 sm:p-10 text-[var(--muted)] bg-white/[0.02] rounded-lg">
                        <div className="text-3xl mb-3">📋</div>
                        <div>{playerSearchQuery ? 'No players match your search.' : 'No confirmed players found for this event.'}</div>
                        <div className="text-[11px] mt-1">Players appear here after their registration is confirmed.</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="sec-title" style={{ margin: 0 }}>Auction Player Pool ({players.length})</div>
                  <div className="flex gap-1">
                    {['ALL', 'QUEUED', 'SOLD', 'PASSED'].map(s => (
                      <button key={s} className={`tag ${playerStatusFilter === s ? 'tag-gold' : ''}`} style={{ cursor: 'pointer', fontSize: 9 }} onClick={() => setPlayerStatusFilter(s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  {(() => {
                    const filtered = players.filter(p =>
                      (playerStatusFilter === 'ALL' || p.status === playerStatusFilter || (playerStatusFilter === 'QUEUED' && p.status === 'queue')) &&
                      (!playerSearchQuery || p.name?.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                    );
                    return filtered.length > 0 ? filtered.map(p => (
                      <div key={p.id} className="player-row" style={{ background: p.status === 'SOLD' ? 'rgba(34,197,94,0.05)' : 'rgba(99,102,241,0.03)', border: `1px solid ${p.status === 'SOLD' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.1)'}` }}>
                        <div className="player-avatar av-bat" style={{ background: p.status === 'SOLD' ? 'var(--green)' : 'var(--gold)', color: '#000' }}>
                          {(p.name || '').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.role || p.category || 'Player'} · Base ₹{(p.basePrice || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`tag ${p.status === 'SOLD' ? 'tag-green' : p.status === 'QUEUED' || p.status === 'queue' ? 'tag-blue' : 'tag-amber'}`}>{p.status}</span>
                          {p.soldPrice ? <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>₹{p.soldPrice.toLocaleString('en-IN')}</div> : null}
                          {p.assignedTeam ? <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{(p.assignedTeam as any).teamName || (p.assignedTeam as any).name}</div> : null}
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                        <div>{playerStatusFilter !== 'ALL' ? `No ${playerStatusFilter} players.` : 'No players in auction pool yet.'}</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>Upload a CSV or add players manually.</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Event Registrations</div><div className="page-sub">View confirmed participants from registration database</div></div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
                <span className="text-xs sm:text-[13px] text-[var(--muted)]">Select Event:</span>
                <select
                  className="fselect w-full sm:w-auto sm:min-w-[250px] py-1.5 px-3"
                  value={selectedEventId || ""}
                  onChange={e => {
                    const eid = e.target.value ? Number(e.target.value) : null;
                    setSelectedEventId(eid);
                    if (eid) {
                      setLoadingRegistrations(true);
                      sportsService.getEventRegistrations(eid)
                        .then(regs => setEventRegistrations(regs))
                        .catch(() => setEventRegistrations([]))
                        .finally(() => setLoadingRegistrations(false));
                    } else {
                      setEventRegistrations([]);
                    }
                  }}
                >
                  <option value="">Select Sports Event...</option>
                  {auctionEventMap.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {eventRegistrations.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1" style={{ maxWidth: 320 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="finput" placeholder="Search by name, role, flat..." value={registrationSearchQuery} onChange={e => setRegistrationSearchQuery(e.target.value)} style={{ paddingLeft: 32, fontSize: 12 }} />
                </div>
                <span className="text-xs text-[var(--muted)]">{eventRegistrations.filter(r => !registrationSearchQuery || [r.playerName, r.user?.name, r.role, r.flatNumber, r.category?.name].some(f => f?.toLowerCase().includes(registrationSearchQuery.toLowerCase()))).length} of {eventRegistrations.length}</span>
              </div>
            )}

            <div className="card card-gold">
              {loadingRegistrations ? (
                <div className="p-8 sm:p-10 text-center text-[var(--muted)]">Loading registrations...</div>
              ) : eventRegistrations.length > 0 ? (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full border-collapse min-w-[480px]">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-[var(--gold)] uppercase">Player</th>
                        <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-[var(--gold)] uppercase hidden sm:table-cell">Role/Category</th>
                        <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-[var(--gold)] uppercase">Status</th>
                        <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-[var(--gold)] uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRegistrations.filter(r => !registrationSearchQuery || [r.playerName, r.user?.name, r.role, r.flatNumber, r.category?.name].some(f => f?.toLowerCase().includes(registrationSearchQuery.toLowerCase()))).map(reg => (
                        <tr key={reg.id} className="border-b border-white/5">
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                            <div className="font-semibold text-[13px]">{reg.playerName || reg.user?.name}</div>
                            <div className="text-[10px] sm:text-[11px] text-[var(--muted)]">Age: {reg.age || 'N/A'} · {reg.flatNumber || 'External'}</div>
                          </td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-[13px] hidden sm:table-cell">
                            {reg.role || 'All-rounder'}
                            <div className="text-[11px] text-[var(--muted)]">{reg.category?.name || 'General'}</div>
                          </td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                            <span className={`tag ${reg.status === 'CONFIRMED' ? 'tag-green' : 'tag-blue'}`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                            <button className="btn btn-outline btn-sm py-1 px-2.5 text-[11px] min-h-[36px] sm:min-h-0" onClick={() => toast.info(`${reg.playerName || reg.user?.name || 'Player'} · Age: ${reg.age || 'N/A'} · Role: ${reg.role || 'All-rounder'} · ${reg.flatNumber || 'External'} · Status: ${reg.status}`)}>
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 sm:py-[60px] text-center text-[var(--muted)]">
                  {selectedEventId ? 'No registrations found for this event.' : 'Please select a sports event to view registrations.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === 'results' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Auction Results</div><div className="page-sub">Final Team Rosters & Budgets</div></div>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center">
                  <span className="text-xs sm:text-[13px] text-[var(--muted)]">Sports Event:</span>
                  <select
                    className="fselect w-full sm:w-auto sm:min-w-[200px] py-1.5 px-3"
                    value={selectedEventId || ''}
                    onChange={e => {
                      const eid = e.target.value ? Number(e.target.value) : null;
                      setSelectedEventId(eid);
                      if (eid) {
                        const firstConfig = availableConfigs.find(c => c.eventId === eid);
                        if (firstConfig) setSelectedConfigId(firstConfig.id);
                      }
                    }}
                  >
                    <option value="">All Events</option>
                    {auctionEventMap.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center">
                  <span className="text-xs sm:text-[13px] text-[var(--muted)]">Auction:</span>
                  <select
                    className="fselect w-full sm:w-auto sm:min-w-[200px] py-1.5 px-3"
                    value={selectedConfigId || ''}
                    onChange={e => setSelectedConfigId(Number(e.target.value))}
                  >
                    {availableConfigs
                      .filter(c => !selectedEventId || c.eventId === selectedEventId)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.seasonName} {c.status === 'COMPLETED' ? '(Completed)' : ''}
                        </option>
                      ))}
                    {availableConfigs.filter(c => !selectedEventId || c.eventId === selectedEventId).length === 0 && (
                      <option value="">No Auctions Found</option>
                    )}
                  </select>
                </div>
                {auctionStatus === 'COMPLETED' && (
                  <button className="btn btn-outline btn-sm" onClick={handleExportResults} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={14} /> Export CSV
                  </button>
                )}
              </div>
            </div>
            {auctionStatus !== 'COMPLETED' ? (
              <div className="auction-stage animate-fade-in text-center py-12 sm:py-20 px-4 sm:px-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 mt-4 sm:mt-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">⏳</div>
                <div className="player-name-big mb-3 text-2xl sm:text-[28px] tracking-wide">Auction In Progress</div>
                <div className="text-[13px] sm:text-sm text-[var(--muted)] max-w-[460px] mx-auto mb-5 sm:mb-6 leading-relaxed">
                  This auction configuration is currently in <strong className="text-[var(--gold)]">{auctionStatus}</strong> status. Roster results will be finalized and rendered once the administrator completes the live bidding.
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
                  <button className="btn btn-gold py-2.5 px-5 sm:px-6 min-h-[44px] sm:min-h-0" onClick={() => nav('live')}>📺 View Live Auction</button>
                  <button className="btn btn-outline py-2.5 px-5 sm:px-6 min-h-[44px] sm:min-h-0" onClick={() => nav('teams')}>🛡️ Teams Dashboard</button>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>{teams.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Teams</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{players.filter(p => p.status === 'SOLD').length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Players Sold</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--red)' }}>{players.filter(p => p.status === 'PASSED').length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Unsold</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>₹{teams.reduce((s, t) => s + (t.spent || 0), 0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Spent</div>
                  </div>
                </div>

                <div className="card card-gold" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="sec-title" style={{ margin: 0 }}>⚖️ Dispute Resolution Committee</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
                        Any disputes arising from the auction process should be referred to the committee below. All decisions are final and binding.
                      </div>
                    </div>
                  </div>
                  {committee.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                      {committee.map((m: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(234,179,8,0.06)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.12)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000' }}>
                            {(m.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.role || 'Committee Member'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 12 }}>No committee members assigned.</div>
                  )}
                </div>
                <div className="grid2 results-grid mt-3 sm:mt-4">
                  {teams.map(team => {
                    const teamPlayers = players.filter(p => p.status === 'SOLD' && (p.assignedTeam?.id === team.id || (p as any).assignedTeamId === team.id));
                    const budget = team.budget || 0;
                    const spent = team.spent || 0;
                    const remaining = budget - spent;

                    return (
                      <div key={team.id} className="card card-gold mb-3 sm:mb-4 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 sm:mb-4">
                          <div>
                            <div className="sec-title !m-0 text-base sm:text-xl">{team.emoji} {team.name}</div>
                            <div className="text-[11px] sm:text-xs text-[var(--muted)] mt-1">Spent: ₹{spent.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-lg sm:text-xl font-bold text-[var(--green)]">₹{remaining.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Remaining</div>
                          </div>
                        </div>

                        <div className="bg-black/20 rounded-lg p-2">
                          <div className="text-xs text-[var(--gold)] mb-2 pl-1 font-semibold">
                            Players ({teamPlayers.length})
                          </div>
                          {teamPlayers.length > 0 ? teamPlayers.map(p => {
                            const playerName = (p as any).playerName || p.name;
                            const playerRole = (p as any).playerRole || p.role;
                            const initials = p.initials || playerName?.match(/\b\w/g)?.join('')?.substring(0, 2)?.toUpperCase() || 'P';

                            return (
                              <div key={p.id} className="player-row sold py-2 px-3 my-1 bg-white/[0.03] !rounded-md min-h-[44px] sm:min-h-0">
                                <div className="player-avatar av-bat w-8 h-8 text-xs">
                                  {initials}
                                </div>
                                <div className="flex-1">
                                  <div className="text-[13px] sm:text-sm font-semibold">{playerName}</div>
                                  <div className="text-[10px] sm:text-[11px] text-[var(--muted)]">{playerRole}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[13px] sm:text-sm font-semibold text-[var(--green)]">₹{(p.soldPrice || 0).toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="text-xs text-[var(--muted)] text-center py-5">No players assigned yet.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* CRICKET (Setup Menu) */}
        {activeTab === 'cricket' && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title">Cricket Setup</div><div className="page-sub">Manage Players & Teams</div></div>
              {canEditAuctionConfig && <button className="btn btn-outline" onClick={() => nav('config')}>Auction Rules ↗</button>}
            </div>

            <div className="grid2">
              {canEditTeams && (
                <div className="card card-gold">
                  <div className="sec-title">Add / Edit Team</div>
                  <div className="fgrp mb-2.5">
                    <div className="flabel">Team Name</div>
                    <input className="finput" placeholder="e.g. Team Warriors"
                      value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  </div>
                  <div className="fgrp mb-2.5">
                    <div className="flabel">Captain / Owner</div>
                    <select className="fselect" value={selectedOwnerId || ''} onChange={e => setSelectedOwnerId(Number(e.target.value))}>
                      <option value="">Select Captain...</option>
                      {communityUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fgrp mb-2.5">
                    <div className="flabel">Starting Budget (₹)</div>
                    <input className="finput" type="number"
                      value={newTeamBudget} onChange={e => setNewTeamBudget(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-gold w-full min-h-[44px] sm:min-h-0" onClick={handleCreateTeam} disabled={isCreatingTeam}>
                    {isCreatingTeam ? 'Saving...' : 'Save Team ↗'}
                  </button>
                </div>
              )}

              {canEditPlayerPool && (
                <div className="card card-gold">
                  <div className="sec-title">Add New Player</div>
                  <div className="form-row">
                    <div className="fgrp mb-2.5 flex-[2]">
                      <div className="flabel">Player Name</div>
                      <input className="finput" placeholder="e.g. Virat K."
                        value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} />
                    </div>
                    <div className="fgrp mb-2.5 flex-1">
                      <div className="flabel">Age</div>
                      <input className="finput" type="number"
                        value={newPlayer.age} onChange={e => setNewPlayer({ ...newPlayer, age: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="fgrp mb-2.5">
                      <div className="flabel">Category</div>
                      <select className="fselect" value={newPlayer.category} onChange={e => setNewPlayer({ ...newPlayer, category: e.target.value })}>
                        <option value="BATSMEN">Batsmen</option>
                        <option value="BOWLERS">Bowlers</option>
                        <option value="ALL_ROUNDERS">All Rounders</option>
                        <option value="WICKET_KEEPERS">Wicket Keepers</option>
                      </select>
                    </div>
                    <div className="fgrp mb-2.5">
                      <div className="flabel">Role</div>
                      <input className="finput" placeholder="e.g. Right-Hand Bat"
                        value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })} />
                    </div>
                  </div>

                  <div className="fgrp mb-3.5">
                    <div className="flabel">Base Price (₹)</div>
                    <input className="finput" type="number"
                      value={newPlayer.basePrice} onChange={e => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })} />
                  </div>

                  <div className="sec-title text-sm">Player Statistics</div>
                  <div className="form-row">
                    <div className="fgrp mb-2.5"><div className="flabel">Matches</div><input className="finput" type="number" value={newPlayer.matches} onChange={e => setNewPlayer({ ...newPlayer, matches: Number(e.target.value) })} /></div>
                    <div className="fgrp mb-2.5"><div className="flabel">Runs</div><input className="finput" type="number" value={newPlayer.runs} onChange={e => setNewPlayer({ ...newPlayer, runs: Number(e.target.value) })} /></div>
                    <div className="fgrp mb-2.5"><div className="flabel">Wickets</div><input className="finput" type="number" value={newPlayer.wickets} onChange={e => setNewPlayer({ ...newPlayer, wickets: Number(e.target.value) })} /></div>
                  </div>

                  <button className="btn btn-gold w-full mt-2.5 min-h-[44px] sm:min-h-0" onClick={handleCreatePlayer}>Add Player ↗</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OTHER SPORTS (Placeholders) */}
        {['badminton', 'football', 'volleyball'].includes(activeTab) && (
          <div className="page active">
            <div className="page-hdr">
              <div><div className="page-title capitalize">{activeTab}</div><div className="page-sub">Configure auction rules</div></div>
              {canEditAuctionConfig && <button className="btn btn-outline min-h-[44px] sm:min-h-0" onClick={() => nav('config')}>Setup Auction ↗</button>}
            </div>
            <div className="card"><div className="text-center py-6 sm:py-[30px] text-[var(--muted)]">No auction configured for {activeTab} yet.</div></div>
          </div>
        )}

      </main>
    </div>
  );
}

