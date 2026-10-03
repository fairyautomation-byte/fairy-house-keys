'use client';
import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Basic focus trap - focus modal on open
      setTimeout(() => {
        if (modalRef.current) modalRef.current.focus();
      }, 10);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'sm:max-w-[480px]',
    md: 'sm:max-w-[640px]',
    lg: 'sm:max-w-[800px]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#111827]/45 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal panel */}
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-t-xl sm:rounded-fha-lg shadow-fha-overlay border border-[var(--fha-border)] flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-fade-in outline-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] p-1.5 rounded-fha transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {title && (
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--fha-border)]">
            <h3 id="modal-title" className="text-lg font-semibold text-[var(--fha-text)] pr-8">
              {title}
            </h3>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] flex flex-col-reverse sm:flex-row justify-end gap-3 sm:rounded-b-fha-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  title = 'Xác nhận',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  danger = false,
  loading = false,
  size = 'sm'
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel || onClose} disabled={loading} fullWidth className="sm:w-auto">
            {cancelText}
          </Button>
          <Button 
            variant={danger ? 'danger' : 'primary'} 
            onClick={onConfirm}
            loading={loading}
            fullWidth className="sm:w-auto"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-[var(--fha-text-muted)] text-[15px] leading-relaxed">
        {message}
      </div>
    </Modal>
  );
}
