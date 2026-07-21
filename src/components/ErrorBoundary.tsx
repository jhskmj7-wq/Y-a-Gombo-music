import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a chunk load error or network error
    if (
      error.message.includes("dynamically imported module") || 
      error.message.includes("fetch") || 
      error.message.includes("Failed to fetch") ||
      error.message.includes("cyclic object value")
    ) {
      return { 
        hasError: true, 
        error: new Error("Connexion réseau instable ou hors ligne. Impossible de charger le module.") 
      };
    }
    
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ [Critique] AfriGombo Error Catch:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-afri-bg text-afri-text z-[99999] flex flex-col items-center justify-center p-6 text-center font-sans">
          {/* Sound waves icon or logo silhouette */}
          <div className="w-24 h-24 mb-6 border border-[#D4AF37]/30 rounded-full flex items-center justify-center bg-afri-bg-sec shadow-[0_0_30px_rgba(212,175,55,0.15)] animate-pulse">
            <span className="text-[#D4AF37] text-4xl">🪘</span>
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="text-xl font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-black">
              AFRIGOMBO
            </h1>
            <div className="w-16 h-[1px] bg-afri-bg-sec mx-auto opacity-55" />
            <p className="text-sm text-afri-text-muted font-bold">
              Une erreur est survenue. Rafraîchissez la page.
            </p>
            
            {this.state.error && (
              <div className="text-[10px] font-mono text-afri-text-muted bg-afri-bg border border-afri-border rounded-xl p-3 text-left max-h-40 overflow-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-afri-bg-sec text-black rounded-xl text-xs font-black font-mono tracking-widest transition uppercase cursor-pointer hover:bg-afri-bg-sec"
              >
                Actualiser ⚡
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                className="w-full px-6 py-2 border border-afri-border text-afri-text-sec rounded-xl text-[10px] font-bold font-mono transition uppercase hover:bg-afri-bg-sec"
              >
                Retour à l'accueil
              </button>
              
              <p className="text-[9px] text-afri-text-sec mt-4 italic">
                Si le problème persiste, videz le cache de votre navigateur.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
