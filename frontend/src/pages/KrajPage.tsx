import {
  Activity,
  ArrowRight,
  Building2,
  HeartPulse,
  MapPin,
  UserCog,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useHospital } from "@/context/HospitalContext";
import { useToast } from "@/context/ToastContext";
import { getHospitals } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import { HospitalLogoBox } from "@/lib/hospital-config";
import type { Hospital } from "@/lib/types";

const typeColors: Record<string, string> = {
  fakultní:
    "border-red-300 hover:border-red-500 bg-red-50/50 dark:border-red-800 dark:hover:border-red-500 dark:bg-red-950/20",
  krajská:
    "border-blue-300 hover:border-blue-500 bg-blue-50/50 dark:border-blue-800 dark:hover:border-blue-500 dark:bg-blue-950/20",
  městská:
    "border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 dark:border-emerald-800 dark:hover:border-emerald-500 dark:bg-emerald-950/20",
  poliklinika:
    "border-amber-300 hover:border-amber-500 bg-amber-50/50 dark:border-amber-800 dark:hover:border-amber-500 dark:bg-amber-950/20",
};

export function KrajPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const { setHospital } = useHospital();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    safeApiCall(
      async () => {
        const data = await getHospitals();
        setHospitals(data);
        return data;
      },
      (err) => {
        addToast(err.message, "error", err.action ?? getErrorAction(err.status, ""));
      },
    ).finally(() => setLoading(false));
  }, [addToast]);

  const handleSelect = (h: Hospital) => {
    setHospital(h);
    navigate(`/login/${h.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-6">
          <HeartPulse className="h-7 w-7 text-red-500" />
          <div>
            <h1 className="font-bold text-lg">Druhý pár očí</h1>
            <p className="text-xs text-muted-foreground">
              AI asistent pro radiologii · Moravskoslezský kraj
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-primary mb-3" />
          <h2 className="text-2xl font-bold">Vyberte pracoviště</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hospitals.length} radiologických pracovišť v Moravskoslezském kraji
          </p>
          <div className="mt-3 flex items-center gap-4 text-base text-muted-foreground justify-center border border-muted-foreground/20 rounded-lg p-3 bg-background/50">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <Badge variant="default" className="text-[10px] bg-emerald-600">
                AI
              </Badge>{" "}
              = ostré vyhodnocení (po nasazení backendu)
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Ostatní = statická demonstrativní data
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Načítám pracoviště...
            </div>
          ) : hospitals.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Žádná pracoviště nenalezena.
            </div>
          ) : (
            hospitals.map((h) => (
              <button
                key={h.id}
                onClick={() => handleSelect(h)}
                className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${typeColors[h.type] ?? ""}`}
              >
                <HospitalLogoBox hospital={h} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold flex items-center gap-2">
                    {h.name}
                    {h.id === "nem-opava" && (
                      <Badge
                        variant="default"
                        className="text-[10px] flex items-center gap-0.5 bg-emerald-600 hover:bg-emerald-600"
                      >
                        <Zap className="h-2.5 w-2.5" />
                        AI
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.city} · {h.type} · {h.dailyCapacity} snímků/den
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {h.utilization} % vytížení
                    </span>
                    <span>{h.rtgDevices}× RTG</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>

        <div className="border-t pt-8">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">Správa kraje</h3>
            <p className="text-sm text-muted-foreground">
              Přehled o vytížení všech pracovišť, predikce zátěže a přesměrování pacientů
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/login/spravce")}
              className="flex items-center gap-3 rounded-xl border-2 border-purple-300 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800 dark:hover:border-purple-500 p-5 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
                <UserCog className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Vstup pro správce kraje</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Krajský dashboard · vytížení · predikce · přesměrování
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Česká AI Olympiáda 2026 · AI Startup · nvias, z.s.
      </footer>
    </div>
  );
}
