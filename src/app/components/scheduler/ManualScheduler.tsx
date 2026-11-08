import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, GripVertical, Trophy, Save, Shield, Loader2, Plus, Trash2,
  Sparkles, Clock, MapPin, RotateCcw, UploadCloud,
  Shuffle, Search, ArrowRight, Layers, AlertCircle, Eye,
  ChevronDown, Medal, Tag, Activity
} from 'lucide-react';
import { tournamentService, type ConfigInfo } from '../../../services/sports/tournamentService';
import { sportsService } from '../../../services/sports/sportsService';
import { getPartnerDetails } from '../sports/admin/sportsPartnerUtils';
import { venueService } from '../../../services/bookings/venueService';
import { showSuccess, showError, showWarning } from '../../../utils/ToastUtils';
import { confirmAction } from '../../../utils/AlertUtils';
import type { Venue } from '../../../types/api';

interface ManualSchedulerProps {
  configId?: number;
  onNavigateToConfig?: () => void;
  onNavigateToSetup?: () => void;
}

interface TeamItem {
  id: string;
  name: string;
  group: string;
  color: string;
}

interface MatchItem {
  id: number;
  home: string;
  homeId?: string | number | null;
  away: string;
  awayId?: string | number | null;
  date: string;
  stage: string;
  type: string;
  venueName?: string;
  courtName?: string;
  duration?: number;
  status?: string;
}

const TEAM_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
];

const KNOCKOUT_STAGES = [
  { value: 'ROUND_OF_16', label: 'Round of 16' },
  { value: 'QUARTER_FINAL', label: 'Quarter Final' },
  { value: 'SEMI_FINAL', label: 'Semi Final' },
  { value: 'THIRD_PLACE', label: '3rd Place Playoff' },
  { value: 'FINAL', label: 'Final' },
  { value: 'ELIMINATOR', label: 'Eliminator' },
  { value: 'QUALIFIER_1', label: 'Qualifier 1' },
  { value: 'QUALIFIER_2', label: 'Qualifier 2' },
];

const TBD_OPTIONS = [
  { value: 'TBD', label: 'TBD (Winner / Runner-up)' },
  { value: 'TBD_QF1', label: 'Winner QF 1' },
  { value: 'TBD_QF2', label: 'Winner QF 2' },
  { value: 'TBD_QF3', label: 'Winner QF 3' },
  { value: 'TBD_QF4', label: 'Winner QF 4' },
  { value: 'TBD_SF1', label: 'Winner Semi Final 1' },
  { value: 'TBD_SF2', label: 'Winner Semi Final 2' },
  { value: 'TBD_GRP_A1', label: '1st Place Group A' },
  { value: 'TBD_GRP_B1', label: '1st Place Group B' },
  { value: 'TBD_GRP_A2', label: '2nd Place Group A' },
  { value: 'TBD_GRP_B2', label: '2nd Place Group B' },
];

export function ManualScheduler({ configId, onNavigateToConfig, onNavigateToSetup }: ManualSchedulerProps) {
  // Navigation & Config
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(configId ?? null);
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'GROUP_STAGE' | 'KNOCKOUT' | 'MASTER'>('GROUPS');

  // Core Data
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>(['GROUP_A', 'GROUP_B']);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Loading & Action States
  const [loadingData, setLoadingData] = useState(false);
  const [savingGroups, setSavingGroups] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);

  // Forms State
  const [groupMatchForm, setGroupMatchForm] = useState({
    stage: 'GROUP_A',
    home: '',
    away: '',
    date: '',
    venueId: '',
    courtId: '',
    duration: 60,
  });

  const [knockoutForm, setKnockoutForm] = useState({
    stage: 'QUARTER_FINAL',
    home: '',
    away: '',
    date: '',
    venueId: '',
    courtId: '',
    duration: 60,
  });

  // Auto-Generator Modal / Form
  const [showAutoGenerator, setShowAutoGenerator] = useState(false);
  const [autoGenForm, setAutoGenForm] = useState({
    targetGroup: 'ALL',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    matchDurationMinutes: 60,
    breakMinutes: 15,
    venueId: '',
  });

  // Master List Filter
  const [masterSearch, setMasterSearch] = useState('');
  const [masterStageFilter, setMasterStageFilter] = useState('ALL');

  // Quick Configuration for unconfigured sports events
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [quickEventId, setQuickEventId] = useState<number | string>('');
  const [quickFormat, setQuickFormat] = useState('GROUP_PLAYOFF');
  const [initializingQuickConfig, setInitializingQuickConfig] = useState(false);

  // Load configs on mount
  useEffect(() => {
    tournamentService.getConfigs()
      .then(cfgs => {
        setConfigs(cfgs || []);
        if (cfgs && cfgs.length > 0) {
          if (configId) {
            const match = cfgs.find(c => c.id === configId || (c as any).eventId === configId);
            if (match) {
              setSelectedConfigId(match.id);
              return;
            }
          }
          if (!selectedConfigId) {
            setSelectedConfigId(cfgs[0].id);
          }
        }
      })
      .catch(() => {});

    tournamentService.getEventsForDropdown()
      .then(evs => {
        setAvailableEvents(evs || []);
        if (evs && evs.length > 0) {
          setQuickEventId(evs[0].id);
        }
      })
      .catch(() => {});
    
    venueService.getVenues()
      .then(vList => setVenues(vList || []))
      .catch(() => {});
  }, []);

  const handleQuickCreateConfig = async () => {
    if (!quickEventId) {
      showWarning('Please select an event to initialize.');
      return;
    }
    const ev = availableEvents.find(e => String(e.id) === String(quickEventId));
    if (!ev) return;

    setInitializingQuickConfig(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const payload = {
        tournamentName: `${ev.name} Tournament`,
        sportId: ev.sportId || 1,
        communityId: ev.communityId || 1,
        eventId: ev.id,
        tournamentType: quickFormat,
        totalTeams: ev.totalTeams && ev.totalTeams >= 2 ? ev.totalTeams : 8,
        numberOfGroups: quickFormat === 'GROUP_PLAYOFF' ? 2 : 1,
        teamsAdvancingPerGroup: 2,
        startDate: ev.eventDateStart ? ev.eventDateStart.split('T')[0] : today,
        endDate: ev.eventDateEnd ? ev.eventDateEnd.split('T')[0] : nextWeek,
        matchDurationMinutes: 60,
        breakBetweenMatchesMinutes: 15,
        pointsForWin: 2,
        pointsForDraw: 1,
        pointsForLoss: 0,
        thirdPlaceMatch: true,
        hasSeeding: false,
      };

      const newCfg = await tournamentService.createConfig(payload);
      showSuccess(`Tournament configured successfully for "${ev.name}"!`);
      const updatedConfigs = await tournamentService.getConfigs();
      setConfigs(updatedConfigs);
      setSelectedConfigId(newCfg.id);
    } catch {
      showError('Failed to initialize tournament configuration. Please use the Config tab.');
    } finally {
      setInitializingQuickConfig(false);
    }
  };

  useEffect(() => {
    if (configId) {
      if (configs.length > 0) {
        const match = configs.find(c => c.id === configId || (c as any).eventId === configId);
        setSelectedConfigId(match ? match.id : configId);
      } else {
        setSelectedConfigId(configId);
      }
    }
  }, [configId, configs]);

  // Load teams, existing groups & matches whenever configId changes
  const loadConfigData = useCallback(async (cfgId: number) => {
    setLoadingData(true);
    try {
      // Fetch teams, schedule (groups), and matches concurrently
      const [teamsRes, scheduleRes, matchesRes] = await Promise.allSettled([
        tournamentService.getConfigTeams?.(cfgId),
        tournamentService.getSchedule?.(cfgId),
        tournamentService.getMatchesByConfigId?.(cfgId),
      ]);

      // 1. Process Groups dynamically based on config & schedule
      const activeCfg = configs.find(c => c.id === cfgId);
      const numGroups = activeCfg?.numberOfGroups && activeCfg.numberOfGroups > 0 ? activeCfg.numberOfGroups : 2;
      const detectedGroups = new Set<string>();
      for (let i = 0; i < numGroups; i++) {
        detectedGroups.add(`GROUP_${String.fromCharCode(65 + i)}`);
      }
      const teamGroupMap: Record<string, string> = {};

      if (scheduleRes.status === 'fulfilled' && scheduleRes.value?.groups) {
        scheduleRes.value.groups.forEach((g: any) => {
          const gKey = g.groupName ? g.groupName.replace(/\s+/g, '_').toUpperCase() : `GROUP_${g.groupId}`;
          detectedGroups.add(gKey);
          if (Array.isArray(g.standings)) {
            g.standings.forEach((st: any) => {
              const tid = String(st.teamId || st.team?.id);
              if (tid) teamGroupMap[tid] = gKey;
            });
          }
        });
      }

      setAvailableGroups(Array.from(detectedGroups));

      // 2. Process Teams (Strictly Real Records, Empty if None)
      let loadedTeams: TeamItem[] = [];
      if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value) && teamsRes.value.length > 0) {
        loadedTeams = teamsRes.value.map((t, idx) => {
          const tid = String(t.id || t.teamId || idx + 1);
          return {
            id: tid,
            name: t.name || t.teamName || `Team ${idx + 1}`,
            group: teamGroupMap[tid] || t.group || t.groupId || 'UNASSIGNED',
            color: t.colorHex || TEAM_COLORS[idx % TEAM_COLORS.length],
          };
        });
      } else if (activeCfg?.eventId) {
        // Fallback for non-auction (singles / doubles) tournaments: load from event registrations
        try {
          const regs = await sportsService.getEventRegistrations(activeCfg.eventId);
          const confirmed = (regs || []).filter(r => r.status === 'CONFIRMED' || r.status === 'REGISTERED');
          const isDoubles = (activeCfg.tournamentName || '').toLowerCase().includes('doubles');

          const processed = new Set<number>();
          const pairs: typeof confirmed = [];
          for (const r of confirmed) {
            if (processed.has(r.id)) continue;
            processed.add(r.id);
            if (isDoubles && r.partnerUserId != null) {
              const reciprocal = confirmed.find(
                o => o.id !== r.id &&
                  ((o.user?.id != null && o.user.id === r.partnerUserId) || o.id === r.partnerUserId) &&
                  (o.partnerUserId === r.user?.id || o.partnerUserId === r.id)
              );
              if (reciprocal) processed.add(reciprocal.id);
            }
            pairs.push(r);
          }

          loadedTeams = pairs.map((r, idx) => {
            const partnerInfo = getPartnerDetails(r as any, confirmed as any);
            let tName = r.playerName || r.user?.fullName || `Player ${idx + 1}`;
            if (isDoubles || partnerInfo.hasPartner) {
              if (partnerInfo.hasPartner && partnerInfo.name) {
                tName = `${tName} / ${partnerInfo.name}`;
              } else if (partnerInfo.isOpenPool) {
                tName = `${tName} / [Seeking Partner]`;
              }
            }
            if (r.proposedTeamName && r.proposedTeamName.trim()) {
              tName = `${r.proposedTeamName.trim()} (${tName})`;
            }
            const tid = String(r.id);
            return {
              id: tid,
              name: tName,
              group: teamGroupMap[tid] || 'UNASSIGNED',
              color: TEAM_COLORS[idx % TEAM_COLORS.length],
            };
          });
        } catch (err) {
          console.warn('Could not load registrations for manual scheduler:', err);
        }
      }
      setTeams(loadedTeams);

      // 3. Process Existing Matches
      if (matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value) && matchesRes.value.length > 0) {
        setMatches(matchesRes.value.map((m: any, i: number) => ({
          id: m.id || i + 1,
          home: m.homeTeamName || m.homeName || m.teamA?.name || 'TBD',
          homeId: m.homeTeamId || m.homeId,
          away: m.awayTeamName || m.awayName || m.teamB?.name || 'TBD',
          awayId: m.awayTeamId || m.awayId,
          date: m.scheduledAt || m.date || new Date().toISOString(),
          stage: m.round || m.stage || 'GROUP_STAGE',
          type: (m.round === 'GROUP_STAGE' || m.stage?.includes('GROUP')) ? 'GROUP_STAGE' : 'KNOCKOUT',
          venueName: m.venueName || m.venue?.name,
          courtName: m.courtName || m.court?.name,
          status: m.status || 'SCHEDULED',
        })));
      } else {
        setMatches([]);
      }
    } catch {
      showError('Failed to load tournament data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConfigId) {
      loadConfigData(selectedConfigId);
    }
  }, [selectedConfigId, loadConfigData]);

  // Selected config metadata
  const currentConfig = useMemo(() => {
    return configs.find(c => c.id === selectedConfigId);
  }, [configs, selectedConfigId]);

  // Distinct tournament options
  const tournamentOptions = useMemo(() => {
    const names = new Set<string>();
    configs.forEach(c => {
      const tName = c.tournamentName ? c.tournamentName.trim() : (c.eventName ? c.eventName.trim() : '');
      if (tName) names.add(tName);
    });
    return Array.from(names);
  }, [configs]);

  // Active selected tournament name
  const selectedTournamentName = useMemo(() => {
    if (currentConfig?.tournamentName && currentConfig.tournamentName.trim()) {
      return currentConfig.tournamentName.trim();
    }
    if (tournamentOptions.length > 0) {
      return tournamentOptions[0];
    }
    return '';
  }, [currentConfig, tournamentOptions]);

  // Events / Categories under the selected tournament
  const eventsForSelectedTournament = useMemo(() => {
    if (!selectedTournamentName) return configs;
    const matching = configs.filter(c => {
      const tName = c.tournamentName ? c.tournamentName.trim() : (c.eventName ? c.eventName.trim() : '');
      return tName === selectedTournamentName;
    });
    return matching.length > 0 ? matching : configs;
  }, [configs, selectedTournamentName]);

  const handleTournamentSelect = (tName: string) => {
    const matching = configs.filter(c => {
      const name = c.tournamentName ? c.tournamentName.trim() : (c.eventName ? c.eventName.trim() : '');
      return name === tName;
    });
    if (matching.length > 0) {
      setSelectedConfigId(matching[0].id);
    }
  };

  // ==========================================
  // GROUP MANAGEMENT ACTIONS
  // ==========================================
  const addGroup = () => {
    const nextCharCode = 65 + availableGroups.length; // 65 = A
    const nextGroupName = `GROUP_${String.fromCharCode(nextCharCode)}`;
    if (!availableGroups.includes(nextGroupName)) {
      setAvailableGroups(prev => [...prev, nextGroupName]);
      showSuccess(`Added ${nextGroupName.replace('_', ' ')}`);
    } else {
      const fallback = `GROUP_${availableGroups.length + 1}`;
      setAvailableGroups(prev => [...prev, fallback]);
      showSuccess(`Added ${fallback.replace('_', ' ')}`);
    }
  };

  const removeGroup = (groupKey: string) => {
    if (availableGroups.length <= 1) {
      showWarning('A tournament needs at least one group.');
      return;
    }
    // Move any assigned teams in this group back to UNASSIGNED
    setTeams(prev => prev.map(t => t.group === groupKey ? { ...t, group: 'UNASSIGNED' } : t));
    setAvailableGroups(prev => prev.filter(g => g !== groupKey));
    showSuccess(`Removed ${groupKey.replace('_', ' ')}`);
  };

  const moveTeamToGroup = (teamId: string, targetGroup: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, group: targetGroup } : t));
  };

  const handleSnakeDraw = () => {
    if (availableGroups.length === 0 || teams.length === 0) return;
    const shuffled = [...teams];
    const groupCount = availableGroups.length;

    const updated = shuffled.map((team, idx) => {
      const cycle = Math.floor(idx / groupCount);
      const pos = idx % groupCount;
      // Reverse in odd cycles for snake draft: 0,1, 1,0, 0,1...
      const groupIndex = cycle % 2 === 0 ? pos : (groupCount - 1 - pos);
      return {
        ...team,
        group: availableGroups[groupIndex]
      };
    });

    setTeams(updated);
    showSuccess('Distributed teams evenly across groups using Snake Draw!');
  };

  const handleResetGroups = () => {
    setTeams(prev => prev.map(t => ({ ...t, group: 'UNASSIGNED' })));
    showSuccess('Reset all teams to Unassigned pool.');
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('teamId', teamId);
    setDraggedTeamId(teamId);
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTeamId(null);
    if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-40');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetGroup: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    if (teamId) {
      moveTeamToGroup(teamId, targetGroup);
    }
  };

  // Save Groups to Backend
  const saveGroupsToDB = async () => {
    if (!selectedConfigId) {
      showError('Please select a tournament configuration.');
      return;
    }
    setSavingGroups(true);
    try {
      const assignments = teams.map(t => ({
        teamId: t.id,
        groupId: t.group,
      }));
      await tournamentService.assignTeamsToGroups(selectedConfigId, assignments);
      showSuccess('Group assignments saved successfully to database!');
    } catch {
      showError('Failed to save group assignments.');
    } finally {
      setSavingGroups(false);
    }
  };

  // ==========================================
  // SINGLE MATCH SCHEDULING (Group & Knockout)
  // ==========================================
  const scheduleGroupMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigId) return showError('Please select a tournament');
    if (groupMatchForm.home === groupMatchForm.away) return showError('A team cannot play against itself!');
    if (!groupMatchForm.date) return showError('Please select a match date and time');

    const homeTeam = teams.find(t => t.id === groupMatchForm.home);
    const awayTeam = teams.find(t => t.id === groupMatchForm.away);
    const selVenue = venues.find(v => String(v.id) === groupMatchForm.venueId);

    try {
      const res = await tournamentService.scheduleManualMatch(selectedConfigId, {
        homeTeamId: groupMatchForm.home || null,
        awayTeamId: groupMatchForm.away || null,
        matchType: 'GROUP_STAGE',
        stage: groupMatchForm.stage,
        startTime: groupMatchForm.date,
        venueId: groupMatchForm.venueId ? Number(groupMatchForm.venueId) : null,
        durationMinutes: groupMatchForm.duration || 60,
      });

      const newMatch: MatchItem = {
        id: res?.id || Date.now(),
        home: homeTeam?.name || 'Home Team',
        homeId: groupMatchForm.home,
        away: awayTeam?.name || 'Away Team',
        awayId: groupMatchForm.away,
        date: groupMatchForm.date,
        stage: groupMatchForm.stage,
        type: 'GROUP_STAGE',
        venueName: selVenue?.name,
        duration: groupMatchForm.duration,
        status: 'SCHEDULED',
      };

      setMatches(prev => [newMatch, ...prev]);
      showSuccess(`Scheduled: ${newMatch.home} vs ${newMatch.away}`);
      setGroupMatchForm(prev => ({ ...prev, home: '', away: '' }));
    } catch {
      showError('Failed to schedule match');
    }
  };

  const scheduleKnockoutMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigId) return showError('Please select a tournament');
    if (knockoutForm.home === knockoutForm.away && knockoutForm.home !== 'TBD') {
      return showError('A team cannot play against itself!');
    }
    if (!knockoutForm.date) return showError('Please select a date and time');

    const homeTeam = teams.find(t => t.id === knockoutForm.home);
    const awayTeam = teams.find(t => t.id === knockoutForm.away);
    const homeLabel = homeTeam?.name || TBD_OPTIONS.find(o => o.value === knockoutForm.home)?.label || 'TBD';
    const awayLabel = awayTeam?.name || TBD_OPTIONS.find(o => o.value === knockoutForm.away)?.label || 'TBD';
    const selVenue = venues.find(v => String(v.id) === knockoutForm.venueId);

    try {
      const res = await tournamentService.scheduleManualMatch(selectedConfigId, {
        homeTeamId: (knockoutForm.home.startsWith('TBD') || !knockoutForm.home) ? null : knockoutForm.home,
        awayTeamId: (knockoutForm.away.startsWith('TBD') || !knockoutForm.away) ? null : knockoutForm.away,
        matchType: 'KNOCKOUT',
        stage: knockoutForm.stage,
        startTime: knockoutForm.date,
        venueId: knockoutForm.venueId ? Number(knockoutForm.venueId) : null,
        durationMinutes: knockoutForm.duration || 60,
      });

      const newMatch: MatchItem = {
        id: res?.id || Date.now(),
        home: homeLabel,
        homeId: knockoutForm.home.startsWith('TBD') ? null : knockoutForm.home,
        away: awayLabel,
        awayId: knockoutForm.away.startsWith('TBD') ? null : knockoutForm.away,
        date: knockoutForm.date,
        stage: knockoutForm.stage,
        type: 'KNOCKOUT',
        venueName: selVenue?.name,
        duration: knockoutForm.duration,
        status: 'SCHEDULED',
      };

      setMatches(prev => [newMatch, ...prev]);
      showSuccess(`Knockout fixture added: ${homeLabel} vs ${awayLabel}`);
      setKnockoutForm(prev => ({ ...prev, home: '', away: '' }));
    } catch {
      showError('Failed to schedule knockout match');
    }
  };

  // ==========================================
  // AUTO-GENERATE ROUND ROBIN FIXTURES
  // ==========================================
  const handleAutoGenerateRoundRobin = async () => {
    if (!selectedConfigId) return;

    // Filter groups to process
    const targetGroups = autoGenForm.targetGroup === 'ALL'
      ? availableGroups
      : [autoGenForm.targetGroup];

    let generatedPairsCount = 0;
    const newDraftMatches: MatchItem[] = [];

    let currentDateTime = new Date(`${autoGenForm.startDate}T${autoGenForm.startTime}`);
    const selVenue = venues.find(v => String(v.id) === autoGenForm.venueId);

    for (const grp of targetGroups) {
      const grpTeams = teams.filter(t => t.group === grp);
      if (grpTeams.length < 2) continue;

      // Pairwise combinations (round-robin: each plays each other once)
      for (let i = 0; i < grpTeams.length; i++) {
        for (let j = i + 1; j < grpTeams.length; j++) {
          const homeT = grpTeams[i];
          const awayT = grpTeams[j];
          const matchTimeStr = currentDateTime.toISOString().slice(0, 16);

          try {
            const res = await tournamentService.scheduleManualMatch(selectedConfigId, {
              homeTeamId: homeT.id,
              awayTeamId: awayT.id,
              matchType: 'GROUP_STAGE',
              stage: grp,
              startTime: matchTimeStr,
              venueId: autoGenForm.venueId ? Number(autoGenForm.venueId) : null,
              durationMinutes: autoGenForm.matchDurationMinutes,
            });

            newDraftMatches.push({
              id: res?.id || (Date.now() + generatedPairsCount),
              home: homeT.name,
              homeId: homeT.id,
              away: awayT.name,
              awayId: awayT.id,
              date: matchTimeStr,
              stage: grp,
              type: 'GROUP_STAGE',
              venueName: selVenue?.name,
              duration: autoGenForm.matchDurationMinutes,
              status: 'SCHEDULED',
            });
            generatedPairsCount++;

            // Advance time for next match
            const advanceMinutes = (autoGenForm.matchDurationMinutes || 60) + (autoGenForm.breakMinutes || 15);
            currentDateTime = new Date(currentDateTime.getTime() + advanceMinutes * 60000);
          } catch {
            // continue
          }
        }
      }
    }

    if (generatedPairsCount > 0) {
      setMatches(prev => [...newDraftMatches, ...prev]);
      setShowAutoGenerator(false);
      showSuccess(`Auto-generated ${generatedPairsCount} round-robin fixtures!`);
    } else {
      showWarning('Not enough teams in the chosen groups to generate round robin (need at least 2 teams per group).');
    }
  };

  // ==========================================
  // DELETE & PUBLISH ACTIONS
  // ==========================================
  const handleDeleteMatch = async (matchId: number) => {
    const ok = await confirmAction({
      title: 'Delete Fixture',
      text: 'Are you sure you want to delete this fixture?',
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#ef4444'
    });
    if (!ok) return;

    try {
      await tournamentService.deleteMatch?.(matchId);
      setMatches(prev => prev.filter(m => m.id !== matchId));
      showSuccess('Fixture deleted.');
    } catch {
      // Optimistic delete
      setMatches(prev => prev.filter(m => m.id !== matchId));
      showSuccess('Fixture removed from view.');
    }
  };

  const handlePublishSchedule = async () => {
    if (!selectedConfigId) return;
    const ok = await confirmAction({
      title: 'Publish Tournament Schedule',
      text: 'Publishing will make all scheduled matches visible to community residents and participants.',
      confirmButtonText: 'Publish Now',
      confirmButtonColor: '#10b981'
    });
    if (!ok) return;

    setPublishing(true);
    try {
      await tournamentService.publishSchedule?.(selectedConfigId);
      setMatches(prev => prev.map(m => ({ ...m, status: 'PUBLISHED' })));
      showSuccess('Tournament schedule published live!');
    } catch {
      showError('Failed to publish schedule.');
    } finally {
      setPublishing(false);
    }
  };

  // Helpers
  const getTeamsByGroup = (grp: string) => teams.filter(t => t.group === grp);

  const filteredMasterMatches = useMemo(() => {
    return matches.filter(m => {
      const matchStage = masterStageFilter === 'ALL' ||
        (masterStageFilter === 'GROUP' && m.type === 'GROUP_STAGE') ||
        (masterStageFilter === 'KNOCKOUT' && m.type === 'KNOCKOUT') ||
        m.stage === masterStageFilter;

      const matchSearch = !masterSearch ||
        m.home.toLowerCase().includes(masterSearch.toLowerCase()) ||
        m.away.toLowerCase().includes(masterSearch.toLowerCase()) ||
        m.stage.toLowerCase().includes(masterSearch.toLowerCase()) ||
        (m.venueName && m.venueName.toLowerCase().includes(masterSearch.toLowerCase()));

      return matchStage && matchSearch;
    });
  }, [matches, masterStageFilter, masterSearch]);

  const assignedTeamsCount = useMemo(() => teams.filter(t => t.group !== 'UNASSIGNED').length, [teams]);
  const groupMatchesCount = useMemo(() => matches.filter(m => m.type === 'GROUP_STAGE').length, [matches]);
  const knockoutMatchesCount = useMemo(() => matches.filter(m => m.type === 'KNOCKOUT').length, [matches]);

  if (loadingData && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Tournament & Fixtures...</p>
        <p className="text-xs text-slate-400 mt-0.5">Fetching registered teams, group pools, and match data</p>
      </div>
    );
  }

  if (!selectedConfigId && configs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center text-slate-500 max-w-xl mx-auto shadow-sm space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">No tournament configurations found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Every match schedule requires a tournament configuration to set the competition format (Group stage, Knockout, or Round Robin), match duration, and pool rules.
          </p>
        </div>

        {/* 1-Click Quick initialize if sports events exist */}
        {availableEvents.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1-Click Quick Setup For Existing Event</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Event</label>
                <select
                  value={quickEventId}
                  onChange={e => setQuickEventId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none"
                >
                  {availableEvents.map(e => {
                    const rawFmt = e.formats || e.format;
                    const fmtList = Array.isArray(rawFmt) ? rawFmt : (rawFmt ? [rawFmt] : []);
                    const fmt = fmtList.map(f => String(f).toUpperCase() === 'SINGLES' ? 'Singles' : String(f).toUpperCase() === 'DOUBLES' ? 'Doubles' : String(f).toUpperCase().includes('MIXED') ? 'Mixed Doubles' : String(f).toUpperCase() === 'TEAM' ? 'Team' : f).join(' / ');
                    const fmtPart = fmt && !e.name.toLowerCase().includes(fmt.toLowerCase()) ? ` — ${fmt}` : '';
                    return (
                      <option key={e.id} value={e.id}>{e.name}{fmtPart} ({e.sportName})</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tournament Format</label>
                <select
                  value={quickFormat}
                  onChange={e => setQuickFormat(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none"
                >
                  <option value="GROUP_PLAYOFF">Group Stage + Playoff</option>
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="KNOCKOUT_SINGLE">Single Elimination Knockout</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleQuickCreateConfig}
              disabled={initializingQuickConfig}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {initializingQuickConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Initialize Tournament & Start Scheduling</span>
            </button>
          </div>
        )}

        {/* Action navigation buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onNavigateToConfig && (
            <button
              onClick={onNavigateToConfig}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Open Config Tab (Custom Rules)</span>
            </button>
          )}
          {onNavigateToSetup && (
            <button
              onClick={onNavigateToSetup}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Automated Scheduler</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">

      {/* TOP CONTEXT BAR: Separate Tournament & Event Selectors + Responsive Action Strip */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* Top Header: Badge chips & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {currentConfig?.sportName || 'Sports Tournament'}
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                  {currentConfig?.tournamentType ? currentConfig.tournamentType.replace(/_/g, ' ') : 'Round Robin / Playoff'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentConfig?.status === 'ACTIVE' || currentConfig?.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}>
                  {currentConfig?.status || 'Draft'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {currentConfig?.tournamentName || 'Tournament Match Scheduler'}
              </h2>
            </div>
          </div>

          {/* Quick Metrics & Actions Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Teams:</span>
              <span className="font-bold text-slate-900">{assignedTeamsCount}/{teams.length}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">Matches:</span>
              <span className="font-bold text-indigo-600">{matches.length}</span>
            </div>

            <button
              onClick={() => selectedConfigId && loadConfigData(selectedConfigId)}
              disabled={loadingData}
              title="Refresh Tournament Data"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={saveGroupsToDB}
              disabled={savingGroups}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingGroups ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Groups</span>
            </button>

            <button
              onClick={handlePublishSchedule}
              disabled={publishing || matches.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Publish Schedule</span>
            </button>
          </div>
        </div>

        {/* Separate Dropdowns: 1) Tournament, 2) Sports Event / Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* 1. TOURNAMENT DROPDOWN */}
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="tournamentSelect" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tournament</span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">(Parent Championship)</span>
            </label>
            <div className="relative">
              <select
                id="tournamentSelect"
                value={selectedTournamentName}
                onChange={e => handleTournamentSelect(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white pl-3.5 pr-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                {tournamentOptions.map(tName => (
                  <option key={tName} value={tName}>{tName}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* 2. SPORTS EVENT / CATEGORY DROPDOWN */}
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="sportsEventSelect" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Sports Event / Category</span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">(Match Schedule Context)</span>
            </label>
            <div className="relative">
              <select
                id="sportsEventSelect"
                value={selectedConfigId ?? ''}
                onChange={e => setSelectedConfigId(e.target.value ? Number(e.target.value) : null)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white pl-3.5 pr-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer shadow-xs"
              >
                {eventsForSelectedTournament.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.eventName || c.tournamentName} {c.totalTeams ? `• ${c.totalTeams} Teams` : ''} {c.sportName ? `• ${c.sportName}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Info & Venue Details Sub-strip */}
        {currentConfig && (
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {currentConfig.startDate ? new Date(currentConfig.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start TBD'}
                {currentConfig.endDate ? ` — ${new Date(currentConfig.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              </span>
            </div>
            {currentConfig.sportName && (
              <div className="flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentConfig.sportName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentConfig.matchDurationMinutes || 60} min / match</span>
            </div>
            {currentConfig.totalTeams && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span>{currentConfig.totalTeams} Registered Teams</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('GROUPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'GROUPS'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Pools & Group Draw
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'GROUPS' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
            {assignedTeamsCount}/{teams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('GROUP_STAGE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'GROUP_STAGE'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          2. Group Match Generator
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'GROUP_STAGE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
            {groupMatchesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('KNOCKOUT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'KNOCKOUT'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          3. Knockout Brackets
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'KNOCKOUT' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
            {knockoutMatchesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MASTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'MASTER'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          4. Master Schedule & Timeline
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'MASTER' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
            {matches.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DYNAMIC GROUP DRAW (Drag & Drop + Mobile Quick-Assign)
          ========================================================================= */}
      {activeTab === 'GROUPS' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900">Interactive Draw:</span>
              <span>Drag teams between pools or use the quick-assign buttons on each card.</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSnakeDraw}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Snake Seed Draw
              </button>
              <button
                onClick={handleResetGroups}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Pool
              </button>
              <button
                onClick={addGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Group
              </button>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* UNASSIGNED POOL */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'UNASSIGNED')}
              className={`rounded-2xl p-4 border-2 border-dashed transition-all min-h-[380px] flex flex-col ${
                draggedTeamId ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Unassigned Pool</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {getTeamsByGroup('UNASSIGNED').length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {getTeamsByGroup('UNASSIGNED').length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    All teams assigned!
                  </div>
                ) : (
                  getTeamsByGroup('UNASSIGNED').map(t => renderTeamCard(t))
                )}
              </div>
            </div>

            {/* DYNAMIC GROUPS (Pool A, Pool B, etc.) */}
            {availableGroups.map((grpKey, idx) => {
              const grpTeams = getTeamsByGroup(grpKey);
              const groupLabel = grpKey.replace('_', ' ');
              const colors = [
                'border-blue-200 bg-blue-50/20 text-blue-700',
                'border-amber-200 bg-amber-50/20 text-amber-700',
                'border-emerald-200 bg-emerald-50/20 text-emerald-700',
                'border-purple-200 bg-purple-50/20 text-purple-700',
              ];
              const badgeStyle = colors[idx % colors.length];

              return (
                <div
                  key={grpKey}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, grpKey)}
                  className={`rounded-2xl p-4 border transition-all min-h-[380px] flex flex-col bg-white shadow-xs ${
                    draggedTeamId ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">{groupLabel}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {grpTeams.length} {grpTeams.length === 1 ? 'Team' : 'Teams'}
                      </span>
                      {grpTeams.length === 0 && availableGroups.length > 2 && (
                        <button
                          onClick={() => removeGroup(grpKey)}
                          title="Remove empty group"
                          className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                    {grpTeams.length === 0 ? (
                      <div className="text-center py-14 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Drop teams here or use the card quick-action menu
                      </div>
                    ) : (
                      grpTeams.map(t => renderTeamCard(t))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: GROUP MATCH SCHEDULER & ONE-CLICK AUTO GENERATOR
          ========================================================================= */}
      {activeTab === 'GROUP_STAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Scheduling Form & Auto-Gen Trigger */}
          <div className="lg:col-span-1 space-y-4">
            {/* Auto Generator Banner */}
            <div className="bg-gradient-to-br from-indigo-500 to-sky-600 rounded-2xl p-5 text-white shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Round-Robin Generator
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                Instantly generate all round-robin fixtures for current groups with automated start times and venue allocations.
              </p>
              <button
                type="button"
                onClick={() => setShowAutoGenerator(!showAutoGenerator)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {showAutoGenerator ? 'Hide Generator' : 'Auto-Generate Group Fixtures'}
              </button>
            </div>

            {/* Auto-Gen Form Modal / Dropdown */}
            {showAutoGenerator && (
              <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm space-y-4">
                <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Setup Auto-Generation
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Pool</label>
                  <select
                    value={autoGenForm.targetGroup}
                    onChange={e => setAutoGenForm({ ...autoGenForm, targetGroup: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  >
                    <option value="ALL">All Groups ({availableGroups.length})</option>
                    {availableGroups.map(g => (
                      <option key={g} value={g}>{g.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={autoGenForm.startDate}
                      onChange={e => setAutoGenForm({ ...autoGenForm, startDate: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">First Match</label>
                    <input
                      type="time"
                      value={autoGenForm.startTime}
                      onChange={e => setAutoGenForm({ ...autoGenForm, startTime: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min="15"
                      step="5"
                      value={autoGenForm.matchDurationMinutes}
                      onChange={e => setAutoGenForm({ ...autoGenForm, matchDurationMinutes: Number(e.target.value) })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Break (mins)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={autoGenForm.breakMinutes}
                      onChange={e => setAutoGenForm({ ...autoGenForm, breakMinutes: Number(e.target.value) })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Venue (Optional)</label>
                  <select
                    value={autoGenForm.venueId}
                    onChange={e => setAutoGenForm({ ...autoGenForm, venueId: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  >
                    <option value="">Default Tournament Venue</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAutoGenerateRoundRobin}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Confirm & Generate Fixtures
                </button>
              </div>
            )}

            {/* Manual Single Match Form */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Custom Group Match</h3>
              </div>

              <form onSubmit={scheduleGroupMatch} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Group / Pool</label>
                  <select
                    value={groupMatchForm.stage}
                    onChange={e => setGroupMatchForm({ ...groupMatchForm, stage: e.target.value, home: '', away: '' })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  >
                    {availableGroups.map(g => (
                      <option key={g} value={g}>{g.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Home Team</label>
                    <select
                      required
                      value={groupMatchForm.home}
                      onChange={e => setGroupMatchForm({ ...groupMatchForm, home: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    >
                      <option value="">Select Team</option>
                      {getTeamsByGroup(groupMatchForm.stage).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Away Team</label>
                    <select
                      required
                      value={groupMatchForm.away}
                      onChange={e => setGroupMatchForm({ ...groupMatchForm, away: e.target.value })}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    >
                      <option value="">Select Team</option>
                      {getTeamsByGroup(groupMatchForm.stage).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={groupMatchForm.date}
                    onChange={e => setGroupMatchForm({ ...groupMatchForm, date: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Venue</label>
                  <select
                    value={groupMatchForm.venueId}
                    onChange={e => setGroupMatchForm({ ...groupMatchForm, venueId: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  >
                    <option value="">Default Tournament Venue</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Schedule Match
                </button>
              </form>
            </div>
          </div>

          {/* Matches List for Group Stage */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-bold text-sm text-slate-900">Scheduled Group Matches</h3>
              <span className="text-xs text-slate-500 font-semibold">{matches.filter(m => m.type === 'GROUP_STAGE').length} Fixtures</span>
            </div>

            {matches.filter(m => m.type === 'GROUP_STAGE').length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No group matches scheduled yet. Use the single match form or click "Auto-Generate Group Fixtures".
              </div>
            ) : (
              <div className="space-y-2.5">
                {matches.filter(m => m.type === 'GROUP_STAGE').map(m => renderMatchCard(m))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KNOCKOUTS & PLAYOFF BRACKETS
          ========================================================================= */}
      {activeTab === 'KNOCKOUT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Knockout Form */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 h-max">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Trophy className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Build Knockout Match</h3>
            </div>

            <form onSubmit={scheduleKnockoutMatch} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Knockout Stage</label>
                <select
                  value={knockoutForm.stage}
                  onChange={e => setKnockoutForm({ ...knockoutForm, stage: e.target.value })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                >
                  {KNOCKOUT_STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Team 1 / Seed</label>
                  <select
                    required
                    value={knockoutForm.home}
                    onChange={e => setKnockoutForm({ ...knockoutForm, home: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                  >
                    <option value="">Select Team</option>
                    <optgroup label="TBD Placeholders">
                      {TBD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tournament Teams">
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Team 2 / Seed</label>
                  <select
                    required
                    value={knockoutForm.away}
                    onChange={e => setKnockoutForm({ ...knockoutForm, away: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                  >
                    <option value="">Select Team</option>
                    <optgroup label="TBD Placeholders">
                      {TBD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tournament Teams">
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={knockoutForm.date}
                  onChange={e => setKnockoutForm({ ...knockoutForm, date: e.target.value })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Venue</label>
                <select
                  value={knockoutForm.venueId}
                  onChange={e => setKnockoutForm({ ...knockoutForm, venueId: e.target.value })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                >
                  <option value="">Default Tournament Venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Schedule Knockout Match
              </button>
            </form>
          </div>

          {/* Knockout Match List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-bold text-sm text-slate-900">Knockout Stage Fixtures</h3>
              <span className="text-xs text-slate-500 font-semibold">{matches.filter(m => m.type === 'KNOCKOUT').length} Matches</span>
            </div>

            {matches.filter(m => m.type === 'KNOCKOUT').length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 text-xs">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No knockout matches scheduled yet. Use the builder on the left to add Quarter Finals, Semi Finals, or the Final.
              </div>
            ) : (
              <div className="space-y-2.5">
                {matches.filter(m => m.type === 'KNOCKOUT').map(m => renderMatchCard(m))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MASTER SCHEDULE & TIMELINE VIEW
          ========================================================================= */}
      {activeTab === 'MASTER' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teams, venues, or stages..."
                value={masterSearch}
                onChange={e => setMasterSearch(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="masterStageFilterSelect" className="text-xs font-bold text-slate-500">Stage:</label>
              <select
                id="masterStageFilterSelect"
                value={masterStageFilter}
                onChange={e => setMasterStageFilter(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
              >
                <option value="ALL">All Stages</option>
                <option value="GROUP">Group Stage Only</option>
                <option value="KNOCKOUT">Knockouts Only</option>
                {availableGroups.map(g => (
                  <option key={g} value={g}>{g.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Fixture Cards */}
          {filteredMasterMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No matches found matching your filters.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMasterMatches.map(m => renderMatchCard(m))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  function renderTeamCard(team: TeamItem) {
    return (
      <div
        key={team.id}
        draggable
        onDragStart={(e) => handleDragStart(e, team.id)}
        onDragEnd={handleDragEnd}
        className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-sm transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
          <div className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ background: team.color }} />
          <span className="font-semibold text-slate-800 text-xs truncate">{team.name}</span>
        </div>

        {/* Quick Assign Dropdown Menu (Touch & Accessibility friendly) */}
        <select
          value={team.group}
          onChange={(e) => moveTeamToGroup(team.id, e.target.value)}
          className="text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 outline-none cursor-pointer shrink-0 ml-2"
        >
          <option value="UNASSIGNED">Pool</option>
          {availableGroups.map(g => (
            <option key={g} value={g}>{g.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
    );
  }

  function renderMatchCard(m: MatchItem) {
    const isKnockout = m.type === 'KNOCKOUT';
    const formattedDate = m.date
      ? new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
      : 'Date TBD';

    return (
      <div
        key={m.id}
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
      >
        {/* Match Header / Teams Layout */}
        <div className="flex-1 flex items-center justify-between sm:justify-start gap-4">
          {/* Home Team */}
          <div className="flex-1 text-right sm:text-left sm:w-40 truncate">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{m.home}</span>
          </div>

          {/* VS Pill */}
          <div className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-600 shrink-0">
            VS
          </div>

          {/* Away Team */}
          <div className="flex-1 text-left sm:w-40 truncate">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{m.away}</span>
          </div>
        </div>

        {/* Match Metadata: Stage, Time, Venue */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex flex-col sm:items-end">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isKnockout ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                {m.stage.replace('_', ' ')}
              </span>
              <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formattedDate}
              </span>
            </div>
            {m.venueName && (
              <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {m.venueName} {m.courtName ? `· ${m.courtName}` : ''}
              </span>
            )}
          </div>

          {/* Delete Action */}
          <button
            onClick={() => handleDeleteMatch(m.id)}
            title="Delete this match"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
}
