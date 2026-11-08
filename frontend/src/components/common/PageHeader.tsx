import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'neutral';
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'emerald',
  icon: Icon,
  actions,
  breadcrumbs,
  className = '',
}) => {
  const badgeStyles = {
    cyan: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-[#EDF5E9] text-[#073B1A] border-[#C8DEC2]',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-[#F5F7F2] text-[#667568] border-[#E1E9DF]',
  };

  return (
    <div className={`bg-white border border-[#E1E9DF] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-[#667568] mb-1.5 font-sans">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#879487]">/</span>}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-[#32A817] transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#17251A] font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-[#EDF5E9] border border-[#C8DEC2] flex items-center justify-center text-[#32A817] shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#073B1A] font-sans">
            {title}
          </h1>
          {badge && (
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs sm:text-sm text-[#667568] mt-1.5 max-w-3xl leading-relaxed font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
