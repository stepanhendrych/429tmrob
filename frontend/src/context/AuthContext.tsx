import { createContext, type ReactNode, useContext, useState } from "react";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => setUser(null);

  return (
    <AuthCtx.Provider value={{ user, setUser, logout }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
