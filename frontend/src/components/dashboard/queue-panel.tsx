import { AlertTriangle, ArrowUp, CheckCircle2, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QueueItem } from "@/lib/types";

interface Props {
  queue: QueueItem[];
  hospitalId?: string;
  onSelectScan?: (scanId: string) => void;
  selectedScanId?: string | null;
}

const statusConfig = {
  critical: {
    label: "Kritický",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "destructive" as const,
  },
  pending: {
    label: "Čeká",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "secondary" as const,
  },
  reviewed: {
    label: "Zkontrolováno",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    badge: "default" as const,
  },
};

function probColor(p: number): string {
  if (p >= 0.8) return "text-red-600";
  if (p >= 0.4) return "text-amber-600";
  return "text-emerald-600";
}

function priorityColor(score: number): string {
  if (score >= 80) return "text-red-600";
  if (score >= 50) return "text-amber-600";
  return "text-emerald-600";
}

export function QueuePanel({ queue, onSelectScan, selectedScanId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleClick = (scanId: string) => {
    if (onSelectScan) {
      onSelectScan(scanId);
    } else {
      setExpanded((prev) => (prev === scanId ? null : scanId));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Fronta snímků</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{queue.length} čeká</Badge>
          <Badge variant="secondary" className="text-[10px]">
            Priorita = AI + čas + ČHMÚ
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {queue.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Žádné snímky ve frontě
          </p>
        )}
        {/* Sorted by priority score descending */}
        {[...queue]
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .map((item) => {
            const st = statusConfig[item.status];
            const Icon = st.icon;
            const isSelected = selectedScanId === item.scanId;
            const isExpanded = expanded === item.scanId;
            return (
              <div
                key={item.scanId}
                className={`rounded-lg border mb-2 transition-all ${
                  isSelected ? "ring-2 ring-primary border-primary" : ""
                } ${st.bg}`}
              >
                <button
                  onClick={() => handleClick(item.scanId)}
                  className="flex w-full items-center gap-4 p-3 text-left"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${st.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">
                        {item.scanId}
                      </span>
                      <Badge
                        variant={st.badge}
                        className={
                          item.status === "critical"
                            ? "bg-red-500 text-black dark:bg-red-600 dark:text-white"
                            : ""
                        }
                      >
                        {st.label}
                      </Badge>
                      {item.antiStarvationBoost > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 flex items-center gap-0.5"
                        >
                          <ArrowUp className="h-2.5 w-2.5" />
                          Anti-starvation +{item.antiStarvationBoost}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pacient {item.patientId} · {item.patientAge} let ·{" "}
                      {item.patientSex === "M" ? "muž" : "žena"} · čeká{" "}
                      {item.waitTimeMinutes} min
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold text-lg ${priorityColor(item.priorityScore)}`}
                    >
                      {item.priorityScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">priorita</p>
                  </div>
                </button>

                {onSelectScan ? null : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(isExpanded ? null : item.scanId);
                      }}
                      className="flex items-center gap-1.5 w-full px-3 pb-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      {isExpanded ? "Skrýt LLM report" : "Zobrazit LLM report"}
                    </button>

                    {isExpanded && (
                      <div className="mx-3 mb-3 rounded border bg-background/80 p-3">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.llmReport}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>
                            Pravděpodobnost:{" "}
                            <span className={probColor(item.probability)}>
                              {(item.probability * 100).toFixed(0)} %
                            </span>
                          </span>
                          {item.antiStarvationBoost > 0 && (
                            <span>· Boost: +{item.antiStarvationBoost}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

        <div className="mt-3 text-[10px] text-muted-foreground">
          <p>
            Hybridní prioritizace:{" "}
            <strong>
              Priorita = AI confidence × 70 + Normalizovaný wait time × 30 +
              Anti-starvation boost
            </strong>
          </p>
          <p>
            Po nasazení backendu bude reálné vyhodnocování pouze pro{" "}
            <strong>Nemocnici Opava</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
