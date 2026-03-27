import dataclasses
from flask import render_template, request, jsonify
from roi_calculator import roi_bp
from roi_calculator.models import CostInputs
from roi_calculator.engine import calculate
from roi_calculator.constants import EFFECT_TYPES


@roi_bp.route("/")
def index():
    return render_template("roi_calculator.html", effect_types=EFFECT_TYPES)


@roi_bp.route("/calculate", methods=["POST"])
def api_calculate():
    data = request.get_json()
    effects = dict(data.get("effects", {}))

    # ФОТ оптимизации: ЗП и офис в форме в тыс. руб., конвертируем в млн
    if "fte_optimization" in effects:
        fte = dict(effects["fte_optimization"])
        fte["avg_salary_monthly"] = fte.get("avg_salary_monthly", 0) / 1000
        fte["office_cost_per_fte_monthly"] = fte.get("office_cost_per_fte_monthly", 0) / 1000
        effects["fte_optimization"] = fte
    costs_raw = data.get("costs", {})

    # ФОТ в форме указан в тыс. руб., конвертируем в млн
    costs = CostInputs(
        team_fte=float(costs_raw.get("team_fte", 0)),
        avg_salary_monthly=float(costs_raw.get("avg_salary_monthly", 0)) / 1000,
        tax_rate_pct=float(costs_raw.get("tax_rate_pct", 30.2)),
        bonus_months=float(costs_raw.get("bonus_months", 0)),
        office_allocation_monthly=float(costs_raw.get("office_allocation_monthly", 0)) / 1000,
        gpu_servers_monthly=float(costs_raw.get("gpu_servers_monthly", 0)),
        shared_platform_monthly=float(costs_raw.get("shared_platform_monthly", 0)),
        cloud_api_monthly=float(costs_raw.get("cloud_api_monthly", 0)),
        licenses_annual=float(costs_raw.get("licenses_annual", 0)),
        consulting_total=float(costs_raw.get("consulting_total", 0)),
        external_dev_total=float(costs_raw.get("external_dev_total", 0)),
        development_months=int(costs_raw.get("development_months", 3)),
        ramp_up_months=int(costs_raw.get("ramp_up_months", 3)),
        discount_rate_annual_pct=float(costs_raw.get("discount_rate_annual_pct", 15.0)),
    )

    result = calculate(effects, costs)
    return jsonify(dataclasses.asdict(result))
