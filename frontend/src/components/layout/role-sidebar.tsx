import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Cloud,
  Cpu,
  EyeIcon,
  HeartPulse,
  KeyRound,
  LineChart,
  Map,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Role } from "@/lib/types";

interface Props {
  role: Role;
  hospitalId: string;
}

const roleMaps: Record<
  Role,
  { label: string; icon: typeof HeartPulse; path: string; matchExact?: boolean }[]
> = {
  doctor: [
    { label: "Fronta snímků", icon: ClipboardList, path: "/queue", matchExact: true },
    { label: "Klasifikátor", icon: EyeIcon, path: "/classify" },
    { label: "Metriky modelu", icon: BarChart3, path: "/metrics" },
    { label: "Statistiky", icon: LineChart, path: "/stats" },
  ],
  radiologist: [
    { label: "Fronta snímků", icon: ClipboardList, path: "/queue", matchExact: true },
    { label: "Klasifikátor", icon: EyeIcon, path: "/classify" },
    { label: "Metriky modelu", icon: BarChart3, path: "/metrics" },
    { label: "Statistiky", icon: LineChart, path: "/stats" },
  ],
  it_admin: [
    { label: "Přehled modelů", icon: Cpu, path: "/models" },
    { label: "Licence", icon: KeyRound, path: "/licenses" },
    { label: "Auditní log", icon: ShieldCheck, path: "/audit" },
    { label: "Uživatelé", icon: Users, path: "/users" },
  ],
  spravce: [
    { label: "Přehled kraje", icon: Map, path: "/region", matchExact: true },
    { label: "Predikce zátěže", icon: Cloud, path: "/prediction" },
    { label: "Přesměrování", icon: ArrowLeftRight, path: "/redirect" },
    { label: "Statistiky", icon: LineChart, path: "/stats" },
    { label: "Nastavení", icon: Settings2, path: "/settings" },
  ],
  reditel: [
    { label: "Výsledky center", icon: TrendingUp, path: "/results", matchExact: true },
  ],
};

const roleLabels: Record<Role, string> = {
  doctor: "Lékař",
  radiologist: "Radiolog",
  it_admin: "IT Admin",
  spravce: "Správce kraje",
  reditel: "Ředitel",
};

export function RoleSidebar({ role, hospitalId }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const base = `/dashboard/${hospitalId}`;
  const links = roleMaps[role];

  const isActive = (link: (typeof links)[number]) => {
    const full = `${base}${link.path}`;
    if (link.matchExact) return location.pathname === full;
    return location.pathname.startsWith(full);
  };

  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r bg-background/95 backdrop-blur z-10">
      <div
        className="flex h-14 items-center gap-2 border-b px-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => navigate(base)}
      >
        <HeartPulse className="h-5 w-5 text-red-500" />
        <span className="font-bold text-sm">VigilantRay</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((l) => {
          const active = isActive(l);
          return (
            <button
              key={l.path}
              onClick={() => navigate(`${base}${l.path}`)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t p-3 text-center text-[10px] text-muted-foreground">
        {roleLabels[role]} · {hospitalId}
      </div>
    </aside>
  );
}
