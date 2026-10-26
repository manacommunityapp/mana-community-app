import { useState, useEffect, useCallback } from "react";
import {
  Car, MapPin, Clock, Users, Leaf, Search, Plus, Star,
  ChevronRight, Calendar, ArrowRight, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  commuteService,
  type CommuteRide,
  type CommuteStats,
} from "../../../services/commute/commuteService";

const TABS = ["Find Rides", "Offer a Ride", "My Rides"] as const;
const FILTERS = ["Morning", "Evening", "Ladies Only"];
const RIDE_TYPES = ["CARPOOL", "DROP", "PICKUP"];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function isMorning(iso: string) {
  try {
    return new Date(iso).getHours() < 12;
  } catch {
    return false;
  }
}

export function CommuteDashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Find Rides");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [stats, setStats] = useState<CommuteStats | null>(null);
  const [rides, setRides] = useState<CommuteRide[]>([]);
  const [myOffers, setMyOffers] = useState<CommuteRide[]>([]);
  const [myBookings, setMyBookings] = useState<CommuteRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offer form
  const [offerFrom, setOfferFrom] = useState("Mana Community");
  const [offerTo, setOfferTo] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerTime, setOfferTime] = useState("");
  const [offerSeats, setOfferSeats] = useState(3);
  const [offerPrice, setOfferPrice] = useState(80);
  const [offerType, setOfferType] = useState("CARPOOL");
  const [offerLadiesOnly, setOfferLadiesOnly] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const [bookingRideId, setBookingRideId] = useState<number | null>(null);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const loadStats = useCallback(async () => {
    try {
      const s = await commuteService.getStats();
      setStats(s);
    } catch {
      // stats failure is non-critical
    }
  }, []);

  const loadRides = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = q.trim()
        ? await commuteService.searchRides(q)
        : await commuteService.getUpcomingRides();
      setRides(res.content);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [offers, bookings] = await Promise.all([
        commuteService.getMyOffers(),
        commuteService.getMyBookings(),
      ]);
      setMyOffers(offers.content);
      setMyBookings(bookings.content);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load your rides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === "Find Rides") loadRides(search);
    if (tab === "My Rides") loadMyRides();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (tab !== "Find Rides") return;
    const t = setTimeout(() => loadRides(search), 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredRides = rides.filter((r) => {
    if (activeFilters.includes("Ladies Only") && !r.ladiesOnly) return false;
    if (activeFilters.includes("Morning") && !isMorning(r.departureTime)) return false;
    if (activeFilters.includes("Evening") && isMorning(r.departureTime)) return false;
    return true;
  });

  async function handleBook(rideId: number) {
    setBookingRideId(rideId);
    try {
      await commuteService.bookRide(rideId);
      await loadRides(search);
      await loadStats();
    } catch (e: any) {
      alert(e?.message ?? "Booking failed");
    } finally {
      setBookingRideId(null);
    }
  }

  async function handleCancelBooking(rideId: number) {
    try {
      await commuteService.cancelBooking(rideId);
      await loadMyRides();
      await loadStats();
    } catch (e: any) {
      alert(e?.message ?? "Cancellation failed");
    }
  }

  async function handleCancelOffer(rideId: number) {
    try {
      await commuteService.cancelRide(rideId);
      await loadMyRides();
      await loadStats();
    } catch (e: any) {
      alert(e?.message ?? "Failed to cancel offer");
    }
  }

  async function handlePublishRide() {
    if (!offerTo.trim() || !offerDate || !offerTime) {
      alert("Please fill in destination, date, and time.");
      return;
    }
    setOfferSubmitting(true);
    try {
      const departureTime = `${offerDate}T${offerTime}:00`;
      await commuteService.createRide({
        fromLocation: offerFrom,
        toLocation: offerTo,
        departureTime,
        rideType: offerType,
        totalSeats: offerSeats,
        pricePerSeat: offerPrice,
        free: offerPrice === 0,
        ladiesOnly: offerLadiesOnly,
      });
      setOfferSuccess(true);
      setOfferTo("");
      setOfferDate("");
      setOfferTime("");
      await loadStats();
      setTimeout(() => setOfferSuccess(false), 3000);
    } catch (e: any) {
      alert(e?.message ?? "Failed to publish ride");
    } finally {
      setOfferSubmitting(false);
    }
  }

  const statCards = [
    { label: "Active Rides", value: stats?.activeRides ?? "—", icon: Car, color: "#3b82f6" },
    { label: "My Bookings", value: stats?.myBookedRides ?? "—", icon: Users, color: "#10b981" },
    { label: "My Offers", value: stats?.myOfferedRides ?? "—", icon: Leaf, color: "#22c55e" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Car size={22} style={{ color: "#3b82f6" }} />
        </div>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Community Rides</h4>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Share rides, save money, reduce emissions</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
            <s.icon size={14} style={{ color: s.color }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8,
            border: `1px solid ${tab === t ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: tab === t ? "rgba(212,160,23,0.1)" : "transparent",
            color: tab === t ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#ef4444", flex: 1 }}>{error}</span>
          <button onClick={() => tab === "My Rides" ? loadMyRides() : loadRides(search)} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* ── Find Rides ── */}
      {tab === "Find Rides" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search destination..."
                style={{ width: "100%", padding: "8px 8px 8px 30px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => toggleFilter(f)} style={{
                fontSize: 10, fontWeight: 600, padding: "6px 12px", borderRadius: 6,
                border: `1px solid ${activeFilters.includes(f) ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
                background: activeFilters.includes(f) ? "rgba(212,160,23,0.08)" : "transparent",
                color: activeFilters.includes(f) ? "var(--gold)" : "var(--muted)", cursor: "pointer",
              }}>{f}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading rides…</div>
          ) : filteredRides.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No rides found{search ? ` for "${search}"` : ""}.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRides.map((r) => (
                <div key={r.id} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: r.driverPhoto ? undefined : "rgba(148,163,184,0.12)", backgroundImage: r.driverPhoto ? `url(${r.driverPhoto})` : undefined, backgroundSize: "cover", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--muted)", flexShrink: 0 }}>
                    {!r.driverPhoto && initials(r.driverName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {r.driverName}
                      {r.driverFlat && <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>{r.driverFlat}</span>}
                      <span style={{ fontSize: 10, color: "#f59e0b", display: "flex", alignItems: "center", gap: 2 }}>
                        <Star size={10} fill="#f59e0b" />{r.driverRating.toFixed(1)}
                      </span>
                      {r.ladiesOnly && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(236,72,153,0.1)", color: "#ec4899" }}>Ladies Only</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MapPin size={10} />{r.fromLocation} <ArrowRight size={10} /> {r.toLocation}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} />{formatTime(r.departureTime)}</span>
                      {r.vehicleType && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Car size={10} />{r.vehicleType}{r.vehicleNumber ? ` · ${r.vehicleNumber}` : ""}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.free ? (
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#10b981" }}>Free</div>
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>₹{r.pricePerSeat}</div>
                    )}
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{r.availableSeats} seat{r.availableSeats !== 1 ? "s" : ""} left</div>
                    {r.isMyRide ? (
                      <span style={{ display: "block", marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(148,163,184,0.1)", color: "var(--muted)" }}>Your ride</span>
                    ) : r.hasBooked ? (
                      <button onClick={() => handleCancelBooking(r.id)} style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>Cancel</button>
                    ) : r.availableSeats === 0 ? (
                      <span style={{ display: "block", marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(148,163,184,0.1)", color: "var(--muted)" }}>Full</span>
                    ) : (
                      <button onClick={() => handleBook(r.id)} disabled={bookingRideId === r.id} style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 6, background: bookingRideId === r.id ? "rgba(212,160,23,0.5)" : "var(--gold)", color: "#000", border: "none", cursor: bookingRideId === r.id ? "not-allowed" : "pointer" }}>
                        {bookingRideId === r.id ? "…" : "Book"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Offer a Ride ── */}
      {tab === "Offer a Ride" && (
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 24, maxWidth: 500 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Publish a New Ride</h3>

          {offerSuccess && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 14, fontSize: 12, color: "#10b981" }}>
              Ride published! Residents can now book seats.
            </div>
          )}

          {[
            { label: "From", value: offerFrom, onChange: setOfferFrom, readOnly: true, placeholder: "Mana Community" },
            { label: "To", value: offerTo, onChange: setOfferTo, readOnly: false, placeholder: "Destination" },
          ].map(({ label, value, onChange, readOnly, placeholder }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>{label}</label>
              <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: readOnly ? "rgba(148,163,184,0.04)" : "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Date</label>
              <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Time</label>
              <input type="time" value={offerTime} onChange={(e) => setOfferTime(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Seats</label>
              <input type="number" min={1} max={8} value={offerSeats} onChange={(e) => setOfferSeats(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Price/seat (₹)</label>
              <input type="number" min={0} value={offerPrice} onChange={(e) => setOfferPrice(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Ride Type</label>
            <select value={offerType} onChange={(e) => setOfferType(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }}>
              {RIDE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer", fontSize: 12, color: "var(--text)" }}>
            <input type="checkbox" checked={offerLadiesOnly} onChange={(e) => setOfferLadiesOnly(e.target.checked)} />
            Ladies Only
          </label>

          <button onClick={handlePublishRide} disabled={offerSubmitting}
            style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: offerSubmitting ? "rgba(212,160,23,0.5)" : "var(--gold)", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: offerSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} />{offerSubmitting ? "Publishing…" : "Publish Ride"}
          </button>
        </div>
      )}

      {/* ── My Rides ── */}
      {tab === "My Rides" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading…</div>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>My Bookings</h3>
              {myBookings.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>No bookings yet.</div>
              ) : myBookings.map((r) => (
                <div key={r.id} style={{ padding: 14, borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{r.fromLocation} → {r.toLocation}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Driver: {r.driverName} · {formatTime(r.departureTime)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {!r.free && <span style={{ fontSize: 13, fontWeight: 700 }}>₹{r.pricePerSeat}</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: r.myBookingStatus === "CONFIRMED" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)", color: r.myBookingStatus === "CONFIRMED" ? "#10b981" : "var(--muted)" }}>
                      {r.myBookingStatus ?? r.status}
                    </span>
                    {r.myBookingStatus !== "CONFIRMED" && r.status !== "CANCELLED" && (
                      <button onClick={() => handleCancelBooking(r.id)} style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer" }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}

              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "18px 0 10px" }}>My Offers</h3>
              {myOffers.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>No offered rides yet.</div>
              ) : myOffers.map((r) => (
                <div key={r.id} style={{ padding: 14, borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{r.fromLocation} → {r.toLocation}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{formatTime(r.departureTime)} · {r.bookingCount}/{r.totalSeats} booked</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: r.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)", color: r.status === "ACTIVE" ? "#10b981" : "var(--muted)" }}>{r.status}</span>
                    {r.status === "ACTIVE" && (
                      <button onClick={() => handleCancelOffer(r.id)} style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer" }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
