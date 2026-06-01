import { Activity, Cpu, TrendingDown, TrendingUp, Wrench, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import { getHospitalComparison } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import type { HospitalComparison } from "@/lib/types";

function accuracyColor(a: number): string {
  if (a >= 0.88) return "text-emerald-600";
  if (a >= 0.8) return "text-amber-600";
  return "text-red-600";
}

function deviceAgeColor(years: number): string {
  if (years <= 5) return "text-emerald-600";
  if (years <= 9) return "text-amber-600";
  return "text-red-600";
}

function maintColor(s: string): string {
  if (s === "good")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
  if (s === "fair")
    return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
}

export function DirectorDashboard() {
  const { addToast } = useToast();
  const [comparison, setComparison] = useState<HospitalComparison | null>(null);

  useEffect(() => {
    safeApiCall(
      () =>
        getHospitalComparison().then((d) => {
          setComparison(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "reditel/srovnani"),
        ),
    );
  }, [addToast]);

  if (!comparison) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Načítám srovnání nemocnic...
      </div>
    );
  }

  const accuracyData = comparison.hospitals.map((h) => ({
    name: h.hospitalName.split(" ").pop(),
    fullName: h.hospitalName,
    accuracy: +(h.metrics.accuracy * 100).toFixed(1),
    sensitivity: +(h.metrics.sensitivity * 100).toFixed(1),
    age: h.deviceInfo.ageYears,
    scans: Math.round(h.scansProcessed / 1000),
  }));

  const sortedByAge = [...comparison.hospitals].sort(
    (a, b) => a.deviceInfo.ageYears - b.deviceInfo.ageYears,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mezinemocniční srovnání</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {comparison.hospitals.length} pracovišť · průměrná přesnost{" "}
          {(comparison.avgAccuracy * 100).toFixed(1)} % · nejnovější zařízení:{" "}
          {comparison.bestDevice} · nejstarší: {comparison.worstDevice}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              Průměrná přesnost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(comparison.avgAccuracy * 100).toFixed(1)} %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Nejlepší zařízení
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold text-emerald-600">
            {comparison.bestDevice}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              Nejstarší zařízení
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold text-red-600">
            {comparison.worstDevice}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              AI aktivní
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="bg-emerald-600">
              Nemocnice Opava
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Accuracy vs Device Age */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Přesnost modelu vs. stáří přístroje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="age"
                  name="Stáří (roky)"
                  unit=" let"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  dataKey="accuracy"
                  name="Přesnost (%)"
                  unit=" %"
                  domain={[60, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <ZAxis dataKey="scans" name="Snímky (tis.)" range={[60, 400]} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "accuracy") return [`${value} %`, "Přesnost"];
                    if (name === "age") return [`${value} let`, "Stáří"];
                    return [value, name];
                  }}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Scatter
                  data={accuracyData}
                  fill="hsl(var(--primary))"
                  name="Nemocnice"
                  // biome-ignore lint/suspicious/noExplicitAny: recharts label type mismatch
                  label={(props: any) => (
                    <text
                      x={props.x}
                      y={props.y - 8}
                      textAnchor="middle"
                      fontSize={10}
                      fill="hsl(var(--muted-foreground))"
                    >
                      {props.payload?.name}
                    </text>
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table: all hospitals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Detailní srovnání pracovišť
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium pr-4">Nemocnice</th>
                <th className="pb-2 font-medium pr-4">Přístroj</th>
                <th className="pb-2 font-medium pr-4">Technologie</th>
                <th className="pb-2 font-medium pr-4">Instalace</th>
                <th className="pb-2 font-medium pr-4">Stáří</th>
                <th className="pb-2 font-medium pr-4">Stav údržby</th>
                <th className="pb-2 font-medium pr-4">Přesnost</th>
                <th className="pb-2 font-medium pr-4">Senzitivita</th>
                <th className="pb-2 font-medium pr-4">F1 skóre</th>
                <th className="pb-2 font-medium pr-4">Model</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAge.map((h) => (
                <tr
                  key={h.hospitalId}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 pr-4 font-semibold">
                    {h.hospitalName}
                    {h.hospitalId === "nem-opava" && (
                      <Badge
                        variant="default"
                        className="ml-1.5 text-[8px] bg-emerald-600"
                      >
                        AI
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-xs">
                    {h.deviceInfo.manufacturer} {h.deviceInfo.model}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className="text-[10px]">
                      {h.deviceInfo.technology}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                    {h.deviceInfo.yearInstalled}
                  </td>
                  <td
                    className={`py-2.5 pr-4 font-semibold ${deviceAgeColor(h.deviceInfo.ageYears)}`}
                  >
                    {h.deviceInfo.ageYears} let
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${maintColor(h.deviceInfo.maintenanceStatus)}`}
                    >
                      {h.deviceInfo.maintenanceStatus === "good"
                        ? "Dobrý"
                        : h.deviceInfo.maintenanceStatus === "fair"
                          ? "Uspokojivý"
                          : "Špatný"}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 pr-4 font-bold ${accuracyColor(h.metrics.accuracy)}`}
                  >
                    {(h.metrics.accuracy * 100).toFixed(1)} %
                  </td>
                  <td className="py-2.5 pr-4">
                    {(h.metrics.sensitivity * 100).toFixed(1)} %
                  </td>
                  <td className="py-2.5 pr-4">
                    {(h.metrics.f1Score * 100).toFixed(1)} %
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {h.version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Insight section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Klíčová zjištění
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Nemocnice Bruntál</strong> má nejstarší RTG přístroj (14 let,
            technologie CR) a zároveň nejnižší přesnost modelu (70.0 %). Doporučujeme
            plánovat obnovu přístrojového vybavení pro zvýšení kvality AI asistované
            diagnostiky.
          </p>
          <p>
            <strong>Nemocnice Třinec</strong> (9 let starý CR přístroj) vykazuje přesnost
            80.0 % — upgrade na DR technologii by mohl zlepšit senzitivitu modelu o 5–8 %.
          </p>
          <p>
            <strong>FN Ostrava</strong> a <strong>Nemocnice Opava</strong> s nejnovější DR
            technologií dosahují nejvyšší přesnosti (91 % a 92 %). Opava bude po nasazení
            backendu prvním pracovištěm s ostrým AI vyhodnocováním.
          </p>
          <p className="text-xs text-muted-foreground pt-2">
            Zdroj: Golden data · Po nasazení backendu se data načítají z API a mohou se
            lišit podle aktuálního stavu přístrojů.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
