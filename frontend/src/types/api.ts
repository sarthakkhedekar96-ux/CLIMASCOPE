export type NavigationTab =
  | 'overview'
  | 'climate-map'
  | 'detect'
  | 'ward-intelligence'
  | 'investigate'
  | 'ai-investigator'
  | 'predict'
  | 'simulate'
  | 'climate-twin'
  | 'prioritize'
  | 'budget-optimizer'
  | 'act'
  | 'verify'
  | 'action-ledger'
  | 'reports'
  | 'settings';

export type WorkflowPhase =
  | 'detect'
  | 'investigate'
  | 'predict'
  | 'simulate'
  | 'prioritize'
  | 'act'
  | 'verify';

export type ProvenanceCategory =
  | 'OBSERVED'
  | 'DERIVED'
  | 'SIMULATED'
  | 'PROJECTED'
  | 'UNVERIFIED';

export type JurisdictionType =
  | 'PMC_STUDY_AREA'
  | 'PCMC_STUDY_AREA'
  | 'PMR_STUDY_AREA';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error_details?: string;
}

export interface HealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  version: string;
  timestamp: string;
  database_connected: boolean;
  telemetry_status: 'NOMINAL' | 'ALERT' | 'STANDBY';
  active_wards_count: number;
  active_interventions_count: number;
}

export interface GeoJSONGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface WardGeoJSONProperties {
  id: number;
  code: string;
  name: string;
  study_area_id?: string;
  study_area_name?: string;
  jurisdiction_name?: string;
  jurisdiction?: string;
  jurisdiction_type?: JurisdictionType;
  boundary_source?: string;
  boundary_is_verified?: boolean;
  boundary_notes?: string;
  is_approximate_boundary?: boolean;
  data_source?: string;
  zone: string;
  area_sq_km: number;
  population: number;
  vulnerable_population_pct: number;
  heat_index_celsius: number;
  canopy_cover_pct: number;
  vegetation_loss_pct: number;
  impervious_surface_pct: number;
  built_up_growth_pct: number;
  flood_susceptibility_idx: number;
  baseline_risk_score: number;
  climate_debt_score: number;
  status_badge: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE';
  data_confidence_pct: number;
  center_lat?: number;
  center_lon?: number;
}

export interface WardGeoJSONFeature {
  type: 'Feature';
  id: number;
  geometry: GeoJSONGeometry;
  properties: WardGeoJSONProperties;
}

export interface WardGeoJSONCollection {
  type: 'FeatureCollection';
  features: WardGeoJSONFeature[];
}

export interface WardSummary {
  id: number;
  code: string;
  name: string;
  study_area_id?: string;
  study_area_name?: string;
  jurisdiction_name?: string;
  jurisdiction?: string;
  jurisdiction_type?: JurisdictionType;
  boundary_source?: string;
  boundary_is_verified?: boolean;
  boundary_notes?: string;
  data_source?: string;
  zone: string;
  area_sq_km: number;
  population: number;
  vulnerable_population_pct: number;
  center_lat: number;
  center_lon: number;
  canopy_cover_pct: number;
  impervious_surface_pct: number;
  albedo_avg: number;
  flood_susceptibility_idx: number;
  heat_index_celsius: number;
  baseline_risk_score: number;
  climate_debt_score: number;
  tree_canopy_deficit_sq_m: number;
  status_badge: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE';
  summary_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WardDetail extends WardSummary {
  geometry_geojson: string;
  active_interventions_count: number;
  latest_lst_celsius?: number;
  latest_ndvi?: number;
  latest_aqi?: number;
}

export interface ClimateMetric {
  id: number;
  ward_id: number;
  timestamp: string;
  ndvi: number;
  ndbi: number;
  lst_celsius: number;
  surface_temp_anomaly: number;
  air_temp_celsius: number;
  relative_humidity_pct: number;
  aqi_pm25: number;
  precipitation_mm: number;
  runoff_coefficient: number;
  soil_moisture_pct: number;
  is_simulated: boolean;
  source: string;
  data_type?: ProvenanceCategory;
  source_name?: string;
  source_url?: string;
  sensor_id?: string;
  acquisition_date?: string;
  processing_date?: string;
  spatial_resolution?: string;
  temporal_resolution?: string;
  is_verified?: boolean;
  confidence_score?: number;
  quality_flag: string;
  methodology?: string;
  limitations?: string;
  notes?: string;
}

export interface DataQualitySummary {
  total_study_areas: number;
  verified_boundaries_count: number;
  approximate_boundaries_count: number;
  observed_metrics_count: number;
  derived_metrics_count: number;
  simulated_metrics_count: number;
  projected_metrics_count: number;
  missing_source_count: number;
  unverified_measurements_count: number;
  boundary_disclaimer: string;
  jurisdictions_breakdown: Record<string, number>;
}

export interface ClimateDebtSummary {
  city_average_debt_score: number;
  accumulated_thermal_debt_celsius_years: number;
  total_canopy_deficit_sq_km: number;
  total_unmitigated_runoff_m3_yr: number;
  estimated_remediation_capital_needed_usd: number;
  estimated_remediation_capital_needed_inr?: number;
  wards_in_critical_debt: number;
}

export interface MonthlyTrendPoint {
  month: string;
  timestamp: string;
  avg_lst_celsius: number;
  avg_ndvi: number;
  baseline_lst_celsius: number;
  precipitation_mm: number;
}

export interface RecentClimateEvent {
  id: string;
  timestamp: string;
  ward_code: string;
  ward_name: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'HEAT' | 'FLOOD' | 'CANOPY' | 'SATELLITE';
  description: string;
  source: string;
}

export interface CityOverviewMetrics {
  city_name: string;
  total_wards: number;
  total_population: number;
  population_exposed: number;
  average_heat_index_celsius: number;
  peak_surface_temp_celsius: number;
  average_canopy_cover_pct: number;
  critical_wards_count: number;
  elevated_wards_count: number;
  stable_wards_count: number;
  total_active_interventions: number;
  total_committed_budget_usd: number;
  total_committed_budget_inr?: number;
  telemetry_health: string;
  climate_debt: ClimateDebtSummary;
  environmental_trends?: MonthlyTrendPoint[];
  hazard_distribution?: Record<string, number>;
  debt_distribution?: Record<string, number>;
  recent_events?: RecentClimateEvent[];
}

export interface Intervention {
  id: number;
  ward_id: number;
  intervention_code: string;
  name: string;
  category: 'CANOPY_EXPANSION' | 'COOL_ROOF' | 'PERMEABLE_PAVING' | 'BIOSWALE' | 'RETENTION_BASIN' | string;
  currency?: string;
  cost_inr?: number;
  annual_maintenance_inr?: number;
  cost_usd: number;
  estimated_cost_inr?: number;
  estimated_cost_usd?: number;
  target_area_sq_m: number;
  annual_maintenance_usd: number;
  cost_category?: string;
  cost_per_unit?: number;
  unit_measure?: string;
  quantity?: number;
  estimated_total_cost?: number;
  funding_source?: string;
  fiscal_year?: string;
  jurisdiction?: string;
  is_simulated?: boolean;
  approved_budget_inr?: number;
  actual_expenditure_inr?: number;
  financial_status?: string;
  cooling_effect_celsius: number;
  runoff_reduction_pct: number;
  vegetation_increase_pct?: number;
  co2_sequestration_t_yr: number;
  roi_score: number;
  status: 'Proposed' | 'Approved' | 'In Progress' | 'Completed' | 'Verification Pending' | 'Verified' | 'Failed' | string;
  timeline_months: number;
  contractor?: string;
  description?: string;
  responsible_authority?: string;
  start_date?: string;
  deadline?: string;
  progress_pct?: number;
  expected_outcome?: string;
  observed_outcome?: string;
  difference_outcome?: string;
  verification_status?: string;
  evidence_source?: string;
  verification_date?: string;
  is_simulated_verification?: boolean;
  attached_evidence_json?: string;
  created_at: string;
  updated_at: string;
}

export interface AttachedEvidenceItem {
  evidence_id: string;
  evidence_type: string;
  source: string;
  observation_date: string;
  geographic_location: string;
  confidence: number;
  description: string;
  is_simulated: boolean;
  created_at?: string;
}

export interface CreateInterventionPayload {
  ward_id: number;
  intervention_code?: string;
  name: string;
  category: string;
  currency?: string;
  cost_inr?: number;
  cost_usd?: number;
  annual_maintenance_inr?: number;
  annual_maintenance_usd?: number;
  target_area_sq_m?: number;
  cost_category?: string;
  cost_per_unit?: number;
  unit_measure?: string;
  quantity?: number;
  estimated_total_cost?: number;
  funding_source?: string;
  fiscal_year?: string;
  jurisdiction?: string;
  is_simulated?: boolean;
  approved_budget_inr?: number;
  actual_expenditure_inr?: number;
  financial_status?: string;
  cooling_effect_celsius?: number;
  runoff_reduction_pct?: number;
  co2_sequestration_t_yr?: number;
  roi_score?: number;
  status?: string;
  timeline_months?: number;
  contractor?: string;
  responsible_authority?: string;
  start_date?: string;
  deadline?: string;
  progress_pct?: number;
  description?: string;
}

export interface UpdateInterventionPayload {
  name?: string;
  category?: string;
  cost_inr?: number;
  cost_usd?: number;
  annual_maintenance_inr?: number;
  approved_budget_inr?: number;
  actual_expenditure_inr?: number;
  financial_status?: string;
  responsible_authority?: string;
  contractor?: string;
  start_date?: string;
  deadline?: string;
  progress_pct?: number;
  status?: string;
  description?: string;
}

export interface AttachEvidencePayload {
  evidence_type: string;
  source: string;
  observation_date: string;
  geographic_location: string;
  description: string;
  confidence: number;
  is_simulated: boolean;
}

export interface VerifyInterventionPayload {
  simulate: boolean;
  observed_cooling_celsius?: number;
  observed_runoff_reduction_pct?: number;
  evidence_source?: string;
}

export interface OutcomeComparisonResult {
  intervention_id: number;
  intervention_code: string;
  name: string;
  ward_name: string;
  planned_cooling_celsius: number;
  observed_cooling_celsius: number;
  cooling_difference_celsius: number;
  cooling_target_met: boolean;
  planned_runoff_reduction_pct: number;
  observed_runoff_reduction_pct: number;
  runoff_difference_pct: number;
  runoff_target_met: boolean;
  verification_status: string;
  evidence_source: string;
  verification_date: string;
  is_simulated: boolean;
  audit_block_hash: string;
}

export interface CostAssumptionItem {
  category: string;
  intervention_name: string;
  unit_cost_inr: number;
  unit_label: string;
  annual_maintenance_inr_pct: number;
  expected_lifespan_years: number;
  cooling_benefit_per_unit: string;
  stormwater_benefit_per_unit: string;
  methodology: string;
  official_reference: string;
}

export interface FinancialSummaryResponse {
  total_available_budget_inr: number;
  total_allocated_budget_inr: number;
  total_expenditure_inr: number;
  total_remaining_budget_inr: number;
  budget_utilization_pct: number;
  cost_by_category: Record<string, number>;
  cost_by_jurisdiction: Record<string, number>;
  cost_per_beneficiary_inr: number;
  total_beneficiaries: number;
  resilience_benefit_per_lakh_inr: number;
  fiscal_year: string;
  currency: string;
}

export interface OptimizationRequest {
  budget_inr?: number;
  budget_cap_usd?: number;
  currency?: string;
  target_ward_ids?: number[];
  primary_objective?: 'MAX_COOLING' | 'MAX_RUNOFF_REDUCTION' | 'MAX_EQUITY' | 'BALANCED' | 'MAX_POPULATION';
  equity_weight_factor?: number;
}

export interface OptimizedIntervention extends Intervention {
  ward_code: string;
  ward_name: string;
  equity_multiplier: number;
  feasibility_score: number;
  utility_score: number;
  marginal_efficiency: number;
  population_benefited: number;
  projected_debt_relief: number;
}

export interface RejectedIntervention {
  id: number;
  intervention_code: string;
  name: string;
  ward_code: string;
  ward_name: string;
  category: string;
  cost_inr?: number;
  cost_usd: number;
  cooling_effect_celsius: number;
  runoff_reduction_pct: number;
  utility_score: number;
  marginal_efficiency: number;
  rejection_reason: string;
  budget_deficit_inr?: number;
  budget_deficit_usd: number;
}

export interface WardAllocationSummary {
  ward_id: number;
  ward_code: string;
  ward_name: string;
  ward_zone: string;
  vulnerability_pct: number;
  climate_debt_score: number;
  allocated_inr?: number;
  allocated_usd: number;
  pct_of_total_budget: number;
  interventions_count: number;
  projected_cooling_celsius: number;
  projected_runoff_reduction_pct: number;
  projected_debt_relief: number;
  population_benefited: number;
}

export interface CategoryAllocation {
  category: string;
  allocated_inr?: number;
  allocated_usd: number;
  pct_of_total: number;
  projects_count: number;
}

export interface CostImpactDataPoint {
  id: number;
  code: string;
  name: string;
  ward_code: string;
  cost_lakhs?: number;
  cost_inr?: number;
  cost_k: number;
  risk_reduction: number;
  population_benefited: number;
  is_selected: boolean;
  roi_score: number;
  category: string;
}

export interface OptimizationResult {
  currency?: string;
  budget_cap_inr?: number;
  total_cost_inr?: number;
  remaining_budget_inr?: number;
  budget_utilization_pct?: number;
  budget_cap_usd: number;
  total_cost_usd: number;
  remaining_budget_usd: number;
  selected_interventions: Intervention[];
  projected_mean_cooling_celsius: number;
  projected_mean_runoff_reduction_pct: number;
  projected_annual_co2_offset_tons: number;
  cost_efficiency_rating: string;
  optimization_method: string;
  selected_wards: WardAllocationSummary[];
  recommended_interventions: OptimizedIntervention[];
  rejected_interventions: RejectedIntervention[];
  total_population_benefited: number;
  vulnerable_population_benefited: number;
  aggregate_debt_reduction: number;
  allocation_by_ward: WardAllocationSummary[];
  allocation_by_category: CategoryAllocation[];
  cost_versus_impact: CostImpactDataPoint[];
  mathematical_explanation: string;
  solver_diagnostics: Record<string, any>;
  epistemic_disclaimer: string;
}

export interface EvidenceNode {
  id: number;
  ward_id: number;
  node_id: string;
  node_type: 'CAUSE' | 'STRESSOR' | 'IMPACT' | 'VULNERABILITY' | 'MITIGATION';
  label: string;
  description?: string;
  value_display: string;
  confidence_score: number;
  evidence_source: string;
}

export interface EvidenceEdge {
  id: number;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  weight: number;
  statistical_significance?: number;
  mechanism_explanation: string;
}

export interface EvidenceGraphResponse {
  ward_id: number;
  ward_name: string;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  causal_summary: string;
  data_provenance: string;
}

export interface LedgerEntry {
  id: number;
  ward_id: number;
  entry_code: string;
  transaction_hash: string;
  hash?: string;
  previous_hash?: string;
  block_index?: number;
  intervention_id?: number | string;
  timestamp: string;
  action_type: 'BUDGET_ALLOCATION' | 'WORK_ORDER_ISSUED' | 'COMPLETION_REPORT' | 'EMPIRICAL_VERIFICATION' | string;
  intervention_name: string;
  description: string;
  currency?: string;
  budget_allocated_inr?: number;
  budget_disbursed_inr?: number;
  actual_expenditure_inr?: number;
  funding_source?: string;
  fiscal_year?: string;
  jurisdiction?: string;
  is_overspent?: boolean;
  overspend_warning?: string;
  budget_allocated_usd: number;
  budget_disbursed_usd: number;
  contractor_entity?: string;
  authorizing_official: string;
  delta_ndvi?: number;
  delta_lst_celsius?: number;
  delta_runoff_pct?: number;
  is_verified: boolean;
  verification_method?: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerAuditSummary {
  total_entries_count: number;
  currency?: string;
  total_budget_allocated_inr?: number;
  total_budget_disbursed_inr?: number;
  total_actual_expenditure_inr?: number;
  total_remaining_budget_inr?: number;
  overspent_entries_count?: number;
  has_overspend_warnings?: boolean;
  total_budget_allocated_usd: number;
  total_budget_disbursed_usd: number;
  total_verified_actions: number;
  net_verified_surface_cooling_celsius: number;
  net_verified_vegetation_gain_ndvi: number;
  ledger_integrity_verified: boolean;
}

export interface ContributingFactor {
  factor: string;
  category: 'HAZARD' | 'DEGRADATION' | 'VULNERABILITY' | 'ADAPTIVE_CAPACITY';
  indicator: string;
  rawValue: string;
  normalizedScore: number;
  weight: number;
  contributionPoints: number;
  direction: 'INCREASING' | 'DECREASING';
  description: string;
}

export interface ExplainabilityBreakdown {
  thermalContribution: number;
  canopyDeficitContribution: number;
  imperviousnessContribution: number;
  floodContribution: number;
  demographicContribution: number;
  adaptiveCapacityOffset: number;
  totalClimateDebt: number;
}

export interface ClimateDebtCalculation {
  wardId: string;
  climateDebt: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
  heatRisk: number;
  floodRisk: number;
  vegetationLoss: number;
  builtUpGrowth: number;
  vulnerability: number;
  adaptiveCapacity: number;
  trend: 'ACCELERATING' | 'INCREASING' | 'STABLE' | 'RECOVERING';
  confidence: number;
  dataCompletenessLevel?: 'HIGH_COMPLETENESS' | 'MODERATE_COMPLETENESS' | 'LOW_COMPLETENESS';
  methodologyNotes?: string;
  explainabilityBreakdown?: ExplainabilityBreakdown;
  contributingFactors: ContributingFactor[];
}

export interface CustomCalculationPayload {
  wardId?: string;
  surface_temp_anomaly_celsius?: number;
  vegetation_loss_pct?: number;
  built_up_growth_pct?: number;
  flood_exposure_idx?: number;
  air_pollution_pm25?: number;
  water_stress_idx?: number;
  population_vulnerability_pct?: number;
  intervention_coverage_pct?: number;
  w_heat?: number;
  w_flood?: number;
  w_degradation?: number;
  w_vulnerability?: number;
}

export interface EvidenceItemRecord {
  evidence_id: string;
  evidence_type: string;
  source: string;
  observation_date: string;
  geographic_location: string;
  confidence: number;
  description: string;
  is_observed_fact: boolean;
  category: string;
}

export interface ObservedChangeItem {
  metric_name: string;
  observed_value: string;
  baseline_value: string;
  delta: string;
  epistemic_status: string;
  sensor_source: string;
}

export interface ContributingFactorHypothesisItem {
  factor_name: string;
  category: string;
  mechanism_hypothesis: string;
  confidence: number;
  epistemic_status: string;
  supporting_evidence_ids: string[];
  alternative_explanations?: string[];
  correlation_vs_causation_note?: string;
}

export interface InvestigationReportData {
  ward_id: string;
  ward_name: string;
  ward_zone: string;
  investigation_date: string;
  executive_summary: string;
  observed_environmental_changes: ObservedChangeItem[];
  potential_contributing_factors: ContributingFactorHypothesisItem[];
  supporting_evidence: EvidenceItemRecord[];
  confidence_level: number;
  missing_information: string[];
  recommended_field_investigation: string[];
  suggested_interventions: string[];
  relationship_graph: {
    name: string;
    type: string;
    children: Array<{
      name: string;
      type: string;
      metric?: string;
      children: Array<{
        id: string;
        name: string;
        type: string;
        source: string;
        date: string;
        location: string;
        confidence: number;
        isFact: boolean;
        description: string;
      }>;
    }>;
  };
  scientific_questions_assessment?: Record<string, string>;
}


export interface ScenarioMetrics {
  climate_debt: number;
  heat_risk_celsius: number;
  green_coverage_pct: number;
  surface_runoff_risk_pct: number;
  population_exposure: number;
  estimated_cost_usd: number;
  estimated_cost_inr?: number;
  annual_maintenance_inr?: number;
}

export interface MetricImprovement {
  baseline_value: number;
  simulated_value: number;
  delta: number;
  pct_improvement: number;
  unit: string;
  is_favorable: boolean;
}

export interface AssumptionItem {
  parameter: string;
  unit_cost_or_coefficient: string;
  formula: string;
  scientific_rationale: string;
  time_to_benefit_horizon?: string;
  physical_mechanism?: string;
  limitations?: string;
  degradation_or_maintenance_factor?: string;
}

export interface SimulationResult {
  ward_id: string;
  ward_name: string;
  ward_code: string;
  area_sq_km: number;
  population: number;
  currency?: string;
  available_budget_usd: number;
  estimated_cost_usd: number;
  budget_surplus_deficit_usd: number;
  available_budget_inr?: number;
  estimated_cost_inr?: number;
  annual_maintenance_inr?: number;
  budget_surplus_deficit_inr?: number;
  budget_utilization_pct?: number;
  is_budget_sufficient: boolean;
  baseline: ScenarioMetrics;
  simulated: ScenarioMetrics;
  single_interventions: Record<string, ScenarioMetrics>;
  improvements: Record<string, MetricImprovement>;
  assumptions: AssumptionItem[];
  epistemic_disclaimer: string;
  epistemic_status?: string;
}

export interface ClimateDataSource {
  source_id: string;
  name: string;
  provider: string;
  provider_url: string;
  sensor_or_platform: string;
  spatial_resolution: string;
  temporal_resolution: string;
  spectral_bands_or_parameters: string;
  integration_status: string;
  calibration_and_validation: string;
  scientific_limitations: string;
}

export interface DecadalProjectionPoint {
  year: number;
  heat_index_p10: number;
  heat_index_p50: number;
  heat_index_p90: number;
  heatwave_days_p50: number;
  extreme_precip_risk_p50: number;
  climate_debt_p50: number;
}

export interface ScenarioProjection {
  scenario_id: string;
  scenario_name: string;
  radiative_forcing_wm2: number;
  description: string;
  annual_warming_rate_celsius: number;
  trajectory: DecadalProjectionPoint[];
}

export interface BaselineComparisonRow {
  time_horizon: string;
  scenario: string;
  heat_index_celsius: number;
  heat_index_range: string;
  heatwave_days_per_year: number;
  flood_susceptibility_idx: number;
  climate_debt_score: number;
  projected_economic_loss_inr_cr: number;
  epistemic_status: string;
}

export interface CMIP6ProjectionResponse {
  ward_id: number;
  ward_code: string;
  ward_name: string;
  study_area_id?: string;
  jurisdiction_name: string;
  baseline_period: string;
  current_observation_year: number;
  historical_baseline_lst_celsius: number;
  current_lst_celsius: number;
  downscaling_methodology: string;
  downscaling_disclaimer: string;
  models_in_ensemble: string[];
  scenarios: Record<string, ScenarioProjection>;
  comparison_table: BaselineComparisonRow[];
}

export interface SimulationInputs {
  ward_id: string;
  trees_count: number;
  cool_roof_pct: number;
  permeable_surface_sq_m: number;
  green_corridor_sq_m: number;
  retention_capacity_m3: number;
  available_budget_usd: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: string;
  ward_id: string;
  ward_name: string;
  inputs: SimulationInputs;
  result: SimulationResult;
}

export interface CopilotEvidenceRef {
  evidence_id: string;
  evidence_type: string;
  source: string;
  observation_date: string;
  description: string;
  confidence: number;
}

export interface CopilotQueryRequest {
  query: string;
  ward_id?: number | null;
  current_phase?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface CopilotQueryResponse {
  query: string;
  intent: string;
  ward_id?: number | null;
  ward_code?: string | null;
  ward_name?: string | null;
  executive_summary: string;
  response_text: string;
  key_metrics: Record<string, any>;
  evidence_references: CopilotEvidenceRef[];
  confidence: number;
  missing_information: string[];
  suggested_actions: string[];
  suggested_questions: string[];
  sources_used: string[];
  execution_time_ms: number;
  is_llm_synthesized: boolean;
}

export interface SuggestedQuestionsResponse {
  active_ward_code?: string | null;
  active_ward_name?: string | null;
  current_phase: string;
  suggested_questions: string[];
}
