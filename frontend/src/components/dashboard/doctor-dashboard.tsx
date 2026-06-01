import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { EthicsSummary } from "@/components/dashboard/ethics-summary";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { QueuePanel } from "@/components/dashboard/queue-panel";
import { ScanReview } from "@/components/dashboard/scan-review";
import { UtilizationBar } from "@/components/dashboard/utilization-bar";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
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
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

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
  const views = ["queue", "classify", "metrics", "stats"] as const;
  const view = views.includes(raw as (typeof views)[number]) ? raw : "queue";

  const sortedQueue = data?.queue
    ? [...data.queue].sort((a, b) => b.priorityScore - a.priorityScore)
    : [];

  const selectedScan = selectedScanId
    ? (sortedQueue.find((s) => s.scanId === selectedScanId) ?? null)
    : null;

  const currentIndex = selectedScan ? sortedQueue.indexOf(selectedScan) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sortedQueue.length - 1;

  const goToPrev = () => {
    if (hasPrev) setSelectedScanId(sortedQueue[currentIndex - 1]!.scanId);
  };

  const goToNext = () => {
    if (hasNext) setSelectedScanId(sortedQueue[currentIndex + 1]!.scanId);
  };

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

      {/* Scan review mode */}
      {selectedScan ? (
        <ScanReview
          scan={selectedScan}
          onBack={() => setSelectedScanId(null)}
          onNext={hasNext ? goToNext : undefined}
          onPrev={hasPrev ? goToPrev : undefined}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      ) : (
        <>
          {(view === "queue" || view === "metrics") && (
            <>
              <MetricsCards data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <QueuePanel
                    queue={data.queue}
                    onSelectScan={(scanId) => setSelectedScanId(scanId)}
                    selectedScanId={selectedScanId}
                  />
                </div>
                <div className="space-y-6">
                  {/* The old ClassifierWidget and FeedbackPanel are replaced
                      by the ScanReview flow — click a queue item to review */}
                  <div className="rounded-lg border p-5 text-center text-sm text-muted-foreground">
                    <p className="font-medium">Vyhodnocené snímky</p>
                    <p className="text-xs mt-1">
                      Klikněte na snímek ve frontě pro zobrazení AI vyhodnocení a odeslání
                      zpětné vazby.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "classify" && (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              <p className="font-medium">Klasifikátor je součástí detailu snímku</p>
              <p className="text-sm mt-1">
                Vyberte snímek z fronty pro zobrazení AI vyhodnocení.
              </p>
            </div>
          )}

          {view === "metrics" && (
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

          {view === "stats" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyChart stats={weeklyStats} />
              <UtilizationBar
                percent={data.utilization}
                dailyCapacity={data.hospital.dailyCapacity}
                scansToday={data.scansToday}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
