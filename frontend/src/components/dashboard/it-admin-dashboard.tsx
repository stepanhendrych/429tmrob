import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuditLogPanel } from "@/components/dashboard/audit-log-panel";
import { LicensesPanel } from "@/components/dashboard/licenses-panel";
import { ModelsPanel } from "@/components/dashboard/models-panel";
import { useToast } from "@/context/ToastContext";
import { getAuditLogs, getLicenses, getModelInstances, getUsers } from "@/lib/api";
import { getErrorAction, safeApiCall } from "@/lib/api-utils";
import { HospitalLogoBox } from "@/lib/hospital-config";
import type {
  AuditLogEntry,
  Hospital,
  LicenseInfo,
  ModelInstance,
  UserRecord,
} from "@/lib/types";

const ADMIN_HOSPITAL: Hospital = {
  id: "fn-ostrava",
  name: "FN Ostrava",
  city: "Ostrava",
  district: "Moravskoslezský",
  type: "faculty",
  address: "",
  lat: 0,
  lng: 0,
  rtgDevices: 0,
  dailyCapacity: 0,
  utilization: 0,
};

export function ItAdminDashboard() {
  const location = useLocation();
  const { addToast } = useToast();
  const [models, setModels] = useState<ModelInstance[]>([]);
  const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    safeApiCall(
      () =>
        getModelInstances().then((d) => {
          setModels(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "admin/models"),
        ),
    );
    safeApiCall(
      () =>
        getLicenses().then((d) => {
          setLicenses(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "admin/licenses"),
        ),
    );
    safeApiCall(
      () =>
        getAuditLogs().then((d) => {
          setAuditLogs(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "admin/audit"),
        ),
    );
    safeApiCall(
      () =>
        getUsers().then((d) => {
          setUsers(d);
          return d;
        }),
      (err) =>
        addToast(
          err.message,
          "error",
          err.action ?? getErrorAction(err.status, "admin/users"),
        ),
    );
  }, [addToast]);

  const raw = location.pathname.split("/").pop() ?? "";
  const views = ["models", "licenses", "audit", "users"] as const;
  const view = views.includes(raw as (typeof views)[number]) ? raw : "models";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HospitalLogoBox hospital={ADMIN_HOSPITAL} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">IT Administrace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Správa modelů · licence · audit · uživatelé
          </p>
        </div>
      </div>

      {view === "models" && <ModelsPanel models={models} />}

      {view === "licenses" && <LicensesPanel licenses={licenses} />}

      {view === "audit" && <AuditLogPanel logs={auditLogs} />}

      {view === "users" && (
        <div className="rounded-lg border p-6">
          <h2 className="text-base font-semibold mb-4">Uživatelé</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Jméno</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Aktivní</th>
                  <th className="pb-2 font-medium">Poslední přihlášení</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2.5">{u.name}</td>
                    <td className="py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5">
                      <span className="capitalize">
                        {u.role === "it_admin"
                          ? "IT Admin"
                          : u.role === "spravce"
                            ? "Správce"
                            : "Lékař"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${u.active ? "bg-emerald-500" : "bg-red-400"}`}
                      />
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {u.lastLogin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
