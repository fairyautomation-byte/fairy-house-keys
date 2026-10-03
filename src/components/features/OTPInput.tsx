'use client';
import React, { useRef, KeyboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (val: string) => void;
}

export default function OTPInput({ length = 6, value, onChange, disabled = false, error = false, onComplete }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const checkComplete = (newVal: string) => {
    if (newVal.length === length && onComplete) {
      onComplete(newVal);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous and clear
        inputsRef.current[index - 1]?.focus();
        
        const newValue = value.split('');
        newValue[index - 1] = '';
        const finalVal = newValue.join('');
        onChange(finalVal);
      } else {
        // Clear current
        const newValue = value.split('');
        newValue[index] = '';
        const finalVal = newValue.join('');
        onChange(finalVal);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    
    const val = e.currentTarget.value.replace(/[^0-9]/g, '');
    if (!val) return;

    // Handle paste multiple digits at once or single digit
    const digits = val.split('').slice(0, length - index);
    
    const newValue = value.padEnd(length, ' ').split('');
    digits.forEach((digit, i) => {
      newValue[index + i] = digit;
    });
    
    const updatedValue = newValue.join('').replace(/\s/g, '');
    onChange(updatedValue);
    checkComplete(updatedValue);
    
    // Focus next empty input or last input
    if (updatedValue.length < length) {
      inputsRef.current[updatedValue.length]?.focus();
    } else {
      inputsRef.current[length - 1]?.focus();
      inputsRef.current[length - 1]?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '').slice(0, length);
    if (!pastedData) return;
    
    onChange(pastedData);
    checkComplete(pastedData);
    
    if (pastedData.length === length) {
      inputsRef.current[length - 1]?.focus();
      inputsRef.current[length - 1]?.blur();
    } else {
      inputsRef.current[pastedData.length]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || '';
        return (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length} // Allow paste of full length
            value={digit}
            onChange={(e) => handleInput(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-fha bg-white border transition-all outline-none
              ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)]' : 'text-[var(--fha-text)]'}
              ${error ? 'border-[var(--fha-error)] focus:border-[var(--fha-error)] focus:ring-2 focus:ring-[var(--fha-error-border)] focus:ring-offset-0' : 'border-[var(--fha-border-strong)] focus:border-[var(--fha-brand)] focus:ring-2 focus:ring-[var(--fha-brand-soft-border)] focus:ring-offset-0'}
              ${digit && !error ? 'border-[var(--fha-brand)] text-[var(--fha-brand)]' : ''}
            `}
            aria-label={`Ký tự OTP thứ ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
