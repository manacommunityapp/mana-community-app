import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Trophy, Clock, FileText } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { wellnessService } from '../../../services/wellness/wellnessService';

const SPORTS = [
  'Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis',
  'Table Tennis', 'Volleyball', 'Swimming', 'Cycling', 'Running',
  'Squash', 'Kabaddi', 'Kho Kho', 'Hockey', 'Other',
];

export default function LogSportsWorkout() {
  const navigate = useNavigate();
  const [sportType, setSportType] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!sportType) return;
    setLoading(true);
    try {
      await wellnessService.logSportsWorkout({ sportType, durationMin, workoutDate, notes });
      setSaved(true);
      setTimeout(() => navigate('/wellness'), 1200);
    } catch (e) {
      console.error('Failed to log sports workout', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-500" /> Log Sports Activity
        </h1>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Sport type picker */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Sport Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPORTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSportType(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    sportType === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {sportType === 'Other' && (
              <Input
                className="mt-2 h-8 text-sm"
                placeholder="Enter sport name"
                onChange={e => setSportType(e.target.value || 'Other')}
              />
            )}
          </div>

          {/* Duration */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Duration (minutes)
            </Label>
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map(m => (
                <button
                  key={m}
                  onClick={() => setDurationMin(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    durationMin === m ? 'bg-emerald-600 text-white' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              max={480}
              value={durationMin}
              onChange={e => setDurationMin(Number(e.target.value))}
              className="mt-2 h-8 text-sm"
              placeholder="Or enter custom minutes"
            />
          </div>

          {/* Date */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Date</Label>
            <Input
              type="date"
              value={workoutDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setWorkoutDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Notes (optional)
            </Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Community cricket match"
              className="h-8 text-sm"
            />
          </div>

          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!sportType || loading || saved}
            onClick={handleSave}
          >
            {saved ? '✓ Logged!' : loading ? 'Saving…' : 'Log Sports Workout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
