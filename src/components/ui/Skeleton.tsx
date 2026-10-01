import React from 'react';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-fha-surface/40 animate-shimmer rounded-xl ${className}`} />
  );
}
