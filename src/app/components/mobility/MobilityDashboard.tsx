import { useState, useEffect, useCallback, useRef } from "react";
import {
  Car, MapPin, Users, Clock, Star, Search, ChevronRight,
  ArrowRight, Navigation, Shield, Wallet, AlertCircle,
  RefreshCw, Bike, Bus, Zap, Package,
} from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";

// ── Types ──────────────────────────────────────────────────────────────────

interface GeoPoint { lat: number; lng: number; address: string }

interface TripDriver {
  driverId: number;
  driverName: string;
  phone?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  rating?: number;
}

interface MobilityTrip {
  id: number;
  tripRef: string;
  serviceType: string;
  status: string;
  pickup: GeoPoint;
  destination: GeoPoint;
  quotedTotal?: number;
  finalFare?: number;
  distanceKm?: number;
  etaMinutes?: number;
  driver?: TripDriver;
  passengerRating?: number;
  requestedAt: string;
}

interface FareQuote {
  quoteId: string;
  serviceType: string;
  baseFare: number;
  distanceFare: number;
  taxes: number;
  total: number;
  distanceKm: number;
  etaMinutes: number;
  expiresAt: number;
}

interface CarpoolOffer {
  id: number;
  driverName: string;
  rating: number;
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  vehicleModel?: string;
  vehicleNumber?: string;
}

interface PageResponse<T> { content: T[]; totalElements: number }

interface MobilityStats {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalSpend: number;
  avgRating: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  CARPOOL:    <Users size={16} />,
  GROUP_RIDE: <Bus size={16} />,
  BIKE:       <Bike size={16} />,
  AUTO:       <Zap size={16} />,
  CAB:        <Car size={16} />,
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED:       "#f59e0b",
  SEARCHING:       "#3b82f6",
  ASSIGNED:        "#8b5cf6",
  DRIVER_ARRIVING: "#06b6d4",
  ARRIVED:         "#10b981",
  PICKED_UP:       "#10b981",
  IN_PROGRESS:     "#10b981",
  COMPLETED:       "#6b7280",
  CANCELLED:       "#ef4444",
  NO_DRIVER_FOUND: "#ef4444",
  EXPIRED:         "#ef4444",
};

const TABS = ["Book a Ride", "Carpool Offers", "My Trips", "Stats"] as const;
type Tab = typeof TABS[number];

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

function fmtCurrency(n?: number) {
  if (n == null) return "—";
  return `₹${Number(n).toFixed(0)}`;
}

// ── Main component ─────────────────────────────────────────────────────────

export function MobilityDashboard() {
  const [tab, setTab] = useState<Tab>("Book a Ride");

  // Book form
  const [pickup, setPickup]     = useState("");
  const [dest, setDest]         = useState("");
  const [quotes, setQuotes]     = useState<FareQuote[]>([]);
  const [quoteLoading, setQL]   = useState(false);
  const [quoteError, setQE]     = useState<string | null>(null);
  const [selectedQuote, setSQ]  = useState<FareQuote | null>(null);
  const [booking, setBooking]   = useState(false);
  const [bookSuccess, setBS]    = useState<MobilityTrip | null>(null);
  const [payment, setPayment]   = useState("CASH");

  // Carpool
  const [carpoolOffers, setCO]  = useState<CarpoolOffer[]>([]);
  const [carpoolSearch, setCS]  = useState("");
  const [carpoolLoading, setCL] = useState(false);
  const [carpoolError, setCE]   = useState<string | null>(null);
  const [joiningId, setJI]      = useState<number | null>(null);

  // My trips
  const [trips, setTrips]       = useState<MobilityTrip[]>([]);
  const [tripsLoading, setTL]   = useState(false);
  const [tripsError, setTE]     = useState<string | null>(null);

  // Stats
  const [stats, setStats]       = useState<MobilityStats | null>(null);

  // Active trip poll
  const [activeTrip, setAT]     = useState<MobilityTrip | null>(null);
  const pollRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActiveTrip = useCallback(async () => {
    try {
      const t = await apiClient.get<MobilityTrip>("/mobility/trips/active");
      setAT(t);
    } catch {
      setAT(null);
    }
  }, []);

  useEffect(() => {
    loadActiveTrip();
    pollRef.current = setInterval(loadActiveTrip, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadActiveTrip]);

  const loadTrips = useCallback(async () => {
    setTL(true); setTE(null);
    try {
      const res = await apiClient.get<PageResponse<MobilityTrip>>("/mobility/trips/history?size=30");
      setTrips(res.content);
    } catch (e: any) { setTE(e?.message ?? "Failed to load trips"); }
    finally { setTL(false); }
  }, []);

  const loadCarpool = useCallback(async (q = "") => {
    setCL(true); setCE(null);
    try {
      const url = q ? `/mobility/carpool/offers?destination=${encodeURIComponent(q)}&size=20` : "/mobility/carpool/offers?size=20";
      const res = await apiClient.get<PageResponse<CarpoolOffer>>(url);
      setCO(res.content);
    } catch (e: any) { setCE(e?.message ?? "Failed to load carpool offers"); }
    finally { setCL(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await apiClient.get<MobilityStats>("/mobility/stats")); }
    catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (tab === "My Trips")       loadTrips();
    if (tab === "Carpool Offers") loadCarpool();
    if (tab === "Stats")          loadStats();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced carpool search
  useEffect(() => {
    if (tab !== "Carpool Offers") return;
    const t = setTimeout(() => loadCarpool(carpoolSearch), 400);
    return () => clearTimeout(t);
  }, [carpoolSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchQuotes() {
    if (!pickup.trim() || !dest.trim()) return;
    setQL(true); setQE(null); setQuotes([]); setSQ(null); setBS(null);
    try {
      const types = ["CARPOOL", "GROUP_RIDE"];
      const results = await Promise.allSettled(
        types.map(serviceType =>
          apiClient.post<FareQuote>("/mobility/fare-quote", {
            serviceType,
            pickupLat: 0, pickupLng: 0,
            destLat: 0.1, destLng: 0.1,
            pickupAddress: pickup,
            destAddress: dest,
          })
        )
      );
      const ok = results
        .filter((r): r is PromiseFulfilledResult<FareQuote> => r.status === "fulfilled")
        .map(r => r.value);
      if (ok.length === 0) throw new Error("No fares available for this route");
      setQuotes(ok);
      setSQ(ok[0]);
    } catch (e: any) { setQE(e?.message ?? "Could not fetch fares"); }
    finally { setQL(false); }
  }

  async function handleBook() {
    if (!selectedQuote) return;
    setBooking(true);
    try {
      const trip = await apiClient.post<MobilityTrip>("/mobility/trips", {
        serviceType:    selectedQuote.serviceType,
        pickupLat: 0, pickupLng: 0,
        pickupAddress:  pickup,
        destLat: 0.1, destLng: 0.1,
        destAddress:    dest,
        quoteId:        selectedQuote.quoteId,
        paymentMethod:  payment,
        idempotencyKey: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
      setBS(trip);
      setAT(trip);
      setQuotes([]); setSQ(null);
    } catch (e: any) { setQE(e?.message ?? "Booking failed"); }
    finally { setBooking(false); }
  }

  async function joinCarpool(offerId: number) {
    setJI(offerId);
    try {
      await apiClient.post(`/mobility/carpool/offers/${offerId}/join`, { seats: 1 });
      await loadCarpool(carpoolSearch);
    } catch (e: any) { alert(e?.message ?? "Could not join carpool"); }
    finally { setJI(null); }
  }

  async function rateTrip(tripId: number, rating: number) {
    try {
      await apiClient.post(`/mobility/trips/${tripId}/rate`, { passengerRating: rating, feedback: "" });
      await loadTrips();
    } catch { /* ignore */ }
  }

  const statCards = stats ? [
    { label: "Total trips",      value: stats.totalTrips,      color: "#3b82f6" },
    { label: "Completed",        value: stats.completedTrips,  color: "#10b981" },
    { label: "Cancelled",        value: stats.cancelledTrips,  color: "#ef4444" },
    { label: "Total spend",      value: fmtCurrency(stats.totalSpend), color: "#f59e0b" },
    { label: "Avg rating given", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", color: "#8b5cf6" },
  ] : [];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Navigation size={22} style={{ color: "#10b981" }} />
        </div>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Mana Mobility Hub</h4>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>On-demand rides within the community</p>
        </div>
      </div>

      {/* Active trip banner */}
      {activeTrip && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 0 3px rgba(16,185,129,0.25)" }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Active trip #{activeTrip.tripRef}</span>
            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
              {activeTrip.pickup?.address} → {activeTrip.destination?.address}
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
            background: `${STATUS_COLORS[activeTrip.status] ?? "#6b7280"}22`,
            color: STATUS_COLORS[activeTrip.status] ?? "#6b7280" }}>{activeTrip.status}</span>
          {activeTrip.driver && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Driver: {activeTrip.driver.driverName}</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8,
            border: `1px solid ${tab === t ? "#10b981" : "rgba(148,163,184,0.15)"}`,
            background: tab === t ? "rgba(16,185,129,0.1)" : "transparent",
            color: tab === t ? "#10b981" : "var(--muted)", cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {/* ── Book a Ride ── */}
      {tab === "Book a Ride" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Form */}
          <div style={{ flex: "0 0 340px", background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Where are you going?</h3>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Pickup</label>
              <div style={{ position: "relative" }}>
                <MapPin size={13} style={{ position: "absolute", left: 10, top: 9, color: "#10b981" }} />
                <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Your location"
                  style={{ width: "100%", padding: "8px 8px 8px 28px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Destination</label>
              <div style={{ position: "relative" }}>
                <MapPin size={13} style={{ position: "absolute", left: 10, top: 9, color: "#ef4444" }} />
                <input value={dest} onChange={e => setDest(e.target.value)} placeholder="Where to?"
                  onKeyDown={e => e.key === "Enter" && fetchQuotes()}
                  style={{ width: "100%", padding: "8px 8px 8px 28px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
              </div>
            </div>

            <button onClick={fetchQuotes} disabled={!pickup.trim() || !dest.trim() || quoteLoading}
              style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: (!pickup.trim() || !dest.trim() || quoteLoading) ? "rgba(16,185,129,0.4)" : "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              {quoteLoading ? "Getting fares…" : "Get Fares"}
            </button>

            {quoteError && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#ef4444" }}>
                <AlertCircle size={12} />{quoteError}
              </div>
            )}
          </div>

          {/* Quotes + confirm */}
          <div style={{ flex: 1, minWidth: 260 }}>
            {quotes.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Choose a ride</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {quotes.map(q => (
                    <div key={q.quoteId} onClick={() => setSQ(q)}
                      style={{ padding: 14, borderRadius: 10, background: "var(--card)", border: `1px solid ${selectedQuote?.quoteId === q.quoteId ? "#10b981" : "rgba(148,163,184,0.1)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                        {SERVICE_ICONS[q.serviceType] ?? <Car size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q.serviceType}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{q.distanceKm.toFixed(1)} km · {q.etaMinutes} min ETA</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{fmtCurrency(q.total)}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)" }}>incl. taxes</div>
                      </div>
                      {selectedQuote?.quoteId === q.quoteId && (
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Payment + confirm */}
                <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Payment method</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {[{ v: "CASH", label: "Cash" }, { v: "UPI", label: "UPI" }, { v: "WALLET", label: "Wallet" }].map(p => (
                      <button key={p.v} onClick={() => setPayment(p.v)} style={{ flex: 1, padding: "6px 0", borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${payment === p.v ? "#10b981" : "rgba(148,163,184,0.15)"}`,
                        background: payment === p.v ? "rgba(16,185,129,0.1)" : "transparent",
                        color: payment === p.v ? "#10b981" : "var(--muted)", cursor: "pointer" }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleBook} disabled={!selectedQuote || booking}
                    style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: (!selectedQuote || booking) ? "rgba(16,185,129,0.4)" : "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    {booking ? "Booking…" : `Confirm · ${fmtCurrency(selectedQuote?.total)}`}
                  </button>
                </div>
              </>
            )}

            {bookSuccess && (
              <div style={{ padding: 20, borderRadius: 14, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>Ride booked!</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Ref #{bookSuccess.tripRef} · Searching for a driver…</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Carpool Offers ── */}
      {tab === "Carpool Offers" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: 9, color: "var(--muted)" }} />
              <input value={carpoolSearch} onChange={e => setCS(e.target.value)} placeholder="Search by destination…"
                style={{ width: "100%", padding: "8px 8px 8px 28px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>
          {carpoolError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={12} />{carpoolError}</div>}
          {carpoolLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading carpool offers…</div>
          ) : carpoolOffers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No carpool offers available{carpoolSearch ? ` for "${carpoolSearch}"` : ""}.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {carpoolOffers.map(o => (
                <div key={o.id} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#10b981" }}>
                    {o.driverName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", gap: 6, alignItems: "center" }}>
                      {o.driverName}
                      <span style={{ fontSize: 10, color: "#f59e0b", display: "flex", alignItems: "center", gap: 2 }}>
                        <Star size={9} fill="#f59e0b" />{o.rating.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MapPin size={9} />{o.origin} <ArrowRight size={9} /> {o.destination}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10 }}>
                      <span>{fmtTime(o.departureTime)}</span>
                      {o.vehicleModel && <span><Car size={9} style={{ verticalAlign: "middle" }} /> {o.vehicleModel}{o.vehicleNumber ? ` · ${o.vehicleNumber}` : ""}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{fmtCurrency(o.pricePerSeat)}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>/seat</span></div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{o.availableSeats}/{o.totalSeats} seats left</div>
                    {o.availableSeats > 0 ? (
                      <button onClick={() => joinCarpool(o.id)} disabled={joiningId === o.id}
                        style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 6, background: joiningId === o.id ? "rgba(16,185,129,0.4)" : "#10b981", color: "#fff", border: "none", cursor: "pointer" }}>
                        {joiningId === o.id ? "…" : "Join"}
                      </button>
                    ) : (
                      <span style={{ display: "block", marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(148,163,184,0.1)", color: "var(--muted)" }}>Full</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Trips ── */}
      {tab === "My Trips" && (
        <div>
          {tripsError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
              <AlertCircle size={13} style={{ color: "#ef4444" }} />
              <span style={{ fontSize: 12, color: "#ef4444", flex: 1 }}>{tripsError}</span>
              <button onClick={loadTrips} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}
          {tripsLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading trips…</div>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No trips yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trips.map(t => {
                const statusColor = STATUS_COLORS[t.status] ?? "#6b7280";
                const isDone = ["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND", "EXPIRED"].includes(t.status);
                return (
                  <div key={t.id} style={{ padding: 14, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${statusColor}18`, display: "flex", alignItems: "center", justifyContent: "center", color: statusColor, flexShrink: 0 }}>
                      {SERVICE_ICONS[t.serviceType] ?? <Car size={15} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        {t.pickup?.address ?? "—"} → {t.destination?.address ?? "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                        {fmtTime(t.requestedAt)} · #{t.tripRef}
                        {t.driver && <> · {t.driver.driverName}</>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${statusColor}22`, color: statusColor }}>{t.status}</span>
                      {(t.finalFare ?? t.quotedTotal) && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{fmtCurrency(t.finalFare ?? t.quotedTotal)}</div>
                      )}
                      {isDone && t.status === "COMPLETED" && !t.passengerRating && (
                        <div style={{ display: "flex", gap: 2, marginTop: 4, justifyContent: "flex-end" }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => rateTrip(t.id, n)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 1, color: "#f59e0b", fontSize: 14 }}>
                              ☆
                            </button>
                          ))}
                        </div>
                      )}
                      {t.passengerRating && (
                        <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 4 }}>{"★".repeat(t.passengerRating)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      {tab === "Stats" && (
        <div>
          {!stats ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading stats…</div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {statCards.map(s => (
                <div key={s.label} style={{ padding: "18px 24px", borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", textAlign: "center", minWidth: 130 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
