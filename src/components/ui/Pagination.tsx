import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show max 5 pages, centered around current if possible
  let visiblePages = pages;
  if (totalPages > 5) {
    if (currentPage <= 3) {
      visiblePages = [...pages.slice(0, 5), -1]; // -1 represents ellipsis
    } else if (currentPage >= totalPages - 2) {
      visiblePages = [-1, ...pages.slice(totalPages - 5)];
    } else {
      visiblePages = [-1, ...pages.slice(currentPage - 2, currentPage + 1), -1];
    }
  }

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-fha-sm text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
        aria-label="Trang trước"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {visiblePages.map((page, index) => {
        if (page === -1) {
          return (
            <span key={`ellipsis-${index}`} className="px-1 py-1 text-[var(--fha-text-faint)]">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-fha-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]
              ${currentPage === page 
                ? 'bg-[var(--fha-brand-soft)] border border-[var(--fha-brand-soft-border)] text-[var(--fha-brand)]' 
                : 'text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] hover:text-[var(--fha-text)] border border-transparent'
              }`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-fha-sm text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
        aria-label="Trang sau"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
