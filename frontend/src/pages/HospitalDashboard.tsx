import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DirectorDashboard } from "@/components/dashboard/director-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { ItAdminDashboard } from "@/components/dashboard/it-admin-dashboard";
import { SpravceDashboard } from "@/components/dashboard/spravce-dashboard";
import { Header } from "@/components/layout/header";
import { RoleSidebar } from "@/components/layout/role-sidebar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const HOSPITAL_NAMES = {
  "fn-ostrava": "Fakultní nemocnice Ostrava",
  "nem-karvina": "Nemocnice Karviná",
  "nem-opava": "Nemocnice Opava",
  "nem-trinec": "Nemocnice Třinec",
  "nem-bruntal": "Nemocnice Bruntál",
  "pol-frydek": "Poliklinika Frýdek-Místek",
} as const;

export function HospitalDashboard() {
  const { hospitalId } = useParams();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !hospitalId) {
      navigate("/", { replace: true });
      if (!hospitalId) {
        addToast("Chybí ID pracoviště.", "error", {
          label: "Zpět na přehled",
          onClick: () => navigate("/"),
        });
      }
    }
  }, [user, hospitalId, navigate, addToast]);

  if (!user || !hospitalId) return null;

  const handleLogout = () => {
    logout();
    addToast("Byli jste odhlášeni.", "info");
    navigate("/", { replace: true });
  };

  const hospitalName =
    user.role === "spravce" || user.role === "reditel"
      ? "Moravskoslezský kraj"
      : hospitalId in HOSPITAL_NAMES
        ? HOSPITAL_NAMES[hospitalId as keyof typeof HOSPITAL_NAMES]
        : hospitalId;

  return (
    <div className="flex h-screen">
      <RoleSidebar role={user.role} hospitalId={hospitalId} />
      <div className="flex flex-1 flex-col ml-64">
        <Header
          userName={user.name}
          role={user.role}
          hospitalId={hospitalId}
          hospitalName={hospitalName}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {(user.role === "doctor" || user.role === "radiologist") && (
            <DoctorDashboard hospitalId={hospitalId} />
          )}
          {user.role === "spravce" && <SpravceDashboard />}
          {user.role === "it_admin" && <ItAdminDashboard hospitalId={hospitalId} />}
          {user.role === "reditel" && <DirectorDashboard />}
        </main>
      </div>
    </div>
  );
}
