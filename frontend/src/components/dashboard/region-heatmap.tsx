import { AlertTriangle, Building2, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegionHospitalStatus } from "@/lib/types";

interface Props {
  hospitals: RegionHospitalStatus[];
}

function utilColor(pct: number) {
  if (pct > 85) return "bg-red-500";
  if (pct > 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function utilLabel(pct: number) {
  if (pct > 85) return "Kritické";
  if (pct > 70) return "Vysoké";
  return "Normální";
}

export function RegionHeatmap({ hospitals }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Teplotní mapa kraje — vytížení pracovišť
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {h.name}
                    {h.id === "nem-opava" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700"
                      >
                        AI aktivní
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.city} · {h.dailyCapacity} snímků/den
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${h.utilization > 85 ? "text-red-600" : h.utilization > 70 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {h.utilization} %
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {utilLabel(h.utilization)}
                  </p>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-muted mb-3">
                <div
                  className={`h-2 rounded-full ${utilColor(h.utilization)}`}
                  style={{ width: `${Math.min(h.utilization, 100)}%` }}
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Fronta: {h.queueLength}
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Urgent: {h.urgentCount}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Dnes: {h.scansToday}
                </span>
                <span className="flex items-center gap-1">
                  Volná kap.: {h.freeCapacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
