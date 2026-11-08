import React from 'react';
import {
  Flame,
  Trees,
  Droplets,
  Building,
  AlertTriangle,
  Compass,
  MapPin,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { WardSummary, CityOverviewMetrics, NavigationTab } from '../../types/api';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { ClimateDebtEngineCard } from '../common/ClimateDebtEngineCard';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

interface DetectViewProps {
  ward: WardSummary | null;
  overview: CityOverviewMetrics | null;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const DetectView: React.FC<DetectViewProps> = ({ ward, overview, onNavigateTab }) => {
  if (!ward) return null;

  const heatAnomaly = (ward.heat_index_celsius - (overview?.average_heat_index_celsius || 36.0)).toFixed(1);
  const isAboveCityAvg = Number(heatAnomaly) > 0;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin bg-[#F5F7F2] text-[#17251A] font-sans">
      {/* Ward Headline Banner */}
      <PageHeader
        title={`Microclimate Detection: ${ward.name}`}
        subtitle={ward.summary_notes || 'Calibrated biophysical telemetry synthesis for Pune Metropolitan Region study area.'}
        badge={ward.code}
        badgeVariant="cyan"
        icon={Compass}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              label={ward.status_badge}
              variant={
                ward.status_badge === 'CRITICAL'
                  ? 'critical'
                  : ward.status_badge === 'ELEVATED'
                  ? 'elevated'
                  : ward.status_badge === 'MODERATE'
                  ? 'moderate'
                  : 'stable'
              }
            />
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#EDF5E9] border border-[#C8DEC2] text-[#073B1A] font-semibold">
              {ward.jurisdiction_name || ward.zone}
            </span>
          </div>
        }
      />

      {/* Primary Biophysical Indicators Grid with Interactive Epistemic Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Surface Heat Index"
          value={ward.heat_index_celsius.toFixed(1)}
          unit="°C"
          change={`${isAboveCityAvg ? '+' : ''}${heatAnomaly}°C vs City Avg`}
          changeType={isAboveCityAvg ? 'critical' : 'positive'}
          subtitle="USGS Landsat-8 TIRS Band 10"
          icon={Flame}
          variant={ward.heat_index_celsius >= 40 ? 'critical' : 'default'}
          badgeNode={
            <ProvenanceBadge
              category="OBSERVED"
              sourceName="USGS Landsat-8 TIRS Band 10"
              spatialRes="30m Thermal"
              date="2026-03-28"
            />
          }
        />

        <MetricCard
          title="Canopy Coverage"
          value={ward.canopy_cover_pct.toFixed(1)}
          unit="%"
          change={`-${(35.0 - ward.canopy_cover_pct).toFixed(1)}% Deficit`}
          changeType="warning"
          subtitle="Sentinel-2 BOA NDVI"
          icon={Trees}
          variant="default"
          badgeNode={
            <ProvenanceBadge
              category="DERIVED"
              sourceName="Copernicus Sentinel-2 Level-2A"
              spatialRes="10m Optical"
              methodology="Normalized Difference Vegetation Index (NDVI)"
            />
          }
        />

        <MetricCard
          title="Impervious Fraction"
          value={ward.impervious_surface_pct.toFixed(1)}
          unit="%"
          change="Sealed Urban Ground"
          changeType="critical"
          subtitle="Sentinel-2 NDBI Index"
          icon={Building}
          variant="default"
          badgeNode={
            <ProvenanceBadge
              category="DERIVED"
              sourceName="Sentinel-2 BOA Level-2A"
              spatialRes="10m Optical"
              methodology="Normalized Difference Built-up Index (NDBI)"
            />
          }
        />

        <MetricCard
          title="Flood Vulnerability"
          value={(ward.flood_susceptibility_idx * 100).toFixed(0)}
          unit="/ 100"
          change="Storm Surcharge Exposure"
          changeType={ward.flood_susceptibility_idx > 0.7 ? 'critical' : 'warning'}
          subtitle="DEM Hydrology Model"
          icon={Droplets}
          variant={ward.flood_susceptibility_idx > 0.7 ? 'critical' : 'default'}
          badgeNode={
            <ProvenanceBadge
              category="DERIVED"
              sourceName="SRTM DEM & SCS-CN Runoff Model"
              spatialRes="30m Elevation Grid"
              methodology="SCS-CN Runoff & Infiltration Surcharge Modeling"
            />
          }
        />
      </div>

      {/* Core Proprietary Component: CLIMASCOPE Climate Debt Engine */}
      <ClimateDebtEngineCard
        ward={ward}
        onNavigateInvestigate={() => onNavigateTab && onNavigateTab('investigate')}
      />

      {/* Spatial Geometry & Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Spatial Geometry */}
        <div className="p-5 bg-white border border-[#E1E9DF] rounded-2xl space-y-3 shadow-card">
          <div className="flex items-center justify-between text-[#073B1A] font-bold border-b border-[#E1E9DF] pb-2 text-xs">
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#32A817]" />
              Spatial Demarcation
            </span>
            <span className="text-[#32A817] font-mono text-[11px] font-bold">EPSG:4326</span>
          </div>
          <div className="space-y-1.5 text-xs text-[#667568]">
            <div className="flex justify-between py-0.5">
              <span>Centroid Latitude:</span>
              <span className="text-[#17251A] font-mono font-semibold">{ward.center_lat.toFixed(4)}°N</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Centroid Longitude:</span>
              <span className="text-[#17251A] font-mono font-semibold">{ward.center_lon.toFixed(4)}°E</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Jurisdiction:</span>
              <span className="text-[#073B1A] font-bold">{ward.jurisdiction_name || 'Pune Municipal Corporation'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Boundary Cadastre:</span>
              <span className="text-[#F59E0B] font-semibold">Approximate Study Envelope</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Study Area Extent:</span>
              <span className="text-[#17251A] font-semibold">{ward.area_sq_km.toFixed(2)} km²</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Population Density:</span>
              <span className="text-[#17251A] font-semibold">
                {Math.round(ward.population / ward.area_sq_km).toLocaleString()} / km²
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Restorative Target */}
        <div className="p-5 bg-white border border-[#E1E9DF] rounded-2xl space-y-3 shadow-card">
          <div className="flex items-center justify-between text-[#073B1A] font-bold border-b border-[#E1E9DF] pb-2 text-xs">
            <span className="flex items-center gap-2">
              <Trees className="w-4 h-4 text-[#16A34A]" />
              Canopy Target & Deficit
            </span>
            <span className="text-[#16A34A] font-semibold text-[11px]">35% Standard</span>
          </div>
          <div className="space-y-1.5 text-xs text-[#667568]">
            <div className="flex justify-between py-0.5">
              <span>Current Canopy:</span>
              <span className="text-[#17251A] font-bold">{ward.canopy_cover_pct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Deficit Gap:</span>
              <span className="text-[#F59E0B] font-bold">
                -{(35.0 - ward.canopy_cover_pct).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Restoration Required:</span>
              <span className="text-[#16A34A] font-bold">
                {(ward.tree_canopy_deficit_sq_m / 10000).toFixed(0)} hectares
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Evapotranspiration:</span>
              <span className="text-[#DC3545] font-bold">Suppressed 64%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Next Workflow Step */}
        <div className="p-5 bg-white border border-[#E1E9DF] rounded-2xl space-y-3 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#073B1A] font-bold border-b border-[#E1E9DF] pb-2 text-xs">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                Next Decision Step
              </span>
              <span className="text-[#32A817] font-semibold text-[11px]">Phase 2 • Investigate</span>
            </div>
            <p className="text-xs text-[#667568] leading-relaxed mt-2.5">
              Transition to the AI Climate Investigator to trace causal DAG pathways connecting impervious surfaces, loss of vegetative transpiration, and localized heat spikes.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('investigate')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#32A817] hover:bg-[#288812] text-white rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-98"
          >
            <span>Inspect Causal Evidence Graph</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
