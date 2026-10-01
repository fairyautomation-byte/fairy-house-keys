import React from 'react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number; // percentage
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export default function StatCard({ label, value, icon, trend, loading = false, className = '' }: StatCardProps) {
  return (
    <Card className={`flex flex-col ${className}`} padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-fha-text-muted">
          {label}
        </h3>
        {icon && (
          <div className="text-fha-text-faint">
            {icon}
          </div>
        )}
      </div>
      
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold text-fha-text">
            {value}
          </div>
          {trend && (
            <div className={`text-xs font-medium ${trend.isPositive ? 'text-fha-success-text' : 'text-fha-error-text'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
