import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Users,
  CheckCircle2,
  XCircle,
  Download,
  QrCode,
  Phone,
  Shield,
  Search,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  tripService,
  type Trip,
  type TripBooking,
} from "../../../services/trips/tripService";

interface HostRosterModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { fullName: string };
}

export function HostRosterModal({ trip, isOpen, onClose, currentUser }: HostRosterModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [manualQRScanInput, setManualQRScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!trip) return null;

  const manifest = tripService.getTripManifest(trip.id);
  const confirmedBookings = manifest.filter((b) => b.status === "CONFIRMED");
  const waitlistedBookings = manifest.filter((b) => b.status === "WAITLISTED");

  const totalConfirmedPassengers = confirmedBookings.reduce((sum, b) => sum + b.participantCount, 0);
  const totalCheckedIn = confirmedBookings.filter((b) => b.attendance?.checkedIn).reduce((sum, b) => sum + b.participantCount, 0);

  const filteredBookings = confirmedBookings.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userFlat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.boardingPassQR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passengers.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleAttendance = (booking: TripBooking) => {
    if (booking.attendance?.checkedIn) {
      booking.attendance = { checkedIn: false };
    } else {
      tripService.checkInPassenger(booking.id, currentUser.fullName);
    }
    setScanMessage({ text: `Updated check-in status for ${booking.userName}`, type: "success" });
  };

  const handleScanBoardingPass = () => {
    if (!manualQRScanInput.trim()) return;
    const target = confirmedBookings.find(
      (b) => b.boardingPassQR.trim().toLowerCase() === manualQRScanInput.trim().toLowerCase()
    );
    if (target) {
      tripService.checkInPassenger(target.id, currentUser.fullName);
      setScanMessage({ text: `Verified & Checked-in ${target.userName} (${target.participantCount} pax)`, type: "success" });
      setManualQRScanInput("");
    } else {
      setScanMessage({ text: "Invalid or unconfirmed boarding pass QR code", type: "error" });
    }
  };

  const handleExportCSV = () => {
    const headers = "Booking ID,Lead Resident,Flat,Phone,Passenger Name,Age,Gender,Emergency Contact,Blood Group,Room Type,Pickup Point,Checked In\n";
    const rows = confirmedBookings.flatMap((b) =>
      b.passengers.map(
        (p) =>
          `"${b.id}","${b.userName}","${b.userFlat}","${b.userPhone}","${p.name}",${p.age},"${p.gender}","${p.emergencyPhone}","${p.bloodGroup || ""}","${b.selectedRoomType || ""}","${b.selectedPickupPoint || ""}","${b.attendance?.checkedIn ? "YES" : "NO"}"`
      )
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Trip_Manifest_${trip.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className="bg-indigo-600 text-white text-xs">{trip.category}</Badge>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5" />
                Export Manifest (CSV)
              </Button>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">{trip.title} — Host Roster</DialogTitle>
          <DialogDescription className="text-xs">
            Manage passenger manifest, emergency medical notes, and scan boarding QR passes at pickup
          </DialogDescription>
        </DialogHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-indigo-700">Confirmed Travelers</p>
            <p className="text-2xl font-black text-indigo-900">{totalConfirmedPassengers} / {trip.totalSeats}</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-700">Checked In</p>
            <p className="text-2xl font-black text-emerald-900">{totalCheckedIn} / {totalConfirmedPassengers}</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-amber-700">Waitlist Queue</p>
            <p className="text-2xl font-black text-amber-900">{waitlistedBookings.reduce((s, b) => s + b.participantCount, 0)} Pax</p>
          </div>
        </div>

        {/* Boarding QR Code Scanner & Check-in Tool */}
        <div className="p-3.5 bg-slate-50 border rounded-2xl space-y-2.5">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-indigo-600" />
            Boarding Check-In &amp; QR Pass Scanner
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Scan or enter Boarding Pass QR (e.g. MANA-PASS-TRIP-001-XXXX)"
              className="text-xs h-9 bg-white"
              value={manualQRScanInput}
              onChange={(e) => setManualQRScanInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScanBoardingPass()}
            />
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs" onClick={handleScanBoardingPass}>
              Verify &amp; Check In
            </Button>
          </div>
          {scanMessage && (
            <p className={`text-xs font-semibold ${scanMessage.type === "success" ? "text-emerald-700" : "text-rose-600"}`}>
              {scanMessage.text}
            </p>
          )}
        </div>

        {/* Passenger Manifest Search */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-600" />
              Passenger Manifest Roster ({confirmedBookings.length} Bookings)
            </h4>
            <div className="w-56">
              <Input
                placeholder="Search name, flat, QR..."
                className="h-8 text-xs bg-slate-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {filteredBookings.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">No confirmed travelers found matching search.</p>
            ) : (
              filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 border rounded-xl space-y-2 text-xs transition-all ${
                    b.attendance?.checkedIn ? "bg-emerald-50/60 border-emerald-300" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{b.userName}</span>
                      <span className="text-slate-500 text-xs ml-1.5">({b.userFlat})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{b.boardingPassQR}</span>
                      <Button
                        size="sm"
                        variant={b.attendance?.checkedIn ? "default" : "outline"}
                        className={`text-xs h-7 gap-1 font-bold ${
                          b.attendance?.checkedIn ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-300"
                        }`}
                        onClick={() => handleToggleAttendance(b)}
                      >
                        {b.attendance?.checkedIn ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Checked In
                          </>
                        ) : (
                          "Mark Boarded"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Passenger breakdown list */}
                  <div className="p-2 bg-slate-100/70 rounded-lg space-y-1">
                    {b.passengers.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center text-[11px] text-slate-700">
                        <span>
                          {i + 1}. <strong>{p.name}</strong> ({p.age}y, {p.gender}, {p.bloodGroup || "O+"})
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.emergencyPhone}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>Pickup: <strong>{b.selectedPickupPoint || "Main Gate"}</strong></span>
                    <span>Room: <strong>{b.selectedRoomType || "Standard"}</strong></span>
                    <span className="font-bold text-indigo-700">Paid: ₹{b.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Manifest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
