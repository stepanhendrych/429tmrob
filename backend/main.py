from __future__ import annotations
import base64
import binascii
import os
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv
try:
    from ultralytics import YOLO
    _HAS_YOLO = True
except ImportError:
    YOLO = None  # type: ignore
    _HAS_YOLO = False
import uvicorn

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

try:
    from groq import Groq
    _HAS_GROQ = True
except ImportError:
    Groq = None  # type: ignore
    _HAS_GROQ = False

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if _HAS_GROQ and GROQ_API_KEY else None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
MODEL_PATH = os.path.join(BASE_DIR, "ai_model.pt")

os.makedirs(UPLOADS_DIR, exist_ok=True)

def _list_images(subdir: str) -> list[str]:
    path = os.path.join(IMAGES_DIR, subdir)
    if not os.path.isdir(path):
        return []
    return sorted(
        f for f in os.listdir(path)
        if f.lower().endswith((".jpeg", ".jpg", ".png", ".webp"))
    )

TRAIN_NORMAL = _list_images("train/NORMAL")
TRAIN_PNEUMONIA = _list_images("train/PNEUMONIA")
TEST_NORMAL = _list_images("test/NORMAL")
TEST_PNEUMONIA = _list_images("test/PNEUMONIA")

ALL_NORMAL = TRAIN_NORMAL + TEST_NORMAL
ALL_PNEUMONIA = TRAIN_PNEUMONIA + TEST_PNEUMONIA

def pick_image(category: str, used: set[str] | None = None) -> str:
    pool = ALL_NORMAL if category == "NORMAL" else ALL_PNEUMONIA
    if used:
        available = [f for f in pool if f not in used]
        if available:
            pool = available
    if not pool:
        pool = ALL_NORMAL if category == "NORMAL" else ALL_PNEUMONIA
    filename = random.choice(pool)
    sub = "train" if filename in TRAIN_NORMAL or filename in TRAIN_PNEUMONIA else "test"
    return f"/static/images/{sub}/{category}/{filename}"

def decode_base64_image(data: str) -> bytes:
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data, validate=True)

def load_ai_model():
    if not _HAS_YOLO:
        raise RuntimeError("ultralytics neni nainstalovano")
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"AI model not found at {MODEL_PATH}")
    return YOLO(MODEL_PATH)

def generate_llm_report(dominant_class: str, dominant_conf: float, findings: List[Dict[str, Any]]) -> str:
    if not groq_client:
        return (
            f"AI detekovala patologii: {dominant_class} (Jistota: {round(dominant_conf * 100, 1)}%). "
            "[Groq API není nakonfigurováno - toto je fallback zpráva]."
        )
    
    findings_summary = ""
    for f in findings:
        findings_summary += f"- {f['label']} (spolehlivost detekce: {round(f['confidence'] * 100, 1)}%)\n"

    prompt = f"""Jsi medicínský AI asistent specializovaný na radiologii. Tvým úkolem je vytvořit stručný, profesionální a strukturovaný předběžný report pro ošetřujícího lékaře na základě výstupu z našeho detekčního modelu.

Výstup z počítačového vidění:
- Hlavní klasifikace snímku: {dominant_class}
- Celková jistota modelu: {round(dominant_conf * 100, 1)}%
- Detekované dílčí nálezy:
{findings_summary}

Požadavky na report:
1. Piš česky, odborně, ale stručně (max 3–4 věty).
2. Shrň lokalizované nálezy a popiš jejich závažnost (např. zda vyžadují okamžitou pozornost).
3. Na konec přidej standardní varování, že se jedná o AI asistovanou triáž a finální diagnózu musí stanovit lékař.
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Jsi zkušený radiolog a mluvíš vědecky a strukturovaně v českém jazyce."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=250
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"⚠️ Selhalo volání Groq API: {e}")
        return f"AI detekovala {dominant_class}. Generování detailního reportu pomocí LLM selhalo."

def map_yolo_results(results: list[Any]) -> Dict[str, Any]:
    if not results:
        raise ValueError("Empty inference result")
    result = results[0]
    
    if result.probs is None:
        raise ValueError("Missing probability output from model")
        
    probs = result.probs.data.tolist()
    names = result.names
    pred: Dict[str, float] = {}
    for idx, prob in enumerate(probs):
        pred[str(names[idx]).upper()] = float(prob)
        
    top_index = int(result.probs.top1)
    dominant_class = str(names[top_index]).upper()
    dominant_conf = float(result.probs.top1conf.item())
    
    rules = [
        {
            "key": "PNEUMOTHORAX",
            "label": "Pneumothorax",
            "threshold": 0.15,
            "urgent": True,
            "critical": True,
            "category": "kriticky nalez",
        },
        {
            "key": "RESP_SELHANI",
            "label": "Respiracni selhani",
            "threshold": 0.20,
            "urgent": True,
            "critical": True,
            "category": "kriticky stav",
        },
        {
            "key": "FLUID",
            "label": "Pleuralni efuze",
            "threshold": 0.35,
            "urgent": True,
            "critical": False,
            "category": "pleura",
        },
        {
            "key": "PNEUMONIA",
            "label": "Pneumonie",
            "threshold": 0.40,
            "urgent": True,
            "critical": False,
            "category": "plicni parenchym",
        },
    ]
    
    # EXTRAKCE BOUNDING BOXŮ Z YOLO MODELU
    detected_boxes = []
    if hasattr(result, "boxes") and result.boxes is not None:
        for box in result.boxes:
            coords = box.xyxy[0].tolist()  # [xmin, ymin, xmax, ymax]
            conf = float(box.conf[0].item())
            cls_id = int(box.cls[0].item())
            cls_name = str(names[cls_id]).upper()
            
            detected_boxes.append({
                "key": cls_name,
                "coords": [round(c, 1) for c in coords],
                "conf": conf
            })
            
    findings: List[Dict[str, Any]] = []
    is_urgent = False
    is_critical = False
    
    for rule in rules:
        prob = pred.get(rule["key"], 0.0)
        if prob >= rule["threshold"]:
            # Napárování krabičky na konkrétní pravidlo/nález
            matching_box = next((b["coords"] for b in detected_boxes if b["key"] == rule["key"]), None)
            
            findings.append(
                {
                    "label": rule["label"],
                    "confidence": round(prob, 4),
                    "category": rule["category"],
                    "box": matching_box,
                }
            )
            is_urgent = is_urgent or rule["urgent"]
            is_critical = is_critical or rule["critical"]
            
    if not findings:
        findings.append(
            {
                "label": "Bez zjevnych patologickych nalezenu",
                "confidence": round(dominant_conf, 4),
                "category": "celkovy obraz",
                "box": None,
            }
        )
        
    display_map = {
        "PNEUMOTHORAX": "Pneumothorax",
        "RESP_SELHANI": "Respiracni selhani",
        "FLUID": "Fluid",
        "PNEUMONIA": "Pneumonie",
        "NORMAL": "NORMALNI",
    }
    
    if dominant_class == "NORMAL":
        classification = "NORMALNI"
    else:
        classification = f"NALEZ - {display_map.get(dominant_class, 'Patologie')}"
        
    # VOLÁNÍ DYNAMICKÉHO REPORTU Z GROQ
    llm_report = generate_llm_report(dominant_class, dominant_conf, findings)
    
    return {
        "classification": classification,
        "confidence": round(dominant_conf, 4),
        "findings": findings,
        "llmReport": llm_report,
        "isUrgent": is_urgent,
        "isCritical": is_critical,
        "dominantClass": dominant_class,
    }

class Hospital(BaseModel):
    id: str
    name: str
    city: str
    district: str
    type: str
    address: str
    lat: float
    lng: float
    rtgDevices: int
    dailyCapacity: int
    utilization: int

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    hospitalId: str

class LoginRequest(BaseModel):
    hospitalId: str
    email: str

class LoginResponse(BaseModel):
    token: str
    user: User
    hospital: Hospital

class QueueItem(BaseModel):
    scanId: str
    patientId: str
    patientAge: int
    patientSex: str
    probability: float
    isUrgent: bool
    status: str
    submittedAt: str
    waitTimeMinutes: int
    priorityScore: float
    antiStarvationBoost: int
    llmReport: str
    imageUrl: str = ""

class ModelMetrics(BaseModel):
    sensitivity: float
    specificity: float
    falsePositiveRate: float
    precision: float
    accuracy: float
    f1Score: float
    truePositives: int
    falsePositives: int
    trueNegatives: int
    falseNegatives: int
    totalScans: int
    baselineAccuracy: int

class WeeklyStat(BaseModel):
    week: str
    scans: int
    urgent: int
    avgProcessingTimeMin: int

class DashboardResponse(BaseModel):
    hospital: Hospital
    queueLength: int
    urgentCount: int
    avgWaitTimeMin: int
    avgProcessingTimeMin: int
    scansToday: int
    utilization: int
    metrics: ModelMetrics
    weeklyStats: List[WeeklyStat]
    queue: List[QueueItem]

# UPRAVENÝ PYDANTIC MODEL PRO NÁLEZ S PŘIDANÝM BOXEM
class ClassificationFinding(BaseModel):
    label: str
    confidence: float
    category: str
    box: Optional[List[float]] = None  # Formát: [xmin, ymin, xmax, ymax]

class ClassificationRequest(BaseModel):
    imageBase64: str = Field(..., min_length=1)

class ClassificationResponse(BaseModel):
    scanId: str
    classification: str
    confidence: float
    findings: List[ClassificationFinding]
    llmReport: str
    imageUrl: str = ""

class FeedbackRequest(BaseModel):
    scanId: str
    confirmed: bool

class FeedbackResponse(BaseModel):
    success: bool

class MarkedPoint(BaseModel):
    x: float
    y: float

class ReviewRequest(BaseModel):
    scanId: str
    decision: str
    doctorNote: Optional[str] = None
    fractureMarkers: Optional[List[MarkedPoint]] = None

class ReviewResponse(BaseModel):
    success: bool

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    actor: str
    action: str
    target: str
    status: str

class UserRecord(BaseModel):
    id: str
    name: str
    email: str
    role: str
    hospitalId: str
    active: bool

class ModelInstance(BaseModel):
    id: str
    name: str
    version: str
    status: str
    hospitalId: Optional[str]
    lastUpdated: str

class LicenseInfo(BaseModel):
    id: str
    customer: str
    tier: str
    validUntil: str
    seats: int
    status: str

class ChmuData(BaseModel):
    pm25: int
    pm10: int
    forecast: str

class RegionDashboard(BaseModel):
    hospitals: List[Hospital]
    totalScansToday: int
    totalQueueLength: int
    avgUtilization: int
    chmuData: ChmuData
    upcomingEvents: List[str]
    alert: str

class RedirectSuggestion(BaseModel):
    fromHospitalId: str
    toHospitalId: str
    reason: str
    suggestedCapacity: int
    action: str

def utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat()

def compute_anti_starvation_boost(wait_minutes: int) -> int:
    if wait_minutes < 15:
        return 0
    if wait_minutes < 30:
        return 15
    if wait_minutes < 45:
        return 25
    return 35

def compute_priority_score(
    ai_confidence: float,
    wait_minutes: int,
    is_critical: bool,
) -> float:
    normalized_wait_time = min(wait_minutes / 60.0, 1.0)
    anti_starvation_boost = compute_anti_starvation_boost(wait_minutes)
    score = (ai_confidence * 70.0) + (normalized_wait_time * 30.0) + anti_starvation_boost
    if is_critical:
        score += 25.0
    return round(score, 2)

def build_queue_item(
    scan_id: str,
    patient_id: str,
    patient_age: int,
    patient_sex: str,
    submitted_at: str,
    wait_minutes: int,
    scenario: Dict[str, Any],
    image_url: str = "",
) -> Dict[str, Any]:
    anti_starvation_boost = compute_anti_starvation_boost(wait_minutes)
    priority_score = compute_priority_score(
        scenario["confidence"], wait_minutes, scenario["isCritical"],
    )
    return {
        "scanId": scan_id,
        "patientId": patient_id,
        "patientAge": patient_age,
        "patientSex": patient_sex,
        "probability": scenario["confidence"],
        "isUrgent": scenario["isUrgent"],
        "status": "critical" if scenario["isUrgent"] else "normal",
        "submittedAt": submitted_at,
        "waitTimeMinutes": wait_minutes,
        "priorityScore": priority_score,
        "antiStarvationBoost": anti_starvation_boost,
        "llmReport": scenario["llmReport"],
        "imageUrl": image_url,
        "_aiConfidence": scenario["confidence"],
        "_isCritical": scenario["isCritical"],
    }

def recalculate_opava_queue(queue: List[Dict[str, Any]]) -> None:
    now = datetime.utcnow()
    for item in queue:
        try:
            submitted_at = datetime.fromisoformat(item["submittedAt"])
        except ValueError:
            submitted_at = now
        item["submittedAt"] = utc_now_iso()
        wait_minutes = max(int((now - submitted_at).total_seconds() // 60), 0)
        item["waitTimeMinutes"] = wait_minutes
        item["antiStarvationBoost"] = compute_anti_starvation_boost(wait_minutes)
        item["priorityScore"] = compute_priority_score(
            item.get("_aiConfidence", 0.0),
            wait_minutes,
            item.get("_isCritical", False),
        )
    queue.sort(key=lambda entry: entry["priorityScore"], reverse=True)

def queue_response(queue: List[Dict[str, Any]]) -> List[QueueItem]:
    response_items: List[QueueItem] = []
    for item in queue:
        response_items.append(
            QueueItem(
                scanId=item["scanId"],
                patientId=item["patientId"],
                patientAge=item["patientAge"],
                patientSex=item["patientSex"],
                probability=item["probability"],
                isUrgent=item["isUrgent"],
                status=item["status"],
                submittedAt=item["submittedAt"],
                waitTimeMinutes=item["waitTimeMinutes"],
                priorityScore=item["priorityScore"],
                antiStarvationBoost=item["antiStarvationBoost"],
                llmReport=item["llmReport"],
                imageUrl=item.get("imageUrl", ""),
            )
        )
    return response_items

def compute_metrics(queue: List[Dict[str, Any]]) -> ModelMetrics:
    queue_length = len(queue)
    urgent_count = sum(1 for item in queue if item["isUrgent"])
    total_scans = 170 + queue_length * 2
    true_positives = 82 + urgent_count
    false_positives = 12 + max(queue_length - urgent_count, 0)
    true_negatives = 68 + (queue_length // 2)
    false_negatives = 8
    accuracy = round((true_positives + true_negatives) / max(total_scans, 1), 2)
    precision = round(true_positives / max(true_positives + false_positives, 1), 2)
    sensitivity = 0.91
    specificity = 0.84
    f1_score = round(
        2 * (precision * sensitivity) / max(precision + sensitivity, 0.01), 2
    )
    return ModelMetrics(
        sensitivity=sensitivity,
        specificity=specificity,
        falsePositiveRate=round(1 - specificity, 2),
        precision=precision,
        accuracy=accuracy,
        f1Score=f1_score,
        truePositives=true_positives,
        falsePositives=false_positives,
        trueNegatives=true_negatives,
        falseNegatives=false_negatives,
        totalScans=total_scans,
        baselineAccuracy=62,
    )

def compute_weekly_stats(queue: List[Dict[str, Any]]) -> List[WeeklyStat]:
    total = len(queue)
    urgent_count = sum(1 for item in queue if item["isUrgent"])
    weeks = ["19. tyd", "20. tyd", "21. tyd", "22. tyd", "23. tyd"]
    n = len(weeks)
    urgent_ratio = urgent_count / total if total > 0 else 0.2

    raw = [max(1, round((total / n) * f)) for f in [0.85, 0.92, 0.98, 1.05, 1.12]]
    scans = list(raw)
    diff = total - sum(scans)
    i = 0
    while diff != 0:
        if diff > 0:
            scans[i % n] += 1
            diff -= 1
        elif diff < 0 and scans[i % n] > 1:
            scans[i % n] -= 1
            diff += 1
        i += 1

    urgent_vals = [max(0, round(s * urgent_ratio)) for s in scans]
    udiff = urgent_count - sum(urgent_vals)
    j = 0
    while udiff != 0:
        if udiff > 0:
            urgent_vals[j % n] += 1
            udiff -= 1
        elif udiff < 0 and urgent_vals[j % n] > 0:
            urgent_vals[j % n] -= 1
            udiff += 1
        j += 1

    return [
        WeeklyStat(
            week=week,
            scans=scans[i],
            urgent=urgent_vals[i],
            avgProcessingTimeMin=max(10, 30 - i * 2),
        )
        for i, week in enumerate(weeks)
    ]

HOSPITALS: List[Hospital] = [
    Hospital(
        id="nem-opava",
        name="Slezska nemocnice v Opave",
        city="Opava",
        district="Opava",
        type="krajska",
        address="Olomoucka 86, Opava",
        lat=49.938,
        lng=17.902,
        rtgDevices=3,
        dailyCapacity=820,
        utilization=92,
    ),
    Hospital(
        id="fn-ostrava",
        name="Fakultni nemocnice Ostrava",
        city="Ostrava",
        district="Ostrava-mesto",
        type="fakultni",
        address="17. listopadu 1790, Ostrava-Poruba",
        lat=49.837,
        lng=18.173,
        rtgDevices=4,
        dailyCapacity=300,
        utilization=87,
    ),
]

HOSPITAL_BY_ID: Dict[str, Hospital] = {hospital.id: hospital for hospital in HOSPITALS}

GOLDEN_QUEUE: List[QueueItem] = [
    QueueItem(
        scanId="X-1024",
        patientId="P-4531",
        patientAge=67,
        patientSex="M",
        probability=0.92,
        isUrgent=True,
        status="critical",
        submittedAt="2026-06-01T08:12:00",
        waitTimeMinutes=5,
        priorityScore=89.0,
        antiStarvationBoost=35,
        llmReport=(
            "Detekovan vzorec odpovidajici akutnimu pneumothoraxu s 92 % jistotou. "
            "AI doporucuje okamzite klinicke zhodnoceni lekarem."
        ),
        imageUrl=pick_image("PNEUMONIA"),
    ),
    QueueItem(
        scanId="X-1041",
        patientId="P-3329",
        patientAge=54,
        patientSex="Z",
        probability=0.83,
        isUrgent=False,
        status="normal",
        submittedAt="2026-06-01T08:20:00",
        waitTimeMinutes=3,
        priorityScore=71.5,
        antiStarvationBoost=0,
        llmReport=(
            "Detekovan vzorec odpovidajici bakterialni pneumonii s 83 % jistotou. "
            "Doporuceno overeni lekarem."
        ),
        imageUrl=pick_image("PNEUMONIA"),
    ),
    QueueItem(
        scanId="X-1055",
        patientId="P-7794",
        patientAge=39,
        patientSex="M",
        probability=0.9,
        isUrgent=True,
        status="critical",
        submittedAt="2026-06-01T08:05:00",
        waitTimeMinutes=7,
        priorityScore=90.0,
        antiStarvationBoost=35,
        llmReport=(
            "Detekovan obraz odpovidajici fluidothoraxu s 90 % jistotou. "
            "Nutne rychle klinicke zhodnoceni."
        ),
        imageUrl=pick_image("PNEUMONIA"),
    ),
    QueueItem(
        scanId="X-1062",
        patientId="P-8841",
        patientAge=72,
        patientSex="Z",
        probability=0.88,
        isUrgent=False,
        status="normal",
        submittedAt="2026-06-01T08:30:00",
        waitTimeMinutes=1,
        priorityScore=68.4,
        antiStarvationBoost=0,
        llmReport="Bez zjevnych patologickych nalezu. AI doporucuje standardni revizi.",
        imageUrl=pick_image("NORMAL"),
    ),
]

GOLDEN_METRICS = ModelMetrics(
    sensitivity=0.91,
    specificity=0.84,
    falsePositiveRate=0.16,
    precision=0.87,
    accuracy=0.88,
    f1Score=0.89,
    truePositives=86,
    falsePositives=13,
    trueNegatives=69,
    falseNegatives=9,
    totalScans=177,
    baselineAccuracy=62,
)

GOLDEN_WEEKLY_STATS = [
    WeeklyStat(week="17. tyd", scans=172, urgent=38, avgProcessingTimeMin=26),
    WeeklyStat(week="18. tyd", scans=189, urgent=41, avgProcessingTimeMin=27),
    WeeklyStat(week="19. tyd", scans=185, urgent=42, avgProcessingTimeMin=28),
]

AI_MOCK_RESULTS: List[Dict[str, Any]] = [
    {
        "classification": "NORMALNI",
        "confidence": 0.9,
        "findings": [
            {
                "label": "Bez patrnych infiltratu, pleura hladka, bez tekutiny",
                "confidence": 0.9,
                "category": "celkovy obraz",
                "box": None,
            }
        ],
        "llmReport": (
            "Snimek je bez zjevnych patologickych zmen. AI detekovala normalni obraz "
            "s 90 % jistotou and doporucuje standardni overeni lekarem."
        ),
        "isCritical": False,
        "isUrgent": False,
    },
    {
        "classification": "NORMALNI",
        "confidence": 0.86,
        "findings": [
            {
                "label": "Plice vzdusne, srdecni stin v norme",
                "confidence": 0.86,
                "category": "celkovy obraz",
                "box": None,
            }
        ],
        "llmReport": (
            "Detekovan normalni RTG obraz s 86 % jistotou. "
            "AI nenahrazuje diagnozu, doporuceno potvrdit lekarem."
        ),
        "isCritical": False,
        "isUrgent": False,
    },
    {
        "classification": "NALEZ - Pneumonie",
        "confidence": 0.82,
        "findings": [
            {
                "label": "Infiltrace v pravem dolnim laloku",
                "confidence": 0.82,
                "category": "plicni parenchym",
                "box": [210.0, 450.0, 480.0, 720.0],  # Mock box pro predem nahrana data
            }
        ],
        "llmReport": (
            "Detekovan vzorec odpovidajici bakterialni pneumonii s 82 % jistotou. "
            "AI doporucuje klinicke zhodnoceni lekarem."
        ),
        "isCritical": False,
        "isUrgent": False,
    },
    {
        "classification": "NALEZ - Pneumonie",
        "confidence": 0.78,
        "findings": [
            {
                "label": "Difuzni opacity v leve strednim laloku",
                "confidence": 0.78,
                "category": "plicni parenchym",
                "box": [500.0, 380.0, 780.0, 610.0],
            }
        ],
        "llmReport": (
            "AI detekovala obraz odpovidajici pneumonii s 78 % jistotou. "
            "Doporuceno potvrdit lekarem."
        ),
        "isCritical": False,
        "isUrgent": False,
    },
    {
        "classification": "NALEZ - Pneumonie",
        "confidence": 0.87,
        "findings": [
            {
                "label": "Segmentalni infiltraty v pravem hornim laloku",
                "confidence": 0.87,
                "category": "plicni parenchym",
                "box": [180.0, 200.0, 420.0, 430.0],
            }
        ],
        "llmReport": (
            "Detekovan vzorec odpovidajici pneumonii s 87 % jistotou. "
            "AI doporucuje klinicke zhodnoceni."
        ),
        "isCritical": False,
        "isUrgent": False,
    },
    {
        "classification": "NALEZ - Pneumothorax",
        "confidence": 0.95,
        "findings": [
            {
                "label": "Kolaps prave plice, posun mediastina",
                "confidence": 0.95,
                "category": "kriticky nalez",
                "box": [50.0, 150.0, 350.0, 800.0],
            }
        ],
        "llmReport": (
            "Detekovan obraz odpovidajici akutnimu pneumothoraxu s 95 % jistotou. "
            "AI doporucuje okamzite klinicke zhodnoceni."
        ),
        "isCritical": True,
        "isUrgent": True,
    },
    {
        "classification": "NALEZ - Pneumothorax",
        "confidence": 0.92,
        "findings": [
            {
                "label": "Kolaps leve plice s hypertransparentnim polem",
                "confidence": 0.92,
                "category": "kriticky nalez",
                "box": [600.0, 120.0, 920.0, 750.0],
            }
        ],
        "llmReport": (
            "AI detekovala pneumothorax s 92 % jistotou. "
            "Nutne rychle posouzeni lekarem."
        ),
        "isCritical": True,
        "isUrgent": True,
    },
    {
        "classification": "NALEZ - Fluid",
        "confidence": 0.9,
        "findings": [
            {
                "label": "Volna tekutina v pravem kostofrenickem uhlu",
                "confidence": 0.9,
                "category": "pleura",
                "box": [80.0, 700.0, 390.0, 910.0],
            }
        ],
        "llmReport": (
            "Detekovan obraz odpovidajici fluidothoraxu s 90 % jistotou. "
            "AI doporucuje akutni zhodnoceni."
        ),
        "isCritical": True,
        "isUrgent": True,
    },
    {
        "classification": "NALEZ - Fluid",
        "confidence": 0.88,
        "findings": [
            {
                "label": "Tekutina v levem kostofrenickem uhlu",
                "confidence": 0.88,
                "category": "pleura",
                "box": [580.0, 680.0, 900.0, 890.0],
            }
        ],
        "llmReport": (
            "AI detekovala fluidothorax s 88 % jistotou. "
            "Doporuceno rychle klinicke posouzeni."
        ),
        "isCritical": True,
        "isUrgent": True,
    },
    {
        "classification": "NALEZ - Respiracni selhani",
        "confidence": 0.9,
        "findings": [
            {
                "label": "Difuzni bilateralni opacity s hrozicim resp. selhanim",
                "confidence": 0.9,
                "category": "kriticky stav",
                "box": [150.0, 250.0, 850.0, 800.0],
            }
        ],
        "llmReport": (
            "Detekovan obraz odpovidajici respiracnimu selhani s 90 % jistotou. "
            "AI doporucuje okamzite klinicke zhodnoceni."
        ),
        "isCritical": False,
        "isUrgent": True,
    },
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/images", StaticFiles(directory=IMAGES_DIR), name="dataset_images")
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.middleware("http")
async def allow_large_json_bodies(request: Request, call_next):
    body = await request.body()
    request._body = body
    return await call_next(request)

@app.on_event("startup")
def startup_state() -> None:
    now = datetime.utcnow().replace(microsecond=0)
    used_images: set[str] = set()
    app.state.used_images = used_images
    
    try:
        app.state.model = load_ai_model()
    except Exception as e:
        print(f"⚠️ Model se nenasel, bezime bez nej: {e}")
        app.state.model = None

    normal_scenarios = [AI_MOCK_RESULTS[0], AI_MOCK_RESULTS[1]]
    pneumonia_scenarios = AI_MOCK_RESULTS[2:]
    app.state.opava_queue = []
    counter = 0
    for img in ALL_NORMAL:
        sub = "train" if img in TRAIN_NORMAL else "test"
        scenario = normal_scenarios[counter % len(normal_scenarios)]
        app.state.opava_queue.append(
            build_queue_item(
                scan_id=f"X-{5521 + counter}",
                patient_id=f"P-{1000 + counter}",
                patient_age=random.randint(20, 85),
                patient_sex=random.choice(["M", "Z"]),
                submitted_at=(now - timedelta(minutes=random.randint(0, 120))).isoformat(),
                wait_minutes=random.randint(0, 120),
                scenario=scenario,
                image_url=f"/static/images/{sub}/NORMAL/{img}",
            )
        )
        counter += 1
    for img in ALL_PNEUMONIA:
        sub = "train" if img in TRAIN_PNEUMONIA else "test"
        scenario = pneumonia_scenarios[counter % len(pneumonia_scenarios)]
        app.state.opava_queue.append(
            build_queue_item(
                scan_id=f"X-{5521 + counter}",
                patient_id=f"P-{2000 + counter}",
                patient_age=random.randint(20, 85),
                patient_sex=random.choice(["M", "Z"]),
                submitted_at=(now - timedelta(minutes=random.randint(0, 120))).isoformat(),
                wait_minutes=random.randint(0, 120),
                scenario=scenario,
                image_url=f"/static/images/{sub}/PNEUMONIA/{img}",
            )
        )
        counter += 1
    recalculate_opava_queue(app.state.opava_queue)

def get_hospital_or_404(hospital_id: str) -> Hospital:
    hospital = HOSPITAL_BY_ID.get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@app.get("/v1/hospitals", response_model=List[Hospital])
def list_hospitals() -> List[Hospital]:
    return HOSPITALS

@app.get("/v1/hospitals/{hospital_id}", response_model=Hospital)
def get_hospital(hospital_id: str) -> Hospital:
    return get_hospital_or_404(hospital_id)

@app.get("/v1/hospitals/{hospital_id}/users", response_model=List[User])
def list_hospital_users(hospital_id: str) -> List[User]:
    hospital = get_hospital_or_404(hospital_id)
    return [
        User(
            id="u1",
            name="MUDr. Jana Novakova",
            email="jana.novakova@fn-ostrava.cz",
            role="doctor",
            hospitalId=hospital.id,
        ),
        User(
            id="u2",
            name="MUDr. Petr Holik",
            email="petr.holik@hospital.cz",
            role="radiologist",
            hospitalId=hospital.id,
        ),
        User(
            id="u12",
            name="Ing. Tomas Riha",
            email="tomas.riha@nem-opava.cz",
            role="it_admin",
            hospitalId=hospital.id,
        ),
        User(
            id="u13",
            name="MUDr. Helena Brozova, MBA",
            email="helena.brozova@nem-opava.cz",
            role="reditel",
            hospitalId=hospital.id,
        ),
    ]

@app.post("/v1/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    hospital = get_hospital_or_404(payload.hospitalId)
    user_map = {
        "jana.novakova@fn-ostrava.cz": {"name": "MUDr. Jana Novakova", "role": "doctor"},
        "petr.holik@hospital.cz": {"name": "MUDr. Petr Holik", "role": "radiologist"},
        "tomas.riha@nem-opava.cz": {"name": "Ing. Tomas Riha", "role": "it_admin"},
        "helena.brozova@nem-opava.cz": {"name": "MUDr. Helena Brozova, MBA", "role": "reditel"},
    }
    entry = user_map.get(payload.email, {"name": "MUDr. Jan Novak", "role": "doctor"})
    user = User(
        id="u1",
        name=entry["name"],
        email=payload.email,
        role=entry["role"],
        hospitalId=payload.hospitalId,
    )
    return LoginResponse(token="jwt-token", user=user, hospital=hospital)

@app.get("/v1/hospitals/{hospital_id}/queue", response_model=List[QueueItem])
def get_queue(hospital_id: str) -> List[QueueItem]:
    get_hospital_or_404(hospital_id)
    if hospital_id != "nem-opava":
        return GOLDEN_QUEUE
    recalculate_opava_queue(app.state.opava_queue)
    return queue_response(app.state.opava_queue)

@app.get("/v1/hospitals/{hospital_id}/metrics", response_model=ModelMetrics)
def get_metrics(hospital_id: str) -> ModelMetrics:
    get_hospital_or_404(hospital_id)
    if hospital_id != "nem-opava":
        return GOLDEN_METRICS
    recalculate_opava_queue(app.state.opava_queue)
    return compute_metrics(app.state.opava_queue)

@app.get("/v1/hospitals/{hospital_id}/weekly-stats", response_model=List[WeeklyStat])
def get_weekly_stats(hospital_id: str) -> List[WeeklyStat]:
    get_hospital_or_404(hospital_id)
    if hospital_id != "nem-opava":
        return GOLDEN_WEEKLY_STATS
    recalculate_opava_queue(app.state.opava_queue)
    return compute_weekly_stats(app.state.opava_queue)

@app.get("/v1/hospitals/{hospital_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(hospital_id: str) -> DashboardResponse:
    hospital = get_hospital_or_404(hospital_id)
    if hospital_id != "nem-opava":
        queue = GOLDEN_QUEUE
        queue_length = len(queue)
        urgent_count = sum(1 for item in queue if item.isUrgent)
        avg_wait = int(sum(item.waitTimeMinutes for item in queue) / max(queue_length, 1))
        return DashboardResponse(
            hospital=hospital,
            queueLength=queue_length,
            urgentCount=urgent_count,
            avgWaitTimeMin=avg_wait,
            avgProcessingTimeMin=20,
            scansToday=42,
            utilization=hospital.utilization,
            metrics=GOLDEN_METRICS,
            weeklyStats=GOLDEN_WEEKLY_STATS,
            queue=queue,
        )
    recalculate_opava_queue(app.state.opava_queue)
    queue_items = queue_response(app.state.opava_queue)
    queue_length = len(queue_items)
    urgent_count = sum(1 for item in queue_items if item.isUrgent)
    avg_wait = int(
        sum(item.waitTimeMinutes for item in queue_items) / max(queue_length, 1)
    )
    scans_today = 55 + queue_length
    return DashboardResponse(
        hospital=hospital,
        queueLength=queue_length,
        urgentCount=urgent_count,
        avgWaitTimeMin=avg_wait,
        avgProcessingTimeMin=22,
        scansToday=scans_today,
        utilization=hospital.utilization,
        metrics=compute_metrics(app.state.opava_queue),
        weeklyStats=compute_weekly_stats(app.state.opava_queue),
        queue=queue_items,
    )

@app.post("/v1/hospitals/{hospital_id}/classify", response_model=ClassificationResponse)
def classify_scan(
    hospital_id: str,
    payload: ClassificationRequest = Body(...),
) -> ClassificationResponse:
    get_hospital_or_404(hospital_id)
    if hospital_id != "nem-opava":
        raise HTTPException(status_code=403, detail="Classification enabled only for nem-opava")
        
    scan_id = f"X-{random.randint(1000, 9999)}"
    patient_id = f"P-{random.randint(1000, 9999)}"
    patient_age = random.randint(20, 85)
    patient_sex = random.choice(["M", "Z"])
    submitted_at = utc_now_iso()
    
    image_url = ""
    try:
        image_data = decode_base64_image(payload.imageBase64)
        filename = f"{scan_id}.jpeg"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(image_data)
        image_url = f"/static/uploads/{filename}"
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="Invalid imageBase64 payload") from exc
        
    try:
        if app.state.model is not None:
            results = app.state.model.predict(source=filepath, conf=0.25, verbose=False)
            scenario = map_yolo_results(results)
        else:
            # Fallback pokud YOLO model neni zaveden (vytahne nahodny mock vysledek z listu)
            scenario = random.choice(AI_MOCK_RESULTS)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="AI model inference failed") from exc
        
    category = "NORMAL" if scenario["dominantClass"] == "NORMAL" else "PNEUMONIA"
    used_images = getattr(app.state, "used_images", set())
    dataset_image_url = pick_image(category, used_images)
    if dataset_image_url:
        used_images.add(dataset_image_url.split("/")[-1])
        
    new_item = build_queue_item(
        scan_id=scan_id,
        patient_id=patient_id,
        patient_age=patient_age,
        patient_sex=patient_sex,
        submitted_at=submitted_at,
        wait_minutes=0,
        scenario=scenario,
        image_url=image_url or dataset_image_url,
    )
    app.state.opava_queue.append(new_item)
    recalculate_opava_queue(app.state.opava_queue)
    
    findings = [ClassificationFinding(**finding) for finding in scenario["findings"]]
    return ClassificationResponse(
        scanId=scan_id,
        classification=scenario["classification"],
        confidence=scenario["confidence"],
        findings=findings,
        llmReport=scenario["llmReport"],
        imageUrl=image_url or dataset_image_url,
    )

@app.post("/v1/hospitals/{hospital_id}/review", response_model=ReviewResponse)
def submit_review(hospital_id: str, payload: ReviewRequest) -> ReviewResponse:
    get_hospital_or_404(hospital_id)
    marker_count = len(payload.fractureMarkers) if payload.fractureMarkers else 0
    print(
        "Review: Snimek", payload.scanId, "rozhodnuti", payload.decision,
        "poznamka", payload.doctorNote or "-", "markeru", marker_count,
    )
    return ReviewResponse(success=True)

@app.post("/v1/hospitals/{hospital_id}/feedback", response_model=FeedbackResponse)
def send_feedback(hospital_id: str, payload: FeedbackRequest) -> FeedbackResponse:
    get_hospital_or_404(hospital_id)
    status = "validovan" if payload.confirmed else "vyvracen"
    print(
        "Fly-wheel: Snimek", payload.scanId, status, "lekarum. Ukladam do pipeline pro retraining...",
    )
    return FeedbackResponse(success=True)

@app.get("/v1/admin/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs() -> List[AuditLogEntry]:
    return [
        AuditLogEntry(
            id="log-001",
            timestamp="2026-06-01T07:45:00",
            actor="system",
            action="MODEL_REFRESH",
            target="model-v2.1",
            status="ok",
        ),
        AuditLogEntry(
            id="log-002",
            timestamp="2026-06-01T08:10:00",
            actor="admin",
            action="USER_LOGIN",
            target="u1",
            status="ok",
        ),
    ]

@app.get("/v1/admin/users", response_model=List[UserRecord])
def get_admin_users() -> List[UserRecord]:
    return [
        UserRecord(
            id="u1",
            name="MUDr. Jana Novakova",
            email="jana.novakova@fn-ostrava.cz",
            role="doctor",
            hospitalId="fn-ostrava",
            active=True,
        ),
        UserRecord(
            id="u2",
            name="MUDr. Petr Holik",
            email="petr.holik@nem-opava.cz",
            role="radiologist",
            hospitalId="nem-opava",
            active=True,
        ),
    ]

@app.get("/v1/admin/models", response_model=List[ModelInstance])
def get_admin_models() -> List[ModelInstance]:
    return [
        ModelInstance(
            id="model-01",
            name="CXAI",
            version="2.1",
            status="online",
            hospitalId="nem-opava",
            lastUpdated="2026-06-01T06:00:00",
        ),
        ModelInstance(
            id="model-02",
            name="CXAI",
            version="2.0",
            status="standby",
            hospitalId="fn-ostrava",
            lastUpdated="2026-05-28T12:00:00",
        ),
    ]

@app.get("/v1/admin/licenses", response_model=List[LicenseInfo])
def get_admin_licenses() -> List[LicenseInfo]:
    return [
        LicenseInfo(
            id="lic-01",
            customer="Moravskoslezsky kraj",
            tier="enterprise",
            validUntil="2027-06-01",
            seats=120,
            status="active",
        )
    ]

@app.get("/region/chmu", response_model=ChmuData)
@app.get("/v1/region/chmu", response_model=ChmuData)
def get_chmu_data() -> ChmuData:
    return ChmuData(
        pm25=62,
        pm10=71,
        forecast="Smogova situace, zvyseny napor respiracnich potizi.",
    )

@app.get("/region/dashboard", response_model=RegionDashboard)
@app.get("/v1/region/dashboard", response_model=RegionDashboard)
def get_region_dashboard() -> RegionDashboard:
    hospitals = HOSPITALS
    total_scans = 42 + 55
    total_queue_length = len(GOLDEN_QUEUE) + len(app.state.opava_queue)
    avg_utilization = int(sum(h.utilization for h in hospitals) / len(hospitals))
    chmu_data = get_chmu_data()
    return RegionDashboard(
        hospitals=hospitals,
        totalScansToday=total_scans,
        totalQueueLength=total_queue_length,
        avgUtilization=avg_utilization,
        chmuData=chmu_data,
        upcomingEvents=[
            "Kontrolni RTG kampan - cerven 2026",
            "Koordinacni porada radiologu",
        ],
        alert="Smogova situace: doporuceno prelozit neurgentni vysetreni.",
    )

@app.get("/region/redirects", response_model=List[RedirectSuggestion])
@app.get("/v1/region/redirects", response_model=List[RedirectSuggestion])
def get_region_redirects() -> List[RedirectSuggestion]:
    return [
        RedirectSuggestion(
            fromHospitalId="nem-opava",
            toHospitalId="fn-ostrava",
            reason="Opava nad kapacitou, smogovy napor.",
            suggestedCapacity=40,
            action="Prelozit planovane kontroly",
        )
    ]

@app.get("/v1/images/dataset")
def list_dataset_images() -> dict:
    return {
        "train_normal": len(TRAIN_NORMAL),
        "train_pneumonia": len(TRAIN_PNEUMONIA),
        "test_normal": len(TEST_NORMAL),
        "test_pneumonia": len(TEST_PNEUMONIA),
        "total": len(TRAIN_NORMAL) + len(TRAIN_PNEUMONIA) + len(TEST_NORMAL) + len(TEST_PNEUMONIA),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)