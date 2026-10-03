'use client';
import React, { useState } from 'react';
import { useToast } from './ToastProvider';

interface CopyFieldProps {
  value: string;
  label?: string;
  mask?: boolean;
}

export default function CopyField({ value, label, mask = false }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = mask ? value.slice(0, 4) + '****' + value.slice(-4) : value;

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)]">
      <div className="flex flex-col min-w-0">
        {label && <span className="text-xs text-[var(--fha-text-muted)] mb-0.5">{label}</span>}
        <span className="font-mono text-[13px] text-[var(--fha-text)] truncate select-all">{displayValue}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] hover:bg-[var(--fha-brand-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
        aria-label="Sao chép"
        title="Sao chép"
      >
        {copied ? (
          <svg className="w-4 h-4 text-[var(--fha-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
