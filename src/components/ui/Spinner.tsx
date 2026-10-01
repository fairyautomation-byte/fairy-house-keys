import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'white' | 'muted';
  className?: string;
}

export default function Spinner({ size = 'md', color = 'cyan', className = '' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-8 h-8 border-4'
  };

  const colorStyles = {
    cyan: 'border-fha-cyan/20 border-t-fha-cyan',
    white: 'border-white/20 border-t-white',
    muted: 'border-fha-text-faint/20 border-t-fha-text-faint'
  };

  return (
    <div 
      className={`rounded-full animate-spin ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
