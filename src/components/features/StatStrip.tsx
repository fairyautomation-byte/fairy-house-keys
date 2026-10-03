import React from 'react';
import Skeleton from '../ui/Skeleton';

interface StatItem {
  label: string;
  value: React.ReactNode;
  highlight?: 'warning' | 'success' | 'none';
  loading?: boolean;
}

interface StatStripProps {
  items: StatItem[];
  className?: string;
}

export default function StatStrip({ items, className = '' }: StatStripProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(items.length, 4)} divide-x divide-y lg:divide-y-0 divide-[var(--fha-border)] bg-white border border-[var(--fha-border)] rounded-fha-lg overflow-hidden ${className}`}>
      {items.map((item, idx) => {
        // Highlight bg
        const bgClass = item.highlight === 'warning' ? 'bg-[var(--fha-warning-bg)]' : 
                        item.highlight === 'success' ? 'bg-[var(--fha-success-bg)]' : 'bg-white';
        
        const textClass = item.highlight === 'warning' ? 'text-[var(--fha-warning)]' : 
                          item.highlight === 'success' ? 'text-[var(--fha-success)]' : 'text-[var(--fha-text)]';

        return (
          <div key={idx} className={`p-4 sm:p-5 flex flex-col justify-center ${bgClass}`}>
            <h3 className="text-[13px] font-medium text-[var(--fha-text-muted)] mb-1.5">
              {item.label}
            </h3>
            {item.loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-bold ${textClass}`}>
                {item.value}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
