'use client';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--fha-border)]">
      <div>
        <h1 className="text-[22px] md:text-2xl font-bold text-[var(--fha-text)] tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--fha-text-muted)] mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
