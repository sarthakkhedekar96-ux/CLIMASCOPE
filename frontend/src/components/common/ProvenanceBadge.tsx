import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  Calendar,
  Radio,
  X,
} from 'lucide-react';
import { ProvenanceCategory } from '../../types/api';

interface ProvenanceBadgeProps {
  category: ProvenanceCategory;
  sourceName?: string;
  sourceUrl?: string;
  acquisitionDate?: string;
  date?: string;
  spatialResolution?: string;
  spatialRes?: string;
  confidenceScore?: number;
  methodology?: string;
  limitations?: string;
  className?: string;
  compact?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  category,
  sourceName,
  sourceUrl,
  acquisitionDate,
  date,
  spatialResolution,
  spatialRes,
  confidenceScore,
  methodology,
  limitations,
  className = '',
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const effectiveDate = acquisitionDate || date;
  const effectiveSpatial = spatialResolution || spatialRes;

  const config = {
    OBSERVED: {
      label: 'OBSERVED',
      bg: 'bg-[#EDF5E9]',
      border: 'border-[#C8DEC2]',
      text: 'text-[#073B1A]',
      dot: 'bg-[#32A817]',
      icon: Radio,
      desc: 'Physical radiometry obtained directly from earth observation satellites or in-situ telemetry.',
    },
    DERIVED: {
      label: 'DERIVED',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      dot: 'bg-[#0EA5E9]',
      icon: Layers,
      desc: 'Biophysical metric computed mathematically from observed multispectral/thermal bands.',
    },
    SIMULATED: {
      label: 'SIMULATED',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-[#F59E0B]',
      icon: Cpu,
      desc: 'Synthetic or modeled estimate generated for scenario simulation or demonstration verification.',
    },
    PROJECTED: {
      label: 'PROJECTED',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      dot: 'bg-purple-600',
      icon: TrendingUp,
      desc: 'Multi-decadal forward climate model estimate under CMIP6 Shared Socioeconomic Pathways.',
    },
    UNVERIFIED: {
      label: 'UNVERIFIED',
      bg: 'bg-[#F5F7F2]',
      border: 'border-[#E1E9DF]',
      text: 'text-[#667568]',
      dot: 'bg-[#879487]',
      icon: AlertTriangle,
      desc: 'Preliminary telemetry record lacking secondary sensor cross-calibration or empirical audit.',
    },
  }[category] || {
    label: category,
    bg: 'bg-[#F5F7F2]',
    border: 'border-[#E1E9DF]',
    text: 'text-[#667568]',
    dot: 'bg-[#879487]',
    icon: Info,
    desc: 'Unclassified telemetry observation.',
  };

  const Icon = config.icon;

  return (
    <div className={`relative inline-block font-sans ${className}`}>
      {/* Clickable Pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails((prev) => !prev);
        }}
        title={`Provenance: ${config.label}. Click to inspect source calibration & methodology.`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all text-[10px] font-semibold select-none cursor-pointer hover:shadow-sm ${
          config.bg
        } ${config.border} ${config.text} ${compact ? 'px-2 py-0 text-[9px]' : ''}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
        <Info className="w-3 h-3 opacity-70 hover:opacity-100" />
      </button>

      {/* Floating Provenance Details Popover */}
      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 right-0 mt-1.5 w-72 bg-white border border-[#E1E9DF] rounded-2xl shadow-elevated p-3.5 text-left font-sans text-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className={`text-xs font-bold ${config.text}`}>
                {config.label} DATA CLASSIFICATION
              </span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-[#879487] hover:text-[#17251A] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-[#667568] leading-relaxed mb-2.5">
            {config.desc}
          </p>

          <div className="space-y-1.5 text-[11px] border-t border-[#E1E9DF] pt-2">
            {sourceName && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#879487] shrink-0 font-medium">SOURCE:</span>
                <span className="text-[#17251A] text-right truncate font-semibold" title={sourceName}>
                  {sourceName}
                </span>
              </div>
            )}

            {effectiveDate && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#879487] shrink-0 font-medium">ACQUIRED:</span>
                <span className="text-[#17251A] font-medium">{effectiveDate}</span>
              </div>
            )}

            {effectiveSpatial && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#879487] shrink-0 font-medium">RESOLUTION:</span>
                <span className="text-[#17251A] font-medium">{effectiveSpatial}</span>
              </div>
            )}

            {confidenceScore !== undefined && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#879487] shrink-0 font-medium">RELIABILITY:</span>
                <span className="text-[#16A34A] font-bold">{confidenceScore.toFixed(1)}% Calibrated</span>
              </div>
            )}

            {methodology && (
              <div className="mt-1 pt-1 border-t border-[#E1E9DF] text-[10.5px] text-[#667568] leading-normal">
                <strong className="text-[#17251A]">Methodology: </strong>
                {methodology}
              </div>
            )}

            {limitations && (
              <div className="mt-1 pt-1 border-t border-[#E1E9DF] text-[10.5px] text-amber-800 leading-normal">
                <strong className="text-amber-900">Limitations: </strong>
                {limitations}
              </div>
            )}
          </div>

          {sourceUrl && (
            <div className="mt-2.5 pt-2 border-t border-[#E1E9DF] flex justify-end">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#32A817] hover:text-[#268A12] font-semibold flex items-center gap-1 hover:underline"
              >
                <span>OPEN DATA CATALOG</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
