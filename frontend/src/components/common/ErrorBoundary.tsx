import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Terminal, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CLIMASCOPE Uncaught Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-screen bg-[#070B14] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-2xl w-full bg-[#0C1322] border border-red-900/80 rounded-xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#1A2640] pb-4">
              <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                    RUNTIME FAULT INTERCEPT
                  </span>
                  <span className="text-xs font-mono text-slate-500">•</span>
                  <span className="text-xs font-mono text-slate-400">CLIMASCOPE CORE</span>
                </div>
                <h1 className="text-lg font-bold text-white mt-0.5">
                  Municipal Resilience Engine Interrupted
                </h1>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400">
                An unhandled render exception occurred in the client application runtime. The application sandbox caught the fault to prevent session termination.
              </div>

              <div className="bg-[#070B14] border border-[#1E2D4A] rounded-lg p-3 font-mono text-xs overflow-x-auto space-y-1">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime error'}</span>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 max-h-40 overflow-y-auto scrollbar-thin pt-2 border-t border-[#16233B]">
                    {this.state.errorInfo.componentStack.trim()}
                  </pre>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#1A2640]">
              <div className="text-[11px] font-mono text-slate-500">
                Data state is isolated. Telemetry and ledger records remain secure.
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#132038] hover:bg-[#1A2C4D] border border-[#23385C] text-cyan-300 font-mono text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET STATE</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold tracking-wider transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>HARD RELOAD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
