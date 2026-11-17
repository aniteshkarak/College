import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
        let borderColor = 'border-blue-200 dark:border-blue-800';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          borderColor = 'border-emerald-200 dark:border-emerald-800';
        } else if (toast.type === 'warning' || toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderColor = 'border-rose-200 dark:border-rose-800';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 bg-white dark:bg-slate-900 shadow-xl rounded-2xl border ${borderColor} text-slate-800 dark:text-slate-100 text-sm animate-slide-up transition-all`}
          >
            {icon}
            <span className="flex-1 font-medium leading-snug">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
