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
  const baseStyles = 'rounded-3xl bg-fha-glass backdrop-blur-xl border transition-all duration-200';
  
  const variantStyles = {
    default: 'border-fha-glass-border shadow-fha-outset',
    interactive: 'border-fha-glass-border shadow-fha-outset hover:shadow-fha-lg hover:border-fha-cyan-border hover:bg-fha-surface/60 cursor-pointer active:shadow-fha-inset active:translate-y-[2px]',
    highlight: 'border-fha-cyan shadow-fha-cyan bg-fha-cyan/10'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const Component = onClick ? 'button' : 'div';
  const buttonProps = onClick ? { onClick, className: `w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fha-cyan ${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}` } : {};
  const divProps = !onClick ? { className: `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}` } : {};

  return (
    <Component {...(onClick ? buttonProps : divProps)}>
      {children}
    </Component>
  );
}
