import React, { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { movieService, type Movie, type Showtime, type SeatRow } from "../../services/entertainment/movieService";

const LANG_FILTERS = ["All", "Hindi", "Telugu", "Tamil", "English", "Malayalam"];
const MAX_SEATS = 6;

type Step = "list" | "showtimes" | "seats";

export function MoviePortal() {
  const [step, setStep] = useState<Step>("list");
  const [langFilter, setLangFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState<{ now_showing: Movie[]; coming_soon: Movie[] }>({ now_showing: [], coming_soon: [] });
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [seatRows, setSeatRows] = useState<SeatRow[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<{ row: string; number: number; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => { loadMovies(); }, []);

  async function loadMovies() {
    setLoading(true);
    try { setMovies(await movieService.getMovies()); } finally { setLoading(false); }
  }

  async function selectMovie(movie: Movie) {
    setSelectedMovie(movie);
    setStep("showtimes");
    setLoading(true);
    try {
      const sts = await movieService.getShowtimes(movie.id);
      setShowtimes(sts);
      const dates = [...new Set(sts.map(s => s.date))].sort();
      setSelectedDate(dates[0] ?? "");
    } finally { setLoading(false); }
  }

  async function selectShowtime(st: Showtime) {
    setSelectedShowtime(st);
    setStep("seats");
    setSelectedSeats([]);
    setLoading(true);
    try { setSeatRows(await movieService.getSeatLayout(st.id)); } finally { setLoading(false); }
  }

  function toggleSeat(row: string, number: number, type: string) {
    setSelectedSeats(prev => {
      const key = `${row}-${number}`;
      if (prev.find(s => `${s.row}-${s.number}` === key)) return prev.filter(s => `${s.row}-${s.number}` !== key);
      if (prev.length >= MAX_SEATS) { alert(`Max ${MAX_SEATS} seats.`); return prev; }
      return [...prev, { row, number, type }];
    });
  }

  async function handleBook() {
    if (!selectedShowtime || selectedSeats.length === 0) return;
    const priceClassic = selectedShowtime.price_classic;
    const pricePremium = selectedShowtime.price_premium;
    const sub = selectedSeats.reduce((s, seat) => s + (seat.type === "PREMIUM" ? pricePremium : priceClassic), 0);
    const fee = Math.round(sub * 0.0175);
    const total = sub + fee;
    if (!window.confirm(`Book ${selectedSeats.length} seat(s) for ₹${total.toLocaleString()} (incl. ₹${fee} fee)? Payment via UPI.`)) return;
    setBooking(true);
    try {
      const result = await movieService.bookTickets({ showtime_id: selectedShowtime.id, movie_id: selectedMovie!.id, seats: selectedSeats.map(s => `${s.row}${s.number}`), seat_type: selectedSeats.some(s => s.type === "PREMIUM") ? "PREMIUM" : "CLASSIC", amount: total });
      window.open(result.phone_pe_url, "_blank");
      alert(`Booking Confirmed!\nBooking ID: ${result.booking_id}\nSeats: ${result.seats.join(", ")}\nPay ₹${total.toLocaleString()} using UPI.`);
      setStep("list"); setSelectedMovie(null); setSelectedShowtime(null); setSelectedSeats([]);
    } catch { alert("Booking failed. Please try again."); } finally { setBooking(false); }
  }

  const filteredNow = movies.now_showing.filter(m => (langFilter === "All" || m.language === langFilter) && m.title.toLowerCase().includes(search.toLowerCase()));
  const filteredSoon = movies.coming_soon.filter(m => (langFilter === "All" || m.language === langFilter) && m.title.toLowerCase().includes(search.toLowerCase()));

  const dates = [...new Set(showtimes.map(s => s.date))].sort();
  const byDate = showtimes.filter(s => s.date === selectedDate);
  const theaters = [...new Set(byDate.map(s => s.theater))];

  function fmtDate(d: string) {
    const today = new Date().toISOString().split("T")[0];
    const diff = Math.round((new Date(d + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
  }

  const priceClassic = selectedShowtime?.price_classic ?? 180;
  const pricePremium = selectedShowtime?.price_premium ?? 280;
  const subTotal = selectedSeats.reduce((s, seat) => s + (seat.type === "PREMIUM" ? pricePremium : priceClassic), 0);
  const bookingFee = Math.round(subTotal * 0.0175);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#44475B]">🎬 Movie Tickets</h1>
          <p className="text-xs text-[#7C7E8C]">Book tickets · UPI payment</p>
        </div>
        {step !== "list" && (
          <button onClick={() => { setStep("list"); setSelectedMovie(null); setSelectedShowtime(null); setSelectedSeats([]); }} className="flex items-center gap-1.5 text-sm text-[#7C7E8C] hover:text-[#44475B]">
            <X size={14} /> Back to Movies
          </button>
        )}
        {step === "list" && <button onClick={loadMovies} className="p-2 rounded-lg border border-[#E8E9F0] hover:bg-[#F5F5F7]"><RefreshCw size={14} className={loading ? "animate-spin text-[#7C7E8C]" : "text-[#7C7E8C]"} /></button>}
      </div>

      {/* Step: Movie List */}
      {step === "list" && (
        <div className="space-y-4">
          {/* Search + Language filter */}
          <input className="w-full border border-[#E8E9F0] rounded-xl px-4 h-11 text-sm text-[#44475B] outline-none focus:border-[#6366F1]" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search movies…" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LANG_FILTERS.map(lang => (
              <button key={lang} onClick={() => setLangFilter(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${langFilter === lang ? "bg-[#6366F1] text-white border-[#6366F1]" : "border-[#E8E9F0] text-[#7C7E8C] hover:bg-[#F5F5F7]"}`}>
                {lang}
              </button>
            ))}
          </div>

          {loading ? <div className="text-center py-12 text-[#7C7E8C] text-sm">Loading movies…</div> : (
            <div className="space-y-6">
              {filteredNow.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-[#44475B] mb-3">Now Showing</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredNow.map(movie => (
                      <button key={movie.id} onClick={() => selectMovie(movie)} className="text-left rounded-xl overflow-hidden border border-[#E8E9F0] hover:border-[#6366F1] transition-colors bg-white">
                        <div className="h-36 flex items-center justify-center relative" style={{ backgroundColor: movie.backdrop_color }}>
                          <span className="text-5xl">{movie.poster_emoji}</span>
                          <span className="absolute top-1.5 right-1.5 bg-black/50 text-[#FCD34D] text-[10px] font-bold px-1.5 py-0.5 rounded">⭐ {movie.rating}</span>
                          <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{movie.certificate}</span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-[#44475B] leading-tight line-clamp-2">{movie.title}</p>
                          <p className="text-[10px] text-[#7C7E8C] mt-1">{movie.language} · {movie.duration_mins}m</p>
                          <p className="text-[10px] text-[#7C7E8C]">{movie.genre.slice(0, 2).join(", ")}</p>
                          <div className="mt-2 text-center bg-[#6366F1] text-white text-[10px] font-bold py-1 rounded-lg">Book Tickets</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredSoon.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-[#44475B] mb-3">Coming Soon</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredSoon.map(movie => (
                      <div key={movie.id} className="text-left rounded-xl overflow-hidden border border-[#E8E9F0] bg-white opacity-80">
                        <div className="h-36 flex items-center justify-center relative" style={{ backgroundColor: movie.backdrop_color }}>
                          <span className="text-5xl">{movie.poster_emoji}</span>
                          <div className="absolute inset-0 bg-black/20 flex items-end p-2"><span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Coming Soon</span></div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-[#44475B] leading-tight line-clamp-2">{movie.title}</p>
                          <p className="text-[10px] text-[#7C7E8C] mt-1">{movie.language} · {new Date(movie.release_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step: Showtimes */}
      {step === "showtimes" && selectedMovie && (
        <div className="space-y-4">
          {/* Movie banner */}
          <div className="rounded-xl overflow-hidden">
            <div className="p-5 flex gap-4 items-start" style={{ backgroundColor: selectedMovie.backdrop_color }}>
              <div className="w-16 h-20 rounded-lg bg-white/10 flex items-center justify-center text-4xl flex-shrink-0">{selectedMovie.poster_emoji}</div>
              <div>
                <p className="font-bold text-white text-lg leading-snug">{selectedMovie.title}</p>
                <p className="text-white/70 text-xs mt-1">{selectedMovie.language} · {selectedMovie.duration_mins}m · {selectedMovie.certificate}</p>
                <p className="text-white/60 text-xs mt-0.5">{selectedMovie.genre.join(" · ")}</p>
                <p className="text-white/60 text-xs mt-0.5">Dir: {selectedMovie.director}</p>
              </div>
            </div>
          </div>

          {loading ? <div className="text-center py-8 text-[#7C7E8C] text-sm">Loading showtimes…</div> : (
            <div className="space-y-4">
              {/* Date chips */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map(d => (
                  <button key={d} onClick={() => setSelectedDate(d)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${selectedDate === d ? "bg-[#6366F1] text-white border-[#6366F1]" : "border-[#E8E9F0] text-[#7C7E8C] hover:bg-[#F5F5F7]"}`}>
                    {fmtDate(d)}
                  </button>
                ))}
              </div>
              {/* Theatre slots */}
              {theaters.map(theater => {
                const slots = byDate.filter(s => s.theater === theater);
                return (
                  <div key={theater} className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-3">
                    <div>
                      <p className="font-bold text-sm text-[#44475B]">{theater}</p>
                      <p className="text-xs text-[#7C7E8C]">{slots[0]?.theater_screen}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map(st => (
                        <button key={st.id} onClick={() => selectShowtime(st)}
                          className="border-2 border-[#E8E9F0] rounded-xl px-3 py-2 text-left hover:border-[#6366F1] hover:bg-[#EEF2FF] transition-colors">
                          <p className="font-bold text-sm text-[#44475B]">{st.time}</p>
                          <p className={`text-[10px] font-semibold ${st.format === "IMAX" ? "text-purple-600" : st.format === "3D" ? "text-blue-600" : "text-[#7C7E8C]"}`}>{st.format}</p>
                          <p className={`text-[10px] ${st.available_seats < 20 ? "text-red-600" : "text-green-600"}`}>{st.available_seats < 20 ? `${st.available_seats} left!` : `${st.available_seats} seats`}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#7C7E8C]">Classic ₹{slots[0]?.price_classic} · Premium ₹{slots[0]?.price_premium} · Recliner ₹{slots[0]?.price_recliner}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step: Seat Selection */}
      {step === "seats" && selectedShowtime && (
        <div className="space-y-4">
          {/* Showtime summary */}
          <div className="bg-[#1A1A2E] rounded-xl p-4 text-white">
            <p className="font-bold text-sm">{selectedMovie?.title}</p>
            <p className="text-white/70 text-xs mt-0.5">{selectedShowtime.theater} · {fmtDate(selectedShowtime.date)} · {selectedShowtime.time}</p>
            <p className="text-white/50 text-xs mt-0.5">{selectedShowtime.format} · Select up to {MAX_SEATS} seats</p>
          </div>

          {loading ? <div className="text-center py-8 text-[#7C7E8C] text-sm">Loading seat map…</div> : (
            <div className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-4 overflow-x-auto">
              {/* Screen */}
              <div className="text-center"><div className="mx-auto w-64 h-2 bg-[#CBD5E1] rounded mb-1" /><p className="text-xs text-[#9CA3AF]">SCREEN</p></div>

              {(["CLASSIC", "PREMIUM"] as const).map(type => {
                const typeRows = seatRows.filter(r => r.seat_type === type);
                if (!typeRows.length) return null;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-[#E8E9F0]" />
                      <span className={`text-[11px] font-bold ${type === "PREMIUM" ? "text-purple-600" : "text-gray-500"}`}>{type}</span>
                      <div className="flex-1 h-px bg-[#E8E9F0]" />
                    </div>
                    {typeRows.map(rowData => (
                      <div key={rowData.row} className="flex items-center gap-1 mb-1">
                        <span className="w-5 text-[10px] text-[#9CA3AF] text-right mr-1 flex-shrink-0">{rowData.row}</span>
                        <div className="flex gap-0.5">
                          {rowData.seats.map(seat => {
                            const key = `${rowData.row}-${seat.number}`;
                            const isSel = !!selectedSeats.find(s => `${s.row}-${s.number}` === key);
                            const isOcc = seat.status === "OCCUPIED";
                            return (
                              <button key={key} disabled={isOcc} onClick={() => toggleSeat(rowData.row, seat.number, rowData.seat_type)}
                                className={`w-6 h-5 rounded text-[8px] flex items-center justify-center transition-colors ${isOcc ? "bg-[#374151] cursor-not-allowed text-transparent" : isSel ? "bg-[#6366F1] text-white" : "bg-[#E8E9F0] text-[#9CA3AF] hover:bg-[#D1D5DB]"}`}>
                                {!isOcc && seat.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex justify-center gap-4 pt-2">
                {[{ color: "bg-[#E8E9F0]", label: "Available" }, { color: "bg-[#6366F1]", label: "Selected" }, { color: "bg-[#374151]", label: "Booked" }].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded ${item.color}`} />
                    <span className="text-[10px] text-[#7C7E8C]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout summary */}
          {selectedSeats.length > 0 && (
            <div className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-[#44475B]">Selected: {selectedSeats.map(s => `${s.row}${s.number}`).join("  ")}</p>
              <div className="flex justify-between text-xs text-[#7C7E8C]"><span>Subtotal</span><span>₹{subTotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs text-[#7C7E8C]"><span>Booking fee</span><span>₹{bookingFee}</span></div>
              <div className="flex justify-between text-sm font-bold text-[#44475B] pt-1 border-t border-[#E8E9F0]"><span>Total</span><span>₹{(subTotal + bookingFee).toLocaleString()}</span></div>
            </div>
          )}

          <button onClick={handleBook} disabled={selectedSeats.length === 0 || booking}
            className="w-full bg-[#6366F1] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-[#4F46E5] transition-colors">
            {booking ? "Booking…" : selectedSeats.length > 0 ? `Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? "s" : ""} · ₹${(subTotal + bookingFee).toLocaleString()}` : "Select Seats"}
          </button>
          <p className="text-center text-[10px] text-[#7C7E8C]">Payment via PhonePe / UPI · e-Ticket on booking</p>
        </div>
      )}
    </div>
  );
}
