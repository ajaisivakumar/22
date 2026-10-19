import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'primary' | 'auto';
  status?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'auto',
  status,
  size = 'md',
  children,
  ...props
}) => {
  let resolvedVariant = variant;

  if (variant === 'auto' && (status || typeof children === 'string')) {
    const text = (status || (children as string)).toUpperCase();
    if (['OPEN', 'ACTIVE', 'PUBLISHED', 'APPROVED', 'VERIFIED'].includes(text)) {
      resolvedVariant = 'green';
    } else if (['PENDING', 'IN_PROGRESS', 'REVIEW'].includes(text)) {
      resolvedVariant = 'yellow';
    } else if (['CLOSED', 'SUSPENDED', 'REJECTED', 'CANCELLED'].includes(text)) {
      resolvedVariant = 'red';
    } else if (['RESOLVED', 'RETURNED', 'CLAIMED'].includes(text)) {
      resolvedVariant = 'blue';
    } else {
      resolvedVariant = 'gray';
    }
  } else if (variant === 'auto') {
    resolvedVariant = 'gray';
  }

  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-brand-blue border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-red-50 text-primary border-red-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none transition-colors',
        variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.gray,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};
