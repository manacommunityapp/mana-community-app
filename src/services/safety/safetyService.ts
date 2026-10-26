import { apiClient } from '../common/apiClient';
import type {
  VisitorPass,
  VisitorLog,
  Vehicle,
  VehicleAccessLog,
  ParkingViolation,
  DeliveryLog,
  DomesticStaff,
  StaffAttendanceLog,
  SafetyIncident,
  IncidentUpdate,
  HardwareDevice,
  HardwareIntegrationResult,
  DashboardSummary,
  VisitorType,
  VisitorStatus,
  PassType,
  VehicleType,
  VehicleAccessType,
  ParkingViolationType,
  ViolationStatus,
  DeliveryDropLocation,
  DeliveryStatus,
  StaffType,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  DeviceType,
} from '../../types/safety';

const DEFAULT_PASSES: VisitorPass[] = [
  {
    id: 1,
    communityId: 1,
    residentId: 1,
    residentName: 'Rajesh Sharma',
    flatNumber: 'A-402',
    tower: 'Tower A',
    visitorName: 'Amit Verma',
    visitorPhone: '+91 98765 43210',
    visitorType: 'GUEST',
    passType: 'ONE_TIME',
    status: 'PRE_APPROVED',
    passCode: '849201',
    qrPayload: 'MANA-PASS:1:849201:A-402',
    vehicleNumber: 'KA-01-MJ-4521',
    expectedGuestCount: 2,
    expectedArrival: new Date().toISOString(),
    validUntil: new Date(Date.now() + 12 * 3600000).toISOString(),
    purpose: 'Weekend Dinner Visit',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    residentId: 2,
    residentName: 'Priya Sundaram',
    flatNumber: 'B-1004',
    tower: 'Tower B',
    visitorName: 'Urban Company Tech (Suresh)',
    visitorPhone: '+91 91234 56789',
    visitorType: 'SERVICE_TECHNICIAN',
    passType: 'ONE_TIME',
    status: 'CHECKED_IN',
    passCode: '439182',
    qrPayload: 'MANA-PASS:1:439182:B-1004',
    expectedGuestCount: 1,
    expectedArrival: new Date().toISOString(),
    validUntil: new Date(Date.now() + 4 * 3600000).toISOString(),
    purpose: 'AC Repair & Servicing',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEFAULT_ACTIVE_VISITORS: VisitorLog[] = [
  {
    id: 101,
    communityId: 1,
    passId: 2,
    visitorName: 'Urban Company Tech (Suresh)',
    visitorPhone: '+91 91234 56789',
    flatNumber: 'B-1004',
    tower: 'Tower B',
    vehicleNumber: 'KA-03-HA-8821',
    entryTime: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'CHECKED_IN',
    remarks: 'AC Service toolkit carried',
  },
  {
    id: 102,
    communityId: 1,
    visitorName: 'Swiggy Delivery (Ramesh)',
    visitorPhone: '+91 99887 76655',
    flatNumber: 'C-201',
    tower: 'Tower C',
    vehicleNumber: 'KA-05-ET-1992',
    entryTime: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'CHECKED_IN',
    remarks: 'Food delivery to doorstep',
  },
];

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 1,
    communityId: 1,
    residentId: 1,
    licensePlate: 'KA01MJ4521',
    rfidTagNumber: 'RFID-984210',
    vehicleType: 'EV_FOUR_WHEELER',
    accessType: 'RESIDENT',
    makeModel: 'Tata Nexon EV Max',
    color: 'Teal Blue',
    flatNumber: 'A-402',
    tower: 'Tower A',
    parkingSlotNumber: 'B1-A402',
    isEv: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    residentId: 1,
    licensePlate: 'KA04HH9912',
    rfidTagNumber: 'RFID-331290',
    vehicleType: 'TWO_WHEELER',
    accessType: 'RESIDENT',
    makeModel: 'Ather 450X',
    color: 'White',
    flatNumber: 'A-402',
    tower: 'Tower A',
    parkingSlotNumber: 'B1-A402-2W',
    isEv: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    communityId: 1,
    residentId: 2,
    licensePlate: 'KA03NB7711',
    rfidTagNumber: 'RFID-771122',
    vehicleType: 'FOUR_WHEELER',
    accessType: 'RESIDENT',
    makeModel: 'Hyundai Creta SX',
    color: 'Polar White',
    flatNumber: 'B-1004',
    tower: 'Tower B',
    parkingSlotNumber: 'B2-B1004',
    isEv: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_VEHICLE_LOGS: VehicleAccessLog[] = [
  {
    id: 1,
    communityId: 1,
    vehicleId: 1,
    licensePlate: 'KA01MJ4521',
    rfidTag: 'RFID-984210',
    direction: 'IN',
    accessType: 'RESIDENT',
    triggerSource: 'ANPR',
    barrierActuated: true,
    isAuthorized: true,
    gateName: 'Main Entrance Gate 1',
    accessTime: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    vehicleId: 3,
    licensePlate: 'KA03NB7711',
    rfidTag: 'RFID-771122',
    direction: 'OUT',
    accessType: 'RESIDENT',
    triggerSource: 'RFID',
    barrierActuated: true,
    isAuthorized: true,
    gateName: 'North Exit Gate 2',
    accessTime: new Date(Date.now() - 55 * 60000).toISOString(),
  },
];

const DEFAULT_VIOLATIONS: ParkingViolation[] = [
  {
    id: 1,
    communityId: 1,
    vehicleNumber: 'KA-05-MM-1234',
    parkingSlotNumber: 'B1-EV-02',
    tower: 'Tower A',
    violationType: 'EV_BAY_MISUSE',
    status: 'REPORTED',
    description: 'Non-EV Petrol vehicle parked in dedicated EV fast-charging bay for over 3 hours.',
    fineAmount: 500,
    reportedByName: 'Security Guard Somesh',
    reportedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    vehicleNumber: 'KA-51-AB-8800',
    parkingSlotNumber: 'Basement 1 Ramp',
    tower: 'Tower C',
    violationType: 'FIRE_LANE_BLOCK',
    status: 'FINED',
    description: 'Vehicle parked right in front of the emergency fire escape ramp obstructing access.',
    fineAmount: 1000,
    reportedByName: 'Facility Manager Kiran',
    reportedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];

const DEFAULT_DELIVERIES: DeliveryLog[] = [
  {
    id: 1,
    communityId: 1,
    flatNumber: 'A-402',
    tower: 'Tower A',
    courierCompany: 'Amazon India',
    deliveryAgentName: 'Vikas Kumar',
    deliveryAgentPhone: '+91 98112 23344',
    packageCount: 2,
    dropLocation: 'MAIN_GATE_LOCKER',
    status: 'LEFT_AT_GATE',
    lockerSlot: 'Locker B-14',
    collectionOtp: '7492',
    gateArrivedAt: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    flatNumber: 'B-1004',
    tower: 'Tower B',
    courierCompany: 'Flipkart Supermart',
    deliveryAgentName: 'Sunil Rao',
    packageCount: 1,
    dropLocation: 'DOORSTEP',
    status: 'OUT_FOR_DOOR_DELIVERY',
    collectionOtp: '1940',
    gateArrivedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

const DEFAULT_STAFF: DomesticStaff[] = [
  {
    id: 1,
    communityId: 1,
    staffName: 'Lakshmi Devi',
    phone: '+91 97412 88491',
    staffType: 'MAID',
    verificationStatus: 'VERIFIED',
    govtIdType: 'AADHAAR',
    govtIdNumber: 'XXXX-XXXX-4829',
    assignedFlats: 'A-402, A-403, B-102',
    rating: 4.9,
    isActive: true,
  },
  {
    id: 2,
    communityId: 1,
    staffName: 'Manjunath Gowda',
    phone: '+91 96112 33499',
    staffType: 'DRIVER',
    verificationStatus: 'VERIFIED',
    govtIdType: 'DRIVING_LICENSE',
    govtIdNumber: 'KA-04201800291',
    assignedFlats: 'B-1004',
    rating: 4.8,
    isActive: true,
  },
];

const DEFAULT_INCIDENTS: SafetyIncident[] = [
  {
    id: 1,
    communityId: 1,
    incidentNumber: 'INC-172739182',
    title: 'Water Seepage near Basement 2 Power Panel',
    description: 'Minor water dripping observed adjacent to the auxiliary power transformer in Basement 2.',
    category: 'FIRE_HAZARD',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    location: 'Basement 2, Pillar P-14',
    tower: 'Tower B',
    reportedByName: 'Patrol Guard Ramesh',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

const DEFAULT_DEVICES: HardwareDevice[] = [
  {
    id: 1,
    communityId: 1,
    deviceName: 'Main Gate Inbound ANPR Camera',
    deviceCode: 'CAM-ANPR-01',
    deviceType: 'ANPR_CAMERA',
    ipAddress: '192.168.10.101',
    location: 'Main Security Gate Lane 1',
    isOnline: true,
    firmwareVersion: 'v3.4.2-LPR-AI',
    lastHeartbeatAt: new Date().toISOString(),
  },
  {
    id: 2,
    communityId: 1,
    deviceName: 'North Gate RFID FastTag Reader',
    deviceCode: 'RFID-GATE-02',
    deviceType: 'RFID_READER',
    ipAddress: '192.168.10.102',
    location: 'North Barrier Gate 2',
    isOnline: true,
    firmwareVersion: 'v2.1.0-UHF',
    lastHeartbeatAt: new Date().toISOString(),
  },
  {
    id: 3,
    communityId: 1,
    deviceName: 'Clubhouse Turnstile Access Reader',
    deviceCode: 'ACS-TURN-01',
    deviceType: 'TURNSTILE',
    ipAddress: '192.168.10.105',
    location: 'Clubhouse Main Foyer',
    isOnline: true,
    firmwareVersion: 'v1.8.4',
    lastHeartbeatAt: new Date().toISOString(),
  },
];

class SafetyService {
  private getStore<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem('mana_safety_' + key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStore<T>(key: string, val: T): void {
    try {
      localStorage.setItem('mana_safety_' + key, JSON.stringify(val));
    } catch {}
  }

  // ──── DASHBOARD ────
  async getDashboardSummary(communityId = 1): Promise<DashboardSummary> {
    const activeVisitors = this.getStore<VisitorLog[]>('active_visitors', DEFAULT_ACTIVE_VISITORS);
    const deliveries = this.getStore<DeliveryLog[]>('deliveries', DEFAULT_DELIVERIES);
    const staff = this.getStore<DomesticStaff[]>('staff', DEFAULT_STAFF);
    const vehicleLogs = this.getStore<VehicleAccessLog[]>('vehicle_logs', DEFAULT_VEHICLE_LOGS);
    const violations = this.getStore<ParkingViolation[]>('violations', DEFAULT_VIOLATIONS);
    const incidents = this.getStore<SafetyIncident[]>('incidents', DEFAULT_INCIDENTS);

    return {
      activeVisitorsInside: activeVisitors.filter(v => v.status === 'CHECKED_IN').length,
      pendingDeliveries: deliveries.filter(d => d.status !== 'COLLECTED_BY_RESIDENT').length,
      staffOnDuty: staff.filter(s => s.isActive).length,
      vehicleEntriesToday: vehicleLogs.filter(l => l.direction === 'IN').length + 84,
      vehicleExitsToday: vehicleLogs.filter(l => l.direction === 'OUT').length + 72,
      activeParkingViolations: violations.filter(v => v.status !== 'PAID' && v.status !== 'WAIVED').length,
      openIncidents: incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length,
      activeGates: 4,
      recentGateActivities: vehicleLogs,
    };
  }

  // ──── VISITOR PASSES ────
  async getVisitorPasses(communityId = 1): Promise<VisitorPass[]> {
    return this.getStore<VisitorPass[]>('passes', DEFAULT_PASSES);
  }

  async createVisitorPass(passData: Partial<VisitorPass>): Promise<VisitorPass> {
    const passes = await this.getVisitorPasses();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newPass: VisitorPass = {
      id: Date.now(),
      communityId: 1,
      residentId: 1,
      residentName: passData.residentName || 'Current Resident',
      flatNumber: passData.flatNumber || 'A-402',
      tower: passData.tower || 'Tower A',
      visitorName: passData.visitorName || 'Guest',
      visitorPhone: passData.visitorPhone,
      visitorType: passData.visitorType || 'GUEST',
      passType: passData.passType || 'ONE_TIME',
      status: 'PRE_APPROVED',
      passCode: code,
      qrPayload: `MANA-PASS:1:${code}:${passData.flatNumber || 'A-402'}`,
      vehicleNumber: passData.vehicleNumber,
      expectedGuestCount: passData.expectedGuestCount || 1,
      expectedArrival: passData.expectedArrival || new Date().toISOString(),
      validUntil: passData.validUntil || new Date(Date.now() + 12 * 3600000).toISOString(),
      purpose: passData.purpose,
      createdAt: new Date().toISOString(),
    };
    passes.unshift(newPass);
    this.setStore('passes', passes);
    return newPass;
  }

  async getActiveVisitors(communityId = 1): Promise<VisitorLog[]> {
    return this.getStore<VisitorLog[]>('active_visitors', DEFAULT_ACTIVE_VISITORS);
  }

  async checkOutVisitor(logId: number): Promise<void> {
    const logs = await this.getActiveVisitors();
    const updated = logs.map(l => l.id === logId ? { ...l, status: 'CHECKED_OUT' as VisitorStatus, exitTime: new Date().toISOString() } : l);
    this.setStore('active_visitors', updated);
  }

  // ──── VEHICLES & PARKING ────
  async getVehicles(communityId = 1): Promise<Vehicle[]> {
    return this.getStore<Vehicle[]>('vehicles', DEFAULT_VEHICLES);
  }

  async registerVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicles = await this.getVehicles();
    const newVehicle: Vehicle = {
      id: Date.now(),
      communityId: 1,
      residentId: 1,
      licensePlate: (data.licensePlate || '').toUpperCase().replace(/\s+/g, ''),
      rfidTagNumber: data.rfidTagNumber || `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleType: data.vehicleType || 'FOUR_WHEELER',
      accessType: data.accessType || 'RESIDENT',
      makeModel: data.makeModel,
      color: data.color,
      flatNumber: data.flatNumber || 'A-402',
      tower: data.tower || 'Tower A',
      parkingSlotNumber: data.parkingSlotNumber,
      isEv: !!data.isEv,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    this.setStore('vehicles', vehicles);
    return newVehicle;
  }

  async getParkingViolations(communityId = 1): Promise<ParkingViolation[]> {
    return this.getStore<ParkingViolation[]>('violations', DEFAULT_VIOLATIONS);
  }

  async reportViolation(data: Partial<ParkingViolation>): Promise<ParkingViolation> {
    const violations = await this.getParkingViolations();
    const newViolation: ParkingViolation = {
      id: Date.now(),
      communityId: 1,
      vehicleNumber: (data.vehicleNumber || '').toUpperCase().replace(/\s+/g, ''),
      parkingSlotNumber: data.parkingSlotNumber,
      tower: data.tower,
      violationType: data.violationType || 'UNAUTHORIZED_SLOT',
      status: 'REPORTED',
      description: data.description,
      fineAmount: data.fineAmount || 500,
      reportedByName: data.reportedByName || 'Resident / Guard',
      reportedAt: new Date().toISOString(),
    };
    violations.unshift(newViolation);
    this.setStore('violations', violations);
    return newViolation;
  }

  async updateViolationStatus(id: number, status: ViolationStatus): Promise<void> {
    const list = await this.getParkingViolations();
    const updated = list.map(v => v.id === id ? { ...v, status, resolvedAt: new Date().toISOString() } : v);
    this.setStore('violations', updated);
  }

  // ──── DELIVERIES ────
  async getDeliveries(communityId = 1): Promise<DeliveryLog[]> {
    return this.getStore<DeliveryLog[]>('deliveries', DEFAULT_DELIVERIES);
  }

  async logDelivery(data: Partial<DeliveryLog>): Promise<DeliveryLog> {
    const list = await this.getDeliveries();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const newDelivery: DeliveryLog = {
      id: Date.now(),
      communityId: 1,
      flatNumber: data.flatNumber || 'A-402',
      tower: data.tower || 'Tower A',
      courierCompany: data.courierCompany || 'Courier',
      deliveryAgentName: data.deliveryAgentName,
      deliveryAgentPhone: data.deliveryAgentPhone,
      packageCount: data.packageCount || 1,
      dropLocation: data.dropLocation || 'MAIN_GATE_LOCKER',
      status: data.dropLocation === 'DOORSTEP' ? 'OUT_FOR_DOOR_DELIVERY' : 'LEFT_AT_GATE',
      lockerSlot: data.lockerSlot || `Locker-${Math.floor(1 + Math.random() * 30)}`,
      collectionOtp: otp,
      gateArrivedAt: new Date().toISOString(),
    };
    list.unshift(newDelivery);
    this.setStore('deliveries', list);
    return newDelivery;
  }

  async collectDelivery(id: number, otp: string): Promise<boolean> {
    const list = await this.getDeliveries();
    const item = list.find(d => d.id === id);
    if (!item || item.collectionOtp !== otp) {
      return false;
    }
    const updated = list.map(d => d.id === id ? { ...d, status: 'COLLECTED_BY_RESIDENT' as DeliveryStatus, collectedAt: new Date().toISOString() } : d);
    this.setStore('deliveries', updated);
    return true;
  }

  // ──── DOMESTIC STAFF & PATROLS ────
  async getStaff(communityId = 1): Promise<DomesticStaff[]> {
    return this.getStore<DomesticStaff[]>('staff', DEFAULT_STAFF);
  }

  async registerStaff(data: Partial<DomesticStaff>): Promise<DomesticStaff> {
    const list = await this.getStaff();
    const newStaff: DomesticStaff = {
      id: Date.now(),
      communityId: 1,
      staffName: data.staffName || '',
      phone: data.phone || '',
      staffType: data.staffType || 'MAID',
      verificationStatus: 'PENDING',
      govtIdType: data.govtIdType || 'AADHAAR',
      govtIdNumber: data.govtIdNumber,
      assignedFlats: data.assignedFlats || '',
      rating: 5.0,
      isActive: true,
    };
    list.push(newStaff);
    this.setStore('staff', list);
    return newStaff;
  }

  // ──── SAFETY INCIDENTS & SOS ────
  async getIncidents(communityId = 1): Promise<SafetyIncident[]> {
    return this.getStore<SafetyIncident[]>('incidents', DEFAULT_INCIDENTS);
  }

  async reportIncident(data: Partial<SafetyIncident>): Promise<SafetyIncident> {
    const list = await this.getIncidents();
    const newInc: SafetyIncident = {
      id: Date.now(),
      communityId: 1,
      incidentNumber: `INC-${Date.now()}`,
      title: data.title || 'Safety Alert',
      description: data.description,
      category: data.category || 'SUSPICIOUS_ACTIVITY',
      severity: data.severity || 'MEDIUM',
      status: 'REPORTED',
      location: data.location,
      tower: data.tower,
      reportedByName: data.reportedByName || 'Resident',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newInc);
    this.setStore('incidents', list);
    return newInc;
  }

  // ──── HARDWARE & AI SIMULATION ────
  async getDevices(communityId = 1): Promise<HardwareDevice[]> {
    return this.getStore<HardwareDevice[]>('devices', DEFAULT_DEVICES);
  }

  async simulateAnprScan(licensePlate: string): Promise<HardwareIntegrationResult> {
    const vehicles = await this.getVehicles();
    const cleanPlate = licensePlate.toUpperCase().replace(/\s+/g, '');
    const matched = vehicles.find(v => v.licensePlate === cleanPlate);

    const log: VehicleAccessLog = {
      id: Date.now(),
      communityId: 1,
      vehicleId: matched?.id,
      licensePlate: cleanPlate,
      direction: 'IN',
      accessType: matched ? matched.accessType : 'VISITOR',
      triggerSource: 'ANPR',
      barrierActuated: !!matched,
      isAuthorized: !!matched,
      gateName: 'Main Entrance Lane 1',
      accessTime: new Date().toISOString(),
    };

    const logs = this.getStore<VehicleAccessLog[]>('vehicle_logs', DEFAULT_VEHICLE_LOGS);
    logs.unshift(log);
    this.setStore('vehicle_logs', logs);

    if (matched) {
      return {
        authorized: true,
        barrierActuated: true,
        matchedEntityType: 'RESIDENT_VEHICLE',
        entityName: `${matched.makeModel} (${matched.licensePlate})`,
        flatNumber: matched.flatNumber,
        message: 'ANPR Verified. Boom Barrier Actuated (Open).',
      };
    } else {
      return {
        authorized: false,
        barrierActuated: false,
        matchedEntityType: 'UNKNOWN',
        entityName: 'Unregistered Vehicle',
        message: 'License plate not registered. Security verification required.',
      };
    }
  }

  async simulateRfidScan(rfidTag: string): Promise<HardwareIntegrationResult> {
    const vehicles = await this.getVehicles();
    const matched = vehicles.find(v => v.rfidTagNumber === rfidTag);

    if (matched) {
      return {
        authorized: true,
        barrierActuated: true,
        matchedEntityType: 'RESIDENT_VEHICLE',
        entityName: `${matched.makeModel} (${matched.licensePlate})`,
        flatNumber: matched.flatNumber,
        message: 'RFID FastPass Validated. Boom barrier raised.',
      };
    }

    return {
      authorized: false,
      barrierActuated: false,
      matchedEntityType: 'UNKNOWN',
      message: 'Unrecognized RFID FastPass tag.',
    };
  }

  // ──── BACKEND MICROSERVICE API METHODS ────

  /** Create Pre-Approved Visitor Pass on backend */
  async createVisitorPassApi(passData: Partial<VisitorPass>): Promise<VisitorPass> {
    try {
      const res = await apiClient.post<any>('/v1/safety/visitors/pre-approved', passData);
      if (res && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend create visitor pass failed, falling back to local store:', e);
    }
    return this.createVisitorPass(passData);
  }

  /** Register resident vehicle on backend */
  async registerVehicleApi(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const res = await apiClient.post<any>('/v1/safety/vehicles/register', vehicleData);
      if (res && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend register vehicle failed, falling back to local store:', e);
    }
    return this.registerVehicle(vehicleData);
  }

  /** Register domestic staff on backend */
  async registerStaffApi(staffData: Partial<DomesticStaff>): Promise<DomesticStaff> {
    try {
      const res = await apiClient.post<any>('/v1/safety/staff/register', staffData);
      if (res && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend register staff failed, falling back to local store:', e);
    }
    return this.registerStaff(staffData);
  }

  /** Fetch active security watchlist from backend */
  async getWatchlistApi(communityId = 1): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/v1/security/watchlist', {
        headers: { 'X-Community-Id': communityId.toString() },
      });
      if (res && Array.isArray(res)) {
        return res;
      }
    } catch (e) {
      console.warn('Backend watchlist API failed:', e);
    }
    return [];
  }

  /** Fetch security rules from backend */
  async getSecurityRulesApi(communityId = 1): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/v1/security/rules', {
        headers: { 'X-Community-Id': communityId.toString() },
      });
      if (res && Array.isArray(res)) {
        return res;
      }
    } catch (e) {
      console.warn('Backend security rules API failed:', e);
    }
    return [];
  }
}

export const safetyService = new SafetyService();
