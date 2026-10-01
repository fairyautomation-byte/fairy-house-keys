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
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-2.5 py-1.5 rounded-fha-radius-sm text-sm font-medium text-fha-text hover:bg-fha-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {visiblePages.map((page, index) => {
        if (page === -1) {
          return (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-fha-text-muted">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-fha-radius-sm text-sm font-medium transition-colors
              ${currentPage === page 
                ? 'bg-fha-surface-3 border-fha-border text-fha-text' 
                : 'text-fha-text-muted hover:bg-fha-surface-3 hover:text-fha-text border border-transparent'
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
        className="px-2.5 py-1.5 rounded-fha-radius-sm text-sm font-medium text-fha-text hover:bg-fha-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors border border-transparent"
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
