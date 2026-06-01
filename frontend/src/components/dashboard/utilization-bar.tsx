import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  percent: number;
  dailyCapacity: number;
  scansToday: number;
}

export function UtilizationBar({ percent, dailyCapacity, scansToday }: Props) {
  const color =
    percent > 85 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500";
  const label = percent > 85 ? "Kritické" : percent > 70 ? "Vysoké" : "Normální";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Vytížení
        </CardTitle>
        <Badge variant="outline">
          {Math.round(scansToday)} / {dailyCapacity}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-2xl font-bold">{percent} %</p>
          <span
            className={`text-xs font-medium ${percent > 85 ? "text-red-600" : percent > 70 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {label}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={`h-2 rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
