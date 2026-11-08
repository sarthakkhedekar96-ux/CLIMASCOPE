import React, { useState } from 'react';
import { Settings, Sliders, Database, Satellite, Bell, CheckCircle2, RefreshCw } from 'lucide-react';
import { HealthStatus } from '../../types/api';

interface SettingsViewProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health, onRefreshHealth }) => {
  const [targetCanopyStandard, setTargetCanopyStandard] = useState(35);
  const [heatAlertThreshold, setHeatAlertThreshold] = useState(38.0);
  const [runoffAlertThreshold, setRunoffAlertThreshold] = useState(0.70);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin bg-[#F5F7F2] text-[#17251A]">
      {/* Header Banner */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EDF5E9] text-[#073B1A] border border-[#C8DEC2] tracking-wide">
              CONFIGURATION & AUDIT
            </span>
            <span className="text-[#C8DEC2] text-xs">•</span>
            <span className="text-xs text-[#667568] font-medium">
              System & Satellite Pipeline Parameters
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#073B1A] tracking-tight">
            Platform Settings & Biophysical Calibrations
          </h1>
          <p className="text-xs text-[#667568] mt-1 max-w-2xl leading-relaxed">
            Configure telemetry acquisition frequencies, spatial parameters, and municipal climate alert thresholds.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#32A817] hover:bg-[#288712] text-white text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-white" /> : null}
          <span>{saved ? 'Settings Saved' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Telemetry & Satellite Pipeline Settings */}
        <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
            <span className="font-semibold text-[#073B1A] flex items-center gap-2 text-sm">
              <Satellite className="w-4 h-4 text-[#32A817]" />
              Earth Observation Pipeline
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Active Sync
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div>
                <div className="font-bold text-[#073B1A]">Copernicus Sentinel-2 MSI</div>
                <div className="text-[11px] text-[#667568] mt-0.5">Surface Reflectance (NDVI, NDBI) 10m Resolution</div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                5-Day Revisit
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div>
                <div className="font-bold text-[#073B1A]">USGS Landsat-8/9 TIRS</div>
                <div className="text-[11px] text-[#667568] mt-0.5">Land Surface Temperature (LST) Band 10 Calibrated</div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                16-Day Revisit
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div>
                <div className="font-bold text-[#073B1A]">PMC Ground Micro-Stations</div>
                <div className="text-[11px] text-[#667568] mt-0.5">In-Situ Humidity, Air Temp & PM2.5 Telemetry</div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
                15-Min Ingestion
              </span>
            </div>
          </div>
        </div>

        {/* Municipal Resilience Thresholds */}
        <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
            <span className="font-semibold text-[#073B1A] flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4 text-[#32A817]" />
              Municipal Threshold Calibrations
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              PMC Decree
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#17251A] font-medium">Target Canopy Standard:</span>
                <span className="font-bold text-[#073B1A]">{targetCanopyStandard}% Coverage</span>
              </div>
              <input
                type="range"
                min={20}
                max={50}
                value={targetCanopyStandard}
                onChange={(e) => setTargetCanopyStandard(Number(e.target.value))}
                className="w-full accent-[#32A817] h-2 bg-[#E1E9DF] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#17251A] font-medium">Surface Heatwave Alert Trigger:</span>
                <span className="font-bold text-red-700">{heatAlertThreshold.toFixed(1)}°C LST</span>
              </div>
              <input
                type="range"
                min={34}
                max={44}
                step={0.5}
                value={heatAlertThreshold}
                onChange={(e) => setHeatAlertThreshold(Number(e.target.value))}
                className="w-full accent-red-600 h-2 bg-[#E1E9DF] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#17251A] font-medium">Stormwater Runoff Warning Coefficient:</span>
                <span className="font-bold text-[#073B1A]">{runoffAlertThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.50}
                max={0.95}
                step={0.05}
                value={runoffAlertThreshold}
                onChange={(e) => setRunoffAlertThreshold(Number(e.target.value))}
                className="w-full accent-[#32A817] h-2 bg-[#E1E9DF] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Database & Spatial Engine Diagnostics */}
        <div className="md:col-span-2 bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs shadow-card">
          <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3 mb-4">
            <span className="font-semibold text-[#073B1A] flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-emerald-700" />
              Spatial & Telemetry Engine Status
            </span>
            <button
              onClick={onRefreshHealth}
              className="flex items-center gap-1.5 text-xs text-[#32A817] hover:text-[#288712] font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ping Telemetry</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div className="text-[11px] text-[#667568] font-medium">Database Status</div>
              <div className="text-emerald-800 font-bold mt-1 text-sm">
                {health?.database_connected ? 'Connected (Online)' : 'Offline'}
              </div>
            </div>
            <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div className="text-[11px] text-[#667568] font-medium">Active Wards</div>
              <div className="text-[#073B1A] font-bold mt-1 text-sm">
                {health?.active_wards_count || 7} Registered
              </div>
            </div>
            <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div className="text-[11px] text-[#667568] font-medium">Projection Datum</div>
              <div className="text-[#073B1A] font-bold mt-1 text-sm">EPSG:4326 (WGS 84)</div>
            </div>
            <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl">
              <div className="text-[11px] text-[#667568] font-medium">Core Version</div>
              <div className="text-[#17251A] font-bold mt-1 text-sm">{health?.version || '1.4.0'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
