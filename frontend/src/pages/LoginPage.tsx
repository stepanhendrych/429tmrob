import { ArrowLeft, Building2, Crown, Server, Stethoscope, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHospital } from "@/context/HospitalContext";
import { useToast } from "@/context/ToastContext";
import { getHospital, getUsersForHospital } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import { HospitalLogoBox } from "@/lib/hospital-config";
import type { Role } from "@/lib/types";

const roleConfig: Record<
  string,
  { icon: typeof Stethoscope; label: string; color: string }
> = {
  doctor: {
    icon: Stethoscope,
    label: "Lékař",
    color:
      "border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-500 dark:hover:bg-blue-950",
  },
  radiologist: {
    icon: Stethoscope,
    label: "Radiolog",
    color:
      "border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-500 dark:hover:bg-blue-950",
  },
  it_admin: {
    icon: Server,
    label: "IT Administrátor",
    color:
      "border-amber-200 hover:border-amber-500 hover:bg-amber-50 dark:border-amber-800 dark:hover:border-amber-500 dark:hover:bg-amber-950",
  },
  spravce: {
    icon: UserCog,
    label: "Správce kraje",
    color:
      "border-purple-200 hover:border-purple-500 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-500 dark:hover:bg-purple-950",
  },
  reditel: {
    icon: Crown,
    label: "Ředitel",
    color:
      "border-rose-200 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-800 dark:hover:border-rose-500 dark:hover:bg-rose-950",
  },
};

export function LoginPage() {
  const { hospitalId } = useParams();
  const { setUser } = useAuth();
  const { hospital, setHospital } = useHospital();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);
  const [hospitalName, setHospitalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSpravce = hospitalId === "spravce";
  const isReditel = hospitalId === "reditel";

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);

    if (!isSpravce && !isReditel) {
      safeApiCall(
        async () => {
          const h = await getHospital(hospitalId);
          setHospital(h);
          setHospitalName(h.name);
          return null;
        },
        (err) => {
          setError(err.message);
          addToast(
            err.message,
            "error",
            err.action ?? getErrorAction(err.status, hospitalId),
          );
        },
      );
    } else {
      setHospitalName(
        isSpravce
          ? "Správa Moravskoslezského kraje"
          : "Ředitelství — Moravskoslezský kraj",
      );
    }

    safeApiCall(
      () =>
        getUsersForHospital(hospitalId).then((data) => {
          setUsers(data);
          return data;
        }),
      (err) => {
        setError(err.message);
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, hospitalId),
        );
      },
    ).finally(() => setLoading(false));
  }, [hospitalId, setHospital, addToast, isSpravce, isReditel]);

  const handleLogin = (email: string, name: string, role: string) => {
    setUser({
      id: email,
      name,
      email,
      role: role as Role,
      hospitalId: hospitalId!,
    });
    navigate(`/dashboard/${hospitalId}`);
  };

  if (!hospital && !hospitalName) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Načítám...
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-bold text-red-600">Chyba načítání</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Zpět na výběr pracoviště
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na výběr pracoviště
        </button>

        <div className="text-center">
          {hospital && !isSpravce && !isReditel ? (
            <div className="flex justify-center mb-3">
              <HospitalLogoBox hospital={hospital} size="lg" />
            </div>
          ) : (
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3 ${isSpravce ? "bg-purple-100 dark:bg-purple-900" : "bg-rose-100 dark:bg-rose-900"}`}
            >
              {isSpravce ? (
                <UserCog className="h-7 w-7 text-purple-600 dark:text-purple-300" />
              ) : (
                <Crown className="h-7 w-7 text-rose-600 dark:text-rose-300" />
              )}
            </div>
          )}
          <h1 className="text-xl font-bold">{hospitalName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Načítám uživatele..." : "Vyberte uživatele pro přihlášení"}
          </p>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Načítám...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Žádní uživatelé nenalezeni.
            </div>
          ) : (
            users.map((u) => {
              const cfg = roleConfig[u.role] ?? roleConfig.doctor!;
              const Icon = cfg.icon;
              return (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u.email, u.name, u.role)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${cfg.color}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Demo přihlášení — po nasazení backendu proběhne autentizace přes API
        </p>
      </div>
    </div>
  );
}
