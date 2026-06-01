import { HeartPulse, Home, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="text-8xl font-bold text-muted-foreground/20 select-none">
              404
            </div>
            <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-muted-foreground/40" />
          </div>
        </div>

        <h1 className="text-2xl font-bold">Stránka nenalezena</h1>
        <p className="text-sm text-muted-foreground">
          Tato stránka neexistuje nebo byla přesunuta. Zkontrolujte adresu nebo se vraťte
          na úvodní stránku.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Úvodní stránka
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <HeartPulse className="h-4 w-4" />
            Zpět
          </button>
        </div>
      </div>

      <footer className="fixed bottom-0 border-t w-full py-4 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur">
        VigilantRay · AI Olympiáda 2026
      </footer>
    </div>
  );
}
