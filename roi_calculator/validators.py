from roi_calculator.constants import COMMON_ERRORS


def validate(effects, costs_input, total_gross, total_costs, roi, virtual_pnl):
    warnings = []

    def _add(code):
        for err in COMMON_ERRORS:
            if err["code"] == code:
                warnings.append(err)
                return

    if total_costs == 0 and total_gross > 0:
        _add("E001")

    if "revenue_growth" in effects:
        rg = effects["revenue_growth"]
        if rg.get("baseline_revenue_monthly", 0) == 0 and rg.get("expected_revenue_monthly", 0) > 0:
            _add("E002")
        if rg.get("cannibalization_pct", 0) == 0 and rg.get("cross_sell_revenue_monthly", 0) > 0:
            _add("E003")

    if total_gross > 0 and total_costs > 0 and total_costs < total_gross * 0.05:
        _add("E004")

    if roi > 1500:
        _add("E005")

    if costs_input.ramp_up_months == 0:
        _add("E006")

    if virtual_pnl > 0:
        _add("E007")

    if costs_input.development_months == 0:
        _add("E008")

    return warnings
