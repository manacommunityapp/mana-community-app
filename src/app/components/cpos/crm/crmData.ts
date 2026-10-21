export type Stage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED';
export type LeadSource = 'WALK_IN' | 'BROKER' | 'PORTAL' | 'WHATSAPP' | 'REFERRAL' | 'WEBSITE';
export type ActivityType = 'CALL' | 'SITE_VISIT' | 'EMAIL' | 'WHATSAPP' | 'NOTE';

export interface Activity {
  id: string;
  type: ActivityType;
  by: string;
  notes: string;
  date: string;
  callOutcome?: string | null;
  callDurationMin?: number | null;
}

export interface LeadTag {
  id: number;
  name: string;
  color: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  budget: string;
  budgetLakhs: number;
  type: string;
  stage: Stage;
  source: LeadSource;
  score: number;
  daysInStage: number;
  daysTotal: number;
  assignedTo: string;
  activities: Activity[];
  followUpAt?: string | null;
  followUpNote?: string | null;
  tags?: LeadTag[];
}

export const isFollowUpDue = (lead: Lead): boolean => {
  if (!lead.followUpAt) return false;
  return new Date(lead.followUpAt) <= new Date();
};

export const isFollowUpUpcoming = (lead: Lead): boolean => {
  if (!lead.followUpAt) return false;
  const t = new Date(lead.followUpAt).getTime() - Date.now();
  return t > 0 && t <= 24 * 60 * 60 * 1000;
};

export const formatFollowUpDate = (followUpAt: string): string => {
  const d = new Date(followUpAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / 3600000);
  if (diffMs < 0) {
    const agoHrs = Math.abs(diffHrs);
    return agoHrs < 24 ? `${agoHrs}h overdue` : `${Math.ceil(Math.abs(diffMs) / 86400000)}d overdue`;
  }
  if (diffHrs < 24) return `in ${diffHrs}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const STAGES: Stage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'CLOSED'];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  CLOSED: 'Closed',
};

export const stageColors: Record<Stage, string> = {
  NEW: '#8B5CF6',
  CONTACTED: '#4F6AF5',
  QUALIFIED: '#06B6D4',
  SITE_VISIT: '#F59E0B',
  NEGOTIATION: '#EC4899',
  CLOSED: '#10B981',
};

export const sourceColors: Record<LeadSource, string> = {
  WALK_IN: '#10B981',
  BROKER: '#4F6AF5',
  PORTAL: '#8B5CF6',
  WHATSAPP: '#25D366',
  REFERRAL: '#F59E0B',
  WEBSITE: '#06B6D4',
};

export const activityIcons: Record<ActivityType, string> = {
  CALL: '📞',
  SITE_VISIT: '🏠',
  EMAIL: '📧',
  WHATSAPP: '💬',
  NOTE: '📝',
};

export const scoreColor = (score: number): string => {
  if (score >= 85) return '#10B981';
  if (score >= 65) return '#F59E0B';
  return '#EF4444';
};

export interface ScoreBreakdown {
  budgetMatch: number;
  engagement: number;
  stageProgress: number;
  sourceQuality: number;
  velocity: number;
}

export const SCORE_FACTORS: Array<{ key: keyof ScoreBreakdown; label: string; max: number }> = [
  { key: 'budgetMatch',    label: 'Budget Range',      max: 25 },
  { key: 'engagement',     label: 'Engagement',        max: 25 },
  { key: 'stageProgress',  label: 'Stage Progress',    max: 25 },
  { key: 'sourceQuality',  label: 'Source Quality',    max: 15 },
  { key: 'velocity',       label: 'Response Velocity', max: 10 },
];

export const computeLeadScore = (lead: Lead): { score: number; breakdown: ScoreBreakdown } => {
  const budgetMatch   = lead.budgetLakhs >= 200 ? 25 : lead.budgetLakhs >= 100 ? 20 : lead.budgetLakhs >= 60 ? 14 : 8;
  const actCount      = lead.activities.filter(a => a.type !== 'NOTE').length;
  const engagement    = Math.min(25, actCount * 6);
  const stageIdx      = STAGES.indexOf(lead.stage);
  const stageProgress = Math.round((stageIdx / (STAGES.length - 1)) * 25);
  const sourceQuality = (lead.source === 'WALK_IN' || lead.source === 'REFERRAL') ? 15 : lead.source === 'BROKER' ? 12 : 8;
  const velocity      = lead.daysInStage <= 2 ? 10 : lead.daysInStage <= 5 ? 7 : lead.daysInStage <= 10 ? 4 : 1;
  const score         = Math.min(100, budgetMatch + engagement + stageProgress + sourceQuality + velocity);
  return { score, breakdown: { budgetMatch, engagement, stageProgress, sourceQuality, velocity } };
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'L001', name: 'Arun Prakash', phone: '+91 98111 22334', email: 'arun.prakash@email.com',
    budget: '₹1.2 Cr', budgetLakhs: 120, type: '3 BHK', stage: 'NEW', source: 'PORTAL',
    score: 72, daysInStage: 2, daysTotal: 2, assignedTo: 'Ravi Sharma',
    activities: [
      { id: 'A1', type: 'NOTE', by: 'System', notes: 'Lead captured from MagicBricks portal.', date: 'Oct 19, 2026' },
    ],
  },
  {
    id: 'L002', name: 'Kavita Menon', phone: '+91 97222 33445', email: 'kavita.menon@email.com',
    budget: '₹85 L', budgetLakhs: 85, type: '2 BHK', stage: 'NEW', source: 'WHATSAPP',
    score: 55, daysInStage: 1, daysTotal: 1, assignedTo: 'Priya Nair',
    activities: [
      { id: 'A2', type: 'NOTE', by: 'System', notes: 'Enquiry via WhatsApp campaign.', date: 'Oct 20, 2026' },
    ],
  },
  {
    id: 'L003', name: 'Deepak Joshi', phone: '+91 96333 44556', email: 'deepak.joshi@email.com',
    budget: '₹2.5 Cr', budgetLakhs: 250, type: 'Villa', stage: 'CONTACTED', source: 'BROKER',
    score: 85, daysInStage: 3, daysTotal: 8, assignedTo: 'Ravi Sharma',
    activities: [
      { id: 'A3', type: 'NOTE', by: 'System', notes: 'Broker: Anand Properties referred this lead.', date: 'Oct 12, 2026' },
      { id: 'A4', type: 'CALL', by: 'Ravi Sharma', notes: 'Initial call done. Client interested in east-facing Villa, prefers ground floor.', date: 'Oct 14, 2026' },
      { id: 'A5', type: 'WHATSAPP', by: 'Ravi Sharma', notes: 'Sent project brochure and pricing sheet.', date: 'Oct 15, 2026' },
    ],
  },
  {
    id: 'L004', name: 'Anita Krishnamurthy', phone: '+91 91888 99001', email: 'anita.k@email.com',
    budget: '₹95 L', budgetLakhs: 95, type: '2 BHK', stage: 'CONTACTED', source: 'WEBSITE',
    score: 63, daysInStage: 6, daysTotal: 9, assignedTo: 'Priya Nair',
    activities: [
      { id: 'A16', type: 'EMAIL', by: 'System', notes: 'Enquiry from website contact form.', date: 'Oct 12, 2026' },
      { id: 'A17', type: 'CALL', by: 'Priya Nair', notes: 'Initial call. Looking for investment property.', date: 'Oct 15, 2026' },
    ],
  },
  {
    id: 'L005', name: 'Sanjay Reddy', phone: '+91 95444 55667', email: 'sanjay.reddy@email.com',
    budget: '₹1.6 Cr', budgetLakhs: 160, type: '3 BHK', stage: 'QUALIFIED', source: 'REFERRAL',
    score: 91, daysInStage: 4, daysTotal: 12, assignedTo: 'Priya Nair',
    activities: [
      { id: 'A6', type: 'CALL', by: 'Priya Nair', notes: 'Discussed floor plan preferences. Ready for site visit next week.', date: 'Oct 10, 2026' },
      { id: 'A7', type: 'EMAIL', by: 'Priya Nair', notes: 'Sent unit availability list and payment plan.', date: 'Oct 12, 2026' },
      { id: 'A8', type: 'CALL', by: 'Priya Nair', notes: 'Budget confirmed at ₹1.6 Cr. Prefers North Tower, high floor.', date: 'Oct 17, 2026' },
    ],
  },
  {
    id: 'L006', name: 'Rohan Gupta', phone: '+91 94555 66778', email: 'rohan.gupta@email.com',
    budget: '₹3.2 Cr', budgetLakhs: 320, type: 'Penthouse', stage: 'SITE_VISIT', source: 'WALK_IN',
    score: 94, daysInStage: 2, daysTotal: 18, assignedTo: 'Ravi Sharma',
    activities: [
      { id: 'A9', type: 'CALL', by: 'Ravi Sharma', notes: 'Walk-in enquiry. Very serious buyer — looking for penthouse.', date: 'Oct 3, 2026' },
      { id: 'A10', type: 'SITE_VISIT', by: 'Ravi Sharma', notes: 'First site visit. Very positive feedback on amenities and skyline view.', date: 'Oct 14, 2026' },
      { id: 'A11', type: 'SITE_VISIT', by: 'Ravi Sharma', notes: 'Second visit — brought family. Wife liked view from P1. Moving to negotiation soon.', date: 'Oct 19, 2026' },
    ],
  },
  {
    id: 'L007', name: 'Meera Nambiar', phone: '+91 93666 77889', email: 'meera.nambiar@email.com',
    budget: '₹1.4 Cr', budgetLakhs: 140, type: '3 BHK', stage: 'NEGOTIATION', source: 'PORTAL',
    score: 88, daysInStage: 5, daysTotal: 24, assignedTo: 'Priya Nair',
    activities: [
      { id: 'A12', type: 'CALL', by: 'Priya Nair', notes: 'Client asking for ₹5L discount. Escalated to Sales Manager.', date: 'Oct 16, 2026' },
      { id: 'A13', type: 'EMAIL', by: 'Priya Nair', notes: 'Sent final pricing with covered parking included as concession.', date: 'Oct 18, 2026' },
      { id: 'A14', type: 'CALL', by: 'Priya Nair', notes: 'Client agreed on price. Agreement drafting in progress.', date: 'Oct 20, 2026' },
    ],
  },
  {
    id: 'L008', name: 'Vikram Seth', phone: '+91 92777 88990', email: 'vikram.seth@email.com',
    budget: '₹1.8 Cr', budgetLakhs: 180, type: 'Commercial', stage: 'CLOSED', source: 'BROKER',
    score: 100, daysInStage: 1, daysTotal: 32, assignedTo: 'Ravi Sharma',
    activities: [
      { id: 'A15', type: 'NOTE', by: 'System', notes: 'Deal closed. Sale deed registration scheduled for Oct 28, 2026.', date: 'Oct 20, 2026' },
    ],
  },
];
