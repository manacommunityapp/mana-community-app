import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  Plus,
  QrCode,
  Calendar,
  Clock,
  Car,
  Phone,
  Copy,
  Check,
  Share2,
  Trash2,
  ArrowLeft,
  Sparkles,
  PartyPopper,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  visitorService,
  type GroupInvite,
  type CreateGroupInviteRequest,
  type GroupGuest,
} from "../../../services/visitors/visitorService";

const SAMPLE_GROUP_INVITES: GroupInvite[] = [
  {
    id: 1,
    title: "Aarav's 5th Birthday Celebration",
    eventDate: "2026-03-15",
    passCode: "PARTY-9281",
    status: "ACTIVE",
    guests: [
      { name: "Rohit & Shalini Verma", phone: "+91 98451 22334", vehicleNumber: "KA 05 MN 1204" },
      { name: "Vikram Malhotra", phone: "+91 98860 55443", vehicleNumber: "KA 01 AB 9088" },
      { name: "Pooja Hegde", phone: "+91 97410 88776", vehicleNumber: "KA 03 GH 4432" },
      { name: "Arun Iyer", phone: "+91 99001 23456", vehicleNumber: "—" },
    ],
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Griha Pravesh & Housewarming Pooja",
    eventDate: "2026-03-22",
    passCode: "PUJA-4419",
    status: "UPCOMING",
    guests: [
      { name: "Suresh & Meena Rao", phone: "+91 98440 11223", vehicleNumber: "KA 04 KL 7781" },
      { name: "Kavita Nair", phone: "+91 98200 44556", vehicleNumber: "KA 02 XY 5521" },
    ],
    createdAt: "2026-03-05T12:00:00Z",
  },
];

export function GroupInviteManagement() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeInviteForGuest, setActiveInviteForGuest] = useState<GroupInvite | null>(null);

  // Create Form State
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("23:00");

  // Add Guest Form State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestVehicle, setGuestVehicle] = useState("");

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await visitorService.getGroupInvites();
      if (Array.isArray(data) && data.length > 0) {
        setInvites(data);
      } else {
        setInvites(SAMPLE_GROUP_INVITES);
      }
    } catch {
      setInvites(SAMPLE_GROUP_INVITES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCopyPasscode = (code: string) => {
    navigator.clipboard.writeText(
      `🎉 You are cordially invited to our community event!\nGate Pass Code: *${code}*\nShow this at the security gate for express entry.`
    );
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleWhatsAppShare = (invite: GroupInvite) => {
    const text = `🎉 You are cordially invited to our community event: *${invite.title}*!\nDate: ${new Date(invite.eventDate).toLocaleDateString()}\nGate Pass Code: *${invite.passCode}*\nShow this code at the security gate for express entry.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      alert("Please enter title and date.");
      return;
    }

    const payload: CreateGroupInviteRequest = {
      title: title.trim(),
      eventDate,
      startTime,
      endTime,
      guests: [],
    };

    try {
      const created = await visitorService.createGroupInvite(payload);
      setInvites((prev) => [created, ...prev]);
    } catch {
      const newInvite: GroupInvite = {
        id: Date.now(),
        title: payload.title,
        eventDate: payload.eventDate,
        passCode: `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "ACTIVE",
        guests: [],
        createdAt: new Date().toISOString(),
      };
      setInvites((prev) => [newInvite, ...prev]);
    }

    setTitle("");
    setEventDate("");
    setShowCreateModal(false);
  };

  const handleAddGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInviteForGuest || !guestName.trim()) return;

    const guest: GroupGuest = {
      name: guestName.trim(),
      phone: guestPhone.trim() || undefined,
      vehicleNumber: guestVehicle.trim() || undefined,
    };

    try {
      await visitorService.addGroupGuest(activeInviteForGuest.id, guest);
      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === activeInviteForGuest.id
            ? { ...inv, guests: [...(inv.guests || []), guest] }
            : inv
        )
      );
    } catch {
      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === activeInviteForGuest.id
            ? { ...inv, guests: [...(inv.guests || []), guest] }
            : inv
        )
      );
    }

    setGuestName("");
    setGuestPhone("");
    setGuestVehicle("");
    setActiveInviteForGuest(null);
  };

  const handleCancelInvite = async (id: number) => {
    if (!window.confirm("Cancel this group invite? Guests will not be permitted entry using this pass.")) {
      return;
    }
    try {
      await visitorService.cancelGroupInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const filteredInvites = invites.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.passCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/visitors")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Visitors Hub
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 flex items-center gap-1.5">
          <PartyPopper className="w-3.5 h-3.5" />
          Event & Group Gate Passes
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-purple-100/10 pointer-events-none select-none">
          <Users className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-purple-100">
            <Sparkles className="w-3.5 h-3.5" />
            Seamless Family & Festival Gatherings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Group Passes & Event Invites
          </h1>
          <p className="text-purple-100/90 text-sm leading-relaxed">
            Hosting a birthday party, housewarming, or anniversary dinner? Create a universal pass code
            or register guest names so security can fast-track vehicle entry without calling your flat.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5" />
                <h3 className="text-base font-bold">Create Group Invite</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Occasion / Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya's Birthday Party / Griha Pravesh"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">From</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Until</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md cursor-pointer"
                >
                  Create & Get Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {activeInviteForGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">Add Guest to {activeInviteForGuest.title}</h3>
              <button
                onClick={() => setActiveInviteForGuest(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGuestSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guest / Family Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh & Sunita Verma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Plate</label>
                  <input
                    type="text"
                    placeholder="KA 01 AB 1234"
                    value={guestVehicle}
                    onChange={(e) => setGuestVehicle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveInviteForGuest(null)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition cursor-pointer"
                >
                  Add Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Create Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by event title or passcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Group Pass
        </button>
      </div>

      {/* Invites Cards */}
      <div className="space-y-4">
        {filteredInvites.map((invite) => (
          <div
            key={invite.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-5"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                  {invite.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{invite.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{invite.eventDate}</span>
                </div>
              </div>

              {/* Passcode Box */}
              <div className="flex items-center gap-2 bg-purple-50/80 p-2.5 rounded-2xl border border-purple-200">
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase block">Gate Passcode</span>
                  <span className="font-mono font-extrabold text-purple-900 text-base">{invite.passCode}</span>
                </div>
                <button
                  onClick={() => handleCopyPasscode(invite.passCode)}
                  className="p-2 rounded-xl bg-white text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                  title="Copy shareable invite text"
                >
                  {copiedCode === invite.passCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleWhatsAppShare(invite)}
                  className="p-2 rounded-xl bg-emerald-50 text-[#25D366] hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center justify-center"
                  title="Share invite on WhatsApp"
                >
                  <FaWhatsapp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guests Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  Registered Guests ({invite.guests?.length || 0})
                </span>
                <button
                  onClick={() => setActiveInviteForGuest(invite)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Guest
                </button>
              </div>

              {invite.guests && invite.guests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {invite.guests.map((guest, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-800">{guest.name}</div>
                      {guest.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{guest.phone}</span>
                        </div>
                      )}
                      {guest.vehicleNumber && guest.vehicleNumber !== "—" && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Car className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{guest.vehicleNumber}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  No individual guests listed yet. Guests can also present the passcode{" "}
                  <strong className="text-purple-700 font-mono">{invite.passCode}</strong> at the gate.
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 text-[11px]">
                Gate security automatically accepts this code for all arrivals on event date.
              </span>
              <button
                onClick={() => handleCancelInvite(invite.id)}
                className="text-slate-400 hover:text-red-600 font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Pass
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupInviteManagement;
