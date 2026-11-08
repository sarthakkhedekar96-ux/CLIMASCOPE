import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'CONNECTING TO CLIMATE INTELLIGENCE ENGINE...',
}) => {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-[#070B14]/80">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
      <div className="font-mono text-xs font-semibold tracking-widest text-cyan-400">
        {message}
      </div>
      <div className="font-mono text-[10px] text-slate-500 mt-1">
        SYNCHRONIZING POSTGIS LAYERS & RADIOMETRIC SENSORS
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Failed to load climate telemetry.', onRetry }) => {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-[#070B14]">
      <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/80 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div className="font-mono text-xs font-bold text-red-400 tracking-wider mb-1">
        TELEMETRY ACQUISITION FAILURE
      </div>
      <div className="text-xs text-slate-400 max-w-md mb-4 font-mono">
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#131F33] hover:bg-[#1A2C4A] border border-[#23385C] text-xs font-mono font-medium text-cyan-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RETRY CONNECTION
        </button>
      )}
    </div>
  );
};
