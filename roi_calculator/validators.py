from roi_calculator.constants import COMMON_ERRORS


def validate(effects, costs_input, total_gross, total_costs, roi, virtual_pnl):
    warnings = []

    def _add(code):
        for err in COMMON_ERRORS:
            if err["code"] == code:
                warnings.append(err)
                return

    # E001: нет затрат
    if total_costs == 0 and total_gross > 0:
        _add("E001")

    # E002: нет baseline — проверяем ВСЕ типы, не только revenue
    if "revenue_growth" in effects:
        rg = effects["revenue_growth"]
        if rg.get("baseline_revenue_monthly", 0) == 0 and rg.get("expected_revenue_monthly", 0) > 0:
            _add("E002")

    if "opex_reduction" in effects:
        op = effects["opex_reduction"]
        if op.get("current_cost_monthly", 0) == 0 and op.get("expected_cost_monthly", 0) > 0:
            _add("E002")

    if "risk_reduction" in effects:
        rr = effects["risk_reduction"]
        if rr.get("annual_loss_baseline", 0) == 0 and rr.get("expected_prevention_pct", 0) > 0:
            _add("E002")

    if "liquidity_release" in effects:
        lq = effects["liquidity_release"]
        if lq.get("current_reserves", 0) == 0 and lq.get("optimized_reserves", 0) > 0:
            _add("E002")

    if "reserve_recovery" in effects:
        rec = effects["reserve_recovery"]
        if rec.get("current_recovery_rate_pct", 0) == 0 and rec.get("expected_recovery_rate_pct", 0) > 0:
            _add("E002")

    # E003: кросс-продажи без каннибализации
    if "revenue_growth" in effects:
        rg = effects["revenue_growth"]
        if rg.get("cannibalization_pct", 0) == 0 and rg.get("cross_sell_revenue_monthly", 0) > 0:
            _add("E003")

    # E009: рост выручки > 100%
    if "revenue_growth" in effects:
        rg = effects["revenue_growth"]
        baseline = rg.get("baseline_revenue_monthly", 0)
        expected = rg.get("expected_revenue_monthly", 0)
        if baseline > 0 and expected > baseline * 2:
            _add("E009")

    # E010: OPEX TO BE > AS IS
    if "opex_reduction" in effects:
        opex = effects["opex_reduction"]
        current = opex.get("current_cost_monthly", 0)
        expected = opex.get("expected_cost_monthly", 0)
        if current > 0 and expected > current:
            _add("E010")

    # E011: prevention > 80%
    if "risk_reduction" in effects:
        rr = effects["risk_reduction"]
        if rr.get("expected_prevention_pct", 0) > 80:
            _add("E011")

    # E012: recovery delta > 15 п.п.
    if "reserve_recovery" in effects:
        rec = effects["reserve_recovery"]
        delta = rec.get("expected_recovery_rate_pct", 0) - rec.get("current_recovery_rate_pct", 0)
        if delta > 15:
            _add("E012")

    # E013: отрицательный gross
    if total_gross < 0:
        _add("E013")

    # E014: двойной счёт OPEX + FTE
    if "opex_reduction" in effects and "fte_optimization" in effects:
        _add("E014")

    # E004: затраты подозрительно низкие
    if total_gross > 0 and total_costs > 0 and total_costs < total_gross * 0.05:
        _add("E004")

    # E005: ROI > 15:1
    if roi > 1500:
        _add("E005")

    # E006: ramp-up = 0
    if costs_input.ramp_up_months == 0:
        _add("E006")

    # E007: ненайм
    if virtual_pnl > 0:
        _add("E007")

    # E008: dev = 0
    if costs_input.development_months == 0:
        _add("E008")

    # E015: attribution < 100% — информация
    has_attribution = False
    for eff_data in effects.values():
        if isinstance(eff_data, dict) and eff_data.get("attribution_pct", 100) < 100:
            has_attribution = True
            break
    if has_attribution:
        _add("E015")

    return warnings
