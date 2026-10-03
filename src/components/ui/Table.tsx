import React, { useState } from 'react';
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
  density?: 'compact' | 'normal';
  /**
   * If provided, on screens < 640px, the table will render as a list of cards
   * using this function for each item.
   */
  mobileRender?: (item: T, index: number) => React.ReactNode;
}

export default function Table<T>({ 
  columns, 
  data, 
  loading = false, 
  emptyState, 
  onRowClick, 
  rowKey,
  className = '',
  density = 'normal',
  mobileRender
}: TableProps<T>) {
  
  const pyClass = density === 'compact' ? 'py-2.5' : 'py-3.5';
  
  if (loading && data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full border-b border-[var(--fha-border)] py-3 flex gap-4 px-4 bg-[var(--fha-surface-2)]">
          {columns.map((col, i) => (
            <div key={i} style={{ width: col.width || '100%', flex: col.width ? 'none' : 1 }}>
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-full border-b border-[var(--fha-border)] ${pyClass} flex items-center gap-4 px-4`}>
            {columns.map((col, j) => (
              <div key={j} style={{ width: col.width || '100%', flex: col.width ? 'none' : 1 }}>
                <Skeleton className="h-4 w-full" />
              </div>
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
    <div className={`w-full ${className}`}>
      {/* Mobile Card View */}
      {mobileRender && (
        <div className="block sm:hidden flex flex-col gap-3">
          {data.map((item, index) => (
            <div 
              key={rowKey(item)}
              onClick={() => onRowClick?.(item)}
              className={`bg-white border border-[var(--fha-border)] p-4 rounded-fha-lg ${onRowClick ? 'cursor-pointer active:bg-[var(--fha-surface-2)]' : ''}`}
            >
              {mobileRender(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`w-full overflow-x-auto ${mobileRender ? 'hidden sm:block' : ''}`}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--fha-surface-2)] border-y border-[var(--fha-border)]">
            <tr>
              {columns.map((col) => (
                <th 
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`px-4 py-2.5 font-medium text-[13px] text-[var(--fha-text-muted)] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                  className={`bg-white border-b border-[var(--fha-border)] transition-colors
                    ${isClickable ? 'cursor-pointer hover:bg-[var(--fha-surface-2)]' : 'hover:bg-[var(--fha-surface-2)]'}`}
                >
                  {columns.map((col) => (
                    <td 
                      key={String(col.key)}
                      style={{ width: col.width }}
                      className={`px-4 ${pyClass} text-[14px] text-[var(--fha-text)] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
    </div>
  );
}
