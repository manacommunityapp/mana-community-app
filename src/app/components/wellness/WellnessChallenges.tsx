import { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { WellnessChallengeDto, ChallengeStatus } from '../../../types/wellness';

export default function WellnessChallenges() {
  const [tab, setTab] = useState<ChallengeStatus>('ACTIVE');
  const [challenges, setChallenges] = useState<WellnessChallengeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, [tab]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      setChallenges(await wellnessService.getChallenges(tab));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await wellnessService.joinChallenge(id);
      loadChallenges();
    } catch (e) {
      console.error(e);
    }
  };

  const typeColors: Record<string, string> = {
    WALKING: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    HYDRATION: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    NUTRITION: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    FITNESS: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    YOGA: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    CUSTOM: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" /> Community Challenges
      </h1>

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as ChallengeStatus)}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="UPCOMING">Upcoming</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No {tab.toLowerCase()} challenges
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{c.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                      </div>
                      <Badge className={typeColors[c.challengeType] ?? typeColors.CUSTOM}>
                        {c.challengeType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {c.participantCount ?? 0} joined
                      </span>
                      {c.badgeName && (
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" /> {c.badgeName}
                        </span>
                      )}
                    </div>
                    {c.targetValue && (
                      <p className="text-sm mb-3">
                        Target: <span className="font-semibold">{c.targetValue} {c.targetUnit}</span>
                      </p>
                    )}
                    {tab === 'ACTIVE' && (
                      <Button size="sm" onClick={() => handleJoin(c.id)}>
                        Join Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
