import React from 'react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({ title = 'Có lỗi xảy ra', message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-fha-lg bg-[var(--fha-error-bg)] border border-[var(--fha-error-border)] ${className}`}>
      <div className="w-12 h-12 rounded-fha bg-white flex items-center justify-center text-[var(--fha-error)] mb-4 border border-[var(--fha-error-border)]">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[var(--fha-error)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--fha-error)]/80 max-w-md">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry} size="sm">
            Thử lại
          </Button>
        </div>
      )}
    </div>
  );
}
