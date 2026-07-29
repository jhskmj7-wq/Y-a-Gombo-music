import React, { Component, ErrorInfo, ReactNode } from "react";

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
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded text-red-500 font-mono text-xs overflow-auto">
          <h2 className="font-bold text-base mb-2">Erreur Fatale (React)</h2>
          <p className="mb-2 whitespace-pre-wrap">{this.state.error?.toString()}</p>
          {this.state.errorInfo?.componentStack && (
            <pre className="mt-2 text-[10px] opacity-80 whitespace-pre-wrap">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
