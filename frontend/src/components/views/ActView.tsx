import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  HardHat,
  DollarSign,
  IndianRupee,
  Calendar,
  ChevronRight,
  Clock,
  ArrowRight,
  Filter,
  ShieldCheck,
  Building,
  Activity,
  Layers,
} from 'lucide-react';
import { WardSummary, Intervention, NavigationTab } from '../../types/api';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { LoadingState } from '../common/LoadingState';
import { formatINR } from '../../utils/formatters';

interface ActViewProps {
  ward: WardSummary | null;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const ActView: React.FC<ActViewProps> = ({ ward, onNavigateTab }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    setLoading(true);
    api
      .getInterventions(ward?.id)
      .then((res) => {
        if (res.success && res.data) {
          setInterventions(res.data);
        }
      })
      .catch((err) => console.error('Act view error:', err))
      .finally(() => setLoading(false));
  }, [ward]);

  const filteredInterventions = useMemo(() => {
    if (statusFilter === 'ALL') return interventions;
    return interventions.filter(
      (itv) => itv.status.toLowerCase().replace(/[\s_]+/g, '') === statusFilter.toLowerCase().replace(/[\s_]+/g, '')
    );
  }, [interventions, statusFilter]);

  const totalCapexINR = useMemo(
    () => interventions.reduce((acc, i) => acc + (i.cost_inr || (i.cost_usd || 0) * 83.5), 0),
    [interventions]
  );

  const activeContractors = useMemo(() => {
    const set = new Set(interventions.map((i) => i.contractor).filter(Boolean));
    return set.size;
  }, [interventions]);

  if (!ward) return null;
  if (loading) return <LoadingState message="LOADING MUNICIPAL WORK ORDERS..." />;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin bg-[#F5F7F2] text-[#17251A] font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#073B1A] bg-[#EDF5E9] border border-[#C8DEC2] px-2.5 py-0.5 rounded-full tracking-wide">
              PHASE 6 • ACT
            </span>
            <span className="text-[#879487] text-xs">•</span>
            <span className="text-[11px] text-[#16A34A] font-semibold bg-[#EDF5E9] border border-[#C8DEC2] px-2 py-0.5 rounded-full">
              {ward.jurisdiction_type === 'PCMC_STUDY_AREA'
                ? 'PCMC Study Area'
                : ward.jurisdiction_type === 'PMR_STUDY_AREA'
                  ? 'PMR Study Area'
                  : 'PMC Study Area'}
            </span>
            <span className="text-[#879487] text-xs">•</span>
            <span className="text-xs text-[#073B1A] font-semibold">
              Municipal Work Orders & Procurement
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#073B1A] tracking-tight">
            Intervention Execution: {ward.name}
          </h1>
          <p className="text-xs text-[#667568] mt-1 max-w-2xl leading-relaxed">
            Active municipal work orders, civil engineering contractor commitments, procurement disbursements, and progress milestones.
          </p>
        </div>

        <div className="bg-[#EDF5E9] border border-[#C8DEC2] rounded-2xl px-4 py-3 text-right shrink-0 shadow-xs">
          <div className="text-[11px] font-semibold text-[#073B1A]">Total Committed Capex</div>
          <div className="text-base font-bold text-[#16A34A] mt-0.5">
            {formatINR(totalCapexINR)}
          </div>
          <div className="text-xs text-[#667568] mt-0.5">
            {interventions.length} Projects • {activeContractors} Contractors
          </div>
        </div>
      </div>

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E1E9DF] p-3 rounded-2xl text-xs shadow-card">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#32A817] shrink-0" />
          <span className="text-[#667568] text-xs font-semibold mr-1">Filter Status:</span>
          {['ALL', 'PROPOSED', 'IN PROGRESS', 'COMPLETED', 'VERIFIED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${statusFilter === st
                  ? 'bg-[#073B1A] text-white shadow-xs'
                  : 'text-[#667568] hover:text-[#17251A] bg-[#F5F7F2] border border-[#E1E9DF]'
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-[#667568] text-xs">
          Showing <strong className="text-[#17251A] font-semibold">{filteredInterventions.length}</strong> of {interventions.length} orders
        </span>
      </div>

      {/* Interventions Execution List */}
      <div className="space-y-3.5">
        {filteredInterventions.map((itv) => {
          const statusLower = itv.status.toLowerCase();
          const statusVariant =
            statusLower.includes('progress')
              ? 'cyan'
              : statusLower.includes('verified')
                ? 'emerald'
                : statusLower.includes('completed')
                  ? 'neutral'
                  : statusLower.includes('approved')
                    ? 'amber'
                    : 'neutral';

          return (
            <div
              key={itv.id}
              className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-3 shadow-card hover:border-[#32A817] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#E1E9DF] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-[#073B1A] bg-[#EDF5E9] border border-[#C8DEC2] px-2 py-0.5 rounded-full text-xs">
                    {itv.intervention_code}
                  </span>
                  <span className="text-[#17251A] font-bold text-sm">{itv.name}</span>
                </div>
                <Badge label={itv.status} variant={statusVariant} pulse={statusLower.includes('progress')} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[#667568] text-[11px] font-semibold">Responsible Authority</div>
                  <div className="font-semibold text-[#17251A] mt-1 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span>
                      {itv.contractor ||
                        (ward.jurisdiction_type === 'PCMC_STUDY_AREA'
                          ? 'PCMC Civil Engineering Dept'
                          : ward.jurisdiction_type === 'PMR_STUDY_AREA'
                            ? 'PMRDA Regional Infrastructure Cell'
                            : 'PMC Civil Works & Drainage')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[#667568] text-[11px] font-semibold">Committed Capex</div>
                  <div className="font-bold text-[#16A34A] mt-1 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>{formatINR(itv.cost_inr || itv.cost_usd * 83.5)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[#667568] text-[11px] font-semibold">Timeline</div>
                  <div className="font-semibold text-[#17251A] mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#32A817] shrink-0" />
                    <span>{itv.timeline_months || 6} Months Delivery</span>
                  </div>
                </div>

                <div>
                  <div className="text-[#667568] text-[11px] font-semibold">Modeled Benefit</div>
                  <div className="font-bold text-[#073B1A] mt-1">
                    -{itv.cooling_effect_celsius}°C LST | -{itv.runoff_reduction_pct}% Runoff
                  </div>
                </div>
              </div>

              <div className="text-[#667568] text-xs bg-[#F5F7F2] p-3.5 rounded-xl border border-[#E1E9DF] leading-relaxed">
                {itv.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action / Next Step CTA */}
      <div className="p-5 bg-white border border-[#E1E9DF] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF5E9] border border-[#C8DEC2] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#073B1A]">Proceed to Post-Implementation Verification</div>
            <div className="text-xs text-[#667568]">
              Verify actual cooling and runoff reductions via satellite/sensor telemetry in the Climate Action Ledger.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab && onNavigateTab('verify')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#32A817] hover:bg-[#288812] text-white font-semibold text-xs rounded-xl transition-all shadow-sm shrink-0 active:scale-98"
        >
          <span>Verify Outcomes (Phase 7)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
