'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  onClose: () => void;
}

export default function Toast({ type, title, message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation slightly after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: { icon: '✓', color: 'text-[var(--fha-success)]', bg: 'bg-[var(--fha-success-bg)]', border: 'border-[var(--fha-success-border)]' },
    error: { icon: '✕', color: 'text-[var(--fha-error)]', bg: 'bg-[var(--fha-error-bg)]', border: 'border-[var(--fha-error-border)]' },
    warning: { icon: '!', color: 'text-[var(--fha-warning)]', bg: 'bg-[var(--fha-warning-bg)]', border: 'border-[var(--fha-warning-border)]' },
    info: { icon: 'i', color: 'text-[var(--fha-info)]', bg: 'bg-[var(--fha-info-bg)]', border: 'border-[var(--fha-info-border)]' }
  };

  const currentConfig = config[type];

  return (
    <div 
      className={`w-[340px] max-w-[calc(100vw-32px)] pointer-events-auto overflow-hidden rounded-fha-lg bg-white shadow-fha-overlay flex items-start p-4 transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 sm:translate-x-0' : 'translate-y-[-16px] sm:translate-y-0 sm:translate-x-4 opacity-0'
      } border ${currentConfig.border}`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[13px] ${currentConfig.bg} ${currentConfig.color} mr-3`}>
        {currentConfig.icon}
      </div>
      <div className="flex-1 min-w-0 pt-[2px]">
        {title && <h4 className="text-sm font-semibold text-[var(--fha-text)]">{title}</h4>}
        <p className={`text-sm leading-snug ${title ? 'mt-1 text-[var(--fha-text-muted)]' : 'text-[var(--fha-text)] font-medium'}`}>
          {message}
        </p>
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 ml-4 p-1 text-[var(--fha-text-faint)] hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded"
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  );
}
