import { useEffect, useState } from 'react';
import { User, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { WellnessProfileDto, GoalType, ActivityLevel, CoachingStyle, SharingPreference } from '../../../types/wellness';

export default function WellnessProfile() {
  const [profile, setProfile] = useState<WellnessProfileDto>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setProfile(await wellnessService.getProfile());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setProfile(await wellnessService.saveProfile(profile));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof WellnessProfileDto, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <User className="h-5 w-5 text-emerald-500" /> Wellness Profile
      </h1>

      {/* Body Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Body Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" value={profile.heightCm ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('heightCm', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" value={profile.weightKg ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('weightKg', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Target Weight (kg)</Label>
              <Input type="number" value={profile.targetWeightKg ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('targetWeightKg', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" value={profile.age ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('age', parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={profile.gender ?? ''} onValueChange={(v: string) => update('gender', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Goals & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Goal</Label>
            <Select value={profile.goalType ?? ''} onValueChange={(v: string) => update('goalType', v as GoalType)}>
              <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
              <SelectContent>
                {(['WEIGHT_LOSS', 'WEIGHT_GAIN', 'MAINTAIN', 'MUSCLE_GAIN', 'GENERAL_WELLNESS'] as GoalType[]).map((g) => (
                  <SelectItem key={g} value={g}>{g.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Level</Label>
            <Select value={profile.activityLevel ?? ''} onValueChange={(v: string) => update('activityLevel', v as ActivityLevel)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'] as ActivityLevel[]).map((a) => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Coaching Style</Label>
            <Select value={profile.coachingStyle ?? ''} onValueChange={(v: string) => update('coachingStyle', v as CoachingStyle)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['GENTLE', 'MOTIVATIONAL', 'STRICT', 'DATA_FOCUSED'] as CoachingStyle[]).map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Targets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Calories (kcal)</Label>
              <Input type="number" value={profile.dailyCalorieTarget ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dailyCalorieTarget', parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input type="number" value={profile.dailyProteinTarget ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dailyProteinTarget', parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input type="number" value={profile.dailyCarbsTarget ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dailyCarbsTarget', parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Fat (g)</Label>
              <Input type="number" value={profile.dailyFatTarget ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dailyFatTarget', parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Water (ml)</Label>
              <Input type="number" value={profile.dailyWaterTargetMl ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('dailyWaterTargetMl', parseInt(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Data Sharing</Label>
            <Select value={profile.sharingPreference ?? 'PRIVATE'} onValueChange={(v: string) => update('sharingPreference', v as SharingPreference)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['PRIVATE', 'FRIENDS_ONLY', 'PUBLIC'] as SharingPreference[]).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your wellness data is encrypted and private by default. Choose who can see your progress.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}
