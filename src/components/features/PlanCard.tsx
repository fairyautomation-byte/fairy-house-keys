import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

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
}

export default function PlanCard({ plan, onSelect, selected = false, highlighted = false }: PlanCardProps) {
  const isHighlighted = highlighted || selected || plan.popular;
  
  return (
    <Card 
      variant="default" 
      padding="none" 
      className={`relative flex flex-col h-full transition-all duration-300 ${isHighlighted ? 'border-fha-cyan shadow-fha-cyan -translate-y-1' : 'hover:border-fha-border-muted hover:shadow-fha-md'}`}
    >
      {plan.popular && !selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-fha-cyan to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-fha-glow">
          Phổ Biến Nhất
        </div>
      )}
      
      {selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fha-success text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">
          Đang Chọn
        </div>
      )}

      <div className={`p-6 border-b ${isHighlighted ? 'border-fha-cyan/20 bg-fha-cyan/5' : 'border-fha-border bg-fha-surface/50'}`}>
        <h3 className="text-lg font-bold text-fha-text mb-2">{plan.name}</h3>
        <div className="flex items-end gap-2">
          <div className={`text-3xl font-black font-mono tracking-tight ${isHighlighted ? 'text-fha-cyan' : 'text-fha-text'}`}>
            {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
          </div>
          {plan.originalPrice && (
            <div className="text-sm text-fha-text-faint line-through font-mono mb-1">
              {plan.originalPrice.toLocaleString('vi-VN')}đ
            </div>
          )}
        </div>
        <p className="text-sm text-fha-text-muted mt-2">{plan.duration}</p>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <ul className="space-y-3 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <svg className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-fha-cyan' : 'text-fha-text-faint'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-fha-text">{plan.scanLimit}</span>
          </li>
          
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-fha-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-fha-text-muted">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          variant={isHighlighted ? 'primary' : 'secondary'} 
          fullWidth 
          onClick={() => onSelect(plan.id)}
        >
          {selected ? 'Đã Chọn' : plan.price === 0 ? 'Dùng Thử Ngay' : 'Mua Gói Này'}
        </Button>
      </div>
    </Card>
  );
}
