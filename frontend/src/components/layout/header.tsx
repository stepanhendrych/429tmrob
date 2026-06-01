import { Crown, LogOut, Server, Stethoscope, UserCog } from "lucide-react";
import { HospitalLogo } from "@/lib/hospital-config";
import type { Role } from "@/lib/types";

interface HeaderProps {
  userName: string;
  role: Role;
  hospitalId?: string;
  hospitalName: string;
  onLogout: () => void;
}

const roleConfig: Record<Role, { label: string; icon: typeof Stethoscope }> = {
  doctor: { label: "Lékař", icon: Stethoscope },
  radiologist: { label: "Radiolog", icon: Stethoscope },
  it_admin: { label: "IT Administrátor", icon: Server },
  spravce: { label: "Správce kraje", icon: UserCog },
  reditel: { label: "Ředitel", icon: Crown },
};

export function Header({
  userName,
  role,
  hospitalId,
  hospitalName,
  onLogout,
}: HeaderProps) {
  const cfg = roleConfig[role];
  const Icon = cfg.icon;
  const showLogo = hospitalId && hospitalId !== "spravce" && hospitalId !== "reditel";
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {showLogo ? (
            <HospitalLogo hospitalId={hospitalId!} className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-muted-foreground">
            {cfg.label} · {hospitalName}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Odhlásit
      </button>
    </header>
  );
}
