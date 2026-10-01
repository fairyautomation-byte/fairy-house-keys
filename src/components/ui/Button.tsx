import React, { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-fha-radius transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fha-cyan disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base'
  };

  const variantStyles = {
    primary: 'bg-fha-cyan text-white shadow-fha-cyan hover:bg-fha-cyan-hover hover:shadow-fha-glow active:bg-fha-cyan-deep',
    secondary: 'bg-fha-surface-3 text-fha-text border border-fha-border hover:bg-fha-surface-2',
    ghost: 'bg-transparent text-fha-text hover:bg-fha-surface-3',
    danger: 'bg-fha-error text-white hover:bg-red-600',
    link: 'bg-transparent text-fha-cyan hover:underline p-0'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'cyan'} className="mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
