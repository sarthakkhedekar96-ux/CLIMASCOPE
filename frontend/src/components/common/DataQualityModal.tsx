import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Radio,
  Layers,
  Cpu,
  TrendingUp,
  MapPin,
  X,
  FileCheck,
  RefreshCw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { DataQualitySummary } from '../../types/api';
import { api } from '../../services/api';

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataQualityModal: React.FC<DataQualityModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DataQualitySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    api
      .getDataQualitySummary()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to retrieve data quality summary.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Error connecting to data quality summary endpoint.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#090E1B] border border-[#1A2A47] rounded shadow-2xl p-6 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#18253D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-800 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans tracking-tight">
                Data Provenance & Scientific Quality Summary
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Audited telemetry breakdown across Pune Metropolitan Region (PMR) study areas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              title="Refresh Telemetry Audit"
              className="p-1.5 text-slate-400 hover:text-white rounded border border-[#18253D] hover:bg-[#121E36] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded border border-[#18253D] hover:bg-[#121E36] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading && !data && (
          <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
            AUDITING CLIMATE TELEMETRY METRIC PROVENANCE...
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="space-y-4 font-mono text-xs">
            {/* Disclaimer Alert */}
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-sans leading-relaxed">
                <strong className="font-bold text-amber-300 block mb-0.5">GEOGRAPHICAL DEMARCATION NOTICE:</strong>
                {data.boundary_disclaimer}
              </div>
            </div>

            {/* Geographical Demarcation Status */}
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographic Jurisdiction & Boundaries (7 Study Areas)</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-[#0D1526] border border-[#1A2742] p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">TOTAL STUDY AREAS</div>
                  <div className="text-lg font-bold text-white mt-0.5">{data.total_study_areas}</div>
                  <div className="text-[9px] text-slate-500">PMR Sub-Zones</div>
                </div>

                <div className="bg-[#0D1526] border border-[#1A2742] p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">APPROXIMATE DEMO BOUNDS</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{data.approximate_boundaries_count}</div>
                  <div className="text-[9px] text-amber-400/80">Demonstration Polygons</div>
                </div>

                <div className="bg-[#0D1526] border border-[#1A2742] p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">OFFICIAL LEGAL CADASTRES</div>
                  <div className="text-lg font-bold text-slate-400 mt-0.5">{data.verified_boundaries_count}</div>
                  <div className="text-[9px] text-slate-500">Awaiting Legal Survey Data</div>
                </div>
              </div>

              {/* Jurisdiction Distribution */}
              <div className="mt-2.5 p-2.5 bg-[#0A101F] border border-[#142036] rounded space-y-1.5 text-[11px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  ADMINISTRATIVE JURISDICTION BREAKDOWN:
                </div>
                {Object.entries(data.jurisdictions_breakdown).map(([jurisdiction, count]) => (
                  <div key={jurisdiction} className="flex items-center justify-between text-slate-300">
                    <span className="truncate pr-2">• {jurisdiction}</span>
                    <span className="text-cyan-400 font-bold shrink-0">{count} study {count === 1 ? 'area' : 'areas'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Climate Metrics Provenance Breakdown */}
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Climate Telemetry Classification</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="bg-[#0B171A] border border-emerald-900/60 p-2.5 rounded">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>OBSERVED</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-300 mt-0.5">{data.observed_metrics_count}</div>
                  <div className="text-[9px] text-slate-500">Sentinel-2 & Landsat-8</div>
                </div>

                <div className="bg-[#091522] border border-cyan-900/60 p-2.5 rounded">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>DERIVED</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-300 mt-0.5">{data.derived_metrics_count}</div>
                  <div className="text-[9px] text-slate-500">Debt, NDVI & Runoff</div>
                </div>

                <div className="bg-[#18120B] border border-amber-900/60 p-2.5 rounded">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>SIMULATED</span>
                  </div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">{data.simulated_metrics_count}</div>
                  <div className="text-[9px] text-slate-500">Climate Twin Scenarios</div>
                </div>

                <div className="bg-[#150F1E] border border-purple-900/60 p-2.5 rounded">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-purple-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>PROJECTED</span>
                  </div>
                  <div className="text-lg font-bold text-purple-300 mt-0.5">{data.projected_metrics_count}</div>
                  <div className="text-[9px] text-slate-500">CMIP6 SSP Scenarios</div>
                </div>
              </div>
            </div>

            {/* Quality & Integrity Checks */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-[#0C1322] border border-[#16233B] rounded flex items-center justify-between">
                <span className="text-slate-400">Missing Source Metadata:</span>
                <span className={`font-bold ${data.missing_source_count === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.missing_source_count} Records
                </span>
              </div>

              <div className="p-2.5 bg-[#0C1322] border border-[#16233B] rounded flex items-center justify-between">
                <span className="text-slate-400">Unverified Observations:</span>
                <span className={`font-bold ${data.unverified_measurements_count === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data.unverified_measurements_count} Records
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#18253D] pt-3 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            CLIMASCOPE SCIENTIFIC INTEGRITY PROTOCOL v1.0 • PUNE REGION
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#121E36] hover:bg-[#1A2A4A] text-white border border-[#203457] rounded text-xs font-mono font-bold transition-all"
          >
            CLOSE AUDIT
          </button>
        </div>
      </div>
    </div>
  );
};
