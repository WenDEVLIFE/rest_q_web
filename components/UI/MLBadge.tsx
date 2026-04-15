'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface MLBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  label?: string;
}

export function MLBadge({ size = 'md', variant = 'solid', label = 'ML' }: MLBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    solid: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg shadow-amber-500/50',
    outline: 'border-2 border-amber-500 text-amber-700 font-bold bg-amber-50',
    ghost: 'text-amber-600 font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`}>
      <Zap className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="tracking-widest">{label}</span>
    </div>
  );
}
