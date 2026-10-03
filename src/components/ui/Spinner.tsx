import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'white' | 'muted' | 'cyan';
  className?: string;
}

export default function Spinner({ size = 'md', color = 'brand', className = '' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[3px]',
  };

  const colorStyles = {
    brand: 'border-[var(--fha-brand)]/20 border-t-[var(--fha-brand)]',
    cyan: 'border-[var(--fha-brand)]/20 border-t-[var(--fha-brand)]', // legacy alias
    white: 'border-white/30 border-t-white',
    muted: 'border-[var(--fha-text-faint)]/20 border-t-[var(--fha-text-faint)]',
  };

  return (
    <div 
      className={`rounded-full animate-spin ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      role="status"
      aria-label="Đang tải"
    />
  );
}
