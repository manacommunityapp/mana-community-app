import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Filter, Download, CheckCircle2, Clock, XCircle,
  Users, IndianRupee, Ticket, RefreshCw, QrCode, AlertTriangle, Sparkles,
  UserCheck, UtensilsCrossed, Radio, Plus, PhoneCall, Award, Check, Eye, ChevronRight,
  Flame, Music, Trophy, Calendar, ChevronDown, ChevronUp, Loader2, User
} from 'lucide-react';
import { useEventMock } from './EventMockToggle';
import { eventService } from '../../../services/events/eventService';

/* ─── Types & Models ─── */
export type PassCategory = 'family' | 'individual' | 'volunteer' | 'sponsor';

export interface Member {
  id: string;
  name: string;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
  idProofType?: string;
  idProofNumber?: string;
}

export interface PassRecord {
  id: string;
  category: PassCategory;
  primaryName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  members: Member[];
  timeSlot: string;
  gate: string;
  totalAmount: number;
  issueDate: string;
  qrCodeData: string;
  status: 'active' | 'scanned' | 'cancelled';
  scanTime?: string;
  specialPerks: string[];
  prasadCouponsCount: number;
}

export interface GateStatus {
  id: string;
  name: string;
  code: 'Gate A' | 'Gate B' | 'Gate C' | 'Gate D';
  type: string;
  currentDensity: 'Low' | 'Moderate' | 'High Crowd' | 'Hold';
  scansToday: number;
  capacityPerHr: number;
  activeGuards: number;
  leadIncharge: string;
  status: 'Active' | 'Paused' | 'VIP Only';
}

export interface PrasadCounter {
  id: string;
  counterName: string;
  location: string;
  incharge: string;
  packetsDistributed: number;
  stockRemaining: number;
  status: 'Active' | 'Refilling' | 'Closed';
}

export interface VolunteerShift {
  id: string;
  name: string;
  role: string;
  assignedZone: string;
  shiftTime: string;
  contact: string;
  status: 'On Duty' | 'Break' | 'Upcoming';
}

export interface BroadcastAlert {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  postedBy: string;
}

/* ─── Initial Mock Data ─── */
const INITIAL_PASSES: PassRecord[] = [
  {
    id: 'GU2026-FAM-88492',
    category: 'family',
    primaryName: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh.sharma@example.com',
    address: 'Flat 402, Shivam Enclave, M.G. Road',
    city: 'Mumbai',
    members: [
      { id: 'm1', name: 'Sunita Sharma', dob: '1984-06-15', gender: 'Female', relation: 'Spouse', idProofType: 'Aadhaar', idProofNumber: '4829' },
      { id: 'm2', name: 'Aarav Sharma', dob: '2012-03-22', gender: 'Male', relation: 'Son', idProofType: 'School ID', idProofNumber: '9182' },
      { id: 'm3', name: 'Kamla Sharma', dob: '1958-11-07', gender: 'Female', relation: 'Parent', idProofType: 'Aadhaar', idProofNumber: '1092' }
    ],
    timeSlot: 'Morning Aarti & Darshan (06:00 AM - 09:00 AM)',
    gate: 'Gate B (Priority Family Queue)',
    totalAmount: 300,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-FAM-88492|Rajesh Sharma|Family-4|GateB',
    status: 'active',
    specialPerks: ['Priority Family Queue', 'Prasadam Box (x2)', 'Senior Seat Assist'],
    prasadCouponsCount: 2
  },
  {
    id: 'GU2026-VIP-10294',
    category: 'sponsor',
    primaryName: 'Meera Deshmukh',
    phone: '+91 91234 56789',
    email: 'meera.deshmukh@example.com',
    address: 'Bunglow 12, Sunrise Park, Worli',
    city: 'Mumbai',
    members: [
      { id: 'v1', name: 'Vikram Deshmukh', dob: '1978-09-20', gender: 'Male', relation: 'Spouse', idProofType: 'Aadhaar', idProofNumber: '3341' }
    ],
    timeSlot: 'Grand Evening Aarti (05:30 PM - 08:30 PM)',
    gate: 'Gate A (VIP Entry)',
    totalAmount: 1100,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-VIP-10294|Meera Deshmukh|VIP-2|GateA',
    status: 'active',
    specialPerks: ['VIP Gate A Access', 'Maha Aarti Seating', 'Pooja Thali & Modak Box'],
    prasadCouponsCount: 2
  },
  {
    id: 'GU2026-IND-33910',
    category: 'individual',
    primaryName: 'Amit Verma',
    phone: '+91 99887 76655',
    email: 'amit.verma@example.com',
    address: '12, Lokhandwala Complex, Andheri West',
    city: 'Mumbai',
    members: [],
    timeSlot: 'Mid-Day Darshan Slot (09:30 AM - 12:30 PM)',
    gate: 'Gate C (General Entry)',
    totalAmount: 100,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-IND-33910|Amit Verma|Individual|GateC',
    status: 'scanned',
    scanTime: '10:15 AM',
    specialPerks: ['General Darshan Queue', 'Prasadam Token'],
    prasadCouponsCount: 1
  }
];

const INITIAL_GATES: GateStatus[] = [
  { id: 'gate-a', name: 'Gate A (VIP & Donors)', code: 'Gate A', type: 'VIP / Sponsor Entry', currentDensity: 'Low', scansToday: 142, capacityPerHr: 300, activeGuards: 4, leadIncharge: 'Sunil Patil (Head Security)', status: 'VIP Only' },
  { id: 'gate-b', name: 'Gate B (Priority Family Queue)', code: 'Gate B', type: 'Family Priority Queue', currentDensity: 'High Crowd', scansToday: 890, capacityPerHr: 800, activeGuards: 8, leadIncharge: 'Ramesh Sawant', status: 'Active' },
  { id: 'gate-c', name: 'Gate C (General Entry)', code: 'Gate C', type: 'General Public Entry', currentDensity: 'Moderate', scansToday: 1450, capacityPerHr: 1200, activeGuards: 12, leadIncharge: 'Anil Kadam', status: 'Active' },
  { id: 'gate-d', name: 'Gate D (Volunteers & Express)', code: 'Gate D', type: 'Volunteers & Staff Express', currentDensity: 'Low', scansToday: 320, capacityPerHr: 400, activeGuards: 3, leadIncharge: 'Pooja Joshi', status: 'Active' }
];

const INITIAL_PRASAD: PrasadCounter[] = [
  { id: 'pc-1', counterName: 'Counter #1 (Modak & Sheera)', location: 'North Pavilion', incharge: 'Kavita Shinde', packetsDistributed: 840, stockRemaining: 1600, status: 'Active' },
  { id: 'pc-2', counterName: 'Counter #2 (Special Family Boxes)', location: 'East Pavilion', incharge: 'Sanjay More', packetsDistributed: 620, stockRemaining: 880, status: 'Active' },
  { id: 'pc-3', counterName: 'Counter #3 (Bhandara Coupon Desk)', location: 'Dining Hall Gate', incharge: 'Ganesh Parab', packetsDistributed: 1250, stockRemaining: 2750, status: 'Active' },
  { id: 'pc-4', counterName: 'Counter #4 (VIP Pooja Thali)', location: 'Sanctum Rear', incharge: 'Preeti Naik', packetsDistributed: 110, stockRemaining: 390, status: 'Active' }
];

const INITIAL_VOLUNTEERS: VolunteerShift[] = [
  { id: 'vs-1', name: 'Sandeep V. Kurmi', role: 'Gate Security Lead', assignedZone: 'Gate B (Family)', shiftTime: '06:00 AM - 02:00 PM', contact: '+91 98200 11223', status: 'On Duty' },
  { id: 'vs-2', name: 'Rajesh Kulkarni', role: 'Prasadam Distribution', assignedZone: 'Counter #1', shiftTime: '08:00 AM - 04:00 PM', contact: '+91 98334 55667', status: 'On Duty' },
  { id: 'vs-3', name: 'Priyanka Jadhav', role: 'Senior Citizen Escort', assignedZone: 'Darshan Queue B', shiftTime: '09:00 AM - 05:00 PM', contact: '+91 99671 22334', status: 'On Duty' },
  { id: 'vs-4', name: 'Mahesh Bhole', role: 'Crowd & Parking Manager', assignedZone: 'Pandal Outer Field', shiftTime: '02:00 PM - 10:00 PM', contact: '+91 97654 88990', status: 'Upcoming' },
  { id: 'vs-5', name: 'Dr. Archana Raut', role: 'First Aid Desk Incharge', assignedZone: 'Control Room 2', shiftTime: '24x7 On-Call', contact: '+91 98199 00112', status: 'On Duty' }
];

const INITIAL_ALERTS: BroadcastAlert[] = [
  { id: 'alt-1', time: '10:45 AM', level: 'warning', title: 'High Crowd Alert at Gate B', message: 'Queue length exceeded 150m. Divert non-family single entries to Gate C.', postedBy: 'Control Room Officer' },
  { id: 'alt-2', time: '09:15 AM', level: 'info', title: 'VIP Morning Aarti Concluded', message: 'Sanctum stage clear for regular Family & Individual Darshan queues.', postedBy: 'Stage Manager' }
];

/* ─── Unified Registration Type ─── */
export type RegCategory = 'event' | 'pooja' | 'cultural' | 'competition' | 'food';

export interface UnifiedReg {
  id: string | number;
  regCode: string;
  category: RegCategory;
  activityTitle: string;
  participantName: string;
  email?: string;
  phone?: string;
  gotram?: string;
  ageGroup?: string;
  devoteeCount: number;
  bookingFee: number;
  paymentStatus: string;
  status: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  extra?: string;
  createdAt: string;
}

const MOCK_REGISTRATIONS: UnifiedReg[] = [
  // Events
  { id: 'e1', regCode: 'EVT-5001', category: 'event', activityTitle: 'Ganesh Utsav 2026 – Main Event', participantName: 'Rajesh Sharma', email: 'rajesh@example.com', phone: '+91 98765 43210', devoteeCount: 4, bookingFee: 300, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', venue: 'Community Hall', createdAt: '2026-08-10T10:00:00' },
  { id: 'e2', regCode: 'EVT-5002', category: 'event', activityTitle: 'Ganesh Utsav 2026 – Main Event', participantName: 'Meera Deshmukh', email: 'meera@example.com', phone: '+91 91234 56789', devoteeCount: 2, bookingFee: 300, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', venue: 'Community Hall', createdAt: '2026-08-10T11:30:00' },
  { id: 'e3', regCode: 'EVT-5003', category: 'event', activityTitle: 'Ganesh Utsav 2026 – Main Event', participantName: 'Amit Verma', email: 'amit@example.com', phone: '+91 99887 76655', devoteeCount: 1, bookingFee: 100, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', venue: 'Community Hall', createdAt: '2026-08-11T09:00:00' },
  { id: 'e4', regCode: 'EVT-5004', category: 'event', activityTitle: 'Day 2 – Special Program', participantName: 'Sunita Patil', email: 'sunita@example.com', phone: '+91 98100 22334', devoteeCount: 3, bookingFee: 200, paymentStatus: 'PENDING', status: 'PENDING', eventDate: '2026-08-28', venue: 'Temple Grounds', createdAt: '2026-08-12T14:00:00' },
  { id: 'e5', regCode: 'EVT-5005', category: 'event', activityTitle: 'Day 2 – Special Program', participantName: 'Vikram Kulkarni', email: 'vikram@example.com', phone: '+91 97600 55443', devoteeCount: 5, bookingFee: 200, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-28', venue: 'Temple Grounds', createdAt: '2026-08-12T16:00:00' },
  // Pooja
  { id: 'p1', regCode: 'POOJA-1001', category: 'pooja', activityTitle: 'Maha Ganapathi Abhishekam', participantName: 'Ramesh Sharma', gotram: 'Bharadwaj', devoteeCount: 3, bookingFee: 501, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '08:30 AM', venue: 'Main Temple Mandap', extra: 'Gotram: Bharadwaj', createdAt: '2026-08-15T10:30:00' },
  { id: 'p2', regCode: 'POOJA-1002', category: 'pooja', activityTitle: 'Maha Ganapathi Abhishekam', participantName: 'Lakshmi Devi', gotram: 'Kashyap', devoteeCount: 2, bookingFee: 501, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '11:00 AM', venue: 'Main Temple Mandap', extra: 'Gotram: Kashyap', createdAt: '2026-08-15T14:20:00' },
  { id: 'p3', regCode: 'POOJA-1003', category: 'pooja', activityTitle: 'Maha Ganapathi Abhishekam', participantName: 'Venkatesh Rao', gotram: 'Atri', devoteeCount: 4, bookingFee: 501, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '08:30 AM', venue: 'Main Temple Mandap', extra: 'Gotram: Atri', createdAt: '2026-08-16T09:00:00' },
  { id: 'p4', regCode: 'POOJA-1004', category: 'pooja', activityTitle: 'Satyanarayan Puja', participantName: 'Subramaniam K.', gotram: 'Vasishta', devoteeCount: 5, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '09:00 AM', venue: 'Community Hall', extra: 'Gotram: Vasishta', createdAt: '2026-08-16T11:00:00' },
  { id: 'p5', regCode: 'POOJA-1005', category: 'pooja', activityTitle: 'Navagraha Homam', participantName: 'Annapurna Devi', gotram: 'Bharadwaj', devoteeCount: 2, bookingFee: 1100, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '06:00 AM', venue: 'Homa Kund Area', extra: 'Gotram: Bharadwaj', createdAt: '2026-08-17T08:30:00' },
  { id: 'p6', regCode: 'POOJA-1006', category: 'pooja', activityTitle: 'Navagraha Homam', participantName: 'Chandrashekar M.', gotram: 'Gautam', devoteeCount: 3, bookingFee: 1100, paymentStatus: 'PENDING', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '06:00 AM', venue: 'Homa Kund Area', extra: 'Gotram: Gautam', createdAt: '2026-08-17T10:15:00' },
  // Cultural
  { id: 'c1', regCode: 'CULT-3001', category: 'cultural', activityTitle: 'Bharatanatyam – Pushpanjali', participantName: 'Meenakshi Sundaram', ageGroup: 'Youth (16-25)', devoteeCount: 1, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '10:00 AM', venue: 'Main Stage', extra: 'Solo · Youth (16-25)', createdAt: '2026-08-14T10:00:00' },
  { id: 'c2', regCode: 'CULT-3002', category: 'cultural', activityTitle: 'Carnatic Vocal Ensemble', participantName: 'Ramakrishnan V.', ageGroup: 'Open', devoteeCount: 4, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '11:00 AM', venue: 'Main Stage', extra: 'Ensemble · Open', createdAt: '2026-08-14T12:00:00' },
  { id: 'c3', regCode: 'CULT-3003', category: 'cultural', activityTitle: 'Kids Fancy Dress', participantName: 'Priya Sharma (parent)', ageGroup: 'Kids (5-10)', devoteeCount: 3, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '09:30 AM', venue: 'Side Stage', extra: 'Group · Kids (5-10)', createdAt: '2026-08-15T09:00:00' },
  { id: 'c4', regCode: 'CULT-3004', category: 'cultural', activityTitle: 'Bhajan Sandhya', participantName: 'Annapurna Group', ageGroup: 'Open', devoteeCount: 8, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '06:00 PM', venue: 'Temple Mandap', extra: 'Group · Open', createdAt: '2026-08-16T15:00:00' },
  { id: 'c5', regCode: 'CULT-3005', category: 'cultural', activityTitle: 'Folk Dance – Garba Night', participantName: 'Chandrashekar M.', ageGroup: 'Open', devoteeCount: 6, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-29', eventTime: '08:00 PM', venue: 'Open Ground', extra: 'Group · Open', createdAt: '2026-08-17T10:00:00' },
  // Competition
  { id: 'comp1', regCode: 'COMP-4001', category: 'competition', activityTitle: 'Drawing Competition – Kids', participantName: 'Aarav Sharma', ageGroup: 'Kids (5-10)', devoteeCount: 1, bookingFee: 50, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '10:00 AM', venue: 'Community Hall – Room A', extra: 'Age: Kids · Drawing', createdAt: '2026-08-14T09:00:00' },
  { id: 'comp2', regCode: 'COMP-4002', category: 'competition', activityTitle: 'Elocution – Junior', participantName: 'Nidhi Kulkarni', ageGroup: 'Junior (11-15)', devoteeCount: 1, bookingFee: 50, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '11:30 AM', venue: 'Community Hall – Room B', extra: 'Age: Junior · Elocution', createdAt: '2026-08-15T11:00:00' },
  { id: 'comp3', regCode: 'COMP-4003', category: 'competition', activityTitle: 'Classical Singing – Open', participantName: 'Keertana S.', ageGroup: 'Open', devoteeCount: 1, bookingFee: 100, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-29', eventTime: '09:00 AM', venue: 'Auditorium', extra: 'Age: Open · Singing', createdAt: '2026-08-16T13:00:00' },
  { id: 'comp4', regCode: 'COMP-4004', category: 'competition', activityTitle: 'Quiz Competition – Youth', participantName: 'Arjun Verma', ageGroup: 'Youth (16-25)', devoteeCount: 2, bookingFee: 80, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-29', eventTime: '02:00 PM', venue: 'Community Hall – Room A', extra: 'Age: Youth · Quiz (Team)', createdAt: '2026-08-17T09:30:00' },
  { id: 'comp5', regCode: 'COMP-4005', category: 'competition', activityTitle: 'Drawing Competition – Kids', participantName: 'Priya Iyer', ageGroup: 'Kids (5-10)', devoteeCount: 1, bookingFee: 50, paymentStatus: 'PENDING', status: 'PENDING', eventDate: '2026-08-28', eventTime: '10:00 AM', venue: 'Community Hall – Room A', extra: 'Age: Kids · Drawing', createdAt: '2026-08-17T15:00:00' },
  // Food & Meals
  { id: 'f1', regCode: 'MEAL-6001', category: 'food', activityTitle: 'Maha Prasadam Lunch – Day 1', participantName: 'Anand Joshi', email: 'anand@example.com', phone: '+91 98450 11223', devoteeCount: 4, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '12:30 PM', venue: 'Dining Hall', extra: 'Members: 4', createdAt: '2026-08-16T12:00:00' },
  { id: 'f2', regCode: 'MEAL-6002', category: 'food', activityTitle: 'Community Dinner – Day 1', participantName: 'Kavita Reddy', email: 'kavita@example.com', phone: '+91 99001 22334', devoteeCount: 3, bookingFee: 150, paymentStatus: 'PAID', status: 'CONFIRMED', eventDate: '2026-08-27', eventTime: '07:30 PM', venue: 'Dining Hall', extra: 'Members: 3', createdAt: '2026-08-16T16:30:00' },
  { id: 'f3', regCode: 'MEAL-6003', category: 'food', activityTitle: 'Grand Annadanam Lunch – Day 2', participantName: 'Suresh Bhat', email: 'suresh@example.com', phone: '+91 97400 33445', devoteeCount: 5, bookingFee: 0, paymentStatus: 'FREE', status: 'CONFIRMED', eventDate: '2026-08-28', eventTime: '12:30 PM', venue: 'Dining Hall', extra: 'Members: 5', createdAt: '2026-08-17T11:00:00' },
];

/* ─── Main Component ─── */
export interface OrganizerDashboardProps {
  initialTab?: 'passes' | 'volunteers' | 'registrations' | 'overview' | 'scanner' | 'gates' | 'prasad';
}

export function OrganizerDashboard({ initialTab = 'registrations' }: OrganizerDashboardProps = {}) {
  const { useMock } = useEventMock();

  // Enabled tabs: 'passes' (Pass Register), 'volunteers' (Volunteer Roster), 'registrations' (Registered Users)
  const [activeTab, setActiveTab] = useState<'passes' | 'volunteers' | 'registrations' | 'overview' | 'scanner' | 'gates' | 'prasad'>(initialTab);
  const [passesList, setPassesList] = useState<PassRecord[]>(INITIAL_PASSES);
  const [gatesList, setGatesList] = useState<GateStatus[]>(INITIAL_GATES);
  const [prasadList, setPrasadList] = useState<PrasadCounter[]>(INITIAL_PRASAD);
  const [volunteersList, setVolunteersList] = useState<VolunteerShift[]>(INITIAL_VOLUNTEERS);
  const [alertsList, setAlertsList] = useState<BroadcastAlert[]>(INITIAL_ALERTS);

  // Registrations tab state
  const [regCategory, setRegCategory] = useState<RegCategory | 'all'>('all');
  const [regSearch, setRegSearch] = useState('');
  const [allRegs, setAllRegs] = useState<UnifiedReg[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regError, setRegError] = useState('');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const fetchLiveRegistrations = async () => {
    setLoadingRegs(true);
    setRegError('');
    try {
      const [regs, evts] = await Promise.all([
        eventService.getAllRegistrations().catch(() => []),
        eventService.getAllEvents().catch(() => [])
      ]);

      const activeEventsById = new Map<number, any>();
      const activeEventsByTitle = new Map<string, any>();
      const cancelledEventIds = new Set<number>();
      const cancelledEventTitles = new Set<string>();

      if (Array.isArray(evts)) {
        evts.forEach((ev: any) => {
          const evStatus = String(ev.status || '').toUpperCase();
          if (evStatus === 'CANCELLED') {
            if (ev.id != null) cancelledEventIds.add(Number(ev.id));
            if (ev.title) cancelledEventTitles.add(ev.title.trim().toLowerCase());
          } else {
            if (ev.id != null) activeEventsById.set(Number(ev.id), ev);
            if (ev.title) activeEventsByTitle.set(ev.title.trim().toLowerCase(), ev);
          }
        });
      }

      const activeRegs = Array.isArray(regs)
        ? regs.filter((r: any) => {
            const regStatus = String(r.status || '').toUpperCase();
            if (regStatus === 'CANCELLED' || regStatus === 'REJECTED') return false;
            if (String(r.eventStatus || '').toUpperCase() === 'CANCELLED') return false;

            const numEventId = r.mainEventId != null ? Number(r.mainEventId) : (r.eventId != null ? Number(r.eventId) : null);
            const actTitle = String(r.activityTitle || r.eventName || r.eventTitle || '').trim().toLowerCase();

            if (numEventId != null && cancelledEventIds.has(numEventId)) return false;
            if (actTitle && cancelledEventTitles.has(actTitle)) return false;

            // Ensure parent/main event exists and is not cancelled
            if (evts && evts.length > 0) {
              const exists = (numEventId != null && activeEventsById.has(numEventId)) || (actTitle && activeEventsByTitle.has(actTitle));
              if (numEventId != null || actTitle) {
                if (!exists) return false;
              }
            }
            return true;
          })
        : [];

      const mapped: UnifiedReg[] = activeRegs.map((r: any) => {
            const rawCat = (r.category || '').toLowerCase();
            const actId = String(r.activityId || '');
            const actType = String(r.activityType || '').toUpperCase();
            const cat: RegCategory = rawCat.includes('pooja') || rawCat.includes('seva')
              ? 'pooja'
              : rawCat.includes('cult') || rawCat.includes('perform')
              ? 'cultural'
              : rawCat.includes('comp')
              ? 'competition'
              : rawCat.includes('food') || rawCat.includes('meal') || rawCat.includes('lunch') || rawCat.includes('dinner') || rawCat.includes('prasadam') || actId.startsWith('meal-') || actId.startsWith('food-') || actType.includes('LUNCH') || actType.includes('DINNER') || actType.includes('MEAL')
              ? 'food'
              : 'event';

            const pName = r.participantName || r.primaryName || r.userName || 'Devotee';
            const extraParts: string[] = [];
            if (r.gotram) extraParts.push(`Gotram: ${r.gotram}`);
            if (r.flatNo) extraParts.push(`Unit: ${r.flatNo}`);
            if (r.ageGroup) extraParts.push(r.ageGroup);

            let attendeeCount = Number(r.devoteeCount ?? r.membersCount ?? 0);
            // Always recompute from member arrays so that self + family members are included
            if (r.membersJson) {
              try {
                const parsed = JSON.parse(r.membersJson);
                if (Array.isArray(parsed) && parsed.length > attendeeCount) attendeeCount = parsed.length;
              } catch {}
            }
            if (r.attendingDevotees) {
              try {
                const parsed = JSON.parse(r.attendingDevotees);
                if (Array.isArray(parsed) && parsed.length > attendeeCount) attendeeCount = parsed.length;
                else if (typeof r.attendingDevotees === 'string') {
                  const parts = r.attendingDevotees.split(',').map((s: string) => s.trim()).filter(Boolean);
                  if (parts.length > attendeeCount) attendeeCount = parts.length;
                }
              } catch {
                const parts = String(r.attendingDevotees).split(',').map((s: string) => s.trim()).filter(Boolean);
                if (parts.length > attendeeCount) attendeeCount = parts.length;
              }
            }
            if (!attendeeCount) attendeeCount = 1;

            return {
              id: r.id,
              regCode: r.regCode || `MNA-2026-${cat.toUpperCase()}-${r.id}`,
              category: cat,
              activityTitle: r.activityTitle || r.eventName || r.eventTitle || 'Community Event',
              participantName: pName,
              email: r.email || r.userEmail,
              phone: r.phone,
              gotram: r.gotram,
              ageGroup: r.ageGroup,
              devoteeCount: attendeeCount,
              bookingFee: Number(r.bookingFee ?? r.fee ?? 0),
              paymentStatus: r.paymentStatus || (Number(r.bookingFee) === 0 ? 'FREE' : 'PAID'),
              status: r.status || 'CONFIRMED',
              eventDate: r.eventDate || r.startDate || '2026',
              eventTime: r.eventTime || r.startTime || 'Scheduled',
              venue: r.venue || r.mandap || 'Community Mandap',
              extra: extraParts.length > 0 ? extraParts.join(' · ') : undefined,
              createdAt: r.createdAt || r.registeredAt || new Date().toISOString(),
            };
          });

      if (mapped.length > 0) {
        if (useMock) {
          // Merge unique by regCode
          const existingCodes = new Set(mapped.map(m => m.regCode));
          const uniqueMock = MOCK_REGISTRATIONS.filter(m => !existingCodes.has(m.regCode));
          setAllRegs([...mapped, ...uniqueMock]);
        } else {
          setAllRegs(mapped);
        }

        // Also populate passesList from live database registrations
        const mappedPasses: PassRecord[] = Array.isArray(regs)
          ? regs.map((r: any) => ({
              id: r.regCode || `MNA-2026-${r.id}`,
              category: (Number(r.devoteeCount || r.membersCount || 1) > 1 ? 'family' : 'individual') as PassCategory,
              primaryName: r.participantName || r.primaryName || r.userName || 'Devotee',
              phone: r.phone || 'N/A',
              email: r.email || r.userEmail || '',
              address: r.flatNo ? `Unit ${r.flatNo}` : (r.colonyAddress || 'Community Resident'),
              city: 'Community',
              members: [],
              timeSlot: r.eventTime ? `${r.activityTitle || 'Event'} (${r.eventTime})` : (r.activityTitle || 'Scheduled'),
              gate: r.venue || 'Gate A (Main Entrance)',
              totalAmount: Number(r.bookingFee ?? r.fee ?? 0),
              issueDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2026-08-28',
              qrCodeData: `${r.regCode || r.id}|${r.participantName || ''}|${r.activityTitle || ''}`,
              status: (r.status === 'SCANNED' || r.status === 'CHECKED_IN' ? 'scanned' : 'active') as 'active' | 'scanned' | 'cancelled',
              specialPerks: [r.category ? `${r.category} Pass` : 'Standard Entry'],
              prasadCouponsCount: r.category === 'Pooja' ? 2 : 1,
            }))
          : [];
        if (mappedPasses.length > 0) {
          if (useMock) {
            const passCodes = new Set(mappedPasses.map(p => p.id));
            const uniqueMockPasses = INITIAL_PASSES.filter(p => !passCodes.has(p.id));
            setPassesList([...mappedPasses, ...uniqueMockPasses]);
          } else {
            setPassesList(mappedPasses);
          }
        }
      } else {
        setAllRegs(useMock ? MOCK_REGISTRATIONS : []);
        if (useMock) setPassesList(INITIAL_PASSES);
      }
    } catch (e: any) {
      console.warn('Could not load registrations from API:', e);
      if (useMock) {
        setAllRegs(MOCK_REGISTRATIONS);
      } else {
        setRegError(e?.message || 'Failed to load registrations from database');
      }
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchLiveRegistrations();
    window.addEventListener('mana_registrations_updated', fetchLiveRegistrations);
    window.addEventListener('mana_activities_updated', fetchLiveRegistrations);
    window.addEventListener('mana_event_created', fetchLiveRegistrations);
    window.addEventListener('mana_event_updated', fetchLiveRegistrations);
    window.addEventListener('mana_dashboard_updated', fetchLiveRegistrations);
    return () => {
      window.removeEventListener('mana_registrations_updated', fetchLiveRegistrations);
      window.removeEventListener('mana_activities_updated', fetchLiveRegistrations);
      window.removeEventListener('mana_event_created', fetchLiveRegistrations);
      window.removeEventListener('mana_event_updated', fetchLiveRegistrations);
      window.removeEventListener('mana_dashboard_updated', fetchLiveRegistrations);
    };
  }, [useMock]);

  const filteredRegs = allRegs.filter(r => {
    const matchCat = regCategory === 'all' || r.category === regCategory;
    const term = regSearch.toLowerCase();
    const matchSearch = !term || r.participantName.toLowerCase().includes(term)
      || r.regCode.toLowerCase().includes(term)
      || r.activityTitle.toLowerCase().includes(term)
      || (r.email || '').toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  // Group by activityTitle for grouped view
  const groupedRegs = filteredRegs.reduce<Record<string, UnifiedReg[]>>((acc, r) => {
    const key = `${r.category}::${r.activityTitle}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Broadcast Alert Form State
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertLevel, setNewAlertLevel] = useState<'info' | 'warning' | 'critical'>('warning');

  // Metrics
  const totalPasses = passesList.length;
  const activePasses = passesList.filter(p => p.status === 'active').length;
  const scannedPasses = passesList.filter(p => p.status === 'scanned').length;
  const totalRevenue = passesList.reduce((acc, p) => acc + p.totalAmount, 0);

  // Filtered passes list
  const filteredPasses = passesList.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.primaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.phone.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle Pass Status (Active <-> Scanned)
  const handleToggleStatus = (id: string) => {
    setPassesList(prev => prev.map(p => {
      if (p.id === id) {
        const isNextScanned = p.status === 'active';
        return {
          ...p,
          status: isNextScanned ? 'scanned' : 'active',
          scanTime: isNextScanned ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return p;
    }));
  };

  // Add Emergency Alert
  const handlePostAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertMsg) return;
    const newAlert: BroadcastAlert = {
      id: `alt-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: newAlertLevel,
      title: newAlertTitle,
      message: newAlertMsg,
      postedBy: 'Committee Desk'
    };
    setAlertsList([newAlert, ...alertsList]);
    setNewAlertTitle('');
    setNewAlertMsg('');
  };

  // CSV Export for Passes
  const handleExportCSV = () => {
    const headers = ['Pass ID', 'Category', 'Primary Name', 'Phone', 'Email', 'Gate', 'Time Slot', 'Attendees', 'Total Fee', 'Status', 'Issue Date'];
    const rows = passesList.map(p => [
      p.id,
      p.category,
      `"${p.primaryName}"`,
      p.phone,
      p.email,
      `"${p.gate}"`,
      `"${p.timeSlot}"`,
      p.members.length + 1,
      p.totalAmount,
      p.status,
      p.issueDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ganesh_Utsav_Pass_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Live Event Registrations
  const handleExportRegistrationsCSV = () => {
    const headers = ['Reg Code', 'Category', 'Activity / Event', 'Participant Name', 'Gotram', 'Phone', 'Email', 'Unit/Flat', 'Attendees Count', 'Event Date', 'Event Time', 'Venue', 'Fee (₹)', 'Payment Status', 'Status', 'Registered On'];
    const rows = filteredRegs.map(r => [
      r.regCode,
      r.category.toUpperCase(),
      `"${r.activityTitle}"`,
      `"${r.participantName}"`,
      `"${r.gotram || ''}"`,
      r.phone || '',
      r.email || '',
      `"${(r.extra || '').replace(/"/g, '""')}"`,
      r.devoteeCount,
      `"${r.eventDate || ''}"`,
      `"${r.eventTime || ''}"`,
      `"${r.venue || ''}"`,
      r.bookingFee,
      r.paymentStatus,
      r.status,
      r.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mana_Community_Event_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans text-slate-800">

      {/* ─── 5. ACTIVE TAB 1: PASS REGISTER DATA TABLE ─── */}
      {activeTab === 'passes' && (
        <div className="space-y-3.5">
          
          {/* Controls Bar */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col md:flex-row gap-3 items-center justify-between text-xs shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Pass ID, Name, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="family">Family Pass</option>
                <option value="individual">Individual Pass</option>
                <option value="volunteer">Volunteer Pass</option>
                <option value="sponsor">Sponsor / VIP</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (Pending)</option>
                <option value="scanned">Scanned (Entered)</option>
              </select>
            </div>
          </div>

          {/* Master Table */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="p-3">Pass ID</th>
                    <th className="p-3">Primary Registrant</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Attendees</th>
                    <th className="p-3">Gate & Slot</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No pass records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-600">{pass.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{pass.primaryName}</div>
                          <div className="text-[10px] text-slate-400">{pass.phone}</div>
                        </td>
                        <td className="p-3 capitalize font-medium text-slate-700">{pass.category} Pass</td>
                        <td className="p-3 font-semibold">{pass.members.length + 1} Pers.</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{pass.gate}</div>
                          <div className="text-[10px] text-indigo-600">{pass.timeSlot.split('(')[0]}</div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-900">₹{pass.totalAmount}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            pass.status === 'active'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {pass.status === 'active' ? '● Active' : '✓ Scanned'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleStatus(pass.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-all cursor-pointer border border-slate-200"
                          >
                            {pass.status === 'active' ? 'Mark Scanned' : 'Reset Active'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. ACTIVE TAB 2: VOLUNTEER ROSTER & BROADCAST ─── */}
      {activeTab === 'volunteers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Volunteer Roster */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-bold text-[#0d0d2b]">Active Duty Volunteer Roster</h3>
            <div className="space-y-2.5">
              {volunteersList.map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                    <div className="text-slate-500">{v.role} • <strong className="text-indigo-600">{v.assignedZone}</strong></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Shift: {v.shiftTime}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block">
                      {v.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">{v.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Alert Broadcaster */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-slate-200/80 bg-white space-y-3.5 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-[#0d0d2b] flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              Broadcast Committee Alert
            </h3>

            <form onSubmit={handlePostAlert} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Level</label>
                <select
                  value={newAlertLevel}
                  onChange={(e: any) => setNewAlertLevel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                >
                  <option value="info">Info Announcement</option>
                  <option value="warning">Warning / Queue Divert</option>
                  <option value="critical">Critical / Security Alert</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Title</label>
                <input
                  type="text"
                  placeholder="e.g. Gate B Queue Overflow"
                  value={newAlertTitle}
                  onChange={(e) => setNewAlertTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Message</label>
                <textarea
                  rows={2}
                  placeholder="Enter broadcast message..."
                  value={newAlertMsg}
                  onChange={(e) => setNewAlertMsg(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all"
              >
                Post Broadcast Alert
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ─── 7. ACTIVE TAB 3: REGISTERED USERS ─── */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">

          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category dropdown */}
              {[
                { value: 'all', label: 'All Registrations', icon: '📋' },
                { value: 'event', label: 'Events', icon: '🎉' },
                { value: 'pooja', label: 'Pooja & Seva', icon: '🔥' },
                { value: 'cultural', label: 'Cultural', icon: '🎵' },
                { value: 'competition', label: 'Competition', icon: '🏆' },
                { value: 'food', label: 'Food & Meals', icon: '🍲' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setRegCategory(opt.value as any); setExpandedActivity(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    regCategory === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    regCategory === opt.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {opt.value === 'all' ? allRegs.length : allRegs.filter(r => r.category === opt.value).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, code, activity..."
                  value={regSearch}
                  onChange={e => setRegSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <button
                type="button"
                onClick={fetchLiveRegistrations}
                disabled={loadingRegs}
                title="Refresh registrations from database"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRegs ? 'animate-spin text-indigo-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleExportRegistrationsCSV}
                title="Download registered devotees list as CSV"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {regError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {regError}
            </div>
          )}
          {loadingRegs && (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading registrations...
            </div>
          )}

          {/* Summary KPIs */}
          {!loadingRegs && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Users', value: filteredRegs.length, color: '#6366f1' },
                { label: 'Total Attendees', value: filteredRegs.reduce((a, r) => a + r.devoteeCount, 0), color: '#10b981' },
                { label: 'Paid', value: filteredRegs.filter(r => r.paymentStatus === 'PAID').length, color: '#0891b2' },
                { label: 'Revenue', value: `₹${filteredRegs.reduce((a, r) => a + r.bookingFee, 0).toLocaleString('en-IN')}`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Grouped by Activity */}
          {!loadingRegs && Object.keys(groupedRegs).length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No registrations found</p>
            </div>
          )}

          {!loadingRegs && Object.entries(groupedRegs).map(([key, regs]) => {
            const [cat, title] = key.split('::');
            const isExpanded = expandedActivity === key;
            const headcount = regs.reduce((a, r) => a + r.devoteeCount, 0);
            const paidCount = regs.filter(r => r.paymentStatus === 'PAID').length;
            const revenue = regs.reduce((a, r) => a + r.bookingFee, 0);

            const catMeta: Record<string, { icon: string; color: string; bg: string }> = {
              event:       { icon: '🎉', color: 'text-indigo-700',  bg: 'bg-indigo-50' },
              pooja:       { icon: '🔥', color: 'text-amber-700',   bg: 'bg-amber-50' },
              cultural:    { icon: '🎵', color: 'text-violet-700',  bg: 'bg-violet-50' },
              competition: { icon: '🏆', color: 'text-emerald-700', bg: 'bg-emerald-50' },
              food:        { icon: '🍲', color: 'text-orange-700',  bg: 'bg-orange-50' },
            };
            const meta = catMeta[cat] || catMeta['event'];

            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                {/* Activity header */}
                <button
                  onClick={() => setExpandedActivity(isExpanded ? null : key)}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center text-base flex-shrink-0`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-slate-800 text-sm truncate`}>{title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} capitalize`}>{cat}</span>
                      <span className="text-[10px] text-slate-400">{regs.length} registrations · {headcount} attendees</span>
                      {revenue > 0 && <span className="text-[10px] font-semibold text-emerald-600">₹{revenue.toLocaleString('en-IN')} collected</span>}
                      <span className="text-[10px] text-slate-400">{paidCount} paid</span>
                    </div>
                  </div>
                  <div className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* User list */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                            {['Reg Code', 'Participant', 'Details', 'Attendees', 'Date / Time', 'Fee', 'Payment', 'Status', 'Registered'].map(h => (
                              <th key={h} className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                                ['Date / Time', 'Registered'].includes(h) ? 'hidden lg:table-cell' : ''
                              }`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {regs.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">{r.regCode}</td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <p className="font-semibold text-slate-800 whitespace-nowrap">{r.participantName}</p>
                                {r.email && <p className="text-[10px] text-slate-400 mt-0.5">{r.email}</p>}
                                {r.phone && <p className="text-[10px] text-slate-400">{r.phone}</p>}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                {r.extra && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{r.extra}</span>}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10.5px] font-bold shadow-2xs">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" /> {r.devoteeCount} {r.devoteeCount === 1 ? 'Attendee' : 'Attendees'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                                {r.eventDate || '—'}{r.eventTime ? ` · ${r.eventTime}` : ''}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                                {r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString('en-IN')}` : 'Free'}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                  r.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                                  r.paymentStatus === 'FREE' ? 'bg-sky-50 text-sky-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>{r.paymentStatus}</span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                  r.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                                  r.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>{r.status}</span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                                {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
