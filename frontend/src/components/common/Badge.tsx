import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'critical' | 'elevated' | 'moderate' | 'stable' | 'cyan' | 'emerald' | 'amber' | 'neutral';
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  pulse = false,
  className = '',
  size = 'md',
}) => {
  const variantStyles = {
    critical: 'bg-red-50 text-[#DC3545] border-red-200 font-semibold',
    elevated: 'bg-amber-50 text-[#B45309] border-amber-200 font-semibold',
    moderate: 'bg-sky-50 text-[#0284C7] border-sky-200 font-semibold',
    stable: 'bg-[#EDF5E9] text-[#16A34A] border-[#C8DEC2] font-semibold',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
    emerald: 'bg-[#EDF5E9] text-[#073B1A] border-[#C8DEC2] font-semibold',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    neutral: 'bg-[#F5F7F2] text-[#667568] border-[#E1E9DF] font-medium',
  };

  const dotColors = {
    critical: 'bg-[#DC3545]',
    elevated: 'bg-[#F59E0B]',
    moderate: 'bg-[#0EA5E9]',
    stable: 'bg-[#16A34A]',
    cyan: 'bg-sky-500',
    emerald: 'bg-[#32A817]',
    amber: 'bg-[#F59E0B]',
    neutral: 'bg-[#879487]',
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-sans border shadow-xs ${sizeStyles} ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      {label}
    </span>
  );
};
