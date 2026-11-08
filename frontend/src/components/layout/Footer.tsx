import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 bg-[#F6F8F4] border-t border-[#DCE7DD] px-4 md:px-6 flex items-center justify-between text-[10px] text-[#718078] shrink-0 select-none font-sans z-30">
      {/* Left: Platform name & PMC attribution */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#063B22] tracking-tight">CLIMASCOPE</span>
        <span className="text-[#A3C999]">•</span>
        <span className="text-[#173526] font-medium hidden sm:inline">Pune Municipal Corporation Urban Resilience Cell</span>
        <span className="text-[#A3C999] hidden sm:inline">•</span>
        <span className="text-[#718078] hidden md:inline">© 2026 PMC</span>
      </div>

      {/* Center: Data freshness timestamp & satellite telemetry */}
      <div className="hidden lg:flex items-center gap-2 text-[#718078]">
        <Radio className="w-2.5 h-2.5 text-[#16A34A] animate-pulse" />
        <span>Telemetry Pass: 18m ago • Copernicus Sentinel-2 MSI & USGS Landsat-8 TIRS</span>
      </div>

      {/* Right: Disclaimer and system version */}
      <div className="flex items-center gap-3 ml-auto lg:ml-0">
        <span className="hidden xl:inline text-[#879487] truncate max-w-sm">
          Decision-support model estimates. Boundaries approximate.
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EAF5E9] border border-[#C8DEC2] text-[#063B22] font-semibold text-[9.5px]">
          <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
          <span>v1.4.0 Enterprise</span>
        </div>
      </div>
    </footer>
  );
};
