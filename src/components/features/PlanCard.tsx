import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrencyShort } from '@/lib/format';

export interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: string;
  scanLimit: string;
  features: string[];
  popular?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  onSelect: (id: string) => void;
  selected?: boolean;
  highlighted?: boolean;
  /**
   * marketing: large card for landing page
   * in-app: compact card for dashboard store
   * radio: minimal horizontal layout for checkout
   */
  layout?: 'marketing' | 'in-app' | 'radio';
  disabled?: boolean;
  actionText?: string;
}

export default function PlanCard({ 
  plan, 
  onSelect, 
  selected = false, 
  highlighted = false,
  layout = 'marketing',
  disabled = false,
  actionText
}: PlanCardProps) {
  const isHighlighted = highlighted || selected || plan.popular;
  
  if (layout === 'radio') {
    return (
      <div 
        onClick={() => !disabled && onSelect(plan.id)}
        className={`flex items-center gap-4 p-4 rounded-fha-lg border transition-all cursor-pointer select-none
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--fha-surface-2)] border-[var(--fha-border)]' : ''}
          ${selected && !disabled ? 'border-[var(--fha-brand)] bg-[var(--fha-brand-soft)]/30 ring-1 ring-[var(--fha-brand)]' : ''}
          ${!selected && !disabled ? 'border-[var(--fha-border)] hover:border-[var(--fha-border-strong)] bg-white' : ''}
        `}
      >
        <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
          ${selected ? 'border-[var(--fha-brand)] bg-[var(--fha-brand)]' : 'border-[var(--fha-border-strong)] bg-white'}
        `}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-[var(--fha-text)]">{plan.name}</h4>
            {plan.popular && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] rounded-sm">
                Phổ biến
              </span>
            )}
          </div>
          <div className="text-[13px] text-[var(--fha-text-muted)] line-clamp-1">
            {plan.duration} • {plan.scanLimit}
          </div>
        </div>
        
        <div className="shrink-0 text-right">
          <div className="font-bold font-mono text-[var(--fha-text)]">
            {plan.price === 0 ? 'Miễn phí' : formatCurrencyShort(plan.price)}
          </div>
        </div>
      </div>
    );
  }

  // layout === 'marketing' || 'in-app'
  const isMarketing = layout === 'marketing';

  return (
    <Card 
      variant="default" 
      padding="none" 
      className={`relative flex flex-col h-full overflow-hidden transition-colors duration-200
        ${isHighlighted ? 'border-[var(--fha-brand)] ring-1 ring-[var(--fha-brand)]' : 'border-[var(--fha-border)] hover:border-[var(--fha-border-strong)]'}
        ${disabled ? 'opacity-60 grayscale-[0.5]' : ''}
      `}
    >
      {/* Top Banner for Popular/Selected */}
      {isHighlighted && (
        <div className={`w-full py-1.5 text-center text-[11px] font-bold uppercase tracking-wider ${selected ? 'bg-[var(--fha-success-bg)] text-[var(--fha-success-text)]' : 'bg-[var(--fha-brand)] text-white'}`}>
          {selected ? 'Đang chọn' : 'Phổ biến nhất'}
        </div>
      )}

      <div className={`p-5 sm:p-6 border-b ${isHighlighted ? 'border-[var(--fha-brand-soft-border)] bg-[var(--fha-brand-soft)]/30' : 'border-[var(--fha-border)] bg-[var(--fha-surface-2)]/50'}`}>
        <h3 className="text-lg font-bold text-[var(--fha-text)] mb-2">{plan.name}</h3>
        <div className="flex items-end gap-2">
          <div className={`text-[28px] leading-none font-bold tabular-nums tracking-tight ${isHighlighted ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text)]'}`}>
            {plan.price === 0 ? 'Miễn phí' : formatCurrencyShort(plan.price)}
          </div>
          {plan.originalPrice && (
            <div className="text-sm text-[var(--fha-text-faint)] line-through font-mono mb-1">
              {formatCurrencyShort(plan.originalPrice)}
            </div>
          )}
        </div>
        <p className="text-sm text-[var(--fha-text-muted)] mt-2 font-medium">{plan.duration}</p>
      </div>
      
      <div className="p-5 sm:p-6 flex-1 flex flex-col bg-white">
        <ul className={`space-y-3 mb-8 flex-1 ${isMarketing ? '' : 'text-[13px]'}`}>
          <li className="flex items-start gap-3">
            <svg className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-faint)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold text-[var(--fha-text)]">{plan.scanLimit}</span>
          </li>
          
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-[var(--fha-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[var(--fha-text-muted)]">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          variant={selected ? 'primary' : isHighlighted ? 'primary' : 'secondary'} 
          fullWidth 
          onClick={() => !disabled && onSelect(plan.id)}
          disabled={disabled}
        >
          {actionText || (selected ? 'Đang chọn' : plan.price === 0 ? 'Dùng Thử' : 'Mua Gói Này')}
        </Button>
      </div>
    </Card>
  );
}
