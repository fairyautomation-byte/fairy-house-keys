import React from 'react';
import Badge from '../ui/Badge';
import { formatStatus, getStatusVariant } from '@/lib/format';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export default function StatusBadge({ status, className = '', size = 'sm', dot = true }: StatusBadgeProps) {
  // If it's a known mapping, use format.ts
  const label = formatStatus(status);
  
  // Use getStatusVariant, but fallback if not found
  let variant = getStatusVariant(status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';
  
  // Handling some legacy statuses not in the main format.ts map just in case
  if (variant === 'neutral' && !label.includes(' ')) {
    const s = status.toUpperCase();
    if (s === 'SUCCESS' || s === 'APPROVED') variant = 'success';
    if (s === 'FAILED' || s === 'REJECTED') variant = 'danger';
    if (s === 'WAITING') variant = 'warning';
    if (s === 'TRIAL') variant = 'default';
  }

  return (
    <Badge variant={variant} size={size} dot={dot} className={className}>
      {label}
    </Badge>
  );
}
