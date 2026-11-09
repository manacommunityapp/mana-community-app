import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { kittyPartyService } from "../../services/kittyPartyService";
import type { KittyPartyGameRoom, KittyPartyTicket, KittyPartyWinnerClaim } from "../../types/kittyPartyTypes";

export const KittyPartyHousieRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);

  const [room, setRoom] = useState<KittyPartyGameRoom | null>(null);
  const [tickets, setTickets] = useState<KittyPartyTicket[]>([]);
  const [dabbedNumbers, setDabbedNumbers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [allowGuestPlayers, setAllowGuestPlayers] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    if (circleId) {
      loadGame();
    }
  }, [circleId]);

  const loadGame = async () => {
    try {
      setLoading(true);
      // Attempt to load existing room or details
      try {
        const details = await kittyPartyService.getRoomDetails(circleId);
        if (details?.id) {
          setRoom(details);
          const myTickets = await kittyPartyService.getMyTickets(details.id);
          setTickets(myTickets || []);
        }
      } catch {
        // No active room
      }
    } catch (e) {
      console.error("Failed to load Housie room", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newRoom = await kittyPartyService.createGameRoom(circleId, {
        roomName: roomNameInput.trim() || "Mana Queens Tambola Night",
        maxPlayers: 50,
        allowGuestPlayers,
      });
      setRoom(newRoom);
      setFeedback("Game room created! Click 'Get Ticket' to participate.");
    } catch (err: any) {
      setFeedback(err?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      setLoading(true);
      const joinedRoom = await kittyPartyService.joinGameRoomByCode(joinCodeInput.trim().toUpperCase());
      setRoom(joinedRoom);
      const myTickets = await kittyPartyService.getMyTickets(joinedRoom.id);
      setTickets(myTickets || []);
      setFeedback(`Successfully joined room "${joinedRoom.roomName}"!`);
    } catch (err: any) {
      setFeedback(err?.message || "Failed to join room by PIN code");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTicket = async () => {
    if (!room) return;
    try {
      const ticket = await kittyPartyService.generateTicket(room.id);
      setTickets((prev) => [...prev, ticket]);
      setFeedback("New Tambola ticket generated! You are ready to play.");
    } catch (err: any) {
      setFeedback(err?.message || "Failed to generate ticket");
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    try {
      await kittyPartyService.startGame(room.id);
      setFeedback("Game has started! Numbers can now be drawn.");
      refreshRoom();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to start game");
    }
  };

  const handleCallNumber = async () => {
    if (!room || isCalling) return;
    try {
      setIsCalling(true);
      const res = await kittyPartyService.callNextNumber(room.id);
      setFeedback(`Number called: ${res.calledNumber}!`);
      refreshRoom();
    } catch (err: any) {
      setFeedback(err?.message || "All numbers called or game over");
    } finally {
      setIsCalling(false);
    }
  };

  const handleClaim = async (ticketId: number, claimType: string) => {
    if (!room) return;
    try {
      const claim = await kittyPartyService.claimPrize(room.id, ticketId, claimType);
      setFeedback(`🎉 WINNER! Claim '${claim.claimType}' validated for ${claim.userName}!`);
      refreshRoom();
    } catch (err: any) {
      setFeedback(err?.message || "Claim validation failed");
    }
  };

  const refreshRoom = async () => {
    if (!room) return;
    try {
      const updated = await kittyPartyService.getRoomDetails(room.id);
      setRoom(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDab = (num: number) => {
    if (!num) return;
    setDabbedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const calledSet = new Set(room?.calledNumbers || []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading Housie game room...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={`/kitty-party/${circleId}`} className="text-xs font-semibold text-pink-600 hover:text-pink-700">
            ← Back to Circle
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">🎲 Mana Play – Live Housie / Tambola</h1>
          <p className="text-xs text-gray-500">
            90-ball multiplayer game with server-authoritative numbers and instant pattern validations.
          </p>
        </div>

        {room && (
          <div className="flex flex-wrap items-center gap-2">
            {room.roomCode && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-indigo-900">Room PIN:</span>
                <span className="font-mono text-sm font-extrabold tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded shadow-sm">
                  {room.roomCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room.roomCode!);
                    setFeedback("Room PIN copied to clipboard!");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                  title="Copy PIN"
                >
                  📋
                </button>
                {room.allowGuestPlayers && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    🌍 Guests Allowed
                  </span>
                )}
              </div>
            )}

            {tickets.length === 0 && room.status === "WAITING" && (
              <button
                onClick={handleGetTicket}
                className="px-4 py-2 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700"
              >
                + Get Free Ticket
              </button>
            )}

            {room.status === "WAITING" && (
              <button
                onClick={handleStartGame}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl text-xs shadow hover:bg-green-700"
              >
                ▶ Start Game
              </button>
            )}

            {room.status === "IN_PROGRESS" && (
              <button
                onClick={handleCallNumber}
                disabled={isCalling}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow hover:bg-indigo-700 transition"
              >
                🎲 Call Next Number
              </button>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-xl font-medium">
          {feedback}
        </div>
      )}

      {!room ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Create Room */}
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-2">🎟️</div>
              <h3 className="text-lg font-bold text-gray-800">Host New Housie Room</h3>
              <p className="text-xs text-gray-500 mt-1">
                Start a live Tambola session for your circle and invited guests.
              </p>

              <form onSubmit={handleCreateRoom} className="mt-4 space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Room Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunday Tambola Fun"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowGuestPlayers}
                    onChange={(e) => setAllowGuestPlayers(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    🌍 Allow Outside Guests via Room PIN
                  </span>
                </label>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700 mt-2"
                >
                  Create Game Room
                </button>
              </form>
            </div>
          </div>

          {/* Join By PIN */}
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-2">🔑</div>
              <h3 className="text-lg font-bold text-gray-800">Join via 6-Digit PIN</h3>
              <p className="text-xs text-gray-500 mt-1">
                Have a room code shared by a neighbor or friend? Join immediately!
              </p>

              <form onSubmit={handleJoinByCode} className="mt-4 space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Room Code / PIN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AB12CD"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono tracking-wider uppercase text-center font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow hover:bg-indigo-700 mt-4"
                >
                  Join Game by PIN
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Number Board & Tickets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Last Called Ball Banner */}
            <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-6 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
                  Last Called Number
                </span>
                <div className="text-5xl font-black mt-1">
                  {room.lastCalledNumber ? `#${room.lastCalledNumber}` : "Waiting..."}
                </div>
                <div className="text-xs text-indigo-200 mt-1">
                  Called: {room.calledNumbers.length} / 90 balls
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">
                  {room.status}
                </span>
                <div className="text-xs text-indigo-200 mt-2">Players: {room.activePlayersCount}</div>
              </div>
            </div>

            {/* 1–90 Caller Board */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                90-Ball Calling Board
              </h3>
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 text-center">
                {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
                  const isCalled = calledSet.has(n);
                  const isLatest = room.lastCalledNumber === n;
                  return (
                    <div
                      key={n}
                      className={`h-7 sm:h-8 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                        isLatest
                          ? "bg-pink-600 text-white shadow-md ring-2 ring-pink-300 animate-pulse"
                          : isCalled
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Tickets */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase">My Tickets ({tickets.length})</h3>
                {tickets.length === 0 && (
                  <button
                    onClick={handleGetTicket}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700"
                  >
                    + Get Ticket
                  </button>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  You haven't taken a ticket yet. Click 'Get Free Ticket' above!
                </div>
              ) : (
                tickets.map((t, idx) => (
                  <div key={t.ticketId} className="border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50/20">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                      <span>Ticket #{idx + 1}</span>
                      <span className="font-mono text-[10px] text-gray-400">{t.ticketHash.substring(0, 8)}...</span>
                    </div>

                    {/* 3x9 Matrix Grid */}
                    <div className="grid grid-cols-9 gap-1 bg-white p-2 rounded-xl border border-indigo-100 shadow-sm">
                      {t.matrix.flatMap((row, rIdx) =>
                        row.map((val, cIdx) => {
                          const isDabbed = dabbedNumbers.has(val);
                          const isCalled = val > 0 && calledSet.has(val);
                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              onClick={() => val > 0 && toggleDab(val)}
                              className={`h-9 sm:h-10 flex items-center justify-center rounded-lg font-bold text-xs select-none transition ${
                                val === 0
                                  ? "bg-gray-50 border border-gray-100"
                                  : isDabbed
                                  ? "bg-pink-600 text-white shadow ring-2 ring-pink-300 cursor-pointer"
                                  : isCalled
                                  ? "bg-green-100 text-green-800 border border-green-300 cursor-pointer"
                                  : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 cursor-pointer"
                              }`}
                            >
                              {val > 0 ? val : ""}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Claim Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-indigo-100">
                      {[
                        { type: "EARLY_FIVE", label: "Early 5" },
                        { type: "FOUR_CORNERS", label: "4 Corners" },
                        { type: "TOP_LINE", label: "Top Line" },
                        { type: "MIDDLE_LINE", label: "Mid Line" },
                        { type: "BOTTOM_LINE", label: "Bot Line" },
                        { type: "FULL_HOUSE", label: "Full House" },
                      ].map((claim) => (
                        <button
                          key={claim.type}
                          onClick={() => handleClaim(t.ticketId, claim.type)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                        >
                          Claim {claim.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Col: Winners & Leaderboard */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-3">🏆 Game Winners</h3>
              {room.winners.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No claims awarded yet. Keep dabbing your tickets!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {room.winners.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-pink-50/60 border border-pink-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-pink-900">{w.claimType.replace("_", " ")}</div>
                        <div className="text-[11px] text-gray-600 font-medium">Winner: {w.userName}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-800">
                        {w.claimStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tambola Rules Card */}
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-indigo-800">Winning Rules</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Early 5:</strong> Any 5 called numbers marked.</li>
                <li><strong>4 Corners:</strong> Top & bottom row corners.</li>
                <li><strong>Lines:</strong> All 5 numbers in a single horizontal row.</li>
                <li><strong>Full House:</strong> All 15 numbers completed!</li>
              </ul>
              <div className="pt-2 text-[10px] text-gray-400">
                Free-to-play social entertainment. No cash wagering.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KittyPartyHousieRoom;
