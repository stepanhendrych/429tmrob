import {
  Building2,
  HeartPulse,
  Home,
  Hospital as HospitalIcon,
  Pill,
  Stethoscope,
} from "lucide-react";
import type { Hospital } from "./types";

export const HOSPITAL_LOGO: Record<
  string,
  {
    icon: typeof Building2;
    color: string;
    bg: string;
    ring: string;
  }
> = {
  "fn-ostrava": {
    icon: HospitalIcon,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    ring: "ring-red-300",
  },
  "nem-karvina": {
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    ring: "ring-blue-300",
  },
  "nem-opava": {
    icon: HeartPulse,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    ring: "ring-emerald-300",
  },
  "nem-trinec": {
    icon: Stethoscope,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    ring: "ring-purple-300",
  },
  "nem-bruntal": {
    icon: Home,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    ring: "ring-amber-300",
  },
  "pol-frydek": {
    icon: Pill,
    color: "text-cyan-600",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    ring: "ring-cyan-300",
  },
};

export function HospitalLogo({
  hospitalId,
  className = "h-6 w-6",
}: {
  hospitalId: string;
  className?: string;
}) {
  const cfg = HOSPITAL_LOGO[hospitalId];
  if (!cfg) return <Building2 className={className} />;
  const Icon = cfg.icon;
  return <Icon className={`${className} ${cfg.color}`} />;
}

export function HospitalLogoBox({
  hospital,
  size = "md",
}: {
  hospital: Hospital;
  size?: "sm" | "md" | "lg";
}) {
  const cfg = HOSPITAL_LOGO[hospital.id];
  const iconSize = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const boxSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const Icon = cfg?.icon ?? Building2;
  return (
    <div
      className={`${boxSize} shrink-0 flex items-center justify-center rounded-lg shadow-sm ring-1 ${cfg?.ring ?? "ring-gray-300"} ${cfg?.bg ?? "bg-background"}`}
    >
      <Icon className={`${iconSize} ${cfg?.color ?? "text-muted-foreground"}`} />
    </div>
  );
}
