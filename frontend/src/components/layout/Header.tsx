import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  ShieldCheck,
  Sparkles,
  Bell,
  ChevronDown,
  User,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { HealthStatus } from '../../types/api';
import { DataQualityModal } from '../common/DataQualityModal';

interface HeaderProps {
  health: HealthStatus | null;
  onOpenCopilot?: () => void;
  copilotOpen?: boolean;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  selectedZoneFilter?: string;
  onSelectZoneFilter?: (zone: string) => void;
  onOpenEmergencyModal?: () => void;
  onToggleDemoMode?: () => void;
  isDemoModeActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onOpenCopilot,
  copilotOpen = false,
  selectedCity = 'Pune Metropolitan Region',
  selectedZoneFilter = 'ALL_ZONES',
  onSelectZoneFilter,
  onOpenEmergencyModal,
  onToggleDemoMode,
  isDemoModeActive = false,
}) => {
  type DropdownId = 'none' | 'city' | 'notif' | 'profile';
  const [openDropdown, setOpenDropdown] = useState<DropdownId>('none');
  const [dataQualityModalOpen, setDataQualityModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown('none');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isHealthy = health?.status === 'HEALTHY';

  const puneZones = [
    { id: 'ALL_ZONES', label: 'All 7 Study Areas (PMC / PCMC / PMR)' },
    { id: 'CENTRAL_ZONE', label: 'Kasba Peth & Shivajinagar (PMC)' },
    { id: 'EAST_INDUSTRIAL', label: 'Hadapsar & Magarpatta (PMC)' },
    { id: 'RIVER_BASIN', label: 'Mula-Mutha Riparian Basin (PMR)' },
    { id: 'WEST_TECH_HIGHLANDS', label: 'Hinjawadi & Kothrud (PMRDA / PMC)' },
    { id: 'NORTH_PCMC', label: 'Bhosari Industrial Belt (PCMC)' },
  ];

  const notifications = [
    {
      id: 'N1',
      title: 'Heat Anomaly in Hadapsar',
      desc: 'Surface thermal peak of 41.8°C (+4.8°C vs baseline).',
      time: '12m ago',
      severity: 'critical',
    },
    {
      id: 'N2',
      title: 'Mula-Mutha Surcharge Alert',
      desc: 'Runoff coefficient at 0.94 in riparian sectors.',
      time: '45m ago',
      severity: 'warning',
    },
    {
      id: 'N3',
      title: 'Sentinel-2 BOA Orbit Processed',
      desc: 'Multispectral canopy bands updated for Pune.',
      time: '2h ago',
      severity: 'info',
    },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className="h-14 bg-[#063B22] border-b border-[#0E5C2C]/50 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-40 relative font-sans shadow-md"
      >
        {/* Left: Product Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0B4420] via-[#135E2D] to-[#16A34A] flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  CLIMASCOPE
                </span>
                <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-[#0B4420] text-[#A3C999] border border-[#135E2D] hidden sm:inline">
                  Enterprise
                </span>
              </div>
              <div className="text-[10px] text-[#A3C999] font-medium hidden sm:block">
                Climate Intelligence Platform
              </div>
            </div>
          </div>
        </div>

        {/* Center: Clean Territory Selector */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown((prev) => (prev === 'city' ? 'none' : 'city'))}
            className={`flex items-center gap-2 bg-[#0B4420]/90 hover:bg-[#0F5528] border ${
              openDropdown === 'city' ? 'border-[#16A34A] ring-1 ring-[#16A34A]' : 'border-[#135E2D]'
            } rounded-xl px-3 py-1 text-xs text-white transition-all shadow-xs`}
            title="Switch Municipal Jurisdiction"
          >
            <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
            <span className="font-semibold text-white truncate max-w-[170px] sm:max-w-xs text-xs">
              {selectedCity}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A3C999] ml-0.5" />
          </button>

          {/* Territory Dropdown Menu */}
          {openDropdown === 'city' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-[#063B22] border border-[#135E2D] rounded-2xl shadow-elevated z-50 p-2 text-xs animate-in fade-in duration-150">
              <div className="text-[10px] font-bold text-[#A3C999] uppercase px-3 py-1.5 border-b border-[#135E2D] mb-1">
                Select Municipal Jurisdiction
              </div>
              <div className="space-y-0.5">
                {puneZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      if (onSelectZoneFilter) onSelectZoneFilter(zone.id);
                      setOpenDropdown('none');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      selectedZoneFilter === zone.id
                        ? 'bg-[#0B4420] text-white font-semibold'
                        : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{zone.label}</span>
                    {selectedZoneFilter === zone.id && (
                      <Check className="w-4 h-4 text-[#16A34A]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions, Alerts, Demo Tour, Copilot & Profile */}
        <div className="flex items-center gap-2">
          {/* Emergency Mode Button */}
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-98 border border-red-500"
              title="Activate Rapid Municipal Climate Emergency Response"
            >
              <Zap className="w-3.5 h-3.5 text-white fill-white/20" />
              <span>Emergency Mode</span>
            </button>
          )}

          {/* Demo Tour Toggle */}
          {onToggleDemoMode && (
            <button
              onClick={onToggleDemoMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
                isDemoModeActive
                  ? 'bg-[#16A34A] text-white border-[#15803D] shadow-sm'
                  : 'bg-[#EAF5E9] text-[#063B22] border-[#C8DEC2] hover:bg-[#DCE7DD]'
              }`}
              title="Toggle Guided 10-Step Hackathon Tour"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Demo Tour</span>
            </button>
          )}

          {/* AI Copilot Drawer Trigger */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
                copilotOpen
                  ? 'bg-[#16A34A] text-white border-[#15803D] shadow-sm'
                  : 'bg-[#EAF5E9] text-[#063B22] border-[#C8DEC2] hover:bg-[#DCE7DD]'
              }`}
              title="AI Municipal Climate Analyst"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown((prev) => (prev === 'notif' ? 'none' : 'notif'))}
              className={`p-1.5 rounded-xl border transition-colors relative ${
                openDropdown === 'notif'
                  ? 'bg-[#0F5528] border-[#16A34A] text-white ring-1 ring-[#16A34A]'
                  : 'bg-[#0B4420] border-[#135E2D] text-emerald-100 hover:text-white hover:bg-[#0F5528]'
              }`}
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC3545] text-white text-[9px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {/* Notifications Popover */}
            {openDropdown === 'notif' && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#063B22] border border-[#135E2D] text-white rounded-2xl shadow-elevated z-50 p-3.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#135E2D] mb-2">
                  <span className="font-bold text-white text-xs">
                    Incident Alerts (3)
                  </span>
                  <span className="text-[11px] text-[#16A34A] font-semibold cursor-pointer hover:underline">
                    Mark Read
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-[#0B4420] border border-[#135E2D] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{n.title}</span>
                        <span className="text-[10px] text-[#A3C999]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-emerald-100/80 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Consolidated Municipal Officer Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown((prev) => (prev === 'profile' ? 'none' : 'profile'))}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                openDropdown === 'profile'
                  ? 'bg-[#0F5528] border-[#16A34A] ring-1 ring-[#16A34A]'
                  : 'bg-[#0B4420] border-[#135E2D] hover:border-[#16A34A]'
              } text-white`}
              title="Municipal Officer Profile & Provenance Registry"
            >
              <div className="w-7 h-7 rounded-lg bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                PMC
              </div>
              <span className="hidden xl:inline text-xs font-semibold pr-1">Officer</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#A3C999] hidden sm:inline" />
            </button>

            {/* Profile Dropdown */}
            {openDropdown === 'profile' && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#063B22] border border-[#135E2D] text-white rounded-2xl shadow-elevated z-50 p-3 text-xs animate-in fade-in duration-150">
                <div className="p-2 border-b border-[#135E2D] mb-2">
                  <div className="font-bold text-white text-sm">Pune Municipal Officer</div>
                  <div className="text-[11px] text-[#A3C999] mt-0.5">Resilience Command Staff</div>
                  <div className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[#0B4420] text-[#16A34A] border border-[#135E2D] text-[10px] font-semibold">
                    Role: Municipal Decision Maker
                  </div>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setDataQualityModalOpen(true);
                      setOpenDropdown('none');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center gap-2 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                    <span>Data Provenance Registry</span>
                  </button>
                </div>
                <div className="pt-2 mt-2 border-t border-[#135E2D] px-2 text-[10px] text-[#A3C999] flex items-center justify-between">
                  <span>Pune PMR Workspace</span>
                  <span className="text-[#16A34A] font-semibold">Active Session</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Data Quality & Provenance Registry Modal */}
      <DataQualityModal
        isOpen={dataQualityModalOpen}
        onClose={() => setDataQualityModalOpen(false)}
      />
    </>
  );
};
