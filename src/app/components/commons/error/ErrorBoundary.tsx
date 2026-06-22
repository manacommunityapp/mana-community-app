import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { createLogger } from "../../../../utils/logger";

const log = createLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error("Unhandled render error", error, {
      componentStack: info.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="bg-[#141c2e] border border-[#2a3a5c] p-6 rounded-2xl">
            <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Something went wrong
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              This section encountered an error. The rest of the app is still
              working.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
