import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Settings, Trophy, AlertTriangle, ChevronDown, ChevronUp, Pencil, Plus, X, Trash2, GripVertical, Users, CheckCircle2, Zap, Download, FileText, FileSpreadsheet, Filter, Printer } from 'lucide-react';
import { tournamentService } from '../../../services/sports/tournamentService';
import { venueService } from '../../../services/bookings/venueService';
import { useAuth } from '../../../contexts/AuthContext';
import { VenueTimingModal } from './VenueTimingModal';
import { AddEditVenueModal } from './AddEditVenueModal';
import { showSuccess, showWarning, showError, showInfo } from '../../../utils/ToastUtils';
import { confirmAction } from '../../../utils/AlertUtils';
import { escapeHtml } from '../../../utils/sanitize';



import { sportsService } from '../../../services/sports/sportsService';
import type { TournamentTypeInfo, EventInfo, ConfigInfo, TournamentDropdownItem } from '../../../services/sports/tournamentService';
import type { Venue, EventRegistration, SportsEvent } from '../../../types/api';
import { PlayoffBracketView } from './PlayoffBracketView';
import { ScheduleSaveFooter } from './ScheduleSaveFooter';
import { FixturesTableView, type FixtureTableRow } from './FixturesTableView';
import { FixturesListView } from './FixturesListView';
import { getPartnerDetails } from '../sports/admin/sportsPartnerUtils';
import {
  exportScheduleToCSV,
  exportScheduleToExcel,
  exportScheduleToPDF,
  exportUmpireScorecardsPDF,
  exportBracketToPDF,
  exportListViewToPDF,
} from '../../../utils/sportsExportUtils';
import type { ExportableMatch } from '../../../utils/sportsExportUtils';
import {
  applyPlayoffOverrides,
  collectPlayoffPlaceholderOptions,
  getGroupStageEnd,
  addMinutesToTime,
  parseBreakMinutes,
  buildPlayoffBracket,
} from './playoffSchedule';
import type { PlayoffScheduleInput, PlayoffMatchDraft, PlayoffSeedingOrder } from './playoffSchedule';

const TIME_OPTIONS = [
  '06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM','09:00 PM','10:00 PM'
];
const BREAK_OPTIONS = ['5 mins','10 mins','15 mins','20 mins','30 mins','45 mins','60 mins'];
const SEEDING_OPTIONS: { value: PlayoffSeedingOrder; label: string }[] = [
  { value: 'RANDOM', label: 'Random' },
  { value: 'TRADITIONAL', label: 'Traditional' },
  { value: 'SEQUENTIAL', label: 'Sequential' },
  { value: 'RANKING', label: 'Ranking' },
];
const VENUE_ASSIGN_OPTIONS = ['Random','Snake','Sequential','Parallel'];

export function deduplicateReciprocalRegistrations(
  registrations: EventRegistration[],
  isDoubles: boolean
): EventRegistration[] {
  if (!isDoubles) return registrations;
  const processedRegIds = new Set<number>();
  const effectiveRegistrations: EventRegistration[] = [];

  for (const reg of registrations) {
    if (processedRegIds.has(reg.id)) continue;
    processedRegIds.add(reg.id);

    if (reg.partnerUserId != null) {
      const reciprocal = registrations.find(
        other => other.id !== reg.id &&
          ((other.user?.id != null && other.user.id === reg.partnerUserId) || other.id === reg.partnerUserId) &&
          (other.partnerUserId === reg.user?.id || other.partnerUserId === reg.id)
      );
      if (reciprocal) {
        processedRegIds.add(reciprocal.id);
      }
    }
    effectiveRegistrations.push(reg);
  }
  return effectiveRegistrations;
}

export function formatParticipantDisplayName(
  reg: EventRegistration,
  partnerInfo: ReturnType<typeof getPartnerDetails>,
  isDoubles: boolean,
  fallbackIndex = 1
): { displayName: string; flatDisplay?: string } {
  let displayName = reg.playerName || reg.user?.fullName || `Participant ${fallbackIndex}`;
  let flatDisplay = reg.flatNumber || reg.user?.community?.name || undefined;

  if (isDoubles) {
    const primaryName = reg.playerName || reg.user?.fullName || 'Player';
    if (partnerInfo.hasPartner && partnerInfo.name) {
      const partnerName = partnerInfo.name;
      if (reg.proposedTeamName && reg.proposedTeamName.trim()) {
        displayName = `${reg.proposedTeamName.trim()} (${primaryName} / ${partnerName})`;
      } else {
        displayName = `${primaryName} / ${partnerName}`;
      }
      if (partnerInfo.flat && partnerInfo.flat !== flatDisplay) {
        flatDisplay = flatDisplay ? `${flatDisplay} / ${partnerInfo.flat}` : partnerInfo.flat;
      }
    } else if (partnerInfo.isOpenPool) {
      displayName = `${primaryName} / [Seeking Partner]`;
    } else {
      displayName = `${primaryName} / [Partner Invited]`;
    }
  } else if (reg.proposedTeamName && reg.proposedTeamName.trim()) {
    displayName = `${reg.proposedTeamName.trim()} (${displayName})`;
  }

  return { displayName, flatDisplay };
}

interface SetupScheduleProps {
  initialEventId?: string;
}

export function SetupSchedule({ initialEventId }: SetupScheduleProps = {}) {
  // Data
  const { hasPermission, user, isAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const canEditTiming = isSuperAdmin || isAdmin || isSportsAdmin || (hasPermission ? hasPermission("Edit Venue Timing") : false);
  const [types, setTypes] = useState<TournamentTypeInfo[]>([]);

  const [events, setEvents] = useState<EventInfo[]>([]);
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Schedule Config
  const [format, setFormat] = useState('');
  const [participants, setParticipants] = useState('8');
  const [numberOfGroups, setNumberOfGroups] = useState('2');
  const [thirdPlace, setThirdPlace] = useState(false);
  const [seedingOrder, setSeedingOrder] = useState('TRADITIONAL');
  const [playoffThirdPlace, setPlayoffThirdPlace] = useState(false);
  const [playoffSeedingOrder, setPlayoffSeedingOrder] = useState('TRADITIONAL');
  const [playoffViewMode, setPlayoffViewMode] = useState<'bracket' | 'list'>('bracket');

  const isKnockoutOnly =
    format === 'KNOCKOUT' ||
    format === 'KNOCKOUT_SINGLE' ||
    format === 'KNOCKOUT_DOUBLE' ||
    format === 'DOUBLE_ELIMINATION';

  const isGroupKnockout =
    format === 'GROUP_PLAYOFF' ||
    format === 'GROUP_KNOCKOUT';

  const isRoundRobin =
    format === 'ROUND_ROBIN' ||
    format === 'LEAGUE' ||
    format === 'CUSTOM' ||
    format === 'SWISS' ||
    format === 'SUPER_LEAGUE';

  // Scoring Config
  const [ptsWin, setPtsWin] = useState('2');
  const [ptsDraw, setPtsDraw] = useState('1');
  const [ptsLoss, setPtsLoss] = useState('0');

  // Standings Configuration Master State
  const [standingsConfig, setStandingsConfig] = useState({
    allowVariablePoints: false,
    convincingWin: '3',
    convincingLoss: '0',
    normalWin: '2',
    normalLoss: '0',
    marginalWin: '2',
    marginalLoss: '1',
    customPoints: false,
    tiePoints: '1',
    noResultPoints: '1',
    displaySettings: {
      totalMatches: true,
      matchPoints: true,
      played: true,
      toBePlayed: false,
      wins: true,
      losses: true,
      tiedDrawn: false,
      noResult: false,
      setsWon: false,
      setsLost: false,
      cumulativeSetPointsScored: false,
      cumulativeSetSubPointsScored: false,
      cumulativeSetPointsConceded: false,
      cumulativeSetSubPointsConceded: false,
      recentForm: false,
      setPointsDiff: false,
    },
    additionalParams: [] as { id: string; name: string; shortName: string }[],
  });

  // Modal temporary form states
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [modalAllowVariablePoints, setModalAllowVariablePoints] = useState(false);
  const [modalConvincingWin, setModalConvincingWin] = useState('3');
  const [modalConvincingLoss, setModalConvincingLoss] = useState('0');
  const [modalNormalWin, setModalNormalWin] = useState('2');
  const [modalNormalLoss, setModalNormalLoss] = useState('0');
  const [modalMarginalWin, setModalMarginalWin] = useState('2');
  const [modalMarginalLoss, setModalMarginalLoss] = useState('1');
  const [modalCustomPoints, setModalCustomPoints] = useState(false);
  const [modalTiePoints, setModalTiePoints] = useState('1');
  const [modalNoResultPoints, setModalNoResultPoints] = useState('1');
  const [modalDisplaySettings, setModalDisplaySettings] = useState<Record<string, boolean>>({});
  const [modalAdditionalParams, setModalAdditionalParams] = useState<{ id: string; name: string; shortName: string }[]>([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamShortName, setNewParamShortName] = useState('');

  // Additional Parameters Handlers
  const addAdditionalParam = () => {
    if (!newParamName.trim() || !newParamShortName.trim()) return;
    const newParam = {
      id: Math.random().toString(36).substr(2, 9),
      name: newParamName.trim(),
      shortName: newParamShortName.trim()
    };
    setModalAdditionalParams([...modalAdditionalParams, newParam]);
    setNewParamName('');
    setNewParamShortName('');
  };

  const updateAdditionalParam = (id: string, field: 'name' | 'shortName', value: string) => {
    setModalAdditionalParams(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteAdditionalParam = (id: string) => {
    setModalAdditionalParams(prev => prev.filter(p => p.id !== id));
  };

  const openStandingsModal = () => {
    setModalAllowVariablePoints(standingsConfig.allowVariablePoints);
    setModalConvincingWin(standingsConfig.convincingWin);
    setModalConvincingLoss(standingsConfig.convincingLoss);
    setModalNormalWin(ptsWin);
    setModalNormalLoss(ptsLoss);
    setModalMarginalWin(standingsConfig.marginalWin);
    setModalMarginalLoss(standingsConfig.marginalLoss);
    setModalCustomPoints(standingsConfig.customPoints);
    setModalTiePoints(ptsDraw);
    setModalNoResultPoints(standingsConfig.noResultPoints);
    setModalDisplaySettings({ ...standingsConfig.displaySettings });
    setModalAdditionalParams([...standingsConfig.additionalParams]);
    setNewParamName('');
    setNewParamShortName('');
    setShowStandingsModal(true);
  };

  const handleSaveStandings = () => {
    setStandingsConfig({
      allowVariablePoints: modalAllowVariablePoints,
      convincingWin: modalConvincingWin,
      convincingLoss: modalConvincingLoss,
      normalWin: modalNormalWin,
      normalLoss: modalNormalLoss,
      marginalWin: modalMarginalWin,
      marginalLoss: modalMarginalLoss,
      customPoints: modalCustomPoints,
      tiePoints: modalTiePoints,
      noResultPoints: modalNoResultPoints,
      displaySettings: modalDisplaySettings as any,
      additionalParams: modalAdditionalParams,
    });
    setPtsWin(modalNormalWin);
    setPtsLoss(modalNormalLoss);
    setPtsDraw(modalTiePoints);
    setShowStandingsModal(false);
  };

  const toggleDisplaySetting = (key: string) => {
    setModalDisplaySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const displayParams = [
    { key: 'totalMatches', label: 'Total Matches' },
    { key: 'matchPoints', label: 'Match Points' },
    { key: 'played', label: 'Played' },
    { key: 'toBePlayed', label: 'To be played' },
    { key: 'wins', label: 'Wins' },
    { key: 'losses', label: 'Losses' },
    { key: 'tiedDrawn', label: 'Tied/Drawn' },
    { key: 'noResult', label: 'No Result' },
    { key: 'setsWon', label: 'Sets Won' },
    { key: 'setsLost', label: 'Sets Lost' },
    { key: 'cumulativeSetPointsScored', label: 'Cumulative Set Points (Scored)' },
    { key: 'cumulativeSetSubPointsScored', label: 'Cumulative Set Sub Points (Scored)' },
    { key: 'cumulativeSetPointsConceded', label: 'Cumulative Set Points (Conceded)' },
    { key: 'cumulativeSetSubPointsConceded', label: 'Cumulative Set Sub Points (Conceded)' },
    { key: 'recentForm', label: 'Recent Form' },
    { key: 'setPointsDiff', label: 'Set Points Diff' },
  ];

  // Participants Scoring Master State
  const [participantsScoring, setParticipantsScoring] = useState({
    enabled: false,
    adminApproval: false,
    canPublish: false,
    opponentApproval: false,
  });

  // Modal temporary form states for participants scoring
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [modalAdminApproval, setModalAdminApproval] = useState(false);
  const [modalCanPublish, setModalCanPublish] = useState(false);
  const [modalOpponentApproval, setModalOpponentApproval] = useState(false);

  const openParticipantsModal = () => {
    setModalAdminApproval(participantsScoring.adminApproval);
    setModalCanPublish(participantsScoring.canPublish);
    setModalOpponentApproval(participantsScoring.opponentApproval);
    setShowParticipantsModal(true);
  };

  const handleSaveParticipants = () => {
    setParticipantsScoring({
      enabled: true,
      adminApproval: modalAdminApproval,
      canPublish: modalCanPublish,
      opponentApproval: modalOpponentApproval,
    });
    setShowParticipantsModal(false);
    showSuccess('Participants scoring workflow enabled successfully!');
  };

  // Date & Time Config
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('08:00 PM');
  const [matchDuration, setMatchDuration] = useState('30');
  const [breakTime, setBreakTime] = useState('10 mins');
  const [limitMatchesPerDay, setLimitMatchesPerDay] = useState(false);
  const [matchDays, setMatchDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [usePlayoffDays, setUsePlayoffDays] = useState(false);
  const [playoffDays, setPlayoffDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [playoffRoundDates, setPlayoffRoundDates] = useState<Record<string, string>>({});
  const [maxMatchesPerDay, setMaxMatchesPerDay] = useState('2');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Venue Config
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [venueAssignType, setVenueAssignType] = useState('Random');
  const [expandedVenue, setExpandedVenue] = useState<number | null>(null);
  // Selected courts per venue — keyed by venue id, value = list of selected court names
  const [selectedCourts, setSelectedCourts] = useState<Record<number, string[]>>({});

  // Event & Filter Selection
  const [tournaments, setTournaments] = useState<TournamentDropdownItem[]>([]);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  // UI
  const [generating, setGenerating] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  const [addEditVenueModalOpen, setAddEditVenueModalOpen] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState<Venue | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDisplayExportMenu, setShowDisplayExportMenu] = useState(false);
  const [selectedTimingVenue, setSelectedTimingVenue] = useState<Venue | null>(null);
  // Generated Schedule View
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'visual' | 'list' | 'table'>('visual');
  const [useCustomNames, setUseCustomNames] = useState(false);
  const [customParticipantNames, setCustomParticipantNames] = useState('');
  const [playoffsGenerated, setPlayoffsGenerated] = useState(false);
  // Playoff ("rounds to final") bracket draft generated by the backend
  // (POST /api/tournament/playoff/generate). Replaces in-browser generation.
  const [playoffDraft, setPlayoffDraft] = useState<PlayoffMatchDraft[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [generatedGroups, setGeneratedGroups] = useState<Array<{
    name: string;
    participants: Array<{ id: string; name: string; flatNumber?: string }>;
    rounds: string;
    proceeders: string;
    limitMatches: boolean;
    maxMatches: string;
  }>>([]);
  const [allParticipantOptions, setAllParticipantOptions] = useState<Array<{ id: string; name: string; flatNumber?: string }>>([]);
  const [confirmedRegistrations, setConfirmedRegistrations] = useState<EventRegistration[]>([]);
  const [allPlayersConfirmed, setAllPlayersConfirmed] = useState(true);

  // Match Editing State
  const [matchOverrides, setMatchOverrides] = useState<Record<string, any>>({});
  const [editingGroupIdx, setEditingGroupIdx] = useState<number>(0);
  const [editingMatchKey, setEditingMatchKey] = useState<string | null>(null);
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [editMatchForm, setEditMatchForm] = useState({
    name: '',
    homeId: '',
    awayId: '',
    date: '',
    time: '',
    duration: 30,
    venueId: null as number | null,
    courtId: null as string | null,
    moveSubsMatches: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Pre-select event when arriving from "Schedule Matches" button
  useEffect(() => {
    if (!initialEventId || events.length === 0) return;
    const match = events.find(e => e.id.toString() === initialEventId);
    if (match) {
      handleEventChange(initialEventId);
      if (match.tournamentId) {
        setSelectedTournamentFilter(match.tournamentId.toString());
      }
      if (match.sportName) {
        setSelectedSportFilter(match.sportName);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, initialEventId]);

  const loadData = async () => {
    try {
      const [t, e, c, tournList, communityEvents] = await Promise.all([
        tournamentService.getTournamentTypes(),
        tournamentService.getEventsForDropdown(),
        tournamentService.getConfigs(),
        tournamentService.getTournamentsForDropdown().catch(() => [] as TournamentDropdownItem[]),
        user?.communityId
          ? sportsService.getCommunityEvents(user.communityId).catch(() => [] as SportsEvent[])
          : Promise.resolve([] as SportsEvent[]),
      ]);
      setTypes(t);
      setConfigs(c);

      // Enrich events with communityEvents data for robust tournament, gender & age properties
      const commMap = new Map<number, SportsEvent>((communityEvents || []).map(ce => [ce.id, ce]));
      const enrichedEvents: EventInfo[] = (e || []).map(item => {
        const ce = commMap.get(item.id);
        const tournamentId = item.tournamentId ?? ce?.tournament?.id ?? null;
        const tournamentName = item.tournamentName || ce?.tournament?.name || (tournamentId ? `Tournament #${tournamentId}` : undefined);
        const gender = item.gender || ce?.gender || undefined;
        const minAge = item.minAge != null ? item.minAge : (ce?.minAge != null ? ce.minAge : undefined);
        const maxAge = item.maxAge != null ? item.maxAge : (ce?.maxAge != null ? ce.maxAge : undefined);
        const categoryName = item.categoryName || ce?.categoryName || undefined;
        const rawFormats = item.formats || item.format || ce?.format || (ce as any)?.formats;
        const formats = Array.isArray(rawFormats) ? rawFormats : (rawFormats ? [rawFormats] : []);

        return {
          ...item,
          tournamentId,
          tournamentName,
          gender,
          minAge,
          maxAge,
          categoryName,
          formats,
          minPlayers: item.minPlayers ?? ce?.minPlayers,
          maxPlayers: item.maxPlayers ?? ce?.maxPlayers,
        };
      });
      setEvents(enrichedEvents);

      // Collect unique tournaments from dropdown API and enriched events
      const tournsMap = new Map<number, TournamentDropdownItem>();
      (tournList || []).forEach(tr => {
        if (tr.id) tournsMap.set(tr.id, tr);
      });
      enrichedEvents.forEach(ev => {
        if (ev.tournamentId && !tournsMap.has(ev.tournamentId)) {
          tournsMap.set(ev.tournamentId, {
            id: ev.tournamentId,
            name: ev.tournamentName || `Tournament #${ev.tournamentId}`,
          });
        }
      });
      setTournaments(Array.from(tournsMap.values()));
    } catch { /* fallback handled by existing types */ }
    try {
      const v = await venueService.getVenues(user?.communityId);
      setVenues(v);
    } catch { /* no venues */ }
  };

  const formatGender = (gender?: string): string => {
    if (!gender) return 'Open / All';
    const upper = gender.trim().toUpperCase();
    if (upper === 'MALE' || upper === 'MEN' || upper === 'BOYS') return 'Male';
    if (upper === 'FEMALE' || upper === 'WOMEN' || upper === 'GIRLS') return 'Female';
    if (upper === 'MIXED') return 'Mixed';
    if (upper === 'ALL' || upper === 'ANY' || upper === 'OPEN') return 'Open / All';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const formatAgeCategory = (e: EventInfo): string => {
    if (e.categoryName && e.categoryName.trim()) {
      return e.categoryName.trim();
    }
    if (e.minAge != null && e.maxAge != null && (e.minAge > 0 || e.maxAge < 100)) {
      if (e.maxAge >= 90) return `${e.minAge}+ Yrs`;
      if (e.minAge <= 0) return `U-${e.maxAge}`;
      return `${e.minAge}–${e.maxAge} Yrs`;
    }
    if (e.minAge != null && e.minAge > 0) return `${e.minAge}+ Yrs`;
    if (e.maxAge != null && e.maxAge < 100) return `U-${e.maxAge}`;
    return 'All Ages / Open';
  };

  const formatParticipantFormat = (e: EventInfo): string => {
    // 1. Check formats array from e or enriched data
    const rawFormats = e.formats || e.format;
    const list = Array.isArray(rawFormats) ? rawFormats : (rawFormats ? [rawFormats] : []);
    const normalized = list.map(f => String(f).toUpperCase().trim()).filter(Boolean);

    if (normalized.length > 0) {
      const labels = normalized.map(f => {
        if (f === 'SINGLES') return 'Singles';
        if (f === 'DOUBLES') return 'Doubles';
        if (f === 'MIXED_DOUBLES' || f === 'MIXED') return 'Mixed Doubles';
        if (f === 'TEAM') return 'Team';
        return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase();
      });
      return Array.from(new Set(labels)).join(' / ');
    }

    // 2. Infer from name or category keywords
    const text = `${e.name || ''} ${e.categoryName || ''}`.toLowerCase();
    if (text.includes('mixed doubles') || (text.includes('mixed') && text.includes('doubles'))) {
      return 'Mixed Doubles';
    }
    if (text.includes('singles') && text.includes('doubles')) {
      return 'Singles / Doubles';
    }
    if (text.includes('singles')) {
      return 'Singles';
    }
    if (text.includes('doubles')) {
      return 'Doubles';
    }
    if (text.includes('mixed')) {
      return 'Mixed Doubles';
    }

    // 3. Infer from min/max players
    if (e.minPlayers === 1 && e.maxPlayers === 1) return 'Singles';
    if (e.minPlayers === 2 && e.maxPlayers === 2) return 'Doubles';
    if (e.minPlayers && e.minPlayers > 2) return 'Team';

    // 4. Team sports
    const sport = (e.sportName || '').toLowerCase();
    if (['cricket', 'football', 'volleyball', 'basketball', 'kabaddi', 'hockey', 'throwball', 'rugby', 'soccer'].includes(sport)) {
      return 'Team';
    }

    return '';
  };

  const getEventOptionLabel = (e: EventInfo): string => {
    const fmt = formatParticipantFormat(e);
    const sportPart = e.sportName ? ` (${e.sportName})` : '';
    if (!fmt) {
      return `${e.name}${sportPart}`;
    }
    const nameLower = (e.name || '').toLowerCase();
    const fmtLower = fmt.toLowerCase();
    if (nameLower.includes(fmtLower) || (fmtLower.includes('mixed') && nameLower.includes('mixed'))) {
      return `${e.name}${sportPart}`;
    }
    return `${e.name} — ${fmt}${sportPart}`;
  };

  const availableSports = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.sportName && e.sportName.trim()) {
        set.add(e.sportName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      set.add(formatGender(e.gender));
    });
    if (set.size === 0) {
      ['Open / All', 'Male', 'Female', 'Mixed'].forEach(g => set.add(g));
    }
    const preferredOrder = ['Open / All', 'Male', 'Female', 'Mixed'];
    return Array.from(set).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  const availableAges = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      set.add(formatAgeCategory(e));
    });
    return Array.from(set).sort((a, b) => {
      if (a === 'All Ages / Open') return -1;
      if (b === 'All Ages / Open') return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  const availableFormats = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      const fmt = formatParticipantFormat(e);
      if (fmt) {
        if (fmt.includes(' / ')) {
          fmt.split(' / ').forEach(part => set.add(part.trim()));
        } else {
          set.add(fmt);
        }
      }
    });
    if (set.size === 0) {
      ['Singles', 'Doubles', 'Mixed Doubles', 'Team'].forEach(f => set.add(f));
    }
    const preferredOrder = ['Singles', 'Doubles', 'Mixed Doubles', 'Mixed', 'Team'];
    return Array.from(set).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedTournamentFilter) {
        if (selectedTournamentFilter === '__none__') {
          if (e.tournamentId) return false;
        } else {
          if (String(e.tournamentId || '') !== selectedTournamentFilter) return false;
        }
      }
      if (selectedSportFilter) {
        if ((e.sportName || '').trim().toLowerCase() !== selectedSportFilter.trim().toLowerCase()) return false;
      }
      if (selectedAgeFilter) {
        if (formatAgeCategory(e) !== selectedAgeFilter) return false;
      }
      if (selectedGenderFilter) {
        if (formatGender(e.gender) !== selectedGenderFilter) return false;
      }
      if (selectedFormatFilter) {
        const fmt = formatParticipantFormat(e);
        if (!fmt) return false;
        if (fmt !== selectedFormatFilter && !fmt.includes(selectedFormatFilter)) return false;
      }
      return true;
    });
  }, [events, selectedTournamentFilter, selectedSportFilter, selectedAgeFilter, selectedGenderFilter, selectedFormatFilter]);

  const handleTournamentFilterChange = (tournId: string) => {
    setSelectedTournamentFilter(tournId);
    if (selectedEvent && tournId) {
      const ev = events.find(e => e.id.toString() === selectedEvent);
      if (ev) {
        if (tournId === '__none__' && ev.tournamentId) {
          handleEventChange('');
        } else if (tournId !== '__none__' && String(ev.tournamentId || '') !== tournId) {
          handleEventChange('');
        }
      }
    }
  };

  const handleSportFilterChange = (sport: string) => {
    setSelectedSportFilter(sport);
    if (selectedEvent && sport) {
      const ev = events.find(e => e.id.toString() === selectedEvent);
      if (ev && (ev.sportName || '').trim().toLowerCase() !== sport.trim().toLowerCase()) {
        handleEventChange('');
      }
    }
  };

  const handleAgeFilterChange = (age: string) => {
    setSelectedAgeFilter(age);
    if (selectedEvent && age) {
      const ev = events.find(e => e.id.toString() === selectedEvent);
      if (ev && formatAgeCategory(ev) !== age) {
        handleEventChange('');
      }
    }
  };

  const handleGenderFilterChange = (gender: string) => {
    setSelectedGenderFilter(gender);
    if (selectedEvent && gender) {
      const ev = events.find(e => e.id.toString() === selectedEvent);
      if (ev && formatGender(ev.gender) !== gender) {
        handleEventChange('');
      }
    }
  };

  const handleFormatFilterChange = (format: string) => {
    setSelectedFormatFilter(format);
    if (selectedEvent && format) {
      const ev = events.find(e => e.id.toString() === selectedEvent);
      if (ev) {
        const fmt = formatParticipantFormat(ev);
        if (fmt !== format && !fmt.includes(format)) {
          handleEventChange('');
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedTournamentFilter('');
    setSelectedSportFilter('');
    setSelectedAgeFilter('');
    setSelectedGenderFilter('');
    setSelectedFormatFilter('');
  };

  const handleSaveTimingSuccess = (updatedVenue: Venue) => {
    setVenues(prev => prev.map(item => item.id === updatedVenue.id ? updatedVenue : item));
    showSuccess('Venue timing updated successfully!');
  };

  const handleVenueSaved = (savedVenue: Venue) => {
    setVenues(prev => {
      const exists = prev.some(v => v.id === savedVenue.id);
      if (exists) {
        return prev.map(v => v.id === savedVenue.id ? savedVenue : v);
      }
      return [...prev, savedVenue];
    });
    setSelectedVenues(prev => prev.includes(savedVenue.id) ? prev : [...prev, savedVenue.id]);
    setExpandedVenue(savedVenue.id);
  };


  const handleEventChange = async (id: string) => {

    setSelectedEvent(id);
    const ev = events.find(e => e.id.toString() === id);
    if (ev) {
      if (ev.eventDateStart) setStartDate(ev.eventDateStart);
      if (ev.eventDateEnd) setEndDate(ev.eventDateEnd);
    }

    if (!id) return;

    // Fetch sports_event row, confirmed count, and registration list in parallel
    const [fullEventResult, confirmedResult, registrationsResult] = await Promise.allSettled([
      sportsService.getEventById(Number(id)),
      sportsService.getConfirmedCount(Number(id)),
      sportsService.getEventRegistrations(Number(id)),
    ]);

    // Format — sports_event.tournament_type is authoritative
    if (fullEventResult.status === 'fulfilled') {
      const fe = fullEventResult.value;
      let resolved = (fe.tournamentType as string | undefined)
        ?? configs.find(c => c.eventId === Number(id))?.tournamentType
        ?? '';
      if (resolved === 'KNOCKOUT') resolved = 'KNOCKOUT_SINGLE';
      if (resolved === 'GROUP_KNOCKOUT') resolved = 'GROUP_PLAYOFF';
      if (resolved) setFormat(resolved);
    } else {
      let fallback = configs.find(c => c.eventId === Number(id))?.tournamentType ?? '';
      if (fallback === 'KNOCKOUT') fallback = 'KNOCKOUT_SINGLE';
      if (fallback === 'GROUP_KNOCKOUT') fallback = 'GROUP_PLAYOFF';
      if (fallback) setFormat(fallback);
    }

    // Number of Participants — COUNT of CONFIRMED rows in sports_event_registration
    if (confirmedResult.status === 'fulfilled') {
      setParticipants(String(confirmedResult.value));
    } else if (ev && ev.totalTeams > 0) {
      setParticipants(ev.totalTeams.toString());
    }

    // Store confirmed registrations for populating participant slots with real player data
    if (registrationsResult.status === 'fulfilled') {
      const confirmed = registrationsResult.value.filter(
        (r: EventRegistration) => r.status === 'CONFIRMED' || r.status === 'REGISTERED'
      );
      setConfirmedRegistrations(confirmed);

      // If format is doubles and reciprocal registrations exist, adjust participants count to unique pairs
      const rawFmt = ev?.formats || ev?.format;
      const fmtList = Array.isArray(rawFmt) ? rawFmt : (rawFmt ? [rawFmt] : []);
      const isEvDoubles = fmtList.some((f: any) => String(f).toUpperCase().includes('DOUBLES')) ||
        Boolean(ev && ev.minPlayers === 2 && ev.maxPlayers === 2) ||
        Boolean(ev?.name && ev.name.toLowerCase().includes('doubles'));

      if (isEvDoubles && confirmed.length > 0) {
        const processed = new Set<number>();
        let pairCount = 0;
        for (const r of confirmed) {
          if (processed.has(r.id)) continue;
          processed.add(r.id);
          if (r.partnerUserId != null) {
            const reciprocal = confirmed.find(
              o => o.id !== r.id &&
                ((o.user?.id != null && o.user.id === r.partnerUserId) || o.id === r.partnerUserId) &&
                (o.partnerUserId === r.user?.id || o.partnerUserId === r.id)
            );
            if (reciprocal) processed.add(reciprocal.id);
          }
          pairCount++;
        }
        if (pairCount > 0) {
          setParticipants(String(pairCount));
        }
      }
    } else {
      setConfirmedRegistrations([]);
    }

    // Associate existing tournament config if one already exists for this event
    const existingConfig = configs.find(c => c.eventId === Number(id));
    if (existingConfig) {
      setCurrentConfigId(existingConfig.id);
    } else {
      setCurrentConfigId(null);
    }
  };

  const resetGeneratedSchedule = () => {
    setScheduleGenerated(false);
    setPlayoffsGenerated(false);
    setGeneratedGroups([]);
    setMatchOverrides({});
    setShowSetup(false);
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    resetGeneratedSchedule();
  };

  const toggleVenue = (id: number) => {
    setSelectedVenues(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  /** Toggle a court selection within a venue — supports single or multiple courts. */
  const toggleCourt = (venueId: number, courtName: string) => {
    setSelectedCourts(prev => {
      const current = prev[venueId] || [];
      const next = current.includes(courtName)
        ? current.filter(c => c !== courtName)
        : [...current, courtName];
      return { ...prev, [venueId]: next };
    });
  };

  /** Selected venues that have courts available but none selected yet. */
  const venuesNeedingCourt = () =>
    selectedVenues
      .map(vid => venues.find(v => v.id === vid))
      .filter((v): v is Venue =>
        !!v && !!v.courts && v.courts.length > 0 && (selectedCourts[v.id]?.length || 0) === 0);

  /**
   * Resolve the court id to assign to a match. Prefers the user's selected
   * courts for the venue, distributing matches across them round-robin by index.
   * Falls back to the venue's first court, or null if the venue has no courts.
   */
  const resolveCourtId = (venueId: number | null, index: number): string | null => {
    if (!venueId) return null;
    const venue = venues.find(v => v.id === venueId);
    if (!venue?.courts || venue.courts.length === 0) return null;
    const selectedNames = selectedCourts[venueId] || [];
    const pool = selectedNames.length > 0
      ? venue.courts.filter(c => selectedNames.includes(c.name))
      : venue.courts;
    const chosen = pool.length > 0 ? pool[index % pool.length] : venue.courts[0];
    return chosen?.id ?? null;
  };

  /** Resolve a venue id to its display name (for showing assigned venue per match). */
  const resolveVenueName = (venueId: number | null): string =>
    venueId ? (venues.find(v => v.id === venueId)?.name ?? '') : '';

  /** Resolve a court id to its display name across all venues' courts. */
  const resolveCourtName = (courtId: string | null): string => {
    if (courtId == null) return '';
    for (const v of venues) {
      const c = v.courts?.find(ct => String(ct.id) === String(courtId));
      if (c) return c.name;
    }
    return '';
  };

  /** Returns the existing tournament_config for the selected event, if one already exists. */
  const existingConfigForEvent = () =>
    selectedEvent ? configs.find(c => c.eventId === Number(selectedEvent)) : undefined;

  const validateScheduleConfig = () => {
    if (!format) { showWarning('Please select a format'); return false; }
    if (!participants || Number(participants) < 2) { showWarning('Enter valid participants'); return false; }
    if (selectedVenues.length === 0) { showWarning('Select at least one venue — required to generate the schedule.'); return false; }
    if (matchDays.length === 0) { showWarning('Select at least one match day'); return false; }
    for (const vid of selectedVenues) {
      const venue = venues.find(v => v.id === vid);
      if (venue?.courts && venue.courts.length > 0 && (selectedCourts[vid]?.length || 0) === 0) {
        showWarning(`Please select at least one court for venue "${venue.name}"`);
        return false;
      }
    }
    return true;
  };

  const buildScheduleConfigBody = () => {
    const ev = events.find(e => e.id.toString() === selectedEvent);
    return {
      tournamentName: ev?.name || 'Tournament',
      sportId: ev?.sportId,
      communityId: ev?.communityId,
      eventId: selectedEvent ? Number(selectedEvent) : null,
      tournamentType: format,
      totalTeams: Number(participants),
      numberOfGroups: isGroupKnockout ? Number(numberOfGroups) || 2 : null,
      teamsAdvancingPerGroup: isGroupKnockout ? Math.min(2, Math.max(1, Math.floor(Number(participants) / (Number(numberOfGroups) || 2)))) : null,
      teamIds: [],
      thirdPlaceMatch: isGroupKnockout ? playoffThirdPlace : thirdPlace,
      hasSeeding: isGroupKnockout
        ? (playoffSeedingOrder === 'TRADITIONAL' || playoffSeedingOrder === 'RANKING')
        : (seedingOrder === 'TRADITIONAL' || seedingOrder === 'RANKING'),
      startDate: startDate || null,
      endDate: endDate || null,
      matchDurationMinutes: Number(matchDuration) || 30,
      breakBetweenMatchesMinutes: parseInt(breakTime) || 10,
      matchDays: matchDays.length < 7 ? matchDays : null,
      playoffDays: usePlayoffDays && playoffDays.length < 7 ? playoffDays : null,
      playoffRoundDates: Object.keys(playoffRoundDates).length > 0 ? playoffRoundDates : null,
      venueId: selectedVenues.length > 0 ? selectedVenues[0] : null,
      pointsForWin: Number(ptsWin),
      pointsForDraw: Number(ptsDraw),
      pointsForLoss: Number(ptsLoss),
      standingsConfig: {
        allowVariablePoints: standingsConfig.allowVariablePoints,
        convincingWinPoints: Number(standingsConfig.convincingWin),
        convincingLossPoints: Number(standingsConfig.convincingLoss),
        marginalWinPoints: Number(standingsConfig.marginalWin),
        marginalLossPoints: Number(standingsConfig.marginalLoss),
        letUserGiveCustomPoints: standingsConfig.customPoints,
        noResultPoints: Number(standingsConfig.noResultPoints),
        displaySettings: standingsConfig.displaySettings,
        additionalParameters: standingsConfig.additionalParams.map(p => ({
          name: p.name,
          shortName: p.shortName,
        })),
      },
      participantsScoring: {
        enabled: participantsScoring.enabled,
        adminApproval: participantsScoring.adminApproval,
        canPublish: participantsScoring.canPublish,
        opponentApproval: participantsScoring.opponentApproval,
      },
    };
  };

  const buildParticipantList = (count: number): Array<{ id: string; name: string; flatNumber?: string; rating?: number | null }> => {
    const allParts: Array<{ id: string; name: string; flatNumber?: string; rating?: number | null }> = [];
    const customLines = useCustomNames
      ? customParticipantNames.split('\n').map(l => l.trim()).filter(Boolean)
      : [];

    const ev = events.find(e => e.id.toString() === selectedEvent);
    const fmt = ev ? formatParticipantFormat(ev) : '';
    const isDoubles = fmt.toLowerCase().includes('doubles') || Boolean(ev && ev.minPlayers === 2 && ev.maxPlayers === 2);

    // If doubles, deduplicate reciprocal pairs (when Player A registered with B, and B registered with A)
    const effectiveRegistrations = deduplicateReciprocalRegistrations(confirmedRegistrations, isDoubles);

    for (let i = 0; i < count; i++) {
      if (customLines[i]) {
        allParts.push({
          id: `P${i + 1}`,
          name: customLines[i],
        });
      } else if (i < effectiveRegistrations.length) {
        const reg = effectiveRegistrations[i];
        const partnerInfo = isDoubles ? getPartnerDetails(reg as any, confirmedRegistrations as any, ev) : { hasPartner: false, isOpenPool: false } as any;
        const { displayName, flatDisplay } = formatParticipantDisplayName(reg, partnerInfo, isDoubles, i + 1);

        allParts.push({
          id: `P${i + 1}`,
          name: displayName,
          flatNumber: flatDisplay,
          rating: reg.rating ?? null,   // Rule 6 — skill rating when available
        });
      } else {
        allParts.push({ id: `P${i + 1}`, name: `Participant ${i + 1}` });
      }
    }
    return allParts;
  };

  const buildGroupsState = (overrideNumGroups?: number) => {
    const numGroups = overrideNumGroups ?? (isRoundRobin ? 1 : (Number(numberOfGroups) || 2));
    const numParticipants = Number(participants) || 8;
    const allParts = buildParticipantList(numParticipants);
    setAllParticipantOptions(allParts);

    const defaultProceeders = isGroupKnockout
      ? String(Math.min(2, Math.max(1, Math.floor(numParticipants / numGroups))))
      : '1';

    const groups: typeof generatedGroups = [];
    for (let g = 0; g < numGroups; g++) {
      groups.push({
        name: isRoundRobin && numGroups === 1
          ? (format === 'LEAGUE' ? 'League Fixtures' : 'Round Robin Fixtures')
          : `Group ${String.fromCharCode(65 + g)}`,
        participants: [],
        rounds: '1',
        proceeders: defaultProceeders,
        limitMatches: false,
        maxMatches: '2',
      });
    }
    allParts.forEach((p, idx) => {
      const groupIdx = idx % numGroups;
      groups[groupIdx].participants.push(p);
    });
    setGeneratedGroups(groups);
  };

  /** Step 1 (Group + Knockout): assign groups and generate group-stage matches only. */
  const handleScheduleGroups = async () => {
    if (existingConfigForEvent()) { showWarning('A tournament configuration already exists for this event'); return; }
    if (!validateScheduleConfig()) return;
    setGenerating(true);
    try {
      // Preview-only: build the group-stage matches in local state. Nothing is
      // persisted until Save as Draft / Save & Publish (unified /schedule/save).
      buildGroupsState();

      setPlayoffsGenerated(false);
      setScheduleGenerated(true);
      setShowSetup(false);
      showSuccess('Group schedule generated! Configure proceeders, then Generate playoffs and Save when ready.');
    } catch (err: any) {
      console.error('[Schedule Groups] Error:', err);
      showError('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  /** Step 2 (Group + Knockout): generate knockout / playoff matches after groups are scheduled. */
  const handleGeneratePlayoffs = async () => {
    if (!scheduleGenerated) {
      showWarning('Schedule groups first');
      return;
    }
    if (
      generatedGroups.length === 0 ||
      generatedGroups.some(g => g.participants.length < 2)
    ) {
      showWarning('Configure groups with at least 2 participants before generating playoffs');
      return;
    }

    const numGroups = generatedGroups.length || Number(numberOfGroups) || 2;
    if (numGroups === 2 && generatedGroups.some(g => Number(g.proceeders) < 2)) {
      setGeneratedGroups(prev =>
        prev.map(g => ({ ...g, proceeders: '2' }))
      );
      showInfo('Proceeders set to 2 per group for semi-finals + final bracket');
    }

    setGenerating(true);
    try {
      // Preview-only: generate the playoff ("rounds to final") bracket on the
      // backend (stateless) and hold it in local state. Nothing is persisted
      // until the admin clicks Save as Draft / Save & Publish.
      await fetchPlayoffDraft();

      setPlayoffsGenerated(true);
      showSuccess('Knockout bracket generated! Review and Save when ready.');
    } catch (err: any) {
      console.error('[Generate Playoffs] Error:', err);
      showError('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  /** Single-step generate for Knockout-only and other non-group formats. */
  const handleGenerate = async () => {
    if (existingConfigForEvent()) { showWarning('A tournament configuration already exists for this event'); return; }
    if (!validateScheduleConfig()) return;
    setGenerating(true);
    try {
      // Preview-only: build participants and (for knockout-only) the bracket in
      // local state. No config or matches are persisted here — that happens on
      // Save as Draft / Save & Publish via the unified /schedule/save endpoint.
      const numParticipants = Number(participants) || 8;
      const allParts = buildParticipantList(numParticipants);
      setAllParticipantOptions(allParts);

      if (isKnockoutOnly) {
        await fetchPlayoffDraft();
        setGeneratedGroups([]);
        setPlayoffsGenerated(true);
        showSuccess('Knockout schedule generated! Review and Save when ready.');
      } else if (isRoundRobin) {
        buildGroupsState(1);
        setPlayoffsGenerated(false);
        showSuccess('Round Robin schedule generated! Review and Save when ready.');
      } else {
        buildGroupsState();
        setPlayoffsGenerated(false);
        showSuccess('Schedule generated! Review and Save when ready.');
      }

      setScheduleGenerated(true);
      setShowSetup(false);
    } catch (err: any) {
      console.error('[Generate] Error:', err);
      showError('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  // Group config handlers
  const updateGroupConfig = (groupIdx: number, field: string, value: any) => {
    setGeneratedGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, [field]: value } : g));
  };

  const updateParticipantInGroup = (groupIdx: number, partIdx: number, newId: string) => {
    const selected = allParticipantOptions.find(p => p.id === newId);
    if (!selected) return;
    setGeneratedGroups(prev => prev.map((g, i) => {
      if (i !== groupIdx) return g;
      const updated = [...g.participants];
      updated[partIdx] = { ...selected };
      return { ...g, participants: updated };
    }));
  };

  const applyToAllGroups = (sourceIdx: number) => {
    const source = generatedGroups[sourceIdx];
    setGeneratedGroups(prev => prev.map(g => ({
      ...g,
      rounds: source.rounds,
      proceeders: source.proceeders,
      limitMatches: source.limitMatches,
      maxMatches: source.maxMatches,
    })));
    showSuccess('Applied settings to all groups!');
  };

  // Helper to generate matches for a group
  const getGroupMatches = (group: typeof generatedGroups[0], groupIdx: number) => {
    const list = group.participants;
    if (list.length < 2) return [];

    const matches: Array<{ home: { id: string; name: string }; away: { id: string; name: string } }> = [];
    const n = list.length;
    const isOdd = n % 2 !== 0;
    const numPlayers = isOdd ? n + 1 : n;
    
    const players = [...list];
    if (isOdd) {
      players.push({ id: 'dummy', name: 'BYE' });
    }

    const rounds = numPlayers - 1;
    const matchesPerRound = numPlayers / 2;

    for (let r = 0; r < rounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const homeIdx = (r + m) % (numPlayers - 1);
        let awayIdx = (r + numPlayers - 1 - m) % (numPlayers - 1);
        if (m === 0) {
          awayIdx = numPlayers - 1;
        }

        const home = players[homeIdx];
        const away = players[awayIdx];

        if (home.id !== 'dummy' && away.id !== 'dummy') {
          if (r % 2 === 0) {
            matches.push({ home, away });
          } else {
            matches.push({ home: away, away: home });
          }
        }
      }
    }

    const finalMatches: typeof matches = [];
    const numRounds = Number(group.rounds) || 1;
    for (let r = 1; r <= numRounds; r++) {
      const legMatches = matches.map(m => r % 2 === 0 ? { home: m.away, away: m.home } : m);
      finalMatches.push(...legMatches);
    }
    return finalMatches;
  };

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
  };

  const advanceToAllowedDay = (date: Date, allowedDays?: number[]): Date => {
    const days = allowedDays ?? matchDays;
    if (days.length === 0 || days.length === 7) return date;
    const d = new Date(date);
    let guard = 0;
    while (!days.includes(d.getDay()) && guard < 7) {
      d.setDate(d.getDate() + 1);
      guard++;
    }
    return d;
  };

  const getActiveGroupMatches = (group: typeof generatedGroups[0], groupIdx: number) => {
    const baseMatches = getGroupMatches(group, groupIdx);

    return baseMatches.map((m, mIdx) => {
      const key = `${groupIdx}-${mIdx}`;
      const override = matchOverrides[key];

      const baseDate = startDate ? new Date(startDate) : new Date('2025-12-06');
      const defaultDate = new Date(baseDate);
      defaultDate.setDate(baseDate.getDate() + groupIdx + mIdx * 2);
      const adjusted = advanceToAllowedDay(defaultDate);
      const defaultDateStr = adjusted.toISOString().split('T')[0];
      
      const defaultVenueId = selectedVenues.length > 0 ? selectedVenues[0] : null;
      const defaultCourtId = resolveCourtId(defaultVenueId, groupIdx + mIdx);

      return {
        name: override?.name || `G${groupIdx + 1} Match ${mIdx + 1}`,
        home: override?.home || m.home,
        away: override?.away || m.away,
        date: override?.date || defaultDateStr,
        time: override?.time || startTime,
        duration: override?.duration || Number(matchDuration) || 30,
        venueId: override?.venueId ?? defaultVenueId,
        courtId: override?.courtId ?? defaultCourtId,
        moveSubsMatches: override?.moveSubsMatches || false,
      };
    });
  };

  const handleOpenEditMatch = (groupIdx: number, matchIdx: number, match: any) => {
    setEditingGroupIdx(groupIdx);
    setEditingMatchKey(`${groupIdx}-${matchIdx}`);
    setEditMatchForm({
      name: match.name,
      homeId: match.home.id,
      awayId: match.away.id,
      date: match.date,
      time: match.time,
      duration: match.duration,
      venueId: match.venueId,
      courtId: match.courtId,
      moveSubsMatches: match.moveSubsMatches || false,
    });
    setShowEditMatchModal(true);
  };

  const handleSaveMatchEdit = () => {
    if (!editingMatchKey) return;
    
    const allowedParts = getEditParticipantOptions();
    const newHome = allowedParts.find(p => p.id === editMatchForm.homeId);
    const newAway = allowedParts.find(p => p.id === editMatchForm.awayId);

    if (!newHome || !newAway) {
      showWarning('Please select valid participants');
      return;
    }
    if (newHome.id === newAway.id) {
      showWarning('A participant cannot play against themselves');
      return;
    }

    setMatchOverrides(prev => ({
      ...prev,
      [editingMatchKey]: {
        name: editMatchForm.name,
        home: newHome,
        away: newAway,
        date: editMatchForm.date,
        time: editMatchForm.time,
        duration: editMatchForm.duration,
        venueId: editMatchForm.venueId,
        courtId: editMatchForm.courtId,
        moveSubsMatches: editMatchForm.moveSubsMatches,
      }
    }));

    setShowEditMatchModal(false);
    showSuccess('Match updated successfully!');
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getSportIcon = (sName: string) => {
    const name = sName.toLowerCase().replace(/\s+/g, '');
    if (name.includes('tabletennis') || name.includes('pingpong')) {
      return 'assets/icons/sports/color/S_TabletennisColour.svg';
    }
    return 'assets/icons/sports/color/S_TabletennisColour.svg';
  };

  /**
   * Builds the input the backend needs to generate the playoff bracket.
   * Mirrors the shape the in-browser generator used; the actual bracket is
   * now produced server-side via tournamentService.generatePlayoffBracket().
   */
  const buildPlayoffInput = (): PlayoffScheduleInput => {
    const numGroups = isKnockoutOnly
      ? 1
      : generatedGroups.length || Number(numberOfGroups) || 2;
    const proceedersPerGroup = isKnockoutOnly
      ? Number(participants) || 8
      : Math.max(1, ...generatedGroups.map(g => Number(g.proceeders) || 1));

    const defaultVenueId = selectedVenues.length > 0 ? selectedVenues[0] : null;
    const defaultCourtId = resolveCourtId(defaultVenueId, 0);

    const fallbackDate = startDate || new Date().toISOString().split('T')[0];

    const allGroupSlots = generatedGroups.flatMap((group, gIdx) =>
      getActiveGroupMatches(group, gIdx).map(m => ({
        date: m.date,
        time: m.time,
        duration: m.duration,
      }))
    );

    const groupEnd = getGroupStageEnd(allGroupSlots, fallbackDate, startTime);
    const breakMins = parseBreakMinutes(breakTime);

    // For single-elimination knockout, send the seeded players (with flat numbers) and the
    // selected courts so the backend does BYE auto-advance, flat/tower-aware first-round
    // pairing, and parallel court allocation (Rule 4).
    const playerParticipants = isKnockoutOnly
      ? buildParticipantList(Number(participants) || 8).map(p => ({
          id: p.id,
          name: p.name,
          flatNumber: p.flatNumber ?? null,
          rating: p.rating ?? null,   // Rule 6 — forwarded for balanced pairing
        }))
      : undefined;

    const numericCourtId = defaultCourtId && !Number.isNaN(Number(defaultCourtId)) ? Number(defaultCourtId) : null;
    const initialStartTime = (isKnockoutOnly || allGroupSlots.length === 0)
      ? (startTime || '08:00 AM')
      : addMinutesToTime(groupEnd.time, breakMins);

    return {
      numGroups,
      proceedersPerGroup,
      seedingOrder: (isGroupKnockout ? playoffSeedingOrder : seedingOrder) as PlayoffSeedingOrder,
      thirdPlaceMatch: isGroupKnockout ? playoffThirdPlace : thirdPlace,
      startDate: groupEnd.date,
      startTime: initialStartTime,
      matchDurationMinutes: Number(matchDuration) || 30,
      breakMinutes: breakMins,
      venueId: defaultVenueId,
      courtId: numericCourtId,
      participants: playerParticipants,
      courtIds: selectedCourtIds(defaultVenueId),
      matchDays: matchDays.length < 7 ? matchDays : undefined,
    };
  };

  /** Numeric IDs of the courts selected for a venue (all courts if none explicitly chosen). */
  const selectedCourtIds = (venueId: number | null): number[] => {
    if (!venueId) return [];
    const venue = venues.find(v => v.id === venueId);
    if (!venue?.courts || venue.courts.length === 0) return [];
    const selectedNames = selectedCourts[venueId] || [];
    const pool = selectedNames.length > 0
      ? venue.courts.filter(c => selectedNames.includes(c.name))
      : venue.courts;
    return pool.map(c => Number(c.id)).filter(id => !Number.isNaN(id));
  };

  /**
   * Fetches the playoff bracket from the backend and caches it in state so the
   * synchronous render/save paths (getPlayoffMatches) can read it.
   * Falls back seamlessly to the client-side generator if the backend is unreachable.
   */
  const fetchPlayoffDraft = async (): Promise<PlayoffMatchDraft[]> => {
    try {
      const draft = await tournamentService.generatePlayoffBracket(buildPlayoffInput());
      if (draft && Array.isArray(draft) && draft.length > 0) {
        setPlayoffDraft(draft);
        return draft;
      }
    } catch (err: any) {
      console.warn('[fetchPlayoffDraft] Server playoff generation failed, using client-side bracket fallback:', err);
    }
    const localDraft = buildPlayoffBracket(buildPlayoffInput());
    setPlayoffDraft(localDraft);
    return localDraft;
  };

  /**
   * Applies UI-state post-processing (knockout-only slot→player mapping and
   * manual overrides) on top of the backend-generated bracket draft.
   * Pass `draftOverride` to use a freshly-fetched draft before React state updates.
   */
  const getPlayoffMatches = (draftOverride?: PlayoffMatchDraft[]) => {
    let matches = draftOverride ?? playoffDraft;

    if (isKnockoutOnly) {
      let koMatches = applyPlayoffOverrides(matches, matchOverrides);
      if (usePlayoffDays || Object.keys(playoffRoundDates).length > 0) {
        koMatches = koMatches.map(m => {
          const roundDate = playoffRoundDates[m.round];
          if (roundDate) return { ...m, date: roundDate };
          if (usePlayoffDays && playoffDays.length > 0 && playoffDays.length < 7 && m.date) {
            const d = advanceToAllowedDay(new Date(m.date + 'T00:00:00'), playoffDays);
            return { ...m, date: d.toISOString().split('T')[0] };
          }
          return m;
        });
      }
      return koMatches;
    }

    // Group → knockout (slot-based): distribute matches across the venue's selected courts
    // (round-robin by match index). Manual court overrides (applied next) still take precedence.
    const playoffVenueId = selectedVenues.length > 0 ? selectedVenues[0] : null;
    matches = matches.map((m, idx) => ({
      ...m,
      venueId: playoffVenueId,
      courtId: resolveCourtId(playoffVenueId, idx),
    }));

    if (usePlayoffDays || Object.keys(playoffRoundDates).length > 0) {
      matches = matches.map(m => {
        const roundDate = playoffRoundDates[m.round];
        if (roundDate) return { ...m, date: roundDate };
        if (usePlayoffDays && playoffDays.length > 0 && playoffDays.length < 7 && m.date) {
          const d = advanceToAllowedDay(new Date(m.date + 'T00:00:00'), playoffDays);
          return { ...m, date: d.toISOString().split('T')[0] };
        }
        return m;
      });
    }

    return applyPlayoffOverrides(matches, matchOverrides);
  };

  const getEditParticipantOptions = () => {
    if (editingGroupIdx !== -1) {
      return generatedGroups[editingGroupIdx]?.participants || [];
    }

    const placeholders = collectPlayoffPlaceholderOptions(getPlayoffMatches());
    const combined = [...placeholders];
    allParticipantOptions.forEach(opt => {
      if (!combined.some(c => c.id === opt.id)) {
        combined.push(opt);
      }
    });

    return combined;
  };

  const handleClearSchedule = async () => {
    const confirmed = await confirmAction(
      'Clear Schedule',
      'Are you sure you want to clear this schedule? This will reset all generated matches.'
    );
    if (!confirmed) {
      return;
    }

    try {
      // Delete matches from database if config exists
      if (currentConfigId) {
        await tournamentService.deleteMatchesByConfigId(currentConfigId);
        console.log('[Clear Schedule] Deleted matches from DB:', { configId: currentConfigId });
      }

      // Clear UI state
      setScheduleGenerated(false);
      setPlayoffsGenerated(false);
      setGeneratedGroups([]);
      setAllParticipantOptions([]);
      setMatchOverrides({});
      setShowSetup(false);
      setCurrentConfigId(null);

      showSuccess('Schedule cleared and deleted from database');
    } catch (err: any) {
      console.error('[Clear Schedule] Error:', err);
      showError('Clear failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const collectAllMatches = (playoffOverride?: PlayoffMatchDraft[]) => {
    const allMatches: any[] = [];
    const eventId = selectedEvent ? Number(selectedEvent) : null;

    if (!eventId) return allMatches;

    // Collect group stage or round robin matches
    if (isGroupKnockout || isRoundRobin) {
      generatedGroups.forEach((group, gIdx) => {
        const matches = getActiveGroupMatches(group, gIdx);
        matches.forEach((match, mIdx) => {
          allMatches.push({
            eventId,
            configId: null, // Will be populated after config is created
            groupName: group.name,
            stage: isRoundRobin ? 'ROUND_ROBIN' : 'GROUP',
            round: isRoundRobin ? 'LEAGUE_MATCH' : 'GROUP_STAGE',
            roundNumber: 1,
            bracketSlot: mIdx,
            matchNumber: mIdx + 1,
            homeName: match.home.name,
            homeId: match.home.id,
            awayName: match.away.name,
            awayId: match.away.id,
            matchDate: match.date,
            matchTime: match.time,
            duration: match.duration,
            venueId: match.venueId,
            courtId: match.courtId,
            status: 'SCHEDULED',
          });
        });
      });
    }

    // Collect playoff matches if generated
    if (playoffsGenerated || playoffOverride) {
      const playoffMatches = getPlayoffMatches(playoffOverride);
      playoffMatches.forEach((match: any, idx: number) => {
        allMatches.push({
          eventId,
          configId: null,
          groupName: match.name || (isGroupKnockout ? 'Playoffs' : 'Knockout'),
          stage: isGroupKnockout ? 'PLAYOFF' : 'KNOCKOUT',
          round: match.round || (isGroupKnockout ? 'SEMI_FINAL' : 'FINAL'),
          roundNumber: (match.roundIndex !== undefined ? match.roundIndex + 1 : 1),
          bracketSlot: idx,
          matchNumber: idx + 1,
          homeName: match.home?.name || 'TBD',
          homeId: match.home?.id || null,
          awayName: match.away?.name || 'TBD',
          awayId: match.away?.id || null,
          matchDate: match.date,
          matchTime: match.time,
          duration: match.duration,
          venueId: match.venueId,
          courtId: match.courtId || null,
          // Auto-advanced BYE matches keep their AUTO_ADVANCED status; the backend save
          // preserves it (others get the global DRAFT/PUBLISHED on Save).
          status: match.status || 'SCHEDULED',
        });
      });
    }

    return allMatches;
  };

  const handleSaveDraft = async () => {
    if (!validateScheduleConfig()) {
      return;
    }

    setSavingSchedule(true);
    try {
      // Unified, atomic save: config + all customized matches in one request.
      const result = await tournamentService.saveSchedule({
        configId: currentConfigId,
        status: 'DRAFT',
        config: buildScheduleConfigBody(),
        matches: collectAllMatches(),
      });
      setCurrentConfigId(result.config.id);
      console.log('[Save Draft] Saved:', { configId: result.config.id, savedMatches: result.savedMatches });

      showSuccess('Draft saved! ' + result.savedMatches + ' matches stored as DRAFT.');
    } catch (err: any) {
      console.error('[Save Draft] Error:', err);
      const message = err?.message || 'Unknown error';
      showError('Draft save failed: ' + message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSavePublish = async () => {
    if (!validateScheduleConfig()) {
      return;
    }

    const confirmed = await confirmAction(
      'Publish Schedule',
      'Publish this schedule? Participants will be notified.'
    );
    if (!confirmed) {
      return;
    }

    setSavingSchedule(true);
    try {
      // Unified, atomic save: config + all customized matches in one request.
      const result = await tournamentService.saveSchedule({
        configId: currentConfigId,
        status: 'PUBLISHED',
        config: buildScheduleConfigBody(),
        matches: collectAllMatches(),
      });
      setCurrentConfigId(result.config.id);
      console.log('[Save Publish] Saved:', { configId: result.config.id, savedMatches: result.savedMatches });

      showSuccess('Schedule published! ' + result.savedMatches + ' matches stored as PUBLISHED. Participants will be notified.');
    } catch (err: any) {
      console.error('[Save Publish] Error:', err);
      const message = err?.message || 'Unknown error';
      showError('Publish failed: ' + message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDragDropScheduler = () => {
    showInfo('Drag & Drop Scheduler — open visual editor to adjust timings and venues');
  };

  // Existing tournament config already saved for the selected event (in tournament_config table).
  // When present, the schedule was already generated/configured — block re-generation.
  const existingConfig = existingConfigForEvent();

  const showScheduleSaveFooter =
    scheduleGenerated && (isGroupKnockout ? playoffsGenerated : isKnockoutOnly ? playoffsGenerated : true);

  const showKnockoutBracket =
    playoffsGenerated && (isGroupKnockout || isKnockoutOnly);

  const handleOpenEditPlayoffMatch = (match: any) => {
    setEditingGroupIdx(-1);
    setEditingMatchKey(match.id);
    setEditMatchForm({
      name: match.name,
      homeId: match.home.id,
      awayId: match.away.id,
      date: match.date,
      time: match.time,
      duration: match.duration,
      venueId: match.venueId,
      courtId: match.courtId,
      moveSubsMatches: match.moveSubsMatches || false,
    });
    setShowEditMatchModal(true);
  };

  const getTotalMatchesCount = () => {
    let count = 0;
    if (isGroupKnockout || isRoundRobin) {
      generatedGroups.forEach((group, gIdx) => {
        count += getActiveGroupMatches(group, gIdx).length;
      });
    }
    count += getPlayoffMatches().length;
    return count;
  };

  const getRoundsCount = () => {
    let maxRound = 0;
    const playoffMatches = getPlayoffMatches();
    if (playoffMatches.length > 0) {
      maxRound = Math.max(...playoffMatches.map(m => m.roundIndex)) + 1;
    }
    if (isGroupKnockout || isRoundRobin) {
      const groupRounds = generatedGroups.length > 0 ? Number(generatedGroups[0].rounds) || 1 : 1;
      return groupRounds + maxRound;
    }
    return maxRound || 1;
  };

  // Helper to parse time string into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Clash & Rest Interval Detection across all active fixtures
  const scheduleConflicts = useMemo<Record<string, string[]>>(() => {
    const list: Array<{
      key: string;
      home: { id: string; name: string };
      away: { id: string; name: string };
      date: string;
      time: string;
      duration: number;
      venueId: number | null;
      courtId: string | number | null;
    }> = [];

    // Group matches
    if (isGroupKnockout || isRoundRobin) {
      generatedGroups.forEach((group, gIdx) => {
        const matches = getActiveGroupMatches(group, gIdx);
        matches.forEach((m, mIdx) => {
          list.push({
            key: `${gIdx}-${mIdx}`,
            home: m.home,
            away: m.away,
            date: m.date,
            time: m.time,
            duration: m.duration || 30,
            venueId: m.venueId,
            courtId: m.courtId,
          });
        });
      });
    }

    // Playoff matches
    if (isKnockoutOnly || (isGroupKnockout && playoffsGenerated)) {
      const pMatches = getPlayoffMatches();
      pMatches.forEach(m => {
        list.push({
          key: m.id,
          home: m.home,
          away: m.away,
          date: m.date,
          time: m.time,
          duration: m.duration || 30,
          venueId: m.venueId,
          courtId: m.courtId,
        });
      });
    }

    const conflictsMap: Record<string, string[]> = {};
    const addConflict = (key: string, msg: string) => {
      if (!conflictsMap[key]) conflictsMap[key] = [];
      if (!conflictsMap[key].includes(msg)) conflictsMap[key].push(msg);
    };

    for (let i = 0; i < list.length; i++) {
      const m1 = list[i];
      if (!m1.date || !m1.time) continue;
      const isBye1 = m1.home.id === 'bye' || m1.away.id === 'bye' || m1.home.name === 'BYE' || m1.away.name === 'BYE';
      if (isBye1) continue;

      const s1 = parseTimeToMinutes(m1.time);
      const e1 = s1 + (m1.duration || 30);

      for (let j = i + 1; j < list.length; j++) {
        const m2 = list[j];
        if (!m2.date || !m2.time || m1.date !== m2.date) continue;
        const isBye2 = m2.home.id === 'bye' || m2.away.id === 'bye' || m2.home.name === 'BYE' || m2.away.name === 'BYE';
        if (isBye2) continue;

        const s2 = parseTimeToMinutes(m2.time);
        const e2 = s2 + (m2.duration || 30);

        const timeOverlap = Math.max(s1, s2) < Math.min(e1, e2);

        // 1. Court Collision
        if (m1.venueId && m1.courtId && m1.venueId === m2.venueId && String(m1.courtId) === String(m2.courtId)) {
          if (timeOverlap) {
            const v = venues.find(ven => ven.id === m1.venueId);
            const c = v?.courts?.find(crt => String(crt.id) === String(m1.courtId));
            const courtName = [v?.name, c?.name].filter(Boolean).join(' - ') || 'Court';
            const msg = `Court Overlap: ${courtName} double-booked between ${m1.time} and ${m2.time}`;
            addConflict(m1.key, msg);
            addConflict(m2.key, msg);
          }
        }

        // 2. Participant Collision / Rest Interval Conflict (< 30 min)
        const pList1 = [m1.home, m1.away].filter(p => p.id && !p.id.includes('-') && !p.id.startsWith('dummy') && p.name !== 'BYE');
        const pList2 = [m2.home, m2.away].filter(p => p.id && !p.id.includes('-') && !p.id.startsWith('dummy') && p.name !== 'BYE');

        pList1.forEach(p1 => {
          const shared = pList2.find(p2 => p2.id === p1.id || (p2.name && p2.name === p1.name && !p1.name.startsWith('Participant ')));
          if (shared) {
            if (timeOverlap) {
              const msg = `Time Clash: ${shared.name} scheduled in simultaneous matches (${m1.time} & ${m2.time})`;
              addConflict(m1.key, msg);
              addConflict(m2.key, msg);
            } else {
              const gap = s2 >= e1 ? s2 - e1 : s1 - e2;
              if (gap < 30) {
                const msg = `Rest Conflict (<30m): ${shared.name} has only ${gap}m rest between ${m1.time} & ${m2.time}`;
                addConflict(m1.key, msg);
                addConflict(m2.key, msg);
              }
            }
          }
        });
      }
    }

    return conflictsMap;
  }, [generatedGroups, isGroupKnockout, isRoundRobin, isKnockoutOnly, playoffsGenerated, venues, matchOverrides, playoffDraft]);

  const allFixturesTableRows = useMemo<FixtureTableRow[]>(() => {
    const rows: FixtureTableRow[] = [];
    let matchCounter = 1;

    // Group / Round Robin matches
    if (isGroupKnockout || isRoundRobin) {
      generatedGroups.forEach((group, gIdx) => {
        const matches = getActiveGroupMatches(group, gIdx);
        matches.forEach((m, mIdx) => {
          const key = `${gIdx}-${mIdx}`;
          const v = venues.find(ven => ven.id === m.venueId);
          const c = v?.courts?.find(crt => crt.id === m.courtId);
          rows.push({
            id: key,
            key: `group-${key}`,
            matchNumber: matchCounter++,
            stage: isRoundRobin ? (group.name || 'Round Robin') : group.name,
            groupIndex: gIdx,
            matchIndex: mIdx,
            isPlayoff: false,
            date: m.date,
            time: m.time,
            duration: m.duration || 30,
            venueId: m.venueId,
            courtId: m.courtId,
            venueName: v?.name,
            courtName: c?.name,
            home: m.home,
            away: m.away,
            conflicts: scheduleConflicts[key] || [],
            rawMatch: m,
          });
        });
      });
    }

    // Playoff matches
    if (isKnockoutOnly || (isGroupKnockout && playoffsGenerated)) {
      const pMatches = getPlayoffMatches();
      pMatches.forEach(m => {
        const v = venues.find(ven => ven.id === m.venueId);
        const c = v?.courts?.find(crt => crt.id === m.courtId);
        const roundNameFormatted = m.round.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
        rows.push({
          id: m.id,
          key: `playoff-${m.id}`,
          matchNumber: matchCounter++,
          stage: roundNameFormatted,
          isPlayoff: true,
          date: m.date,
          time: m.time,
          duration: m.duration || 30,
          venueId: m.venueId,
          courtId: m.courtId,
          venueName: v?.name,
          courtName: c?.name,
          home: m.home,
          away: m.away,
          conflicts: scheduleConflicts[m.id] || [],
          rawMatch: m,
        });
      });
    }

    return rows;
  }, [generatedGroups, isGroupKnockout, isRoundRobin, isKnockoutOnly, playoffsGenerated, venues, scheduleConflicts, matchOverrides, playoffDraft]);

  const totalConflictsCount = useMemo(() => {
    return Object.values(scheduleConflicts).reduce((acc, msgs) => acc + (msgs.length > 0 ? 1 : 0), 0);
  }, [scheduleConflicts]);

  const collectExportableMatches = (): ExportableMatch[] => {
    const ev = events.find(e => e.id.toString() === selectedEvent);
    const sportName = ev?.sportName || 'Table Tennis';
    const list: ExportableMatch[] = [];

    if (isGroupKnockout || isRoundRobin) {
      generatedGroups.forEach((group, gIdx) => {
        const matches = getActiveGroupMatches(group, gIdx);
        matches.forEach((m, mIdx) => {
          const v = venues.find(ven => ven.id === m.venueId);
          const c = v?.courts?.find(crt => crt.id === m.courtId);
          const venueStr = [v?.name, c?.name].filter(Boolean).join(' - ') || 'TBD';
          list.push({
            id: `G${gIdx + 1}-M${mIdx + 1}`,
            matchNumber: list.length + 1,
            roundName: group.name,
            stage: isRoundRobin ? 'Round Robin' : group.name,
            sport: sportName,
            sportName: sportName,
            date: m.date,
            time: m.time,
            venue: venueStr,
            venueName: v?.name,
            courtName: c?.name,
            team1: m.home.name,
            team2: m.away.name,
            homeTeamName: m.home.name,
            awayTeamName: m.away.name,
            status: 'SCHEDULED',
          });
        });
      });
    }

    if (isKnockoutOnly || (isGroupKnockout && playoffsGenerated)) {
      const playoffMatches = getPlayoffMatches();
      playoffMatches.forEach(m => {
        const v = venues.find(ven => ven.id === m.venueId);
        const c = v?.courts?.find(crt => crt.id === m.courtId);
        const venueStr = [v?.name, c?.name].filter(Boolean).join(' - ') || 'TBD';
        const roundFormatted = m.round.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
        list.push({
          id: `KO-${m.id}`,
          matchNumber: list.length + 1,
          roundName: roundFormatted,
          stage: roundFormatted,
          sport: sportName,
          sportName: sportName,
          date: m.date,
          time: m.time,
          venue: venueStr,
          venueName: v?.name,
          courtName: c?.name,
          team1: m.home.name,
          team2: m.away.name,
          homeTeamName: m.home.name,
          awayTeamName: m.away.name,
          status: 'SCHEDULED',
        });
      });
    }

    return list;
  };

  const handleExportCSV = () => {
    const list = collectExportableMatches();
    if (list.length === 0) { showWarning('No matches to export'); return; }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    exportScheduleToCSV(list, `${ev?.name || 'Tournament'}_Schedule`);
    showSuccess(`Schedule exported as CSV (${list.length} matches)`);
  };

  const handleExportExcel = () => {
    const list = collectExportableMatches();
    if (list.length === 0) { showWarning('No matches to export'); return; }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    exportScheduleToExcel(list, `${ev?.name || 'Tournament'}_Schedule`);
    showSuccess(`Schedule exported as Excel (${list.length} matches)`);
  };

  const handleExportPDF = () => {
    const list = collectExportableMatches();
    if (list.length === 0) { showWarning('No matches to export'); return; }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    exportScheduleToPDF(list, `${ev?.name || 'Tournament'} Schedule`);
  };

  const handleExportScorecards = () => {
    const list = collectExportableMatches();
    if (list.length === 0) { showWarning('No matches to export'); return; }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    exportUmpireScorecardsPDF(list, `${ev?.name || 'Tournament'} Umpire Scorecards`);
  };


  const handleExportListViewPDF = () => {
    if (allFixturesTableRows.length === 0) {
      showWarning('No matches to export');
      return;
    }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    exportListViewToPDF(
      allFixturesTableRows,
      `${ev?.name || 'Tournament'} Fixtures Schedule (List View)`,
      'Mana Community Sports',
      ev?.sportName || 'Tournament'
    );
  };

  const handleExportBracketPDF = () => {
    const playoffMatches = getPlayoffMatches();
    if (playoffMatches.length === 0) {
      showWarning('No bracket matches available to download. Please generate the schedule first.');
      return;
    }
    const ev = events.find(e => e.id.toString() === selectedEvent);
    const resolvedMatches = playoffMatches.map(m => {
      const v = venues.find(ven => ven.id === m.venueId);
      const c = v?.courts?.find(crt => crt.id === m.courtId);
      return {
        ...m,
        venueName: v?.name || '',
        courtName: c?.name || '',
      };
    });
    exportBracketToPDF(
      resolvedMatches,
      `${ev?.name || 'Tournament'} Knockout Draw`,
      'Mana Community Sports',
      ev?.sportName || 'Tournament'
    );
  };

  const handleEditFromTable = (row: FixtureTableRow) => {
    if (row.isPlayoff) {
      handleOpenEditPlayoffMatch(row.rawMatch);
    } else if (row.groupIndex !== undefined && row.matchIndex !== undefined) {
      handleOpenEditMatch(row.groupIndex, row.matchIndex, row.rawMatch);
    }
  };

  const handleExportSchedule = (formatType: 'csv' | 'pdf') => {
    if (formatType === 'csv') {
      handleExportCSV();
    } else {
      handleExportPDF();
    }
  };

  // Reusable styles
  const inputCls = 'w-full bg-[#fafbff] border border-[rgba(99,102,241,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all duration-200';
  const labelCls = 'block text-xs font-bold text-[#6b7094] uppercase tracking-wider mb-1.5';
  const cardCls = 'bg-white border border-[rgba(99,102,241,0.12)] rounded-2xl p-5 shadow-[rgba(99,102,241,0.06)_0px_2px_12px]';

  return (
    <div className="space-y-5">
      {/* Warning if players not confirmed */}
      {!allPlayersConfirmed && (
        <div className="bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.12)] rounded-xl p-4 md:p-6 shadow-md">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-lg px-4 py-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">This is a sample schedule and will not be saved. Please finalize participants to save your tournament schedule.</span>
          </div>
        </div>
      )}

      {/* Configuration Form — Hidden when schedule is generated */}
      {!scheduleGenerated && (
      <>
        {/* Event Selection & Filters */}
        <div className={cardCls}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[rgba(99,102,241,0.1)] gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#4f46e5]" />
              <h3 className="text-sm font-bold text-[#0d0d2b]">Tournament & Event Selection</h3>
              <span className="text-xs text-[#6b7094] hidden md:inline">
                Filter by tournament, sport, age, gender, or participant format to narrow down sports events
              </span>
            </div>
            {(selectedTournamentFilter || selectedSportFilter || selectedAgeFilter || selectedGenderFilter || selectedFormatFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Tournament Filter */}
            <div>
              <label className={labelCls}>
                Tournament
                {selectedTournamentFilter && <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">• Active</span>}
              </label>
              <select
                value={selectedTournamentFilter}
                onChange={e => handleTournamentFilterChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All Tournaments ({tournaments.length})</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id.toString()}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Type Filter */}
            <div>
              <label className={labelCls}>
                Sport Type
                {selectedSportFilter && <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">• Active</span>}
              </label>
              <select
                value={selectedSportFilter}
                onChange={e => handleSportFilterChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All Sports ({availableSports.length})</option>
                {availableSports.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Category Filter */}
            <div>
              <label className={labelCls}>
                Age Category
                {selectedAgeFilter && <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">• Active</span>}
              </label>
              <select
                value={selectedAgeFilter}
                onChange={e => handleAgeFilterChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All Ages ({availableAges.length})</option>
                {availableAges.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className={labelCls}>
                Gender
                {selectedGenderFilter && <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">• Active</span>}
              </label>
              <select
                value={selectedGenderFilter}
                onChange={e => handleGenderFilterChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All Genders ({availableGenders.length})</option>
                {availableGenders.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Participant Format Filter */}
            <div>
              <label className={labelCls}>
                Participant Format
                {selectedFormatFilter && <span className="ml-1.5 text-[10px] text-indigo-600 font-semibold">• Active</span>}
              </label>
              <select
                value={selectedFormatFilter}
                onChange={e => handleFormatFilterChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All Formats ({availableFormats.length})</option>
                {availableFormats.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Sports Event Selection */}
            <div>
              <label className={labelCls}>
                Sports Event <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedEvent}
                onChange={e => handleEventChange(e.target.value)}
                className={`${inputCls} font-medium ${selectedEvent ? 'border-[#4f46e5]/40 bg-indigo-50/20' : ''}`}
              >
                <option value="">— Select Event ({filteredEvents.length}) —</option>
                {filteredEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    {getEventOptionLabel(e)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredEvents.length === 0 && events.length > 0 && (
            <p className="mt-2.5 text-xs text-amber-600">
              No events match the selected filters. Click &quot;Reset Filters&quot; to show all {events.length} events.
            </p>
          )}

          {/* Active Event Details Summary Card */}
          {selectedEvent && (() => {
            const ev = events.find(e => e.id.toString() === selectedEvent);
            if (!ev) return null;
            return (
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600">
                <span className="font-bold text-slate-700">Selected Event Details:</span>
                {ev.tournamentName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                    <Trophy className="w-3 h-3 text-indigo-500" />
                    Tournament: {ev.tournamentName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  Sport: {ev.sportName}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                  Gender: {formatGender(ev.gender)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                  Age: {formatAgeCategory(ev)}
                </span>
                {formatParticipantFormat(ev) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                    Format: {formatParticipantFormat(ev)}
                  </span>
                )}
                {(ev.eventDateStart || ev.eventDateEnd) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-100">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    {ev.eventDateStart} {ev.eventDateEnd && ev.eventDateEnd !== ev.eventDateStart ? `to ${ev.eventDateEnd}` : ''}
                  </span>
                )}
              </div>
            );
          })()}

          {existingConfig && (
            <div className="mt-3 flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">
                A tournament configuration already exists for this event
                {existingConfig.tournamentName ? <> — <span className="font-semibold">{existingConfig.tournamentName}</span></> : null}
                {` (${existingConfig.tournamentType}, ${existingConfig.totalTeams} teams, status: ${existingConfig.status}).`}
                {' '}Schedule generation is disabled. Open the existing schedule to view or edit it.
              </span>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ LEFT: Schedule Configuration ═══ */}
        <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-2xl overflow-hidden shadow-[rgba(99,102,241,0.06)_0px_2px_12px] flex flex-col">
          <div className="px-5 py-3.5 flex items-center gap-2 border-b bg-[rgba(99,102,241,0.04)] border-[rgba(99,102,241,0.1)]">
            <Settings className="w-4 h-4 text-[#4f46e5]" />
            <h3 className="text-sm font-semibold text-[#0d0d2b]">Schedule Configuration</h3>
          </div>

          <div className="p-5 space-y-4 flex-1">
            {/* Format */}
            <div>
              <label className={labelCls}>
                Format <span className="text-red-400">*</span>
                {selectedEvent && <span className="ml-2 normal-case tracking-normal font-normal text-[#4f46e5]/60">· from sports_event</span>}
              </label>
              <select
                value={format}
                onChange={e => handleFormatChange(e.target.value)}
                disabled={!!selectedEvent}
                className={`${inputCls} ${selectedEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Schedule Type</option>
                <option value="KNOCKOUT_SINGLE">Knockout (Single Elimination)</option>
                <option value="KNOCKOUT">Knockout</option>
                <option value="KNOCKOUT_DOUBLE">Double Elimination</option>
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="LEAGUE">League</option>
                <option value="GROUP_PLAYOFF">Group Stage + Playoffs</option>
                <option value="GROUP_KNOCKOUT">Group + Knockout</option>
                <option value="CUSTOM">Custom Bracket</option>
              </select>
              {isGroupKnockout && (
                <p className="text-[11px] text-[#4f46e5]/80 mt-1.5">
                  Group + Knockout: use Schedule Groups, then Generate Schedule for the knockout bracket.
                </p>
              )}
              {isKnockoutOnly && (
                <p className="text-[11px] text-[#6b7094] mt-1.5">
                  Knockout only: click Generate Schedule to build the elimination bracket (no group stage).
                </p>
              )}
              {isRoundRobin && (
                <p className="text-[11px] text-[#4f46e5]/80 mt-1.5">
                  Round Robin / League: click Generate Schedule to build all match fixtures between participants.
                </p>
              )}
            </div>

            {/* Participants */}
            <div>
              <label className={labelCls}>
                Number of Participants <span className="text-red-400">*</span>
                {selectedEvent && <span className="ml-2 normal-case tracking-normal font-normal text-[#4f46e5]/60">· from sports_event_registration</span>}
              </label>
              <input
                type="number"
                min="2"
                max="128"
                value={participants}
                readOnly={!!selectedEvent}
                onChange={e => !selectedEvent && setParticipants(e.target.value)}
                className={`${inputCls} ${selectedEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="Number of Participants"
              />
            </div>

            {/* Custom Participant Names / Paste Roster (Inspired by Playinga) */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none"
                  onClick={() => setUseCustomNames(!useCustomNames)}
                >
                  <Users className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span>Enter participant names / Paste custom roster</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomNames(!useCustomNames)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none ${useCustomNames ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useCustomNames ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {useCustomNames && (
                <div className="flex flex-col gap-1.5 mt-1 animate-fade-in-up">
                  <p className="text-[11px] text-slate-500">
                    Paste one competitor or team name per line (from WhatsApp, Excel, or notes). Names will be placed into the generated draw.
                  </p>
                  <textarea
                    rows={4}
                    value={customParticipantNames}
                    onChange={e => {
                      setCustomParticipantNames(e.target.value);
                      const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                      if (lines.length >= 2 && !selectedEvent) {
                        setParticipants(String(lines.length));
                      }
                    }}
                    placeholder={"Team Red\nTeam Blue\nTeam Green\nTeam Yellow\nTeam White\nTeam Black"}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono focus:border-[#4f46e5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {customParticipantNames.split('\n').map(l => l.trim()).filter(Boolean).length} custom names parsed
                    </span>
                    {customParticipantNames && (
                      <button
                        type="button"
                        onClick={() => setCustomParticipantNames('')}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Number of Groups — only for Group + Knockout */}
            {isGroupKnockout && (
              <div>
                <label className={labelCls}>Number of Groups <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={numberOfGroups}
                  onChange={e => setNumberOfGroups(e.target.value)}
                  className={inputCls}
                  placeholder="Number of Groups"
                />
              </div>
            )}

            {/* Third Place Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Create third place match?</label>
              <button
                onClick={() => setThirdPlace(!thirdPlace)}
                className={`relative w-11 h-6 rounded-full transition-colors ${thirdPlace ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${thirdPlace ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Seeding Order */}
            <div className="text-center">
              <label className={labelCls}>Choose Your Schedule Sequence <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {SEEDING_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${seedingOrder === opt.value ? 'border-[#4f46e5]' : 'border-[rgba(99,102,241,0.12)]'}`}>
                      {seedingOrder === opt.value && <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />}
                    </div>
                    <input type="radio" name="seeding" value={opt.value} checked={seedingOrder === opt.value} onChange={() => setSeedingOrder(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Scoring Configuration ═══ */}
        <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-2xl overflow-hidden shadow-[rgba(99,102,241,0.06)_0px_2px_12px] flex flex-col">
          <div className="px-5 py-3.5 flex items-center gap-2 border-b bg-[rgba(99,102,241,0.04)] border-[rgba(99,102,241,0.1)]">
            <Trophy className="w-4 h-4 text-[#4f46e5]" />
            <h3 className="text-sm font-semibold text-[#0d0d2b]">Scoring Configuration</h3>
          </div>

          <div className="p-5 space-y-4 flex-1">
            {/* Standings Table */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Standings/Points Table</label>
              <button
                type="button"
                onClick={openStandingsModal}
                className="text-xs border border-[#4f46e5]/40 text-[#4f46e5] px-3 py-1.5 rounded-lg hover:bg-[#4f46e5]/10 transition-colors font-semibold flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> Configure Standings
              </button>
            </div>

            {/* Participant Scoring */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Participants Scoring</label>
              <button
                type="button"
                onClick={openParticipantsModal}
                className={`text-xs border px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 ${
                  participantsScoring.enabled
                    ? 'border-[#4f46e5] text-[#4f46e5] hover:bg-[#4f46e5]/10'
                    : 'border-[rgba(99,102,241,0.12)] text-[#6b7094] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                }`}
              >
                <Settings className="w-3 h-3" /> {participantsScoring.enabled ? 'Configure' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column: Date & Time + Venue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ LEFT: Date & Time Configuration ═══ */}
        <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-2xl overflow-hidden shadow-[rgba(99,102,241,0.06)_0px_2px_12px] flex flex-col">
          <div className="px-5 py-3.5 flex items-center justify-between border-b bg-[rgba(99,102,241,0.04)] border-[rgba(99,102,241,0.1)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4f46e5]" />
              <h3 className="text-sm font-semibold text-[#0d0d2b]">Date & Time Configuration</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7094]">Date Picker</span>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`relative w-9 h-5 rounded-full transition-colors ${showDatePicker ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showDatePicker ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 flex-1">
            {/* Start / End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Schedule Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Schedule End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Start / End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Matches Start Time <span className="text-red-400">*</span></label>
                <select value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Matches End Time <span className="text-red-400">*</span></label>
                <select value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Duration / Break */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Match Duration (min) <span className="text-red-400">*</span></label>
                <input type="number" min="1" value={matchDuration} onChange={e => setMatchDuration(e.target.value)} className={inputCls} placeholder="30" />
              </div>
              <div>
                <label className={labelCls}>Break Between Matches <span className="text-red-400">*</span></label>
                <select value={breakTime} onChange={e => setBreakTime(e.target.value)} className={inputCls}>
                  {BREAK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Limit Matches Per Day */}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={limitMatchesPerDay} onChange={e => setLimitMatchesPerDay(e.target.checked)} className="w-4 h-4 accent-[#4f46e5] rounded" id="limitPerDay" />
              <label htmlFor="limitPerDay" className="text-sm text-slate-700 cursor-pointer">Limit Participant Matches Per Day</label>
              {limitMatchesPerDay && (
                <input type="number" min="1" max="10" value={maxMatchesPerDay} onChange={e => setMaxMatchesPerDay(e.target.value)} className="w-16 bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-2 py-1 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]" />
              )}
            </div>

            {/* Match Days */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <label className={labelCls + ' !mb-0'}>{isGroupKnockout ? 'Group Stage Days' : 'Match Days'}</label>
                <div className="flex gap-1 sm:ml-auto">
                  {([
                    { label: 'Weekends', days: [0, 6] },
                    { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
                    { label: 'All', days: [0, 1, 2, 3, 4, 5, 6] },
                  ] as const).map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setMatchDays([...preset.days])}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#f0f0ff] text-[#4f46e5] hover:bg-[#e0e0ff] transition-colors cursor-pointer font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#6b7094] mb-2">
                {isGroupKnockout ? 'Days for group stage matches (e.g. weekends only).' : 'Select which days of the week matches can be scheduled.'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day, idx) => {
                  const isSelected = matchDays.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setMatchDays(prev =>
                          isSelected
                            ? prev.filter(d => d !== idx)
                            : [...prev, idx].sort()
                        );
                      }}
                      className={`min-w-[2.25rem] h-8 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#4f46e5] text-white shadow-md'
                          : 'bg-white border border-[rgba(99,102,241,0.12)] text-[#6b7094] hover:border-[#4f46e5]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {matchDays.length === 0 && (
                <p className="text-[10px] text-red-400 mt-1">Select at least one day</p>
              )}
            </div>

            {/* Playoff / Knockout Days — shown when format has a knockout stage */}
            {(isGroupKnockout || isKnockoutOnly) && (
              <div className="border-t border-[rgba(99,102,241,0.08)] pt-3">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={usePlayoffDays}
                    onChange={e => setUsePlayoffDays(e.target.checked)}
                    className="w-4 h-4 accent-[#4f46e5] rounded"
                    id="usePlayoffDays"
                  />
                  <label htmlFor="usePlayoffDays" className="text-sm text-slate-700 cursor-pointer font-medium">
                    {isKnockoutOnly ? 'Custom Knockout Days' : 'Different Days for Playoffs'}
                  </label>
                </div>

                {usePlayoffDays && (
                  <div className="ml-3 sm:ml-7 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">
                          {isKnockoutOnly ? 'Knockout Days' : 'Playoff Days'}
                        </span>
                        <div className="flex gap-1 sm:ml-auto">
                          {([
                            { label: 'Weekends', days: [0, 6] },
                            { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
                            { label: 'All', days: [0, 1, 2, 3, 4, 5, 6] },
                          ] as const).map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setPlayoffDays([...preset.days])}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#f0f0ff] text-[#4f46e5] hover:bg-[#e0e0ff] transition-colors cursor-pointer font-medium"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day, idx) => {
                          const isSelected = playoffDays.includes(idx);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setPlayoffDays(prev =>
                                  isSelected
                                    ? prev.filter(d => d !== idx)
                                    : [...prev, idx].sort()
                                );
                              }}
                              className={`min-w-[2.25rem] h-8 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#f59e0b] text-white shadow-md'
                                  : 'bg-white border border-[rgba(99,102,241,0.12)] text-[#6b7094] hover:border-[#f59e0b]'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specific round dates */}
                    <div>
                      <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">
                        Pin Round to Specific Date <span className="normal-case font-normal">(optional)</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                        {([
                          { round: 'QUARTER_FINAL', label: 'Quarter-Finals' },
                          { round: 'SEMI_FINAL', label: 'Semi-Finals' },
                          { round: 'FINAL', label: 'Final' },
                          { round: 'THIRD_PLACE', label: '3rd Place' },
                        ] as const).map(r => (
                          <div key={r.round} className="flex items-center gap-2">
                            <span className="text-[11px] text-[#6b7094] w-20 sm:w-24 shrink-0">{r.label}</span>
                            <input
                              type="date"
                              value={playoffRoundDates[r.round] || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setPlayoffRoundDates(prev => {
                                  if (!val) {
                                    const next = { ...prev };
                                    delete next[r.round];
                                    return next;
                                  }
                                  return { ...prev, [r.round]: val };
                                });
                              }}
                              className="flex-1 min-w-0 bg-[#fafbff] border border-[rgba(99,102,241,0.15)] rounded-lg px-2 py-1 text-[11px] text-[#0d0d2b] focus:outline-none focus:border-[#6366f1]"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-[#6b7094] mt-1">Set a fixed date for any round. Leave blank to use day-of-week rules above.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Venue Configuration ═══ */}
        <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-2xl overflow-hidden shadow-[rgba(99,102,241,0.06)_0px_2px_12px] flex flex-col">
          <div className="px-5 py-3.5 flex items-center justify-between border-b bg-[rgba(99,102,241,0.04)] border-[rgba(99,102,241,0.1)]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4f46e5]" />
              <h3 className="text-sm font-semibold text-[#0d0d2b]">Venue Configuration <span className="text-red-400">*</span></h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setVenueToEdit(null);
                setAddEditVenueModalOpen(true);
              }}
              className="text-xs border border-[#4f46e5]/40 text-[#4f46e5] px-3 py-1.5 rounded-lg hover:bg-[#4f46e5]/10 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add/Edit Venue
            </button>
          </div>

          <div className="p-5 space-y-4 flex-1">

          {selectedVenues.length === 0 && (
            <div className="flex items-center gap-2 mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Select at least one venue — required to generate the schedule.</span>
            </div>
          )}

          {/* Venue List */}
          <div className="space-y-2 mb-4 max-h-[260px] overflow-y-auto pr-1">
            {venues.length === 0 ? (
              <div className="text-center py-6 text-[#6b7094] text-sm border border-dashed border-[rgba(99,102,241,0.12)] rounded-lg space-y-2">
                <p className="m-0">No venues found.</p>
                <button
                  type="button"
                  onClick={() => {
                    setVenueToEdit(null);
                    setAddEditVenueModalOpen(true);
                  }}
                  className="text-xs bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Venue Now
                </button>
              </div>
            ) : venues.map(v => (
              <div key={v.id} className="border border-[rgba(99,102,241,0.12)] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-white/50 cursor-pointer" onClick={() => setExpandedVenue(expandedVenue === v.id ? null : v.id)}>
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${selectedVenues.includes(v.id) ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[rgba(99,102,241,0.12)]'}`}
                    onClick={e => { e.stopPropagation(); toggleVenue(v.id); }}
                  >
                    {selectedVenues.includes(v.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm font-semibold text-[#0d0d2b] flex-1">{v.name}</span>
                  <span className="text-[#6b7094] hover:text-slate-700">
                    {expandedVenue === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
                {expandedVenue === v.id && (
                  <div className="px-4 py-3 bg-white/30 border-t border-[rgba(99,102,241,0.12)] text-xs space-y-2">
                    {/* Court — selectable (single or multiple) */}
                    <div className="flex gap-2">
                      <span className="text-[#6b7094] w-20 shrink-0 pt-0.5">Court</span>
                      <div className="text-slate-700 flex-1">
                        {v.courts && v.courts.length > 0 ? (
                          <>
                            <div className="inline-flex flex-wrap gap-1.5 align-middle">
                              {v.courts.map((c, ci) => {
                                const isSel = (selectedCourts[v.id] || []).includes(c.name);
                                return (
                                  <button
                                    key={c.id ?? ci}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleCourt(v.id, c.name); }}
                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${isSel ? 'bg-[#4f46e5]/20 border-[#4f46e5] text-[#4f46e5]' : 'bg-[rgba(99,102,241,0.02)] border-[#2a437e]/50 text-slate-700 hover:border-slate-500'}`}
                                  >
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color || '#4f46e5' }} />
                                    {c.name}
                                    {isSel && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-[#6b7094] mt-1">
                              {(selectedCourts[v.id]?.length || 0) > 0
                                ? `${selectedCourts[v.id].length} court${selectedCourts[v.id].length > 1 ? 's' : ''} selected`
                                : 'Tap a court to select (single or multiple)'}
                            </div>
                          </>
                        ) : <span className="text-[#6b7094] italic">No courts</span>}
                      </div>
                    </div>
                    {/* Open Time */}
                    <div className="flex gap-2">
                      <span className="text-[#6b7094] w-20 shrink-0">Open Time</span>
                      <span className="text-slate-700">: {v.openingTime || <span className="text-[#6b7094] italic">—</span>}</span>
                    </div>
                    {/* Close Time */}
                    <div className="flex gap-2">
                      <span className="text-[#6b7094] w-20 shrink-0">Close Time</span>
                      <span className="text-slate-700">: {v.closingTime || <span className="text-[#6b7094] italic">—</span>}</span>
                    </div>
                    {/* Address */}
                    <div className="flex gap-2">
                      <span className="text-[#6b7094] w-20 shrink-0">Address</span>
                      <span className="text-slate-700 flex-1">: {v.address || <span className="text-[#6b7094] italic">—</span>}</span>
                    </div>
                    {v.mapLink && <a href={v.mapLink} target="_blank" rel="noreferrer" className="text-[#00e5ff] hover:underline inline-flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> View on Map</a>}
                    
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTimingVenue(v);
                          setTimingModalOpen(true);
                        }}
                        className="text-[11px] border border-[rgba(99,102,241,0.12)] text-[#6b7094] px-2 py-1 rounded hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors flex items-center gap-1 bg-transparent cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> {canEditTiming ? "Edit Venue Timing" : "View Venue Timing"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVenueToEdit(v);
                          setAddEditVenueModalOpen(true);
                        }}
                        className="text-[11px] border border-[rgba(99,102,241,0.12)] text-[#6b7094] px-2 py-1 rounded hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors flex items-center gap-1 bg-transparent cursor-pointer"
                      >
                        <Settings className="w-3 h-3" /> Edit Venue Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Venue/Court Assign Type */}
          <div className="text-center">
            <label className={labelCls}>Venue/Court Assign Type <span className="text-red-400">*</span></label>
            <div className="flex justify-center gap-1 mt-2">
              {VENUE_ASSIGN_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setVenueAssignType(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${venueAssignType === opt ? 'bg-[#4f46e5] text-white shadow-md' : 'bg-white border border-[rgba(99,102,241,0.12)] text-[#6b7094] hover:border-slate-500'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Generate — Group+Knockout: Schedule Groups first; Knockout-only / others: Generate Schedule */}
      {!scheduleGenerated && format && (
        <div className="text-center pt-2 pb-4">
          <button
            onClick={isGroupKnockout ? handleScheduleGroups : handleGenerate}
            disabled={generating || !!existingConfig || selectedVenues.length === 0 || venuesNeedingCourt().length > 0 || (isGroupKnockout && Number(numberOfGroups) < 2)}
            className="inline-flex items-center justify-center gap-2 mx-auto px-8 py-3.5 rounded-2xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_32px_rgba(99,102,241,0.5)] cursor-pointer text-sm"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            <Zap className="h-4 w-4 shrink-0" />
            {generating
              ? (isGroupKnockout ? 'Scheduling Groups...' : 'Generating...')
              : (isGroupKnockout ? 'Schedule Groups' : 'Generate Schedule')}
          </button>
          {existingConfig && (
            <p className="text-xs text-emerald-700 mt-2 font-semibold">A tournament configuration already exists for this event — generation is disabled.</p>
          )}
          {isGroupKnockout && Number(numberOfGroups) < 2 && (
            <p className="text-xs text-amber-700 mt-2 font-semibold">Group + Knockout requires at least 2 groups.</p>
          )}
          {selectedVenues.length === 0 && (
            <p className="text-xs text-amber-700 mt-2 font-semibold">Select at least one venue in Venue Configuration to generate the schedule.</p>
          )}
          {selectedVenues.length > 0 && venuesNeedingCourt().length > 0 && (
            <p className="text-xs text-amber-700 mt-2 font-semibold">
              Select at least one court for: {venuesNeedingCourt().map(v => v.name).join(', ')}.
            </p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           GENERATED SCHEDULE VIEW
         ═══════════════════════════════════════════════════════════════ */}
      {scheduleGenerated && (
        <div className="space-y-5">

          {/* Summary Widget */}
          <div className="rounded-2xl p-5 bg-white border border-[rgba(99,102,241,0.12)] shadow-[rgba(99,102,241,0.06)_0px_2px_12px]"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.04))" }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-bold text-[#0d0d2b]">Schedule Generated!</p>
                <p className="text-xs text-[#6b7094] truncate">
                  {events.find(e => e.id.toString() === selectedEvent)?.name || 'Untitled Event'} · {format.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              </div>
              <div className="sm:ml-auto flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[rgba(99,102,241,0.12)] text-[#4f46e5] hover:bg-[#4f46e5]/10 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[200px] p-1.5 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); handleExportCSV(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <div>
                            <div className="font-semibold">Download CSV</div>
                            <div className="text-[10px] text-slate-400">Excel UTF-8 compatible</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); handleExportExcel(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                          <div>
                            <div className="font-semibold">Download Excel (.xls)</div>
                            <div className="text-[10px] text-slate-400">Formatted spreadsheet</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); handleExportPDF(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-semibold">Print Match Schedule</div>
                            <div className="text-[10px] text-slate-400">Official tournament PDF</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); handleExportScorecards(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium"
                        >
                          <FileText className="h-4 w-4 text-amber-600" />
                          <div>
                            <div className="font-semibold">Umpire Score Sheets</div>
                            <div className="text-[10px] text-slate-400">Printable match cards</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Matches", value: String(getTotalMatchesCount()), icon: Trophy },
                { label: "Rounds", value: String(getRoundsCount()), icon: Settings },
                { label: "Teams", value: String(participants), icon: Users },
                { label: "Venues", value: String(selectedVenues.length), icon: MapPin },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center bg-white border border-[rgba(99,102,241,0.12)] shadow-sm">
                  <s.icon className="h-4 w-4 mx-auto mb-1 text-[#4f46e5]" />
                  <p className="font-bold text-[#0d0d2b] text-base">{s.value}</p>
                  <p className="text-xs text-[#6b7094]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hide Setup Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setScheduleGenerated(false);
              }}
              className="px-4 py-1.5 border border-[#4f46e5]/40 text-[#4f46e5] text-xs font-semibold rounded-full hover:bg-[#4f46e5]/10 transition-colors inline-flex items-center gap-1"
            >
              Show Setup
            </button>
          </div>

          {/* Sample Schedule Container — Show only when event and format are selected */}
          {selectedEvent && format && !playoffsGenerated && (
          <div className="border border-dashed border-[#4f46e5]/40 rounded-xl bg-white/30 px-3 py-4 pb-4 relative">

            {/* Group Cards Container — Group Stage or Round Robin */}
            {(isGroupKnockout || isRoundRobin) && (
            <div className="flex flex-col mt-4 gap-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {generatedGroups.map((group, gIdx) => (
                  <div key={group.name} className="bg-[rgba(99,102,241,0.02)] border border-[#2a437e]/60 rounded-xl overflow-hidden w-[18rem] shadow-lg flex flex-col">
                    <div className="bg-[#4f46e5] text-slate-950 text-center py-2 text-xs font-black tracking-wider uppercase">
                      {group.name}
                    </div>
                    <div className="p-3">
                      <table className="table-auto text-center border-collapse w-full">
                        <tbody>
                          {/* Participant List */}
                          <tr>
                            <td>
                              <div className="flex flex-col gap-2.5 mb-3">
                                {group.participants.map((p, pIdx) => (
                                  <div key={p.id + pIdx} className="flex items-center w-full gap-2">
                                    <GripVertical className="w-4 h-4 text-[#6b7094] shrink-0 cursor-move" />
                                    <select
                                      value={p.id}
                                      onChange={e => updateParticipantInGroup(gIdx, pIdx, e.target.value)}
                                      className="flex-1 bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] transition-colors"
                                    >
                                      {allParticipantOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}{opt.flatNumber ? ` (${opt.flatNumber})` : ''}</option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>

                          {/* Group Configuration */}
                          <tr>
                            <td className="text-left">
                              <div className="flex flex-col gap-3 border border-[#2a437e]/40 rounded-lg p-3 bg-white/30">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-[#6b7094]">Number of Rounds</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={group.rounds}
                                    onChange={e => updateGroupConfig(gIdx, 'rounds', e.target.value)}
                                    placeholder="Number of Rounds"
                                    className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] transition-colors"
                                  />
                                </div>
                                {isGroupKnockout && (
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-[#6b7094]">Number of Proceeders</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={group.proceeders}
                                      onChange={e => updateGroupConfig(gIdx, 'proceeders', e.target.value)}
                                      className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] transition-colors"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        showInfo(`Select Proceeders modal opened for ${group.name}!`);
                                      }}
                                      className="mt-2 w-full py-1.5 border border-[#4f46e5]/40 text-[#4f46e5] text-xs font-semibold rounded-lg hover:bg-[#4f46e5]/10 transition-colors cursor-pointer text-center"
                                    >
                                      Select Proceeders
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-col gap-1 mt-4">
                                  <div className="flex gap-2 items-center justify-between">
                                    <label className="text-xs font-medium text-[#6b7094]">Limit Per Participant Matches?</label>
                                    <button
                                      type="button"
                                      onClick={() => updateGroupConfig(gIdx, 'limitMatches', !group.limitMatches)}
                                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${group.limitMatches ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                                    >
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${group.limitMatches ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                    </button>
                                  </div>
                                  {group.limitMatches && (
                                    <input
                                      type="number"
                                      min="1"
                                      value={group.maxMatches}
                                      onChange={e => updateGroupConfig(gIdx, 'maxMatches', e.target.value)}
                                      className="w-full mt-1 bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] transition-colors"
                                      placeholder="Max matches per participant"
                                    />
                                  )}
                                </div>
                                {gIdx === 0 && generatedGroups.length > 1 && (
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[rgba(99,102,241,0.12)]">
                                    <label className="text-xs font-medium text-[#6b7094]">Apply Changes To All Groups</label>
                                    <button
                                      type="button"
                                      onClick={() => applyToAllGroups(0)}
                                      className="px-3 py-1 border border-[#4f46e5]/40 text-[#4f46e5] text-xs font-semibold rounded-lg hover:bg-[#4f46e5]/10 transition-colors"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Playoffs Configuration - Third Place & Seeding Sequence */}
              {isGroupKnockout && (
              <div className="flex flex-col gap-4 mt-4 items-center">
                  {/* Create Third Place Match Toggle */}
                  <div className="flex gap-4 items-center">
                    <label htmlFor="createPlayoffThirdPlace" className="text-sm text-slate-700">Create third place match ?</label>
                    <button
                      type="button"
                      id="createPlayoffThirdPlace"
                      onClick={() => setPlayoffThirdPlace(!playoffThirdPlace)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${playoffThirdPlace ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${playoffThirdPlace ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Choose Playoffs Schedule Sequence */}
                  <div className="flex flex-col gap-4 items-center justify-center">
                    <label className="text-sm text-slate-700">
                      <span>Choose Playoffs Schedule Sequence</span>
                      <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                      {SEEDING_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${playoffSeedingOrder === opt.value ? 'border-[#4f46e5]' : 'border-[rgba(99,102,241,0.12)]'}`}>
                            {playoffSeedingOrder === opt.value && <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />}
                          </div>
                          <input type="radio" name="playoffSeeding" value={opt.value} checked={playoffSeedingOrder === opt.value} onChange={() => setPlayoffSeedingOrder(opt.value)} className="sr-only" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Generate playoff schedule (Group + Knockout only) */}
              {isGroupKnockout && !playoffsGenerated && (
                <div className="flex flex-col mt-4 items-center gap-2">
                  <p className="text-xs text-[#6b7094] text-center max-w-md">
                    Group matches are scheduled. Set proceeders per group, then generate the knockout bracket.
                  </p>
                  <button
                    onClick={handleGeneratePlayoffs}
                    disabled={generating}
                    className="px-5 py-2 bg-[#4f46e5] hover:bg-[#7c3aed] text-white font-bold rounded-lg transition-all text-xs tracking-wider disabled:opacity-50 shadow-md shadow-[#4f46e5]/10 cursor-pointer"
                  >
                    {generating ? 'Generating...' : 'Generate Schedule'}
                  </button>
                </div>
              )}
            </div>
            )}

          </div>
          )}

          {/* Schedule View Mode Switcher (Visual Draw & Bracket vs Fixtures Table) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 p-3 bg-white rounded-xl border border-[rgba(99,102,241,0.12)] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Display View:</span>
              <div className="flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleViewMode('visual');
                    setPlayoffViewMode('bracket');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none ${
                    scheduleViewMode === 'visual'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <span>🌲 Visual Draw & Bracket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleViewMode('list');
                    setPlayoffViewMode('list');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none ${
                    scheduleViewMode === 'list'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <span>📄 List View</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                    {allFixturesTableRows.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none ${
                    scheduleViewMode === 'table'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <span>📋 Fixtures Table</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                    {allFixturesTableRows.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Right side: Conflicts pill & Export & Print dropdown for all display views */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Conflict summary status pill */}
              {totalConflictsCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{totalConflictsCount} Schedule Conflicts</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>0 Conflicts (All clear)</span>
                </span>
              )}

              {/* Export & Print Dropdown Button for all Display Views */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDisplayExportMenu(!showDisplayExportMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export &amp; Print</span>
                  <ChevronDown className="w-3 h-3 text-indigo-500" />
                </button>

                {showDisplayExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDisplayExportMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[240px] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      {(scheduleViewMode === 'visual' || getPlayoffMatches().length > 0) && (
                        <>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-b border-indigo-100 bg-indigo-50/60 rounded-t-lg">
                            Visual Bracket Draw
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowDisplayExportMenu(false); handleExportBracketPDF(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-indigo-950 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer text-left font-semibold border-none"
                          >
                            <Trophy className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-900">Download Bracket Draw (PDF)</span>
                              <span className="text-[10px] text-indigo-600 font-normal">Landscape tournament tree draw</span>
                            </div>
                          </button>
                        </>
                      )}

                      {scheduleViewMode === 'list' && (
                        <>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-b border-indigo-100 bg-indigo-50/60 rounded-t-lg">
                            Colored List View
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowDisplayExportMenu(false); handleExportListViewPDF(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-indigo-950 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer text-left font-semibold border-none"
                          >
                            <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-900">Download List View (PDF)</span>
                              <span className="text-[10px] text-indigo-600 font-normal">Colored round-by-round tournament list</span>
                            </div>
                          </button>
                        </>
                      )}

                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Export Schedule
                      </div>

                      <button
                        type="button"
                        onClick={() => { setShowDisplayExportMenu(false); handleExportCSV(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium border-none bg-transparent"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Download CSV</span>
                          <span className="text-[10px] text-slate-400">Excel UTF-8 compatible</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setShowDisplayExportMenu(false); handleExportExcel(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium border-none bg-transparent"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Download Excel (.xls)</span>
                          <span className="text-[10px] text-slate-400">Formatted spreadsheet</span>
                        </div>
                      </button>

                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-t border-slate-100 mt-0.5">
                        Print &amp; PDF
                      </div>

                      <button
                        type="button"
                        onClick={() => { setShowDisplayExportMenu(false); handleExportPDF(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium border-none bg-transparent"
                      >
                        <Printer className="h-4 w-4 text-rose-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Print Schedule (PDF)</span>
                          <span className="text-[10px] text-slate-400">Vector printable fixtures sheet</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setShowDisplayExportMenu(false); handleExportScorecards(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer text-left font-medium border-none bg-transparent"
                      >
                        <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Print Umpire Score Sheets</span>
                          <span className="text-[10px] text-slate-400">Court scorecards &amp; signoff</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table View */}
          {scheduleViewMode === 'table' && (
            <div className="mt-4">
              <FixturesTableView
                fixtures={allFixturesTableRows}
                onEditMatch={handleEditFromTable}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                onExportScorecards={handleExportScorecards}
              />
            </div>
          )}

          {/* List View */}
          {scheduleViewMode === 'list' && (
            <div className="mt-4">
              <FixturesListView
                fixtures={allFixturesTableRows}
                onEditMatch={handleEditFromTable}
                sportName={events.find(e => e.id.toString() === selectedEvent)?.sportName || 'Tournament'}
              />
            </div>
          )}

          {/* Visual View (Group Fixtures & Playoff Bracket) */}
          {scheduleViewMode === 'visual' && (
            <>
              {/* Match fixtures — Group Stage or Round Robin */}
          {(isGroupKnockout || isRoundRobin) && (
          <div className="flex flex-col gap-6 mt-6">
            {generatedGroups.map((group, gIdx) => {
              const matches = getActiveGroupMatches(group, gIdx);
              if (matches.length === 0) return null;

              // Resolve event information
              const ev = events.find(e => e.id.toString() === selectedEvent);
              const sportName = ev?.sportName || 'Table Tennis';

              // Using component-level getSportIcon

              return (
                <div key={'fixtures-' + group.name} className="flex flex-col gap-3">
                  <div className="flex justify-between gap-3">
                    <div className="flex text-left">
                      <h3 className="text-lg font-bold text-[#0d0d2b]">{group.name}</h3>
                    </div>
                    <div className="flex gap-2 justify-end"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.map((match, mIdx) => {
                      const matchDate = parseLocalDate(match.date);

                      return (
                        <div key={mIdx} className={`bg-white border border-[rgba(99,102,241,0.12)] rounded-xl overflow-hidden relative pt-1 shadow-md hover:border-[#4f46e5]/40 transition-colors animate-fade-in-up stagger-${(mIdx % 8) + 1}`}>
                          {/* Top Status Bar (green line) */}
                          <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-500" />

                          {/* Top Tag Overlapping */}
                          <div className="flex justify-center -mt-3.5 mb-2 relative z-10">
                            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                              <img height="14" width="14" className="rounded-none shrink-0" alt={sportName} title={sportName} src={getSportIcon(sportName)} />
                              <span className="px-1">{isRoundRobin ? `Match ${mIdx + 1}` : `G${gIdx + 1} Match ${mIdx + 1}`}</span>
                            </div>
                          </div>

                          {/* Date & Time Header */}
                          <div className="flex flex-col gap-1 px-3.5 py-2 text-xs text-[#6b7094] border-b border-[rgba(99,102,241,0.12)]/40 bg-white/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <i className="pi pi-calendar text-[#4f46e5] text-sm"></i>
                                <span className="font-bold text-[#0d0d2b]">{formatDate(matchDate)}</span>
                                <div className="w-px h-3 bg-[#2a3a5c] mx-1" />
                                <span>{getDayOfWeek(matchDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <i className="pi pi-clock text-[#4f46e5]"></i>
                                <span className="font-bold text-[#0d0d2b]">{match.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#6b7094]/80">
                              <i className="pi pi-map-marker text-[#4f46e5]"></i>
                              <span>{venues.find(v => v.id === match.venueId)?.name || 'TBD'}</span>
                              <span className="text-[#4f46e5] font-semibold"> - {venues.find(v => v.id === match.venueId)?.courts?.find(c => c.id === match.courtId)?.name || 'TBD'}</span>
                            </div>
                          </div>

                          {/* Players VS Content */}
                          <div className="p-3.5 flex flex-col justify-between h-[calc(100%-6.5rem)]">
                            {/* Desktop Players VS Content (horizontal layout) */}
                            <div className="hidden sm:flex items-center justify-between bg-white/40 rounded-lg p-2.5 border border-[rgba(99,102,241,0.12)]/40">
                              {/* Home Team */}
                              <div className="flex items-center gap-2.5 w-[42%]">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.home.name}>{match.home.name}</span>
                                  {match.home.flatNumber && <span className="text-[10px] text-[#6b7094] truncate">{match.home.flatNumber}</span>}
                                </div>
                              </div>

                              {/* VS Badge */}
                              <div className="flex justify-center w-[16%]">
                                <span className="text-[10px] bg-[#4f46e5]/10 text-[#4f46e5] px-2 py-0.5 rounded font-bold border border-[#4f46e5]/20">VS</span>
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center justify-end gap-2.5 w-[42%]">
                                <div className="flex flex-col items-end truncate">
                                  <span className="text-xs font-bold text-[#0d0d2b] truncate text-right" title={match.away.name}>{match.away.name}</span>
                                  {match.away.flatNumber && <span className="text-[10px] text-[#6b7094] truncate text-right">{match.away.flatNumber}</span>}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            </div>

                            {/* Mobile Players VS Content (vertical stacking layout) */}
                            <div className="flex sm:hidden flex-col gap-2 p-2.5 bg-white/40 rounded-lg border border-[rgba(99,102,241,0.12)]/40">
                              {/* Home Team Row */}
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.home.name}>{match.home.name}</span>
                                  {match.home.flatNumber && <span className="text-[9px] text-[#6b7094]">{match.home.flatNumber}</span>}
                                </div>
                              </div>

                              {/* VS Row Divider */}
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-[#2a3a5c]/40" />
                                <span className="text-[9px] bg-[#4f46e5]/10 text-[#4f46e5] px-1.5 py-0.2 rounded font-bold border border-[#4f46e5]/20">VS</span>
                                <div className="h-px flex-1 bg-[#2a3a5c]/40" />
                              </div>

                              {/* Away Team Row */}
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                  <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.away.name}>{match.away.name}</span>
                                  {match.away.flatNumber && <span className="text-[9px] text-[#6b7094]">{match.away.flatNumber}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[rgba(99,102,241,0.12)]/30">
                              <div className="text-[11px] text-[#6b7094] flex items-center gap-1.5 flex-wrap">
                                <span>Status: <span className="text-emerald-700 font-semibold">Scheduled</span></span>
                                {scheduleConflicts[`${gIdx}-${mIdx}`]?.length > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                    title={scheduleConflicts[`${gIdx}-${mIdx}`].join('\n')}
                                  >
                                    ⚠️ Conflict
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMatch(gIdx, mIdx, match)}
                                  className="px-2.5 py-1 border border-[#4f46e5]/40 text-[#4f46e5] text-xs font-semibold rounded-lg hover:bg-[#4f46e5]/10 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => showWarning('This is a sample schedule. Finalize participants to schedule matches.')}
                                  className="px-2.5 py-1 border border-[rgba(99,102,241,0.12)] text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Settings className="w-3 h-3" /> Actions
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Knockout bracket — after Generate Schedule (group+KO step 2) or Knockout-only */}
          {showKnockoutBracket && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex gap-2 justify-between items-center border-b border-[rgba(99,102,241,0.12)] pb-3">
                <div className="flex text-left items-center">
                  <p className="text-lg font-bold text-[#0d0d2b]">
                    {isKnockoutOnly ? 'Knockout Bracket' : 'Playoffs'}
                  </p>
                </div>
                <div className="flex items-center gap-4 justify-end">
                  <span className="text-xs font-semibold text-[#6b7094] hidden sm:inline">Match Schedule</span>
                  <div className="flex rounded-xl p-1 gap-1 bg-white border border-[rgba(99,102,241,0.12)] shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayoffViewMode('bracket');
                        setScheduleViewMode('visual');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none"
                      style={playoffViewMode === 'bracket'
                        ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" }
                        : { background: "transparent", color: "#6b7094" }}
                    >
                      Bracket
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayoffViewMode('list');
                        setScheduleViewMode('list');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none"
                      style={playoffViewMode === 'list'
                        ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" }
                        : { background: "transparent", color: "#6b7094" }}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
              {isGroupKnockout && (
                <p className="text-xs text-[#6b7094] flex items-center gap-1">
                  <i className="pi pi-info-circle text-amber-500"></i>
                  <span>
                    Knockout bracket requires 2 proceeders per group (2 groups → Semi-Final 1, Semi-Final 2, then Final).
                    Use Select Proceeders on each group after group matches, or set Number of Proceeders to 2 before Generate Schedule.
                  </span>
                </p>
              )}

              {playoffViewMode === 'bracket' ? (
                (() => {
                  const playoffMatches = getPlayoffMatches();
                  if (playoffMatches.length === 0) return null;
                  return (
                    <PlayoffBracketView
                      matches={playoffMatches}
                      onEditMatch={handleOpenEditPlayoffMatch}
                      onDownloadBracket={handleExportBracketPDF}
                      resolveVenueName={resolveVenueName}
                      resolveCourtName={resolveCourtName}
                    />
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPlayoffMatches().map((match, mIdx) => {
                    const matchDate = parseLocalDate(match.date);
                    const ev = events.find(e => e.id.toString() === selectedEvent);
                    const sportName = ev?.sportName || 'Table Tennis';
                    const roundNameFormatted = match.round.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

                    return (
                      <div key={mIdx} className="bg-white border border-[rgba(99,102,241,0.12)] rounded-xl overflow-hidden relative pt-1 shadow-md hover:border-[#4f46e5]/40 transition-colors animate-fade-in-up">
                        {/* Top Status Bar (indigo line) */}
                        <div className="w-full h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />

                        {/* Top Tag Overlapping */}
                        <div className="flex justify-center -mt-3.5 mb-2 relative z-10">
                          <div className="flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-full text-xs font-bold shadow-md">
                            <span className="px-1">{roundNameFormatted} · Match {match.id}</span>
                          </div>
                        </div>

                        {/* Date & Time Header */}
                        <div className="flex flex-col gap-1 px-3.5 py-2 text-xs text-[#6b7094] border-b border-[rgba(99,102,241,0.12)]/40 bg-white/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <i className="pi pi-calendar text-[#4f46e5] text-sm"></i>
                              <span className="font-bold text-[#0d0d2b]">{formatDate(matchDate)}</span>
                              <div className="w-px h-3 bg-[#2a3a5c] mx-1" />
                              <span>{getDayOfWeek(matchDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <i className="pi pi-clock text-[#4f46e5]"></i>
                              <span className="font-bold text-[#0d0d2b]">{match.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#6b7094]/80">
                            <i className="pi pi-map-marker text-[#4f46e5]"></i>
                            <span>{venues.find(v => v.id === match.venueId)?.name || 'TBD'}</span>
                            <span className="text-[#4f46e5] font-semibold"> - {venues.find(v => v.id === match.venueId)?.courts?.find(c => c.id === match.courtId)?.name || 'TBD'}</span>
                          </div>
                        </div>

                        {/* Players VS Content */}
                        <div className="p-3.5 flex flex-col justify-between h-[calc(100%-6.5rem)]">
                          {/* Desktop Players VS Content (horizontal layout) */}
                          <div className="hidden sm:flex items-center justify-between bg-white/40 rounded-lg p-2.5 border border-[rgba(99,102,241,0.12)]/40">
                            {/* Home Team */}
                            <div className="flex items-center gap-2.5 w-[42%]">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.home.name}>{match.home.name}</span>
                                {match.home.flatNumber && <span className="text-[10px] text-[#6b7094] truncate">{match.home.flatNumber}</span>}
                              </div>
                            </div>

                            {/* VS Pill */}
                            <div className="flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-[#4f46e5] text-white rounded-full">VS</span>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center justify-end gap-2.5 w-[42%] text-right">
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.away.name}>{match.away.name}</span>
                                {match.away.flatNumber && <span className="text-[10px] text-[#6b7094] truncate">{match.away.flatNumber}</span>}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          </div>

                          {/* Mobile Players VS Content (vertical layout) */}
                          <div className="flex sm:hidden flex-col gap-2 bg-white/40 rounded-lg p-2 border border-[rgba(99,102,241,0.12)]/40">
                            {/* Home Team Row */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.home.name}>{match.home.name}</span>
                                {match.home.flatNumber && <span className="text-[9px] text-[#6b7094]">{match.home.flatNumber}</span>}
                              </div>
                            </div>

                            {/* VS divider */}
                            <div className="flex items-center justify-center py-0.5 border-y border-[rgba(99,102,241,0.12)]/20 my-1">
                              <span className="text-[8px] font-bold text-[#6b7094]/70">VS</span>
                            </div>

                            {/* Away Team Row */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shrink-0">
                                <img src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media" alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-[#0d0d2b] truncate" title={match.away.name}>{match.away.name}</span>
                                {match.away.flatNumber && <span className="text-[9px] text-[#6b7094]">{match.away.flatNumber}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[rgba(99,102,241,0.12)]/30">
                            <div className="text-[11px] text-[#6b7094] flex items-center gap-1.5 flex-wrap">
                              <span>Status: <span className="text-emerald-700 font-semibold">Scheduled</span></span>
                              {scheduleConflicts[match.id]?.length > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                  title={scheduleConflicts[match.id].join('\n')}
                                >
                                  ⚠️ Conflict
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPlayoffMatch(match)}
                                className="px-2.5 py-1 border border-[#4f46e5]/40 text-[#4f46e5] text-xs font-semibold rounded-lg hover:bg-[#4f46e5]/10 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </>
          )}

          {showScheduleSaveFooter && (
            <ScheduleSaveFooter
              canSave={true}
              saving={savingSchedule}
              onClear={handleClearSchedule}
              onSaveDraft={handleSaveDraft}
              onSavePublish={handleSavePublish}
              onDragDropScheduler={handleDragDropScheduler}
            />
          )}
        </div>
      )}

      {showEditMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-xl w-full max-w-[40rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.12)] shrink-0">
              <h4 className="text-2xl font-bold text-[#0d0d2b]">
                <span className="pr-1.5 text-[#6b7094] font-normal">Edit</span>| {editMatchForm.name || 'Match'}
              </h4>
              <button
                type="button"
                onClick={() => setShowEditMatchModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-[#6b7094] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(99,102,241,0.15)]">
              <div className="flex flex-col gap-4">
                
                {/* Avatars VS Section */}
                <div className="flex flex-row justify-between items-center py-2">
                  <div className="flex justify-center w-[45%]">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"
                        alt="Participant 1 Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center text-center w-[10%]">
                    <div className="text-center font-bold text-xl text-[#4f46e5] tracking-wider drop-shadow-md">VS</div>
                  </div>
                  <div className="flex justify-center w-[45%]">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[rgba(99,102,241,0.12)] overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src="https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"
                        alt="Participant 2 Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Participant Dropdowns */}
                <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                  <div className="w-full">
                    <label className={labelCls}>Participant 1 <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.homeId}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, homeId: e.target.value }))}
                      className={inputCls}
                    >
                      {getEditParticipantOptions().map(p => (
                        <option key={p.id} value={p.id}>{p.name}{(p as any).flatNumber ? ` (${(p as any).flatNumber})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className={labelCls}>Participant 2 <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.awayId}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, awayId: e.target.value }))}
                      className={inputCls}
                    >
                      {getEditParticipantOptions().map(p => (
                        <option key={p.id} value={p.id}>{p.name}{(p as any).flatNumber ? ` (${(p as any).flatNumber})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Match Name & Date */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Match Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Match name"
                      value={editMatchForm.name}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={editMatchForm.date}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, date: e.target.value }))}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {/* Duration & Time */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Match Duration (In Minutes) <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Match duration"
                      value={editMatchForm.duration}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Time <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.time}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, time: e.target.value }))}
                      className={inputCls}
                      required
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Venue & Court */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Venue <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.venueId ?? ''}
                      onChange={e => {
                        const vid = e.target.value ? Number(e.target.value) : null;
                        const firstCourt = vid ? venues.find(v => v.id === vid)?.courts?.[0]?.id || null : null;
                        setEditMatchForm(prev => ({ ...prev, venueId: vid, courtId: firstCourt }));
                      }}
                      className={inputCls}
                      required
                    >
                      <option value="">— Select Venue —</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className={labelCls}>Court <span className="text-red-400">*</span></label>
                    <select
                      value={editMatchForm.courtId ?? ''}
                      onChange={e => setEditMatchForm(prev => ({ ...prev, courtId: e.target.value || null }))}
                      className={inputCls}
                      required
                    >
                      {(() => {
                        const selVenue = venues.find(v => v.id === editMatchForm.venueId);
                        return selVenue?.courts?.length ? (
                          selVenue.courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        ) : (
                          <option value="">No courts configured</option>
                        );
                      })()}
                    </select>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    id="moveSubsMatchesEdit"
                    checked={editMatchForm.moveSubsMatches}
                    onChange={e => setEditMatchForm(prev => ({ ...prev, moveSubsMatches: e.target.checked }))}
                    className="w-4 h-4 accent-[#4f46e5] rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="moveSubsMatchesEdit" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                    Delay/Advance subsequent matches on this court for the day.
                  </label>
                </div>

                {/* Court Timings Info Box */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-[#6b7094] uppercase tracking-wider">Court Timings</label>
                  <div className="border border-[rgba(99,102,241,0.12)] rounded-xl bg-white/30">
                    <div className="flex flex-col gap-3 p-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6b7094]">Open Time</span>
                          <span className="text-[#6b7094]">:</span>
                          <span className="font-bold text-[#0d0d2b]">05:00 AM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6b7094]">Close Time</span>
                          <span className="text-[#6b7094]">:</span>
                          <span className="font-bold text-[#0d0d2b]">08:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[rgba(99,102,241,0.12)] shrink-0 bg-white/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowEditMatchModal(false)}
                className="px-4 py-2 border border-[rgba(99,102,241,0.12)] hover:border-[#4f46e5] rounded-lg text-sm font-semibold text-slate-700 hover:text-[#4f46e5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMatchEdit}
                className="px-5 py-2 bg-[#4f46e5] hover:bg-[#7c3aed] text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#4f46e5]/10"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showStandingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-xl w-full max-w-[50rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.12)] shrink-0">
              <h3 className="text-xl font-bold text-[#0d0d2b]">Standings Configuration</h3>
              <button
                type="button"
                onClick={() => setShowStandingsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-[#6b7094] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(99,102,241,0.15)]">

              {/* Pts Win / Draw / Loss */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Pts Win <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalNormalWin}
                    onChange={e => setModalNormalWin(e.target.value)}
                    className={inputCls}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className={labelCls}>Pts Draw <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalTiePoints}
                    onChange={e => setModalTiePoints(e.target.value)}
                    className={inputCls}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className={labelCls}>Pts Loss <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={modalNormalLoss}
                    onChange={e => setModalNormalLoss(e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 1. Points System */}
              <div className="space-y-4">
                <h6 className="text-base font-bold text-[#4f46e5] border-b border-[rgba(99,102,241,0.12)]/50 pb-2">Points System</h6>
                
                {/* Allow variable point system toggle */}
                <div className="flex items-center justify-between bg-white/50 border border-[rgba(99,102,241,0.12)] rounded-lg p-4">
                  <div className="space-y-1 pr-4">
                    <label className="text-sm font-semibold text-[#0d0d2b]">Allow variable point system?</label>
                    <p className="text-xs text-[#6b7094] flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4f46e5]"></span>
                      Enable match scorer to assign variable points for different win types; if disabled, only normal victory points can be assigned.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAllowVariablePoints(!modalAllowVariablePoints)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalAllowVariablePoints ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalAllowVariablePoints ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Win Types Table */}
                <div className="overflow-x-auto border border-[rgba(99,102,241,0.12)] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-[rgba(99,102,241,0.12)] text-xs font-semibold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-4 py-3">Winning Type</th>
                        <th className="px-4 py-3 w-36">Win</th>
                        <th className="px-4 py-3 w-36">Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(99,102,241,0.12)] text-sm bg-white">
                      {/* Convincing Victory */}
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">Convincing Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalConvincingWin}
                            onChange={e => setModalConvincingWin(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalConvincingLoss}
                            onChange={e => setModalConvincingLoss(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                      {/* Normal Victory */}
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">Normal Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={modalNormalWin}
                            onChange={e => setModalNormalWin(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={modalNormalLoss}
                            onChange={e => setModalNormalLoss(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                      {/* Marginal Victory */}
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">Marginal Victory</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalMarginalWin}
                            onChange={e => setModalMarginalWin(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!modalAllowVariablePoints}
                            value={modalMarginalLoss}
                            onChange={e => setModalMarginalLoss(e.target.value)}
                            className="w-28 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder="Points"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Draw and Custom Points list */}
                <div className="overflow-x-auto border border-[rgba(99,102,241,0.12)] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-[rgba(99,102,241,0.12)] text-sm bg-white">
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3.5 text-slate-700 font-medium">Let user give custom points</td>
                        <td className="px-4 py-3.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setModalCustomPoints(!modalCustomPoints)}
                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalCustomPoints ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalCustomPoints ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          Tie/Drawn Points <span className="text-red-400">*</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={modalTiePoints}
                            onChange={e => setModalTiePoints(e.target.value)}
                            className="w-36 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="Tie Points"
                          />
                        </td>
                      </tr>
                      <tr className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          No-Result Points <span className="text-red-400">*</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={modalNoResultPoints}
                            onChange={e => setModalNoResultPoints(e.target.value)}
                            className="w-36 bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="No-Result Points"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Standings Display Settings */}
              <div className="space-y-3">
                <h6 className="text-base font-bold text-[#4f46e5] border-b border-[rgba(99,102,241,0.12)]/50 pb-2">Standings Display Settings</h6>
                <p className="text-xs text-[#6b7094] flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4f46e5]"></span>
                  Enabling will display the parameters in the standings table.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2a3a5c] border border-[rgba(99,102,241,0.12)] rounded-lg overflow-hidden">
                  {displayParams.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3.5 bg-white hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleDisplaySetting(key)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalDisplaySettings[key] ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalDisplaySettings[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Additional Parameters */}
              <div className="space-y-3">
                <h6 className="text-base font-bold text-[#4f46e5] border-b border-[rgba(99,102,241,0.12)]/50 pb-2">Additional Parameters</h6>
                
                <div className="overflow-x-auto border border-[rgba(99,102,241,0.12)] rounded-lg bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-[rgba(99,102,241,0.12)] text-xs font-semibold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-4 py-3">Point Name</th>
                        <th className="px-4 py-3">Point Short Name</th>
                        <th className="px-4 py-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(99,102,241,0.12)] text-sm">
                      {modalAdditionalParams.map((param) => (
                        <tr key={param.id} className="hover:bg-white/20 transition-colors">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.name}
                              onChange={e => updateAdditionalParam(param.id, 'name', e.target.value)}
                              className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                              placeholder="Points"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.shortName}
                              onChange={e => updateAdditionalParam(param.id, 'shortName', e.target.value)}
                              className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                              placeholder="Point Short name"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => deleteAdditionalParam(param.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Entry row */}
                      <tr className="bg-white/30">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={newParamName}
                            onChange={e => setNewParamName(e.target.value)}
                            className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="Points"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={newParamShortName}
                            onChange={e => setNewParamShortName(e.target.value)}
                            className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded px-3 py-1.5 text-sm text-[#0d0d2b] focus:outline-none focus:border-[#4f46e5]"
                            placeholder="Point Short name"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={addAdditionalParam}
                            className="p-1.5 text-[#4f46e5] hover:text-[#ea580c] hover:bg-[#4f46e5]/10 rounded transition-colors"
                            title="Add Parameter"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[rgba(99,102,241,0.12)] shrink-0 bg-white/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowStandingsModal(false)}
                className="px-4 py-2 border border-[rgba(99,102,241,0.12)] hover:border-[#4f46e5] rounded-lg text-sm font-semibold text-slate-700 hover:text-[#4f46e5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStandings}
                className="px-5 py-2 bg-[#4f46e5] hover:bg-[#7c3aed] text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#4f46e5]/10"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[rgba(99,102,241,0.12)] rounded-xl w-full max-w-[50rem] flex flex-col shadow-2xl relative my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.12)] shrink-0">
              <h3 className="text-xl font-bold text-[#0d0d2b]">Participants Scoring Workflow</h3>
              <button
                type="button"
                onClick={() => setShowParticipantsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800/50 text-[#6b7094] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(99,102,241,0.15)]">
              
              {/* Alert box */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-dashed border-blue-500/40 text-blue-400 p-4 rounded-xl">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                <span className="text-sm font-semibold text-[#0d0d2b]">
                  You Are Giving Access To Participants To Score Their Matches For This Event/Division/Class.
                </span>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                
                {/* 1. Score And Send For Admin Approval */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white/50 border border-[rgba(99,102,241,0.12)] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-[#0d0d2b]">Score And Send For Admin Approval</h5>
                    <p className="text-xs text-[#6b7094]">
                      Once the scores are entered and saved, it will be sent to the tournament administrator for approval. Only upon approval will the points and standings be updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAdminApproval(!modalAdminApproval)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalAdminApproval ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalAdminApproval ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* 2. Score And Publish */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white/50 border border-[rgba(99,102,241,0.12)] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-[#0d0d2b]">Score And Publish</h5>
                    <p className="text-xs text-[#6b7094]">
                      The participant who scores the match can enter and self-approve the match scores. Once approved, points are awarded and standings are updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalCanPublish(!modalCanPublish)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalCanPublish ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalCanPublish ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* 3. Score And Send For Admin/Opponent Approval */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white/50 border border-[rgba(99,102,241,0.12)] rounded-lg">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm text-[#0d0d2b]">Score And Send For Admin/Opponent Approval</h5>
                    <p className="text-xs text-[#6b7094]">
                      Both participants have to agree to the score. The scorer enters the score, and it is sent for the opponent's approval. Only upon approval will the points and standings be updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpponentApproval(!modalOpponentApproval)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${modalOpponentApproval ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${modalOpponentApproval ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Note / bottom information */}
              <div className="space-y-3 pt-2">
                <p className="text-xs text-[#6b7094] leading-relaxed">
                  <span className="font-semibold text-slate-700">Note: </span>
                  This will overwrite match level participants scoring. Also, only participants who have registered for this tournament can score their matches. Participants who have been added by the administrator, need to claim their profile before being able to use playerScoring.
                </p>

                <div className="space-y-1 pt-1">
                  <h5 className="text-[#00e5ff] font-bold text-sm hover:underline cursor-pointer">
                    Participants Added by the tournament admins need to claim to score matches
                  </h5>
                  <h5 className="text-[#00e5ff] font-bold text-sm hover:underline cursor-pointer">
                    You can set match level scoring type
                  </h5>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-[rgba(99,102,241,0.12)] shrink-0 bg-white/50 rounded-b-xl">
              <div className="flex justify-start"></div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowParticipantsModal(false)}
                  className="px-4 py-2 border border-[rgba(99,102,241,0.12)] hover:border-[#4f46e5] rounded-lg text-sm font-semibold text-slate-700 hover:text-[#4f46e5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveParticipants}
                  className="px-5 py-2 bg-[#4f46e5] hover:bg-[#7c3aed] text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-[#4f46e5]/10 flex items-center gap-1.5"
                >
                  <span>Pay & Enable</span>
                  <span className="opacity-50 text-xs">|</span>
                  <span>₹850</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <VenueTimingModal
        isOpen={timingModalOpen}
        onClose={() => {
          setTimingModalOpen(false);
          setSelectedTimingVenue(null);
        }}
        venue={selectedTimingVenue}
        canEditTiming={canEditTiming}
        onSaveSuccess={handleSaveTimingSuccess}
      />
      <AddEditVenueModal
        isOpen={addEditVenueModalOpen}
        onClose={() => {
          setAddEditVenueModalOpen(false);
          setVenueToEdit(null);
        }}
        onVenueSaved={handleVenueSaved}
        communityId={user?.communityId}
        venueToEdit={venueToEdit}
        existingVenues={venues}
      />
    </div>
  );
}
