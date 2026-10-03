import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'trial' | 'muted' | 'neutral' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = ''
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-fha-sm whitespace-nowrap border';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[var(--fha-surface-2)] text-[var(--fha-text)] border-[var(--fha-border)]',
    neutral: 'bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)] border-[var(--fha-border)]',
    success: 'bg-[var(--fha-success-bg)] text-[var(--fha-success-text)] border-[var(--fha-success-border)]',
    warning: 'bg-[var(--fha-warning-bg)] text-[var(--fha-warning-text)] border-[var(--fha-warning-border)]',
    error:   'bg-[var(--fha-error-bg)] text-[var(--fha-error-text)] border-[var(--fha-error-border)]',
    danger:  'bg-[var(--fha-error-bg)] text-[var(--fha-error-text)] border-[var(--fha-error-border)]',
    info:    'bg-[var(--fha-info-bg)] text-[var(--fha-info-text)] border-[var(--fha-info-border)]',
    trial:   'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]',
    muted:   'bg-[var(--fha-surface-3)] text-[var(--fha-text-muted)] border-[var(--fha-border-strong)]'
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${variant === 'default' || variant === 'neutral' ? 'bg-[var(--fha-text-muted)]' : 'bg-current'}`} />
      )}
      {children}
    </span>
  );
}
