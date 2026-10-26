import { useState, useEffect } from 'react';
import { Save, User, AlertCircle, Heart, Phone, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { healthGuardService } from '../../../services/healthguard/healthGuardService';
import type { HealthProfileDto, BloodGroup } from '../../../types/healthguard';

const BLOOD_GROUPS: { value: BloodGroup; label: string }[] = [
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A−' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B−' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB−' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O−' },
];

const BLANK: Partial<HealthProfileDto> = {
  bloodGroup: 'UNKNOWN',
  allergies: '',
  medicalConditions: '',
  emergencyNotes: '',
  heightCm: undefined,
  weightKg: undefined,
  dateOfBirth: undefined,
  organDonorConsent: false,
  medicalIdNumber: '',
  physicianName: '',
  physicianPhone: '',
};

export function HealthProfile() {
  const [form, setForm] = useState<Partial<HealthProfileDto>>({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    healthGuardService.getProfile()
      .then((r: any) => setForm({ ...BLANK, ...(r?.data || r) }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res: any = await healthGuardService.saveProfile(form as HealthProfileDto);
      setForm({ ...BLANK, ...(res?.data || res) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof HealthProfileDto, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading profile...</div>;
  }

  const bmi = form.heightCm && form.weightKg
    ? (form.weightKg / Math.pow(form.heightCm / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Health Profile</h1>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
        </Button>
      </div>

      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
          Profile saved successfully.
        </div>
      )}

      {/* Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" /> Basic Health Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood group */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Blood Group</label>
              <div className="relative">
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none pr-8"
                  value={form.bloodGroup ?? 'UNKNOWN'}
                  onChange={e => set('bloodGroup', e.target.value as BloodGroup)}
                >
                  {BLOOD_GROUPS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date of birth */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.dateOfBirth ?? ''}
                onChange={e => set('dateOfBirth', e.target.value || undefined)}
              />
            </div>

            {/* Height */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Height (cm)</label>
              <input
                type="number" min={50} max={250}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 170"
                value={form.heightCm ?? ''}
                onChange={e => set('heightCm', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>Weight (kg)</span>
                {bmi && <span className="font-normal text-muted-foreground">BMI: {bmi}</span>}
              </label>
              <input
                type="number" min={10} max={300}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 65"
                value={form.weightKg ?? ''}
                onChange={e => set('weightKg', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Medical ID */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Medical ID / Aadhar Health ID</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="ABHA or health ID number"
              value={form.medicalIdNumber ?? ''}
              onChange={e => set('medicalIdNumber', e.target.value)}
            />
          </div>

          {/* Organ donor */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.organDonorConsent ?? false}
              onChange={e => set('organDonorConsent', e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium">Organ Donor</p>
              <p className="text-xs text-muted-foreground">I consent to organ donation</p>
            </div>
            {form.organDonorConsent && (
              <Badge variant="outline" className="ml-auto text-[10px] border-green-200 text-green-700 bg-green-50">Consented</Badge>
            )}
          </label>
        </CardContent>
      </Card>

      {/* Medical conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" /> Medical Conditions & Allergies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Known Allergies</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="e.g. Penicillin, peanuts, latex..."
              value={form.allergies ?? ''}
              onChange={e => set('allergies', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Medical Conditions</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="e.g. Diabetes Type 2, hypertension, asthma..."
              value={form.medicalConditions ?? ''}
              onChange={e => set('medicalConditions', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Emergency Notes</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={2}
              placeholder="e.g. Takes insulin, do not give NSAIDs..."
              value={form.emergencyNotes ?? ''}
              onChange={e => set('emergencyNotes', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Shown to emergency responders</p>
          </div>
        </CardContent>
      </Card>

      {/* Physician */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-500" /> Primary Physician
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Physician Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Dr. Name"
                value={form.physicianName ?? ''}
                onChange={e => set('physicianName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Physician Phone</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="+91-XXXXXXXXXX"
                value={form.physicianPhone ?? ''}
                onChange={e => set('physicianPhone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary card */}
      {(form.bloodGroup !== 'UNKNOWN' || form.allergies || form.medicalConditions) && (
        <Card className="border-orange-100 bg-orange-50/30 dark:bg-orange-950/10 dark:border-orange-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <Heart className="h-4 w-4" /> Emergency Info Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5 text-muted-foreground">
            {form.bloodGroup !== 'UNKNOWN' && (
              <p><span className="font-semibold text-foreground">Blood:</span> {BLOOD_GROUPS.find(b => b.value === form.bloodGroup)?.label}</p>
            )}
            {form.allergies && <p><span className="font-semibold text-foreground">Allergies:</span> {form.allergies}</p>}
            {form.medicalConditions && <p><span className="font-semibold text-foreground">Conditions:</span> {form.medicalConditions}</p>}
            {form.emergencyNotes && <p><span className="font-semibold text-foreground">Notes:</span> {form.emergencyNotes}</p>}
            {form.physicianName && <p><span className="font-semibold text-foreground">Physician:</span> {form.physicianName}{form.physicianPhone ? ` · ${form.physicianPhone}` : ''}</p>}
          </CardContent>
        </Card>
      )}

      <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Health Profile'}
      </Button>
    </div>
  );
}
