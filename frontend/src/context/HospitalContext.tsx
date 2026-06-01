import { createContext, type ReactNode, useContext, useState } from "react";
import type { Hospital } from "@/lib/types";

interface HospitalContextType {
  hospital: Hospital | null;
  setHospital: (h: Hospital) => void;
}

const HospitalCtx = createContext<HospitalContextType | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  return (
    <HospitalCtx.Provider value={{ hospital, setHospital }}>
      {children}
    </HospitalCtx.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider");
  return ctx;
}
