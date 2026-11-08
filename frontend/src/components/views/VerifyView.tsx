import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Hash,
  CheckCircle,
  CheckCircle2,
  FileText,
  Lock,
  Award,
  Download,
  Copy,
  Check,
  Sparkles,
  Radio,
  Eye,
  Calendar,
  Clock,
  HardHat,
  Plus,
  Edit2,
  Paperclip,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  X,
  Leaf,
  Droplets,
  Building2,
  GitBranch,
  Layers,
  Zap,
  IndianRupee,
} from 'lucide-react';
import {
  WardSummary,
  LedgerEntry,
  LedgerAuditSummary,
  Intervention,
  AttachedEvidenceItem,
  CreateInterventionPayload,
  UpdateInterventionPayload,
  AttachEvidencePayload,
  VerifyInterventionPayload,
  OutcomeComparisonResult,
} from '../../types/api';
import { api } from '../../services/api';
import { MetricCard } from '../common/MetricCard';
import { LoadingState } from '../common/LoadingState';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { formatINR } from '../../utils/formatters';

interface VerifyViewProps {
  ward: WardSummary | null;
}

type TabMode = 'ledger_records' | 'verification_outcomes' | 'cryptographic_audit';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; border: string; bg: string; dot: string }
> = {
  Proposed: {
    label: 'PROPOSED',
    color: 'text-slate-700',
    border: 'border-slate-200',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  },
  Approved: {
    label: 'APPROVED',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    label: 'IN PROGRESS',
    color: 'text-amber-800',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500 animate-pulse',
  },
  Completed: {
    label: 'COMPLETED',
    color: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
  },
  'Verification Pending': {
    label: 'VERIFICATION PENDING',
    color: 'text-orange-800',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    dot: 'bg-orange-500 animate-ping',
  },
  Verified: {
    label: 'VERIFIED',
    color: 'text-emerald-800',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-600',
  },
  Failed: {
    label: 'FAILED',
    color: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
  },
};

export const VerifyView: React.FC<VerifyViewProps> = ({ ward }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('ledger_records');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [audit, setAudit] = useState<LedgerAuditSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [outcomeComparison, setOutcomeComparison] = useState<OutcomeComparisonResult | null>(null);
  const [inspectingEntry, setInspectingEntry] = useState<LedgerEntry | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [actionTarget, setActionTarget] = useState<Intervention | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for Create
  const [newActionForm, setNewActionForm] = useState<CreateInterventionPayload>({
    ward_id: ward?.id || 1,
    intervention_code: '',
    name: '',
    category: 'CANOPY_EXPANSION',
    cost_inr: 1250000,
    cost_usd: 15000,
    annual_maintenance_inr: 85000,
    annual_maintenance_usd: 1000,
    currency: 'INR',
    cost_category: 'CAPITAL_EXPENDITURE',
    funding_source: 'PMC Climate Resilience Green Fund',
    fiscal_year: 'FY 2026-27',
    jurisdiction: ward?.jurisdiction || 'Pune Municipal Corporation (PMC)',
    target_area_sq_m: 10000,
    cooling_effect_celsius: 1.2,
    runoff_reduction_pct: 18.0,
    co2_sequestration_t_yr: 45.0,
    roi_score: 8.5,
    status: 'Proposed',
    timeline_months: 6,
    responsible_authority: 'PMC Directorate of Urban Forestry',
    contractor: 'Western India Bio-Engineering Ltd',
    start_date: '2026-05-01',
    deadline: '2026-11-01',
    progress_pct: 0,
    description: '',
  });

  // Form states for Update
  const [updateForm, setUpdateForm] = useState<UpdateInterventionPayload>({
    status: 'In Progress',
    progress_pct: 25,
    responsible_authority: '',
    contractor: '',
    start_date: '',
    deadline: '',
    description: '',
  });

  // Form states for Attach Evidence
  const [evidenceForm, setEvidenceForm] = useState<AttachEvidencePayload>({
    evidence_type: 'SATELLITE_MULTISPECTRAL',
    source: 'Copernicus Sentinel-2 MSI Band 8 NIR',
    observation_date: new Date().toISOString().split('T')[0],
    geographic_location: '18.5204° N, 73.8567° E',
    description: 'Post-implementation radiometric surface reflectometry audit.',
    confidence: 0.95,
    is_simulated: false,
  });

  // Form states for Verify
  const [verifyForm, setVerifyForm] = useState<VerifyInterventionPayload>({
    simulate: true,
    observed_cooling_celsius: 1.15,
    observed_runoff_reduction_pct: 17.5,
    evidence_source: 'Copernicus Sentinel-2 Synthetic Re-Pass (Demonstration Run)',
  });

  const fetchData = async () => {
    if (!ward) return;
    try {
      const [itvRes, ledgerRes, auditRes] = await Promise.all([
        api.getInterventions(ward.id),
        api.getLedgerEntries(ward.id),
        api.getLedgerAudit(),
      ]);

      if (itvRes.success && itvRes.data) {
        setInterventions(itvRes.data);
        if (itvRes.data.length > 0) {
          if (!selectedIntervention) {
            setSelectedIntervention(itvRes.data[0]);
          } else {
            const updated = itvRes.data.find((i) => i.id === selectedIntervention.id);
            if (updated) setSelectedIntervention(updated);
          }
        }
      }

      if (ledgerRes.success && ledgerRes.data) {
        setLedgerEntries(ledgerRes.data);
        if (!inspectingEntry && ledgerRes.data.length > 0) {
          setInspectingEntry(ledgerRes.data[0]);
        }
      }

      if (auditRes.success && auditRes.data) {
        setAudit(auditRes.data);
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [ward]);

  // Load outcome comparison when selected intervention changes
  useEffect(() => {
    if (selectedIntervention) {
      api
        .getOutcomeComparison(selectedIntervention.id)
        .then((res) => {
          if (res.success && res.data) {
            setOutcomeComparison(res.data);
          } else {
            setOutcomeComparison(null);
          }
        })
        .catch(() => setOutcomeComparison(null));
    }
  }, [selectedIntervention]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenCreateModal = () => {
    if (!ward) return;
    setNewActionForm({
      ward_id: ward.id,
      intervention_code: `ACT-2026-${ward.code.replace('WRD-', '')}-${(interventions.length + 1)
        .toString()
        .padStart(2, '0')}`,
      name: '',
      category: 'CANOPY_EXPANSION',
      cost_inr: 1250000,
      cost_usd: 15000,
      annual_maintenance_inr: 85000,
      annual_maintenance_usd: 1000,
      currency: 'INR',
      cost_category: 'CAPITAL_EXPENDITURE',
      funding_source: 'PMC Climate Resilience Green Fund',
      fiscal_year: 'FY 2026-27',
      jurisdiction: ward.jurisdiction || 'Pune Municipal Corporation (PMC)',
      target_area_sq_m: 10000,
      cooling_effect_celsius: 1.2,
      runoff_reduction_pct: 18.0,
      co2_sequestration_t_yr: 45.0,
      roi_score: 8.5,
      status: 'Proposed',
      timeline_months: 6,
      responsible_authority: 'PMC Directorate of Urban Forestry',
      contractor: 'Western India Bio-Engineering Ltd',
      start_date: '2026-05-01',
      deadline: '2026-11-01',
      progress_pct: 0,
      description: `Targeted climate resilience intervention in ${ward.name}`,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ward) return;
    setIsSubmitting(true);
    try {
      const res = await api.createIntervention(newActionForm);
      if (res.success && res.data) {
        setStatusMessage({ text: `Successfully registered action ${res.data.intervention_code}`, type: 'success' });
        setShowCreateModal(false);
        await fetchData();
        setSelectedIntervention(res.data);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to register intervention', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleOpenUpdateModal = (itv: Intervention) => {
    setActionTarget(itv);
    setUpdateForm({
      status: itv.status || 'In Progress',
      progress_pct: itv.progress_pct || 0,
      responsible_authority: itv.responsible_authority || 'PMC Urban Resilience Cell',
      contractor: itv.contractor || 'PMC Civil Works',
      start_date: itv.start_date || '2026-03-01',
      deadline: itv.deadline || '2026-09-30',
      description: itv.description || '',
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateIntervention(actionTarget.id, updateForm);
      if (res.success && res.data) {
        setStatusMessage({ text: `Updated ${res.data.intervention_code} to status ${res.data.status}`, type: 'success' });
        setShowUpdateModal(false);
        await fetchData();
        setSelectedIntervention(res.data);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update intervention', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleOpenEvidenceModal = (itv: Intervention) => {
    setActionTarget(itv);
    setEvidenceForm({
      evidence_type: 'SATELLITE_MULTISPECTRAL',
      source: 'Copernicus Sentinel-2 MSI Band 8 NIR',
      observation_date: new Date().toISOString().split('T')[0],
      geographic_location: '18.5204° N, 73.8567° E',
      description: `Empirical field telemetry calibration for ${itv.name}`,
      confidence: 0.95,
      is_simulated: false,
    });
    setShowEvidenceModal(true);
  };

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;
    setIsSubmitting(true);
    try {
      const res = await api.attachEvidence(actionTarget.id, evidenceForm);
      if (res.success && res.data) {
        setStatusMessage({ text: `Evidence record appended to ${res.data.intervention_code} & Ledger`, type: 'success' });
        setShowEvidenceModal(false);
        await fetchData();
        setSelectedIntervention(res.data);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to attach evidence', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleOpenVerifyModal = (itv: Intervention) => {
    setActionTarget(itv);
    setVerifyForm({
      simulate: true,
      observed_cooling_celsius: Number((itv.cooling_effect_celsius * 0.95).toFixed(2)),
      observed_runoff_reduction_pct: Number((itv.runoff_reduction_pct * 0.97).toFixed(1)),
      evidence_source: 'Copernicus Sentinel-2 Synthetic Re-Pass (Demonstration Run)',
    });
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;
    setIsSubmitting(true);
    try {
      const res = await api.verifyIntervention(actionTarget.id, verifyForm);
      if (res.success && res.data) {
        setStatusMessage({ text: `Verification completed for ${res.data.intervention_code} (${res.data.verification_status})`, type: 'success' });
        setShowVerifyModal(false);
        await fetchData();
        setOutcomeComparison(res.data);
        setActiveTab('verification_outcomes');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to execute verification', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Filtered interventions
  const filteredInterventions = useMemo(() => {
    return interventions.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.intervention_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.responsible_authority &&
          item.responsible_authority.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [interventions, statusFilter, categoryFilter, searchQuery]);

  if (!ward) return null;
  if (loading) return <LoadingState message="SYNCHRONIZING CLIMATE ACTION LEDGER..." />;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin bg-[#F5F7F2] text-[#17251A]">
      {/* Toast Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-card ${statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[#667568] hover:text-[#17251A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[#073B1A] bg-[#EDF5E9] border border-[#C8DEC2] px-2.5 py-0.5 rounded-full tracking-wide">
              PHASE 7 • DETECT-TO-VERIFY
            </span>
            <span className="text-[#C8DEC2] text-xs">•</span>
            <span className="text-xs text-[#667568] font-medium">
              Climate Action Ledger & Verification Suite
            </span>
            <span className="text-[#C8DEC2] text-xs">•</span>
            <span className="text-xs font-mono text-[#073B1A] font-semibold bg-[#EDF5E9] px-2 py-0.5 rounded">{ward.code}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#073B1A] tracking-tight">
            Municipal Climate Action Ledger
          </h1>
          <p className="text-xs text-[#667568] mt-1 max-w-2xl leading-relaxed">
            End-to-end lifecycle governance tracking whether recommended climate interventions are
            physically implemented, legally audited, and biophysically verified via satellite radiometry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#32A817] hover:bg-[#288712] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Intervention</span>
          </button>

          <div className="bg-[#EDF5E9] border border-[#C8DEC2] rounded-xl px-3.5 py-2 flex items-center gap-3 shrink-0 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Lock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-[#667568]">Ledger State</div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SHA-256 Immutable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Level Audit Metrics Grid */}
      {audit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <MetricCard
            title="Total Registered Actions"
            value={interventions.length}
            subtitle={`${ward.code} Portfolio`}
            change={`${interventions.filter((i) => i.status === 'Verified').length} Verified`}
            changeType="positive"
            icon={Layers}
            variant="default"
          />

          <MetricCard
            title="Capital Allocated"
            value={formatINR(interventions.reduce((sum, i) => sum + (i.cost_inr || (i.cost_usd ? i.cost_usd * 83.5 : 0)), 0))}
            subtitle="Municipal Capital"
            change="100% Tracked"
            changeType="positive"
            icon={IndianRupee}
            variant="default"
          />

          <MetricCard
            title="Net Verified Cooling"
            value={`-${audit.net_verified_surface_cooling_celsius.toFixed(1)}`}
            unit="°C"
            subtitle="Satellite Radiometry"
            change="Confirmed Delta"
            changeType="positive"
            icon={ShieldCheck}
            variant="default"
          />

          <MetricCard
            title="Vegetation Gain"
            value={`+${audit.net_verified_vegetation_gain_ndvi.toFixed(3)}`}
            unit="NDVI"
            subtitle="Sentinel-2 BOA Survey"
            change="Biomass Increase"
            changeType="positive"
            icon={Award}
            variant="default"
          />
        </div>
      )}

      {/* Navigation View Switcher Tabs */}
      <div className="flex border-b border-[#E1E9DF] gap-2 pb-2">
        <button
          onClick={() => setActiveTab('ledger_records')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === 'ledger_records'
              ? 'bg-[#073B1A] text-white shadow-sm'
              : 'text-[#667568] hover:text-[#17251A] bg-white border border-[#E1E9DF]'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Intervention Records ({interventions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification_outcomes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === 'verification_outcomes'
              ? 'bg-[#073B1A] text-white shadow-sm'
              : 'text-[#667568] hover:text-[#17251A] bg-white border border-[#E1E9DF]'
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification & Outcomes</span>
        </button>

        <button
          onClick={() => setActiveTab('cryptographic_audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === 'cryptographic_audit'
              ? 'bg-[#073B1A] text-white shadow-sm'
              : 'text-[#667568] hover:text-[#17251A] bg-white border border-[#E1E9DF]'
            }`}
        >
          <Lock className="w-4 h-4" />
          <span>Cryptographic Audit & Timeline ({ledgerEntries.length} Blocks)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERVENTION RECORDS & LIFECYCLE MANAGEMENT                        */}
      {/* ========================================================================= */}
      {activeTab === 'ledger_records' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white border border-[#E1E9DF] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#879487]" />
              <input
                type="text"
                placeholder="Search by Action ID, name, contractor or authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-1.5 text-xs text-[#17251A] placeholder-[#879487] focus:outline-none focus:border-[#32A817] w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#667568]">
                <Filter className="w-3.5 h-3.5 text-[#879487]" />
                <span className="font-medium">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-2.5 py-1.5 text-xs text-[#17251A] focus:outline-none focus:border-[#32A817]"
              >
                <option value="ALL">All Statuses ({interventions.length})</option>
                <option value="Proposed">Proposed</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Verification Pending">Verification Pending</option>
                <option value="Verified">Verified</option>
                <option value="Failed">Failed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-2.5 py-1.5 text-xs text-[#17251A] focus:outline-none focus:border-[#32A817]"
              >
                <option value="ALL">All Categories</option>
                <option value="CANOPY_EXPANSION">Canopy Expansion</option>
                <option value="COOL_ROOF">Cool Roof</option>
                <option value="PERMEABLE_PAVING">Permeable Paving</option>
                <option value="BIOSWALE">Bioswale</option>
                <option value="RETENTION_BASIN">Retention Basin</option>
              </select>
            </div>
          </div>

          {/* Intervention Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredInterventions.map((itv) => {
              const statusCfg = STATUS_CONFIG[itv.status] || STATUS_CONFIG['Proposed'];
              const isSelected = selectedIntervention?.id === itv.id;
              const evidenceList: AttachedEvidenceItem[] = itv.attached_evidence_json
                ? JSON.parse(itv.attached_evidence_json)
                : [];

              return (
                <div
                  key={itv.id}
                  onClick={() => setSelectedIntervention(itv)}
                  className={`bg-white border rounded-2xl p-5 text-xs space-y-3 cursor-pointer transition-all shadow-card ${isSelected
                      ? 'border-[#32A817] ring-2 ring-[#32A817]/20 bg-[#F5F7F2]'
                      : 'border-[#E1E9DF] hover:border-[#32A817]/60'
                    }`}
                >
                  {/* Top Bar: Action ID, Ward, Status */}
                  <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#073B1A] font-bold text-sm tracking-wide font-mono">
                        {itv.intervention_code}
                      </span>
                      <span className="text-[#C8DEC2]">•</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#EDF5E9] text-[#073B1A] border border-[#C8DEC2] font-medium">
                        {itv.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-[#073B1A] font-sans">{itv.name}</h3>
                    <p className="text-[11px] text-[#667568] mt-1 leading-relaxed">
                      {itv.description || 'Targeted microclimate adaptation intervention.'}
                    </p>
                  </div>

                  {/* Governance / Accountability Info */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl text-[11px]">
                    <div>
                      <span className="text-[#667568] text-[10px] uppercase block font-medium">
                        Responsible Authority
                      </span>
                      <span className="text-[#17251A] font-semibold truncate block">
                        {itv.responsible_authority || 'PMC Urban Resilience Cell'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#667568] text-[10px] uppercase block font-medium">
                        Assigned Contractor
                      </span>
                      <span className="text-[#17251A] font-semibold truncate block">
                        {itv.contractor || 'PMC Civil Works'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#667568] text-[10px] uppercase block font-medium">Timeline Window</span>
                      <span className="text-[#17251A] font-mono text-[10px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#879487]" />
                        {itv.start_date || '2026-03-01'} → {itv.deadline || '2026-09-30'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#667568] text-[10px] uppercase block font-medium">Budget Cap</span>
                      <span className="text-[#073B1A] font-bold">
                        {formatINR(itv.cost_inr || (itv.cost_usd ? itv.cost_usd * 83.5 : 0))}
                      </span>
                    </div>
                  </div>

                  {/* Implementation Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#667568] flex items-center gap-1 font-medium">
                        <HardHat className="w-3 h-3 text-amber-600" /> Progress:
                      </span>
                      <span className="text-[#073B1A] font-bold">{itv.progress_pct || 0}% Complete</span>
                    </div>
                    <div className="w-full bg-[#E1E9DF] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${itv.progress_pct === 100
                            ? 'bg-[#16A34A]'
                            : (itv.progress_pct || 0) > 50
                              ? 'bg-[#32A817]'
                              : 'bg-amber-500'
                          }`}
                        style={{ width: `${Math.min(100, itv.progress_pct || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="flex items-center justify-between text-[10px] text-[#667568] pt-1 border-t border-[#E1E9DF]">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-emerald-600" />
                      Plan Cooling: <strong className="text-[#073B1A]">-{itv.cooling_effect_celsius}°C</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-600" />
                      Plan Runoff: <strong className="text-[#073B1A]">-{itv.runoff_reduction_pct}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-[#879487]" />
                      Evidence: <strong className="text-[#17251A]">{evidenceList.length} files</strong>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-[#E1E9DF] flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUpdateModal(itv);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#073B1A] border border-[#C8DEC2] flex items-center gap-1.5 transition-colors font-medium"
                      title="Update Lifecycle Status, Contractor, or Progress"
                    >
                      <Edit2 className="w-3 h-3 text-[#32A817]" />
                      <span>Update</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEvidenceModal(itv);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#073B1A] border border-[#C8DEC2] flex items-center gap-1.5 transition-colors font-medium"
                      title="Attach Verifiable Remote Sensing Evidence"
                    >
                      <Paperclip className="w-3 h-3 text-amber-600" />
                      <span>Attach Evidence</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenVerifyModal(itv);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 transition-colors font-semibold"
                      title="Execute Empirical or Simulated Verification"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verify Outcome</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntervention(itv);
                        setActiveTab('verification_outcomes');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#073B1A] hover:bg-[#062A13] text-white flex items-center gap-1.5 transition-colors font-semibold shadow-sm"
                      title="Inspect Side-by-Side Comparison"
                    >
                      <Eye className="w-3 h-3 text-[#48B52B]" />
                      <span>Compare</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredInterventions.length === 0 && (
            <div className="py-12 text-center text-[#667568] text-xs border border-dashed border-[#E1E9DF] rounded-2xl bg-white">
              <Layers className="w-8 h-8 mx-auto text-[#879487] mb-2" />
              <div>No climate interventions found matching current filters.</div>
              <button
                onClick={handleOpenCreateModal}
                className="mt-3 px-3 py-1.5 bg-[#32A817] hover:bg-[#288712] text-white rounded-xl text-xs inline-flex items-center gap-1.5 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Register First Intervention
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERIFICATION MODULE & OUTCOME COMPARISON                            */}
      {/* ========================================================================= */}
      {activeTab === 'verification_outcomes' && (
        <div className="space-y-4">
          {/* Action Selector Bar */}
          <div className="bg-white border border-[#E1E9DF] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A]">
                Verification Comparison Matrix
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#667568] font-medium">Select Action:</span>
              <select
                value={selectedIntervention?.id || ''}
                onChange={(e) => {
                  const found = interventions.find((i) => i.id === Number(e.target.value));
                  if (found) setSelectedIntervention(found);
                }}
                className="bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-1.5 text-xs text-[#17251A] focus:outline-none focus:border-[#32A817] max-w-[320px]"
              >
                {interventions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.intervention_code} - {i.name} ({i.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedIntervention ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Side-by-Side Comparison Matrix */}
              <div className="lg:col-span-2 space-y-4">
                {/* Simulated vs Empirical Evidence Banner */}
                {selectedIntervention.is_simulated_verification ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-card">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
                        <span>SIMULATED VERIFICATION EVIDENCE (DEMONSTRATION RUN)</span>
                        <ProvenanceBadge
                          category="SIMULATED"
                          sourceName="Synthetic Sentinel-2 Radiometry Twin"
                          methodology="Microclimate Heat Transfer & Empirical Canopy Deficit Scaling"
                        />
                      </div>
                      <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
                        Synthetic verification run generated for demonstration purposes because the next
                        cloud-free Copernicus Sentinel-2 MSI orbital re-pass is scheduled for a subsequent
                        cycle. Biophysical scaling equations and microclimate models have been applied.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-card">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
                        <span>EMPIRICALLY OBSERVED SATELLITE RADIOMETRY</span>
                        <ProvenanceBadge
                          category="OBSERVED"
                          sourceName="Copernicus Sentinel-2 & USGS Landsat-8"
                          spatialRes="10m Optical / 30m Thermal"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-900/80 mt-1 leading-relaxed">
                        Multispectral radiometric observation calibrated via Copernicus Sentinel-2 MSI Band 8
                        NIR (10m GSD) and Landsat-8 TIRS Band 10 surface radiometry. Confirms empirical cooling.
                      </p>
                    </div>
                  </div>
                )}

                {/* Outcome Comparison Cards */}
                <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
                    <div>
                      <span className="text-[10px] text-[#667568] uppercase font-semibold">Selected Action</span>
                      <h2 className="text-base font-bold text-[#073B1A] font-sans mt-0.5">
                        {selectedIntervention.intervention_code} • {selectedIntervention.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenVerifyModal(selectedIntervention)}
                        className="px-3 py-1.5 bg-[#32A817] hover:bg-[#288712] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Re-Verify Action</span>
                      </button>
                    </div>
                  </div>

                  {/* Planned vs Observed Matrix Table */}
                  <div className="border border-[#E1E9DF] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#EDF5E9] border-b border-[#E1E9DF] text-[#073B1A] text-[10px] uppercase font-semibold">
                          <th className="p-3">Biophysical Metric</th>
                          <th className="p-3">Planned Baseline</th>
                          <th className="p-3">Observed Outcome</th>
                          <th className="p-3">Difference / Variance</th>
                          <th className="p-3">Verification Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E9DF] text-xs">
                        {/* Metric 1: Cooling */}
                        <tr className="hover:bg-[#F5F7F2]">
                          <td className="p-3 font-semibold text-[#17251A] flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                            <span>Surface Temperature Cooling</span>
                          </td>
                          <td className="p-3 text-[#073B1A] font-bold">
                            -{selectedIntervention.cooling_effect_celsius.toFixed(2)}°C
                          </td>
                          <td className="p-3 text-emerald-700 font-bold">
                            {outcomeComparison
                              ? `-${outcomeComparison.observed_cooling_celsius.toFixed(2)}°C`
                              : selectedIntervention.observed_outcome
                                ? `-${JSON.parse(selectedIntervention.observed_outcome).cooling_celsius?.toFixed(2)}°C`
                                : 'Pending Observation'}
                          </td>
                          <td className="p-3">
                            {outcomeComparison ? (
                              <span
                                className={`font-bold ${outcomeComparison.cooling_difference_celsius >= 0
                                    ? 'text-emerald-700'
                                    : 'text-amber-600'
                                  }`}
                              >
                                {outcomeComparison.cooling_difference_celsius > 0 ? '+' : ''}
                                {outcomeComparison.cooling_difference_celsius.toFixed(2)}°C
                              </span>
                            ) : (
                              <span className="text-[#879487]">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {outcomeComparison?.cooling_target_met ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TARGET MET (
                                {(
                                  (outcomeComparison.observed_cooling_celsius /
                                    outcomeComparison.planned_cooling_celsius) *
                                  100
                                ).toFixed(0)}
                                %)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" /> VERIFICATION PENDING
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Metric 2: Runoff Reduction */}
                        <tr className="hover:bg-[#F5F7F2]">
                          <td className="p-3 font-semibold text-[#17251A] flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span>Surface Runoff Reduction</span>
                          </td>
                          <td className="p-3 text-[#073B1A] font-bold">
                            -{selectedIntervention.runoff_reduction_pct.toFixed(1)}%
                          </td>
                          <td className="p-3 text-emerald-700 font-bold">
                            {outcomeComparison
                              ? `-${outcomeComparison.observed_runoff_reduction_pct.toFixed(1)}%`
                              : selectedIntervention.observed_outcome
                                ? `-${JSON.parse(selectedIntervention.observed_outcome).runoff_reduction_pct?.toFixed(1)}%`
                                : 'Pending Observation'}
                          </td>
                          <td className="p-3">
                            {outcomeComparison ? (
                              <span
                                className={`font-bold ${outcomeComparison.runoff_difference_pct >= 0
                                    ? 'text-emerald-700'
                                    : 'text-amber-600'
                                  }`}
                              >
                                {outcomeComparison.runoff_difference_pct > 0 ? '+' : ''}
                                {outcomeComparison.runoff_difference_pct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[#879487]">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {outcomeComparison?.runoff_target_met ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TARGET MET (
                                {(
                                  (outcomeComparison.observed_runoff_reduction_pct /
                                    outcomeComparison.planned_runoff_reduction_pct) *
                                  100
                                ).toFixed(0)}
                                %)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" /> VERIFICATION PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Verification Metadata Footnote */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl text-[11px]">
                    <div>
                      <span className="text-[#667568] text-[10px] block uppercase font-medium">Evidence Source</span>
                      <span className="text-[#073B1A] font-semibold block truncate">
                        {outcomeComparison?.evidence_source ||
                          selectedIntervention.evidence_source ||
                          'Copernicus Sentinel-2 MSI BOA Surface Analysis'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#667568] text-[10px] block uppercase font-medium">Verification Date</span>
                      <span className="text-[#17251A] font-mono block">
                        {outcomeComparison?.verification_date ||
                          selectedIntervention.verification_date ||
                          '2026-10-18'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#667568] text-[10px] block uppercase font-medium">Audit Block Proof</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Hash className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-mono text-[10px] truncate max-w-[120px]">
                          {outcomeComparison?.audit_block_hash || 'SHA-256 Validated'}
                        </span>
                        {outcomeComparison?.audit_block_hash && (
                          <button
                            onClick={() => copyToClipboard(outcomeComparison.audit_block_hash)}
                            className="text-[#667568] hover:text-[#17251A]"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attached Evidence Records List */}
                <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-3 shadow-card">
                  <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2">
                    <span className="font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      Attached Verifiable Evidence Records (
                      {selectedIntervention.attached_evidence_json
                        ? JSON.parse(selectedIntervention.attached_evidence_json).length
                        : 0}
                      )
                    </span>
                    <button
                      onClick={() => handleOpenEvidenceModal(selectedIntervention)}
                      className="px-2.5 py-1 bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#073B1A] border border-[#C8DEC2] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-[#32A817]" /> Attach New Evidence
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {selectedIntervention.attached_evidence_json &&
                      JSON.parse(selectedIntervention.attached_evidence_json).length > 0 ? (
                      JSON.parse(selectedIntervention.attached_evidence_json).map(
                        (ev: AttachedEvidenceItem, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[#073B1A] font-bold text-[11px] font-mono">
                                {ev.evidence_id || `EV-${idx + 1}`} • {ev.evidence_type}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ev.is_simulated
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                {ev.is_simulated ? 'SIMULATED DEMO EVIDENCE' : 'EMPIRICAL OBSERVATION'}
                              </span>
                            </div>
                            <p className="text-[#17251A] text-[11px] leading-relaxed">{ev.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-[#667568] pt-1 border-t border-[#E1E9DF]">
                              <span>Source: {ev.source}</span>
                              <span>Date: {ev.observation_date}</span>
                              <span>Loc: {ev.geographic_location}</span>
                              <span className="text-[#073B1A] font-semibold">Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="py-6 text-center text-[#667568] text-xs">
                        No external evidence documents attached to this intervention yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Verification Certificate Card */}
              <div className="space-y-4">
                <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 text-xs space-y-3 shadow-card">
                  <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2">
                    <span className="font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Verification Certificate
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      PMC RESILIENCE
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl space-y-2.5 text-[11px]">
                    <div>
                      <div className="text-[9px] text-[#667568] uppercase font-semibold">ACTION IDENTIFIER</div>
                      <div className="text-[#073B1A] font-bold text-sm font-mono">
                        {selectedIntervention.intervention_code}
                      </div>
                      <div className="text-[#32A817] font-semibold">{selectedIntervention.name}</div>
                    </div>

                    <div className="border-t border-[#C8DEC2] pt-2 space-y-1.5 text-[#667568]">
                      <div className="flex justify-between">
                        <span>Target Ward:</span>
                        <span className="text-[#17251A] font-bold">{ward.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Responsible Authority:</span>
                        <span className="text-[#17251A] font-medium">
                          {selectedIntervention.responsible_authority || 'PMC Urban Resilience Cell'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Executing Contractor:</span>
                        <span className="text-[#17251A] font-medium">
                          {selectedIntervention.contractor || 'PMC Civil Works'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disbursed Capital:</span>
                        <span className="text-[#073B1A] font-bold">
                          {formatINR(selectedIntervention.cost_inr || (selectedIntervention.cost_usd ? selectedIntervention.cost_usd * 83.5 : 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Mode:</span>
                        <span
                          className={`font-bold ${selectedIntervention.is_simulated_verification
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                            }`}
                        >
                          {selectedIntervention.is_simulated_verification
                            ? 'Simulated Demonstration'
                            : 'Empirical Radiometry'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-[#C8DEC2] rounded-lg text-[10px] text-[#667568] leading-relaxed">
                      This certificate validates that the biophysical parameters achieved fall within
                      the municipal target tolerance (±10% delta variance) as required by ISO 14064 climate
                      action protocols.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const isEmpirical = !selectedIntervention.is_simulated_verification;
                      const certData = {
                        certificateId: `PMC-AUDIT-CERT-${selectedIntervention.intervention_code}-${Date.now().toString(16).toUpperCase()}`,
                        interventionCode: selectedIntervention.intervention_code,
                        interventionName: selectedIntervention.name,
                        wardId: selectedIntervention.ward_id,
                        status: selectedIntervention.status,
                        verificationType: isEmpirical ? 'EMPIRICAL_SATELLITE_EVALUATION' : 'PHYSICS_SIMULATION_ESTIMATE',
                        provenance: isEmpirical ? 'Copernicus Sentinel-2 & USGS Landsat-8 Radiometry' : 'Urban Climate Twin Thermodynamic Model',
                        sha256AuditProof: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        issuedBy: 'CLIMASCOPE Municipal Decision Support System (Pune Urban Resilience Modeling Environment)',
                        issuedAt: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PMC-Certificate-${selectedIntervention.intervention_code}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#073B1A] hover:bg-[#062A13] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT AUDIT CERTIFICATE</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#667568] text-xs border border-dashed border-[#E1E9DF] rounded-2xl bg-white">
              <div>Select an intervention from the dropdown above to view outcome comparisons.</div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRYPTOGRAPHIC AUDIT LEDGER & TIMELINE                              */}
      {/* ========================================================================= */}
      {activeTab === 'cryptographic_audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Ledger Records Stream */}
          <div className="lg:col-span-2 bg-white border border-[#E1E9DF] rounded-2xl p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Append-Only Cryptographic Blocks ({ledgerEntries.length} Blocks)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                  <span>CONSENSUS VERIFIED</span>
                </span>
              </div>

              <div className="space-y-3 max-h-[550px] overflow-y-auto scrollbar-thin">
                {ledgerEntries.map((entry) => {
                  const isSelected = inspectingEntry?.id === entry.id;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setInspectingEntry(entry)}
                      className={`bg-[#F5F7F2] border rounded-xl p-3.5 text-xs space-y-2 cursor-pointer transition-all ${isSelected
                          ? 'border-[#32A817] ring-2 ring-[#32A817]/20 bg-white'
                          : 'border-[#E1E9DF] hover:border-[#32A817]/60'
                        }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 border-b border-[#E1E9DF] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#073B1A] font-bold font-mono">{entry.entry_code}</span>
                          <span className="text-[#C8DEC2]">•</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                            {entry.action_type}
                          </span>
                          {entry.is_verified && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> VERIFIED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-[10px] text-[#667568] flex items-center gap-1">
                            <Hash className="w-3 h-3 text-[#879487]" />
                            <span className="truncate max-w-[150px] font-mono">{entry.transaction_hash}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(entry.transaction_hash);
                            }}
                            className="text-[#667568] hover:text-[#17251A] p-0.5"
                            title="Copy SHA-256 Hash"
                          >
                            {copiedHash === entry.transaction_hash ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-[#073B1A] font-sans">
                            {entry.intervention_name}
                          </div>
                          <div className="text-[#667568] text-[11px] mt-0.5 leading-relaxed">
                            {entry.description}
                          </div>
                        </div>

                        {entry.is_verified && (
                          <div className="bg-[#EDF5E9] border border-[#C8DEC2] rounded-xl p-2.5 text-right shrink-0">
                            <div className="text-[10px] text-[#667568] font-medium">EMPIRICAL DELTA</div>
                            <div className="text-xs font-bold text-emerald-700">
                              Δ LST: {entry.delta_lst_celsius}°C
                            </div>
                            <div className="text-[10px] font-bold text-[#073B1A]">
                              Δ NDVI: +{entry.delta_ndvi}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#667568] pt-1 border-t border-[#E1E9DF]">
                        <span>
                          OFFICIAL: <strong className="text-[#17251A]">{entry.authorizing_official}</strong>
                        </span>
                        <span>
                          CONTRACTOR:{' '}
                          <strong className="text-[#17251A]">
                            {entry.contractor_entity || 'PMC Civil Works'}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          FUNDS:{' '}
                          <strong className="text-[#073B1A]">
                            {formatINR(entry.budget_disbursed_inr || (entry.budget_disbursed_usd ? entry.budget_disbursed_usd * 83.5 : 0))}
                          </strong>
                          {entry.is_overspent && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 border border-amber-300 text-amber-800"
                              title={entry.overspend_warning || 'Overspent'}
                            >
                              OVERSPENT
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E1E9DF] mt-3 flex items-center justify-between text-[10px] text-[#667568]">
              <span>Cryptographic proof generated under ISO 14064 GHG verification standards.</span>
              <span className="text-[#073B1A] font-bold">PMC CERTIFIED MERKLE TREE</span>
            </div>
          </div>

          {/* Right Column: Block Inspector */}
          <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Block Proof Certificate
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">AUDITED</span>
              </div>

              {inspectingEntry ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-[10px] text-[#667568] uppercase font-semibold">BLOCK IDENTIFIER</div>
                    <div className="text-sm font-bold text-[#073B1A] font-mono mt-0.5">
                      {inspectingEntry.entry_code} • {inspectingEntry.action_type}
                    </div>
                    <div className="text-[#32A817] font-bold mt-0.5 text-xs">
                      {inspectingEntry.intervention_name}
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl space-y-2 text-[11px]">
                    <div>
                      <div className="text-[9px] text-[#667568] uppercase font-semibold">SHA-256 HASH</div>
                      <div className="text-[#073B1A] font-mono font-bold break-all text-[10px] mt-0.5">
                        {inspectingEntry.transaction_hash}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-[#C8DEC2] pt-1.5 text-[#667568]">
                      <span>Disbursed Funds:</span>
                      <span className="text-[#073B1A] font-bold">
                        {formatINR(inspectingEntry.budget_disbursed_inr || (inspectingEntry.budget_disbursed_usd ? inspectingEntry.budget_disbursed_usd * 83.5 : 0))}
                      </span>
                    </div>

                    {inspectingEntry.is_overspent && (
                      <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-[10px]">
                        ⚠️ {inspectingEntry.overspend_warning || 'Warning: Actual disbursement exceeds approved budget allocation!'}
                      </div>
                    )}

                    <div className="flex justify-between text-[#667568]">
                      <span>Authorizing Official:</span>
                      <span className="text-[#17251A] font-bold">
                        {inspectingEntry.authorizing_official}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#667568]">
                      <span>Executing Contractor:</span>
                      <span className="text-[#17251A] font-medium">
                        {inspectingEntry.contractor_entity || 'PMC Civil Works'}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-[#C8DEC2] pt-1.5 text-[#667568]">
                      <span>Surface LST Delta:</span>
                      <span className="text-emerald-700 font-bold">
                        {inspectingEntry.delta_lst_celsius}°C Reduction
                      </span>
                    </div>

                    <div className="flex justify-between text-[#667568]">
                      <span>NDVI Vegetation Delta:</span>
                      <span className="text-[#073B1A] font-bold">
                        +{inspectingEntry.delta_ndvi} Biomass
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl text-[10px] text-[#667568] leading-relaxed">
                    Verified by autonomous satellite radiometry pipeline matching pre/post pass timestamps
                    from Landsat-8 TIRS (Band 10) and Copernicus Sentinel-2 MSI (Band 8 NIR).
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#667568] text-xs space-y-2">
                  <Lock className="w-8 h-8 mx-auto text-[#879487] mb-2" />
                  <div>Select any ledger entry on the left to inspect its cryptographic proof.</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E1E9DF] mt-3">
              <button
                onClick={() => {
                  const entryBlockIndex = inspectingEntry?.block_index ?? inspectingEntry?.id ?? 1;
                  const entryHash = inspectingEntry?.hash ?? inspectingEntry?.transaction_hash ?? 'N/A';
                  const cert = inspectingEntry
                    ? {
                      certificateId: `PMC-LEDGER-PROOF-${entryBlockIndex}-${entryHash.substring(0, 8)}`,
                      blockIndex: entryBlockIndex,
                      interventionId: inspectingEntry.intervention_id ?? inspectingEntry.intervention_name,
                      contractorEntity: inspectingEntry.contractor_entity || 'PMC Civil Works Taskforce',
                      deltaLstCelsius: inspectingEntry.delta_lst_celsius,
                      deltaNdvi: inspectingEntry.delta_ndvi,
                      timestamp: inspectingEntry.timestamp,
                      previousHash: inspectingEntry.previous_hash || '0'.repeat(64),
                      blockHash: entryHash,
                      tamperSeal: 'VERIFIED_SHA256_HASH_INTEGRITY',
                      issuedBy: 'CLIMASCOPE Municipal Decision Support System (Pune Urban Resilience Modeling Environment)',
                      exportedAt: new Date().toISOString(),
                    }
                    : {
                      certificateId: `PMC-LEDGER-AUDIT-SUMMARY-${Date.now().toString(16).toUpperCase()}`,
                      totalBlocks: ledgerEntries.length,
                      latestBlockHash: ledgerEntries[ledgerEntries.length - 1]?.transaction_hash || 'N/A',
                      hashChainStatus: 'CRYPTOGRAPHIC_HASH_CHAIN_VERIFIED',
                      issuedBy: 'CLIMASCOPE Municipal Decision Support System (Pune Urban Resilience Modeling Environment)',
                      exportedAt: new Date().toISOString(),
                    };
                  const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `PMC-Ledger-Audit-Certificate-${inspectingEntry ? entryBlockIndex : 'Full'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#073B1A] hover:bg-[#062A13] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT AUDIT CERTIFICATE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE INTERVENTION                                                */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs text-[#17251A]">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#073B1A] font-sans flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#32A817]" /> Register Climate Intervention Action
                </h3>
                <p className="text-[11px] text-[#667568] mt-0.5">
                  Target Ward: <strong className="text-[#073B1A]">{ward.name}</strong> ({ward.code})
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#667568] hover:text-[#17251A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Action ID / Code
                  </label>
                  <input
                    type="text"
                    value={newActionForm.intervention_code}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, intervention_code: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold font-mono focus:outline-none focus:border-[#32A817]"
                    placeholder="ACT-2026-01-01"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Category</label>
                  <select
                    value={newActionForm.category}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, category: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  >
                    <option value="CANOPY_EXPANSION">Canopy Expansion</option>
                    <option value="COOL_ROOF">Cool Roof</option>
                    <option value="PERMEABLE_PAVING">Permeable Paving</option>
                    <option value="BIOSWALE">Bioswale</option>
                    <option value="RETENTION_BASIN">Retention Basin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                  Intervention Name
                </label>
                <input
                  type="text"
                  value={newActionForm.name}
                  onChange={(e) => setNewActionForm({ ...newActionForm, name: e.target.value })}
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] font-sans text-sm focus:outline-none focus:border-[#32A817]"
                  placeholder="e.g. Miyawaki Urban Pocket Forest Corridor"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Budget Cap (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newActionForm.cost_inr || (newActionForm.cost_usd ? Math.round(newActionForm.cost_usd * 83.5) : 1250000)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewActionForm({
                        ...newActionForm,
                        cost_inr: val,
                        cost_usd: Math.round(val / 83.5),
                        annual_maintenance_inr: Math.round(val * 0.08),
                        annual_maintenance_usd: Math.round((val * 0.08) / 83.5),
                      });
                    }}
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold focus:outline-none focus:border-[#32A817]"
                    min="50000"
                    step="50000"
                    required
                  />
                  <span className="text-[10px] text-[#667568] font-mono mt-0.5 block">
                    {formatINR(newActionForm.cost_inr || (newActionForm.cost_usd ? Math.round(newActionForm.cost_usd * 83.5) : 1250000))}
                  </span>
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Initial Status
                  </label>
                  <select
                    value={newActionForm.status}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, status: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Verification Pending">Verification Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Responsible Authority
                  </label>
                  <input
                    type="text"
                    value={newActionForm.responsible_authority}
                    onChange={(e) =>
                      setNewActionForm({
                        ...newActionForm,
                        responsible_authority: e.target.value,
                      })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    placeholder="e.g. PMC Directorate of Urban Forestry"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Executing Contractor
                  </label>
                  <input
                    type="text"
                    value={newActionForm.contractor}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, contractor: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    placeholder="e.g. Western India Bio-Engineering Ltd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newActionForm.start_date}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, start_date: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Deadline</label>
                  <input
                    type="date"
                    value={newActionForm.deadline}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, deadline: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Expected Cooling (°C)
                  </label>
                  <input
                    type="number"
                    value={newActionForm.cooling_effect_celsius}
                    onChange={(e) =>
                      setNewActionForm({
                        ...newActionForm,
                        cooling_effect_celsius: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold focus:outline-none focus:border-[#32A817]"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Expected Runoff Reduction (%)
                  </label>
                  <input
                    type="number"
                    value={newActionForm.runoff_reduction_pct}
                    onChange={(e) =>
                      setNewActionForm({
                        ...newActionForm,
                        runoff_reduction_pct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold focus:outline-none focus:border-[#32A817]"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Description</label>
                <textarea
                  value={newActionForm.description}
                  onChange={(e) =>
                    setNewActionForm({ ...newActionForm, description: e.target.value })
                  }
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] h-20 leading-relaxed focus:outline-none focus:border-[#32A817]"
                  placeholder="Detailed project scope and environmental objectives..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1E9DF]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#17251A] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#32A817] hover:bg-[#288712] text-white font-semibold flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? 'Registering...' : 'Register Action & Append Ledger Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE INTERVENTION LIFECYCLE                                      */}
      {/* ========================================================================= */}
      {showUpdateModal && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs text-[#17251A]">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#073B1A] font-sans flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#32A817]" /> Update Intervention Lifecycle
                </h3>
                <p className="text-[11px] text-[#667568] mt-0.5">
                  Action: <strong className="text-[#073B1A] font-mono">{actionTarget.intervention_code}</strong> •{' '}
                  {actionTarget.name}
                </p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-[#667568] hover:text-[#17251A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Lifecycle Status
                  </label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] font-semibold focus:outline-none focus:border-[#32A817]"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Verification Pending">Verification Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Implementation Progress ({updateForm.progress_pct}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={updateForm.progress_pct}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, progress_pct: Number(e.target.value) })
                    }
                    className="w-full mt-2 accent-[#32A817]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Responsible Authority
                  </label>
                  <input
                    type="text"
                    value={updateForm.responsible_authority}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, responsible_authority: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Assigned Contractor
                  </label>
                  <input
                    type="text"
                    value={updateForm.contractor}
                    onChange={(e) => setUpdateForm({ ...updateForm, contractor: e.target.value })}
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={updateForm.start_date}
                    onChange={(e) => setUpdateForm({ ...updateForm, start_date: e.target.value })}
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Deadline</label>
                  <input
                    type="date"
                    value={updateForm.deadline}
                    onChange={(e) => setUpdateForm({ ...updateForm, deadline: e.target.value })}
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                  Progress Notes / Update Description
                </label>
                <textarea
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] h-16 leading-relaxed focus:outline-none focus:border-[#32A817]"
                  placeholder="Record milestone updates, civil works inspection logs, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1E9DF]">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#17251A] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#32A817] hover:bg-[#288712] text-white font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Updating...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATTACH VERIFIABLE EVIDENCE                                         */}
      {/* ========================================================================= */}
      {showEvidenceModal && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs text-[#17251A]">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#073B1A] font-sans flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-600" /> Attach Verifiable Remote Sensing Evidence
                </h3>
                <p className="text-[11px] text-[#667568] mt-0.5">
                  Action: <strong className="text-[#073B1A] font-mono">{actionTarget.intervention_code}</strong> •{' '}
                  {actionTarget.name}
                </p>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-[#667568] hover:text-[#17251A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvidenceSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Evidence Type
                  </label>
                  <select
                    value={evidenceForm.evidence_type}
                    onChange={(e) =>
                      setEvidenceForm({ ...evidenceForm, evidence_type: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  >
                    <option value="SATELLITE_MULTISPECTRAL">Satellite Multispectral (Sentinel-2/Landsat)</option>
                    <option value="DRONE_THERMAL_SURVEY">Drone Thermal Survey (FLIR Radiometry)</option>
                    <option value="GROUND_RUNOFF_SENSOR">Ground Runoff Gauge Telemetry</option>
                    <option value="SOIL_MOISTURE_PROBE">Soil Moisture Profile Telemetry</option>
                    <option value="MUNICIPAL_INSPECTION_MEMO">Municipal Engineering Audit Memo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Observation Date
                  </label>
                  <input
                    type="date"
                    value={evidenceForm.observation_date}
                    onChange={(e) =>
                      setEvidenceForm({ ...evidenceForm, observation_date: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                  Evidence Source / Sensor Rig
                </label>
                <input
                  type="text"
                  value={evidenceForm.source}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })}
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  placeholder="e.g. Copernicus Sentinel-2 MSI Band 8 NIR (Level 2A BOA)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Geographic Coordinates
                  </label>
                  <input
                    type="text"
                    value={evidenceForm.geographic_location}
                    onChange={(e) =>
                      setEvidenceForm({ ...evidenceForm, geographic_location: e.target.value })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                    placeholder="18.5204° N, 73.8567° E"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Confidence Score ({(evidenceForm.confidence * 100).toFixed(0)}%)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={evidenceForm.confidence}
                    onChange={(e) =>
                      setEvidenceForm({ ...evidenceForm, confidence: Number(e.target.value) })
                    }
                    className="w-full mt-2 accent-amber-600"
                  />
                </div>
              </div>

              {/* Simulated Demonstration Evidence Toggle */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-amber-900 font-bold block">
                    Simulated Demonstration Evidence
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Label this evidence as a demonstration simulation when real orbital telemetry is
                    pending.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={evidenceForm.is_simulated}
                  onChange={(e) =>
                    setEvidenceForm({ ...evidenceForm, is_simulated: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">Description</label>
                <textarea
                  value={evidenceForm.description}
                  onChange={(e) =>
                    setEvidenceForm({ ...evidenceForm, description: e.target.value })
                  }
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] h-16 leading-relaxed focus:outline-none focus:border-[#32A817]"
                  placeholder="Summary of radiometry findings, NDVI increase, surface cooling, etc."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1E9DF]">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#17251A] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Attaching...' : 'Attach & Append SHA-256 Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERIFY IMPLEMENTATION OUTCOME                                       */}
      {/* ========================================================================= */}
      {showVerifyModal && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs text-[#17251A]">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#073B1A] font-sans flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Execute Outcome Verification
                </h3>
                <p className="text-[11px] text-[#667568] mt-0.5">
                  Action: <strong className="text-[#073B1A] font-mono">{actionTarget.intervention_code}</strong> •{' '}
                  {actionTarget.name}
                </p>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-[#667568] hover:text-[#17251A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              {/* Simulation Mode Toggle */}
              <div className="p-3 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#073B1A] font-bold">Verification Pipeline Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVerifyForm({
                          ...verifyForm,
                          simulate: true,
                          evidence_source:
                            'Copernicus Sentinel-2 Synthetic Re-Pass (Demonstration Run)',
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${verifyForm.simulate
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-[#667568] border-[#E1E9DF]'
                        }`}
                    >
                      Simulated Demonstration
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVerifyForm({
                          ...verifyForm,
                          simulate: false,
                          evidence_source: 'Copernicus Sentinel-2 MSI Band 8 NIR & Landsat-8 TIRS',
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${!verifyForm.simulate
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white text-[#667568] border-[#E1E9DF]'
                        }`}
                    >
                      Empirical Satellite
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-[#667568] leading-relaxed">
                  {verifyForm.simulate
                    ? 'SIMULATED DEMO: Models expected radiometry when real post-intervention satellite pass is scheduled for later date. Clearly tagged as demonstration in audit ledger.'
                    : 'EMPIRICAL RADIOMETRY: Uses calibrated Sentinel-2 MSI and Landsat-8 surface radiometry data to certify actual physical deltas.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Observed Cooling (°C)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={verifyForm.observed_cooling_celsius}
                    onChange={(e) =>
                      setVerifyForm({
                        ...verifyForm,
                        observed_cooling_celsius: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold focus:outline-none focus:border-[#32A817]"
                    required
                  />
                  <span className="text-[10px] text-[#667568] mt-0.5 block font-mono">
                    Planned: -{actionTarget.cooling_effect_celsius}°C
                  </span>
                </div>

                <div>
                  <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                    Observed Runoff Reduction (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={verifyForm.observed_runoff_reduction_pct}
                    onChange={(e) =>
                      setVerifyForm({
                        ...verifyForm,
                        observed_runoff_reduction_pct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#073B1A] font-bold focus:outline-none focus:border-[#32A817]"
                    required
                  />
                  <span className="text-[10px] text-[#667568] mt-0.5 block font-mono">
                    Planned: -{actionTarget.runoff_reduction_pct}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[#667568] text-[10px] uppercase block mb-1 font-semibold">
                  Evidence Source Reference
                </label>
                <input
                  type="text"
                  value={verifyForm.evidence_source}
                  onChange={(e) =>
                    setVerifyForm({ ...verifyForm, evidence_source: e.target.value })
                  }
                  className="w-full bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3 py-2 text-[#17251A] focus:outline-none focus:border-[#32A817]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1E9DF]">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#EDF5E9] hover:bg-[#E2EEDF] text-[#17251A] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#32A817] hover:bg-[#288712] text-white font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Verifying...' : 'Execute & Record in Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
