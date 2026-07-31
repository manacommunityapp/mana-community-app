import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Avatar, LinearProgress, Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';

const AIAdvisorPage: React.FC = () => {
  const [prompt, setPrompt] = React.useState('');
  const [response, setResponse] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const quickPrompts = [
    'Find 3 BHK under ₹90 Lakhs near metro',
    'Show highest rental yield properties',
    'Best investment properties in community',
    'Pet-friendly apartments available for rent',
    'Properties appreciating above 10% per year',
    'Vacant units with maintenance issues',
  ];

  const handleAsk = (q?: string) => {
    const query = q || prompt;
    if (!query) return;
    setLoading(true);
    setTimeout(() => {
      setResponse(`AI Analysis for: "${query}"\n\n✅ Found 12 matching properties in your community portfolio.\n\n📍 Top Recommendations:\n1. Flat A-1204 — 3 BHK, 1,450 sqft, ₹82.5L — AI Score: 94/100\n2. Flat B-802 — 3 BHK, 1,380 sqft, ₹78L — AI Score: 91/100\n3. Villa 7 — 3 BHK, 2,200 sqft, ₹88L — AI Score: 88/100\n\n📊 AI Insights:\n• Average rental yield: 6.8% (above community average of 5.9%)\n• Expected appreciation: +8.4% in 12 months\n• Market demand score: HIGH\n• Recommended listing price range: ₹75L – ₹92L`);
      setLoading(false);
    }, 1500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ color: '#4F6AF5' }} /> AI Property Intelligence Platform
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Natural language queries, AI valuations, investment scores, and market predictions.
        </Typography>
      </Box>

      {/* AI Search */}
      <Paper sx={{ p: 3.5, borderRadius: '24px', background: 'linear-gradient(135deg, rgba(79,106,245,0.08) 0%, rgba(16,185,129,0.04) 100%)' }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Ask the AI Property Advisor</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Box component="input" value={prompt} onChange={(e: any) => setPrompt(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. Find 3BHK under ₹90L near metro station..."
            sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', px: 2, py: 1.5, color: '#fff', fontSize: '0.9rem', outline: 'none', '&:focus': { border: '1px solid #4F6AF5' } }} />
          <Button variant="contained" onClick={() => handleAsk()} disabled={loading} startIcon={<SearchIcon />} sx={{ borderRadius: '12px', px: 3 }}>
            {loading ? 'Analyzing...' : 'Ask AI'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickPrompts.map(q => (
            <Chip key={q} label={q} onClick={() => handleAsk(q)} sx={{ bgcolor: 'rgba(79,106,245,0.1)', color: '#7B93FF', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(79,106,245,0.2)' } }} />
          ))}
        </Box>

        {response && (
          <Box sx={{ mt: 3, p: 3, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(79,106,245,0.2)', whiteSpace: 'pre-line' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>{response}</Typography>
          </Box>
        )}
      </Paper>

      {/* AI Metric Cards */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Properties Analyzed by AI', value: '2,847', icon: <HomeIcon />, color: '#4F6AF5' },
          { label: 'AI Valuations Generated', value: '1,240', icon: <AssessmentIcon />, color: '#10B981' },
          { label: 'Avg Prediction Accuracy', value: '94.2%', icon: <TrendingUpIcon />, color: '#F59E0B' },
        ].map((m, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper sx={{ p: 3, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${m.color}20`, width: 52, height: 52 }}><Box sx={{ color: m.color }}>{m.icon}</Box></Avatar>
              <Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>{m.value}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{m.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Investment Scores */}
      <Paper sx={{ p: 3.5, borderRadius: '20px' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Top Investment Opportunities — AI Ranked</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { property: 'Penthouse P1 — Embassy Springs', score: 96, yield: '8.4%', appreciation: '+12.2%', risk: 'LOW' },
            { property: 'Villa 7 — Prestige Lakeside', score: 92, yield: '7.8%', appreciation: '+9.8%', risk: 'LOW' },
            { property: 'Flat A-1204 — Brigade Orchards', score: 88, yield: '6.9%', appreciation: '+8.1%', risk: 'MEDIUM' },
          ].map((p, i) => (
            <Box key={i} sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ width: 60, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#4F6AF5', fontWeight: 800 }}>{p.score}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>AI Score</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>{p.property}</Typography>
                <LinearProgress variant="determinate" value={p.score} sx={{ mt: 1, '& .MuiLinearProgress-bar': { bgcolor: '#4F6AF5' } }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Chip label={`Yield ${p.yield}`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700 }} />
                <Chip label={p.appreciation} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700 }} />
                <Chip label={`Risk: ${p.risk}`} size="small" sx={{ bgcolor: p.risk === 'LOW' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: p.risk === 'LOW' ? '#10B981' : '#F59E0B', fontWeight: 700 }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
export default AIAdvisorPage;
