import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning' | 'critical';
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'emerald' | 'cyan' | 'amber';
  badge?: string;
  badgeNode?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  changeType = 'neutral',
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
  badgeNode,
  className = '',
  onClick,
}) => {
  const borderStyles = {
    default: 'border-[#E1E9DF] bg-white hover:border-[#C8DEC2] hover:shadow-elevated',
    critical: 'border-red-200 bg-red-50/50 hover:border-red-300',
    emerald: 'border-emerald-200 bg-[#EDF5E9]/60 hover:border-emerald-300',
    cyan: 'border-sky-200 bg-sky-50/50 hover:border-sky-300',
    amber: 'border-amber-200 bg-amber-50/50 hover:border-amber-300',
  };

  const changeColors = {
    positive: 'text-[#16A34A] bg-[#EDF5E9] border-[#C8DEC2]',
    negative: 'text-[#0EA5E9] bg-sky-50 border-sky-200',
    neutral: 'text-[#667568] bg-[#F5F7F2] border-[#E1E9DF]',
    warning: 'text-[#F59E0B] bg-amber-50 border-amber-200',
    critical: 'text-[#DC3545] bg-red-50 border-red-200',
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-card ${borderStyles[variant]} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
        } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#667568] flex items-center gap-1.5 font-sans">
          {Icon && <Icon className="w-4 h-4 text-[#32A817] shrink-0" />}
          {title}
        </span>
        {badgeNode ? (
          badgeNode
        ) : badge ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDF5E9] text-[#073B1A] border border-[#C8DEC2]">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold tracking-tight text-[#17251A] font-sans">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[#667568] font-medium">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 text-xs">
        {subtitle && <span className="text-[#667568] truncate text-[11px] mr-2 font-medium">{subtitle}</span>}
        {change && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-auto ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
