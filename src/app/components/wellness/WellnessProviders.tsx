import { useEffect, useState } from 'react';
import { Dumbbell, Star, MapPin, Video, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { wellnessService } from '@/services/wellness/wellnessService';
import type { WellnessProviderDto, WellnessProviderType } from '@/types/wellness';

const PROVIDER_TABS: { value: WellnessProviderType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DIETITIAN', label: 'Dietitians' },
  { value: 'PERSONAL_TRAINER', label: 'Trainers' },
  { value: 'YOGA_INSTRUCTOR', label: 'Yoga' },
  { value: 'GYM', label: 'Gyms' },
];

export default function WellnessProviders() {
  const [tab, setTab] = useState<WellnessProviderType | 'ALL'>('ALL');
  const [providers, setProviders] = useState<WellnessProviderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, [tab]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      setProviders(await wellnessService.getProviders(tab === 'ALL' ? undefined : tab));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-purple-500" /> Wellness Providers
      </h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as WellnessProviderType | 'ALL')}>
        <TabsList className="flex-wrap">
          {PROVIDER_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No providers found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{p.name}</h3>
                          {p.verified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{p.specialty ?? p.providerType.replace(/_/g, ' ')}</p>
                        {p.rating != null && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">{p.rating}</span>
                            {p.totalReviews != null && (
                              <span className="text-xs text-muted-foreground">({p.totalReviews})</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {p.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {p.location}
                            </span>
                          )}
                          {p.availableOnline && (
                            <span className="flex items-center gap-0.5">
                              <Video className="h-3 w-3" /> Online
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {p.consultationFee != null && (
                            <span className="font-semibold text-sm">₹{p.consultationFee}</span>
                          )}
                          <Button size="sm" variant="outline" className="gap-1">
                            <Phone className="h-3 w-3" /> Contact
                          </Button>
                        </div>
                      </div>
                    </div>
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
