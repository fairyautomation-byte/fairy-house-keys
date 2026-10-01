import React from 'react';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-fha-surface-2 animate-shimmer rounded-fha-radius ${className}`} />
  );
}
