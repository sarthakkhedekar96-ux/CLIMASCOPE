import {
  ApiResponse,
  HealthStatus,
  WardSummary,
  WardDetail,
  WardGeoJSONCollection,
  CityOverviewMetrics,
  ClimateMetric,
  Intervention,
  OptimizationRequest,
  OptimizationResult,
  EvidenceGraphResponse,
  LedgerEntry,
  LedgerAuditSummary,
  ClimateDebtCalculation,
  CustomCalculationPayload,
  InvestigationReportData,
  SimulationInputs,
  SimulationResult,
  AssumptionItem,
  CreateInterventionPayload,
  UpdateInterventionPayload,
  AttachEvidencePayload,
  VerifyInterventionPayload,
  OutcomeComparisonResult,
  CopilotQueryRequest,
  CopilotQueryResponse,
  SuggestedQuestionsResponse,
  DataQualitySummary,
  CostAssumptionItem,
  FinancialSummaryResponse,
  CMIP6ProjectionResponse,
  ClimateDataSource,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`Fetch failed for ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  async getHealth(): Promise<HealthStatus> {
    return fetchJson<HealthStatus>('/health');
  },

  // Wards
  async getWards(): Promise<ApiResponse<WardSummary[]>> {
    return fetchJson<ApiResponse<WardSummary[]>>('/wards');
  },

  async getWardsGeoJSON(): Promise<WardGeoJSONCollection> {
    return fetchJson<WardGeoJSONCollection>('/wards/geojson');
  },

  async getWardDetail(id: number): Promise<ApiResponse<WardDetail>> {
    return fetchJson<ApiResponse<WardDetail>>(`/wards/${id}`);
  },

  // City Metrics
  async getCityOverview(): Promise<ApiResponse<CityOverviewMetrics>> {
    return fetchJson<ApiResponse<CityOverviewMetrics>>('/metrics/city-overview');
  },

  async getWardMetricHistory(wardId: number): Promise<ApiResponse<ClimateMetric[]>> {
    return fetchJson<ApiResponse<ClimateMetric[]>>(`/metrics/ward/${wardId}/history`);
  },

  // Interventions & Optimizer
  async getInterventions(wardId?: number, status?: string): Promise<ApiResponse<Intervention[]>> {
    const params = new URLSearchParams();
    if (wardId) params.append('ward_id', wardId.toString());
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<ApiResponse<Intervention[]>>(`/interventions${qs}`);
  },

  async optimizeInterventions(req: OptimizationRequest): Promise<ApiResponse<OptimizationResult>> {
    return fetchJson<ApiResponse<OptimizationResult>>('/interventions/optimize', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async getCostAssumptions(): Promise<ApiResponse<CostAssumptionItem[]>> {
    return fetchJson<ApiResponse<CostAssumptionItem[]>>('/interventions/cost-assumptions');
  },

  async getFinancialSummary(): Promise<ApiResponse<FinancialSummaryResponse>> {
    return fetchJson<ApiResponse<FinancialSummaryResponse>>('/interventions/financial-summary');
  },

  async createIntervention(payload: CreateInterventionPayload): Promise<ApiResponse<Intervention>> {
    return fetchJson<ApiResponse<Intervention>>('/interventions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateIntervention(
    id: number,
    payload: UpdateInterventionPayload
  ): Promise<ApiResponse<Intervention>> {
    return fetchJson<ApiResponse<Intervention>>(`/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async attachEvidence(
    id: number,
    payload: AttachEvidencePayload
  ): Promise<ApiResponse<Intervention>> {
    return fetchJson<ApiResponse<Intervention>>(`/interventions/${id}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyIntervention(
    id: number,
    payload: VerifyInterventionPayload
  ): Promise<ApiResponse<OutcomeComparisonResult>> {
    return fetchJson<ApiResponse<OutcomeComparisonResult>>(`/interventions/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOutcomeComparison(id: number): Promise<ApiResponse<OutcomeComparisonResult>> {
    return fetchJson<ApiResponse<OutcomeComparisonResult>>(`/interventions/${id}/outcome-comparison`);
  },

  // Evidence Graph
  async getEvidenceGraph(wardId: number): Promise<ApiResponse<EvidenceGraphResponse>> {
    return fetchJson<ApiResponse<EvidenceGraphResponse>>(`/evidence/${wardId}`);
  },

  // Climate Action Ledger
  async getLedgerEntries(wardId?: number, actionType?: string): Promise<ApiResponse<LedgerEntry[]>> {
    const params = new URLSearchParams();
    if (wardId) params.append('ward_id', wardId.toString());
    if (actionType) params.append('action_type', actionType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<ApiResponse<LedgerEntry[]>>(`/ledger${qs}`);
  },

  async getLedgerAudit(): Promise<ApiResponse<LedgerAuditSummary>> {
    return fetchJson<ApiResponse<LedgerAuditSummary>>('/ledger/audit-summary');
  },

  // Climate Debt Engine
  async getWardClimateDebt(wardId: string | number): Promise<ApiResponse<ClimateDebtCalculation>> {
    return fetchJson<ApiResponse<ClimateDebtCalculation>>(`/climate-debt/${wardId}`);
  },

  async calculateCustomClimateDebt(
    payload: CustomCalculationPayload
  ): Promise<ApiResponse<ClimateDebtCalculation>> {
    return fetchJson<ApiResponse<ClimateDebtCalculation>>('/climate-debt/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // AI Climate Investigator
  async getInvestigationReport(wardId: string | number): Promise<ApiResponse<InvestigationReportData>> {
    return fetchJson<ApiResponse<InvestigationReportData>>(`/investigate/${wardId}`);
  },

  // Urban Climate Twin
  async runSimulation(inputs: SimulationInputs): Promise<SimulationResult> {
    return fetchJson<SimulationResult>('/simulate/run', {
      method: 'POST',
      body: JSON.stringify(inputs),
    });
  },

  async getSimulationAssumptions(): Promise<AssumptionItem[]> {
    return fetchJson<AssumptionItem[]>('/simulate/assumptions');
  },

  async getWardBaselineSimulation(wardId: string | number): Promise<SimulationResult> {
    return fetchJson<SimulationResult>(`/simulate/baseline/${wardId}`);
  },

  // AI Climate Copilot
  async queryCopilot(payload: CopilotQueryRequest): Promise<ApiResponse<CopilotQueryResponse>> {
    return fetchJson<ApiResponse<CopilotQueryResponse>>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCopilotSuggestedQuestions(
    wardId?: number | null,
    currentPhase: string = 'overview'
  ): Promise<ApiResponse<SuggestedQuestionsResponse>> {
    const params = new URLSearchParams();
    if (wardId) params.append('ward_id', wardId.toString());
    params.append('current_phase', currentPhase);
    return fetchJson<ApiResponse<SuggestedQuestionsResponse>>(
      `/copilot/suggested-questions?${params.toString()}`
    );
  },

  // Climate Data Quality & Provenance Summary
  async getDataQualitySummary(): Promise<ApiResponse<DataQualitySummary>> {
    return fetchJson<ApiResponse<DataQualitySummary>>('/metrics/data-quality-summary');
  },

  // CMIP6 Projections & Climate Data Sources
  async getProjections(wardId: string | number): Promise<ApiResponse<CMIP6ProjectionResponse>> {
    return fetchJson<ApiResponse<CMIP6ProjectionResponse>>(`/metrics/projections/${wardId}`);
  },

  async getDataSources(): Promise<ApiResponse<ClimateDataSource[]>> {
    return fetchJson<ApiResponse<ClimateDataSource[]>>('/metrics/data-sources');
  },
};
