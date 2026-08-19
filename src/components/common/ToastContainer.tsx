import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Cloud, RefreshCw } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  timestamp: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      id="toast-notification-container" 
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm sm:max-w-md w-full px-3 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="System Notifications"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all transform translate-y-0 opacity-100 flex items-start space-x-3 text-xs ${
              isError
                ? 'bg-rose-950/95 text-rose-100 border-rose-600/80 shadow-rose-950/40'
                : isSuccess
                ? 'bg-slate-900/95 text-slate-100 border-emerald-500/80 shadow-emerald-950/40'
                : isWarning
                ? 'bg-amber-950/95 text-amber-100 border-amber-500/80 shadow-amber-950/40'
                : 'bg-slate-900/95 text-slate-100 border-blue-500/80 shadow-blue-950/40'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {isInfo && <Cloud className="w-5 h-5 text-blue-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="font-bold text-xs leading-4 mb-0.5 flex items-center gap-1.5 text-white">
                  <span>{toast.title}</span>
                  {isSuccess && (
                    <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-700/50">
                      Cloud Synced
                    </span>
                  )}
                </h4>
              )}
              <p className="text-xs text-slate-300 leading-relaxed break-words font-normal">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
