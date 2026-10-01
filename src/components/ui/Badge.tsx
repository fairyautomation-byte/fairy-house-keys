import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'trial' | 'muted';

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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-fha-radius-sm border uppercase tracking-wider whitespace-nowrap';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]'
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-fha-surface-3 text-fha-text border-fha-border',
    success: 'bg-fha-success-bg text-fha-success-text border-fha-success-border',
    warning: 'bg-fha-warning-bg text-fha-warning-text border-fha-warning-border',
    error: 'bg-fha-error-bg text-fha-error-text border-fha-error-border',
    info: 'bg-fha-info-bg text-fha-info-text border-fha-info-border',
    trial: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    muted: 'bg-slate-500/10 text-fha-text-muted border-slate-500/20'
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${variant === 'default' ? 'bg-fha-text-muted' : 'bg-current'}`} />
      )}
      {children}
    </span>
  );
}
