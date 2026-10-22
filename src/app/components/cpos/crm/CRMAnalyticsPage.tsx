import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, CircularProgress, Button, Menu, MenuItem, ListItemIcon, ListItemText, LinearProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import { CRMNav } from './CRMNav';
import { STAGES, STAGE_LABELS, stageColors, sourceColors, scoreColor } from './crmData';
import { crmService, type CrmAnalyticsDto } from '../../../../services/cpos/crmService';
import Papa from 'papaparse';

const CRMAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<CrmAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    crmService.getAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <CRMNav />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#4F6AF5' }} />
        </Box>
      </Box>
    );
  }

  const a = analytics;
  const totalLeads = a?.totalLeads ?? 0;

  // Funnel data mapped to display shape
  const funnelData = (a?.funnel ?? []).map(f => ({
    stage: f.stage,
    label: STAGE_LABELS[f.stage as keyof typeof STAGE_LABELS] ?? f.stage,
    count: f.count,
    pct: f.pct,
    color: stageColors[f.stage as keyof typeof stageColors] ?? '#4F6AF5',
  }));

  // Source attribution
  const sourceData = Object.entries(a?.sourceBreakdown ?? {}).map(([source, count]) => ({
    name: source.replace('_', ' '),
    count,
    color: sourceColors[source as keyof typeof sourceColors] ?? '#4F6AF5',
  }));

  // Stage velocity — stageVelocity is avg days per stage; derive per-stage lead count from funnel
  const velocityData = STAGES.map((stage, idx) => {
    const funnelEntry = funnelData.find(f => f.stage === stage);
    const nextFunnelEntry = idx < STAGES.length - 1 ? funnelData.find(f => f.stage === STAGES[idx + 1]) : null;
    const count = (funnelEntry?.count ?? 0) - (nextFunnelEntry?.count ?? 0);
    const avgDays = Math.round(a?.stageVelocity?.[stage] ?? 0);
    return { stage, label: STAGE_LABELS[stage], avgDays, count: Math.max(count, 0), color: stageColors[stage] };
  });

  // Agent data
  const agentData = (a?.agentStats ?? []).map(s => ({
    agent: s.agent,
    count: s.totalLeads,
    closed: s.closed,
    inNeg: s.inNegotiation,
    avgScore: s.avgScore,
    pipeline: s.pipelineLakhs,
  }));

  const totalPipeline = agentData.reduce((s, ag) => s + ag.pipeline, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>CRM Funnel Analytics</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Pipeline performance, conversion rates, and agent insights
          </Typography>
        </Box>
        <Button
          variant="outlined" size="small" startIcon={<FileDownloadIcon />}
          disabled={!a || agentData.length === 0}
          onClick={e => setExportAnchor(e.currentTarget)}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', '&:hover': { borderColor: '#4F6AF5', color: '#7B93FF' } }}
        >
          Export
        </Button>
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
          slotProps={{ paper: { sx: { bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' } } }}>
          <MenuItem onClick={() => {
            setExportAnchor(null);
            const rows = (a?.agentStats ?? []).map(s => ({
              Agent: s.agent, 'Total Leads': s.totalLeads, Closed: s.closed,
              'In Negotiation': s.inNegotiation, 'Avg Score': s.avgScore,
              'Pipeline (L)': s.pipelineLakhs,
            }));
            const csv = Papa.unparse(rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `crm-agent-stats-${Date.now()}.csv`; link.click();
            URL.revokeObjectURL(url);
          }}>
            <ListItemIcon><TableChartIcon sx={{ color: '#10B981', fontSize: 18 }} /></ListItemIcon>
            <ListItemText primary="Agent Stats CSV" slotProps={{ primary: { variant: 'body2', sx: { color: '#fff' } } }} />
          </MenuItem>
          <MenuItem onClick={() => {
            setExportAnchor(null);
            const rows = (a?.funnel ?? []).map(f => ({
              Stage: f.stage, Count: f.count, 'Conversion %': f.pct,
            }));
            const csv = Papa.unparse(rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `crm-funnel-${Date.now()}.csv`; link.click();
            URL.revokeObjectURL(url);
          }}>
            <ListItemIcon><TableChartIcon sx={{ color: '#4F6AF5', fontSize: 18 }} /></ListItemIcon>
            <ListItemText primary="Funnel Data CSV" slotProps={{ primary: { variant: 'body2', sx: { color: '#fff' } } }} />
          </MenuItem>
        </Menu>
      </Box>

      {/* KPI tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[
          { label: 'Total Pipeline',      value: `₹${totalPipeline} L`,                  sub: `${totalLeads} active leads`, color: '#10B981' },
          { label: 'Overall Conversion',  value: `${a?.overallConversionPct ?? 0}%`,     sub: 'New → Closed rate',          color: '#4F6AF5' },
          { label: 'Avg Deal Age',        value: `${Math.round(a?.avgDaysTotal ?? 0)} days`, sub: 'Time in pipeline',        color: '#F59E0B' },
          { label: 'Hot Leads',           value: a?.hotLeads ?? 0,                        sub: 'AI Score ≥ 85',              color: '#EF4444' },
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
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sourceData} dataKey="count" cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={3}>
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: '#1A2540', border: '1px solid rgba(79,106,245,0.3)', borderRadius: 8 }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(val: any) => [`${val} leads`, '']}
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
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', py: 4 }}>No data yet</Typography>
          )}
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
        {agentData.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', py: 3 }}>No agent data yet</Typography>
        ) : (
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
        )}
      </Paper>

      {/* Call Outcome Analytics */}
      {(a?.callOutcomes?.length ?? 0) > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Call Outcomes</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2 }}>
              Connected vs. missed vs. busy breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {(a?.callOutcomes ?? []).map(co => {
                const total = (a?.callOutcomes ?? []).reduce((s, c) => s + c.count, 0);
                const pct = total > 0 ? Math.round(co.count * 100 / total) : 0;
                const color = co.outcome === 'CONNECTED' ? '#10B981' : co.outcome === 'MISSED' ? '#EF4444' : '#F59E0B';
                return (
                  <Box key={co.outcome}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{co.outcome}</Typography>
                      <Typography variant="body2" sx={{ color, fontWeight: 700 }}>{co.count} ({pct}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Hourly Activity Heatmap */}
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Best Hours to Reach Leads</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2 }}>
              Activity volume by hour of day
            </Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={(a?.hourlyActivity ?? []).filter(h => h.count > 0 || h.hour % 3 === 0)}
                margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  tickFormatter={h => `${h}h`} interval={3} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{ background: '#1A2540', border: '1px solid rgba(79,106,245,0.3)', borderRadius: 8 }}
                  formatter={(val: any) => [val, 'Activities']}
                  labelFormatter={h => `${h}:00`}
                />
                <Bar dataKey="count" fill="#4F6AF5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      )}

      {/* Sales Forecast */}
      {a?.forecast && (
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Sales Forecast</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                Probability-weighted pipeline value by stage
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 900 }}>
                ₹{(a.forecast.weightedRevenueLakhs ?? 0).toLocaleString('en-IN')}L
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                expected from {a.forecast.totalPipelineLeads} pipeline leads
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 1.5 }}>
            {(a.forecast.byStage ?? []).filter(s => s.leads > 0).map(s => {
              const color = stageColors[s.stage as keyof typeof stageColors] ?? '#4F6AF5';
              return (
                <Box key={s.stage} sx={{ p: 2, borderRadius: '12px', bgcolor: '#0D1526', borderTop: `2px solid ${color}` }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {STAGE_LABELS[s.stage as keyof typeof STAGE_LABELS] ?? s.stage}
                  </Typography>
                  <Typography variant="h6" sx={{ color, fontWeight: 900, my: 0.5 }}>₹{s.weightedRevenueLakhs}L</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem' }}>
                    {s.leads} leads · {s.probabilityPct}% prob
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CRMAnalyticsPage;
