import React, { InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
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
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--fha-text-muted)]">
          {label} {props.required && <span className="text-[var(--fha-error)]">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fha-text-faint)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={`w-full bg-white border text-base md:text-sm rounded-fha text-[var(--fha-text)] placeholder-[var(--fha-text-faint)]
            transition-colors duration-150 h-10
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[var(--fha-brand)] focus:ring-[var(--fha-brand-soft-border)]
            disabled:opacity-50 disabled:bg-[var(--fha-surface-2)] disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'pl-3'} 
            ${rightIcon ? 'pr-10' : 'pr-3'} 
            ${error 
              ? 'border-[var(--fha-error)] focus:border-[var(--fha-error)] focus:ring-[var(--fha-error-border)]' 
              : 'border-[var(--fha-border-strong)]'
            }`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fha-text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-[13px] text-[var(--fha-error)]" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-[var(--fha-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
