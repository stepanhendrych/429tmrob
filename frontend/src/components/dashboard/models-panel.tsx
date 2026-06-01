import { AlertTriangle, CheckCircle2, Cpu, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModelInstance } from "@/lib/types";

interface Props {
  models: ModelInstance[];
}

const statusConfig = {
  online: {
    icon: CheckCircle2,
    label: "Online",
    color: "text-emerald-600",
    badge: "default" as const,
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degradovaný",
    color: "text-amber-600",
    badge: "secondary" as const,
  },
  offline: {
    icon: XCircle,
    label: "Offline",
    color: "text-red-600",
    badge: "destructive" as const,
  },
};

export function ModelsPanel({ models }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Instance modelu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {models.map((m) => {
            const st = statusConfig[m.status];
            const Icon = st.icon;
            return (
              <div
                key={m.hospitalId}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <Icon className={`h-5 w-5 ${st.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.hospitalName}</span>
                    <Badge variant={st.badge}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.version} · uptime {m.uptimePercent} % ·{" "}
                    {m.scansProcessed.toLocaleString()} snímků · deployed {m.lastDeployed}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
