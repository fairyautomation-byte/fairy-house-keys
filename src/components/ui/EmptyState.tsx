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
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-fha-radius-md border border-dashed border-fha-border-muted bg-fha-surface/50 ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-fha-surface-2 flex items-center justify-center text-fha-text-muted mb-4 shadow-fha-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-fha-text">{title}</h3>
      {description && (
        <p className="mt-2 text-[13px] text-fha-text-muted max-w-sm">
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
