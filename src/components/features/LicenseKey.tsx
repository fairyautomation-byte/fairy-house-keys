'use client';
import React, { useState } from 'react';
import { useToast } from '../ui/ToastProvider';
import { formatLicenseKey, maskKey } from '@/lib/format';

interface LicenseKeyProps {
  value: string;
  defaultVisible?: boolean;
  status?: string;
  className?: string;
}

export default function LicenseKey({ value, defaultVisible = false, status = 'ACTIVE', className = '' }: LicenseKeyProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  const isInvalid = status === 'EXPIRED' || status === 'REVOKED';
  const formattedKey = formatLicenseKey(value);
  const displayValue = visible ? formattedKey : maskKey(formattedKey);

  const handleCopy = () => {
    if (isInvalid) {
      error('License đã hết hạn hoặc bị thu hồi');
      return;
    }
    
    navigator.clipboard.writeText(value);
    setCopied(true);
    success('Đã sao chép License Key');
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-1 bg-white border rounded-fha overflow-hidden transition-colors max-w-full ${isInvalid ? 'border-[var(--fha-border-strong)] bg-[var(--fha-surface-2)] opacity-70' : 'border-[var(--fha-border-strong)] focus-within:border-[var(--fha-brand)] focus-within:ring-1 focus-within:ring-[var(--fha-brand)]'} ${className}`}>
      
      <div className={`pl-4 py-2.5 flex-1 font-mono text-[14px] sm:text-[15px] font-medium tracking-[0.05em] overflow-hidden text-ellipsis ${isInvalid ? 'text-[var(--fha-text-faint)] line-through' : 'text-[var(--fha-text)]'}`}>
        {displayValue}
      </div>
      
      <div className="flex items-center shrink-0 pr-1">
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="p-2 text-[var(--fha-text-faint)] hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--fha-surface-2)] rounded"
          aria-label={visible ? 'Ẩn key' : 'Hiện key'}
          title={visible ? 'Ẩn' : 'Hiện'}
        >
          {visible ? (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-[var(--fha-border)] mx-1" />

        <button
          onClick={handleCopy}
          disabled={isInvalid}
          className={`p-2 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:bg-[var(--fha-brand-soft)] rounded
            ${isInvalid 
              ? 'text-[var(--fha-text-faint)] cursor-not-allowed' 
              : 'text-[var(--fha-brand)] hover:bg-[var(--fha-brand-soft)] hover:text-[var(--fha-brand-hover)]'
            }
          `}
          aria-label="Sao chép"
          title="Sao chép"
        >
          {copied ? (
            <svg className="w-[18px] h-[18px] text-[var(--fha-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
