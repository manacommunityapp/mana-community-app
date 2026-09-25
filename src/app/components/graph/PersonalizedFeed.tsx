import { useState, useEffect } from "react";
import {
  Sparkles,
  Users,
  Search,
  Shield,
  MapPin,
  TrendingUp,
  Tag,
  Compass,
  Trophy,
  Calendar,
  HeartHandshake,
  Utensils,
  Wrench,
  CheckCircle2,
  Lock,
  Eye,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  communityGraphService,
  type RecommendationCard,
  type CommunityProfile,
  type RecommendationType,
} from "../../../services/graph/communityGraphService";
import { useAuth } from "../../../contexts/AuthContext";

const TYPE_ICONS: Record<RecommendationType, React.ComponentType<{ className?: string }>> = {
  PERSON: Users,
  SPORT: Trophy,
  EVENT: Calendar,
  TRIP: Compass,
  FOOD: Utensils,
  SERVICE: Wrench,
};

export function PersonalizedFeed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<RecommendationCard[]>([]);
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [activeTab, setActiveTab] = useState("for-you");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  // Privacy Settings state
  const [privacySettings, setPrivacySettings] = useState({
    skills: "PUBLIC",
    profession: "PUBLIC",
    sports: "PUBLIC",
    interests: "NEIGHBORS",
    flatNumber: "NEIGHBORS",
  });
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFeed(communityGraphService.getPersonalizedFeed());
    setProfiles(communityGraphService.getProfiles());
  };

  const filteredFeed = feed.filter((item) => {
    if (typeFilter === "ALL") return true;
    return item.type === typeFilter;
  });

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q)) ||
      p.professions.some((pr) => pr.toLowerCase().includes(q)) ||
      p.interests.some((i) => i.toLowerCase().includes(q)) ||
      p.tower.toLowerCase().includes(q)
    );
  });

  const handleConnect = (profileId: string) => {
    if (connectedIds.includes(profileId)) return;
    setConnectedIds([...connectedIds, profileId]);
  };

  const handleSavePrivacy = () => {
    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2000);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mana Community Discover & Graph</h1>
          </div>
          <p className="text-purple-100 text-sm sm:text-base max-w-2xl">
            Personalized social graph connecting you with neighbours sharing your sports, hobbies, skills, and daily commute routes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="for-you" className="py-2.5 font-semibold gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-purple-600" />
            For You ({feed.length})
          </TabsTrigger>
          <TabsTrigger value="directory" className="py-2.5 font-semibold gap-2 text-xs">
            <Users className="w-4 h-4 text-blue-600" />
            Resident Directory
          </TabsTrigger>
          <TabsTrigger value="privacy" className="py-2.5 font-semibold gap-2 text-xs">
            <Shield className="w-4 h-4 text-emerald-600" />
            Privacy Controls
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: For You */}
        <TabsContent value="for-you" className="space-y-6 pt-4">
          {/* Type Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: "All Matches", value: "ALL" },
              { label: "People & Mentors", value: "PERSON" },
              { label: "Sports & Games", value: "SPORT" },
              { label: "Events & Potlucks", value: "EVENT" },
              { label: "Trips & Trails", value: "TRIP" },
              { label: "Home Food & Chefs", value: "FOOD" },
              { label: "Services & Deals", value: "SERVICE" },
            ].map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={typeFilter === f.value ? "default" : "outline"}
                className={`rounded-full text-xs font-semibold whitespace-nowrap ${
                  typeFilter === f.value
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeed.map((item) => {
              const Icon = TYPE_ICONS[item.type] || Sparkles;

              return (
                <Card key={item.id} className="border hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
                  <div>
                    {/* Header Accent */}
                    <div
                      className="h-20 w-full flex items-center justify-between p-4 text-white relative"
                      style={{ backgroundColor: item.imagePlaceholderColor || "#8b5cf6" }}
                    >
                      <Badge className="bg-black/30 backdrop-blur-md text-white border-0 text-xs flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        {item.type}
                      </Badge>
                      <Badge className="bg-white text-purple-900 font-bold shadow text-xs">
                        {item.score}% Match
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <p className="text-xs text-purple-600 font-semibold">{item.subtitle}</p>
                      <CardTitle className="text-lg text-slate-900 line-clamp-1">{item.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-xs">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] font-medium">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50">
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 font-bold text-xs"
                      onClick={() => {
                        window.location.href = item.actionPath;
                      }}
                    >
                      {item.actionLabel} &rarr;
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: Resident Directory */}
        <TabsContent value="directory" className="space-y-4 pt-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by skill (React, Yoga), profession (Doctor, Lawyer), interest..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProfiles.map((prof) => {
              const isConnected = connectedIds.includes(prof.id);

              return (
                <Card key={prof.id} className="border shadow-sm flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-bold text-blue-600">
                          Tower {prof.tower} &bull; {prof.flatNumber}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {prof.visibility}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-slate-900 pt-1">{prof.name}</CardTitle>
                      <CardDescription className="text-xs text-purple-700 font-semibold">
                        {prof.professions.join(", ")}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 pt-0 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Skills</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {prof.skills.map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Sports & Hobbies</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {[...prof.sports, ...prof.interests].slice(0, 3).map((h, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50">
                    <Button
                      size="sm"
                      variant={isConnected ? "outline" : "default"}
                      className={`w-full text-xs font-bold ${
                        isConnected
                          ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={() => handleConnect(prof.id)}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Connected
                        </>
                      ) : (
                        "Connect & Chat"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: Privacy Controls */}
        <TabsContent value="privacy" className="space-y-4 pt-4">
          <Card className="max-w-2xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                Community Graph Privacy Matrix
              </CardTitle>
              <CardDescription>
                Control who can see your profession, flat number, skills, and sports activity across the community discovery graph.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {[
                { key: "skills", label: "Skills & Mentorship Offerings", desc: "Allows neighbours to discover your expertise" },
                { key: "profession", label: "Professional Title & Company", desc: "Visible in professional networking matches" },
                { key: "sports", label: "Sports & Fitness Activities", desc: "Used for badminton, cricket, and gym buddy matching" },
                { key: "interests", label: "Hobbies & Clubs", desc: "Book club, gardening, photography matching" },
                { key: "flatNumber", label: "Flat & Unit Number", desc: "Reveals exact flat vs Tower-only to neighbours" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                  <div>
                    <strong className="text-slate-800 text-sm block">{item.label}</strong>
                    <span className="text-slate-500 text-xs">{item.desc}</span>
                  </div>
                  <Select
                    value={(privacySettings as any)[item.key]}
                    onValueChange={(val) => setPrivacySettings({ ...privacySettings, [item.key]: val })}
                  >
                    <SelectTrigger className="w-36 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public (All)</SelectItem>
                      <SelectItem value="NEIGHBORS">My Tower Only</SelectItem>
                      <SelectItem value="PRIVATE">Private (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {privacySaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Privacy preferences updated successfully!
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t bg-slate-50">
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs" onClick={handleSavePrivacy}>
                Save Privacy Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
