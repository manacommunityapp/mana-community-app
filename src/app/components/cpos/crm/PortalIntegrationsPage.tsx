import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Button, TextField, IconButton, Tooltip,
  CircularProgress, Divider, Avatar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { CRMNav } from './CRMNav';
import { crmService, IntegrationConfigDto } from '../../../../services/cpos/crmService';

const PORTALS = [
  { key: '99ACRES',     name: '99acres',      color: '#EF4444', icon: '🏠', domain: '99acres.com' },
  { key: 'MAGICBRICKS', name: 'MagicBricks',  color: '#F59E0B', icon: '🧱', domain: 'magicbricks.com' },
  { key: 'HOUSING',     name: 'Housing.com',  color: '#4F6AF5', icon: '🔑', domain: 'housing.com' },
  { key: 'NOBROKER',    name: 'NoBroker',     color: '#10B981', icon: '📋', domain: 'nobroker.in' },
  { key: 'FACEBOOK_AD', name: 'Facebook Ads', color: '#1877F2', icon: '📣', domain: 'meta.com' },
];

const PortalIntegrationsPage: React.FC = () => {
  const [config, setConfig] = useState<IntegrationConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState('');
  const [agentPool, setAgentPool] = useState<string[]>([]);

  // Test panel state
  const [testPortal, setTestPortal] = useState('99ACRES');
  const [testName, setTestName] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testBudget, setTestBudget] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    crmService.getIntegrationConfig()
      .then(cfg => {
        setConfig(cfg);
        setAgentPool(cfg.agentPool);
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const webhookBase = `${window.location.origin.replace(':3000', ':8080')}/api/v1/cpos/crm/leads/inbound`;
  const webhookUrl = (portal: string) => `${webhookBase}?portal=${portal}`;

  const handleAddAgent = () => {
    const trimmed = agentInput.trim();
    if (!trimmed || agentPool.includes(trimmed)) return;
    setAgentPool(prev => [...prev, trimmed]);
    setAgentInput('');
  };

  const handleRemoveAgent = (name: string) => setAgentPool(prev => prev.filter(a => a !== name));

  const handleSavePool = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await crmService.updateAgentPool(agentPool);
      setConfig(updated);
    } catch { /* keep state */ }
    finally { setSaving(false); }
  };

  const handleTestInbound = async () => {
    if (!config || !testName || !testPhone) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${webhookBase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Portal-Key': config.apiKey },
        body: JSON.stringify({
          name: testName,
          phone: testPhone,
          budgetLakhs: parseFloat(testBudget) || 0,
          portal: testPortal,
          portalLeadId: `TEST-${Date.now()}`,
        }),
      });
      if (response.ok) {
        const lead = await response.json();
        setTestResult({ ok: true, msg: `Lead created: ${lead.leadName} → assigned to ${lead.assignedTo || 'unassigned'}` });
        const updated = await crmService.getIntegrationConfig();
        setConfig(updated);
      } else {
        setTestResult({ ok: false, msg: `HTTP ${response.status} — check API key or server` });
      }
    } catch (e: unknown) {
      setTestResult({ ok: false, msg: `Error: ${e instanceof Error ? e.message : 'Network error'}` });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#4F6AF5' }} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />

      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Portal Integrations</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
          Connect 99acres, MagicBricks, Housing.com and other portals to auto-capture leads
        </Typography>
      </Box>

      {/* Summary strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
        {[
          { label: 'Inbound Leads', value: config?.totalInboundLeads ?? 0, color: '#4F6AF5' },
          { label: 'Agent Pool', value: agentPool.length, color: '#10B981' },
          { label: 'Round-Robin Index', value: config?.rrIndex ?? 0, color: '#F59E0B' },
          { label: 'Portals Configured', value: PORTALS.length, color: '#8B5CF6' },
        ].map(tile => (
          <Paper key={tile.label} sx={{ p: 2, borderRadius: '14px', borderTop: `3px solid ${tile.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.07em' }}>
              {tile.label}
            </Typography>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{tile.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Left: API Key + Webhook URLs */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>
              🔐 Your API Key
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(79,106,245,0.08)', borderRadius: '10px', p: 1.5, border: '1px solid rgba(79,106,245,0.2)' }}>
              <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.75rem', color: '#7B93FF', wordBreak: 'break-all' }}>
                {config?.apiKey ?? '—'}
              </Typography>
              <Tooltip title={copiedKey === 'apiKey' ? 'Copied!' : 'Copy'}>
                <IconButton size="small" onClick={() => copy(config?.apiKey ?? '', 'apiKey')}
                  sx={{ color: copiedKey === 'apiKey' ? '#10B981' : 'rgba(255,255,255,0.4)' }}>
                  {copiedKey === 'apiKey' ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', mt: 1, display: 'block' }}>
              Send this key in the <code>X-Portal-Key</code> header with every inbound webhook request.
            </Typography>
          </Paper>

          {/* Portal cards */}
          <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>
              🌐 Webhook URLs per Portal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {PORTALS.map(portal => (
                <Box key={portal.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontSize: '0.85rem' }}>{portal.icon}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, flex: 1 }}>{portal.name}</Typography>
                    <Chip label={portal.domain} size="small" sx={{ bgcolor: `${portal.color}15`, color: portal.color, fontSize: '0.65rem', height: 18 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px', px: 1.25, py: 0.75, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <LinkIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                    <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      POST {webhookUrl(portal.key)}
                    </Typography>
                    <Tooltip title={copiedKey === portal.key ? 'Copied!' : 'Copy URL'}>
                      <IconButton size="small" onClick={() => copy(webhookUrl(portal.key), portal.key)}
                        sx={{ color: copiedKey === portal.key ? '#10B981' : 'rgba(255,255,255,0.3)', p: 0.25 }}>
                        {copiedKey === portal.key ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Right: Agent pool + Test panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Agent pool editor */}
          <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
              👥 Round-Robin Agent Pool
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
              Inbound leads are assigned to these agents in rotation
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small" placeholder="Agent name…" value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAgent()}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <Button variant="contained" size="small" onClick={handleAddAgent}
                sx={{ borderRadius: '10px', minWidth: 40, px: 1, bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' } }}>
                <AddIcon fontSize="small" />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2, minHeight: 36 }}>
              {agentPool.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
                  No agents — inbound leads will be unassigned
                </Typography>
              )}
              {agentPool.map((agent, i) => (
                <Chip
                  key={agent}
                  label={agent}
                  size="small"
                  avatar={<Avatar sx={{ width: 18, height: 18, bgcolor: i === (config?.rrIndex ?? 0) % agentPool.length ? '#4F6AF5' : 'rgba(255,255,255,0.1)', fontSize: '0.55rem', fontWeight: 700 }}>{i + 1}</Avatar>}
                  onDelete={() => handleRemoveAgent(agent)}
                  deleteIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    bgcolor: i === (config?.rrIndex ?? 0) % agentPool.length ? 'rgba(79,106,245,0.2)' : 'rgba(255,255,255,0.06)',
                    color: i === (config?.rrIndex ?? 0) % agentPool.length ? '#7B93FF' : 'rgba(255,255,255,0.7)',
                    fontWeight: 600, fontSize: '0.72rem',
                  }}
                />
              ))}
            </Box>

            <Button variant="contained" size="small" onClick={handleSavePool} disabled={saving}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#10B981', '&:hover': { bgcolor: '#0a9668' } }}>
              {saving ? 'Saving…' : 'Save Agent Pool'}
            </Button>
          </Paper>

          {/* Test inbound webhook */}
          <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
              🧪 Test Inbound Webhook
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
              Simulate a lead arriving from a portal
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <TextField
                  select size="small" label="Portal" value={testPortal}
                  onChange={e => setTestPortal(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  SelectProps={{ native: false }}
                >
                  {PORTALS.map(p => (
                    <Box key={p.key} component="option" value={p.key} sx={{ display: 'block', px: 2, py: 1 }}>
                      {p.name}
                    </Box>
                  ))}
                </TextField>
                <TextField size="small" label="Budget (Lakhs)" type="number" value={testBudget}
                  onChange={e => setTestBudget(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
              </Box>
              <TextField size="small" label="Lead Name *" value={testName}
                onChange={e => setTestName(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
              <TextField size="small" label="Phone *" value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

              {testResult && (
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                  <Typography variant="caption" sx={{ color: testResult.ok ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: '0.72rem' }}>
                    {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
                  </Typography>
                </Box>
              )}

              <Button variant="contained" size="small" startIcon={testing ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <PlayArrowIcon />}
                onClick={handleTestInbound} disabled={testing || !testName || !testPhone}
                sx={{ alignSelf: 'flex-start', borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' } }}>
                {testing ? 'Sending…' : 'Send Test Lead'}
              </Button>
            </Box>
          </Paper>

          {/* Payload reference */}
          <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', mb: 1, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Webhook Payload Schema
            </Typography>
            <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', m: 0, lineHeight: 1.7, overflowX: 'auto' }}>
              {`POST /api/v1/cpos/crm/leads/inbound
Headers:
  X-Portal-Key: <your-api-key>
  Content-Type: application/json

Body:
{
  "name":         "Rajesh Kumar",
  "phone":        "9876543210",
  "email":        "rajesh@example.com",
  "budgetLakhs":  85,
  "propertyType": "2 BHK",
  "portal":       "99ACRES",
  "portalLeadId": "99A-12345"
}`}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Integration setup guide */}
      <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>📖 Setup Guide</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {[
            { step: '1', title: '99acres', desc: 'Manage Leads → Automation → Webhook URL. Paste the webhook URL and set header X-Portal-Key.' },
            { step: '2', title: 'MagicBricks', desc: 'Dashboard → Lead Management → API Integration → add the webhook URL.' },
            { step: '3', title: 'Housing.com', desc: 'Settings → Lead Distribution → Custom Webhook. Enter URL + API key header.' },
            { step: '4', title: 'Facebook Ads', desc: 'Meta Business Manager → Events → Lead Webhook. Use the Facebook Ads webhook URL.' },
          ].map(item => (
            <Box key={item.step} sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(79,106,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#7B93FF' }}>{item.step}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, display: 'block' }}>{item.title}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', lineHeight: 1.5 }}>{item.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Web Lead Capture Form */}
      {config && (
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
            🌐 Web Lead Capture Form
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 2 }}>
            Embed this form on your marketing website — leads go straight into the CRM pipeline.
          </Typography>
          <Box sx={{ bgcolor: '#0D1526', borderRadius: '12px', p: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mb: 1, fontFamily: 'monospace' }}>
              HTML embed snippet — paste into your website:
            </Typography>
            <Box
              component="pre"
              sx={{
                color: '#7B93FF', fontSize: '0.72rem', fontFamily: 'monospace',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0,
                maxHeight: 220, overflowY: 'auto',
              }}
            >{`<form action="${window.location.origin.replace(':3000','').replace(':5173','')}/api/v1/cpos/crm/leads/inbound" method="POST" style="display:flex;flex-direction:column;gap:12px;max-width:400px">
  <input type="hidden" name="source" value="WEBSITE" />
  <input name="leadName" placeholder="Full Name *" required style="padding:10px;border-radius:6px;border:1px solid #ccc" />
  <input name="phone" placeholder="Phone Number" style="padding:10px;border-radius:6px;border:1px solid #ccc" />
  <input name="email" type="email" placeholder="Email Address" style="padding:10px;border-radius:6px;border:1px solid #ccc" />
  <input name="budgetDisplay" placeholder="Budget (e.g. 80 Lakhs)" style="padding:10px;border-radius:6px;border:1px solid #ccc" />
  <button type="submit" style="padding:12px;background:#4F6AF5;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer">
    Submit Enquiry
  </button>
</form>
<script>
  document.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const r = await fetch(e.target.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Portal-Key': '${config.apiKey}' },
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    if (r.ok) { e.target.innerHTML = '<p style="color:#10B981;font-weight:bold">✓ Thank you! We will reach out shortly.</p>'; }
  });
</script>`}</Box>
          </Box>
          <Button
            variant="outlined" size="small" startIcon={<ContentCopyIcon />}
            onClick={() => {
              const snippet = `<!-- MANA CRM Web Form: API Key ${config.apiKey} -->`;
              navigator.clipboard.writeText(snippet).then(() => {
                setCopiedKey('webform');
                setTimeout(() => setCopiedKey(null), 2000);
              });
            }}
          >
            {copiedKey === 'webform' ? '✓ Copied' : 'Copy API Key for form'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default PortalIntegrationsPage;
