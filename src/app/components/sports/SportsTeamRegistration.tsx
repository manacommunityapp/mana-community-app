import { useState, useEffect, useCallback } from "react";
import { Users, X, Search, Crown, UserPlus, Check, AlertCircle } from "lucide-react";
import { sportsEventService } from "../../../services/sports/sportsEventService";
import { playerCategoryService } from "../../../services/sports/playerCategoryService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import type { UserResponse, PlayerCategory } from "../../../types/api";

interface SportsEvent {
  id: number;
  name: string;
  status: string;
  communityId?: number;
  categories?: PlayerCategory[];
}

interface Props {
  eventId: number;
  event?: SportsEvent;
  onClose?: () => void;
  onSuccess?: () => void;
}

const TEAM_EMOJIS = ["🏏", "⚡", "🔥", "🦁", "🐯", "🦅", "🐍", "🎯", "💪", "🏆", "⭐", "🌟", "🎖️", "🛡️", "⚔️", "🐺"];

export function SportsTeamRegistration({ eventId, event, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [logoEmoji, setLogoEmoji] = useState("🏏");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserResponse[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    playerCategoryService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });
  }, []);

  const searchMembers = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const communityId = (user as any)?.communityId ?? event?.communityId;
      const results = communityId
        ? await userService.searchUsers(communityId, q)
        : await userService.searchUsersGlobal(q);
      const selectedIds = new Set(selectedMembers.map((m) => m.id));
      setSearchResults(results.filter((r) => !selectedIds.has(r.id)));
    } catch { setSearchResults([]); }
    setSearching(false);
  }, [selectedMembers, user, event]);

  useEffect(() => {
    const timer = setTimeout(() => searchMembers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMembers]);

  const addMember = (member: UserResponse) => {
    setSelectedMembers((prev) => [...prev, member]);
    setSearchResults((prev) => prev.filter((r) => r.id !== member.id));
    setSearchQuery("");
    if (selectedMembers.length === 0) setCaptainId(member.id);
  };

  const removeMember = (id: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
    if (captainId === id) setCaptainId(selectedMembers.find((m) => m.id !== id)?.id ?? null);
  };

  const submit = async () => {
    setError("");
    if (!teamName.trim()) { setError("Team name is required"); return; }
    if (selectedMembers.length < 2) { setError("Add at least 2 team members"); return; }
    if (!categoryId) { setError("Select a category"); return; }

    setSubmitting(true);
    try {
      await sportsEventService.registerTeam({
        eventId,
        categoryId,
        teamName: teamName.trim(),
        logoEmoji,
        memberUserIds: selectedMembers.map((m) => m.id),
        captainUserId: captainId ?? undefined,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Registration failed");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Check size={28} color="#16a34a" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Team Registered!</h3>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          {logoEmoji} <strong>{teamName}</strong> with {selectedMembers.length} members has been registered.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "#4f46e5", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Register Team</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{event?.name ?? `Event #${eventId}`}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Team Name + Emoji */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Team Name</label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {logoEmoji}
            </button>
            {showEmojiPicker && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4 }}>
                {TEAM_EMOJIS.map((e) => (
                  <button key={e} onClick={() => { setLogoEmoji(e); setShowEmojiPicker(false); }} style={{ width: 36, height: 36, borderRadius: 6, border: e === logoEmoji ? "2px solid #6366f1" : "1px solid transparent", background: e === logoEmoji ? "#eef2ff" : "transparent", fontSize: 20, cursor: "pointer" }}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            maxLength={100}
            style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 12px", fontSize: 14, outline: "none" }}
          />
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Category</label>
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 12px", fontSize: 14, background: "#fff", outline: "none" }}
        >
          <option value="" disabled>Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Member Search */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
          Team Members ({selectedMembers.length})
        </label>
        <div style={{ position: "relative" }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name..."
            style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 12px 0 36px", fontSize: 14, outline: "none" }}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginTop: 4, maxHeight: 180, overflowY: "auto", background: "#fff" }}>
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => addMember(r)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <UserPlus size={14} color="#6366f1" />
                <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{r.fullName}</span>
                {r.flatNo && <span style={{ fontSize: 11, color: "#94a3b8" }}>• {r.flatNo}</span>}
              </button>
            ))}
          </div>
        )}
        {searching && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Searching...</p>}
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {selectedMembers.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                background: captainId === m.id ? "#eef2ff" : "#f8fafc",
                border: captainId === m.id ? "1px solid #c7d2fe" : "1px solid #f1f5f9",
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{m.fullName}</span>
              <button
                onClick={() => setCaptainId(m.id)}
                style={{
                  background: captainId === m.id ? "#6366f1" : "transparent",
                  color: captainId === m.id ? "#fff" : "#94a3b8",
                  border: captainId === m.id ? "none" : "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
                title="Set as captain"
              >
                <Crown size={12} /> {captainId === m.id ? "Captain" : "Set Captain"}
              </button>
              <button
                onClick={() => removeMember(m.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={submitting || selectedMembers.length < 2 || !teamName.trim() || !categoryId}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          background: submitting ? "#a5b4fc" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff",
          border: "none",
          fontWeight: 700,
          fontSize: 14,
          cursor: submitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: (selectedMembers.length < 2 || !teamName.trim() || !categoryId) ? 0.5 : 1,
        }}
      >
        <Users size={16} />
        {submitting ? "Registering..." : `Register Team (${selectedMembers.length} members)`}
      </button>
    </div>
  );
}
