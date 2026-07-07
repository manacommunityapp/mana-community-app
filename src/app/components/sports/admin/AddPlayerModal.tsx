import { Loader2, Plus, Trash2 } from "lucide-react";
import type { PlayerCategory } from "../../../../types/api";

interface AddPlayerForm {
  id: string;
  playerName: string;
  playerEmail: string;
  categoryId: string;
  avatarUrl: string;
  matchType: string;
  age: number;
  flatNumber: string;
  relation: string;
  role: string;
  matches: number;
  runs: number;
  wickets: number;
  strikeRate: number;
  avgScore: number;
}

interface AddPlayerModalProps {
  showAddPlayerModal: boolean;
  setShowAddPlayerModal: (v: boolean) => void;
  addPlayerForms: AddPlayerForm[];
  setAddPlayerForms: React.Dispatch<React.SetStateAction<AddPlayerForm[]>>;
  communityUsers: any[];
  loadingUsers: boolean;
  friendSearchQuery: string;
  setFriendSearchQuery: (q: string) => void;
  filteredFriends: any[];
  handleSelectFriend: (friend: any) => void;
  handleAddNewPlayerCard: () => void;
  handleDeletePlayerCard: (cardId: string) => void;
  handleAddPlayerSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  playerCategories: PlayerCategory[];
  formatDob: (dob?: string) => string;
}

export function AddPlayerModal({
  showAddPlayerModal,
  setShowAddPlayerModal,
  addPlayerForms,
  setAddPlayerForms,
  communityUsers,
  loadingUsers,
  friendSearchQuery,
  setFriendSearchQuery,
  filteredFriends,
  handleSelectFriend,
  handleAddNewPlayerCard,
  handleDeletePlayerCard,
  handleAddPlayerSubmit,
  submitting,
  playerCategories,
  formatDob,
}: AddPlayerModalProps) {
  if (!showAddPlayerModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2a3a5c] pb-3">
          <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#f97316]" /> Add Participant
          </h3>
          <button
            onClick={() => setShowAddPlayerModal(false)}
            className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddPlayerSubmit} className="space-y-6">
          <div className="p-4 flex flex-col lg:flex-row gap-4 bg-[#0c1220] border border-[#2a3a5c] shadow rounded-lg text-slate-800 dark:text-[#f1f5f9]">

            {/* Left Side Column ("Your Friends") */}
            <div className="flex flex-col w-full lg:w-1/3">
              <div className="p-4 border border-[#2a3a5c] bg-[#141c2e] shadow rounded-lg flex flex-col space-y-3">
                <div className="flex flex-row gap-2 items-center">
                  <div className="flex flex-col text-left gap-1">
                    <p className="font-semibold text-sm text-[#f1f5f9]">Your Friends</p>
                  </div>
                </div>
                <p className="text-[#94a3b8] text-xs text-left">Select to add players to this tournament event</p>

                <div className="mt-1">
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                  />
                </div>

                <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <p className="text-xs text-[#64748b] italic text-center py-6">No friends found</p>
                  ) : (
                    filteredFriends.map(friend => (
                      <div key={friend.id} className="flex w-full items-center gap-3 p-2 border rounded-lg border-[#2a3a5c] bg-[#0c1220]/50 hover:bg-[#1a2540] transition-colors">
                        <div className="h-12 min-w-12 rounded-full overflow-hidden border border-[#2a3a5c] flex-shrink-0">
                          <img
                            src={friend.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex flex-col gap-1 w-full text-left min-w-0">
                          <p className="font-medium text-xs text-[#f1f5f9] truncate">{friend.fullName}</p>
                          <p className="text-[10px] text-[#94a3b8] truncate">
                            {friend.gender || "Gender unspecified"}
                            {friend.dateOfBirth && ` | ${formatDob(friend.dateOfBirth)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectFriend(friend)}
                          className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors cursor-pointer bg-transparent border-none px-2 py-1 flex-shrink-0"
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-center mt-3 pt-2 border-t border-[#2a3a5c]/50">
                  <button
                    type="button"
                    onClick={handleAddNewPlayerCard}
                    className="w-full flex items-center justify-center font-semibold gap-1 py-2 text-xs border border-[#2a3a5c] hover:border-[#f97316] hover:text-[#f97316] text-[#94a3b8] rounded-lg transition-colors cursor-pointer bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <p>Add New Player</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Column ("Participant Details") */}
            <div className="flex-1 flex flex-col gap-3 rounded-lg w-full lg:w-2/3">
              <h3 className="font-semibold text-sm text-[#f1f5f9] text-left">Participant Details</h3>

              <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
                {addPlayerForms.map((form, idx) => (
                  <div
                    key={form.id}
                    className="p-4 rounded-lg flex flex-col gap-4 border border-dashed relative bg-[#141c2e]/60 transition-all text-left"
                    style={{ borderColor: "rgb(0, 186, 93)" }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePlayerCard(form.id)}
                        className="flex gap-1 items-center text-xs font-semibold text-[#ef4444] hover:text-red-400 bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* Profile Picture Slot */}
                      <div className="flex flex-col items-center w-40 flex-shrink-0">
                        <label className="mb-2 text-center text-xs text-[#94a3b8]">Profile Picture</label>
                        <div className="relative overflow-hidden rounded-full w-16 h-16 border-4 border-[#2a3a5c]">
                          <img
                            src={form.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media"}
                            className="w-full h-full object-cover"
                            alt="Profile"
                          />
                          <div className="absolute bottom-0 text-center w-full bg-black/50 py-0.5">
                            <label className="cursor-pointer text-[10px] font-bold text-white hover:text-[#f97316] flex items-center justify-center">
                              <Plus className="w-3 h-3 mx-auto" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, avatarUrl: url } : p));
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Inputs Fields Grid */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">
                            Player Name <span className="text-[#ef4444] font-semibold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={form.playerName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerName: val } : p));
                            }}
                            placeholder="Player Name"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">
                            Player Email <span className="text-[#ef4444] font-semibold">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={form.playerEmail}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerEmail: val } : p));
                            }}
                            placeholder="Player Email"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">
                            Category <span className="text-[#ef4444] font-semibold">*</span>
                          </label>
                          <select
                            required
                            value={form.categoryId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, categoryId: val } : p));
                            }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                          >
                            <option value="">Select Category...</option>
                            {playerCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.categoryType})</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">Match Type</label>
                          <select
                            value={form.matchType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matchType: val } : p));
                            }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                          >
                            <option value="SINGLES">Singles</option>
                            <option value="DOUBLES">Doubles</option>
                            <option value="MIXED">Mixed</option>
                          </select>
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">Age</label>
                          <input
                            type="number"
                            value={form.age}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 25;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, age: val } : p));
                            }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">Flat Number</label>
                          <input
                            type="text"
                            value={form.flatNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, flatNumber: val } : p));
                            }}
                            placeholder="e.g. A-102"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">Relation</label>
                          <select
                            value={form.relation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, relation: val } : p));
                            }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none"
                          >
                            <option value="SELF">Self</option>
                            <option value="SPOUSE">Spouse</option>
                            <option value="CHILD">Child</option>
                            <option value="PARENT">Parent</option>
                            <option value="SIBLING">Sibling</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="flex flex-col w-full gap-1 text-left">
                          <label className="text-xs text-[#94a3b8]">Primary Role</label>
                          <input
                            type="text"
                            value={form.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, role: val } : p));
                            }}
                            placeholder="e.g. Batsman, Keeper"
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Statistics */}
                    <div className="border-t border-[#2a3a5c]/40 pt-3">
                      <label className="text-[10px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2 block">Player Statistics (Optional)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="text-[9px] text-[#94a3b8] block mb-1">Matches</label>
                          <input type="number" value={form.matches}
                            onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matches: val } : p)); }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#94a3b8] block mb-1">Runs/Points</label>
                          <input type="number" value={form.runs}
                            onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, runs: val } : p)); }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#94a3b8] block mb-1">Wickets/Assists</label>
                          <input type="number" value={form.wickets}
                            onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, wickets: val } : p)); }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#94a3b8] block mb-1">Strike Rate</label>
                          <input type="number" step="0.1" value={form.strikeRate}
                            onChange={(e) => { const val = parseFloat(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, strikeRate: val } : p)); }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#94a3b8] block mb-1">Avg Score</label>
                          <input type="number" step="0.1" value={form.avgScore}
                            onChange={(e) => { const val = parseFloat(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, avgScore: val } : p)); }}
                            className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2 py-1 text-[10px] text-[#f1f5f9] focus:border-[#f97316] outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleAddNewPlayerCard}
                  className="w-full flex items-center justify-center font-semibold gap-1 py-3 text-sm border border-dashed border-[#10b981] hover:border-[#10b981]/80 text-[#10b981] bg-[#10b981]/5 hover:bg-[#10b981]/10 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Player</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#2a3a5c]">
            <button
              type="button"
              onClick={() => setShowAddPlayerModal(false)}
              className="flex-1 py-2.5 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-70 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Adding...</> : "Add Participants ↗"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
