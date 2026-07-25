import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: 'w-2.5 h-2.5 border-[1.5px]',
  sm: 'w-3.5 h-3.5 border-2',
  md: 'w-4 h-4 border-2',
  lg: 'w-10 h-10 border-2',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
