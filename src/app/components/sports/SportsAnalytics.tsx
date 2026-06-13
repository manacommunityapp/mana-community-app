import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Trophy, Users, TrendingUp, Target, Star } from "lucide-react";
import { useState } from "react";

const monthlyGames = [
  { month: "Jan", Basketball: 18, Soccer: 12, Volleyball: 8 },
  { month: "Feb", Basketball: 22, Soccer: 14, Volleyball: 10 },
  { month: "Mar", Basketball: 20, Soccer: 16, Volleyball: 12 },
  { month: "Apr", Basketball: 26, Soccer: 18, Volleyball: 14 },
  { month: "May", Basketball: 24, Soccer: 20, Volleyball: 11 },
  { month: "Jun", Basketball: 14, Soccer: 10, Volleyball: 6 },
];

const participationTrend = [
  { month: "Jan", players: 180 },
  { month: "Feb", players: 210 },
  { month: "Mar", players: 238 },
  { month: "Apr", players: 265 },
  { month: "May", players: 240 },
  { month: "Jun", players: 238 },
];

const sportShare = [
  { name: "Basketball", value: 45, color: "#818cf8" },
  { name: "Soccer", value: 35, color: "#34d399" },
  { name: "Volleyball", value: 20, color: "#a78bfa" },
];

const standings = {
  Basketball: [
    { rank: 1, team: "City Hoopers", w: 8, l: 3, pts: 16, pct: 0.727 },
    { rank: 2, team: "Downtown Dunkers", w: 6, l: 5, pts: 12, pct: 0.545 },
    { rank: 3, team: "Alley-Oops", w: 5, l: 6, pts: 10, pct: 0.455 },
    { rank: 4, team: "Court Kings", w: 4, l: 7, pts: 8, pct: 0.364 },
  ],
  Soccer: [
    { rank: 1, team: "United FC", w: 5, l: 4, pts: 16, pct: 0.556 },
    { rank: 2, team: "Galacticos", w: 5, l: 5, pts: 15, pct: 0.5 },
    { rank: 3, team: "Athletic Club", w: 4, l: 6, pts: 12, pct: 0.4 },
    { rank: 4, team: "Rovers", w: 3, l: 7, pts: 9, pct: 0.3 },
  ],
  Volleyball: [
    { rank: 1, team: "Spike Syndicate", w: 4, l: 2, pts: 8, pct: 0.667 },
    { rank: 2, team: "Net Ninjas", w: 3, l: 3, pts: 6, pct: 0.5 },
    { rank: 3, team: "Block Party", w: 2, l: 4, pts: 4, pct: 0.333 },
  ],
};

const topScorers = [
  { rank: 1, name: "Arjun Mehta", team: "City Hoopers", sport: "Basketball", value: 246, label: "Total Pts", avatar: "AM", color: "from-amber-400 to-orange-500" },
  { rank: 2, name: "Pooja Nair", team: "Galacticos", sport: "Soccer", value: 12, label: "Goals", avatar: "PN", color: "from-rose-400 to-pink-500" },
  { rank: 3, name: "Karan Joshi", team: "City Hoopers", sport: "Basketball", value: 156, label: "Total Pts", avatar: "KJ", color: "from-sky-400 to-blue-500" },
  { rank: 4, name: "Rohan Patel", team: "Galacticos", sport: "Soccer", value: 8, label: "Goals", avatar: "RP", color: "from-emerald-400 to-teal-500" },
  { rank: 5, name: "Vikram Singh", team: "Spike Syndicate", sport: "Volleyball", value: 54, label: "Aces", avatar: "VS", color: "from-violet-400 to-indigo-500" },
];

type StandingsTab = "Basketball" | "Soccer" | "Volleyball";

export function SportsAnalytics() {
  const [standingsTab, setStandingsTab] = useState<StandingsTab>("Basketball");

  const currentStandings = standings[standingsTab];

  return (
    <div className="space-y-5 animate-fade-in-up stagger-1">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Games", value: "94", change: "+14%", icon: Target, color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
          { label: "Active Players", value: "238", change: "+8%", icon: Users, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
          { label: "Avg Attendance", value: "142", change: "+5%", icon: TrendingUp, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
          { label: "Tournaments", value: "3", change: "This season", icon: Trophy, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs mt-0.5 text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly games bar chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold mb-4 text-foreground">Monthly Games by Sport</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyGames} barSize={10} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#8b8fc8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b8fc8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#16163a", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "12px", color: "#e8eaf6" }}
                labelStyle={{ color: "#e8eaf6", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#8b8fc8" }} />
              <Bar dataKey="Basketball" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Soccer" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Volleyball" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sport distribution pie */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold mb-4 text-foreground">Sport Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sportShare} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {sportShare.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#16163a", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "10px", color: "#e8eaf6" }}
                formatter={(value: any) => [`${value}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {sportShare.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-semibold text-foreground">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Participation trend */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-4 text-foreground">Player Participation Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={participationTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
            <XAxis dataKey="month" tick={{ fill: "#8b8fc8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8b8fc8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#16163a", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "12px", color: "#e8eaf6" }}
              labelStyle={{ color: "#e8eaf6", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="players"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#818cf8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Standings */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">League Standings</h3>
            <div className="flex rounded-xl p-1 bg-input border border-border">
              {(["Basketball", "Soccer", "Volleyball"] as StandingsTab[]).map((tab) => (
                <button key={tab} onClick={() => setStandingsTab(tab)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    standingsTab === tab
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-5 text-xs font-semibold px-2 py-1 text-muted-foreground border-b border-border/40 pb-2">
              <span className="col-span-2">Team</span>
              <span className="text-center">W</span>
              <span className="text-center">L</span>
              <span className="text-center">PCT</span>
            </div>
            {currentStandings.map((row, i) => (
              <div key={row.team} className="grid grid-cols-5 items-center px-2 py-2 rounded-xl text-sm"
                style={{ background: i === 0 ? "rgba(99,102,241,0.08)" : "transparent" }}>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xs font-bold w-4" style={{ color: i === 0 ? "#818cf8" : "var(--mana-text-dim)" }}>{row.rank}</span>
                  <span className="font-medium truncate text-foreground">{row.team}</span>
                  {i === 0 && <Trophy className="h-3 w-3 flex-shrink-0 text-warning" />}
                </div>
                <span className="text-center font-semibold text-success">{row.w}</span>
                <span className="text-center font-semibold text-danger">{row.l}</span>
                <span className="text-center text-muted-foreground">{row.pct.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Top Performers</h3>
            <Star className="h-4 w-4 text-warning" />
          </div>
          <div className="space-y-3">
            {topScorers.map((p) => (
              <div key={p.rank} className="flex items-center gap-3 py-1 border-b border-border/20 last:border-0 pb-2 last:pb-0">
                <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                  style={{ color: p.rank <= 3 ? "#fbbf24" : "var(--mana-text-dim)" }}>
                  {p.rank <= 3 ? ["🥇", "🥈", "🥉"][p.rank - 1] : p.rank}
                </span>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${p.color} flex-shrink-0`}>
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.team} · {p.sport}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-[var(--mana-accent)]">{p.value}</p>
                  <p className="text-[10px] text-muted-foreground">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
