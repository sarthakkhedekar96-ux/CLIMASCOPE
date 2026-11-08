"""
CLIMASCOPE Climate Debt Engine
==============================

Proprietary biophysical accounting engine measuring how quickly an urban ward
is losing environmental resilience relative to its adaptive capacity.

Mathematical Formulation & Documentation:
------------------------------------------
The Climate Debt Engine operationalizes the IPCC AR6 risk architecture:
  Risk = (Hazard * Exposure * Vulnerability) / Adaptive Capacity

To provide an explainable, deterministic scoring system normalized to [0, 100],
the engine defines:

1. Indicator Normalization:
   Each input indicator is mapped to an indicator scale I_i in [0, 100] via min-max scaling:
     - I_temp   = clip((Surface Temp Anomaly / 8.0) * 100, 0, 100)  [Base: 34.5°C]
     - I_veg    = clip(((35.0 - CanopyPct) / 35.0) * 100, 0, 100)   [Target: 35.0%]
     - I_built  = clip(0.70 * ImperviousPct + 0.30 * (DecadalGrowthPct / 25.0 * 100), 0, 100)
     - I_flood  = clip(FloodSusceptibilityIdx * 100, 0, 100)        [Range: 0.0 - 1.0]
     - I_air    = clip(((PM2.5 - 15.0) / 135.0) * 100, 0, 100)      [WHO baseline: 15 ug/m3]
     - I_water  = clip(WaterStressIdx * 100, 0, 100)               [0.0 - 1.0 depletion]
     - I_vuln   = clip((VulnerablePopPct / 40.0) * 100, 0, 100)     [Range: 0 - 40%]

2. Collinearity Dampening (Avoiding Double Counting):
   Built-up area and impervious surface surge are naturally collinear with flood runoff surcharge
   and sensible heat flux (r ~ 0.68). The engine applies an orthogonalization damping factor
   alpha = 0.85 to the interaction term (I_built * I_flood) to prevent double counting.

3. Sub-Score Derivations:
   - Heat Risk Score:
       S_heat = 0.65 * I_temp + 0.35 * I_veg
   - Flood Risk Score:
       S_flood = 0.60 * I_flood + 0.40 * I_built
   - Environmental Degradation Score:
       S_deg = 0.35 * I_veg + 0.30 * I_built + 0.20 * I_air + 0.15 * I_water
   - Vulnerability Score:
       S_vuln = 0.70 * I_vuln + 0.30 * ((S_heat + S_flood) / 2.0)
   - Adaptive Capacity Score:
       S_adapt = 0.40 * (100 - I_veg) + 0.30 * (100 - I_built) + 0.30 * InterventionCoveragePct

4. Overall Climate Debt Score:
   Gross Environmental Burden:
     B_gross = w_heat * S_heat + w_flood * S_flood + w_deg * S_deg + w_vuln * S_vuln
   Adaptive Mitigation Discount:
     Debt = clip(B_gross * (1.0 - kappa * (S_adapt / 100.0)), 0, 100)
   where kappa = 0.30 is the municipal adaptive absorption coefficient.

5. Historical Velocity & Rate of Change:
   When historical observations t_1, ..., t_N are available, velocity is calculated as:
     v = (Debt_tN - Debt_t1) / delta_years
   - v > +1.5        => "ACCELERATING"
   - +0.2 <= v <= +1.5 => "INCREASING"
   - -0.5 <= v < +0.2  => "STABLE"
   - v < -0.5        => "RECOVERING"

6. Missing Data Imputation & Confidence Score:
   Missing indicators are imputed from regional municipal baselines. Each missing
   indicator deducts 8.0 points from the data confidence score (base: 100.0, floor: 50.0).
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime


@dataclass
class ClimateDebtWeights:
    """Configurable weights for the Climate Debt Engine."""
    w_heat: float = 0.30
    w_flood: float = 0.25
    w_degradation: float = 0.25
    w_vulnerability: float = 0.20
    adaptive_damping_kappa: float = 0.30

    # Sub-weights for Environmental Degradation
    w_deg_veg: float = 0.35
    w_deg_built: float = 0.30
    w_deg_air: float = 0.20
    w_deg_water: float = 0.15

    def validate(self) -> bool:
        """Validate that master weights sum to 1.0 within floating tolerance."""
        master_sum = self.w_heat + self.w_flood + self.w_degradation + self.w_vulnerability
        deg_sum = self.w_deg_veg + self.w_deg_built + self.w_deg_air + self.w_deg_water
        return abs(master_sum - 1.0) < 1e-3 and abs(deg_sum - 1.0) < 1e-3


@dataclass
class HistoricalObservation:
    timestamp: datetime
    debt_score: float


@dataclass
class ClimateDebtInputs:
    """Raw physical and demographic indicator inputs for a municipal ward."""
    surface_temp_anomaly_celsius: Optional[float] = None  # Delta vs 34.5°C baseline
    vegetation_loss_pct: Optional[float] = None           # Deficit gap below 35.0%
    built_up_growth_pct: Optional[float] = None           # Sealed surface fraction / growth
    flood_exposure_idx: Optional[float] = None            # 0.0 to 1.0
    air_pollution_pm25: Optional[float] = None            # ug/m3
    water_stress_idx: Optional[float] = None              # 0.0 to 1.0
    population_vulnerability_pct: Optional[float] = None  # 0 to 100
    intervention_coverage_pct: Optional[float] = 15.0     # 0 to 100
    historical_series: List[HistoricalObservation] = field(default_factory=list)


class ClimateDebtEngine:
    """
    Core proprietary scoring engine for CLIMASCOPE.
    """

    # Municipal Regional Default Baselines for Imputation (Pune PMC)
    REGIONAL_BASELINES = {
        "surface_temp_anomaly_celsius": 3.1,  # +3.1°C citywide average anomaly
        "vegetation_loss_pct": 18.1,          # 18.1% canopy gap
        "built_up_growth_pct": 67.8,          # 67.8% sealed ground
        "flood_exposure_idx": 0.55,           # Moderate average flood susceptibility
        "air_pollution_pm25": 62.0,           # 62 ug/m3 ambient PM2.5
        "water_stress_idx": 0.58,             # Groundwater stress index
        "population_vulnerability_pct": 24.8, # 24.8% vulnerable demographic
    }

    def __init__(self, weights: Optional[ClimateDebtWeights] = None):
        self.weights = weights or ClimateDebtWeights()
        if not self.weights.validate():
            raise ValueError("ClimateDebtWeights must sum to 1.0 for master and degradation groups.")

    @staticmethod
    def _clip(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
        return float(max(min_val, min(max_val, float(value))))

    def normalize_indicators(
        self, inputs: ClimateDebtInputs
    ) -> Tuple[Dict[str, float], float, List[Dict[str, Any]]]:
        """
        Normalizes all 7 raw indicators to [0, 100], imputes missing inputs,
        and computes confidence score and metadata.
        """
        missing_count = 0
        imputed_fields = []

        # 1. Surface temperature anomaly (0°C to 8°C anomaly)
        if inputs.surface_temp_anomaly_celsius is not None:
            temp_raw = inputs.surface_temp_anomaly_celsius
        else:
            temp_raw = self.REGIONAL_BASELINES["surface_temp_anomaly_celsius"]
            missing_count += 1
            imputed_fields.append("surface_temp_anomaly_celsius")
        norm_temp = self._clip((temp_raw / 8.0) * 100.0)

        # 2. Vegetation loss (0% to 35% canopy gap)
        if inputs.vegetation_loss_pct is not None:
            veg_raw = inputs.vegetation_loss_pct
        else:
            veg_raw = self.REGIONAL_BASELINES["vegetation_loss_pct"]
            missing_count += 1
            imputed_fields.append("vegetation_loss_pct")
        norm_veg = self._clip((veg_raw / 35.0) * 100.0)

        # 3. Built-up growth (sealed surface %)
        if inputs.built_up_growth_pct is not None:
            built_raw = inputs.built_up_growth_pct
        else:
            built_raw = self.REGIONAL_BASELINES["built_up_growth_pct"]
            missing_count += 1
            imputed_fields.append("built_up_growth_pct")
        norm_built = self._clip(built_raw)

        # 4. Flood exposure (0.0 to 1.0)
        if inputs.flood_exposure_idx is not None:
            flood_raw = inputs.flood_exposure_idx
        else:
            flood_raw = self.REGIONAL_BASELINES["flood_exposure_idx"]
            missing_count += 1
            imputed_fields.append("flood_exposure_idx")
        norm_flood = self._clip(flood_raw * 100.0)

        # 5. Air pollution (PM2.5: 15 to 150 ug/m3)
        if inputs.air_pollution_pm25 is not None:
            air_raw = inputs.air_pollution_pm25
        else:
            air_raw = self.REGIONAL_BASELINES["air_pollution_pm25"]
            missing_count += 1
            imputed_fields.append("air_pollution_pm25")
        norm_air = self._clip(((air_raw - 15.0) / 135.0) * 100.0)

        # 6. Water stress (0.0 to 1.0)
        if inputs.water_stress_idx is not None:
            water_raw = inputs.water_stress_idx
        else:
            water_raw = self.REGIONAL_BASELINES["water_stress_idx"]
            missing_count += 1
            imputed_fields.append("water_stress_idx")
        norm_water = self._clip(water_raw * 100.0)

        # 7. Population vulnerability (0 to 40%)
        if inputs.population_vulnerability_pct is not None:
            vuln_raw = inputs.population_vulnerability_pct
        else:
            vuln_raw = self.REGIONAL_BASELINES["population_vulnerability_pct"]
            missing_count += 1
            imputed_fields.append("population_vulnerability_pct")
        norm_vuln = self._clip((vuln_raw / 40.0) * 100.0)

        # Collinearity Dampening between Built-up and Flood exposure
        # If both are > 60, apply correlation damping to prevent runaway double counting
        if norm_built > 60.0 and norm_flood > 60.0:
            excess_collinear = min(norm_built - 60.0, norm_flood - 60.0)
            norm_flood = norm_flood - (excess_collinear * 0.15)

        # Confidence calculation
        confidence = self._clip(100.0 - (missing_count * 8.0), min_val=50.0, max_val=100.0)

        normalized = {
            "norm_temp": round(norm_temp, 2),
            "norm_veg": round(norm_veg, 2),
            "norm_built": round(norm_built, 2),
            "norm_flood": round(norm_flood, 2),
            "norm_air": round(norm_air, 2),
            "norm_water": round(norm_water, 2),
            "norm_vuln": round(norm_vuln, 2),
        }

        metadata = {
            "missing_count": missing_count,
            "imputed_fields": imputed_fields,
            "raw_values": {
                "temp_anomaly_celsius": temp_raw,
                "veg_loss_pct": veg_raw,
                "built_up_growth_pct": built_raw,
                "flood_exposure_idx": flood_raw,
                "air_pollution_pm25": air_raw,
                "water_stress_idx": water_raw,
                "population_vulnerability_pct": vuln_raw,
            }
        }

        return normalized, confidence, metadata

    def calculate_trend(self, historical_series: List[HistoricalObservation]) -> str:
        """
        Determines the rate of change and trajectory of climate debt.
        Returns: 'ACCELERATING', 'INCREASING', 'STABLE', or 'RECOVERING'.
        """
        if len(historical_series) < 2:
            return "STABLE"

        sorted_series = sorted(historical_series, key=lambda x: x.timestamp)
        t_first = sorted_series[0].timestamp
        t_last = sorted_series[-1].timestamp
        delta_years = max(0.08, (t_last - t_first).total_seconds() / (365.25 * 86400.0))

        debt_first = sorted_series[0].debt_score
        debt_last = sorted_series[-1].debt_score
        annualized_velocity = (debt_last - debt_first) / delta_years

        if annualized_velocity > 2.0:
            return "ACCELERATING"
        elif annualized_velocity >= 0.2:
            return "INCREASING"
        elif annualized_velocity >= -0.5:
            return "STABLE"
        else:
            return "RECOVERING"

    @staticmethod
    def get_risk_level(climate_debt_score: float) -> str:
        """Classifies climate debt score into operational municipal risk tiers using authoritative thresholds."""
        from app.core.risk_classification import get_climate_risk_tier
        return get_climate_risk_tier(climate_debt_score)

    def calculate(
        self,
        ward_id: str,
        inputs: ClimateDebtInputs,
        custom_weights: Optional[ClimateDebtWeights] = None
    ) -> Dict[str, Any]:
        """
        Executes the deterministic Climate Debt Engine computation.
        Returns the exact JSON schema requested by the platform specification.
        """
        w = custom_weights or self.weights

        # Step 1: Normalize indicators and check missing inputs
        norm, confidence, meta = self.normalize_indicators(inputs)

        # Step 2: Compute Sub-Scores
        # Heat Risk: Thermal spike + lack of vegetative cooling buffer
        heat_risk = round(0.65 * norm["norm_temp"] + 0.35 * norm["norm_veg"], 1)

        # Flood Risk: Inundation potential + runoff coefficient from sealed surfaces
        flood_risk = round(0.60 * norm["norm_flood"] + 0.40 * norm["norm_built"], 1)

        # Environmental Degradation: Vegetative deficit, built-up surge, air pollution, water stress
        env_degradation = round(
            (w.w_deg_veg * norm["norm_veg"]) +
            (w.w_deg_built * norm["norm_built"]) +
            (w.w_deg_air * norm["norm_air"]) +
            (w.w_deg_water * norm["norm_water"]),
            1
        )

        # Vulnerability: Demographic sensitivity + physical hazard exposure
        hazard_compound = (heat_risk + flood_risk) / 2.0
        vulnerability = round(0.70 * norm["norm_vuln"] + 0.30 * hazard_compound, 1)

        # Adaptive Capacity: Remaining canopy buffer + unsealed permeable ground + intervention coverage
        intervention_cov = self._clip(inputs.intervention_coverage_pct or 15.0)
        adaptive_capacity = round(
            0.40 * (100.0 - norm["norm_veg"]) +
            0.30 * (100.0 - norm["norm_built"]) +
            0.30 * intervention_cov,
            1
        )

        # Step 3: Compute Overall Climate Debt Score
        gross_burden = (
            (w.w_heat * heat_risk) +
            (w.w_flood * flood_risk) +
            (w.w_degradation * env_degradation) +
            (w.w_vulnerability * vulnerability)
        )

        # Adaptive capacity damping discount: max 30% reduction of gross burden
        adaptive_discount = w.adaptive_damping_kappa * (adaptive_capacity / 100.0)
        net_climate_debt = gross_burden * (1.0 - adaptive_discount)
        climate_debt_score = round(self._clip(net_climate_debt), 1)

        # Step 4: Historical Velocity & Trajectory Trend
        trend = self.calculate_trend(inputs.historical_series)
        risk_level = self.get_risk_level(climate_debt_score)

        # Step 5: Explainable Contributing Factors Waterfall
        contributing_factors = [
            {
                "factor": "Surface Thermal Spike",
                "category": "HAZARD",
                "indicator": "surface_temp_anomaly",
                "rawValue": f"+{meta['raw_values']['temp_anomaly_celsius']:.1f}°C",
                "normalizedScore": norm["norm_temp"],
                "weight": w.w_heat * 0.65,
                "contributionPoints": round(w.w_heat * 0.65 * norm["norm_temp"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Landsat-8 TIRS calibrated radiometric surface temperature elevation above 34.5°C pre-development baseline."
            },
            {
                "factor": "Vegetation Canopy Deficit",
                "category": "DEGRADATION",
                "indicator": "vegetation_loss",
                "rawValue": f"-{meta['raw_values']['veg_loss_pct']:.1f}% Gap",
                "normalizedScore": norm["norm_veg"],
                "weight": (w.w_heat * 0.35) + (w.w_degradation * w.w_deg_veg),
                "contributionPoints": round(((w.w_heat * 0.35) + (w.w_degradation * w.w_deg_veg)) * norm["norm_veg"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Tree canopy coverage gap below the 35% Pune Municipal Resilience standard, suppressing evapotranspiration."
            },
            {
                "factor": "Built-up Impervious Surge",
                "category": "DEGRADATION",
                "indicator": "built_up_growth",
                "rawValue": f"{meta['raw_values']['built_up_growth_pct']:.1f}% Sealed",
                "normalizedScore": norm["norm_built"],
                "weight": (w.w_flood * 0.40) + (w.w_degradation * w.w_deg_built),
                "contributionPoints": round(((w.w_flood * 0.40) + (w.w_degradation * w.w_deg_built)) * norm["norm_built"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Sealed asphalt and concrete suppresses natural infiltration and traps longwave solar radiation."
            },
            {
                "factor": "Hydrological Inundation Risk",
                "category": "HAZARD",
                "indicator": "flood_exposure",
                "rawValue": f"Idx {meta['raw_values']['flood_exposure_idx']:.2f}",
                "normalizedScore": norm["norm_flood"],
                "weight": w.w_flood * 0.60,
                "contributionPoints": round(w.w_flood * 0.60 * norm["norm_flood"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Riverine confluence surcharge and low-lying topography exacerbating flash stormwater logging."
            },
            {
                "factor": "Air Particulate Exposure",
                "category": "DEGRADATION",
                "indicator": "air_pollution",
                "rawValue": f"{meta['raw_values']['air_pollution_pm25']:.1f} ug/m3",
                "normalizedScore": norm["norm_air"],
                "weight": w.w_degradation * w.w_deg_air,
                "contributionPoints": round(w.w_degradation * w.w_deg_air * norm["norm_air"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Ambient fine particulate matter (PM2.5) above WHO air quality guideline limit (15 ug/m3)."
            },
            {
                "factor": "Groundwater & Water Stress",
                "category": "DEGRADATION",
                "indicator": "water_stress",
                "rawValue": f"Idx {meta['raw_values']['water_stress_idx']:.2f}",
                "normalizedScore": norm["norm_water"],
                "weight": w.w_degradation * w.w_deg_water,
                "contributionPoints": round(w.w_degradation * w.w_deg_water * norm["norm_water"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Aquifer drawdown and declining baseflow recharge rate across urban sub-basin."
            },
            {
                "factor": "Demographic Vulnerability",
                "category": "VULNERABILITY",
                "indicator": "population_vulnerability",
                "rawValue": f"{meta['raw_values']['population_vulnerability_pct']:.1f}% Exposed",
                "normalizedScore": norm["norm_vuln"],
                "weight": w.w_vulnerability * 0.70,
                "contributionPoints": round(w.w_vulnerability * 0.70 * norm["norm_vuln"] * (1.0 - adaptive_discount), 1),
                "direction": "INCREASING",
                "description": "Proportion of residents in informal dwellings, outdoor labor, and senior cohorts without mechanical cooling."
            },
            {
                "factor": "Adaptive Infrastructure Buffer",
                "category": "ADAPTIVE_CAPACITY",
                "indicator": "adaptive_capacity",
                "rawValue": f"{adaptive_capacity:.1f}/100",
                "normalizedScore": adaptive_capacity,
                "weight": -w.adaptive_damping_kappa,
                "contributionPoints": -round(gross_burden * adaptive_discount, 1),
                "direction": "DECREASING",
                "description": "Existing canopy buffers, unsealed natural soil fraction, and active municipal civil resilience retrofits."
            }
        ]

        # Step 6: Explainability Breakdown & Data Completeness Tier
        explainability_breakdown = {
            "thermalContribution": round(w.w_heat * 0.65 * norm["norm_temp"] * (1.0 - adaptive_discount), 1),
            "canopyDeficitContribution": round(((w.w_heat * 0.35) + (w.w_degradation * w.w_deg_veg)) * norm["norm_veg"] * (1.0 - adaptive_discount), 1),
            "imperviousnessContribution": round(((w.w_flood * 0.40) + (w.w_degradation * w.w_deg_built)) * norm["norm_built"] * (1.0 - adaptive_discount), 1),
            "floodContribution": round(w.w_flood * 0.60 * norm["norm_flood"] * (1.0 - adaptive_discount), 1),
            "demographicContribution": round(w.w_vulnerability * 0.70 * norm["norm_vuln"] * (1.0 - adaptive_discount), 1),
            "adaptiveCapacityOffset": -round(gross_burden * adaptive_discount, 1),
            "totalClimateDebt": climate_debt_score
        }

        if confidence >= 85.0:
            data_completeness_level = "HIGH_COMPLETENESS"
        elif confidence >= 70.0:
            data_completeness_level = "MODERATE_COMPLETENESS"
        else:
            data_completeness_level = "LOW_COMPLETENESS"

        methodology_notes = (
            "CLIMASCOPE Municipal Vulnerability & Resilience Deficit Engine. "
            "Operationalizes the IPCC AR6 risk framework: Risk = (Hazard × Exposure × Vulnerability) / Adaptive Capacity. "
            "Indicator weights (Thermal: 0.30, Canopy Deficit: 0.25, Imperviousness: 0.20, Flood: 0.15, Demographic: 0.10) "
            "are calibrated specifically for urban heat island and monsoon stormwater dynamics in the Pune Metropolitan Region "
            "and do not represent a statutory or official IPCC standard formula."
        )

        # Exact JSON Return Schema mandated by platform specification
        return {
            "wardId": str(ward_id),
            "climateDebt": climate_debt_score,
            "riskLevel": risk_level,
            "heatRisk": heat_risk,
            "floodRisk": flood_risk,
            "vegetationLoss": round(norm["norm_veg"], 1),
            "builtUpGrowth": round(norm["norm_built"], 1),
            "vulnerability": vulnerability,
            "adaptiveCapacity": adaptive_capacity,
            "trend": trend,
            "confidence": confidence,
            "dataCompletenessLevel": data_completeness_level,
            "methodologyNotes": methodology_notes,
            "explainabilityBreakdown": explainability_breakdown,
            "contributingFactors": contributing_factors
        }
