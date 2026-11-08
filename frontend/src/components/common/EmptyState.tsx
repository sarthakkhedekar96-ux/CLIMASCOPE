import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Layers,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 rounded-2xl border border-dashed border-[#C8DEC2] bg-[#F5F7F2] flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[#EDF5E9] border border-[#C8DEC2] flex items-center justify-center text-[#32A817]">
        <Icon className="w-6 h-6 text-[#32A817]" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-[#17251A] font-sans">{title}</h3>
        <p className="text-xs text-[#667568] font-sans leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-[#32A817] hover:bg-[#268A12] text-white text-xs font-semibold shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
