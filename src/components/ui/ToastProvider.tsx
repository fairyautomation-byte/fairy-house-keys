'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from './Toast';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface CallableToast {
  (message: string, type?: ToastType, title?: string): void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

interface ToastContextType {
  toast: CallableToast;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    
    // Auto dismiss after 4s
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toastMethod = addToast as CallableToast;
  toastMethod.success = (msg: string, title?: string) => addToast(msg, 'success', title);
  toastMethod.error = (msg: string, title?: string) => addToast(msg, 'error', title);
  toastMethod.warning = (msg: string, title?: string) => addToast(msg, 'warning', title);
  toastMethod.info = (msg: string, title?: string) => addToast(msg, 'info', title);

  const value = {
    toast: toastMethod,
    success: toastMethod.success,
    error: toastMethod.error,
    warning: toastMethod.warning,
    info: toastMethod.info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <Toast 
            key={t.id} 
            type={t.type} 
            message={t.message} 
            title={t.title} 
            onClose={() => removeToast(t.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
