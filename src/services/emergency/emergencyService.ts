export type EmergencyCategory =
  | "MEDICAL" | "FIRE" | "LIFT" | "SECURITY" | "GAS_LEAK"
  | "FLOOD" | "POWER" | "CHILD_SAFETY" | "NATURAL_DISASTER" | "OTHER";

export type EmergencyStatus = "TRIGGERED" | "ASSIGNED" | "RESPONDING" | "RESOLVED" | "CLOSED";
export type EmergencySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface IncidentUpdate {
  id: string;
  note: string;
  author: string;
  timestamp: string;
}

export interface EmergencyIncident {
  id: string;
  incidentNumber: string;
  category: EmergencyCategory;
  title: string;
  description: string;
  location: string;
  tower: string;
  flatNumber: string;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  reportedBy: string;
  reportedByPhone: string;
  reportedAt: string;
  assignedResponder?: string;
  responderPhone?: string;
  responderRole?: string;
  etaMinutes?: number;
  updates: IncidentUpdate[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available24x7: boolean;
  coversTower?: string;
}

const DEFAULT_INCIDENTS: EmergencyIncident[] = [
  {
    id: "inc-001",
    incidentNumber: "EMG-2024-001",
    category: "MEDICAL",
    title: "Elderly resident collapsed",
    description: "Resident reported unresponsive in flat, needs immediate medical attention.",
    location: "Tower A, Flat 302",
    tower: "A",
    flatNumber: "302",
    severity: "CRITICAL",
    status: "RESPONDING",
    reportedBy: "Meena Sharma",
    reportedByPhone: "+91 98765 43210",
    reportedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    assignedResponder: "Dr. Ramesh Pillai",
    responderPhone: "+91 99887 76655",
    responderRole: "Community Paramedic",
    etaMinutes: 3,
    updates: [
      { id: "u1", note: "Incident triggered", author: "System", timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: "u2", note: "Paramedic assigned and en route", author: "Control Room", timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: "u3", note: "Ambulance called to Gate 2", author: "Dr. Ramesh Pillai", timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
    ],
  },
  {
    id: "inc-002",
    incidentNumber: "EMG-2024-002",
    category: "LIFT",
    title: "Residents trapped in Lift B",
    description: "3 residents including a senior citizen stuck in Lift B between floors 6 and 7.",
    location: "Tower B, Lift B",
    tower: "B",
    flatNumber: "N/A",
    severity: "HIGH",
    status: "ASSIGNED",
    reportedBy: "Arun Nair",
    reportedByPhone: "+91 91234 56789",
    reportedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    assignedResponder: "Kiran (Lift Technician)",
    responderPhone: "+91 90011 22334",
    responderRole: "Lift Maintenance Tech",
    etaMinutes: 10,
    updates: [
      { id: "u1", note: "Lift malfunction reported", author: "System", timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: "u2", note: "Lift technician dispatched", author: "Control Room", timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
    ],
  },
];

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id: "ec-1", name: "Control Room", role: "24x7 Security Control", phone: "+91 80000 00001", available24x7: true },
  { id: "ec-2", name: "Dr. Ramesh Pillai", role: "Community Paramedic", phone: "+91 99887 76655", available24x7: true },
  { id: "ec-3", name: "Fire Marshal - Tower A", role: "Tower Marshal", phone: "+91 80000 00003", available24x7: false, coversTower: "A" },
  { id: "ec-4", name: "Fire Marshal - Tower B", role: "Tower Marshal", phone: "+91 80000 00004", available24x7: false, coversTower: "B" },
  { id: "ec-5", name: "Lift Maintenance (Kiran)", role: "Lift Technician", phone: "+91 90011 22334", available24x7: true },
  { id: "ec-6", name: "Gas Emergency (IGL)", role: "Gas Utility", phone: "1906", available24x7: true },
  { id: "ec-7", name: "Police PCR", role: "Police Control Room", phone: "100", available24x7: true },
  { id: "ec-8", name: "Child Safety Officer", role: "Community Child Safety", phone: "+91 80000 00008", available24x7: false },
];

const STORAGE_KEY = "mana_emergency_incidents";

function loadIncidents(): EmergencyIncident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_INCIDENTS;
}

function saveIncidents(incidents: EmergencyIncident[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents)); } catch {}
}

export const emergencyService = {
  getIncidents(): EmergencyIncident[] {
    return loadIncidents();
  },

  getContacts(): EmergencyContact[] {
    return DEFAULT_CONTACTS;
  },

  triggerSOS(payload: {
    category: EmergencyCategory;
    tower: string;
    flatNumber: string;
    description: string;
    reportedBy: string;
    reportedByPhone: string;
  }): EmergencyIncident {
    const incidents = loadIncidents();
    const newIncident: EmergencyIncident = {
      id: `inc-${Date.now()}`,
      incidentNumber: `EMG-2024-${String(incidents.length + 1).padStart(3, "0")}`,
      category: payload.category,
      title: `${payload.category} Emergency - Tower ${payload.tower} Flat ${payload.flatNumber}`,
      description: payload.description,
      location: `Tower ${payload.tower}, Flat ${payload.flatNumber}`,
      tower: payload.tower,
      flatNumber: payload.flatNumber,
      severity: payload.category === "MEDICAL" || payload.category === "FIRE" || payload.category === "GAS_LEAK" ? "CRITICAL" : "HIGH",
      status: "TRIGGERED",
      reportedBy: payload.reportedBy,
      reportedByPhone: payload.reportedByPhone,
      reportedAt: new Date().toISOString(),
      updates: [{ id: `u-${Date.now()}`, note: "SOS Triggered", author: payload.reportedBy, timestamp: new Date().toISOString() }],
    };
    const updated = [newIncident, ...incidents];
    saveIncidents(updated);
    return newIncident;
  },

  updateIncidentStatus(id: string, status: EmergencyStatus, note: string, author: string): EmergencyIncident | null {
    const incidents = loadIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;
    incidents[idx] = {
      ...incidents[idx],
      status,
      updates: [...incidents[idx].updates, { id: `u-${Date.now()}`, note, author, timestamp: new Date().toISOString() }],
    };
    saveIncidents(incidents);
    return incidents[idx];
  },
};
