import { AlertTriangle, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import { confirmFeedback } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";

export function FeedbackPanel() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleFeedback = async (confirmed: boolean) => {
    const ok = await safeApiCall(
      () => confirmFeedback("X-1024", confirmed),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "feedback"),
        ),
    );
    if (ok !== null) {
      setLastAction(confirmed ? "potvrzen" : "vyvrácen");
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Zpětná vazba (Data Fly-wheel)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Snímek X-1024
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI: pneumonie (92 %) — Souhlasí váš nález s predikcí?
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => handleFeedback(true)}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Potvrdit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleFeedback(false)}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Vyvrátit
          </Button>
        </div>

        {lastAction && (
          <Badge
            variant={lastAction === "potvrzen" ? "default" : "secondary"}
            className="w-full justify-center text-xs"
          >
            Nález {lastAction} — data odeslána k přeučení modelu
          </Badge>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Každá zpětná vazba okamžitě vstupuje do trénovacího pipeline. Model se denně
          zlepšuje na datech z vašeho pracoviště.
        </p>
      </CardContent>
    </Card>
  );
}
