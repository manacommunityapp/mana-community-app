import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Ambulance, RefreshCw, ArrowLeft, Clock, CheckCircle2, MapPin, User, Phone } from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";

interface BookingRow {
  id: number;
  userId: number;
  pickupAddress: string;
  destinationAddress: string;
  patientName: string;
  patientPhone: string;
  emergencyDescription: string;
  status: string;
  driverName: string;
  vehicleNumber: string;
  estimatedArrivalMinutes: number;
  requestedAt: string;
  confirmedAt: string;
  dispatchedAt: string;
  arrivedAt: string;
}

type AmbulanceStatus = 'REQUESTED' | 'CONFIRMED' | 'DISPATCHED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

const STATUS_STEPS: AmbulanceStatus[] = ['REQUESTED', 'CONFIRMED', 'DISPATCHED', 'ARRIVED', 'COMPLETED'];

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  DISPATCHED: 'bg-orange-100 text-orange-700 border-orange-200',
  ARRIVED: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const NEXT_STATUS: Record<string, AmbulanceStatus | null> = {
  REQUESTED: 'CONFIRMED',
  CONFIRMED: 'DISPATCHED',
  DISPATCHED: 'ARRIVED',
  ARRIVED: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

const NEXT_LABEL: Record<string, string> = {
  REQUESTED: 'Confirm Booking',
  CONFIRMED: 'Mark Dispatched',
  DISPATCHED: 'Mark Arrived',
  ARRIVED: 'Mark Completed',
};

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AmbulanceDispatch() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    // Fetch all active ambulance bookings — reuse the admin pattern
    apiClient.get<BookingRow[]>("/api/healthguard/ambulance/all")
      .catch(() => apiClient.get<BookingRow[]>("/api/healthguard/ambulance"))
      .then(r => setBookings(r.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const advance = async (id: number, status: AmbulanceStatus) => {
    setActionId(id);
    try {
      await apiClient.put(`/api/healthguard/admin/ambulance/${id}/status`, { status });
      load();
    } finally {
      setActionId(null);
    }
  };

  const cancel = async (id: number) => {
    if (!window.confirm("Cancel this ambulance booking?")) return;
    setActionId(id);
    try {
      await apiClient.put(`/api/healthguard/admin/ambulance/${id}/status`, { status: 'CANCELLED' });
      load();
    } finally {
      setActionId(null);
    }
  };

  const active = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const past = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/healthguard/admin/incidents')} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Ambulance className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Ambulance Dispatch</h1>
              <p className="text-xs text-muted-foreground">Admin — manage active ambulance bookings</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-yellow-600">{bookings.filter(b => b.status === 'REQUESTED').length}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting Confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-orange-600">{bookings.filter(b => b.status === 'DISPATCHED').length}</p>
            <p className="text-xs text-muted-foreground mt-1">En Route</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'COMPLETED').length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed Today</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
      ) : (
        <>
          {/* Active bookings */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Active Bookings ({active.length})
            </h2>
            {active.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active ambulance bookings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {active.map(b => (
                  <BookingCard
                    key={b.id} booking={b}
                    busy={actionId === b.id}
                    onAdvance={() => { const next = NEXT_STATUS[b.status]; if (next) advance(b.id, next); }}
                    onCancel={() => cancel(b.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past bookings */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Recent History ({past.length})
              </h2>
              <div className="space-y-2">
                {past.slice(0, 10).map(b => (
                  <BookingCard key={b.id} booking={b} busy={false} onAdvance={() => {}} onCancel={() => {}} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({ booking: b, busy, onAdvance, onCancel }: {
  booking: BookingRow; busy: boolean;
  onAdvance: () => void; onCancel: () => void;
}) {
  const isDone = ['COMPLETED', 'CANCELLED'].includes(b.status);
  const nextLabel = NEXT_LABEL[b.status];
  const stepIdx = STATUS_STEPS.indexOf(b.status as AmbulanceStatus);

  return (
    <Card className={b.status === 'REQUESTED' ? 'border-yellow-200 dark:border-yellow-800' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Status + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${STATUS_COLOR[b.status] ?? ''}`}>{b.status}</Badge>
              <span className="text-xs text-muted-foreground">#{b.id} · User {b.userId}</span>
              {b.estimatedArrivalMinutes > 0 && (
                <span className="text-xs flex items-center gap-1 text-orange-600">
                  <Clock className="w-3 h-3" />{b.estimatedArrivalMinutes} min ETA
                </span>
              )}
            </div>

            {/* Progress bar */}
            {!isDone && (
              <div className="flex gap-1 items-center">
                {STATUS_STEPS.filter(s => s !== 'COMPLETED').map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-red-500' : 'bg-muted'}`} />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Patient */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="w-3.5 h-3.5" />{b.patientName || '—'}
              </span>
              {b.patientPhone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />{b.patientPhone}
                </span>
              )}
            </div>

            {/* Addresses */}
            {b.pickupAddress && (
              <p className="text-xs text-muted-foreground flex gap-1">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-green-500" />
                <span><span className="font-medium text-foreground">From:</span> {b.pickupAddress}</span>
              </p>
            )}
            {b.destinationAddress && (
              <p className="text-xs text-muted-foreground flex gap-1">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-red-500" />
                <span><span className="font-medium text-foreground">To:</span> {b.destinationAddress}</span>
              </p>
            )}

            {/* Driver */}
            {(b.driverName || b.vehicleNumber) && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                🚑 {b.driverName}{b.vehicleNumber ? ` · ${b.vehicleNumber}` : ''}
              </p>
            )}

            {/* Description */}
            {b.emergencyDescription && (
              <p className="text-xs text-muted-foreground italic">{b.emergencyDescription}</p>
            )}

            <p className="text-xs text-muted-foreground">Requested: {fmt(b.requestedAt)}</p>
          </div>

          {/* Actions */}
          {!isDone && (
            <div className="flex flex-col gap-2 shrink-0">
              {nextLabel && (
                <Button size="sm" onClick={onAdvance} disabled={busy} className="bg-red-600 hover:bg-red-700">
                  {busy ? '...' : nextLabel}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onCancel} disabled={busy} className="text-gray-500 border-gray-300">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
