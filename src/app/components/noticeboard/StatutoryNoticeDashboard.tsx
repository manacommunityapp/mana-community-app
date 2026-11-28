import React, { useState } from 'react';
import {
  FileText, Send, Eye, Bell, AlertTriangle, Shield, Users, Filter,
  CheckCircle2, XCircle, Clock, ChevronRight, Mail, Smartphone,
  MessageSquare, Globe, Megaphone, Hash, Layers, Target
} from 'lucide-react';
import type {
  StatutoryNotice, DeliveryChannelData, ReadReceipt, AudienceGroup,
  AudienceRule, AudienceMember
} from '../../../services/noticeboard/statutoryNoticeService';

const demoNotices: StatutoryNotice[] = [
  { id: 1, communityId: 'COMM-001', title: 'AGM Notice — Annual General Meeting FY 2026-27', body: 'All flat owners are hereby informed that the Annual General Meeting will be held on 15th December 2026 at 10:00 AM in the community hall.', category: 'AGM_SUMMONS', priority: 'CRITICAL', status: 'PUBLISHED', statutory: true, readReceiptRequired: true, publishedBy: 'Rajesh Kapoor', publishedByRole: 'RWA Secretary', publishedAt: '2026-11-20T09:00:00', effectiveDate: '2026-12-15', expiryDate: '2026-12-16', attachmentUrl: '/docs/agm-notice-2026.pdf', attachmentName: 'AGM_Notice_2026.pdf', audienceGroupId: 1, totalRecipients: 4000, deliveredCount: 3800, openedCount: 3200, pinned: true, displayOrder: 1 },
  { id: 2, communityId: 'COMM-001', title: 'Water Tank Cleaning — Supply Interruption 28 Nov', body: 'Water supply will be interrupted on 28th November 2026 from 9:00 AM to 3:00 PM for annual tank cleaning.', category: 'WATER_SUPPLY', priority: 'HIGH', status: 'PUBLISHED', statutory: false, readReceiptRequired: true, publishedBy: 'Facility Manager', publishedByRole: 'Operations', publishedAt: '2026-11-25T14:00:00', effectiveDate: '2026-11-28', audienceGroupId: 1, totalRecipients: 4000, deliveredCount: 4000, openedCount: 2800, pinned: true, displayOrder: 2 },
  { id: 3, communityId: 'COMM-001', title: 'Revised Parking Rules — Effective 1st Dec 2026', body: 'Parking rules revised: visitor parking limited to 4 hours, no commercial vehicles overnight, EV charging slots designated in Basement 2.', category: 'PARKING_RULES', priority: 'NORMAL', status: 'PUBLISHED', statutory: true, readReceiptRequired: true, publishedBy: 'Rajesh Kapoor', publishedByRole: 'RWA Secretary', publishedAt: '2026-11-22T11:00:00', effectiveDate: '2026-12-01', audienceGroupId: 2, totalRecipients: 480, deliveredCount: 420, openedCount: 310, pinned: false, displayOrder: 3 },
  { id: 4, communityId: 'COMM-001', title: 'Fire Safety Drill — Mandatory Participation', body: 'Annual fire safety drill on 5th December 2026. Assembly points by tower.', category: 'FIRE_SAFETY', priority: 'HIGH', status: 'PUBLISHED', statutory: false, readReceiptRequired: false, publishedBy: 'Safety Officer', publishedByRole: 'Fire & Safety', publishedAt: '2026-11-26T08:00:00', effectiveDate: '2026-12-05', audienceGroupId: 1, totalRecipients: 4000, deliveredCount: 3500, openedCount: 2000, pinned: false, displayOrder: 4 },
  { id: 5, communityId: 'COMM-001', title: 'MC Election — Nomination Filing Open', body: 'Nominations open from 1st Dec to 10th Dec 2026. Only owners with no pending dues eligible.', category: 'SOCIETY_ELECTION', priority: 'CRITICAL', status: 'DRAFT', statutory: true, readReceiptRequired: true, publishedBy: 'Election Officer', publishedByRole: 'Appointed Officer', publishedAt: '', effectiveDate: '2026-12-01', expiryDate: '2026-12-10', audienceGroupId: 3, totalRecipients: 0, deliveredCount: 0, openedCount: 0, pinned: false, displayOrder: 5 },
];

const demoChannels: DeliveryChannelData[] = [
  { id: 1, noticeId: 1, channelType: 'APP_PUSH', channelStatus: 'COMPLETED', totalSent: 4000, totalDelivered: 3800, totalOpened: 3000, totalFailed: 200, totalBounced: 0, dispatchStartedAt: '2026-11-20T09:01:00', dispatchCompletedAt: '2026-11-20T09:03:00', deliveryRatePercent: 95.0, openRatePercent: 78.9 },
  { id: 2, noticeId: 1, channelType: 'EMAIL', channelStatus: 'COMPLETED', totalSent: 4000, totalDelivered: 3700, totalOpened: 2500, totalFailed: 100, totalBounced: 200, dispatchStartedAt: '2026-11-20T09:01:00', dispatchCompletedAt: '2026-11-20T09:05:00', deliveryRatePercent: 92.5, openRatePercent: 67.6 },
  { id: 3, noticeId: 1, channelType: 'WHATSAPP', channelStatus: 'COMPLETED', totalSent: 4000, totalDelivered: 3900, totalOpened: 3500, totalFailed: 100, totalBounced: 0, dispatchStartedAt: '2026-11-20T09:02:00', dispatchCompletedAt: '2026-11-20T09:04:00', deliveryRatePercent: 97.5, openRatePercent: 89.7 },
];

const demoReceipts: ReadReceipt[] = [
  { id: 1, noticeId: 1, flatNumber: 'A-101', towerName: 'Tower A', recipientName: 'Sharma Family', recipientEmail: 'a101@residents.mana.app', beaconStatus: 'OPENED', sentAt: '2026-11-20T09:01:00', deliveredAt: '2026-11-20T09:02:00', openedAt: '2026-11-20T09:15:00', deliveredVia: 'WHATSAPP', legallyValid: true, signatureHash: 'SHA256:a1b2c3d4e5f6' },
  { id: 2, noticeId: 1, flatNumber: 'A-102', towerName: 'Tower A', recipientName: 'Gupta Family', recipientEmail: 'a102@residents.mana.app', beaconStatus: 'OPENED', sentAt: '2026-11-20T09:01:00', deliveredAt: '2026-11-20T09:02:00', openedAt: '2026-11-20T09:20:00', deliveredVia: 'EMAIL', legallyValid: true, signatureHash: 'SHA256:f6e5d4c3b2a1' },
  { id: 3, noticeId: 1, flatNumber: 'B-201', towerName: 'Tower B', recipientName: 'Patel Family', recipientEmail: 'b201@residents.mana.app', beaconStatus: 'DELIVERED', sentAt: '2026-11-20T09:01:00', deliveredAt: '2026-11-20T09:03:00', deliveredVia: 'APP_PUSH', legallyValid: true },
  { id: 4, noticeId: 1, flatNumber: 'C-301', towerName: 'Tower C', recipientName: 'Singh Family', recipientEmail: 'c301@residents.mana.app', beaconStatus: 'OPENED', sentAt: '2026-11-20T09:01:00', deliveredAt: '2026-11-20T09:02:00', openedAt: '2026-11-20T09:30:00', deliveredVia: 'WHATSAPP', legallyValid: true, signatureHash: 'SHA256:1a2b3c4d5e6f' },
  { id: 5, noticeId: 1, flatNumber: 'D-401', towerName: 'Tower D', recipientName: 'Reddy Family', recipientEmail: 'd401@residents.mana.app', beaconStatus: 'BOUNCED', sentAt: '2026-11-20T09:01:00', deliveredVia: 'EMAIL', legallyValid: false },
  { id: 6, noticeId: 1, flatNumber: 'E-501', towerName: 'Tower E', recipientName: 'Kumar Family', recipientEmail: 'e501@residents.mana.app', beaconStatus: 'FAILED', sentAt: '2026-11-20T09:01:00', deliveredVia: 'APP_PUSH', legallyValid: false },
];

const demoGroups: AudienceGroup[] = [
  { id: 1, communityId: 'COMM-001', name: 'All Residents', description: 'Every flat owner and tenant', dynamic: false, systemDefined: true, cachedMemberCount: 4000, lastEvaluatedAt: '2026-11-28T00:00:00', groupStatus: 'ACTIVE' },
  { id: 2, communityId: 'COMM-001', name: 'Tower C/D — 4-Wheeler Owners, No Dues >₹5K', description: 'Owners of Tower C & D who own 4-wheelers and have no pending dues above ₹5,000', dynamic: true, systemDefined: false, cachedMemberCount: 480, lastEvaluatedAt: '2026-11-27T18:00:00', groupStatus: 'ACTIVE' },
  { id: 3, communityId: 'COMM-001', name: 'All Flat Owners', description: 'Only flat owners, no tenants', dynamic: true, systemDefined: false, cachedMemberCount: 3200, lastEvaluatedAt: '2026-11-27T18:00:00', groupStatus: 'ACTIVE' },
  { id: 4, communityId: 'COMM-001', name: 'Managing Committee', description: 'MC President, Secretary, Treasurer & members', dynamic: false, systemDefined: true, cachedMemberCount: 9, lastEvaluatedAt: '2026-11-28T00:00:00', groupStatus: 'ACTIVE' },
];

const demoRules: AudienceRule[] = [
  { id: 1, audienceGroupId: 2, field: 'TOWER', operator: 'IN', value: 'Tower C, Tower D', conjunction: 'AND', ruleOrder: 1 },
  { id: 2, audienceGroupId: 2, field: 'VEHICLE_TYPE', operator: 'EQUALS', value: '4-Wheeler', conjunction: 'AND', ruleOrder: 2 },
  { id: 3, audienceGroupId: 2, field: 'PENDING_DUES_AMOUNT', operator: 'LESS_EQUAL', value: '5000', ruleOrder: 3 },
  { id: 4, audienceGroupId: 3, field: 'OWNERSHIP_TYPE', operator: 'EQUALS', value: 'OWNER', ruleOrder: 1 },
];

const priorityColor = (p: string) => ({ CRITICAL: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800', NORMAL: 'bg-blue-100 text-blue-800', LOW: 'bg-gray-100 text-gray-800' }[p] || 'bg-gray-100 text-gray-800');
const statusColor = (s: string) => ({ PUBLISHED: 'bg-green-100 text-green-800', DRAFT: 'bg-gray-100 text-gray-800', SCHEDULED: 'bg-blue-100 text-blue-800', EXPIRED: 'bg-yellow-100 text-yellow-800', RECALLED: 'bg-red-100 text-red-800', OPENED: 'bg-green-100 text-green-800', DELIVERED: 'bg-blue-100 text-blue-800', SENT: 'bg-yellow-100 text-yellow-800', ACKNOWLEDGED: 'bg-purple-100 text-purple-800', BOUNCED: 'bg-orange-100 text-orange-800', FAILED: 'bg-red-100 text-red-800', QUEUED: 'bg-gray-100 text-gray-800', COMPLETED: 'bg-green-100 text-green-800', PARTIAL_FAILURE: 'bg-orange-100 text-orange-800', ACTIVE: 'bg-green-100 text-green-800' }[s] || 'bg-gray-100 text-gray-800');
const channelIcon = (c: string) => ({ APP_PUSH: Smartphone, EMAIL: Mail, WHATSAPP: MessageSquare, SMS: MessageSquare, IN_APP: Globe }[c] || Bell);
const categoryIcon = (c: string) => ({ AGM_SUMMONS: Megaphone, WATER_SUPPLY: Globe, PARKING_RULES: Hash, FIRE_SAFETY: AlertTriangle, SOCIETY_ELECTION: Users, GENERAL_CIRCULAR: FileText }[c] || FileText);

export default function StatutoryNoticeDashboard() {
  const [activeTab, setActiveTab] = useState<'notices' | 'audience'>('notices');
  const [selectedNotice, setSelectedNotice] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  const tabs = [
    { key: 'notices' as const, label: 'Notices & Read Receipts', icon: FileText },
    { key: 'audience' as const, label: 'Audience Segmentation', icon: Target },
  ];

  const selectedNoticeData = selectedNotice ? demoNotices.find(n => n.id === selectedNotice) : null;
  const noticeChannels = selectedNotice ? demoChannels.filter(c => c.noticeId === selectedNotice) : [];
  const noticeReceipts = selectedNotice ? demoReceipts.filter(r => r.noticeId === selectedNotice) : [];
  const groupRules = selectedGroup ? demoRules.filter(r => r.audienceGroupId === selectedGroup) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Megaphone className="w-6 h-6 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Noticeboards & Circulars</h1>
            <p className="text-sm text-gray-500">Statutory read-receipts, multi-channel delivery & audience segmentation</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedNotice(null); setSelectedGroup(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'notices' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Published Notices', value: demoNotices.filter(n => n.status === 'PUBLISHED').length, icon: FileText, color: 'bg-purple-500' },
                { label: 'Total Sent', value: '12,000', icon: Send, color: 'bg-blue-500' },
                { label: 'Avg Open Rate', value: '76.5%', icon: Eye, color: 'bg-green-500' },
                { label: 'Statutory Pending', value: demoNotices.filter(n => n.statutory && n.status === 'DRAFT').length, icon: Shield, color: 'bg-orange-500' },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                  <div className={`p-2 ${c.color} rounded-lg`}><c.icon className="w-5 h-5 text-white" /></div>
                  <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
                </div>
              ))}
            </div>

            {/* Notices List */}
            <div className="bg-white rounded-xl border mb-6">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">All Notices & Circulars</h3></div>
              <div className="divide-y">
                {demoNotices.map(n => {
                  const CatIcon = categoryIcon(n.category);
                  const openRate = n.totalRecipients > 0 ? Math.round((n.openedCount / n.totalRecipients) * 100) : 0;
                  return (
                    <div key={n.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedNotice === n.id ? 'bg-purple-50' : ''}`}
                      onClick={() => setSelectedNotice(selectedNotice === n.id ? null : n.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg mt-0.5"><CatIcon className="w-4 h-4 text-gray-600" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{n.title}</h4>
                              {n.pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Pinned</span>}
                              {n.statutory && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{n.body}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              <span>{n.publishedBy} ({n.publishedByRole})</span>
                              <span>Effective: {n.effectiveDate}</span>
                              {n.attachmentName && <span className="text-blue-500">📎 {n.attachmentName}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(n.priority)}`}>{n.priority}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(n.status)}`}>{n.status}</span>
                            </div>
                            {n.totalRecipients > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${openRate}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{openRate}% opened</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Detail for selected notice */}
            {selectedNotice && selectedNoticeData && (
              <>
                {/* Channel Breakdown */}
                <div className="bg-white rounded-xl border mb-6">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Multi-Channel Delivery — {selectedNoticeData.title.substring(0, 40)}...</h3>
                    <button onClick={() => setSelectedNotice(null)} className="text-xs text-purple-600 hover:underline">Close</button>
                  </div>
                  {noticeChannels.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4 p-4">
                      {noticeChannels.map(ch => {
                        const ChIcon = channelIcon(ch.channelType);
                        return (
                          <div key={ch.id} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <ChIcon className="w-5 h-5 text-purple-600" />
                              <h4 className="font-semibold">{ch.channelType.replace('_', ' ')}</h4>
                              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${statusColor(ch.channelStatus)}`}>{ch.channelStatus}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">Sent</span><p className="font-semibold">{ch.totalSent.toLocaleString()}</p></div>
                              <div><span className="text-gray-500">Delivered</span><p className="font-semibold text-blue-600">{ch.totalDelivered.toLocaleString()}</p></div>
                              <div><span className="text-gray-500">Opened</span><p className="font-semibold text-green-600">{ch.totalOpened.toLocaleString()}</p></div>
                              <div><span className="text-gray-500">Failed</span><p className="font-semibold text-red-600">{ch.totalFailed}</p></div>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Delivery Rate</span><span>{ch.deliveryRatePercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${ch.deliveryRatePercent}%` }} />
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-2 mb-1">
                                <span>Open Rate</span><span>{ch.openRatePercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${ch.openRatePercent}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500">No delivery channels for this notice.</div>
                  )}
                </div>

                {/* Read Receipts */}
                <div className="bg-white rounded-xl border mb-6">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">Legal Read Receipts — Per Flat Tracking</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Flat', 'Tower', 'Recipient', 'Channel', 'Sent', 'Delivered', 'Opened', 'Status', 'Legal'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {noticeReceipts.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 font-mono text-xs font-medium">{r.flatNumber}</td>
                            <td className="px-3 py-3">{r.towerName}</td>
                            <td className="px-3 py-3">{r.recipientName}</td>
                            <td className="px-3 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.deliveredVia}</span></td>
                            <td className="px-3 py-3 text-xs text-gray-500">{r.sentAt?.substring(11, 19)}</td>
                            <td className="px-3 py-3 text-xs">{r.deliveredAt ? <span className="text-blue-600">{r.deliveredAt.substring(11, 19)}</span> : <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3 text-xs">{r.openedAt ? <span className="text-green-600">{r.openedAt.substring(11, 19)}</span> : <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.beaconStatus)}`}>{r.beaconStatus}</span></td>
                            <td className="px-3 py-3">{r.legallyValid ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Audience Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Groups', value: demoGroups.length, icon: Layers, color: 'bg-purple-500' },
                { label: 'Dynamic Groups', value: demoGroups.filter(g => g.dynamic).length, icon: Filter, color: 'bg-blue-500' },
                { label: 'Static Groups', value: demoGroups.filter(g => !g.dynamic).length, icon: Users, color: 'bg-green-500' },
                { label: 'Total Rules', value: demoRules.length, icon: Target, color: 'bg-orange-500' },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                  <div className={`p-2 ${c.color} rounded-lg`}><c.icon className="w-5 h-5 text-white" /></div>
                  <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
                </div>
              ))}
            </div>

            {/* Audience Groups */}
            <div className="bg-white rounded-xl border mb-6">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Audience Groups</h3></div>
              <div className="divide-y">
                {demoGroups.map(g => (
                  <div key={g.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedGroup === g.id ? 'bg-purple-50' : ''}`}
                    onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{g.name}</h4>
                          {g.dynamic && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Dynamic</span>}
                          {g.systemDefined && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">System</span>}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(g.groupStatus)}`}>{g.groupStatus}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{g.description}</p>
                        {g.lastEvaluatedAt && <p className="text-xs text-gray-400 mt-1">Last evaluated: {g.lastEvaluatedAt}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{g.cachedMemberCount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">members</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules for selected group */}
            {selectedGroup && groupRules.length > 0 && (
              <div className="bg-white rounded-xl border mb-6">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Segmentation Rules — {demoGroups.find(g => g.id === selectedGroup)?.name}
                  </h3>
                  <button onClick={() => setSelectedGroup(null)} className="text-xs text-purple-600 hover:underline">Close</button>
                </div>
                <div className="p-4 space-y-3">
                  {groupRules.map((rule, idx) => (
                    <div key={rule.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{rule.ruleOrder}</span>
                      <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                        <span className="font-mono text-purple-700 font-medium">{rule.field}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{rule.operator}</span>
                        <span className="font-semibold text-gray-900">"{rule.value}"</span>
                      </div>
                      {rule.conjunction && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">{rule.conjunction}</span>}
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                    <strong>Evaluation:</strong> This dynamic group computes target recipients by evaluating each rule in sequence.
                    Rules joined by AND must all match; OR allows any match. No multi-join queries — the engine streams
                    resident records through the rule chain in a single pass.
                  </div>
                </div>
              </div>
            )}

            {/* How Beacon Ingestion Works */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Beacon Ingestion Architecture</h3></div>
              <div className="p-4 grid md:grid-cols-3 gap-4">
                {[
                  { title: 'Write-Ahead Buffer', desc: 'Read-receipt beacons (SENT → DELIVERED → OPENED) land in a write-ahead buffer queue, not the primary DB. Millions of beacon pings are batched and flushed to the receipts table in configurable micro-batches (default 500/flush).', icon: Layers },
                  { title: 'Deduplication Layer', desc: 'Each beacon carries a unique trackingId. The dedup layer ensures at-least-once delivery semantics: re-opening the same notice from the same flat does not create duplicate receipt rows — it updates the timestamp.', icon: Filter },
                  { title: 'Async Counter Rollup', desc: 'Notice-level counters (deliveredCount, openedCount) are not updated per-beacon. A scheduled rollup job aggregates receipt statuses every 30 seconds and updates the notice row, keeping hot-path writes off the notice table.', icon: Clock },
                ].map((item, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
