import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex overflow-x-auto border-b border-[var(--fha-border)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-2 py-3 px-1 mr-6 text-[14px] font-medium transition-colors whitespace-nowrap
              ${isActive ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)]'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] focus-visible:ring-offset-2 rounded-t-sm
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] leading-none ${isActive ? 'bg-[var(--fha-brand-soft)] text-[var(--fha-brand)]' : 'bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)]'}`}>
                {tab.count}
              </span>
            )}
            
            {/* Active Indicator */}
            {isActive && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--fha-brand)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
