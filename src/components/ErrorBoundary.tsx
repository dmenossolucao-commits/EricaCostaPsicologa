import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Component Tree:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-sand-200 space-y-5">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold text-sand-950">
                {this.props.fallbackTitle || 'Ops, ocorreu um erro temporário'}
              </h2>
              <p className="text-xs text-sand-700 leading-relaxed">
                A página encontrou uma instabilidade ao carregar os dados. Clique abaixo para recarregar com segurança.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-sand-100 rounded-xl text-[11px] font-mono text-sand-800 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-softblue-600 hover:bg-softblue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
