import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

let externalShowToast = null;

const typeConfig = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    title: 'Success',
  },
  error: {
    Icon: XCircle,
    iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    title: 'Error',
  },
  warning: {
    Icon: AlertCircle,
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    title: 'Warning',
  },
  info: {
    Icon: Info,
    iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    title: 'Info',
  },
};

const normalizeToast = (input, fallbackType) => {
  if (input && typeof input === 'object' && !React.isValidElement(input)) {
    return {
      type: input.type || fallbackType,
      title: input.title,
      message: input.message ?? input.content ?? '',
      duration: input.duration,
    };
  }

  return {
    type: fallbackType,
    title: undefined,
    message: input,
    duration: undefined,
  };
};

const ToastItem = ({ item, onClose }) => {
  const config = typeConfig[item.type] || typeConfig.info;
  const Icon = config.Icon;

  useEffect(() => {
    const timeout = window.setTimeout(() => onClose(item.id), item.duration);
    return () => window.clearTimeout(timeout);
  }, [item.id, item.duration, onClose]);

  return (
    <div className="pointer-events-auto flex w-full min-w-0 max-w-[420px] items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-xl shadow-slate-900/10 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-black/30 sm:min-w-[320px]">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconClass}`}>
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        {item.title && (
          <div className="text-sm font-extrabold leading-5 tracking-normal text-slate-950 dark:text-white">
            {item.title}
          </div>
        )}
        {item.message && (
          <div className={`${item.title ? 'mt-0.5' : ''} break-words text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300`}>
            {item.message}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const showToast = useCallback((payload) => {
    const normalized = normalizeToast(payload, payload?.type || 'info');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toastItem = {
      id,
      type: normalized.type || 'info',
      title: normalized.title,
      message: normalized.message,
      duration: normalized.duration ?? 4000,
    };

    setToasts((current) => [toastItem, ...current].slice(0, 5));
    return id;
  }, []);

  useEffect(() => {
    externalShowToast = showToast;
    return () => {
      externalShowToast = null;
    };
  }, [showToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[9999] flex w-[calc(100vw-2rem)] max-w-[420px] flex-col gap-3 sm:right-6 sm:w-auto">
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onClose={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const emitToast = (type, input, options = {}) => {
  const payload = normalizeToast(input, type);
  const finalPayload = { ...payload, type, ...options };

  if (externalShowToast) {
    return externalShowToast(finalPayload);
  }

  return null;
};

export const toast = {
  success: (input, options) => emitToast('success', input, options),
  error: (input, options) => emitToast('error', input, options),
  warning: (input, options) => emitToast('warning', input, options),
  info: (input, options) => emitToast('info', input, options),
  show: (input) => emitToast(input?.type || 'info', input),
};

