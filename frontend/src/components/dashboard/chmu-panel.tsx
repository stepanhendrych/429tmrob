import { AlertTriangle, Cloud, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChmuData } from "@/lib/types";

interface Props {
  data: ChmuData | null;
}

export function ChmuPanel({ data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            ČHMÚ — kvalita ovzduší
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Data nejsou k dispozici
          </p>
        </CardContent>
      </Card>
    );
  }

  const pm25level = data.pm25 > 80 ? "Vysoká" : data.pm25 > 50 ? "Zvýšená" : "Normální";
  const pm25color =
    data.pm25 > 80
      ? "text-red-600"
      : data.pm25 > 50
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          ČHMÚ — predikce zátěže
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Stanice {data.station}</p>
            <Badge variant="outline" className="text-[10px]">
              {data.city}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-red-50 dark:bg-red-950/30 p-2 text-center">
              <p className="text-xs text-muted-foreground">PM2.5</p>
              <p className={`text-lg font-bold ${pm25color}`}>{data.pm25}</p>
              <p className="text-[10px] text-muted-foreground">μg/m³ · {pm25level}</p>
            </div>
            <div className="rounded bg-amber-50 dark:bg-amber-950/30 p-2 text-center">
              <p className="text-xs text-muted-foreground">PM10</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {data.pm10}
              </p>
              <p className="text-[10px] text-muted-foreground">μg/m³ · Zvýšená</p>
            </div>
          </div>

          {data.pm25 > 50 && (
            <div className="flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-950/30 p-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Detekována smogová situace — predikce +28 % náporu na FN Ostrava
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Předpověď na 24 h (PM2.5)
          </p>
          <div className="flex items-end gap-1 h-20">
            {data.forecastNext24h.map((f) => {
              const height = Math.max(8, (f.pm25 / 100) * 64);
              const color =
                f.pm25 > 80
                  ? "bg-red-400"
                  : f.pm25 > 50
                    ? "bg-amber-400"
                    : "bg-emerald-400";
              return (
                <div key={f.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t ${color} transition-all`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[8px] text-muted-foreground">{f.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Zdroj: ČHMÚ · data se aktualizují každou hodinu · automatická predikce zátěže
          pro kraj
        </p>
      </CardContent>
    </Card>
  );
}
