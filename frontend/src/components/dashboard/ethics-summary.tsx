import { Scale, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EthicsSummary() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Etický rámec
        </CardTitle>
        <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
          <Shield className="h-3 w-3" />
          AI Act compliant
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Kategorie rizika:</span> Vysoká
        </p>
        <p>
          <span className="font-semibold text-foreground">Dohled:</span> Každá predikce je
          validována radiologem
        </p>
        <p>
          <span className="font-semibold text-foreground">Transparentnost:</span> Model
          neslouží jako samostatný diagnostický nástroj
        </p>
        <p>
          <span className="font-semibold text-foreground">Audit:</span> 100 % predikcí je
          logováno a auditovatelných
        </p>
      </CardContent>
    </Card>
  );
}
