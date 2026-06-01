export type Role = "doctor" | "radiologist" | "it_admin" | "spravce" | "reditel";

export interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  rtgDevices: number;
  dailyCapacity: number;
  utilization: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  hospitalId: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  hospital: Hospital | null;
}

export interface QueueItem {
  scanId: string;
  patientId: string;
  patientAge: number;
  patientSex: "M" | "F";
  probability: number;
  isUrgent: boolean;
  status: "pending" | "reviewed" | "critical";
  submittedAt: string;
  waitTimeMinutes: number;
  priorityScore: number;
  antiStarvationBoost: number;
  llmReport: string;
  classification?: "NÁLEZ" | "NORMÁLNÍ";
  findings?: Finding[];
  honeypot?: boolean;
  correctAnswer?: DoctorDecision;
}

export interface Finding {
  label: string;
  confidence: number;
  category: string;
}

export interface ClassifyResponse {
  scanId: string;
  classification: "NÁLEZ" | "NORMÁLNÍ";
  confidence: number;
  findings: Finding[];
  llmReport: string;
}

export interface ModelMetrics {
  sensitivity: number;
  specificity: number;
  falsePositiveRate: number;
  precision: number;
  accuracy: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalScans: number;
  baselineAccuracy: number;
}

export interface WeeklyStat {
  week: string;
  scans: number;
  urgent: number;
  avgProcessingTimeMin: number;
}

export interface DashboardData {
  hospital: Hospital;
  queueLength: number;
  urgentCount: number;
  avgWaitTimeMin: number;
  avgProcessingTimeMin: number;
  scansToday: number;
  utilization: number;
  metrics: ModelMetrics;
  weeklyStats: WeeklyStat[];
  queue: QueueItem[];
}

export interface AuditLogEntry {
  id: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLogin: string;
}

/** ─── Správce / Region ─── */

export interface ChmuData {
  station: string;
  city: string;
  pm25: number;
  pm10: number;
  timestamp: string;
  forecastNext24h: { hour: string; pm25: number; pm10: number }[];
}

export interface EventPrediction {
  eventType: "sport" | "concert" | "smog" | "weather";
  eventName: string;
  date: string;
  location: string;
  expectedLoadIncrease: number;
  suggestedRedirect: { fromHospitalId: string; toHospitalId: string; reason: string }[];
}

export interface RegionHospitalStatus extends Hospital {
  queueLength: number;
  urgentCount: number;
  scansToday: number;
  freeCapacity: number;
}

export interface RegionDashboard {
  hospitals: RegionHospitalStatus[];
  totalScansToday: number;
  totalQueueLength: number;
  avgUtilization: number;
  chmuData: ChmuData | null;
  upcomingEvents: EventPrediction[];
}

export interface RedirectSuggestion {
  fromHospitalId: string;
  toHospitalId: string;
  patientCount: number;
  reason: string;
  distanceKm: number;
}

/** ─── IT Admin ─── */

export interface ModelInstance {
  hospitalId: string;
  hospitalName: string;
  status: "online" | "degraded" | "offline";
  uptimePercent: number;
  version: string;
  lastDeployed: string;
  scansProcessed: number;
}

export interface LicenseInfo {
  id: string;
  hospitalName: string;
  licenseType: "trial" | "full" | "expired";
  validUntil: string;
  maxScansPerDay: number;
  activeUsers: number;
}

/** ─── Ředitel ─── */

export interface DeviceInfo {
  model: string;
  manufacturer: string;
  yearInstalled: number;
  ageYears: number;
  technology: "CR" | "DR" | "flat-panel";
  maintenanceStatus: "good" | "fair" | "poor";
}

export interface ClassifierInstance {
  hospitalId: string;
  hospitalName: string;
  deviceInfo: DeviceInfo;
  metrics: ModelMetrics;
  version: string;
  scansProcessed: number;
  avgConfidence: number;
}

export interface HospitalComparison {
  hospitals: ClassifierInstance[];
  avgAccuracy: number;
  bestDevice: string;
  worstDevice: string;
}

export type DoctorDecision = "healthy" | "different" | "agreed" | null;

export interface ScanReview {
  scanId: string;
  patientId: string;
  patientAge: number;
  patientSex: "M" | "F";
  submittedAt: string;
  classification: "NÁLEZ" | "NORMÁLNÍ";
  confidence: number;
  findings: Finding[];
  llmReport: string;
  imageUrl?: string;
  decision: DoctorDecision;
  doctorNote: string;
  reviewedAt?: string;
}

export class ApiError extends Error {
  status: number;
  action?: { label: string; onClick: () => void };

  constructor(
    message: string,
    status: number,
    action?: { label: string; onClick: () => void },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.action = action;
  }
}
