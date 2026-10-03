'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PlanCard, { Plan } from './PlanCard';
import Skeleton from '../ui/Skeleton';

const STATIC_PLANS: Plan[] = [
  {
    id: 'trial',
    name: '3 Ngày Dùng Thử',
    price: 0,
    duration: '3 ngày',
    scanLimit: '100 lượt scan / ngày',
    features: ['Sử dụng 1 thiết bị', 'Hỗ trợ cơ bản'],
  },
  {
    id: 'monthly',
    name: '1 Tháng',
    price: 69000,
    duration: '30 ngày',
    scanLimit: '1.000 lượt scan / ngày',
    features: ['Sử dụng 1 thiết bị', 'Hỗ trợ tiêu chuẩn', 'Kích hoạt tự động'],
  },
  {
    id: 'quarterly',
    name: '3 Tháng',
    price: 179000,
    duration: '90 ngày',
    scanLimit: '3.000 lượt scan / ngày',
    features: ['Sử dụng 1 thiết bị', 'Hỗ trợ tiêu chuẩn', 'Kích hoạt tự động'],
    popular: true,
  },
  {
    id: 'yearly',
    name: '1 Năm',
    price: 479000,
    duration: '365 ngày',
    scanLimit: 'Không giới hạn scan',
    features: ['Sử dụng 1 thiết bị', 'Hỗ trợ ưu tiên 24/7', 'Kích hoạt tự động'],
  }
];

export default function LandingPricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from API when ready, fallback to static for now
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        } else {
          setPlans(STATIC_PLANS);
        }
      } catch (err) {
        setPlans(STATIC_PLANS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);

  const handleSelect = (id: string) => {
    window.location.href = `/register?plan=${id}`;
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onSelect={handleSelect} 
        />
      ))}
    </div>
  );
}
