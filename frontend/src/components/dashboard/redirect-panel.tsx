import { AlertTriangle, ArrowLeftRight, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RedirectSuggestion, RegionHospitalStatus } from "@/lib/types";

interface Props {
  suggestions: RedirectSuggestion[];
  hospitals: RegionHospitalStatus[];
}

export function RedirectPanel({ suggestions, hospitals }: Props) {
  const getHospitalName = (id: string) => hospitals.find((h) => h.id === id)?.name ?? id;

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Přesměrování pacientů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Žádná přesměrování nejsou aktuálně navržena
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Návrhy na přesměrování
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Doporučeno
              </Badge>
              <span className="text-xs text-muted-foreground">
                {s.patientCount} pacientů
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-red-600">
                {getHospitalName(s.fromHospitalId)}
              </span>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-emerald-600">
                {getHospitalName(s.toHospitalId)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{s.reason}</p>

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Navigation className="h-3 w-3" />
              Vzdálenost {s.distanceKm} km
            </div>
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground mt-2">
          Algoritmus bere v úvahu: vytížení pracovišť, dojezdovou vzdálenost pacienta,
          predikci zátěže z ČHMÚ. Cílem je „nejvhodnější" nemocnice, ne „nejrychlejší".
        </p>
      </CardContent>
    </Card>
  );
}
