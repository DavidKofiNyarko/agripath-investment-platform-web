'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (animation === 'wave') {
    return (
      <div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ width: '50%' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    <Skeleton variant="rounded" width="100%" height={200} />
    <Skeleton variant="text" width="60%" height={24} />
    <Skeleton variant="text" width="40%" height={20} />
    <Skeleton variant="text" width="80%" height={16} />
  </div>
);

export const SkeletonProjectCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <Skeleton variant="rounded" width="100%" height={192} />
    <div className="p-6 space-y-3">
      <Skeleton variant="text" width="70%" height={24} />
      <Skeleton variant="text" width="50%" height={20} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </div>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton variant="text" width="20%" height={40} />
        <Skeleton variant="text" width="30%" height={40} />
        <Skeleton variant="text" width="25%" height={40} />
        <Skeleton variant="text" width="25%" height={40} />
      </div>
    ))}
  </div>
);

