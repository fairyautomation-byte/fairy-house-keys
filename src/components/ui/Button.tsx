import React, { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'outline';
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
  const baseStyles = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-fha',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--fha-brand)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-md',
  };

  const variantStyles = {
    primary: 'bg-[var(--fha-brand)] text-white hover:bg-[var(--fha-brand-hover)] active:bg-[var(--fha-brand-active)]',
    secondary: 'bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:bg-[var(--fha-surface-2)] active:bg-[var(--fha-surface-3)]',
    outline: 'bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:bg-[var(--fha-surface-2)] active:bg-[var(--fha-surface-3)]',
    ghost: 'bg-transparent text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] active:bg-[var(--fha-surface-3)]',
    danger: 'bg-[var(--fha-error)] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D]',
    link: 'bg-transparent text-[var(--fha-brand)] hover:underline p-0 h-auto',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'brand'} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
