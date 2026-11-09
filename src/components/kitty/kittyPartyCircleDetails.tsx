import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { kittyPartyService } from "../../services/kittyPartyService";
import type { KittyPartyCircleSummary, KittyPartyMember } from "../../types/kittyPartyTypes";
import { KittyPartyEventView } from "./kittyPartyEventView";
import { KittyPartyFeedView } from "./kittyPartyFeedView";
import { KittyPartyLeaderboardView } from "./kittyPartyLeaderboardView";
import { KittyPartyVendorPackagesView } from "./kittyPartyVendorPackagesView";

export const KittyPartyCircleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const circleId = Number(id);

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "FEED" | "EVENTS" | "LEADERBOARD" | "VENDORS">("OVERVIEW");
  const [circle, setCircle] = useState<KittyPartyCircleSummary | null>(null);
  const [members, setMembers] = useState<KittyPartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitePhone, setInvitePhone] = useState("");
  const [isExternalGuest, setIsExternalGuest] = useState(false);
  const [externalSociety, setExternalSociety] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (circleId) {
      loadDetails();
    }
  }, [circleId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [circleData, membersData] = await Promise.all([
        kittyPartyService.getCircleDetails(circleId),
        kittyPartyService.getCircleMembers(circleId),
      ]);
      setCircle(circleData);
      setMembers(membersData);
    } catch (e) {
      console.error("Failed to load circle details", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) return;
    try {
      const res = await kittyPartyService.inviteMember(
        circleId,
        undefined,
        invitePhone.trim(),
        isExternalGuest,
        isExternalGuest ? externalSociety.trim() : undefined
      );
      if (res?.inviteToken) {
        setInviteToken(res.inviteToken);
        setActionMsg("Invitation generated! Share the token or link with your friend.");
        loadDetails();
      }
    } catch (e: any) {
      setActionMsg(e?.message || "Failed to generate invitation");
    }
  };

  const handleJoin = async () => {
    try {
      await kittyPartyService.requestToJoin(circleId, "Hi! I would like to join this circle.");
      setActionMsg("Join request submitted to circle admin!");
      loadDetails();
    } catch (e: any) {
      setActionMsg(e?.message || "Failed to request join");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading circle details...</div>;
  }

  if (!circle) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Circle Not Found</h2>
        <Link to="/kitty-party" className="text-pink-600 text-sm mt-2 inline-block">
          ← Back to Circles
        </Link>
      </div>
    );
  }

  const isMember = !!circle.currentUserRole;
  const isAdminOrOwner = circle.currentUserRole === "OWNER" || circle.currentUserRole === "ADMIN";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Circle Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800">
                {circle.categoryCode}
              </span>
              <span className="text-xs text-gray-400 uppercase font-medium">
                {circle.privacyType.replace("_", " ")}
              </span>
              {circle.currentUserRole && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                  Role: {circle.currentUserRole}
                </span>
              )}
              {circle.allowExternalMembers && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  🌍 Guests Allowed ({circle.externalMembersCount || 0}/{circle.maxExternalMembers || 0})
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{circle.circleName}</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{circle.description || "Active community circle."}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isMember ? (
              <button
                onClick={handleJoin}
                className="px-5 py-2 bg-pink-600 text-white font-bold rounded-xl text-sm shadow hover:bg-pink-700 transition"
              >
                Request to Join
              </button>
            ) : (
              <>
                {isAdminOrOwner && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-pink-50 text-pink-700 font-semibold rounded-xl text-sm border border-pink-200 hover:bg-pink-100"
                  >
                    + Invite Friend
                  </button>
                )}
                <Link
                  to={`/kitty-party/${circleId}/ledger`}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-purple-700 transition"
                >
                  💰 Kitty Ledger
                </Link>
                <Link
                  to={`/kitty-party/${circleId}/housie`}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-indigo-700 transition"
                >
                  🎲 Mana Play (Tambola)
                </Link>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hey neighbor! Join our "${circle.circleName}" circle on Mana Community App: ${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition"
                  title="Share on WhatsApp"
                >
                  <span>💬 Share WhatsApp</span>
                </a>
              </>
            )}
          </div>
        </div>

        {actionMsg && (
          <div className="mt-4 p-3 bg-pink-50 border border-pink-200 text-pink-800 text-xs rounded-xl">
            {actionMsg}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === "OVERVIEW"
              ? "border-pink-600 text-pink-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Circle Overview
        </button>
        <button
          onClick={() => setActiveTab("FEED")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "FEED"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>💬</span> Discussion Feed & Announcements
        </button>
        <button
          onClick={() => setActiveTab("EVENTS")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "EVENTS"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>🎉</span> Gatherings & RSVP
        </button>
        <button
          onClick={() => setActiveTab("LEADERBOARD")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "LEADERBOARD"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>🏆</span> Leaderboard & Trophies
        </button>
        <button
          onClick={() => setActiveTab("VENDORS")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "VENDORS"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <span>🛍️</span> Party Vendors & Packages
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "FEED" ? (
        <KittyPartyFeedView circleId={circleId} isAdmin={isAdminOrOwner} />
      ) : activeTab === "EVENTS" ? (
        <KittyPartyEventView circleId={circleId} isAdmin={isAdminOrOwner} />
      ) : activeTab === "LEADERBOARD" ? (
        <KittyPartyLeaderboardView circleId={circleId} />
      ) : activeTab === "VENDORS" ? (
        <KittyPartyVendorPackagesView circleId={circleId} />
      ) : (
        /* Main Grid: Modules & Members */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Features */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Kitty Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-2">👛</div>
                <h3 className="font-bold text-gray-900 text-base">Monthly Kitty & Savings</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Rotating monthly collection ledger, payment tracking, and disbursement receipts (Record-Only mode).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link
                  to={`/kitty-party/${circleId}/ledger`}
                  className="text-xs font-bold text-pink-600 hover:text-pink-700"
                >
                  Open Kitty Ledger →
                </Link>
              </div>
            </div>

            {/* Housie Game Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-2">🎟️</div>
                <h3 className="font-bold text-gray-900 text-base">Housie / Tambola Rooms</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Live 90-ball Tambola game with automatic number calling, ticket dabbing, and instant prize validations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link
                  to={`/kitty-party/${circleId}/housie`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Go to Game Rooms →
                </Link>
              </div>
            </div>
          </div>

          {/* Party Expenses & Bill Split */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-base">Party Expenses & Bill Splitting</h3>
              <Link
                to={`/kitty-party/${circleId}/expenses`}
                className="text-xs font-bold text-pink-600 hover:text-pink-700"
              >
                Manage Expenses →
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              Track food, venue, decoration, and cake expenditures for monthly gatherings. Split costs equally among attendees and verify member settlements.
            </p>
          </div>
        </div>

        {/* Right Column: Members Directory */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">Circle Members ({members.length})</h3>
            <span className="text-xs text-gray-400">Max: {circle.maxMembers || "∞"}</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {members.map((m) => (
              <div key={m.memberId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center">
                    {m.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      {m.fullName}
                      {m.isExternal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Guest
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      {m.isExternal ? (
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1 rounded">
                          🌍 {m.externalSocietyName || "External Friend"} {m.sponsorName ? `(via ${m.sponsorName})` : ""}
                        </span>
                      ) : m.flatUnit ? (
                        <span className="font-medium text-pink-600 bg-pink-50 px-1 rounded">🏢 {m.flatUnit}</span>
                      ) : (
                        <span>{m.phone || "Resident"}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {m.roleCode}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Invite Friend to Circle</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Friend's Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {circle.allowExternalMembers && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExternalGuest}
                      onChange={(e) => setIsExternalGuest(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      🌍 Invite as Outside-of-Community Guest
                    </span>
                  </label>
                  {isExternalGuest && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        Friend's Society / Area (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Palm Meadows / Whitefield"
                        value={externalSociety}
                        onChange={(e) => setExternalSociety(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        You will be recorded as this guest's community sponsor.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {inviteToken && (
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-pink-900">Invite Token Created:</div>
                  <div className="font-mono text-gray-700 break-all select-all">{inviteToken}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KittyPartyCircleDetails;
