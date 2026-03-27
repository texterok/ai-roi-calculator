from roi_calculator.models import (
    CalculationResult,
    CostInputs,
    RevenueGrowthInput,
    OpexReductionInput,
    FteOptimizationInput,
    RiskReductionInput,
    LiquidityReleaseInput,
    ReserveRecoveryInput,
    ReserveReleaseInput,
    CapitalCostReductionInput,
)
from roi_calculator.constants import BENCHMARKS


def _fte_full_cost_monthly(salary, tax_pct, bonus_months, office_cost):
    return salary * (1 + tax_pct / 100) * (1 + bonus_months / 12) + office_cost


def _apply_attribution(value, attribution_pct):
    return value * attribution_pct / 100


def calc_revenue_growth(inp: RevenueGrowthInput) -> float:
    delta = inp.expected_revenue_monthly - inp.baseline_revenue_monthly
    delta *= (1 - inp.cannibalization_pct / 100)
    delta += inp.cross_sell_revenue_monthly
    months = min(12, inp.product_lifetime_months)
    return _apply_attribution(delta * months, inp.attribution_pct)


def calc_opex_reduction(inp: OpexReductionInput) -> float:
    val = (inp.current_cost_monthly - inp.expected_cost_monthly) * 12
    return _apply_attribution(val, inp.attribution_pct)


def calc_fte_optimization(inp: FteOptimizationInput) -> tuple[float, float, float]:
    """Returns (real_annual, virtual_annual, severance_onetime)."""
    cost = _fte_full_cost_monthly(
        inp.avg_salary_monthly, inp.tax_rate_pct,
        inp.bonus_months, inp.office_cost_per_fte_monthly,
    )
    real = inp.fte_reduced * cost * 12
    virtual = inp.fte_avoided * cost * 12
    # Severance: one-time cost = reduced FTE * monthly salary * severance months
    severance = inp.fte_reduced * inp.avg_salary_monthly * (1 + inp.tax_rate_pct / 100) * inp.severance_months
    return (
        _apply_attribution(real, inp.attribution_pct),
        _apply_attribution(virtual, inp.attribution_pct),
        _apply_attribution(severance, inp.attribution_pct),
    )


def calc_risk_reduction(inp: RiskReductionInput) -> float:
    val = inp.annual_loss_baseline * inp.expected_prevention_pct / 100 - inp.false_positive_cost_annual
    return _apply_attribution(val, inp.attribution_pct)


def calc_liquidity_release(inp: LiquidityReleaseInput) -> float:
    released = inp.current_reserves - inp.optimized_reserves
    val = released * inp.overnight_rate_pct / 100
    return _apply_attribution(val, inp.attribution_pct)


def calc_reserve_recovery(inp: ReserveRecoveryInput) -> float:
    delta_pct = inp.expected_recovery_rate_pct - inp.current_recovery_rate_pct
    val = inp.portfolio_volume * delta_pct / 100
    return _apply_attribution(val, inp.attribution_pct)


def calc_reserve_release(inp: ReserveReleaseInput) -> tuple[float, float]:
    """Returns (net_effect after netting, reversal_amount).
    Netting: release now, but reversal_pct comes back later."""
    gross = inp.reserve_release_amount
    reversal = gross * inp.reversal_pct / 100
    net = gross - reversal
    return (
        _apply_attribution(net, inp.attribution_pct),
        _apply_attribution(reversal, inp.attribution_pct),
    )


def calc_capital_cost_reduction(inp: CapitalCostReductionInput) -> float:
    val = inp.rwa_reduction * inp.capital_adequacy_ratio_pct / 100 * inp.cost_of_capital_pct / 100
    return _apply_attribution(val, inp.attribution_pct)


def calc_costs(c: CostInputs) -> dict:
    payroll_monthly = (
        c.team_fte * _fte_full_cost_monthly(
            c.avg_salary_monthly, c.tax_rate_pct,
            c.bonus_months, c.office_allocation_monthly,
        )
    )
    infra_monthly = c.gpu_servers_monthly + c.shared_platform_monthly + c.cloud_api_monthly
    external_recurring_monthly = c.licenses_annual / 12
    external_capex_total = c.consulting_total + c.external_dev_total

    return {
        "payroll_monthly": payroll_monthly,
        "infra_monthly": infra_monthly,
        "external_recurring_monthly": external_recurring_monthly,
        "external_capex_total": external_capex_total,
        "recurring_monthly": payroll_monthly + infra_monthly + external_recurring_monthly,
        "payroll_annual": payroll_monthly * 12,
        "infra_annual": infra_monthly * 12,
        "external_annual": external_recurring_monthly * 12 + external_capex_total,
        "total_annual": (payroll_monthly + infra_monthly + external_recurring_monthly) * 12 + external_capex_total,
    }


def build_monthly_cashflows(
    recurring_effects: dict,
    onetime_effects: dict,
    virtual_monthly: float,
    recurring_cost_monthly: float,
    capex_total: float,
    dev_months: int,
    ramp_months: int,
    horizon: int = 36,
) -> tuple[list[float], list[float]]:
    recurring_monthly = sum(recurring_effects.values()) / 12
    onetime_total = sum(onetime_effects.values())

    capex_monthly = capex_total / max(dev_months, 1)

    cashflows = []
    cumulative = []
    cum = 0.0
    onetime_applied = False

    for m in range(horizon):
        cost = recurring_cost_monthly
        if m < dev_months:
            cost += capex_monthly

        if m < dev_months:
            effect = 0.0
        elif m < dev_months + ramp_months and ramp_months > 0:
            progress = (m - dev_months + 1) / ramp_months
            effect = (recurring_monthly - virtual_monthly) * progress
            if not onetime_applied:
                effect += onetime_total
                onetime_applied = True
        else:
            effect = recurring_monthly - virtual_monthly
            if not onetime_applied:
                effect += onetime_total
                onetime_applied = True

        net = effect - cost
        cashflows.append(round(net, 2))
        cum += net
        cumulative.append(round(cum, 2))

    return cashflows, cumulative


def calc_npv(cashflows: list[float], annual_rate_pct: float) -> float:
    monthly_rate = (1 + annual_rate_pct / 100) ** (1 / 12) - 1
    npv = 0.0
    for t, cf in enumerate(cashflows):
        npv += cf / (1 + monthly_rate) ** (t + 1)
    return round(npv, 2)


def calc_payback(cumulative: list[float]) -> int:
    for i, val in enumerate(cumulative):
        if val >= 0:
            return i + 1
    return -1


def calculate(effects: dict, costs_input: CostInputs) -> CalculationResult:
    recurring_effects = {}
    onetime_effects = {}
    total_gross = 0.0
    virtual_pnl = 0.0
    gross_effects = {}
    severance_total = 0.0

    if "revenue_growth" in effects:
        inp = RevenueGrowthInput(**effects["revenue_growth"])
        val = calc_revenue_growth(inp)
        gross_effects["Рост доходов"] = round(val, 2)
        recurring_effects["revenue_growth"] = val
        total_gross += val

    if "opex_reduction" in effects:
        inp = OpexReductionInput(**effects["opex_reduction"])
        val = calc_opex_reduction(inp)
        gross_effects["Снижение OPEX"] = round(val, 2)
        recurring_effects["opex_reduction"] = val
        total_gross += val

    if "fte_optimization" in effects:
        inp = FteOptimizationInput(**effects["fte_optimization"])
        real, virtual, severance = calc_fte_optimization(inp)
        gross_effects["Оптимизация ФОТ (реальная)"] = round(real, 2)
        if virtual > 0:
            gross_effects["Ненайм (виртуальный PnL)"] = round(virtual, 2)
        if severance > 0:
            gross_effects["Выходные пособия (разовый расход)"] = round(-severance, 2)
        recurring_effects["fte_optimization"] = real
        total_gross += real
        severance_total = severance
        virtual_pnl = virtual

    if "risk_reduction" in effects:
        inp = RiskReductionInput(**effects["risk_reduction"])
        val = calc_risk_reduction(inp)
        gross_effects["Снижение рисков"] = round(val, 2)
        recurring_effects["risk_reduction"] = val
        total_gross += val

    if "liquidity_release" in effects:
        inp = LiquidityReleaseInput(**effects["liquidity_release"])
        val = calc_liquidity_release(inp)
        gross_effects["Высвобождение ликвидности"] = round(val, 2)
        recurring_effects["liquidity_release"] = val
        total_gross += val

    if "reserve_recovery" in effects:
        inp = ReserveRecoveryInput(**effects["reserve_recovery"])
        val = calc_reserve_recovery(inp)
        gross_effects["Довзыскание резервов"] = round(val, 2)
        recurring_effects["reserve_recovery"] = val
        total_gross += val

    # Reserve release: netting principle — net = release - reversal
    if "reserve_release" in effects:
        inp = ReserveReleaseInput(**effects["reserve_release"])
        net_release, reversal = calc_reserve_release(inp)
        gross_effects[f"Роспуск резервов (разовый, нетто)"] = round(net_release, 2)
        if reversal > 0:
            gross_effects[f"  в т.ч. возврат резервов через {inp.effect_duration_months} мес"] = round(-reversal, 2)
        onetime_effects["reserve_release"] = net_release
        total_gross += net_release

    if "capital_cost_reduction" in effects:
        inp = CapitalCostReductionInput(**effects["capital_cost_reduction"])
        val = calc_capital_cost_reduction(inp)
        gross_effects["Снижение стоимости капитала"] = round(val, 2)
        recurring_effects["capital_cost_reduction"] = val
        total_gross += val

    cost_data = calc_costs(costs_input)
    total_costs = cost_data["total_annual"] + severance_total
    net_effect = total_gross - total_costs

    roi = (net_effect / total_costs * 100) if total_costs > 0 else 0

    virtual_monthly = virtual_pnl / 12

    ramp = max(
        costs_input.ramp_up_months,
        max((e.get("ramp_up_months", 3) for e in effects.values() if isinstance(e, dict)), default=3),
    ) if effects else costs_input.ramp_up_months

    # Severance as one-time cost in cashflow (at launch month)
    total_capex = cost_data["external_capex_total"] + severance_total

    cashflows, cumulative = build_monthly_cashflows(
        recurring_effects, onetime_effects, virtual_monthly,
        cost_data["recurring_monthly"], total_capex,
        costs_input.development_months, ramp,
    )

    npv = calc_npv(cashflows, costs_input.discount_rate_annual_pct)
    payback = calc_payback(cumulative)

    benchmarks = []
    for b in BENCHMARKS:
        entry = {**b}
        if b["id"] == "roi":
            actual = roi / 100
            entry["actual"] = f"1:{actual:.1f}" if actual > 0 else "< 0"
            entry["status"] = "good" if actual >= b["value"] else "below"
        benchmarks.append(entry)

    from roi_calculator.validators import validate
    warnings = validate(effects, costs_input, total_gross, total_costs, roi, virtual_pnl)

    cost_breakdown = {
        "ФОТ команды": round(cost_data["payroll_annual"], 2),
        "Инфраструктура": round(cost_data["infra_annual"], 2),
        "Внешние расходы": round(cost_data["external_annual"], 2),
    }
    if severance_total > 0:
        cost_breakdown["Выходные пособия"] = round(severance_total, 2)

    return CalculationResult(
        gross_effects=gross_effects,
        total_gross_annual=round(total_gross, 2),
        cost_breakdown=cost_breakdown,
        total_costs_annual=round(total_costs, 2),
        net_effect_annual=round(net_effect, 2),
        roi_pct=round(roi, 1),
        npv=npv,
        payback_months=payback,
        monthly_cashflows=cashflows,
        cumulative_cashflows=cumulative,
        benchmarks=benchmarks,
        warnings=warnings,
        virtual_pnl_annual=round(virtual_pnl, 2),
    )
