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
    success: { icon: '✓', color: 'text-fha-success', bg: 'bg-fha-success-bg', border: 'border-fha-success-border' },
    error: { icon: '✕', color: 'text-fha-error', bg: 'bg-fha-error-bg', border: 'border-fha-error-border' },
    warning: { icon: '!', color: 'text-fha-warning', bg: 'bg-fha-warning-bg', border: 'border-fha-warning-border' },
    info: { icon: 'i', color: 'text-fha-info', bg: 'bg-fha-info-bg', border: 'border-fha-info-border' }
  };

  const currentConfig = config[type];

  return (
    <div 
      className={`w-80 pointer-events-auto overflow-hidden rounded-xl bg-fha-surface-2 border shadow-fha-lg flex items-start p-4 transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${currentConfig.border}`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${currentConfig.bg} ${currentConfig.color} mr-3`}>
        {currentConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-fha-text">{title}</h4>}
        <p className={`text-[13px] leading-snug ${title ? 'mt-1 text-fha-text-muted' : 'text-fha-text font-medium'}`}>
          {message}
        </p>
      </div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 ml-4 text-fha-text-faint hover:text-fha-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fha-cyan rounded"
      >
        ✕
      </button>
    </div>
  );
}
