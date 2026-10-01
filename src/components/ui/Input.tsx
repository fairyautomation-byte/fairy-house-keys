import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-fha-text-muted">
          {label} {props.required && <span className="text-fha-error">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fha-text-muted">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`w-full bg-fha-bg border-none shadow-fha-inset text-fha-text text-sm rounded-xl placeholder-fha-text-faint
            transition-all focus:outline-none focus:ring-1 focus:ring-fha-cyan
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-11' : 'pl-4'} 
            ${rightIcon ? 'pr-11' : 'pr-4'} 
            ${error ? 'ring-1 ring-fha-error focus:ring-fha-error' : ''}
            py-3`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fha-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && <p className="text-[13px] text-fha-error" role="alert" aria-live="polite">{error}</p>}
      {hint && !error && <p className="text-[13px] text-fha-text-muted">{hint}</p>}
    </div>
  );
}
