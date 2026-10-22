import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { healthGuardService } from '../../../services/healthguard/healthGuardService';
import type { EmergencyIncidentDto } from '../../../types/healthguard';

const SEVERITY_LABELS: Record<string, string> = {
  LEVEL_1_NOTICE: 'Notice',
  LEVEL_2_ATTENTION: 'Attention',
  LEVEL_3_POSSIBLE_EMERGENCY: 'Possible Emergency',
  LEVEL_4_CONFIRMED: 'Confirmed Emergency',
};

const SEVERITY_COLORS: Record<string, string> = {
  LEVEL_1_NOTICE: 'border-blue-200 text-blue-700 bg-blue-50',
  LEVEL_2_ATTENTION: 'border-yellow-200 text-yellow-700 bg-yellow-50',
  LEVEL_3_POSSIBLE_EMERGENCY: 'border-orange-200 text-orange-700 bg-orange-50',
  LEVEL_4_CONFIRMED: 'border-red-200 text-red-700 bg-red-50',
};

const STATUS_CONFIG = {
  ACTIVE: { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, label: 'Active', color: 'text-red-600' },
  ACKNOWLEDGED: { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'Acknowledged', color: 'text-yellow-600' },
  RESOLVED: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Resolved', color: 'text-green-600' },
  CANCELLED: { icon: <XCircle className="h-4 w-4 text-slate-400" />, label: 'Cancelled', color: 'text-slate-500' },
  ESCALATED: { icon: <AlertTriangle className="h-4 w-4 text-red-600" />, label: 'Escalated', color: 'text-red-700' },
};

function formatDuration(start?: string, end?: string): string {
  if (!start) return '-';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const mins = Math.round((e.getTime() - s.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function IncidentCard({ incident }: { incident: EmergencyIncidentDto }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[incident.status ?? 'RESOLVED'];
  const isActive = incident.status === 'ACTIVE' || incident.status === 'ACKNOWLEDGED';

  return (
    <Card className={`transition-all ${isActive ? 'border-red-200 shadow-sm shadow-red-50' : ''}`}>
      <CardContent className="p-0">
        <button
          type="button"
          className="w-full p-4 flex items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 shrink-0">{status.icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{incident.description || `${incident.triggerType?.replace(/_/g, ' ')} — SOS`}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {incident.triggeredAt ? new Date(incident.triggeredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                {' · '}
                Duration: {formatDuration(incident.triggeredAt, incident.resolvedAt ?? incident.acknowledgedAt)}
              </p>
              {incident.locationAddress && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {incident.locationAddress}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[incident.severity ?? ''] ?? ''}`}>
              {SEVERITY_LABELS[incident.severity ?? ''] ?? incident.severity}
            </Badge>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${status.color}`}>{status.label}</span></div>
              <div><span className="text-muted-foreground">Alerts sent:</span> <span className="font-medium">{incident.alertsSent ?? 0} contacts</span></div>
              <div><span className="text-muted-foreground">Trigger:</span> <span className="font-medium">{incident.triggerType?.replace(/_/g, ' ')}</span></div>
              {incident.resolvedAt && (
                <div><span className="text-muted-foreground">Resolved:</span> <span className="font-medium">{new Date(incident.resolvedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span></div>
              )}
            </div>
            {incident.notes && (
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>{incident.notes}
              </div>
            )}
            {incident.notifications && incident.notifications.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Notifications sent</p>
                <div className="space-y-1">
                  {incident.notifications.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2.5 py-1.5">
                      <span>{n.recipientName ?? n.recipientPhone}</span>
                      <Badge variant="outline" className="text-[9px]">{n.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IncidentTracker() {
  const [incidents, setIncidents] = useState<EmergencyIncidentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  useEffect(() => {
    healthGuardService.getIncidentHistory()
      .then(r => setIncidents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = incidents.filter(i => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return i.status === 'ACTIVE' || i.status === 'ACKNOWLEDGED' || i.status === 'ESCALATED';
    return i.status === 'RESOLVED' || i.status === 'CANCELLED';
  });

  if (loading) return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading incidents...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Incident History</h1>
        <span className="text-xs text-muted-foreground">{incidents.length} total incidents</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'ALL' ? `All (${incidents.length})` : f === 'ACTIVE' ? `Active (${incidents.filter(i => ['ACTIVE','ACKNOWLEDGED','ESCALATED'].includes(i.status ?? '')).length})` : `Resolved (${incidents.filter(i => ['RESOLVED','CANCELLED'].includes(i.status ?? '')).length})`}
          </button>
        ))}
      </div>

      {/* Incidents */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium">No incidents found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'ALL' ? "You haven't triggered any SOS alerts yet" : `No ${filter.toLowerCase()} incidents`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => (
            <IncidentCard key={inc.id ?? inc.incidentUuid} incident={inc} />
          ))}
        </div>
      )}
    </div>
  );
}
