'use client';
import React, { useRef, KeyboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, disabled = false, error = false }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous and clear
        inputsRef.current[index - 1]?.focus();
        
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
      } else {
        // Clear current
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
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
                w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl bg-fha-bg shadow-fha-inset transition-all outline-none border-none
                ${disabled ? 'opacity-50 cursor-not-allowed text-fha-text-muted' : 'text-fha-text'}
                ${error ? 'ring-1 ring-fha-error focus:ring-1 focus:ring-fha-error shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'focus:ring-1 focus:ring-fha-cyan'}
                ${digit && !error ? 'text-fha-cyan ring-1 ring-fha-cyan/30' : ''}
              `}
            aria-label={`OTP digit ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
