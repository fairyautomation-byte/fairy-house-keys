import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-fha-lg border border-[var(--fha-border)] bg-[var(--fha-bg)] ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-fha border border-[var(--fha-border-strong)] bg-white flex items-center justify-center text-[var(--fha-text-faint)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--fha-text)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--fha-text-muted)] max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button variant="secondary" onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
