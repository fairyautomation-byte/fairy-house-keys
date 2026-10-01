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
  const baseStyles = 'rounded-fha-radius-md bg-fha-surface border transition-all duration-200';
  
  const variantStyles = {
    default: 'border-fha-border shadow-fha-md',
    interactive: 'border-fha-border shadow-fha-sm hover:shadow-fha-lg hover:border-fha-cyan-border hover:bg-fha-surface-3 cursor-pointer',
    highlight: 'border-fha-cyan-border shadow-fha-cyan'
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
