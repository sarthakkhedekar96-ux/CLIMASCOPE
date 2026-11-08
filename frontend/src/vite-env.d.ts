/// <reference types="vite/client" />

declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type LucideIcon = React.FC<LucideProps>;
  export const Activity: LucideIcon;
  export const Flame: LucideIcon;
  export const Trees: LucideIcon;
  export const Droplets: LucideIcon;
  export const Wind: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Cpu: LucideIcon;
  export const Globe2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Search: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Terminal: LucideIcon;
  export const Bell: LucideIcon;
  export const Radar: LucideIcon;
  export const Network: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Boxes: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const Layers: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Filter: LucideIcon;
  export const Building: LucideIcon;
  export const Building2: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Compass: LucideIcon;
  export const MapPin: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Database: LucideIcon;
  export const Info: LucideIcon;
  export const GitCommit: LucideIcon;
  export const DollarSign: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Play: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Calendar: LucideIcon;
  export const AlertOctagon: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Sliders: LucideIcon;
  export const ThermometerSnowflake: LucideIcon;
  export const Leaf: LucideIcon;
  export const HardHat: LucideIcon;
  export const Clock: LucideIcon;
  export const Hash: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const FileText: LucideIcon;
  export const Lock: LucideIcon;
  export const Award: LucideIcon;
  export const X: LucideIcon;
  export const Send: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Map: LucideIcon;
  export const Settings: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const User: LucideIcon;
  export const Check: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Crosshair: LucideIcon;
  export const Users: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Radio: LucideIcon;
  export const Download: LucideIcon;
  export const Printer: LucideIcon;
  export const Satellite: LucideIcon;
  export const Navigation: LucideIcon;
  export const GitBranch: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Wrench: LucideIcon;
  export const Target: LucideIcon;
  export const Zap: LucideIcon;
  export const Bookmark: LucideIcon;
  export const BookmarkCheck: LucideIcon;
  export const Trash2: LucideIcon;
  export const BarChart2: LucideIcon;
  export const Copy: LucideIcon;
  export const PieChart: LucideIcon;
  export const Scale: LucideIcon;
  export const Plus: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const Edit2: LucideIcon;
  export const Edit3: LucideIcon;
  export const Paperclip: LucideIcon;
  export const Upload: LucideIcon;
  export const FileCheck: LucideIcon;
  export const XCircle: LucideIcon;
  export const IndianRupee: LucideIcon;
  export const BookOpen: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
}

declare module 'maplibre-gl' {
  export class Map {
    constructor(options?: any);
    on(event: string, callback: (...args: any[]) => void): this;
    on(event: string, layerId: string, callback: (...args: any[]) => void): this;
    remove(): void;
    addControl(control: any, position?: string): this;
    isStyleLoaded(): boolean;
    loaded(): boolean;
    getSource(id: string): any;
    addSource(id: string, source: any): this;
    getLayer(id: string): any;
    addLayer(layer: any, beforeId?: string): this;
    setLayoutProperty(layerId: string, name: string, value: any): this;
    setPaintProperty(layerId: string, name: string, value: any): this;
    setFeatureState(target: { source: string; id: number | string }, state: any): this;
    getCanvas(): HTMLCanvasElement;
    queryRenderedFeatures(geometry?: any, options?: any): any[];
    flyTo(options: any): this;
    easeTo(options?: any): this;
    fitBounds(bounds: any, options?: any): this;
    getBounds(): any;
    resize(): this;
    setPitch(pitch: number): this;
    getPitch(): number;
    resetNorthPitch(options?: any): this;
  }
  export class NavigationControl {
    constructor(options?: { showCompass?: boolean; showZoom?: boolean; visualizePitch?: boolean });
  }
  export interface GeoJSONSource {
    setData(data: any): this;
  }
  const maplibregl: {
    Map: typeof Map;
    NavigationControl: typeof NavigationControl;
  };
  export default maplibregl;
}
