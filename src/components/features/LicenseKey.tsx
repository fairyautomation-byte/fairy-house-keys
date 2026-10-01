'use client';
import React, { useState } from 'react';
import { useToast } from '../ui/ToastProvider';

interface LicenseKeyProps {
  value: string;
  showFull?: boolean;
  status?: string;
  className?: string;
}

export default function LicenseKey({ value, showFull = false, status = 'ACTIVE', className = '' }: LicenseKeyProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isInvalid = status === 'EXPIRED' || status === 'REVOKED';
  
  // Format: XXXXX-XXXXX-XXXXX-XXXXX
  const maskKey = (key: string) => {
    if (key.length <= 10) return '****-****';
    const firstGroup = key.substring(0, 5);
    const lastGroup = key.substring(key.length - 5);
    return `${firstGroup}-****-****-${lastGroup}`;
  };

  const displayValue = showFull ? value : maskKey(value);

  const handleCopy = () => {
    if (isInvalid) {
      toast.error('License đã hết hạn hoặc bị thu hồi');
      return;
    }
    
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Đã copy License Key');
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center justify-between bg-fha-surface-2 border rounded-fha-radius overflow-hidden transition-colors ${isInvalid ? 'border-fha-border-muted opacity-60' : 'border-fha-cyan-border'} ${className}`}>
      <div className={`px-4 py-3 flex-1 font-mono text-[15px] font-medium tracking-[0.1em] overflow-hidden text-ellipsis ${isInvalid ? 'text-fha-text-faint line-through' : 'text-fha-text'}`}>
        {displayValue}
      </div>
      
      <button
        onClick={handleCopy}
        disabled={isInvalid}
        className={`px-4 py-3 border-l flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fha-cyan
          ${isInvalid 
            ? 'border-fha-border-muted text-fha-text-faint cursor-not-allowed' 
            : 'border-fha-cyan-border text-fha-cyan hover:bg-fha-cyan-muted hover:text-fha-cyan-hover'
          }
        `}
        aria-label="Copy license key"
      >
        {copied ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>
    </div>
  );
}
