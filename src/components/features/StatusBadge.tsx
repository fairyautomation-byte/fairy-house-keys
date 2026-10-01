import React from 'react';
import Badge from '../ui/Badge';

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING' | 'TRIAL' | 'SUCCESS' | 'FAILED' | string;

interface StatusBadgeProps {
  status: LicenseStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, className = '', size = 'sm' }: StatusBadgeProps) {
  let variant: 'success' | 'warning' | 'error' | 'info' | 'trial' | 'muted' | 'default' = 'default';
  let label = status;

  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'SUCCESS':
    case 'PAID':
    case 'APPROVED':
      variant = 'success';
      label = status.toUpperCase() === 'PAID' ? 'Đã Thanh Toán' : status;
      break;
    case 'EXPIRED':
    case 'FAILED':
    case 'REJECTED':
      variant = 'error';
      break;
    case 'REVOKED':
    case 'CANCELED':
      variant = 'muted';
      break;
    case 'PENDING':
    case 'WAITING':
      variant = 'warning';
      break;
    case 'TRIAL':
      variant = 'trial';
      break;
    default:
      variant = 'default';
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
}
