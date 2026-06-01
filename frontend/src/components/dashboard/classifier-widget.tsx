import { AlertTriangle, Brain, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClassifierWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Klasifikátor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border-2 border-dashed p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Nahrajte RTG snímek</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, DICOM</p>
        </div>
        <Button className="w-full" size="sm">
          <Upload className="h-4 w-4 mr-1.5" />
          Vybrat soubor
        </Button>

        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Poslední predikce</span>
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              NÁLEZ
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Snímek X-1024 — konzistentní s pneumonií (92 %)
          </p>
        </div>

        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Model:</p>
          <p>Sen. 91 % · Spec. 84 % · Přesnost 88 %</p>
          <p className="mt-1 text-[10px]">
            Po nasazení backendu se snímky odešlou k analýze na API endpoint /classify
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
