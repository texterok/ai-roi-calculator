from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class EffectType(Enum):
    REVENUE_GROWTH = "revenue_growth"
    OPEX_REDUCTION = "opex_reduction"
    FTE_OPTIMIZATION = "fte_optimization"
    RISK_REDUCTION = "risk_reduction"
    LIQUIDITY_RELEASE = "liquidity_release"
    RESERVE_RECOVERY = "reserve_recovery"
    RESERVE_RELEASE = "reserve_release"
    CAPITAL_COST_REDUCTION = "capital_cost_reduction"


@dataclass
class RevenueGrowthInput:
    baseline_revenue_monthly: float = 0
    expected_revenue_monthly: float = 0
    cross_sell_revenue_monthly: float = 0
    cannibalization_pct: float = 0
    product_lifetime_months: int = 12
    ramp_up_months: int = 3
    attribution_pct: float = 100


@dataclass
class OpexReductionInput:
    current_cost_monthly: float = 0
    expected_cost_monthly: float = 0
    ramp_up_months: int = 3
    attribution_pct: float = 100


@dataclass
class FteOptimizationInput:
    fte_reduced: float = 0
    fte_avoided: float = 0
    avg_salary_monthly: float = 0
    tax_rate_pct: float = 30.2
    bonus_months: float = 0
    office_cost_per_fte_monthly: float = 0
    severance_months: float = 3
    attribution_pct: float = 100


@dataclass
class RiskReductionInput:
    annual_loss_baseline: float = 0
    expected_prevention_pct: float = 0
    false_positive_cost_annual: float = 0
    attribution_pct: float = 100


@dataclass
class LiquidityReleaseInput:
    current_reserves: float = 0
    optimized_reserves: float = 0
    overnight_rate_pct: float = 18.0
    attribution_pct: float = 100


@dataclass
class ReserveRecoveryInput:
    portfolio_volume: float = 0
    current_recovery_rate_pct: float = 0
    expected_recovery_rate_pct: float = 0
    attribution_pct: float = 100


@dataclass
class ReserveReleaseInput:
    reserve_release_amount: float = 0
    effect_duration_months: int = 12
    reversal_pct: float = 80
    attribution_pct: float = 100


@dataclass
class CapitalCostReductionInput:
    rwa_reduction: float = 0
    capital_adequacy_ratio_pct: float = 12.0
    cost_of_capital_pct: float = 15.0
    attribution_pct: float = 100


@dataclass
class CostInputs:
    team_fte: float = 0
    avg_salary_monthly: float = 0
    tax_rate_pct: float = 30.2
    bonus_months: float = 0
    office_allocation_monthly: float = 0

    gpu_servers_monthly: float = 0
    shared_platform_monthly: float = 0
    cloud_api_monthly: float = 0

    licenses_annual: float = 0
    consulting_total: float = 0
    external_dev_total: float = 0

    development_months: int = 3
    ramp_up_months: int = 3
    discount_rate_annual_pct: float = 15.0


@dataclass
class CalculationResult:
    gross_effects: dict
    total_gross_annual: float
    cost_breakdown: dict
    total_costs_annual: float
    net_effect_annual: float
    roi_pct: float
    npv: float
    payback_months: int
    monthly_cashflows: list
    cumulative_cashflows: list
    benchmarks: list
    warnings: list
    virtual_pnl_annual: float = 0.0
