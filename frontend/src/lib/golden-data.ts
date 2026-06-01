import type {
  AuditLogEntry,
  ChmuData,
  ClassifierInstance,
  DashboardData,
  DeviceInfo,
  EventPrediction,
  Hospital,
  LicenseInfo,
  ModelInstance,
  ModelMetrics,
  QueueItem,
  RedirectSuggestion,
  RegionDashboard,
  RegionHospitalStatus,
  User,
  UserRecord,
  WeeklyStat,
} from "./types";

export const GOLDEN_HOSPITALS: Hospital[] = [
  {
    id: "fn-ostrava",
    name: "Fakultní nemocnice Ostrava",
    city: "Ostrava",
    district: "Ostrava-město",
    type: "fakultní",
    address: "17. listopadu 1790, Ostrava-Poruba",
    lat: 49.837,
    lng: 18.173,
    rtgDevices: 4,
    dailyCapacity: 300,
    utilization: 87,
  },
  {
    id: "nem-karvina",
    name: "Nemocnice Karviná",
    city: "Karviná",
    district: "Karviná",
    type: "krajská",
    address: "Vydmuchov 399/5, Karviná",
    lat: 49.855,
    lng: 18.541,
    rtgDevices: 2,
    dailyCapacity: 150,
    utilization: 72,
  },
  {
    id: "nem-opava",
    name: "Nemocnice Opava",
    city: "Opava",
    district: "Opava",
    type: "krajská",
    address: "Olomoucká 222/86, Opava",
    lat: 49.939,
    lng: 17.902,
    rtgDevices: 3,
    dailyCapacity: 180,
    utilization: 65,
  },
  {
    id: "nem-trinec",
    name: "Nemocnice Třinec",
    city: "Třinec",
    district: "Frýdek-Místek",
    type: "městská",
    address: "Kaštanová 268, Třinec",
    lat: 49.677,
    lng: 18.671,
    rtgDevices: 2,
    dailyCapacity: 120,
    utilization: 78,
  },
  {
    id: "nem-bruntal",
    name: "Nemocnice Bruntál",
    city: "Bruntál",
    district: "Bruntál",
    type: "krajská",
    address: "Nemocniční 1, Bruntál",
    lat: 49.988,
    lng: 17.464,
    rtgDevices: 1,
    dailyCapacity: 100,
    utilization: 55,
  },
  {
    id: "pol-frydek",
    name: "Poliklinika Frýdek-Místek",
    city: "Frýdek-Místek",
    district: "Frýdek-Místek",
    type: "poliklinika",
    address: "Palackého 123, Frýdek-Místek",
    lat: 49.688,
    lng: 18.351,
    rtgDevices: 1,
    dailyCapacity: 80,
    utilization: 60,
  },
];

export const GOLDEN_USERS: Record<string, User[]> = {
  "fn-ostrava": [
    {
      id: "u1",
      name: "MUDr. Jana Nováková",
      email: "jana.novakova@fn-ostrava.cz",
      role: "doctor",
      hospitalId: "fn-ostrava",
    },
    {
      id: "u2",
      name: "MUDr. Petr Horák",
      email: "petr.horak@fn-ostrava.cz",
      role: "doctor",
      hospitalId: "fn-ostrava",
    },
    {
      id: "u3",
      name: "Ing. Petr Svoboda",
      email: "petr.svoboda@fn-ostrava.cz",
      role: "it_admin",
      hospitalId: "fn-ostrava",
    },
  ],
  "nem-karvina": [
    {
      id: "u5",
      name: "MUDr. Eva Malá",
      email: "eva.mala@nem-karvina.cz",
      role: "doctor",
      hospitalId: "nem-karvina",
    },
    {
      id: "u6",
      name: "MUDr. Jan Novotný",
      email: "jan.novotny@nem-karvina.cz",
      role: "doctor",
      hospitalId: "nem-karvina",
    },
    {
      id: "u7",
      name: "Bc. Lucie Krátká",
      email: "lucie.kratka@nem-karvina.cz",
      role: "it_admin",
      hospitalId: "nem-karvina",
    },
  ],
  "nem-opava": [
    {
      id: "u8",
      name: "MUDr. Karel Veselý",
      email: "karel.vesely@nem-opava.cz",
      role: "doctor",
      hospitalId: "nem-opava",
    },
    {
      id: "u9",
      name: "MUDr. Alena Krásná",
      email: "alena.krasna@nem-opava.cz",
      role: "doctor",
      hospitalId: "nem-opava",
    },
  ],
  spravce: [
    {
      id: "u10",
      name: "Ing. Martin Dvořák",
      email: "martin.dvorak@msk-kraj.cz",
      role: "spravce",
      hospitalId: "spravce",
    },
  ],
  reditel: [
    {
      id: "u11",
      name: "MUDr. Pavel Horák, MBA",
      email: "pavel.horak@msk-kraj.cz",
      role: "reditel",
      hospitalId: "reditel",
    },
  ],
};

function priorityScore(item: { probability: number; waitTimeMinutes: number }): number {
  return Math.round(
    (item.probability * 70 + Math.min(item.waitTimeMinutes / 60, 1) * 30) * 100,
  );
}

function antiStarvationBoost(waitTimeMinutes: number): number {
  if (waitTimeMinutes > 45) return 35;
  if (waitTimeMinutes > 30) return 25;
  if (waitTimeMinutes > 15) return 15;
  return 0;
}

const LLM_REPORTS: Record<string, string> = {
  "X-1024":
    "Detekován vzorec odpovídající bakteriální pneumonii s jistotou 92 %. Doporučuji zkontrolovat difuzní opacity v pravém dolním laloku a konsolidace v bazálních segmentech. Srdeční stín v normě, bez známek pneumotoraxu.",
  "X-1025":
    "Detekován vzorec odpovídající městnavému srdečnímu selhání s jistotou 78 %. Doporučuji zkontrolovat bilaterální plicní infiltráty a kardiomegalii.",
  "X-1027":
    "Nenalezeny známky patologických změn s jistotou 88 %. Klasifikace: normální nález.",
  "X-1030":
    "Detekován vzorec odpovídající chronické obstrukční plicní nemoci s jistotou 45 %. Doporučuji zkontrolovat hyperinflaci plic a známky bronchitidy. Nízká jistota — doporučeno posouzení radiologem.",
  "X-1026":
    "Nenalezeny známky patologických změn s jistotou 95 %. Klasifikace: normální nález.",
  "X-1031":
    "Detekován vzorec odpovídající pneumotoraxu s jistotou 96 %. Doporučuji zkontrolovat pravostranný pneumotorax s posunem mediastina. URGENTNÍ — nutné neodkladné vyšetření.",
  "X-1032":
    "Detekován vzorec odpovídající plicní embolii s jistotou 88 %. Doporučuji zkontrolovat periferní opacity a rozšíření plicní tepny.",
  "X-1033":
    "Nenalezeny známky patologických změn s jistotou 91 %. Klasifikace: normální nález.",
  "X-1034":
    "Detekován vzorec odpovídající atelektáze s jistotou 73 %. Doporučuji zkontrolovat zvýšenou denzitu v levém dolním laloku.",
  "X-1035":
    "Detekován vzorec odpovídající plicní fibróze s jistotou 67 %. Doporučuji zkontrolovat retikulární opacity a honeycombing v bazálních segmentech.",
  "X-1036":
    "Nenalezeny známky patologických změn s jistotou 84 %. Klasifikace: normální nález.",
  "X-1037":
    "Detekován vzorec odpovídající tuberkulóze s jistotou 81 %. Doporučuji zkontrolovat apikální infiltráty a kavitární léze.",
  "X-1038":
    "Detekován vzorec odpovídající pneumonii s jistotou 59 %. Doporučuji zkontrolovat lobární konsolidaci v pravém středním laloku.",
  "X-1039":
    "Nenalezeny známky patologických změn s jistotou 93 %. Klasifikace: normální nález.",
  "H-1001":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
  "H-1002":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
  "H-1003":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
  "H-1004":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
  "H-1005":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
  "H-1006":
    "Detekován vzorec odpovídající fraktuře žeber s jistotou 97 %. Jasně patrná linie fraktury na 4. a 5. żebru vpravo v laterálním úseku. HONEYPOT TEST.",
};

function buildQueueItem(
  base: Omit<QueueItem, "priorityScore" | "antiStarvationBoost" | "llmReport">,
): QueueItem {
  return {
    ...base,
    priorityScore: priorityScore(base) + antiStarvationBoost(base.waitTimeMinutes),
    antiStarvationBoost: antiStarvationBoost(base.waitTimeMinutes),
    llmReport: LLM_REPORTS[base.scanId] ?? "Model nemá dostatek dat pro LLM report.",
  };
}

export function GOLDEN_QUEUE(hospitalId: string): QueueItem[] {
  const queues: Record<
    string,
    Omit<QueueItem, "priorityScore" | "antiStarvationBoost" | "llmReport">[]
  > = {
    "fn-ostrava": [
      {
        scanId: "X-1024",
        patientId: "P-4531",
        patientAge: 67,
        patientSex: "M",
        probability: 0.92,
        isUrgent: true,
        status: "critical",
        submittedAt: "2026-06-01T07:12:00",
        waitTimeMinutes: 68,
      },
      {
        scanId: "X-1025",
        patientId: "P-4532",
        patientAge: 45,
        patientSex: "F",
        probability: 0.78,
        isUrgent: true,
        status: "pending",
        submittedAt: "2026-06-01T07:55:00",
        waitTimeMinutes: 25,
      },
      {
        scanId: "X-1027",
        patientId: "P-4534",
        patientAge: 34,
        patientSex: "F",
        probability: 0.12,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:20:00",
        waitTimeMinutes: 0,
      },
      {
        scanId: "X-1030",
        patientId: "P-4537",
        patientAge: 29,
        patientSex: "M",
        probability: 0.45,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:10:00",
        waitTimeMinutes: 10,
      },
      {
        scanId: "H-1001",
        patientId: "P-4550",
        patientAge: 59,
        patientSex: "M",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:00:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
          { label: "Drobný pleurální výpotek", confidence: 0.42, category: "pleurální" },
        ],
      },
    ],
    "nem-karvina": [
      {
        scanId: "X-1026",
        patientId: "P-4533",
        patientAge: 72,
        patientSex: "M",
        probability: 0.05,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T07:18:00",
        waitTimeMinutes: 62,
      },
      {
        scanId: "X-1031",
        patientId: "P-4538",
        patientAge: 63,
        patientSex: "F",
        probability: 0.96,
        isUrgent: true,
        status: "critical",
        submittedAt: "2026-06-01T08:30:00",
        waitTimeMinutes: 0,
      },
      {
        scanId: "H-1002",
        patientId: "P-4551",
        patientAge: 44,
        patientSex: "F",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:05:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
        ],
      },
    ],
    "nem-opava": [
      {
        scanId: "X-1032",
        patientId: "P-4539",
        patientAge: 55,
        patientSex: "M",
        probability: 0.88,
        isUrgent: true,
        status: "critical",
        submittedAt: "2026-06-01T07:45:00",
        waitTimeMinutes: 35,
      },
      {
        scanId: "X-1033",
        patientId: "P-4540",
        patientAge: 41,
        patientSex: "F",
        probability: 0.09,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:05:00",
        waitTimeMinutes: 15,
      },
      {
        scanId: "X-1030",
        patientId: "P-4537",
        patientAge: 29,
        patientSex: "M",
        probability: 0.45,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:10:00",
        waitTimeMinutes: 10,
      },
      {
        scanId: "H-1003",
        patientId: "P-4552",
        patientAge: 61,
        patientSex: "M",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:10:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
        ],
      },
    ],
    "nem-trinec": [
      {
        scanId: "X-1034",
        patientId: "P-4541",
        patientAge: 60,
        patientSex: "M",
        probability: 0.73,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T07:30:00",
        waitTimeMinutes: 50,
      },
      {
        scanId: "X-1035",
        patientId: "P-4542",
        patientAge: 52,
        patientSex: "F",
        probability: 0.67,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:00:00",
        waitTimeMinutes: 20,
      },
      {
        scanId: "H-1004",
        patientId: "P-4553",
        patientAge: 37,
        patientSex: "M",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:15:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
        ],
      },
    ],
    "nem-bruntal": [
      {
        scanId: "X-1036",
        patientId: "P-4543",
        patientAge: 38,
        patientSex: "F",
        probability: 0.16,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T07:50:00",
        waitTimeMinutes: 30,
      },
      {
        scanId: "X-1037",
        patientId: "P-4544",
        patientAge: 70,
        patientSex: "M",
        probability: 0.81,
        isUrgent: true,
        status: "pending",
        submittedAt: "2026-06-01T08:15:00",
        waitTimeMinutes: 5,
      },
      {
        scanId: "H-1005",
        patientId: "P-4554",
        patientAge: 50,
        patientSex: "F",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:20:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
        ],
      },
    ],
    "pol-frydek": [
      {
        scanId: "X-1038",
        patientId: "P-4545",
        patientAge: 47,
        patientSex: "F",
        probability: 0.59,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T07:35:00",
        waitTimeMinutes: 45,
      },
      {
        scanId: "X-1039",
        patientId: "P-4546",
        patientAge: 33,
        patientSex: "M",
        probability: 0.07,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T08:25:00",
        waitTimeMinutes: 0,
      },
      {
        scanId: "H-1006",
        patientId: "P-4555",
        patientAge: 66,
        patientSex: "F",
        probability: 0.97,
        isUrgent: false,
        status: "pending",
        submittedAt: "2026-06-01T09:25:00",
        waitTimeMinutes: 0,
        honeypot: true,
        correctAnswer: "agreed",
        classification: "NÁLEZ",
        findings: [
          { label: "Fraktura 4. žebra vpravo", confidence: 0.97, category: "kosterní" },
          { label: "Fraktura 5. žebra vpravo", confidence: 0.95, category: "kosterní" },
        ],
      },
    ],
  };
  return (queues[hospitalId] ?? []).map(buildQueueItem) as QueueItem[];
}

export const GOLDEN_METRICS: ModelMetrics = {
  sensitivity: 0.91,
  specificity: 0.84,
  falsePositiveRate: 0.16,
  precision: 0.87,
  accuracy: 0.88,
  f1Score: 0.89,
  truePositives: 86,
  falsePositives: 13,
  trueNegatives: 69,
  falseNegatives: 9,
  totalScans: 177,
  baselineAccuracy: 62,
};

export function GOLDEN_WEEKLY_STATS(hospitalId: string): WeeklyStat[] {
  const stats: Record<string, WeeklyStat[]> = {
    "fn-ostrava": [
      { week: "19. týd", scans: 185, urgent: 42, avgProcessingTimeMin: 28 },
      { week: "20. týd", scans: 172, urgent: 38, avgProcessingTimeMin: 24 },
      { week: "21. týd", scans: 198, urgent: 45, avgProcessingTimeMin: 20 },
      { week: "22. týd", scans: 190, urgent: 40, avgProcessingTimeMin: 16 },
      { week: "23. týd", scans: 210, urgent: 48, avgProcessingTimeMin: 14 },
    ],
    "nem-karvina": [
      { week: "19. týd", scans: 95, urgent: 22, avgProcessingTimeMin: 32 },
      { week: "20. týd", scans: 88, urgent: 18, avgProcessingTimeMin: 28 },
      { week: "21. týd", scans: 102, urgent: 25, avgProcessingTimeMin: 25 },
      { week: "22. týd", scans: 97, urgent: 20, avgProcessingTimeMin: 22 },
      { week: "23. týd", scans: 110, urgent: 28, avgProcessingTimeMin: 18 },
    ],
  };
  return stats[hospitalId] ?? stats["fn-ostrava"]!;
}

export function GOLDEN_DASHBOARD(hospitalId: string): DashboardData {
  const hospital =
    GOLDEN_HOSPITALS.find((h) => h.id === hospitalId) ?? GOLDEN_HOSPITALS[0]!;
  const queue = GOLDEN_QUEUE(hospitalId);
  const weeklyStats = GOLDEN_WEEKLY_STATS(hospitalId);
  const urgentCount = queue.filter((q) => q.isUrgent).length;
  const avgWait =
    queue.length > 0
      ? Math.round(queue.reduce((s, q) => s + q.waitTimeMinutes, 0) / queue.length)
      : 0;
  const avgProcessing =
    weeklyStats.reduce((s, w) => s + w.avgProcessingTimeMin, 0) / weeklyStats.length;
  const latestWeek = weeklyStats[weeklyStats.length - 1]!;

  return {
    hospital,
    queueLength: queue.length,
    urgentCount,
    avgWaitTimeMin: avgWait,
    avgProcessingTimeMin: Math.round(avgProcessing),
    scansToday: Math.round(latestWeek.scans / 5),
    utilization: hospital.utilization,
    metrics: { ...GOLDEN_METRICS },
    weeklyStats,
    queue,
  };
}

export const GOLDEN_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "l1",
    userName: "MUDr. Jana Nováková",
    action: "zkontrolovala snímek a potvrdila nález AI",
    target: "X-1024 — shoda AI: 92 %, lékař: pneumonie",
    timestamp: "2026-06-01T08:45:00",
    severity: "info",
  },
  {
    id: "l2",
    userName: "MUDr. Jana Nováková",
    action: "vyvrátila predikci AI (false positive)",
    target: "X-1025 — AI: městnavé selhání (78 %), lékař: normální nález",
    timestamp: "2026-06-01T08:47:00",
    severity: "warning",
  },
  {
    id: "l3",
    userName: "Ing. Petr Svoboda",
    action: "aktivoval licenci pro nové pracoviště",
    target: "Poliklinika Frýdek-Místek — trial 30 dní",
    timestamp: "2026-06-01T09:00:00",
    severity: "info",
  },
  {
    id: "l4",
    userName: "Ing. Petr Svoboda",
    action: "aktualizoval model na verzi",
    target: "v2.3.1 — FN Ostrava, Nemocnice Karviná",
    timestamp: "2026-06-01T09:15:00",
    severity: "info",
  },
  {
    id: "l5",
    userName: "MUDr. Petr Horák",
    action: "nahlásil podezření na chybu modelu",
    target: "X-1028 — nespolehlivá predikce u staršího pacienta",
    timestamp: "2026-06-01T08:50:00",
    severity: "error",
  },
  {
    id: "l6",
    userName: "MUDr. Eva Malá",
    action: "potvrdila nález AI (shoda)",
    target: "X-1031 — AI: pneumotorax (96 %), lékař: pneumotorax",
    timestamp: "2026-06-01T09:20:00",
    severity: "info",
  },
  {
    id: "l7",
    userName: "Systém",
    action: "anti-starvation mechanism — automatická prioritizace",
    target: "X-1026 (Nemocnice Karviná) — čeká 62 min, boost +35 bodů",
    timestamp: "2026-06-01T08:20:00",
    severity: "info",
  },
  {
    id: "l8",
    userName: "Systém",
    action: "detekce smogové situace — predikce zvýšené zátěže",
    target: "PM2.5 = 85 μg/m³ — Ostrava, doporučeno přesměrování na Nem. Opava",
    timestamp: "2026-06-01T06:00:00",
    severity: "warning",
  },
];

export const GOLDEN_USER_RECORDS: UserRecord[] = [
  {
    id: "u1",
    name: "MUDr. Jana Nováková",
    email: "jana.novakova@fn-ostrava.cz",
    role: "doctor",
    active: true,
    lastLogin: "2026-06-01T07:30:00",
  },
  {
    id: "u2",
    name: "MUDr. Petr Horák",
    email: "petr.horak@fn-ostrava.cz",
    role: "doctor",
    active: true,
    lastLogin: "2026-05-31T06:45:00",
  },
  {
    id: "u3",
    name: "Ing. Petr Svoboda",
    email: "petr.svoboda@fn-ostrava.cz",
    role: "it_admin",
    active: true,
    lastLogin: "2026-06-01T06:15:00",
  },
  {
    id: "u5",
    name: "MUDr. Eva Malá",
    email: "eva.mala@nem-karvina.cz",
    role: "doctor",
    active: true,
    lastLogin: "2026-06-01T07:00:00",
  },
  {
    id: "u7",
    name: "Bc. Lucie Krátká",
    email: "lucie.kratka@nem-karvina.cz",
    role: "it_admin",
    active: false,
    lastLogin: "2026-05-28T14:20:00",
  },
  {
    id: "u10",
    name: "Ing. Martin Dvořák",
    email: "martin.dvorak@msk-kraj.cz",
    role: "spravce",
    active: true,
    lastLogin: "2026-06-01T06:00:00",
  },
  {
    id: "u11",
    name: "MUDr. Pavel Horák, MBA",
    email: "pavel.horak@msk-kraj.cz",
    role: "reditel",
    active: true,
    lastLogin: "2026-06-01T05:30:00",
  },
];

/** ─── Region (Správce) ─── */

export const GOLDEN_CHMU: ChmuData = {
  station: "Ostrava-Radvanice",
  city: "Ostrava",
  pm25: 85,
  pm10: 120,
  timestamp: "2026-06-01T06:00:00",
  forecastNext24h: [
    { hour: "06:00", pm25: 85, pm10: 120 },
    { hour: "09:00", pm25: 90, pm10: 130 },
    { hour: "12:00", pm25: 72, pm10: 105 },
    { hour: "15:00", pm25: 60, pm10: 90 },
    { hour: "18:00", pm25: 55, pm10: 80 },
    { hour: "21:00", pm25: 50, pm10: 75 },
  ],
};

export const GOLDEN_EVENTS: EventPrediction[] = [
  {
    eventType: "smog",
    eventName: "Smogová situace — Ostravsko",
    date: "2026-06-01",
    location: "Ostrava a okolí",
    expectedLoadIncrease: 28,
    suggestedRedirect: [
      {
        fromHospitalId: "fn-ostrava",
        toHospitalId: "nem-opava",
        reason:
          "FN Ostrava očekává +28 % nápor (smog). Nemocnice Opava má volnou kapacitu 35 %.",
      },
    ],
  },
  {
    eventType: "sport",
    eventName: "Maraton Ostrava 2026",
    date: "2026-06-14",
    location: "Ostrava centrum",
    expectedLoadIncrease: 18,
    suggestedRedirect: [
      {
        fromHospitalId: "fn-ostrava",
        toHospitalId: "nem-opava",
        reason:
          "Plánovaná sportovní akce — preventivní přesměrování plánovaných kontrol.",
      },
    ],
  },
];

export function GOLDEN_REGION_HOSPITALS(): RegionHospitalStatus[] {
  return GOLDEN_HOSPITALS.map((h) => {
    const queue = GOLDEN_QUEUE(h.id);
    const weeklyStats = GOLDEN_WEEKLY_STATS(h.id);
    const latestWeek = weeklyStats[weeklyStats.length - 1]!;
    return {
      ...h,
      queueLength: queue.length,
      urgentCount: queue.filter((q) => q.isUrgent).length,
      scansToday: Math.round(latestWeek.scans / 5),
      freeCapacity: h.dailyCapacity - Math.round(latestWeek.scans / 5),
    };
  });
}

export function GOLDEN_REGION_DASHBOARD(): RegionDashboard {
  const hospitals = GOLDEN_REGION_HOSPITALS();
  return {
    hospitals,
    totalScansToday: hospitals.reduce((s, h) => s + h.scansToday, 0),
    totalQueueLength: hospitals.reduce((s, h) => s + h.queueLength, 0),
    avgUtilization: Math.round(
      hospitals.reduce((s, h) => s + h.utilization, 0) / hospitals.length,
    ),
    chmuData: GOLDEN_CHMU,
    upcomingEvents: GOLDEN_EVENTS,
  };
}

export const GOLDEN_REDIRECTS: RedirectSuggestion[] = [
  {
    fromHospitalId: "fn-ostrava",
    toHospitalId: "nem-opava",
    patientCount: 8,
    reason:
      "Smogová situace — FN Ostrava vytížena na 87 %, Nemocnice Opava má 35 % volné kapacity. Vzdálenost 15 km.",
    distanceKm: 15,
  },
  {
    fromHospitalId: "nem-karvina",
    toHospitalId: "nem-trinec",
    patientCount: 3,
    reason: "Rutinní kontroly — přesun na méně vytížené pracoviště.",
    distanceKm: 12,
  },
];

/** ─── IT Admin ─── */

export const GOLDEN_MODEL_INSTANCES: ModelInstance[] = [
  {
    hospitalId: "fn-ostrava",
    hospitalName: "Fakultní nemocnice Ostrava",
    status: "online",
    uptimePercent: 99.97,
    version: "v2.3.1",
    lastDeployed: "2026-05-28",
    scansProcessed: 15782,
  },
  {
    hospitalId: "nem-karvina",
    hospitalName: "Nemocnice Karviná",
    status: "online",
    uptimePercent: 99.82,
    version: "v2.3.1",
    lastDeployed: "2026-05-28",
    scansProcessed: 8432,
  },
  {
    hospitalId: "nem-opava",
    hospitalName: "Nemocnice Opava",
    status: "degraded",
    uptimePercent: 97.34,
    version: "v2.2.0",
    lastDeployed: "2026-05-15",
    scansProcessed: 5210,
  },
  {
    hospitalId: "nem-trinec",
    hospitalName: "Nemocnice Třinec",
    status: "online",
    uptimePercent: 99.91,
    version: "v2.3.0",
    lastDeployed: "2026-05-20",
    scansProcessed: 3491,
  },
  {
    hospitalId: "nem-bruntal",
    hospitalName: "Nemocnice Bruntál",
    status: "offline",
    uptimePercent: 88.12,
    version: "v1.9.0",
    lastDeployed: "2026-04-10",
    scansProcessed: 1298,
  },
  {
    hospitalId: "pol-frydek",
    hospitalName: "Poliklinika Frýdek-Místek",
    status: "online",
    uptimePercent: 99.54,
    version: "v2.3.0",
    lastDeployed: "2026-05-20",
    scansProcessed: 876,
  },
];

export const GOLDEN_LICENSES: LicenseInfo[] = [
  {
    id: "lic-001",
    hospitalName: "Fakultní nemocnice Ostrava",
    licenseType: "full",
    validUntil: "2027-06-01",
    maxScansPerDay: 500,
    activeUsers: 12,
  },
  {
    id: "lic-002",
    hospitalName: "Nemocnice Karviná",
    licenseType: "full",
    validUntil: "2026-12-31",
    maxScansPerDay: 250,
    activeUsers: 6,
  },
  {
    id: "lic-003",
    hospitalName: "Nemocnice Opava",
    licenseType: "trial",
    validUntil: "2026-07-15",
    maxScansPerDay: 200,
    activeUsers: 4,
  },
  {
    id: "lic-004",
    hospitalName: "Nemocnice Třinec",
    licenseType: "full",
    validUntil: "2026-09-30",
    maxScansPerDay: 200,
    activeUsers: 3,
  },
  {
    id: "lic-005",
    hospitalName: "Nemocnice Bruntál",
    licenseType: "expired",
    validUntil: "2026-04-30",
    maxScansPerDay: 0,
    activeUsers: 0,
  },
  {
    id: "lic-006",
    hospitalName: "Poliklinika Frýdek-Místek",
    licenseType: "trial",
    validUntil: "2026-07-01",
    maxScansPerDay: 150,
    activeUsers: 2,
  },
];

/** ─── Ředitel ─── */

export const GOLDEN_DEVICE_INFO: Record<string, DeviceInfo> = {
  "fn-ostrava": {
    model: "Multix Fusion Max",
    manufacturer: "Siemens Healthineers",
    yearInstalled: 2022,
    ageYears: 4,
    technology: "DR",
    maintenanceStatus: "good",
  },
  "nem-karvina": {
    model: "Optima XR646",
    manufacturer: "GE Healthcare",
    yearInstalled: 2019,
    ageYears: 7,
    technology: "DR",
    maintenanceStatus: "fair",
  },
  "nem-opava": {
    model: "Mobilett Mira Max",
    manufacturer: "Siemens Healthineers",
    yearInstalled: 2023,
    ageYears: 3,
    technology: "DR",
    maintenanceStatus: "good",
  },
  "nem-trinec": {
    model: "RadSpeed Pro",
    manufacturer: "Canon Medical",
    yearInstalled: 2017,
    ageYears: 9,
    technology: "CR",
    maintenanceStatus: "fair",
  },
  "nem-bruntal": {
    model: "AXIOM Iconos R200",
    manufacturer: "Siemens",
    yearInstalled: 2012,
    ageYears: 14,
    technology: "CR",
    maintenanceStatus: "poor",
  },
  "pol-frydek": {
    model: "Revolution XR",
    manufacturer: "GE Healthcare",
    yearInstalled: 2021,
    ageYears: 5,
    technology: "DR",
    maintenanceStatus: "good",
  },
};

export const GOLDEN_CLASSIFIER_INSTANCES: ClassifierInstance[] = [
  {
    hospitalId: "fn-ostrava",
    hospitalName: "Fakultní nemocnice Ostrava",
    deviceInfo: GOLDEN_DEVICE_INFO["fn-ostrava"]!,
    metrics: {
      sensitivity: 0.93,
      specificity: 0.88,
      falsePositiveRate: 0.12,
      precision: 0.9,
      accuracy: 0.91,
      f1Score: 0.91,
      truePositives: 92,
      falsePositives: 10,
      trueNegatives: 73,
      falseNegatives: 7,
      totalScans: 182,
      baselineAccuracy: 62,
    },
    version: "v2.3.1",
    scansProcessed: 15782,
    avgConfidence: 0.89,
  },
  {
    hospitalId: "nem-karvina",
    hospitalName: "Nemocnice Karviná",
    deviceInfo: GOLDEN_DEVICE_INFO["nem-karvina"]!,
    metrics: {
      sensitivity: 0.87,
      specificity: 0.81,
      falsePositiveRate: 0.19,
      precision: 0.84,
      accuracy: 0.84,
      f1Score: 0.85,
      truePositives: 54,
      falsePositives: 10,
      trueNegatives: 43,
      falseNegatives: 8,
      totalScans: 115,
      baselineAccuracy: 58,
    },
    version: "v2.3.1",
    scansProcessed: 8432,
    avgConfidence: 0.84,
  },
  {
    hospitalId: "nem-opava",
    hospitalName: "Nemocnice Opava",
    deviceInfo: GOLDEN_DEVICE_INFO["nem-opava"]!,
    metrics: {
      sensitivity: 0.94,
      specificity: 0.9,
      falsePositiveRate: 0.1,
      precision: 0.92,
      accuracy: 0.92,
      f1Score: 0.93,
      truePositives: 48,
      falsePositives: 4,
      trueNegatives: 36,
      falseNegatives: 3,
      totalScans: 91,
      baselineAccuracy: 65,
    },
    version: "v2.2.0",
    scansProcessed: 5210,
    avgConfidence: 0.92,
  },
  {
    hospitalId: "nem-trinec",
    hospitalName: "Nemocnice Třinec",
    deviceInfo: GOLDEN_DEVICE_INFO["nem-trinec"]!,
    metrics: {
      sensitivity: 0.82,
      specificity: 0.76,
      falsePositiveRate: 0.24,
      precision: 0.79,
      accuracy: 0.8,
      f1Score: 0.8,
      truePositives: 31,
      falsePositives: 8,
      trueNegatives: 25,
      falseNegatives: 7,
      totalScans: 71,
      baselineAccuracy: 55,
    },
    version: "v2.3.0",
    scansProcessed: 3491,
    avgConfidence: 0.79,
  },
  {
    hospitalId: "nem-bruntal",
    hospitalName: "Nemocnice Bruntál",
    deviceInfo: GOLDEN_DEVICE_INFO["nem-bruntal"]!,
    metrics: {
      sensitivity: 0.71,
      specificity: 0.68,
      falsePositiveRate: 0.32,
      precision: 0.72,
      accuracy: 0.7,
      f1Score: 0.71,
      truePositives: 15,
      falsePositives: 6,
      trueNegatives: 14,
      falseNegatives: 6,
      totalScans: 41,
      baselineAccuracy: 50,
    },
    version: "v1.9.0",
    scansProcessed: 1298,
    avgConfidence: 0.72,
  },
  {
    hospitalId: "pol-frydek",
    hospitalName: "Poliklinika Frýdek-Místek",
    deviceInfo: GOLDEN_DEVICE_INFO["pol-frydek"]!,
    metrics: {
      sensitivity: 0.88,
      specificity: 0.82,
      falsePositiveRate: 0.18,
      precision: 0.85,
      accuracy: 0.85,
      f1Score: 0.86,
      truePositives: 22,
      falsePositives: 4,
      trueNegatives: 18,
      falseNegatives: 3,
      totalScans: 47,
      baselineAccuracy: 60,
    },
    version: "v2.3.0",
    scansProcessed: 876,
    avgConfidence: 0.85,
  },
];

export function GOLDEN_HOSPITAL_COMPARISON() {
  const instances = GOLDEN_CLASSIFIER_INSTANCES;
  const avgAccuracy = +(
    instances.reduce((s, i) => s + i.metrics.accuracy, 0) / instances.length
  ).toFixed(3);
  const sorted = [...instances].sort(
    (a, b) => a.deviceInfo.ageYears - b.deviceInfo.ageYears,
  );
  const bestDevice = sorted[0]?.hospitalName;
  const worstDevice = sorted[sorted.length - 1]?.hospitalName;
  return { hospitals: instances, avgAccuracy, bestDevice, worstDevice };
}
