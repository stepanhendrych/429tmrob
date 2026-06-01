import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/context/AuthContext";
import { HospitalProvider } from "@/context/HospitalContext";
import { ToastProvider } from "@/context/ToastContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { HospitalDashboard } from "@/pages/HospitalDashboard";
import { KrajPage } from "@/pages/KrajPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SettingsProvider>
          <HospitalProvider>
            <ToastProvider>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<KrajPage />} />
                  <Route path="/login/:hospitalId" element={<LoginPage />} />
                  <Route path="/dashboard/:hospitalId/*" element={<HospitalDashboard />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AuthProvider>
            </ToastProvider>
          </HospitalProvider>
        </SettingsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
