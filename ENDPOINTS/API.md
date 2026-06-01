# API Documentation — Druhý pár očí

> Dokumentace všech API endpointů pro backend (Adam).

---

## Architektura

```
Frontend (React + Vite) → api.ts → Backend API
                                ↑
                           golden-data.ts (fallback)
```

- **Všechna data jsou nyní golden (statická):** frontend vrací stejná data vždy.
- **Po nasazení backendu:** pouze **Nemocnice Opava ("nem-opava")** bude mít reálné AI vyhodnocování.
- **Ostatní nemocnice:** nadále vrací golden (statická) data — jejich fronta, metriky a klasifikace se nemění.

---

## Jak se přepne Opava na backend

V souboru `src/lib/api.ts` u každé funkce stačí přidat podmínku:

```ts
async function getDashboard(hospitalId: string): Promise<DashboardData> {
  if (hospitalId !== "nem-opava") return GOLDEN_DASHBOARD(hospitalId);
  const res = await fetch(`https://api.druhy-par-oci.cz/v1/hospitals/${hospitalId}/dashboard`);
  return res.json();
}
```

Stejný pattern pro:
- `getQueue` → `GET /hospitals/:id/queue`
- `getMetrics` → `GET /hospitals/:id/metrics`
- `getWeeklyStats` → `GET /hospitals/:id/weekly-stats`
- `classifyScan` → `POST /hospitals/:id/classify`

---

## Base URL (po nasazení)

```
https://api.druhy-par-oci.cz/v1
```

Aktuálně: `mock` — vše vraceno z `golden-data.ts`.

---

## Endpoints

### 1. Seznam nemocnic

```
GET /hospitals
```

**Response** `200`

```json
[
  {
    "id": "fn-ostrava",
    "name": "Fakultní nemocnice Ostrava",
    "city": "Ostrava",
    "district": "Ostrava-město",
    "type": "fakultní",
    "address": "17. listopadu 1790, Ostrava-Poruba",
    "lat": 49.837,
    "lng": 18.173,
    "rtgDevices": 4,
    "dailyCapacity": 300,
    "utilization": 87
  }
]
```

---

### 2. Detail nemocnice

```
GET /hospitals/:id
```

**Response** `200` — single hospital.

---

### 3. Přihlášení

```
POST /auth/login
```

**Request**
```json
{
  "hospitalId": "fn-ostrava",
  "email": "jana.novakova@fn-ostrava.cz"
}
```

**Response** `200`
```json
{
  "token": "jwt-token",
  "user": {
    "id": "u1",
    "name": "MUDr. Jana Nováková",
    "email": "jana.novakova@fn-ostrava.cz",
    "role": "doctor",
    "hospitalId": "fn-ostrava"
  },
  "hospital": { ... }
}
```

---

### 4. Uživatelé nemocnice

```
GET /hospitals/:id/users
```

**Response** `200` — array of `{ id, name, email, role }`.

---

### 5. Dashboard

```
GET /hospitals/:id/dashboard
```

**Response** `200`
```json
{
  "hospital": { ... },
  "queueLength": 4,
  "urgentCount": 2,
  "avgWaitTimeMin": 4,
  "avgProcessingTimeMin": 20,
  "scansToday": 42,
  "utilization": 87,
  "metrics": { "sensitivity": 0.91, "specificity": 0.84, "falsePositiveRate": 0.16, "precision": 0.87, "accuracy": 0.88, "f1Score": 0.89, "truePositives": 86, "falsePositives": 13, "trueNegatives": 69, "falseNegatives": 9, "totalScans": 177, "baselineAccuracy": 62 },
  "weeklyStats": [ { "week": "19. týd", "scans": 185, "urgent": 42, "avgProcessingTimeMin": 28 } ],
  "queue": [ { "scanId": "X-1024", "patientId": "P-4531", "patientAge": 67, "patientSex": "M", "probability": 0.92, "isUrgent": true, "status": "critical", "submittedAt": "2026-06-01T08:12:00", "waitTimeMinutes": 5, "priorityScore": 89, "antiStarvationBoost": 35, "llmReport": "..." } ]
}
```

---

### 6. Fronta

```
GET /hospitals/:id/queue
```

**Response** `200` — array `QueueItem[]`.

---

### 7. Metriky modelu

```
GET /hospitals/:id/metrics
```

**Response** `200` — `ModelMetrics`.

---

### 8. Týdenní statistiky

```
GET /hospitals/:id/weekly-stats
```

**Response** `200` — `WeeklyStat[]`.

---

### 9. Klasifikace snímku (pouze Opava po nasazení)

```
POST /hospitals/:id/classify
```

**Request**
```json
{
  "imageBase64": "data:image/png;base64,..."
}
```

**Response** `200`
```json
{
  "scanId": "X-NEW",
  "classification": "NÁLEZ",
  "confidence": 0.92,
  "findings": [
    { "label": "Difuzní opacity v pravém dolním laloku", "confidence": 0.92, "category": "plicní parenchym" }
  ],
  "llmReport": "Detekován vzorec odpovídající bakteriální pneumonii s 92% jistotou..."
}
```

---

### 10. Zpětná vazba (Data Fly-wheel)

```
POST /hospitals/:id/feedback
```

**Request**
```json
{
  "scanId": "X-1024",
  "confirmed": true
}
```

**Response** `200`
```json
{ "success": true }
```

---

### 11. Auditní log

```
GET /admin/audit-logs
```

**Response** `200` — `AuditLogEntry[]`.

---

### 12. Uživatelé (admin)

```
GET /admin/users
```

**Response** `200` — `UserRecord[]`.

---

### 13. Krajský dashboard (Správce)

```
GET /region/dashboard
```

**Response** `200` — `RegionDashboard` (hospitals, totalScansToday, totalQueueLength, avgUtilization, chmuData, upcomingEvents).

### 14. ČHMÚ data

```
GET /region/chmu
```

**Response** `200` — `ChmuData` (pm25, pm10, forecast).

### 15. Návrhy přesměrování

```
GET /region/redirects
```

**Response** `200` — `RedirectSuggestion[]`.

---

### 16. Instance modelů (IT Admin)

```
GET /admin/models
```

**Response** `200` — `ModelInstance[]`.

### 17. Licence (IT Admin)

```
GET /admin/licenses
```

**Response** `200` — `LicenseInfo[]`.

---

## Poznámky pro Adama (backend)

### Opava-only real data
- Po nasazení produkčního modelu bude živé vyhodnocování jen pro `nem-opava`.
- Všechny ostatní `hospitalId` vrací golden-static data z `golden-data.ts`.
- Frontend pozná rozdíl podle `hospitalId` — v `api.ts` je připravena podmínka `if (hospitalId !== "nem-opava") return golden...`.

### Hybridní prioritizace fronty
`priorityScore = AI confidence × 70 + normalized wait time × 30 + anti-starvation boost`

Anti-starvation boost:
- 15 min → 0
- 15–30 min → 15
- 30–45 min → 25
- 45+ min → 35

### Data Fly-wheel
Lékař potvrzuje/vyvrací AI predikci jedním klikem. Data se okamžitě vrací do trénovacího pipeline.

### ČHMÚ integrace
- Model stahuje PM2.5/PM10 z ČHMÚ.
- Při smogové situaci (> 50 μg/m³ PM2.5) systém automaticky predikuje +28 % nápor.
- Navrhuje přesměrování plánovaných kontrol na méně vytížená pracoviště.

### AI nikdy nediagnostikuje
AI říká: "Detekován vzorec odpovídající zápalu s jistotou 82 %."
AI neříká: "Je to zápal."
Všechny snímky projdou rukama lékaře (Human-in-the-loop).

### CORS
Povol `*` nebo origin `http://localhost:3000`.

### Formát
- Všechna data vracej JSON.
- Frontend očekává přesně výše popsané struktury.
- Časová razítka v ISO 8601.
