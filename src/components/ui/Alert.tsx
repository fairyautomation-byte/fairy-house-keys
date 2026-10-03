import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  type?: AlertVariant;
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function Alert({ 
  variant, 
  type,
  title, 
  message,
  children, 
  className = '' 
}: AlertProps) {
  const config = {
    info: {
      bg: 'bg-[var(--fha-info-bg)]',
      border: 'border-[var(--fha-info-border)]',
      text: 'text-[var(--fha-info-text)]',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      bg: 'bg-[var(--fha-success-bg)]',
      border: 'border-[var(--fha-success-border)]',
      text: 'text-[var(--fha-success-text)]',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-[var(--fha-warning-bg)]',
      border: 'border-[var(--fha-warning-border)]',
      text: 'text-[var(--fha-warning-text)]',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    danger: {
      bg: 'bg-[var(--fha-error-bg)]',
      border: 'border-[var(--fha-error-border)]',
      text: 'text-[var(--fha-error-text)]',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const effectiveVariant = variant || type || 'info';
  const activeConfig = config[effectiveVariant] || config.info;
  const content = children ?? message;

  return (
    <div 
      className={`p-4 rounded-fha border ${activeConfig.bg} ${activeConfig.border} flex gap-3 ${className}`}
      role={effectiveVariant === 'danger' ? 'alert' : 'status'}
    >
      <div className={activeConfig.text}>
        {activeConfig.icon}
      </div>
      <div className="flex-1 text-[13px] leading-relaxed text-[var(--fha-text)]">
        {title && <h5 className={`font-semibold mb-1 ${activeConfig.text}`}>{title}</h5>}
        <div className="opacity-90">{content}</div>
      </div>
    </div>
  );
}
