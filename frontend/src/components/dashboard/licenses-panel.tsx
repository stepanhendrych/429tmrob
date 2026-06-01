import { AlertTriangle, CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LicenseInfo } from "@/lib/types";

interface Props {
  licenses: LicenseInfo[];
}

const licConfig = {
  full: {
    icon: CheckCircle2,
    label: "Plná",
    color: "text-emerald-600",
    badge: "default" as const,
  },
  trial: {
    icon: AlertTriangle,
    label: "Trial",
    color: "text-amber-600",
    badge: "secondary" as const,
  },
  expired: {
    icon: XCircle,
    label: "Propadlá",
    color: "text-red-600",
    badge: "destructive" as const,
  },
};

export function LicensesPanel({ licenses }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Licence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {licenses.map((l) => {
            const cfg = licConfig[l.licenseType];
            const Icon = cfg.icon;
            return (
              <div key={l.id} className="flex items-center gap-4 rounded-lg border p-3">
                <Icon className={`h-5 w-5 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{l.hospitalName}</span>
                    <Badge variant={cfg.badge}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Platí do {l.validUntil} · {l.maxScansPerDay} snímků/den ·{" "}
                    {l.activeUsers} aktivních uživatelů
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
