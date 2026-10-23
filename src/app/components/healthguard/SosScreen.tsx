import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ShieldAlert, Phone, MapPin, AlertTriangle, CheckCircle2, X, ChevronLeft, Users } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { healthGuardService } from '../../../services/healthguard/healthGuardService';
import type { EmergencyContactDto, IncidentSeverity } from '../../../types/healthguard';

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string; desc: string; color: string }[] = [
  { value: 'LEVEL_1_NOTICE', label: 'Health Notice', desc: 'Feeling unwell, need assistance', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'LEVEL_2_ATTENTION', label: 'Needs Attention', desc: 'Moderate discomfort or concern', color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
  { value: 'LEVEL_3_POSSIBLE_EMERGENCY', label: 'Possible Emergency', desc: 'Serious situation, may need help', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'LEVEL_4_CONFIRMED', label: 'Emergency', desc: 'Life-threatening, send help now', color: 'border-red-300 bg-red-50 text-red-700' },
];

type Phase = 'idle' | 'confirm' | 'triggering' | 'triggered' | 'error';

export function SosScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [severity, setSeverity] = useState<IncidentSeverity>('LEVEL_3_POSSIBLE_EMERGENCY');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contacts, setContacts] = useState<EmergencyContactDto[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [incident, setIncident] = useState<{ id?: number; alertsSent?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    healthGuardService.getContacts()
      .then((r: any) => {
        const list: EmergencyContactDto[] = Array.isArray(r) ? r : r?.data || [];
        setContacts(list.filter((c: EmergencyContactDto) => c.notifyOnSos && c.isActive !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase === 'confirm') {
      setCountdown(5);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            triggerSos();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [phase]);

  const triggerSos = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPhase('triggering');
    try {
      const res = await healthGuardService.triggerSos({
        description: description.trim() || undefined,
        severity,
        locationAddress: location.trim() || undefined,
        triggerType: 'MANUAL_SOS',
      });
      setIncident(res.data);
      setPhase('triggered');
    } catch (e) {
      setErrorMsg('Failed to send SOS. Please call 112 directly.');
      setPhase('error');
    }
  };

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPhase('idle');
  };

  const sosContacts = contacts.filter(c => c.notifyOnSos);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate('/healthguard')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h1 className="font-bold text-lg">Emergency SOS</h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5">

        {/* === TRIGGERED === */}
        {phase === 'triggered' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-green-50 border-2 border-green-200 dark:bg-green-950/30 dark:border-green-800 p-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400">SOS Sent</h2>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                {(incident?.alertsSent ?? sosContacts.length)} emergency contact{sosContacts.length !== 1 ? 's' : ''} notified
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href="tel:112" className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">
                <Phone className="h-6 w-6" />
                <span className="text-lg">112</span>
                <span className="text-xs font-normal opacity-90">Emergency</span>
              </a>
              <a href="tel:108" className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors">
                <Phone className="h-6 w-6" />
                <span className="text-lg">108</span>
                <span className="text-xs font-normal opacity-90">Ambulance</span>
              </a>
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate('/healthguard')}>
              Back to HealthGuard
            </Button>
          </div>
        )}

        {/* === ERROR === */}
        {phase === 'error' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-red-50 border-2 border-red-200 dark:bg-red-950/30 dark:border-red-800 p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400">SOS Failed</h2>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{errorMsg}</p>
            </div>
            <a href="tel:112" className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">
              <Phone className="h-5 w-5" /> Call 112 Now
            </a>
            <Button variant="outline" className="w-full" onClick={() => setPhase('idle')}>
              Try Again
            </Button>
          </div>
        )}

        {/* === TRIGGERING === */}
        {phase === 'triggering' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="h-16 w-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Sending SOS alert...</p>
          </div>
        )}

        {/* === CONFIRM (countdown) === */}
        {phase === 'confirm' && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-red-50 border-2 border-red-300 dark:bg-red-950/30 dark:border-red-700 p-6 text-center">
              <div className="h-20 w-20 rounded-full bg-red-100 border-4 border-red-400 flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl font-black text-red-600">{countdown}</span>
              </div>
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Sending SOS in {countdown}s</h2>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                {sosContacts.length} contact{sosContacts.length !== 1 ? 's' : ''} will be notified
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="destructive" className="h-14 text-base font-bold" onClick={triggerSos}>
                Send Now
              </Button>
              <Button variant="outline" className="h-14 text-base" onClick={cancelCountdown}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a href="tel:112" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">
                <Phone className="h-4 w-4" /> 112
              </a>
              <a href="tel:108" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors">
                <Phone className="h-4 w-4" /> 108
              </a>
            </div>
          </div>
        )}

        {/* === IDLE (form) === */}
        {phase === 'idle' && (
          <div className="space-y-5">
            {/* Emergency call strip */}
            <div className="grid grid-cols-3 gap-2">
              {[{ num: '112', label: 'Emergency', color: 'bg-red-600 hover:bg-red-700' }, { num: '108', label: 'Ambulance', color: 'bg-orange-600 hover:bg-orange-700' }, { num: '100', label: 'Police', color: 'bg-blue-600 hover:bg-blue-700' }].map(({ num, label, color }) => (
                <a key={num} href={`tel:${num}`} className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl ${color} text-white transition-colors`}>
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-bold">{num}</span>
                  <span className="text-[10px] opacity-80">{label}</span>
                </a>
              ))}
            </div>

            {/* Severity */}
            <div>
              <p className="text-sm font-semibold mb-2">Severity</p>
              <div className="space-y-2">
                {SEVERITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${severity === opt.value ? opt.color + ' border-current' : 'border-border bg-muted/30 hover:bg-muted/60'}`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${severity === opt.value ? 'border-current' : 'border-muted-foreground'}`}>
                      {severity === opt.value && <div className="h-2 w-2 rounded-full bg-current" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs opacity-75">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold mb-1.5 block">What's happening? <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none"
                rows={2}
                placeholder="e.g. Chest pain, fell down, feeling faint..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-red-400/50"
                placeholder="e.g. Block A, Flat 302, Main St"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            {/* Who will be notified */}
            <Card className="border-muted">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">Who will be notified</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{sosContacts.length} contacts</Badge>
                </div>
                {sosContacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No emergency contacts set up. <button onClick={() => navigate('/healthguard/contacts')} className="text-primary underline">Add contacts</button></p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sosContacts.slice(0, 4).map(c => (
                      <span key={c.id} className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {c.name}
                      </span>
                    ))}
                    {sosContacts.length > 4 && (
                      <span className="text-xs text-muted-foreground px-1">+{sosContacts.length - 4} more</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOS Button */}
            <button
              type="button"
              onClick={() => setPhase('confirm')}
              className="w-full h-20 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-200 dark:shadow-red-950 transition-all"
            >
              <ShieldAlert className="h-8 w-8" />
              SOS
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Pressing SOS starts a 5-second countdown before alerting contacts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
