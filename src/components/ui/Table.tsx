import React from 'react';
import Skeleton from './Skeleton';

export interface Column<T> {
  key: string | keyof T;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  className?: string;
}

export default function Table<T>({ 
  columns, 
  data, 
  loading = false, 
  emptyState, 
  onRowClick, 
  rowKey,
  className = ''
}: TableProps<T>) {
  
  if (loading && data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full border-b border-fha-border py-3 flex gap-4 px-4">
          {columns.map((col, i) => (
            <Skeleton key={i} className={`h-4 ${col.width || 'flex-1'}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-full border-b border-fha-border-muted py-4 flex gap-4 px-4">
            {columns.map((col, j) => (
              <Skeleton key={j} className={`h-5 ${col.width || 'flex-1'}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState && !loading) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-fha-surface-2 border-b border-fha-border">
          <tr>
            {columns.map((col) => (
              <th 
                key={String(col.key)}
                className={`px-4 py-3 font-medium text-[11px] uppercase tracking-[0.06em] text-fha-text-muted ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.width ? `w-[${col.width}]` : ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const isClickable = !!onRowClick;
            return (
              <tr 
                key={rowKey(item)}
                onClick={() => onRowClick?.(item)}
                className={`bg-fha-surface border-b border-fha-border-muted transition-colors
                  ${isClickable ? 'cursor-pointer hover:bg-fha-surface-3' : 'hover:bg-fha-surface/80'}`}
              >
                {columns.map((col) => (
                  <td 
                    key={String(col.key)}
                    className={`px-4 py-3.5 text-[14px] text-fha-text ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.render 
                      ? col.render(item, index) 
                      : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
