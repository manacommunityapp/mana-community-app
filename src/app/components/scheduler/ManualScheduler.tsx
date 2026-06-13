import React, { useState } from 'react';
import { Calendar, GripVertical, Trophy, Save, Shield } from 'lucide-react';
import { tournamentService } from '../../../services/tournamentService';

// --- MOCK DATA ---
const INITIAL_TEAMS = [
  { id: 'T1', name: 'Mumbai Indians', group: 'UNASSIGNED', color: '#3b82f6' },
  { id: 'T2', name: 'Chennai Super Kings', group: 'UNASSIGNED', color: '#eab308' },
  { id: 'T3', name: 'Royal Challengers', group: 'UNASSIGNED', color: '#ef4444' },
  { id: 'T4', name: 'Delhi Capitals', group: 'UNASSIGNED', color: '#0ea5e9' },
  { id: 'T5', name: 'Kolkata Knight Riders', group: 'UNASSIGNED', color: '#a855f7' },
  { id: 'T6', name: 'Rajasthan Royals', group: 'UNASSIGNED', color: '#ec4899' },
];

export function ManualScheduler() {
  const [activeTab, setActiveTab] = useState('GROUPS');
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [matches, setMatches] = useState<any[]>([]);
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null);

  // Scheduling Form State
  const [matchForm, setMatchForm] = useState({ home: '', away: '', date: '', stage: 'GROUP_A', type: 'GROUP_STAGE' });

  // ==========================================
  // DRAG AND DROP LOGIC
  // ==========================================
  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('teamId', teamId);
    setDraggedTeam(teamId);
    // Use a slight delay to allow the drag image to be captured before we fade the original
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTeam(null);
    if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-40');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetGroup: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    if (teamId) {
      setTeams(teams.map(t => t.id === teamId ? { ...t, group: targetGroup } : t));
    }
  };

  const saveGroupsToDB = async () => {
    try {
      const assignments = teams.map(t => ({ teamId: t.id, groupId: t.group }));
      // NOTE: Replace '1' with your actual configId when passing props
      await tournamentService.assignTeamsToGroups(1, assignments);
      alert("Groups saved successfully!");
    } catch (err) {
      console.error("Failed to save groups", err);
      alert("Failed to save groups. Check console.");
    }
  };

  // ==========================================
  // MATCH SCHEDULING LOGIC
  // ==========================================
  const scheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (matchForm.home === matchForm.away) return alert("A team cannot play itself!");
    
    const newMatch = {
      id: Date.now(),
      home: teams.find(t => t.id === matchForm.home)?.name || (matchForm.home === 'TBD' ? 'TBD (Winner)' : 'TBD'),
      away: teams.find(t => t.id === matchForm.away)?.name || (matchForm.away === 'TBD' ? 'TBD (Winner)' : 'TBD'),
      date: matchForm.date,
      stage: matchForm.stage,
      type: matchForm.type
    };

    setMatches([...matches, newMatch]);

    try {
      // NOTE: Replace '1' with your actual configId
      await tournamentService.scheduleManualMatch(1, {
        homeTeamId: matchForm.home === 'TBD' ? '' : matchForm.home,
        awayTeamId: matchForm.away === 'TBD' ? '' : matchForm.away,
        matchType: matchForm.type,
        stage: matchForm.stage,
        startTime: matchForm.date
      });
    } catch (err) {
      console.error("Failed to schedule match", err);
      alert("Failed to save match to database. Check console.");
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderTeamCard = (team: any) => (
    <div 
      key={team.id} 
      draggable 
      onDragStart={(e) => handleDragStart(e, team.id)}
      onDragEnd={handleDragEnd}
      className="bg-[#1a2540] p-3 mb-2 rounded-lg border border-[rgba(99,102,241,0.12)] cursor-grab active:cursor-grabbing hover:border-[#F5A623] hover:shadow-[0_0_10px_rgba(200,255,0,0.2)] transition-all flex items-center group"
    >
      <GripVertical className="w-4 h-4 text-[#6b7094] mr-2 group-hover:text-[#F5A623] transition-colors" />
      <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ background: team.color }}></div>
      <span className="font-semibold text-[#0d0d2b] text-sm tracking-wide">{team.name}</span>
    </div>
  );

  const getTeamsByGroup = (groupId: string) => teams.filter(t => t.group === groupId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-[rgba(99,102,241,0.12)] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5A623] font-['Bebas_Neue'] tracking-widest">Manual Match Scheduler</h1>
          <p className="text-sm text-[#6b7094] mt-1">Drag & Drop Teams to Groups and schedule manual matchups.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-[rgba(99,102,241,0.12)] w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('GROUPS')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'GROUPS' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-[#6b7094] hover:text-[#0d0d2b]'}`}>1. Group Draw</button>
          <button onClick={() => setActiveTab('GROUP_STAGE')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'GROUP_STAGE' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-[#6b7094] hover:text-[#0d0d2b]'}`}>2. Group Matches</button>
          <button onClick={() => setActiveTab('KNOCKOUT')} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'KNOCKOUT' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-[#6b7094] hover:text-[#0d0d2b]'}`}>3. Knockouts</button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: DRAG & DROP GROUP ASSIGNMENTS
          ========================================== */}
      {activeTab === 'GROUPS' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-end mb-4">
            <button onClick={saveGroupsToDB} className="flex items-center gap-2 bg-[#10b981] text-white font-bold px-6 py-2 rounded-lg hover:bg-[#059669] transition-colors shadow-lg">
              <Save className="w-4 h-4" /> Save Groups
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Unassigned Pool */}
            <div 
              className={`bg-white/50 rounded-xl p-5 border-2 border-dashed transition-colors min-h-[400px] ${draggedTeam ? 'border-slate-500 bg-white' : 'border-[rgba(99,102,241,0.12)]'}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'UNASSIGNED')}
            >
              <h3 className="font-bold text-[#6b7094] uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Unassigned Pool
              </h3>
              {getTeamsByGroup('UNASSIGNED').map(renderTeamCard)}
            </div>

            {/* Group A */}
            <div 
              className={`bg-blue-500/5 rounded-xl p-5 border transition-colors min-h-[400px] ${draggedTeam ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[rgba(99,102,241,0.12)]'}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'GROUP_A')}
            >
              <h3 className="font-bold text-blue-400 uppercase tracking-widest text-xs mb-4 flex justify-between items-center">
                Group A 
                <span className="bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px]">{getTeamsByGroup('GROUP_A').length}</span>
              </h3>
              {getTeamsByGroup('GROUP_A').map(renderTeamCard)}
            </div>

            {/* Group B */}
            <div 
              className={`bg-[#F5A623]/5 rounded-xl p-5 border transition-colors min-h-[400px] ${draggedTeam ? 'border-[#F5A623] shadow-[0_0_15px_rgba(200,255,0,0.1)]' : 'border-[rgba(99,102,241,0.12)]'}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'GROUP_B')}
            >
              <h3 className="font-bold text-[#F5A623] uppercase tracking-widest text-xs mb-4 flex justify-between items-center">
                Group B 
                <span className="bg-[#F5A623]/20 text-[#F5A623] px-2.5 py-0.5 rounded-full text-[10px]">{getTeamsByGroup('GROUP_B').length}</span>
              </h3>
              {getTeamsByGroup('GROUP_B').map(renderTeamCard)}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: GROUP STAGE MATCH SCHEDULING
          ========================================== */}
      {activeTab === 'GROUP_STAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[rgba(99,102,241,0.12)] shadow-lg h-max">
            <h3 className="font-bold text-[#F5A623] mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Schedule Group Match
            </h3>
            <form onSubmit={scheduleMatch} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[#6b7094] uppercase tracking-wider mb-2">Select Group</label>
                <select className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#F5A623] transition-colors" value={matchForm.stage} onChange={e => setMatchForm({...matchForm, stage: e.target.value, type: 'GROUP_STAGE', home: '', away: ''})}>
                  <option value="GROUP_A">Group A</option>
                  <option value="GROUP_B">Group B</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6b7094] uppercase tracking-wider mb-2">Team 1 (Home)</label>
                  <select required className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#F5A623] transition-colors text-sm" value={matchForm.home} onChange={e => setMatchForm({...matchForm, home: e.target.value})}>
                    <option value="">Select...</option>
                    {getTeamsByGroup(matchForm.stage).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6b7094] uppercase tracking-wider mb-2">Team 2 (Away)</label>
                  <select required className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#F5A623] transition-colors text-sm" value={matchForm.away} onChange={e => setMatchForm({...matchForm, away: e.target.value})}>
                    <option value="">Select...</option>
                    {getTeamsByGroup(matchForm.stage).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6b7094] uppercase tracking-wider mb-2">Date & Time</label>
                <input type="datetime-local" required className="w-full bg-white border border-[rgba(99,102,241,0.12)] rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#F5A623] transition-colors [color-scheme:dark]" value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[#F5A623] text-black font-bold py-3 rounded-lg hover:bg-[#e09212] transition-colors mt-2">Schedule Match</button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-[#0d0d2b] mb-4 tracking-wide">Scheduled Group Matches</h3>
            <div className="space-y-3">
              {matches.filter(m => m.type === 'GROUP_STAGE').length === 0 ? (
                <div className="bg-white/50 border border-[rgba(99,102,241,0.12)] border-dashed rounded-xl p-8 text-center text-[#6b7094] text-sm">
                  No matches scheduled for groups yet. Use the form to add matches.
                </div>
              ) : (
                matches.filter(m => m.type === 'GROUP_STAGE').map(m => (
                  <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-[rgba(99,102,241,0.12)] flex justify-between items-center group hover:border-[#F5A623]/50 transition-colors">
                    <div className="flex-1 text-right font-semibold text-[#0d0d2b]">{m.home}</div>
                    <div className="px-6 flex flex-col items-center">
                      <span className="text-[10px] bg-white border border-[rgba(99,102,241,0.12)] text-[#6b7094] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{m.stage.replace('_', ' ')}</span>
                      <span className="text-[#F5A623] font-black my-1 text-lg">VS</span>
                      <span className="text-[11px] text-[#6b7094] font-medium">{new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex-1 text-left font-semibold text-[#0d0d2b]">{m.away}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: NEXT LEVEL (KNOCKOUT) SCHEDULING
          ========================================== */}
      {activeTab === 'KNOCKOUT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-[#a855f7]/30 h-max relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-500"></div>
            <h3 className="font-bold text-[#e879f9] mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Build Knockout Stage
            </h3>
            <form onSubmit={scheduleMatch} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wider mb-2">Stage</label>
                <select className="w-full bg-white border border-[#a855f7]/30 rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#a855f7] transition-colors" value={matchForm.stage} onChange={e => setMatchForm({...matchForm, stage: e.target.value, type: 'KNOCKOUT'})}>
                  <option value="QUARTER_FINAL">Quarter Final</option>
                  <option value="SEMI_FINAL">Semi Final</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wider mb-2">Team 1</label>
                  <select required className="w-full bg-white border border-[#a855f7]/30 rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm" value={matchForm.home} onChange={e => setMatchForm({...matchForm, home: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="TBD">TBD (Winner)</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wider mb-2">Team 2</label>
                  <select required className="w-full bg-white border border-[#a855f7]/30 rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#a855f7] transition-colors text-sm" value={matchForm.away} onChange={e => setMatchForm({...matchForm, away: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="TBD">TBD (Winner)</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wider mb-2">Date & Time</label>
                <input type="datetime-local" required className="w-full bg-white border border-[#a855f7]/30 rounded-lg px-4 py-2.5 text-[#0d0d2b] focus:outline-none focus:border-[#a855f7] transition-colors [color-scheme:dark]" value={matchForm.date} onChange={e => setMatchForm({...matchForm, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-500 hover:to-pink-400 transition-all mt-2 shadow-lg shadow-purple-500/20">Schedule Knockout</button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-[#0d0d2b] mb-4 tracking-wide">Knockout Bracket</h3>
            <div className="space-y-3">
              {matches.filter(m => m.type === 'KNOCKOUT').length === 0 ? (
                <div className="bg-white/50 border border-[#a855f7]/20 border-dashed rounded-xl p-8 text-center text-[#6b7094] text-sm">
                  No knockout matches scheduled yet.
                </div>
              ) : (
                matches.filter(m => m.type === 'KNOCKOUT').map(m => (
                  <div key={m.id} className="bg-purple-900/10 p-4 rounded-xl shadow-sm border border-[#a855f7]/30 flex justify-between items-center hover:bg-purple-900/20 transition-colors">
                    <div className="flex-1 text-right font-semibold text-[#0d0d2b]">{m.home}</div>
                    <div className="px-6 flex flex-col items-center min-w-[120px]">
                      <span className="text-[10px] bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black px-2.5 py-0.5 rounded uppercase tracking-widest shadow-sm">{m.stage.replace('_', ' ')}</span>
                      <span className="text-[#e879f9] font-black my-1">VS</span>
                      <span className="text-[11px] text-purple-300/70 font-medium">{new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex-1 text-left font-semibold text-[#0d0d2b]">{m.away}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
