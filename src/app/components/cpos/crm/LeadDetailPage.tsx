import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box, Paper, Typography, Chip, Avatar, Button, Tabs, Tab, Divider,
  LinearProgress, TextField, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddIcon from '@mui/icons-material/Add';
import {
  Lead, Activity, ActivityType, Stage, STAGES, STAGE_LABELS,
  stageColors, sourceColors, scoreColor, activityIcons, INITIAL_LEADS,
} from './crmData';

const ACTIVITY_TYPES: ActivityType[] = ['CALL', 'SITE_VISIT', 'EMAIL', 'WHATSAPP', 'NOTE'];

const LeadDetailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const baseLead = INITIAL_LEADS.find(l => l.id === leadId);
  const [lead, setLead] = useState<Lead | null>(baseLead ?? null);
  const [tab, setTab] = useState(0);
  const [logType, setLogType] = useState<ActivityType>('CALL');
  const [logNotes, setLogNotes] = useState('');

  if (!lead) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>Lead not found.</Typography>
        <Button onClick={() => navigate('/cpos/crm/leads')} sx={{ mt: 2 }}>Back to Leads</Button>
      </Box>
    );
  }

  const handleStageChange = (newStage: Stage) => {
    setLead(prev => prev ? { ...prev, stage: newStage, daysInStage: 0 } : prev);
  };

  const handleLogActivity = () => {
    if (!logNotes.trim()) return;
    const activity: Activity = {
      id: `A${Date.now()}`,
      type: logType,
      by: lead.assignedTo,
      notes: logNotes,
      date: 'Oct 21, 2026',
    };
    setLead(prev => prev ? { ...prev, activities: [activity, ...prev.activities] } : prev);
    setLogNotes('');
  };

  const nextStageIndex = STAGES.indexOf(lead.stage) + 1;
  const nextStage = nextStageIndex < STAGES.length ? STAGES[nextStageIndex] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          CRM Pipeline / Leads /
        </Typography>
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>{lead.name}</Typography>
      </Box>

      {/* Lead header card */}
      <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(79,106,245,0.08) 0%, rgba(16,185,129,0.04) 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: `${stageColors[lead.stage]}25`, color: stageColors[lead.stage], fontWeight: 800, fontSize: '1.2rem', borderRadius: '16px' }}>
              {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>{lead.name}</Typography>
                <Chip label={STAGE_LABELS[lead.stage]} size="small"
                  sx={{ bgcolor: `${stageColors[lead.stage]}20`, color: stageColors[lead.stage], fontWeight: 700 }} />
                <Chip label={`Score: ${lead.score}`} size="small"
                  sx={{ bgcolor: `${scoreColor(lead.score)}15`, color: scoreColor(lead.score), fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{lead.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{lead.email}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {nextStage && (
              <Button variant="contained" size="small"
                onClick={() => handleStageChange(nextStage)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: stageColors[nextStage], '&:hover': { opacity: 0.85 } }}>
                Move to {STAGE_LABELS[nextStage]} →
              </Button>
            )}
            <Button variant="outlined" size="small" onClick={() => navigate('/cpos/crm')}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
              View in Pipeline
            </Button>
          </Box>
        </Box>

        {/* Stage progress */}
        <Box sx={{ mt: 3, display: 'flex', gap: 0.5 }}>
          {STAGES.map((s, i) => {
            const idx = STAGES.indexOf(lead.stage);
            const done = i <= idx;
            return (
              <Tooltip key={s} title={STAGE_LABELS[s]}>
                <Box onClick={() => handleStageChange(s)}
                  sx={{ flex: 1, height: 5, borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
                    bgcolor: done ? stageColors[s] : 'rgba(255,255,255,0.08)',
                    opacity: s === lead.stage ? 1 : done ? 0.6 : 0.3,
                  }} />
              </Tooltip>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>NEW</Typography>
          <Typography variant="caption" sx={{ color: stageColors[lead.stage], fontWeight: 700, fontSize: '0.65rem' }}>
            {STAGE_LABELS[lead.stage]} · {lead.daysInStage}d in stage
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>CLOSED</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: tabs */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', mb: 3,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'none', minHeight: 44 },
              '& .Mui-selected': { color: '#7B93FF' },
            }}>
            <Tab label="Overview" />
            <Tab label={`Activity (${lead.activities.length})`} />
          </Tabs>

          {/* Tab 0: Overview */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1.5 }}>
                {[
                  { label: 'Budget', value: lead.budget, color: '#10B981' },
                  { label: 'Property Type', value: lead.type, color: '#4F6AF5' },
                  { label: 'Lead Source', value: lead.source.replace('_', ' '), color: sourceColors[lead.source] },
                  { label: 'Assigned To', value: lead.assignedTo, color: '#F59E0B' },
                  { label: 'Days in Pipeline', value: `${lead.daysTotal} days`, color: '#8B5CF6' },
                  { label: 'Lead ID', value: lead.id, color: 'rgba(255,255,255,0.5)' },
                ].map(item => (
                  <Paper key={item.label} sx={{ p: 2, borderRadius: '14px', bgcolor: '#0D1526' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: item.color, fontWeight: 700, mt: 0.5 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Stage change selector */}
              <Paper sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#0D1526' }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5 }}>Change Stage</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {STAGES.map(s => (
                    <Chip key={s} label={STAGE_LABELS[s]} size="small"
                      onClick={() => handleStageChange(s)}
                      sx={{
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: lead.stage === s ? stageColors[s] : `${stageColors[s]}18`,
                        color: lead.stage === s ? '#fff' : stageColors[s],
                      }} />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}

          {/* Tab 1: Activities */}
          {tab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Log activity */}
              <Paper sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#0D1526' }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5 }}>
                  <AddIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} /> Log Activity
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField select size="small" value={logType}
                    onChange={e => setLogType(e.target.value as ActivityType)}
                    sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                    {ACTIVITY_TYPES.map(t => (
                      <MenuItem key={t} value={t}>{activityIcons[t]} {t.replace('_', ' ')}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" placeholder="Notes…" value={logNotes}
                    onChange={e => setLogNotes(e.target.value)}
                    multiline maxRows={3}
                    sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                  <Button variant="contained" size="small" onClick={handleLogActivity}
                    disabled={!logNotes.trim()}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5', alignSelf: 'flex-start' }}>
                    Log
                  </Button>
                </Box>
              </Paper>

              {/* Timeline */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', pl: 2.5,
                '&::before': { content: '""', position: 'absolute', left: 10, top: 16, bottom: 16, width: 2, bgcolor: 'rgba(79,106,245,0.2)' } }}>
                {lead.activities.map(activity => (
                  <Box key={activity.id} sx={{ position: 'relative', pb: 2.5 }}>
                    <Box sx={{ position: 'absolute', left: -22, top: 2, width: 22, height: 22,
                      borderRadius: '50%', bgcolor: '#0D1526', border: '2px solid rgba(79,106,245,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                      {activityIcons[activity.type]}
                    </Box>
                    <Paper sx={{ p: 1.75, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700, fontSize: '0.72rem' }}>
                          {activity.type.replace('_', ' ')} · {activity.by}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>
                          {activity.date}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontSize: '0.85rem' }}>
                        {activity.notes}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Right sidebar: AI score card */}
        <Box sx={{ width: 240, flexShrink: 0 }}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(79,106,245,0.05) 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SmartToyIcon sx={{ color: '#10B981', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>AI Lead Score</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
              <Typography variant="h2" sx={{ color: scoreColor(lead.score), fontWeight: 900, lineHeight: 1 }}>
                {lead.score}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>/ 100</Typography>
            </Box>
            <LinearProgress variant="determinate" value={lead.score}
              sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: scoreColor(lead.score) } }} />
            <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />
            {[
              { label: 'Budget Match', val: lead.budgetLakhs >= 100 ? 'High' : 'Medium', color: '#10B981' },
              { label: 'Engagement', val: `${lead.activities.length} activities`, color: '#4F6AF5' },
              { label: 'Days in Pipeline', val: `${lead.daysTotal} days`, color: '#F59E0B' },
              { label: 'Source Quality', val: lead.source === 'WALK_IN' || lead.source === 'REFERRAL' ? 'High' : 'Medium', color: '#8B5CF6' },
            ].map(item => (
              <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{item.label}</Typography>
                <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, fontSize: '0.72rem' }}>{item.val}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default LeadDetailPage;
