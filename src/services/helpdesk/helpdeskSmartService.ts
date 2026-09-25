export type TicketPriority = "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";

export interface TicketTimelineEntry {
  id: string;
  action: string;
  note: string;
  author: string;
  timestamp: string;
}

export interface SmartTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  location: string;
  tower: string;
  flatNumber: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaHours: number;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedPhone?: string;
  workStarted?: string;
  workCompleted?: string;
  photos: string[];
  timeline: TicketTimelineEntry[];
  residentRating?: number;
  residentComment?: string;
}

export interface ClassificationResult {
  category: string;
  subCategory: string;
  priority: TicketPriority;
  isEmergency: boolean;
}

const KEYWORD_RULES: Array<{ keywords: string[]; category: string; subCategory: string; priority: TicketPriority; isEmergency: boolean }> = [
  { keywords: ["flood", "burst pipe", "water gushing", "overflow", "sewage overflow"], category: "Plumbing", subCategory: "Flood/Overflow", priority: "EMERGENCY", isEmergency: true },
  { keywords: ["gas leak", "smell gas", "gas smell"], category: "Safety", subCategory: "Gas Leak", priority: "EMERGENCY", isEmergency: true },
  { keywords: ["fire", "smoke", "burning"], category: "Safety", subCategory: "Fire Hazard", priority: "EMERGENCY", isEmergency: true },
  { keywords: ["lift stuck", "elevator stuck", "trapped in lift", "lift malfunction"], category: "Lift", subCategory: "Lift Malfunction", priority: "HIGH", isEmergency: false },
  { keywords: ["water leak", "leaking pipe", "dripping", "seepage"], category: "Plumbing", subCategory: "Leak/Seepage", priority: "HIGH", isEmergency: false },
  { keywords: ["power cut", "no electricity", "power outage", "tripped", "short circuit"], category: "Electrical", subCategory: "Power Issue", priority: "HIGH", isEmergency: false },
  { keywords: ["light not working", "bulb fused", "light out"], category: "Electrical", subCategory: "Lighting", priority: "MEDIUM", isEmergency: false },
  { keywords: ["treadmill", "gym equipment", "gym machine"], category: "Amenities", subCategory: "Gym Equipment", priority: "MEDIUM", isEmergency: false },
  { keywords: ["parking", "car park", "vehicle"], category: "Parking", subCategory: "Parking Issue", priority: "LOW", isEmergency: false },
  { keywords: ["lift", "elevator"], category: "Lift", subCategory: "General Lift Issue", priority: "MEDIUM", isEmergency: false },
  { keywords: ["plumbing", "tap", "flush", "toilet", "pipe"], category: "Plumbing", subCategory: "General Plumbing", priority: "MEDIUM", isEmergency: false },
  { keywords: ["electrical", "socket", "plug", "wiring"], category: "Electrical", subCategory: "General Electrical", priority: "MEDIUM", isEmergency: false },
  { keywords: ["cleanliness", "garbage", "waste", "trash", "dirty"], category: "Housekeeping", subCategory: "Cleanliness", priority: "LOW", isEmergency: false },
];

export function classifyTicket(description: string): ClassificationResult {
  const text = description.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return { category: rule.category, subCategory: rule.subCategory, priority: rule.priority, isEmergency: rule.isEmergency };
    }
  }
  return { category: "General", subCategory: "Other", priority: "LOW", isEmergency: false };
}

function getSLAHours(priority: TicketPriority): number {
  switch (priority) {
    case "EMERGENCY": return 2;
    case "HIGH": return 8;
    case "MEDIUM": return 24;
    case "LOW": return 72;
  }
}

const SAMPLE_TICKETS: SmartTicket[] = [
  {
    id: "tk-001",
    ticketNumber: "TKT-2024-0101",
    title: "Water leaking from bathroom ceiling",
    description: "There is a continuous water drip from the bathroom ceiling, possibly from the flat above.",
    category: "Plumbing",
    subCategory: "Leak/Seepage",
    location: "Tower A, Flat 302, Bathroom",
    tower: "A",
    flatNumber: "302",
    priority: "HIGH",
    status: "IN_PROGRESS",
    slaHours: 8,
    slaDeadline: new Date(Date.now() + 3 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    assignedTo: "Raju Plumber",
    assignedPhone: "+91 90001 23456",
    workStarted: new Date(Date.now() - 1 * 3600000).toISOString(),
    photos: [],
    timeline: [
      { id: "t1", action: "CREATED", note: "Ticket created", author: "Resident", timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: "t2", action: "ASSIGNED", note: "Assigned to Raju Plumber", author: "Helpdesk", timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: "t3", action: "STARTED", note: "Work started - inspecting pipe in flat above", author: "Raju Plumber", timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk-002",
    ticketNumber: "TKT-2024-0102",
    title: "Lift B intermittent failure",
    description: "Lift B in Tower B is stopping between floors randomly. Has happened 3 times this week.",
    category: "Lift",
    subCategory: "Lift Malfunction",
    location: "Tower B, Lift B",
    tower: "B",
    flatNumber: "Common Area",
    priority: "HIGH",
    status: "ASSIGNED",
    slaHours: 8,
    slaDeadline: new Date(Date.now() + 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    assignedTo: "OtisLift Technician",
    assignedPhone: "+91 80009 87654",
    photos: [],
    timeline: [
      { id: "t1", action: "CREATED", note: "Ticket created", author: "Resident", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: "t2", action: "ASSIGNED", note: "Escalated to Otis lift team", author: "Helpdesk", timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk-003",
    ticketNumber: "TKT-2024-0103",
    title: "Street light out near parking",
    description: "The street light near P-Block parking entrance has been non-functional for 4 days causing safety concern.",
    category: "Electrical",
    subCategory: "Lighting",
    location: "P-Block Parking Entrance",
    tower: "Common",
    flatNumber: "N/A",
    priority: "MEDIUM",
    status: "OPEN",
    slaHours: 24,
    slaDeadline: new Date(Date.now() + 18 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    photos: [],
    timeline: [
      { id: "t1", action: "CREATED", note: "Ticket raised", author: "Resident", timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk-004",
    ticketNumber: "TKT-2024-0104",
    title: "Gym treadmill making noise",
    description: "Treadmill #2 in the gym is making loud grinding noise. Belt seems to be misaligned.",
    category: "Amenities",
    subCategory: "Gym Equipment",
    location: "Clubhouse Gym",
    tower: "Common",
    flatNumber: "N/A",
    priority: "LOW",
    status: "RESOLVED",
    slaHours: 72,
    slaDeadline: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    workStarted: new Date(Date.now() - 24 * 3600000).toISOString(),
    workCompleted: new Date(Date.now() - 2 * 3600000).toISOString(),
    assignedTo: "Fitness Equipment Care",
    photos: [],
    timeline: [
      { id: "t1", action: "CREATED", note: "Ticket raised", author: "Resident", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
      { id: "t2", action: "ASSIGNED", note: "Assigned to maintenance team", author: "Helpdesk", timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
      { id: "t3", action: "RESOLVED", note: "Belt realigned and lubricated. Treadmill functional.", author: "Fitness Equipment Care", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    ],
    residentRating: 4,
    residentComment: "Fixed quickly, good work!",
  },
];

const TICKETS_KEY = "mana_smart_tickets";

function loadTickets(): SmartTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SAMPLE_TICKETS;
}

function saveTickets(tickets: SmartTicket[]) {
  try { localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets)); } catch {}
}

export const helpdeskSmartService = {
  getTickets(filter?: Partial<{ status: TicketStatus; priority: TicketPriority; tower: string }>): SmartTicket[] {
    let tickets = loadTickets();
    if (filter?.status) tickets = tickets.filter(t => t.status === filter.status);
    if (filter?.priority) tickets = tickets.filter(t => t.priority === filter.priority);
    if (filter?.tower) tickets = tickets.filter(t => t.tower === filter.tower);
    return tickets;
  },

  getTicketById(id: string): SmartTicket | undefined {
    return loadTickets().find(t => t.id === id);
  },

  classifyTicket(description: string): ClassificationResult {
    return classifyTicket(description);
  },

  createTicket(payload: {
    title: string;
    description: string;
    tower: string;
    flatNumber: string;
    reportedBy?: string;
    category?: string;
    subCategory?: string;
    location?: string;
    priority?: TicketPriority;
  }): SmartTicket {
    const classification = classifyTicket(payload.description);
    const priority = payload.priority || classification.priority;
    const slaHours = getSLAHours(priority);
    const ticket: SmartTicket = {
      id: `tk-${Date.now()}`,
      ticketNumber: `TKT-2024-${String(Date.now()).slice(-4)}`,
      title: payload.title,
      description: payload.description,
      category: payload.category || classification.category,
      subCategory: payload.subCategory || classification.subCategory,
      location: payload.location || `Tower ${payload.tower}, Flat ${payload.flatNumber}`,
      tower: payload.tower,
      flatNumber: payload.flatNumber,
      priority,
      status: "OPEN",
      slaHours,
      slaDeadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
      timeline: [{ id: `t-${Date.now()}`, action: "CREATED", note: "Ticket created", author: payload.reportedBy || "Resident", timestamp: new Date().toISOString() }],
    };
    const tickets = loadTickets();
    saveTickets([ticket, ...tickets]);
    return ticket;
  },

  updateTicketStatus(id: string, status: TicketStatus, note: string, author: string): SmartTicket | null {
    const tickets = loadTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const entry: TicketTimelineEntry = { id: `t-${Date.now()}`, action: status, note, author, timestamp: new Date().toISOString() };
    tickets[idx] = { ...tickets[idx], status, updatedAt: new Date().toISOString(), timeline: [...tickets[idx].timeline, entry] };
    saveTickets(tickets);
    return tickets[idx];
  },

  submitRating(id: string, rating: number, comment: string): boolean {
    const tickets = loadTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tickets[idx] = { ...tickets[idx], residentRating: rating, residentComment: comment };
    saveTickets(tickets);
    return true;
  },
};
