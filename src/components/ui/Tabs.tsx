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
    <div className={`flex overflow-x-auto border-b border-fha-border no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-2 py-3 px-1 mr-6 text-[13px] font-medium transition-colors whitespace-nowrap
              ${isActive ? 'text-fha-cyan' : 'text-fha-text-muted hover:text-fha-text'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fha-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-fha-bg rounded-t-sm
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${isActive ? 'bg-fha-cyan-muted text-fha-cyan' : 'bg-fha-surface-3 text-fha-text-muted'}`}>
                {tab.count}
              </span>
            )}
            
            {/* Active Indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fha-cyan" />
            )}
          </button>
        );
      })}
    </div>
  );
}
