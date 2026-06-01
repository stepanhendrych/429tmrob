import { AlertTriangle, Clock, Info, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditLogEntry } from "@/lib/types";

interface Props {
  logs: AuditLogEntry[];
}

const sevConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    badge: "default" as const,
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "secondary" as const,
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "destructive" as const,
  },
};

export function AuditLogPanel({ logs }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Auditní log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((l) => {
            const sev = sevConfig[l.severity];
            const Icon = sev.icon;
            return (
              <div
                key={l.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${sev.bg}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 ${sev.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{l.userName}</span>
                    <Badge variant={sev.badge} className="text-[10px]">
                      {l.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {l.target}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {l.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
