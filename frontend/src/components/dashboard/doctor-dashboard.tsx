import { CheckCircle2, ClipboardList, HelpCircle, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { EthicsSummary } from "@/components/dashboard/ethics-summary";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { QueuePanel } from "@/components/dashboard/queue-panel";
import { ScanReview } from "@/components/dashboard/scan-review";
import { UtilizationBar } from "@/components/dashboard/utilization-bar";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { FatigueTracker } from "@/components/fatigue-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { getDashboard, getWeeklyStats } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import { HospitalLogoBox } from "@/lib/hospital-config";
import type { DashboardData, QueueItem, WeeklyStat } from "@/lib/types";

interface Props {
  hospitalId: string;
}

export function DoctorDashboard({ hospitalId }: Props) {
  const location = useLocation();
  const { addToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewedScans, setReviewedScans] = useState<QueueItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [inReview, setInReview] = useState(false);

  const handleScanReviewed = useCallback((scan: QueueItem) => {
    setReviewedScans((prev) => [scan, ...prev]);
    setReviewCount((c) => c + 1);
  }, []);

  useEffect(() => {
    safeApiCall(
      () =>
        getDashboard(hospitalId).then((d) => {
          setData(d);
          return d;
        }),
      (err) => {
        setError(err.message);
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, hospitalId),
        );
      },
    );
    safeApiCall(
      () =>
        getWeeklyStats(hospitalId).then((s) => {
          setWeeklyStats(s);
          return s;
        }),
      (err) => {
        addToast(
          err.message,
          "warning",
          err.action ?? getErrorAction(err.status, hospitalId),
        );
      },
    );
  }, [hospitalId, addToast]);

  const raw = location.pathname.split("/").pop() ?? "";
  const views = ["queue", "stats"] as const;
  const view = views.includes(raw as (typeof views)[number]) ? raw : "queue";

  const activeQueue = data?.queue
    ? [...data.queue]
        .filter((s) => !reviewedScans.some((r) => r.scanId === s.scanId))
        .sort((a, b) => b.priorityScore - a.priorityScore)
    : [];

  const currentScan = inReview && activeQueue.length > 0 ? activeQueue[0] : null;

  if (error && !data) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p className="text-red-500 font-semibold mb-2">Chyba načítání</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-muted-foreground py-12 text-center">Načítám data z API...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HospitalLogoBox hospital={data.hospital} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">{data.hospital.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.hospital.city} · {data.hospital.district} · {data.hospital.address}
          </p>
        </div>
      </div>

      {/* Scan review mode — system feeds scans one by one */}
      {currentScan ? (
        <ScanReview
          scan={currentScan}
          onBack={() => setInReview(false)}
          onSubmit={handleScanReviewed}
          hospitalId={hospitalId}
        />
      ) : (
        <>
          {view === "queue" && (
            <>
              {/* Auto-start button when scans are available but not reviewing */}
              {activeQueue.length > 0 && !inReview && (
                <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                  <p className="text-lg font-semibold mb-1">
                    {activeQueue.length} snímků čeká na vyhodnocení
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Systém vám bude postupně předkládat snímky k analýze.
                  </p>
                  <Button onClick={() => setInReview(true)}>Začít vyhodnocovat</Button>
                </div>
              )}

              {/* Empty state */}
              {activeQueue.length === 0 && reviewedScans.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold">Všechny snímky vyhodnoceny</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Celkem {reviewedScans.length} snímků prošlo vaším hodnocením.
                  </p>
                </div>
              )}

              <MetricsCards data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <QueuePanel queue={activeQueue} />
                </div>
                <div className="space-y-6">
                  <FatigueTracker reviewCount={reviewCount} />
                  {/* Reviewed scans */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      Vyhodnocené snímky
                      {reviewedScans.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {reviewedScans.length}
                        </Badge>
                      )}
                    </h3>
                    {reviewedScans.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Po odeslání hodnocení se snímky zobrazí zde.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                        {reviewedScans.map((s) => (
                          <div
                            key={s.scanId}
                            className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs"
                          >
                            {s.doctorDecision === "agreed" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : s.doctorDecision === "different" ? (
                              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            ) : s.doctorDecision === "healthy" ? (
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="font-mono font-medium">{s.scanId}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{s.patientId}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                              {(s.probability * 100).toFixed(0)} %
                            </span>
                            {s.honeypot && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-[9px] border-amber-300 text-amber-600 dark:text-amber-400"
                              >
                                Test
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "stats" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyChart stats={weeklyStats} />
              <div className="space-y-6">
                <UtilizationBar
                  percent={data.utilization}
                  dailyCapacity={data.hospital.dailyCapacity}
                  scansToday={data.scansToday}
                />
                <EthicsSummary />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
