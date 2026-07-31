import React, { Component, ErrorInfo, ReactNode } from "react";
import { logBugReport } from "../lib/bugReportLogger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    logBugReport({
      module: "ReactErrorBoundary",
      ecran: window.location.pathname,
      message: error.message || String(error),
      stack: errorInfo.componentStack || error.stack
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-zinc-950 border border-amber-500/30 rounded-2xl text-amber-400 font-mono text-xs shadow-2xl max-w-lg mx-auto my-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="font-black text-sm uppercase tracking-wider text-amber-400">
            Impossible de charger ce module
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans">
            Une anomalie a été enregistrée dans le journal du Temple.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-[#D4AF37] text-black font-bold uppercase text-[11px] rounded-xl hover:bg-white transition"
            >
              Réessayer
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-4 py-2 bg-zinc-800 text-white border border-zinc-700 font-bold uppercase text-[11px] rounded-xl hover:bg-zinc-700 transition"
            >
              Retour Accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
