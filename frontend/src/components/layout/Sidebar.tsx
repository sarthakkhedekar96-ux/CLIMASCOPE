import React, { useState } from 'react';
import { Layers, Flame, Trees, AlertCircle, ChevronRight, Filter, Search } from 'lucide-react';
import { WardSummary } from '../../types/api';
import { Badge } from '../common/Badge';

interface SidebarProps {
  wards: WardSummary[];
  selectedWardId: number | null;
  onSelectWard: (id: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  wards,
  selectedWardId,
  onSelectWard,
  collapsed = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredWards = wards.filter((w) => {
    const matchesQuery =
      w.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(filterQuery.toLowerCase()) ||
      w.zone.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || w.status_badge === statusFilter;

    return matchesQuery && matchesStatus;
  });

  if (collapsed) {
    return (
      <aside className="w-12 bg-white border-r border-[#E1E9DF] flex flex-col items-center py-3 select-none shrink-0 font-sans shadow-xs">
        <button
          title="Study Areas"
          className="p-2 text-[#32A817] hover:bg-[#EDF5E9] rounded-xl transition-colors"
        >
          <Layers className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white border-r border-[#E1E9DF] flex flex-col h-full select-none shrink-0 font-sans shadow-xs">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#E1E9DF] bg-[#F5F7F2] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#073B1A]">
            <Layers className="w-4 h-4 text-[#32A817]" />
            <span>Study Areas ({wards.length})</span>
          </div>
          <span className="text-[10px] text-[#667568] font-medium">
            By Debt Rank
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#879487] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter area name or zone..."
            className="w-full bg-white border border-[#E1E9DF] focus:border-[#32A817] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#17251A] placeholder-[#879487] outline-none transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-none pt-0.5">
          {['ALL', 'CRITICAL', 'ELEVATED', 'STABLE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#32A817] text-white shadow-xs'
                  : 'text-[#667568] hover:text-[#17251A] bg-white border border-[#E1E9DF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ward Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E1E9DF] scrollbar-thin">
        {filteredWards.map((w) => {
          const isSelected = selectedWardId === w.id;
          const badgeVariant =
            w.status_badge === 'CRITICAL'
              ? 'critical'
              : w.status_badge === 'ELEVATED'
              ? 'elevated'
              : w.status_badge === 'MODERATE'
              ? 'moderate'
              : 'stable';

          return (
            <div
              key={w.id}
              onClick={() => onSelectWard(w.id)}
              className={`p-3 cursor-pointer transition-all flex flex-col gap-1.5 relative ${
                isSelected
                  ? 'bg-[#EDF5E9] border-l-4 border-l-[#32A817]'
                  : 'hover:bg-[#F5F7F2] border-l-4 border-l-transparent'
              }`}
            >
              {/* Top row: Code + Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#667568]">
                  <span className="text-[#073B1A] font-mono font-bold">{w.code}</span>
                  <span className="text-[#879487]">•</span>
                  <span className="truncate max-w-[110px] text-[#667568]">{w.zone}</span>
                </div>
                <Badge label={w.status_badge} size="sm" variant={badgeVariant} />
              </div>

              {/* Name */}
              <div className="text-xs font-bold text-[#17251A] tracking-tight leading-snug">
                {w.name}
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-3 gap-1.5 mt-1 pt-1.5 border-t border-[#E1E9DF] text-[11px]">
                <div className="flex items-center gap-1 text-[#667568]">
                  <Flame className="w-3 h-3 text-[#DC3545] shrink-0" />
                  <span className="font-semibold text-[#17251A]">{w.heat_index_celsius.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center gap-1 text-[#667568]">
                  <Trees className="w-3 h-3 text-[#16A34A] shrink-0" />
                  <span className="font-semibold text-[#17251A]">{w.canopy_cover_pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[#667568] font-mono text-[10.5px]">
                  <span>DEBT:</span>
                  <span className="font-bold text-[#B45309]">{w.climate_debt_score.toFixed(0)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredWards.length === 0 && (
          <div className="p-4 text-center text-xs text-[#879487]">
            No study areas match filter criteria.
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="p-2.5 border-t border-[#E1E9DF] bg-[#F5F7F2] text-[10.5px] text-[#667568] flex items-center justify-between">
        <span>PostGIS Synchronized</span>
        <span className="text-[#16A34A] font-semibold">7 / 7 Online</span>
      </div>
    </aside>
  );
};
