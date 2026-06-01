import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChmuPanel } from "@/components/dashboard/chmu-panel";
import { RedirectPanel } from "@/components/dashboard/redirect-panel";
import { RegionHeatmap } from "@/components/dashboard/region-heatmap";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { useToast } from "@/context/ToastContext";
import {
  getChmuData,
  getRedirectSuggestions,
  getRegionDashboard,
  getWeeklyStats,
} from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import { HospitalLogoBox } from "@/lib/hospital-config";
import type {
  ChmuData,
  RedirectSuggestion,
  RegionDashboard,
  WeeklyStat,
} from "@/lib/types";

export function SpravceDashboard() {
  const location = useLocation();
  const { addToast } = useToast();
  const [region, setRegion] = useState<RegionDashboard | null>(null);
  const [chmu, setChmu] = useState<ChmuData | null>(null);
  const [redirects, setRedirects] = useState<RedirectSuggestion[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);

  useEffect(() => {
    safeApiCall(
      () =>
        getRegionDashboard().then((d) => {
          setRegion(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "spravce/region-dashboard"),
        ),
    );
    getChmuData().then(setChmu);
    getRedirectSuggestions().then(setRedirects);
    getWeeklyStats("fn-ostrava").then(setWeeklyStats);
  }, [addToast]);

  const raw = location.pathname.split("/").pop() ?? "";
  const views = ["region", "prediction", "redirect", "stats"] as const;
  const view = views.includes(raw as (typeof views)[number]) ? raw : "region";

  if (!region) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Načítám krajský dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HospitalLogoBox hospital={region.hospitals[0]} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">Správa Moravskoslezského kraje</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {region.hospitals.length} pracovišť · {region.totalScansToday} snímků dnes ·{" "}
            {region.totalQueueLength} ve frontě · průměrné vytížení{" "}
            {region.avgUtilization} %
          </p>
        </div>
      </div>

      {(view === "region" || view === "prediction") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RegionHeatmap hospitals={region.hospitals} />
          </div>
          <ChmuPanel data={chmu} />
        </div>
      )}

      {view === "prediction" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyChart stats={weeklyStats} />
          <ChmuPanel data={chmu} />
        </div>
      )}

      {view === "redirect" && (
        <RedirectPanel suggestions={redirects} hospitals={region.hospitals} />
      )}

      {view === "stats" && <WeeklyChart stats={weeklyStats} />}

      {view === "region" && (
        <>
          <RedirectPanel suggestions={redirects} hospitals={region.hospitals} />
          <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
            <p className="font-semibold text-foreground">Algoritmická transparentnost</p>
            <p>
              Každé rozhodnutí o přesměrování bere v úvahu: aktuální vytížení pracoviště,
              dojezdovou vzdálenost pacienta a predikci zátěže z ČHMÚ.
            </p>
            <p>
              Systém negarantuje „nejrychlejší", ale „nejvhodnější" nemocnici s ohledem na
              fair distribution zátěže.
            </p>
            <p className="mt-2 text-[10px]">
              Zdroj dat ČHMÚ: Ostrava-Radvanice · PM2.5/PM10 · Data se aktualizují každou
              hodinu
            </p>
          </div>
        </>
      )}
    </div>
  );
}
