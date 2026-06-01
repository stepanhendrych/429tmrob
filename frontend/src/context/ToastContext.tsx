import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (
    message: string,
    variant?: ToastVariant,
    action?: ToastAction,
    duration?: number,
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700",
  error: "border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700",
  warning: "border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700",
  info: "border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700",
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const Icon = ICONS[toast.variant];
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${STYLES[toast.variant]}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${ICON_COLORS[toast.variant]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onRemove(toast.id);
            }}
            className="mt-1.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      action?: ToastAction,
      duration = 5000,
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, variant, action, duration }]);
    },
    [],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => removeToast(t.id), t.duration ?? 5000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
