import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'highlight';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick
}: CardProps) {
  const baseStyles = 'rounded-fha-lg bg-white border transition-all duration-150';
  
  const variantStyles = {
    default: 'border-[var(--fha-border)]',
    interactive: 'border-[var(--fha-border)] hover:border-[var(--fha-border-strong)] hover:shadow-fha-md cursor-pointer active:bg-[var(--fha-surface-2)]',
    highlight: 'border-[var(--fha-brand)] shadow-fha-sm bg-[var(--fha-brand-soft)]/30'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8'
  };

  const Component = onClick ? 'button' : 'div';
  
  if (onClick) {
    return (
      <button 
        type="button"
        onClick={onClick}
        className={`w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--fha-brand)] ${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}

// ── Subcomponents for structured cards ──
export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-4 sm:px-5 py-4 border-b border-[var(--fha-border)] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-4 sm:px-5 py-3 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] rounded-b-fha-lg ${className}`}>
      {children}
    </div>
  );
}
