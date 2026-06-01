import { AlertTriangle, Clock, Scan, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/types";

interface Props {
  data: DashboardData;
}

export function MetricsCards({ data }: Props) {
  const cards = [
    {
      label: "Fronta",
      value: data.queueLength,
      sub: `${data.urgentCount} urgentních`,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Čekací doba",
      value: `${data.avgWaitTimeMin} min`,
      sub: "průměrná",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Zpracování",
      value: `${data.avgProcessingTimeMin} min`,
      sub: "průměrná doba",
      icon: Scan,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Snímky dnes",
      value: Math.round(data.scansToday),
      sub: `kapacita ${data.hospital.dailyCapacity}/den`,
      icon: TrendingDown,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.label}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
