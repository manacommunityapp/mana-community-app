import { toast } from 'react-toastify';
import { Copy, AlertCircle } from 'lucide-react';
import { ApiError } from '../../../services/common/apiTypes';
import { clientLogger } from '../../../utils/clientLogger';

interface ApiErrorToastContentProps {
  message: string;
  correlationId?: string;
}

function ApiErrorToastContent({ message, correlationId }: ApiErrorToastContentProps) {
  const handleCopy = () => {
    if (correlationId) navigator.clipboard.writeText(correlationId).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {correlationId && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mt-0.5 ml-6 transition-colors"
          title="Copy reference ID"
        >
          <Copy className="w-3 h-3" />
          Reference: {correlationId.slice(0, 8)}…
        </button>
      )}
    </div>
  );
}

/**
 * Show an API error as a toast with an optional correlationId reference.
 * Server errors (5xx) stay until dismissed; client errors auto-close.
 */
export function showApiError(err: unknown): void {
  let message = 'An unexpected error occurred.';
  let correlationId: string | undefined;
  let statusCode: number | undefined;

  if (err instanceof ApiError) {
    message = err.message;
    correlationId = err.correlationId;
    statusCode = err.statusCode;
  } else if (err instanceof Error) {
    message = err.message;
  }

  clientLogger.error(message, { correlationId, statusCode });

  const isServerError = !statusCode || statusCode >= 500;

  toast.error(
    <ApiErrorToastContent message={message} correlationId={correlationId} />,
    {
      position: 'top-right',
      autoClose: isServerError ? false : 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    },
  );
}
