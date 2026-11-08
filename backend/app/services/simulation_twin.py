from typing import Dict, List, Any
import math
from app.schemas.simulation import (
    SimulationInputs,
    ScenarioMetrics,
    MetricImprovement,
    AssumptionItem,
    SimulationResult
)
from app.models.ward import Ward
from app.models.climate_metric import ClimateMetric

class SimulationTwinEngine:
    """
    CLIMASCOPE Urban Climate Twin Biophysical Engine.

    Provides deterministic biophysical microclimate simulation for:
    - Tree canopy evapotranspirative cooling and hydrological interception
    - High-albedo cool roof solar radiation reflectance
    - Permeable road and pavement stormwater infiltration
    - Urban green corridor continuous linear wind/shade buffers
    - Subsurface and basin rainwater retention volume surge clipping
    """

    # Primary Municipal Cost Constants (INR - Indian Rupees)
    # Benchmarked against Maharashtra PWD CSR, CPWD Schedule of Rates 2024, and PMC Climate Action Plan
    COST_TREE_INR = 2200.0           # Per mature sapling (pit excavation, organic soil, tree guard, 3-yr maintenance)
    COST_COOL_ROOF_INR_SQM = 650.0   # Per m² (high-albedo elastomeric polyurethane/acrylic coating, SRI >= 104)
    COST_PERMEABLE_INR_SQM = 1950.0  # Per m² (porous interlocking concrete pavers + 200mm graded crushed stone sub-base)
    COST_CORRIDOR_INR_SQM = 2400.0   # Per m² (continuous native linear bioswales, structural root infill & drip line)
    COST_RETENTION_INR_M3 = 2850.0   # Per m³ (geocellular stormwater detention modular tanks & infiltration sumps)

    # Annual Upkeep & Maintenance Benchmarks (INR / unit / year)
    MAINT_TREE_INR = 250.0           # Pruning, pest defense, drip servicing
    MAINT_COOL_ROOF_INR_SQM = 40.0   # Pressure washing, annual reflective recoat check
    MAINT_PERMEABLE_INR_SQM = 80.0   # Silt vacuum sweeping, aggregate replenishment
    MAINT_CORRIDOR_INR_SQM = 160.0   # Horticultural weeding, soil amendment, bioswale desilting
    MAINT_RETENTION_INR_M3 = 110.0   # Silt trap clearing, inlet grill desedimentation

    # Legacy USD Reference Constants (1 USD ~ 83.5 INR)
    USD_INR_EXCHANGE_RATE = 83.5
    COST_TREE_USD = round(2200.0 / 83.5, 2)
    COST_COOL_ROOF_USD_SQM = round(650.0 / 83.5, 2)
    COST_PERMEABLE_USD_SQM = round(1950.0 / 83.5, 2)
    COST_CORRIDOR_USD_SQM = round(2400.0 / 83.5, 2)
    COST_RETENTION_USD_M3 = round(2850.0 / 83.5, 2)

    # Biophysical conversion and empirical degradation parameters
    TREE_CANOPY_SQM = 15.0              # Mature crown projection area per tree (m^2)
    TREE_SURVIVAL_RATE = 0.82           # Juvenile sapling survival factor in urban microenvironments (18% mortality discount)
    TREE_MATURITY_YEARS = 7             # Time horizon to reach nominal 15 m² crown footprint
    ROOF_FRACTION_OF_BUILTUP = 0.55      # Roof footprint fraction of ward built-up area
    COOL_ROOF_WEATHERING_FACTOR = 0.88  # Weathering, soot/dust deposition, and UV degradation discount (12% loss)
    PERMEABLE_CLOGGING_FACTOR = 0.85    # Siltation and pore clogging attenuation factor (15% reduction)

    @classmethod
    def get_documented_assumptions(cls) -> List[AssumptionItem]:
        return [
            AssumptionItem(
                parameter="Urban Tree Plantation",
                unit_cost_or_coefficient="₹2,200 / tree (15 m² mature crown projection; ₹250/yr upkeep)",
                formula="ΔT_trees = (Trees × 15 m² × 0.82 / Ward_Area) × 16.0°C; Infiltration = 0.8% / 1% canopy gain",
                scientific_rationale="Evapotranspirative latent heat conversion (Oke 1989). Benchmarked against Maharashtra Social Forestry & Pune Municipal Corporation Nursery CSR.",
                time_to_benefit_horizon="3–7 years for mature canopy shade; immediate minor evapotranspirative microclimate impact",
                physical_mechanism="Solar radiation interception, vegetative shading, and latent heat flux conversion via stomatal transpiration",
                limitations="Juvenile tree mortality in unmaintained streetscapes; seasonal deciduous leaf loss during pre-monsoon peak summer",
                degradation_or_maintenance_factor="82% sapling survival discount applied; requires ₹250/tree/yr protective watering & pruning"
            ),
            AssumptionItem(
                parameter="High-Albedo Cool Roofs",
                unit_cost_or_coefficient="₹650 / m² (Elastomeric SRI ≥ 104; ₹40/m²/yr upkeep)",
                formula="ΔT_roof = (Retrofit_Roof_m² × 0.88 / Ward_Area) × 12.0°C; Albedo baseline 0.12 -> 0.72",
                scientific_rationale="Akbari et al. (2001) net radiation balance & surface boundary cooling. Aligns with Bureau of Energy Efficiency (BEE) & PMC Cool Roofs Policy.",
                time_to_benefit_horizon="Immediate post-application thermal reflectance",
                physical_mechanism="Reflection of shortwave solar irradiance (albedo > 0.70) preventing daytime conductive thermal mass storage in concrete/tin slabs",
                limitations="Does not increase vegetative biodiversity; effective only during direct daylight solar radiation",
                degradation_or_maintenance_factor="88% weathering efficiency factor accounting for soot/atmospheric dust deposition; biennial wash required"
            ),
            AssumptionItem(
                parameter="Permeable Pavements & Roads",
                unit_cost_or_coefficient="₹1,950 / m² (Porous interlocking pavers + aggregate sub-base; ₹80/m²/yr upkeep)",
                formula="Runoff Attenuation = 1.2% per 1% unsealed area (0.85 clogging factor); ΔT_cooling = 0.8°C / 10% unsealed fraction",
                scientific_rationale="Hydrological infiltration via sub-base drainage and reduction of asphalt thermal storage (IRC 37 / Ferguson 2005).",
                time_to_benefit_horizon="Immediate stormwater infiltration upon commissioning",
                physical_mechanism="Direct gravity percolation into gravel reservoir base course; evaporative cooling of retained moisture",
                limitations="Unsuitable for heavy industrial axle loads; susceptible to pore occlusion in dusty unpaved urban margins",
                degradation_or_maintenance_factor="85% effective infiltration factor due to siltation and pore clogging; annual regenerative vacuum sweeping required"
            ),
            AssumptionItem(
                parameter="Urban Green Corridors",
                unit_cost_or_coefficient="₹2,400 / m² (Linear bioswales, structural root cells & streetscapes; ₹160/m²/yr upkeep)",
                formula="ΔT_corridor = (Corridor_m² / Ward_Area) × 14.0°C; 50% contributes to vegetative canopy cover",
                scientific_rationale="Continuous vegetative shade conduits and aerodynamically enhanced thermal ventilation channels (Pune Smart City SPV Green Infrastructure).",
                time_to_benefit_horizon="1–3 years for linear bioswale vegetative establishment",
                physical_mechanism="Continuous aerodynamic ventilation conduits, urban roughness layer thermal disruption, and linear shade corridors",
                limitations="Requires continuous right-of-way corridor acquisition; competing utility trenching risks",
                degradation_or_maintenance_factor="Regular desiltation of linear bioswale channels and roadside vegetation trimming"
            ),
            AssumptionItem(
                parameter="Rainwater Retention & Detention Basins",
                unit_cost_or_coefficient="₹2,850 / m³ (Subsurface geocellular tanks & detention sumps; ₹110/m³/yr upkeep)",
                formula="Surge Attenuation = min(45%, (Retention_m³ / (Ward_Area × 0.05)) × 60%); Micro-oasis ΔT = 0.3°C / 50k m³",
                scientific_rationale="Hydraulic detention surge clipping for standard 50-year monsoon cloudbursts (Central Ground Water Board CGWB design norms).",
                time_to_benefit_horizon="Immediate stormwater retention from first monsoon cloudburst",
                physical_mechanism="Peak hydrograph attenuation, temporary subterranean surge buffering, and localized soil moisture recharge",
                limitations="Does not address upstream regional river catchment inflows; requires high sediment filtration traps",
                degradation_or_maintenance_factor="Pre-monsoon silt trap clearing and structural silt tank desedimentation"
            ),
            AssumptionItem(
                parameter="Compound Interaction & Thermal Saturation",
                unit_cost_or_coefficient="Diminishing return parameter γ = 1 / (1 + 0.12 × ΔT_raw)",
                formula="ΔT_effective = min(4.8°C, ΔT_raw × γ); Runoff_Reduction = min(70%, Σ Runoff_i)",
                scientific_rationale="Non-linear atmospheric boundary layer feedback prevents unphysical multi-intervention temperature divergence.",
                time_to_benefit_horizon="Synchronous with compound physical implementation",
                physical_mechanism="Atmospheric boundary layer thermal equilibrium saturation; non-linear convective mixing caps cooling divergence",
                limitations="Empirical upper bound capped at 4.8°C cooling to prevent non-physical extrapolation",
                degradation_or_maintenance_factor="Continuous thermodynamic feedback boundary"
            )
        ]

    @classmethod
    def calculate_scenario_metrics(
        cls,
        ward_area_sq_m: float,
        ward_pop: int,
        base_lst: float,
        base_canopy: float,
        base_runoff: float,
        base_debt: float,
        base_vulnerability: float,
        trees_count: int,
        cool_roof_pct: float,
        permeable_sq_m: float,
        green_corridor_sq_m: float,
        retention_m3: float
    ) -> ScenarioMetrics:
        # 1. Area conversions with biophysical survival and degradation discounting
        tree_area_nominal = trees_count * cls.TREE_CANOPY_SQM
        effective_tree_area_sq_m = tree_area_nominal * cls.TREE_SURVIVAL_RATE

        built_up_area_sq_m = ward_area_sq_m * 0.58 # Empirical built-up density baseline
        roof_area_sq_m = built_up_area_sq_m * cls.ROOF_FRACTION_OF_BUILTUP * (cool_roof_pct / 100.0)
        effective_roof_sq_m = roof_area_sq_m * cls.COOL_ROOF_WEATHERING_FACTOR
        effective_perm_sq_m = permeable_sq_m * cls.PERMEABLE_CLOGGING_FACTOR

        # 2. Capital expenditure calculation (INR Native with USD equivalent) - computed on full installed assets
        cost_trees_inr = trees_count * cls.COST_TREE_INR
        cost_roof_inr = roof_area_sq_m * cls.COST_COOL_ROOF_INR_SQM
        cost_permeable_inr = permeable_sq_m * cls.COST_PERMEABLE_INR_SQM
        cost_corridor_inr = green_corridor_sq_m * cls.COST_CORRIDOR_INR_SQM
        cost_retention_inr = retention_m3 * cls.COST_RETENTION_INR_M3
        total_capex_inr = round(cost_trees_inr + cost_roof_inr + cost_permeable_inr + cost_corridor_inr + cost_retention_inr, 2)

        # Annual maintenance calculation in INR
        maint_trees = trees_count * cls.MAINT_TREE_INR
        maint_roof = roof_area_sq_m * cls.MAINT_COOL_ROOF_INR_SQM
        maint_perm = permeable_sq_m * cls.MAINT_PERMEABLE_INR_SQM
        maint_corridor = green_corridor_sq_m * cls.MAINT_CORRIDOR_INR_SQM
        maint_retention = retention_m3 * cls.MAINT_RETENTION_INR_M3
        total_maint_inr = round(maint_trees + maint_roof + maint_perm + maint_corridor + maint_retention, 2)

        # Legacy USD equivalent
        total_capex_usd = round(total_capex_inr / cls.USD_INR_EXCHANGE_RATE, 2)

        # 3. Microclimate cooling components (using effective biophysical surface areas)
        dT_trees = (effective_tree_area_sq_m / ward_area_sq_m) * 16.0
        dT_roof = (effective_roof_sq_m / ward_area_sq_m) * 12.0
        dT_perm = (effective_perm_sq_m / ward_area_sq_m) * 8.0
        dT_corridor = (green_corridor_sq_m / ward_area_sq_m) * 14.0
        dT_retention = (retention_m3 / 50000.0) * 0.3

        raw_cooling = dT_trees + dT_roof + dT_perm + dT_corridor + dT_retention
        diminishing_gamma = 1.0 / (1.0 + 0.12 * raw_cooling)
        effective_cooling = min(4.8, raw_cooling * diminishing_gamma)

        sim_lst = max(28.0, round(base_lst - effective_cooling, 2))

        # 4. Green coverage calculation
        canopy_area_gain = effective_tree_area_sq_m + (green_corridor_sq_m * 0.5)
        canopy_gain_pct = (canopy_area_gain / ward_area_sq_m) * 100.0
        sim_canopy = min(45.0, round(base_canopy + canopy_gain_pct, 2))

        # 5. Runoff attenuation calculation
        perm_fraction = effective_perm_sq_m / ward_area_sq_m
        corridor_fraction = green_corridor_sq_m / ward_area_sq_m
        retention_fraction = retention_m3 / max(1000.0, ward_area_sq_m * 0.05)

        runoff_reduction_pct = min(
            70.0,
            (perm_fraction * 120.0) +
            (corridor_fraction * 150.0) +
            (retention_fraction * 60.0) +
            (canopy_gain_pct * 0.8)
        )
        sim_runoff_risk = max(15.0, round(base_runoff * (1.0 - runoff_reduction_pct / 100.0), 1))

        # 6. Climate debt calculation
        debt_reduction = (effective_cooling * 7.2) + (runoff_reduction_pct * 0.28) + (canopy_gain_pct * 0.45)
        sim_debt = max(12.0, round(base_debt - debt_reduction, 1))

        # 7. Population exposure calculation
        base_exposed = int(round(ward_pop * (base_vulnerability / 100.0) * (base_debt / 100.0)))
        debt_ratio = sim_debt / max(1.0, base_debt)
        sim_exposed = max(0, int(round(base_exposed * (debt_ratio ** 1.25))))

        return ScenarioMetrics(
            climate_debt=sim_debt,
            heat_risk_celsius=sim_lst,
            green_coverage_pct=sim_canopy,
            surface_runoff_risk_pct=sim_runoff_risk,
            population_exposure=sim_exposed,
            estimated_cost_inr=total_capex_inr,
            annual_maintenance_inr=total_maint_inr,
            estimated_cost_usd=total_capex_usd
        )

    @classmethod
    def simulate(
        cls,
        ward: Ward,
        latest_metric: ClimateMetric,
        inputs: SimulationInputs
    ) -> SimulationResult:
        ward_area_sq_m = ward.area_sq_km * 1_000_000.0
        ward_pop = ward.population

        # Baseline indicators
        base_lst = float(
            getattr(latest_metric, 'lst_celsius', None) or
            getattr(ward, 'heat_index_celsius', 38.5) or 38.5
        )
        base_canopy = float(getattr(ward, 'canopy_cover_pct', 10.0) or 10.0)

        runoff_coeff = getattr(latest_metric, 'runoff_coefficient', None)
        if runoff_coeff is not None:
            base_runoff = float(runoff_coeff * 100.0)
        else:
            base_runoff = float(getattr(ward, 'flood_susceptibility_idx', 0.75) * 100.0)

        base_debt = float(getattr(ward, 'climate_debt_score', 65.0) or 65.0)
        base_vulnerability = float(getattr(ward, 'vulnerable_population_pct', 55.0) or 55.0)

        # 1. Baseline Scenario (0 interventions)
        baseline = cls.calculate_scenario_metrics(
            ward_area_sq_m=ward_area_sq_m,
            ward_pop=ward_pop,
            base_lst=base_lst,
            base_canopy=base_canopy,
            base_runoff=base_runoff,
            base_debt=base_debt,
            base_vulnerability=base_vulnerability,
            trees_count=0,
            cool_roof_pct=0.0,
            permeable_sq_m=0.0,
            green_corridor_sq_m=0.0,
            retention_m3=0.0
        )

        # 2. Combined Simulation Scenario
        simulated = cls.calculate_scenario_metrics(
            ward_area_sq_m=ward_area_sq_m,
            ward_pop=ward_pop,
            base_lst=base_lst,
            base_canopy=base_canopy,
            base_runoff=base_runoff,
            base_debt=base_debt,
            base_vulnerability=base_vulnerability,
            trees_count=inputs.trees_count,
            cool_roof_pct=inputs.cool_roof_pct,
            permeable_sq_m=inputs.permeable_surface_sq_m,
            green_corridor_sq_m=inputs.green_corridor_sq_m,
            retention_m3=inputs.retention_capacity_m3
        )

        # 3. Single-Intervention Scenarios (isolating each intervention)
        single_interventions = {
            "Tree Plantation Only": cls.calculate_scenario_metrics(
                ward_area_sq_m, ward_pop, base_lst, base_canopy, base_runoff, base_debt, base_vulnerability,
                trees_count=inputs.trees_count, cool_roof_pct=0.0, permeable_sq_m=0.0, green_corridor_sq_m=0.0, retention_m3=0.0
            ),
            "Cool Roofs Only": cls.calculate_scenario_metrics(
                ward_area_sq_m, ward_pop, base_lst, base_canopy, base_runoff, base_debt, base_vulnerability,
                trees_count=0, cool_roof_pct=inputs.cool_roof_pct, permeable_sq_m=0.0, green_corridor_sq_m=0.0, retention_m3=0.0
            ),
            "Permeable Roads Only": cls.calculate_scenario_metrics(
                ward_area_sq_m, ward_pop, base_lst, base_canopy, base_runoff, base_debt, base_vulnerability,
                trees_count=0, cool_roof_pct=0.0, permeable_sq_m=inputs.permeable_surface_sq_m, green_corridor_sq_m=0.0, retention_m3=0.0
            ),
            "Green Corridors Only": cls.calculate_scenario_metrics(
                ward_area_sq_m, ward_pop, base_lst, base_canopy, base_runoff, base_debt, base_vulnerability,
                trees_count=0, cool_roof_pct=0.0, permeable_sq_m=0.0, green_corridor_sq_m=inputs.green_corridor_sq_m, retention_m3=0.0
            ),
            "Retention Zones Only": cls.calculate_scenario_metrics(
                ward_area_sq_m, ward_pop, base_lst, base_canopy, base_runoff, base_debt, base_vulnerability,
                trees_count=0, cool_roof_pct=0.0, permeable_sq_m=0.0, green_corridor_sq_m=0.0, retention_m3=inputs.retention_capacity_m3
            )
        }

        # 4. Improvements calculation (Baseline vs Simulated Future)
        debt_delta = round(simulated.climate_debt - baseline.climate_debt, 1)
        debt_pct = round(((baseline.climate_debt - simulated.climate_debt) / max(0.01, baseline.climate_debt)) * 100.0, 1)

        heat_delta = round(simulated.heat_risk_celsius - baseline.heat_risk_celsius, 2)
        heat_pct = round(((baseline.heat_risk_celsius - simulated.heat_risk_celsius) / max(0.01, baseline.heat_risk_celsius)) * 100.0, 1)

        green_delta = round(simulated.green_coverage_pct - baseline.green_coverage_pct, 2)
        green_pct = round(((simulated.green_coverage_pct - baseline.green_coverage_pct) / max(0.01, baseline.green_coverage_pct)) * 100.0, 1)

        runoff_delta = round(simulated.surface_runoff_risk_pct - baseline.surface_runoff_risk_pct, 1)
        runoff_pct = round(((baseline.surface_runoff_risk_pct - simulated.surface_runoff_risk_pct) / max(0.01, baseline.surface_runoff_risk_pct)) * 100.0, 1)

        pop_delta = simulated.population_exposure - baseline.population_exposure
        pop_pct = round(((baseline.population_exposure - simulated.population_exposure) / max(1, baseline.population_exposure)) * 100.0, 1)

        improvements = {
            "climate_debt": MetricImprovement(
                baseline_value=baseline.climate_debt,
                simulated_value=simulated.climate_debt,
                delta=debt_delta,
                pct_improvement=debt_pct,
                unit="pts",
                is_favorable=debt_delta <= 0
            ),
            "heat_risk": MetricImprovement(
                baseline_value=baseline.heat_risk_celsius,
                simulated_value=simulated.heat_risk_celsius,
                delta=heat_delta,
                pct_improvement=heat_pct,
                unit="°C",
                is_favorable=heat_delta <= 0
            ),
            "green_coverage": MetricImprovement(
                baseline_value=baseline.green_coverage_pct,
                simulated_value=simulated.green_coverage_pct,
                delta=green_delta,
                pct_improvement=green_pct,
                unit="%",
                is_favorable=green_delta >= 0
            ),
            "surface_runoff_risk": MetricImprovement(
                baseline_value=baseline.surface_runoff_risk_pct,
                simulated_value=simulated.surface_runoff_risk_pct,
                delta=runoff_delta,
                pct_improvement=runoff_pct,
                unit="%",
                is_favorable=runoff_delta <= 0
            ),
            "population_exposure": MetricImprovement(
                baseline_value=float(baseline.population_exposure),
                simulated_value=float(simulated.population_exposure),
                delta=float(pop_delta),
                pct_improvement=pop_pct,
                unit="citizens",
                is_favorable=pop_delta <= 0
            )
        }

        # Budget evaluation (INR primary with legacy USD alignment)
        if inputs.available_budget_inr is not None:
            available_budget_inr = float(inputs.available_budget_inr)
            available_budget_usd = round(available_budget_inr / cls.USD_INR_EXCHANGE_RATE, 2)
        else:
            available_budget_usd = float(inputs.available_budget_usd)
            available_budget_inr = round(available_budget_usd * cls.USD_INR_EXCHANGE_RATE, 2)

        surplus_deficit_inr = round(available_budget_inr - simulated.estimated_cost_inr, 2)
        surplus_deficit_usd = round(available_budget_usd - simulated.estimated_cost_usd, 2)
        is_sufficient = surplus_deficit_inr >= 0
        budget_utilization_pct = round(min(100.0, (simulated.estimated_cost_inr / max(1.0, available_budget_inr)) * 100.0), 1)

        return SimulationResult(
            ward_id=str(ward.id),
            ward_name=ward.name,
            ward_code=ward.code,
            area_sq_km=ward.area_sq_km,
            population=ward.population,
            currency="INR",
            epistemic_status="MODEL_ESTIMATE",
            available_budget_inr=available_budget_inr,
            estimated_cost_inr=simulated.estimated_cost_inr,
            annual_maintenance_inr=simulated.annual_maintenance_inr,
            budget_surplus_deficit_inr=surplus_deficit_inr,
            budget_utilization_pct=budget_utilization_pct,
            available_budget_usd=available_budget_usd,
            estimated_cost_usd=simulated.estimated_cost_usd,
            budget_surplus_deficit_usd=surplus_deficit_usd,
            is_budget_sufficient=is_sufficient,
            baseline=baseline,
            simulated=simulated,
            single_interventions=single_interventions,
            improvements=improvements,
            assumptions=cls.get_documented_assumptions(),
            epistemic_disclaimer=(
                "MODELED ESTIMATE (PHYSICS TWIN) — Deterministic microclimate scenario projection based on localized empirical "
                "heat-balance and rational runoff equations. Benchmarked to Indian Rupee (INR) municipal rate cards."
            )
        )
