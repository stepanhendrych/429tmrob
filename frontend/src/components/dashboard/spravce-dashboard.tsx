import { Clock, Coffee, RotateCcw, Settings2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChmuPanel } from "@/components/dashboard/chmu-panel";
import { RedirectPanel } from "@/components/dashboard/redirect-panel";
import { RegionHeatmap } from "@/components/dashboard/region-heatmap";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/context/SettingsContext";
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
  const views = ["region", "prediction", "redirect", "stats", "settings"] as const;
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

      {view === "settings" && <SettingsPanel />}

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

function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Nastavení aplikace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Nastavení se ukládají do prohlížeče a aplikují se na všechny lékaře v kraji.
        </p>

        {/* Honeypot cooldown */}
        <div className="space-y-2">
          <label
            htmlFor="honeypot-cooldown"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            Cooldown po chybném honeypotu (s)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="honeypot-cooldown"
              type="range"
              min={1}
              max={30}
              value={settings.honeypotCooldownSeconds}
              onChange={(e) =>
                updateSettings({ honeypotCooldownSeconds: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm font-mono w-8 text-right">
              {settings.honeypotCooldownSeconds}s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Počet sekund, po které lékař nemůže odeslat hodnocení po chybném honeypotu.
          </p>
        </div>

        {/* Fatigue click threshold */}
        <div className="space-y-2">
          <label
            htmlFor="fatigue-click"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Coffee className="h-4 w-4 text-muted-foreground" />
            Práh únavy — kliky
          </label>
          <div className="flex items-center gap-3">
            <input
              id="fatigue-click"
              type="range"
              min={5}
              max={100}
              value={settings.fatigueClickThreshold}
              onChange={(e) =>
                updateSettings({ fatigueClickThreshold: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm font-mono w-8 text-right">
              {settings.fatigueClickThreshold}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Počet kliků, po kterém se zobrazí modál detekce únavy.
          </p>
        </div>

        {/* Fatigue review threshold */}
        <div className="space-y-2">
          <label
            htmlFor="fatigue-review"
            className="text-sm font-medium flex items-center gap-2"
          >
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            Práh únavy — hodnocení
          </label>
          <div className="flex items-center gap-3">
            <input
              id="fatigue-review"
              type="range"
              min={1}
              max={20}
              value={settings.fatigueReviewThreshold}
              onChange={(e) =>
                updateSettings({ fatigueReviewThreshold: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm font-mono w-8 text-right">
              {settings.fatigueReviewThreshold}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Počet odeslaných hodnocení, po kterém se zobrazí modál.
          </p>
        </div>

        {/* Fatigue modal cooldown */}
        <div className="space-y-2">
          <label
            htmlFor="fatigue-modal-cooldown"
            className="text-sm font-medium flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            Cooldown modálu únavy (s)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="fatigue-modal-cooldown"
              type="range"
              min={10}
              max={300}
              step={10}
              value={settings.fatigueModalCooldownSeconds}
              onChange={(e) =>
                updateSettings({ fatigueModalCooldownSeconds: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm font-mono w-12 text-right">
              {settings.fatigueModalCooldownSeconds}s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimální prodleva mezi jednotlivými modály únavy.
          </p>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Obnovit výchozí hodnoty
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
