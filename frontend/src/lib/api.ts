/**
 * API service layer.
 *
 * ─── Golden data (demo) ───
 * All endpoints return static golden data.
 *
 * ─── Backend connection ───
 * When Adam's backend is ready:
 *   1. Only Nemocnice Opava ("nem-opava") will have real AI evaluation.
 *   2. All other hospitals keep returning golden (static) data.
 *   3. Replace function bodies with fetch() but gate on hospitalId:
 *
 *      if (hospitalId !== "nem-opava") return GOLDEN_...(hospitalId);
 *      const res = await fetch(`https://api.druhy-par-oci.cz/v1/...`);
 *      return res.json();
 *
 * ─── Auth ───
 * Currently demo-style: user picks role → mocked user.
 * Later: real JWT from /auth/login.
 *
 * ─── Classify ───
 * Only works for Opava on backend. Other hospitals get a
 * golden "demo" classification response.
 */

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

/* ─── EXAMPLE: real backend guard ───

async function realOrGolden<T>(
  hospitalId: string,
  goldenFn: (id: string) => T,
  url: string,
): Promise<T> {
  if (hospitalId !== "nem-opava") return goldenFn(hospitalId);
  const res = await fetch(url);
  return res.json();
}
*/

/** ─── HOSPITALS ─── */

export async function getHospitals(): Promise<Hospital[]> {
  return GOLDEN_HOSPITALS;
}

export async function getHospital(id: string): Promise<Hospital> {
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
  /* Backend:
     const res = await fetch(`https://api.druhy-par-oci.cz/v1/auth/login`, {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ hospitalId, email }),
     });
     if (!res.ok) throw new ApiError("Přihlášení selhalo.", res.status, {
       label: "Zkusit znovu", onClick: () => window.location.reload(),
     });
     return res.json();
  */
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
  /* Backend: only Opava is real
     if (hospitalId !== "nem-opava") return GOLDEN_DASHBOARD(hospitalId);
     const res = await fetch(`https://api.druhy-par-oci.cz/v1/hospitals/${hospitalId}/dashboard`);
     if (!res.ok) throw new ApiError("Nepodařilo se načíst data pracoviště.", res.status, {
       label: "Zkusit znovu", onClick: () => window.location.reload(),
     });
     return res.json();
  */
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
  return GOLDEN_DASHBOARD(hospitalId).queue;
}

export async function getMetrics(hospitalId: string): Promise<DashboardData["metrics"]> {
  return GOLDEN_DASHBOARD(hospitalId).metrics;
}

export async function getWeeklyStats(
  hospitalId: string,
): Promise<DashboardData["weeklyStats"]> {
  return GOLDEN_DASHBOARD(hospitalId).weeklyStats;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return GOLDEN_AUDIT_LOGS;
}

export async function getUsers(): Promise<UserRecord[]> {
  return GOLDEN_USER_RECORDS;
}

export async function classifyScan(
  _hospitalId: string,
  _imageBase64: string,
): Promise<ClassifyResponse> {
  /* Backend: only Opava sends real images
     if (hospitalId !== "nem-opava") return goldenClassify();
     const res = await fetch(`https://api.druhy-par-oci.cz/v1/hospitals/${hospitalId}/classify`, {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ imageBase64 }),
     });
     return res.json();
  */
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
  _scanId: string,
  _decision: "healthy" | "different" | "agreed",
  _doctorNote?: string,
): Promise<{ success: boolean }> {
  /* Backend:
     const res = await fetch(`https://api.druhy-par-oci.cz/v1/scans/${scanId}/review`, {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ decision, doctorNote }),
     });
     if (!res.ok) throw new ApiError("Odeslání hodnocení selhalo.", res.status, {
       label: "Zkusit znovu", onClick: () => window.location.reload(),
     });
     return res.json();
  */
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
