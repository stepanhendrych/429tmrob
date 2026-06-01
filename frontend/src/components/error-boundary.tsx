import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="text-center space-y-5 max-w-md px-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-xl font-bold">Neočekávaná chyba</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message ?? "Došlo k neočekávané chybě aplikace."}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Home className="h-4 w-4" />
                Úvodní stránka
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Obnovit stránku
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
