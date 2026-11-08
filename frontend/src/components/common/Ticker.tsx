import React from 'react';
import { Activity, Flame, Trees, Droplets, Wind, ShieldAlert, Cpu } from 'lucide-react';
import { CityOverviewMetrics } from '../../types/api';

interface TickerProps {
  metrics: CityOverviewMetrics | null;
}

export const Ticker: React.FC<TickerProps> = ({ metrics }) => {
  const items = [
    {
      label: 'MUNI-HEAT-IDX',
      value: metrics ? `${metrics.average_heat_index_celsius.toFixed(1)}°C` : '37.2°C',
      change: '+1.4°C vs 10Y Baseline',
      status: 'warning',
      icon: Flame,
    },
    {
      label: 'PEAK-LST-SURFACE',
      value: metrics ? `${metrics.peak_surface_temp_celsius.toFixed(1)}°C` : '42.4°C',
      change: 'CRITICAL (WRD-01)',
      status: 'critical',
      icon: Activity,
    },
    {
      label: 'CANOPY-DEFICIT',
      value: metrics ? `${metrics.climate_debt.total_canopy_deficit_sq_km.toFixed(1)} km²` : '4.8 km²',
      change: '-18.2% Municipal Gap',
      status: 'warning',
      icon: Trees,
    },
    {
      label: 'CLIMATE-DEBT-AGG',
      value: metrics ? `${metrics.climate_debt.city_average_debt_score.toFixed(1)}/100` : '62.1/100',
      change: `${metrics?.climate_debt.wards_in_critical_debt || 2} Wards Critical`,
      status: 'critical',
      icon: ShieldAlert,
    },
    {
      label: 'STORMWATER-SURGE',
      value: '2.45M m³/yr',
      change: 'HIGH RUNOFF FACTOR',
      status: 'warning',
      icon: Droplets,
    },
    {
      label: 'TELEMETRY-STREAM',
      value: 'SENTINEL-2 / L8',
      change: 'CALIBRATED BOA',
      status: 'normal',
      icon: Cpu,
    },
    {
      label: 'AIR-QUALITY-INDEX',
      value: '58.4 µg/m³',
      change: 'MODERATE AQI',
      status: 'normal',
      icon: Wind,
    },
  ];

  return (
    <div className="w-full bg-[#080E1C] border-y border-[#18253D] px-3 py-1.5 flex items-center overflow-x-auto text-[11px] font-mono scrollbar-none whitespace-nowrap">
      <div className="flex items-center gap-2 pr-4 border-r border-[#1E2D4A] mr-3 text-cyan-400 font-bold shrink-0">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        LIVE TELEMETRY FEED:
      </div>
      <div className="flex items-center gap-6 divide-x divide-[#162238]">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const statusColor =
            item.status === 'critical' ? 'text-red-400' :
            item.status === 'warning' ? 'text-amber-400' :
            'text-emerald-400';

          return (
            <div key={idx} className="flex items-center gap-2 pl-4 shrink-0">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">{item.label}</span>
              <span className="font-bold text-slate-100">{item.value}</span>
              <span className={`text-[10px] ${statusColor}`}>[{item.change}]</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
