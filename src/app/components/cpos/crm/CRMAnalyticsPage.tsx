import React, { useMemo } from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { CRMNav } from './CRMNav';
import { INITIAL_LEADS, STAGES, STAGE_LABELS, stageColors, sourceColors, scoreColor, computeLeadScore } from './crmData';

const CRMAnalyticsPage: React.FC = () => {
  // Cumulative funnel: leads that have reached each stage or beyond
  const funnelData = useMemo(() => STAGES.map((stage, idx) => {
    const count = INITIAL_LEADS.filter(l => STAGES.indexOf(l.stage) >= idx).length;
    const pct = Math.round((count / INITIAL_LEADS.length) * 100);
    return { stage, label: STAGE_LABELS[stage], count, pct, color: stageColors[stage] };
  }), []);

  // Source attribution
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    INITIAL_LEADS.forEach(l => { map[l.source] = (map[l.source] || 0) + 1; });
    return Object.entries(map).map(([source, count]) => ({
      name: source.replace('_', ' '),
      count,
      color: sourceColors[source as keyof typeof sourceColors],
    }));
  }, []);

  // Agent performance
  const agentData = useMemo(() => {
    const agents = [...new Set(INITIAL_LEADS.map(l => l.assignedTo))];
    return agents.map(agent => {
      const leads = INITIAL_LEADS.filter(l => l.assignedTo === agent);
      const closed = leads.filter(l => l.stage === 'CLOSED').length;
      const inNeg = leads.filter(l => l.stage === 'NEGOTIATION').length;
      const avgScore = Math.round(leads.reduce((s, l) => s + computeLeadScore(l).score, 0) / leads.length);
      const pipeline = leads.reduce((s, l) => s + l.budgetLakhs, 0);
      return { agent, count: leads.length, closed, inNeg, avgScore, pipeline };
    });
  }, []);

  // Stage velocity (avg days currently in each stage)
  const velocityData = useMemo(() => STAGES.map(stage => {
    const stageLeads = INITIAL_LEADS.filter(l => l.stage === stage);
    const avgDays = stageLeads.length > 0
      ? Math.round(stageLeads.reduce((s, l) => s + l.daysInStage, 0) / stageLeads.length)
      : 0;
    return { stage, label: STAGE_LABELS[stage], avgDays, count: stageLeads.length, color: stageColors[stage] };
  }), []);

  const totalPipeline = INITIAL_LEADS.reduce((s, l) => s + l.budgetLakhs, 0);
  const overallConversion = Math.round((funnelData[funnelData.length - 1].count / INITIAL_LEADS.length) * 100);
  const avgDaysTotal = Math.round(INITIAL_LEADS.reduce((s, l) => s + l.daysTotal, 0) / INITIAL_LEADS.length);
  const hotLeads = INITIAL_LEADS.filter(l => computeLeadScore(l).score >= 85).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />

      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>CRM Funnel Analytics</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Pipeline performance, conversion rates, and agent insights
        </Typography>
      </Box>

      {/* KPI tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[
          { label: 'Total Pipeline',      value: `₹${totalPipeline} L`,   sub: `${INITIAL_LEADS.length} active leads`, color: '#10B981' },
          { label: 'Overall Conversion',  value: `${overallConversion}%`, sub: 'New → Closed rate',                   color: '#4F6AF5' },
          { label: 'Avg Deal Age',        value: `${avgDaysTotal} days`,  sub: 'Time in pipeline',                    color: '#F59E0B' },
          { label: 'Hot Leads',           value: hotLeads,                sub: 'AI Score ≥ 85',                       color: '#EF4444' },
        ].map((kpi, i) => (
          <Paper key={i} sx={{ p: 2.5, borderRadius: '16px', borderLeft: `3px solid ${kpi.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem', display: 'block' }}>
              {kpi.label}
            </Typography>
            <Typography variant="h4" sx={{ color: kpi.color, fontWeight: 900, mt: 0.5, lineHeight: 1.1 }}>{kpi.value}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>{kpi.sub}</Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Funnel visualization */}
        <Paper sx={{ flex: '1 1 300px', p: 3, borderRadius: '20px', minWidth: 280 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Sales Funnel</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2.5 }}>
            Cumulative leads reaching each stage
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {funnelData.map((d, idx) => (
              <Box key={d.stage}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', minWidth: 80, fontSize: '0.72rem', textAlign: 'right' }}>
                    {d.label}
                  </Typography>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      height: 28,
                      width: `${Math.max(d.pct, 8)}%`,
                      borderRadius: '6px',
                      bgcolor: `${d.color}20`,
                      border: `1px solid ${d.color}45`,
                      display: 'flex', alignItems: 'center', px: 1, transition: 'width 0.3s',
                    }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: d.color }}>{d.count}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', minWidth: 28 }}>{d.pct}%</Typography>
                  </Box>
                </Box>
                {idx < funnelData.length - 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 1, py: 0.25 }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)' }}>
                      ↓ {d.count > 0 ? Math.round((funnelData[idx + 1].count / d.count) * 100) : 0}% convert
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Source attribution */}
        <Paper sx={{ flex: '1 1 240px', p: 3, borderRadius: '20px', minWidth: 240 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Lead Sources</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1 }}>
            Inbound lead distribution
          </Typography>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={sourceData} dataKey="count" cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={3}>
                {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <RechartsTooltip
                contentStyle={{ background: '#1A2540', border: '1px solid rgba(79,106,245,0.3)', borderRadius: 8 }}
                itemStyle={{ color: '#fff' }}
                formatter={(val: number) => [`${val} leads`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {sourceData.map(s => (
              <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.67rem' }}>
                  {s.name} ({s.count})
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Stage velocity */}
      <Paper sx={{ p: 3, borderRadius: '20px' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Stage Velocity</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2 }}>
          Average days leads currently spend in each stage
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1.5 }}>
          {velocityData.map(v => (
            <Box key={v.stage} sx={{ p: 2, borderRadius: '12px', bgcolor: '#0D1526', borderTop: `2px solid ${v.color}`, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                {v.label}
              </Typography>
              <Typography variant="h4" sx={{ color: v.color, fontWeight: 900, my: 0.5, lineHeight: 1 }}>{v.avgDays}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem' }}>
                days avg · {v.count} leads
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Agent performance */}
      <Paper sx={{ p: 3, borderRadius: '20px' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Agent Performance</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {agentData.map((a, i) => (
            <Box key={a.agent} sx={{ p: 2.5, borderRadius: '14px', bgcolor: '#0D1526', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Avatar sx={{
                bgcolor: i === 0 ? 'rgba(79,106,245,0.2)' : 'rgba(16,185,129,0.2)',
                color: i === 0 ? '#4F6AF5' : '#10B981',
                width: 44, height: 44, fontWeight: 800, borderRadius: '12px',
              }}>
                {a.agent.split(' ').map((w: string) => w[0]).join('')}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 100 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{a.agent}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  {a.count} leads · ₹{a.pipeline} L pipeline
                </Typography>
              </Box>
              {([
                { label: 'Total Leads',    val: a.count,    color: '#4F6AF5' },
                { label: 'Negotiation',    val: a.inNeg,    color: '#EC4899' },
                { label: 'Closed',         val: a.closed,   color: '#10B981' },
                { label: 'Avg AI Score',   val: a.avgScore, color: scoreColor(a.avgScore) },
              ] as { label: string; val: number; color: string }[]).map(stat => (
                <Box key={stat.label} sx={{ textAlign: 'center', minWidth: 70 }}>
                  <Typography variant="h5" sx={{ color: stat.color, fontWeight: 900, lineHeight: 1.1 }}>{stat.val}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default CRMAnalyticsPage;
