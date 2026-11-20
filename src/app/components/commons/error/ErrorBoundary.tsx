import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy } from "lucide-react";
import { createLogger } from "../../../../utils/logger";
import { getLastCorrelationId, getLastTraceId } from "../../../../services/common/apiTypes";
import { clientLogger } from "../../../../utils/clientLogger";

const log = createLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  referenceId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, referenceId: '' };

  static getDerivedStateFromError(error: Error): State {
    const referenceId = getLastCorrelationId() ?? crypto.randomUUID();
    return { hasError: true, error, referenceId };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const traceId = getLastTraceId();
    // Dispatch to Sentry / external APM if initialized on window
    try {
      const globalSentry = (window as unknown as { Sentry?: { captureException: (err: unknown, ctx: unknown) => void } })?.Sentry;
      if (globalSentry?.captureException) {
        globalSentry.captureException(error, {
          tags: {
            correlationId: this.state.referenceId,
            traceId: traceId ?? "none",
          },
          extra: {
            componentStack: info.componentStack,
          },
        });
      }
    } catch {
      // Telemetry capture failure must never break component crash rendering
    }

    log.error("Unhandled render error", error, {
      componentStack: info.componentStack,
      correlationId: this.state.referenceId,
      traceId,
    });
    clientLogger.error("Render error", {
      correlationId: this.state.referenceId,
      traceId,
      message: error.message,
      componentStack: info.componentStack ?? undefined,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, referenceId: '' });
  };

  private handleCopy = () => {
    navigator.clipboard.writeText(this.state.referenceId).catch(() => {});
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
            <p className="text-slate-400 text-sm mb-4">
              This section encountered an error. The rest of the app is still
              working.
            </p>
            {this.state.referenceId && (
              <button
                onClick={this.handleCopy}
                title="Copy reference ID for support"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs rounded-lg mb-4 transition-colors"
              >
                <Copy className="w-3 h-3" />
                Reference: {this.state.referenceId.slice(0, 8)}…
              </button>
            )}
            <div>
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
      </div>
    );
  }
}
