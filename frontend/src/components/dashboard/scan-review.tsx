import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  HeartPulse,
  HelpCircle,
  Keyboard,
  Send,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import { submitReview } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import type { DoctorDecision, QueueItem } from "@/lib/types";

interface Props {
  scan: QueueItem;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const DECISION_BUTTONS: {
  value: "healthy" | "different" | "agreed";
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  border: string;
  key: string;
}[] = [
  {
    value: "healthy",
    label: "Vše v pořádku",
    description: "Pacient je zdravý — AI se mýlí",
    icon: HeartPulse,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-300 hover:border-emerald-500",
    key: "1",
  },
  {
    value: "different",
    label: "Něco jiného",
    description: "Nález je jiný, než AI vyhodnotila",
    icon: Activity,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 hover:border-amber-500",
    key: "2",
  },
  {
    value: "agreed",
    label: "AI má pravdu",
    description: "Souhlasím s vyhodnocením AI",
    icon: Brain,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 hover:border-blue-500",
    key: "3",
  },
];

const KEYBINDINGS = [
  { key: "←", action: "Předchozí snímek" },
  { key: "→", action: "Další snímek" },
  { key: "1", action: "Vše v pořádku" },
  { key: "2", action: "Něco jiného" },
  { key: "3", action: "AI má pravdu" },
  { key: "Ctrl+Enter", action: "Odeslat hodnocení" },
  { key: "?", action: "Zobrazit klávesové zkratky" },
  { key: "Esc", action: "Zavřít nápovědu / Zpět" },
];

function probColor(p: number): string {
  if (p >= 0.8) return "text-red-600";
  if (p >= 0.4) return "text-amber-600";
  return "text-emerald-600";
}

export function ScanReview({ scan, onBack, onNext, onPrev, hasNext, hasPrev }: Props) {
  const { addToast } = useToast();
  const [decision, setDecision] = useState<DoctorDecision>(null);
  const [doctorNote, setDoctorNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    const ok = await safeApiCall(
      () => submitReview(scan.scanId, decision, doctorNote || undefined),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "review"),
        ),
    );
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
      addToast("Hodnocení odesláno — děkujeme za zpětnou vazbu.", "success");
    }
  };

  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const onPrevRef = useRef(onPrev);
  onPrevRef.current = onPrev;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showHelp) {
        if (e.key === "Escape" || e.key === "?") {
          setShowHelp(false);
          e.preventDefault();
        }
        return;
      }
      if (submitted) {
        if (e.key === "Escape") {
          onBackRef.current();
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Escape") {
        onBackRef.current();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowLeft" && onPrevRef.current && hasPrev) {
        onPrevRef.current();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight" && onNextRef.current && hasNext) {
        onNextRef.current();
        e.preventDefault();
        return;
      }
      if (e.key === "1") {
        setDecision("healthy");
        e.preventDefault();
        return;
      }
      if (e.key === "2") {
        setDecision("different");
        e.preventDefault();
        return;
      }
      if (e.key === "3") {
        setDecision("agreed");
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submitRef.current();
        return;
      }
      if (e.key === "?") {
        setShowHelp(true);
        e.preventDefault();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showHelp, submitted, hasPrev, hasNext]);

  const DECISION_LABELS: Record<string, string> = {
    healthy: "Pacient je zdravý",
    different: "Jiný nález",
    agreed: "AI souhlasí",
  };

  const decisionKey = decision ?? "";

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="text-lg font-bold">Hodnocení odesláno</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Vaše rozhodnutí: <strong>{DECISION_LABELS[decisionKey] ?? "—"}</strong>
            {doctorNote && <> · Poznámka: {doctorNote}</>}
          </p>
          <p className="text-xs text-muted-foreground">
            Data vstupují do trénovacího pipeline modelu.
          </p>
          <div className="flex items-center justify-center gap-2">
            {onPrev && hasPrev && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                ← Předchozí
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onBack}>
              Zpět na frontu
            </Button>
            {onNext && hasNext && (
              <Button variant="outline" size="sm" onClick={onNext}>
                Další →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scan header with navigation + help */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Snímek {scan.scanId}
          </h2>
          <button
            onClick={() => setShowHelp(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md border text-xs text-muted-foreground hover:bg-muted transition-colors"
            title="Klávesové zkratky (?)"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {hasPrev && onPrev && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              ← Předchozí
            </Button>
          )}
          {hasNext && onNext && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Další →
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onBack}>
            Zpět
          </Button>
        </div>
      </div>

      {/* Patient info */}
      <p className="text-sm text-muted-foreground -mt-4">
        <User className="h-3.5 w-3.5 inline mr-1" />
        Pacient {scan.patientId} · {scan.patientAge} let ·{" "}
        {scan.patientSex === "M" ? "muž" : "žena"} ·{" "}
        {new Date(scan.submittedAt).toLocaleString("cs")}
      </p>

      {/* AI Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Vyhodnocení
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall classification */}
          <div className="flex items-center gap-3">
            {scan.status === "critical" ? (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {scan.classification ?? "NÁLEZ"}
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="flex items-center gap-1 text-xs bg-blue-600"
              >
                <CheckCircle2 className="h-3 w-3" />
                {scan.classification ?? "NORMÁLNÍ"}
              </Badge>
            )}
            <span className={`text-sm font-bold ${probColor(scan.probability)}`}>
              {(scan.probability * 100).toFixed(0)} % jistota
            </span>
          </div>

          {/* Findings list */}
          <div className="space-y-2">
            {scan.findings?.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({f.category})
                  </span>
                </div>
                <span className={probColor(f.confidence)}>
                  {(f.confidence * 100).toFixed(0)} %
                </span>
              </div>
            ))}
            {(!scan.findings || scan.findings.length === 0) && (
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Žádné specifické nálezy — model klasifikoval jako normální.
              </div>
            )}
          </div>

          {/* LLM Report */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-semibold mb-1">LLM Report:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {scan.llmReport}
            </p>
          </div>

          {/* Image placeholder */}
          <div className="rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              RTG snímek — zobrazení po napojení na PACS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {scan.scanId} · {scan.patientId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Doctor's decision */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Vaše rozhodnutí
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vyberte jednu z možností (klávesy{" "}
            <kbd className="rounded border bg-muted px-1 text-[10px]">1</kbd>{" "}
            <kbd className="rounded border bg-muted px-1 text-[10px]">2</kbd>{" "}
            <kbd className="rounded border bg-muted px-1 text-[10px]">3</kbd>):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DECISION_BUTTONS.map((btn) => {
              const selected = decision === btn.value;
              return (
                <button
                  key={btn.value}
                  onClick={() => setDecision(btn.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    selected
                      ? `${btn.border} ${btn.bg} ring-2 ring-offset-1 ${btn.color.replace("text-", "ring-")}`
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <btn.icon
                    className={`h-6 w-6 ${selected ? btn.color : "text-muted-foreground"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${selected ? "" : "text-foreground"}`}
                    >
                      {btn.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {btn.description}
                    </p>
                  </div>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {btn.key}
                  </kbd>
                </button>
              );
            })}
          </div>

          {/* Doctor note */}
          <div>
            <label
              htmlFor="doctor-note"
              className="text-sm font-medium flex items-center gap-1.5 mb-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Poznámka (volitelná)
            </label>
            <textarea
              id="doctor-note"
              ref={textareaRef}
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              placeholder="Popište svůj nález nebo doplňující informace..."
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            disabled={!decision || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>Odesílám...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Odeslat hodnocení
                <kbd className="ml-2 rounded border border-white/20 px-1.5 py-0.5 text-[10px] opacity-70">
                  Ctrl+Enter
                </kbd>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="rounded-xl border bg-background shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="font-bold flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Klávesové zkratky
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {KEYBINDINGS.map((kb) => (
                <div key={kb.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{kb.action}</span>
                  <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">
                    {kb.key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="border-t px-5 py-3 text-xs text-muted-foreground text-center">
              Stiskněte <kbd className="rounded border bg-muted px-1">?</kbd> pro
              zobrazení této nápovědy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
