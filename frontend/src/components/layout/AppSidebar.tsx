import React from 'react';
import {
  LayoutDashboard,
  Map,
  Radar,
  Network,
  TrendingUp,
  Cpu,
  SlidersHorizontal,
  CheckSquare,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LucideIcon,
  Activity,
  Layers,
} from 'lucide-react';
import { NavigationTab } from '../../types/api';

interface AppSidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenEmergencyModal?: () => void;
}

interface SidebarItem {
  id: NavigationTab;
  aliasIds?: NavigationTab[];
  label: string;
  icon: LucideIcon;
  badge?: string;
  isSpecial?: boolean;
  onClickSpecial?: () => void;
}

interface NavSection {
  title: string;
  items: SidebarItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onOpenEmergencyModal,
}) => {
  const sections: NavSection[] = [
    {
      title: 'COMMAND CENTRE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CLIMATE INTELLIGENCE',
      items: [
        { id: 'climate-map', label: 'Climate Map', icon: Map, badge: 'GIS' },
        { id: 'detect', aliasIds: ['ward-intelligence'], label: 'Detect', icon: Radar },
        { id: 'investigate', aliasIds: ['ai-investigator'], label: 'Investigate', icon: Network },
        { id: 'predict', label: 'Predict', icon: TrendingUp },
      ],
    },
    {
      title: 'DECISION SUPPORT',
      items: [
        { id: 'simulate', aliasIds: ['climate-twin'], label: 'Simulate', icon: Cpu },
        { id: 'prioritize', aliasIds: ['budget-optimizer'], label: 'Prioritize', icon: SlidersHorizontal },
        { id: 'act', label: 'Act', icon: CheckSquare },
        { id: 'verify', aliasIds: ['action-ledger'], label: 'Verify', icon: ShieldCheck },
      ],
    },
    {
      title: 'INSIGHTS & REPORTING',
      items: [
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Data Audit', icon: Settings },
      ],
    },
  ];

  const isItemActive = (item: SidebarItem) => {
    if (currentTab === item.id) return true;
    if (item.aliasIds && item.aliasIds.includes(currentTab)) return true;
    return false;
  };

  return (
    <aside
      className={`bg-gradient-to-b from-[#062A13] via-[#073B1A] to-[#062A13] border-r border-[#0E5C2C]/40 flex flex-col justify-between shrink-0 select-none transition-all duration-200 z-30 font-sans shadow-lg ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Header & Collapse Control */}
      <div className="p-3 border-b border-[#0E5C2C]/40 flex items-center justify-between">
        {!collapsed ? (
          <>
            <span className="text-[11px] font-bold text-[#A3C999] uppercase tracking-wider flex items-center gap-1.5">
              <span>Workspaces</span>
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav Items List */}
      <div className="p-3 space-y-4 overflow-y-auto scrollbar-thin flex-1">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div
              className={`px-2 py-1 text-[10px] font-bold text-[#A3C999] uppercase tracking-wider ${
                collapsed ? 'text-center' : ''
              }`}
            >
              {!collapsed ? sec.title : '•'}
            </div>

            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClickSpecial) {
                        item.onClickSpecial();
                      } else {
                        onSelectTab(item.id);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all relative group ${
                      active
                        ? 'bg-[#32A817] text-white shadow-sm font-semibold'
                        : 'text-emerald-100/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-emerald-200/80 group-hover:text-white'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate text-xs tracking-tight">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-[#062A13] text-[#A3C999]'
                          : 'bg-[#0B4822] text-[#EDF5E9]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section: System Status & Telemetry Badge */}
      <div className="p-3 border-t border-[#0E5C2C]/40 space-y-2 bg-[#041B0D]/80">
        {!collapsed ? (
          <>
            <div className="bg-[#073B1A]/70 border border-[#0E5C2C]/60 rounded-xl p-2.5 text-xs text-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white">PMR System Status</span>
                <span className="flex items-center gap-1.5 text-[10px] text-[#48B52B] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32A817] animate-pulse" />
                  Nominal
                </span>
              </div>
              <div className="text-[10px] text-emerald-300/80 font-medium">
                7 Wards • 22 Interventions
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#879487] px-1">
              <span>CLIMASCOPE PMR</span>
              <span className="font-mono text-[#A3C999]">v1.4.0</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#32A817] animate-pulse" title="PMR Status: Nominal" />
            <span className="text-[9px] font-mono text-[#879487]">v1.4</span>
          </div>
        )}
      </div>
    </aside>
  );
};
