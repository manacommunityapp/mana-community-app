import React, { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building,
  Briefcase,
  Sparkles,
  Phone,
  Mail,
  Filter,
  Eye,
  Lock,
} from 'lucide-react';
import { manaIntelligenceService } from '../../services/manaIntelligenceService';
import type { CommunityProfile, ProfileVisibility } from '../../types/manaIntelligence';

export const PrivacyEnforcedDiscover: React.FC = () => {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTower, setSelectedTower] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([]);
  const [myVisibility, setMyVisibility] = useState<ProfileVisibility>('PUBLIC');
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await manaIntelligenceService.searchDiscoverProfiles(
        searchQuery || undefined,
        selectedTower || undefined,
        selectedSkill || undefined
      );
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load discover profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const skills = await manaIntelligenceService.getTopSkills();
      setTopSkills(skills);
    } catch (err) {
      console.error('Failed to load top skills:', err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [searchQuery, selectedTower, selectedSkill]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleUpdateVisibility = async (vis: ProfileVisibility) => {
    try {
      setSavingSettings(true);
      await manaIntelligenceService.updateVisibility({
        visibility: vis,
        shareProfession: true,
        shareSkills: true,
        shareInterests: true,
      });
      setMyVisibility(vis);
      setShowVisibilityModal(false);
      fetchProfiles();
    } catch (err) {
      console.error('Failed to update privacy visibility:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Mana Intelligence Layer • Server-Enforced Graph Privacy
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Community Discover & Professional Graph</h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
              Connect with verified resident professionals, skills, and services. Zero client-side leakage — all visibility rules are strictly filtered on the server.
            </p>
          </div>

          <button
            onClick={() => setShowVisibilityModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl text-sm font-medium transition border border-white/20 self-start md:self-auto"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>My Privacy: <span className="font-bold text-white">{myVisibility}</span></span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors, lawyers, tutors, chefs, design, yoga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedTower}
            onChange={(e) => setSelectedTower(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Towers</option>
            <option value="Tower A">Tower A</option>
            <option value="Tower B">Tower B</option>
            <option value="Tower C">Tower C</option>
            <option value="Tower D">Tower D</option>
          </select>

          {selectedSkill && (
            <button
              onClick={() => setSelectedSkill('')}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Skill: {selectedSkill} ✕
            </button>
          )}
        </div>
      </div>

      {/* Popular Skills Strip */}
      {topSkills.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Popular:
          </span>
          {topSkills.map((s) => (
            <button
              key={s.skill}
              onClick={() => setSelectedSkill(s.skill === selectedSkill ? '' : s.skill)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                selectedSkill === s.skill
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.skill} <span className="opacity-60 text-[10px]">({s.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="flex gap-1">
                <div className="h-6 bg-slate-200 rounded-full w-16" />
                <div className="h-6 bg-slate-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Discoverable Profiles Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Profiles with 'PRIVATE' visibility or out-of-tower 'NEIGHBORS' restrictions are strictly excluded by the server policy engine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((profile) => (
            <div
              key={profile.userId}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        profile.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{profile.fullName}</h4>
                      <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                        <Building className="w-3 h-3" /> {profile.tower} {profile.flatNumber ? `• #${profile.flatNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      profile.visibility === 'PUBLIC'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : profile.visibility === 'NEIGHBORS'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {profile.visibility}
                  </span>
                </div>

                {profile.profession && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{profile.profession}</span>
                  </div>
                )}

                {profile.bio && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{profile.bio}</p>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {profile.phone || <span className="italic text-slate-400">Masked</span>}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {profile.email || <span className="italic text-slate-400">Masked</span>}
                  </span>
                </div>

                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showVisibilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Discover Privacy Settings
              </h3>
              <button onClick={() => setShowVisibilityModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Control who can discover your profile, profession, and skills across the Mana community network.
            </p>

            <div className="space-y-2">
              <label
                onClick={() => handleUpdateVisibility('PUBLIC')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  myVisibility === 'PUBLIC' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">PUBLIC (All Verified Residents)</div>
                  <div className="text-[11px] text-slate-500">Discoverable by all verified residents across all towers in Mana.</div>
                </div>
              </label>

              <label
                onClick={() => handleUpdateVisibility('NEIGHBORS')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  myVisibility === 'NEIGHBORS' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">NEIGHBORS (Tower Only)</div>
                  <div className="text-[11px] text-slate-500">Only residents living in your tower can discover your profile.</div>
                </div>
              </label>

              <label
                onClick={() => handleUpdateVisibility('PRIVATE')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  myVisibility === 'PRIVATE' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">PRIVATE (Hidden)</div>
                  <div className="text-[11px] text-slate-500">Completely excluded from community search, graph suggestions, and directory.</div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={savingSettings}
                onClick={() => setShowVisibilityModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
