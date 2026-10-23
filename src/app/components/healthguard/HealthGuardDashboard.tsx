import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShieldAlert, Users, Clock, Phone, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Plus, Ambulance, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { healthGuardService } from '../../../services/healthguard/healthGuardService';
import type { EmergencyContactDto, EmergencyIncidentDto, HealthProfileDto } from '../../../types/healthguard';

const SEVERITY_COLORS: Record<string, string> = {
  LEVEL_1_NOTICE: 'bg-blue-100 text-blue-700 border-blue-200',
  LEVEL_2_ATTENTION: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LEVEL_3_POSSIBLE_EMERGENCY: 'bg-orange-100 text-orange-700 border-orange-200',
  LEVEL_4_CONFIRMED: 'bg-red-100 text-red-700 border-red-200',
};

const SEVERITY_LABELS: Record<string, string> = {
  LEVEL_1_NOTICE: 'Health Notice',
  LEVEL_2_ATTENTION: 'Needs Attention',
  LEVEL_3_POSSIBLE_EMERGENCY: 'Possible Emergency',
  LEVEL_4_CONFIRMED: 'Emergency Confirmed',
};

const STATUS_ICON = {
  ACTIVE: <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />,
  ACKNOWLEDGED: <Clock className="h-4 w-4 text-yellow-500" />,
  RESOLVED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-slate-400" />,
  ESCALATED: <AlertTriangle className="h-4 w-4 text-red-600" />,
};

export function HealthGuardDashboard() {
  const navigate = useNavigate();
  const { isAnyAdmin } = useAuth();
  const [profile, setProfile] = useState<HealthProfileDto | null>(null);
  const [contacts, setContacts] = useState<EmergencyContactDto[]>([]);
  const [activeIncident, setActiveIncident] = useState<EmergencyIncidentDto | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<EmergencyIncidentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    Promise.all([
      healthGuardService.getProfile().then((r: any) => setProfile(r?.data || r)).catch(() => {}),
      healthGuardService.getContacts().then((r: any) => setContacts(Array.isArray(r) ? r : r?.data || [])).catch(() => {}),
      healthGuardService.getActiveIncident().then((r: any) => {
        if (r && r.status !== 204) setActiveIncident(r?.data || r);
      }).catch(() => {}),
      healthGuardService.getIncidentHistory().then((r: any) => {
        const list = Array.isArray(r) ? r : r?.data || [];
        setRecentIncidents(list.slice(0, 5));
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleResolve = async () => {
    if (!activeIncident?.id) return;
    setResolving(true);
    try {
      await healthGuardService.resolveIncident(activeIncident.id, 'Resolved from dashboard');
      setActiveIncident(null);
      const histRes = await healthGuardService.getIncidentHistory();
      setRecentIncidents(histRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading HealthGuard...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mana HealthGuard</h1>
            <p className="text-xs text-muted-foreground">Smart Emergency Response System</p>
          </div>
        </div>
        <Button onClick={() => navigate('/healthguard/sos')} variant="destructive" className="gap-2 font-bold">
          <ShieldAlert className="h-4 w-4" />
          SOS
        </Button>
      </div>

      {/* Active Incident Alert */}
      {activeIncident && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 dark:bg-red-950/30 dark:border-red-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-400 text-sm">Active Emergency Incident</p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  {activeIncident.description || 'SOS triggered'}
                  {' · '}
                  {SEVERITY_LABELS[activeIncident.severity ?? ''] ?? activeIncident.severity}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {formatTime(activeIncident.triggeredAt)} · {activeIncident.alertsSent ?? 0} contacts notified
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleResolve} disabled={resolving} className="border-red-300 text-red-600 hover:bg-red-100 shrink-0">
              {resolving ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </div>
          {/* Emergency numbers */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <a href="tel:112" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
              <Phone className="h-3.5 w-3.5" /> 112 Emergency
            </a>
            <a href="tel:108" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors">
              <Phone className="h-3.5 w-3.5" /> 108 Ambulance
            </a>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/healthguard/contacts')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{contacts.length}</p>
              <p className="text-xs text-muted-foreground">Emergency Contacts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{recentIncidents.filter(i => i.status === 'RESOLVED').length}</p>
              <p className="text-xs text-muted-foreground">Past Incidents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/healthguard/profile')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold">{profile?.bloodGroup?.replace('_', '+') ?? 'Set up'}</p>
              <p className="text-xs text-muted-foreground">Health Profile</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts Preview */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" /> Emergency Contacts
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/healthguard/contacts')}>
            <Plus className="h-3 w-3" /> Manage
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No emergency contacts yet</p>
              <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => navigate('/healthguard/contacts')}>
                <Plus className="h-3 w-3" /> Add Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone} · {c.relationship}</p>
                    </div>
                  </div>
                  {c.notifyOnSos && <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50">SOS Alert</Badge>}
                </div>
              ))}
              {contacts.length > 3 && (
                <button className="w-full text-xs text-primary py-1.5 hover:underline flex items-center justify-center gap-1" onClick={() => navigate('/healthguard/contacts')}>
                  +{contacts.length - 3} more <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" /> Incident History
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/healthguard/incidents')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentIncidents.map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    {STATUS_ICON[inc.status ?? 'RESOLVED']}
                    <div>
                      <p className="text-xs font-medium">{inc.description || 'Manual SOS'}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(inc.triggeredAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[inc.severity ?? ''] ?? ''}`}>
                    {SEVERITY_LABELS[inc.severity ?? ''] ?? inc.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin panel link */}
      {isAnyAdmin && (
        <Card className="cursor-pointer hover:border-red-300 transition-colors border-red-200 bg-red-50/30 dark:bg-red-950/10" onClick={() => navigate('/healthguard/admin/incidents')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center border border-red-200">
              <LayoutDashboard className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-red-700 dark:text-red-400">Admin: Incident Dashboard</p>
              <p className="text-xs text-muted-foreground">View all active SOS alerts and ambulance dispatch</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* Phase 2 — Community Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:border-blue-300 transition-colors group" onClick={() => navigate('/healthguard/responder')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Community Responders</p>
              <p className="text-xs text-muted-foreground">Register or manage your responder status</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-300 transition-colors group" onClick={() => navigate('/healthguard/ambulance')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 group-hover:bg-red-100 transition-colors">
              <Ambulance className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Ambulance Booking</p>
              <p className="text-xs text-muted-foreground">Book or track emergency transport</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </div>

      {/* Emergency Numbers */}
      <Card className="border-red-100 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <Phone className="h-4 w-4" /> Emergency Numbers (India)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Emergency', num: '112', color: 'red' },
              { label: 'Ambulance', num: '108', color: 'orange' },
              { label: 'Police', num: '100', color: 'blue' },
              { label: 'Fire', num: '101', color: 'red' },
              { label: "Women's Help", num: '1091', color: 'purple' },
              { label: 'Disaster', num: '1078', color: 'slate' },
            ].map(({ label, num, color }) => (
              <a
                key={num}
                href={`tel:${num}`}
                className={`flex items-center gap-2 p-2.5 rounded-lg border bg-white dark:bg-slate-900 hover:shadow-sm transition-all text-${color}-700 border-${color}-200`}
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{num}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
