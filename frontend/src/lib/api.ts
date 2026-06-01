import {
  GOLDEN_AUDIT_LOGS,
  GOLDEN_CHMU,
  GOLDEN_DASHBOARD,
  GOLDEN_HOSPITAL_COMPARISON,
  GOLDEN_HOSPITALS,
  GOLDEN_LICENSES,
  GOLDEN_MODEL_INSTANCES,
  GOLDEN_REDIRECTS,
  GOLDEN_REGION_DASHBOARD,
  GOLDEN_USER_RECORDS,
  GOLDEN_USERS,
} from "./golden-data";
import type {
  AuditLogEntry,
  ChmuData,
  ClassifyResponse,
  DashboardData,
  Hospital,
  HospitalComparison,
  LicenseInfo,
  LoginResponse,
  ModelInstance,
  QueueItem,
  RedirectSuggestion,
  RegionDashboard,
  UserRecord,
} from "./types";
import { ApiError } from "./types";

const BASE = "/api/v1";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    throw new ApiError(`API chyba: ${res.status} ${res.statusText}`, res.status, {
      label: "Zkusit znovu",
      onClick: () => window.location.reload(),
    });
  }
  return res.json();
}

function isOpava(id: string): boolean {
  return id === "nem-opava";
}

/** ─── HOSPITALS ─── */

export async function getHospitals(): Promise<Hospital[]> {
  return GOLDEN_HOSPITALS;
}

export async function getHospital(id: string): Promise<Hospital> {
  if (isOpava(id)) {
    return apiFetch(`/hospitals/${id}`);
  }
  const h = GOLDEN_HOSPITALS.find((h) => h.id === id);
  if (!h)
    throw new ApiError(`Nemocnice s ID "${id}" nebyla nalezena.`, 404, {
      label: "Zpět na přehled",
      onClick: () => {
        window.location.href = "/";
      },
    });
  return h;
}

/** ─── AUTH ─── */

export async function login(hospitalId: string, email: string): Promise<LoginResponse> {
  if (isOpava(hospitalId)) {
    return apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId, email }),
    });
  }
  const hospital = GOLDEN_HOSPITALS.find((h) => h.id === hospitalId) ?? null;
  const users = GOLDEN_USERS[hospitalId] ?? GOLDEN_USERS.spravce ?? [];
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new ApiError(
      `Uživatel s emailem "${email}" nebyl nalezen v pracovišti "${hospitalId}".`,
      401,
      { label: "Zkusit jiný email", onClick: () => window.location.reload() },
    );
  }
  return { token: "demo-token", user, hospital };
}

export async function getUsersForHospital(
  hospitalId: string,
): Promise<{ id: string; name: string; email: string; role: string }[]> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/users`);
  }
  if (hospitalId === "spravce") {
    return (GOLDEN_USERS.spravce ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }
  return (GOLDEN_USERS[hospitalId] ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));
}

/** ─── DASHBOARD ─── */

export async function getDashboard(hospitalId: string): Promise<DashboardData> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/dashboard`);
  }
  const data = GOLDEN_DASHBOARD(hospitalId);
  if (!data) {
    throw new ApiError(`Nepodařilo se načíst dashboard pro "${hospitalId}".`, 404, {
      label: "Zpět na přehled",
      onClick: () => {
        window.location.href = "/";
      },
    });
  }
  return data;
}

export async function getQueue(hospitalId: string): Promise<QueueItem[]> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/queue`);
  }
  return GOLDEN_DASHBOARD(hospitalId).queue;
}

export async function getMetrics(hospitalId: string): Promise<DashboardData["metrics"]> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/metrics`);
  }
  return GOLDEN_DASHBOARD(hospitalId).metrics;
}

export async function getWeeklyStats(
  hospitalId: string,
): Promise<DashboardData["weeklyStats"]> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/weekly-stats`);
  }
  return GOLDEN_DASHBOARD(hospitalId).weeklyStats;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return GOLDEN_AUDIT_LOGS;
}

export async function getUsers(): Promise<UserRecord[]> {
  return GOLDEN_USER_RECORDS;
}

export async function classifyScan(
  hospitalId: string,
  imageBase64: string,
): Promise<ClassifyResponse> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });
  }
  return {
    scanId: "X-NEW",
    classification: "NÁLEZ",
    confidence: 0.92,
    findings: [
      {
        label: "Difuzní opacity v pravém dolním laloku",
        confidence: 0.92,
        category: "plicní parenchym",
      },
      {
        label: "Konsolidace v bazálních segmentech",
        confidence: 0.78,
        category: "plicní parenchym",
      },
      { label: "Srdeční stín v normě", confidence: 0.95, category: "mediastinum" },
      { label: "Bez známek pneumotoraxu", confidence: 0.97, category: "pleura" },
    ],
    llmReport:
      "Detekován vzorec odpovídající bakteriální pneumonii s 92% jistotou. Doporučuji zkontrolovat difuzní opacity v pravém dolním laloku. Srdeční stín v normě, bez známek pneumotoraxu.",
  };
}

/** ─── Správce kraje ─── */

export async function getRegionDashboard(): Promise<RegionDashboard> {
  return GOLDEN_REGION_DASHBOARD();
}

export async function getChmuData(): Promise<ChmuData> {
  return GOLDEN_CHMU;
}

export async function getRedirectSuggestions(): Promise<RedirectSuggestion[]> {
  return GOLDEN_REDIRECTS;
}

/** ─── IT Admin ─── */

export async function getModelInstances(): Promise<ModelInstance[]> {
  return GOLDEN_MODEL_INSTANCES;
}

export async function getLicenses(): Promise<LicenseInfo[]> {
  return GOLDEN_LICENSES;
}

export async function submitReview(
  hospitalId: string,
  scanId: string,
  decision: "healthy" | "different" | "agreed",
  doctorNote?: string,
): Promise<{ success: boolean }> {
  if (isOpava(hospitalId)) {
    return apiFetch(`/hospitals/${hospitalId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, decision, doctorNote }),
    });
  }
  return { success: true };
}

export async function confirmFeedback(
  _scanId: string,
  _confirmed: boolean,
): Promise<{ success: boolean }> {
  return { success: true };
}

/** ─── Ředitel ─── */

export async function getHospitalComparison(): Promise<HospitalComparison> {
  return GOLDEN_HOSPITAL_COMPARISON();
}
