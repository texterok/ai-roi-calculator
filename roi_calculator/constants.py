EFFECT_TYPES = {
    "revenue_growth": {
        "label": "Рост доходов",
        "icon": "trending_up",
        "description": "Увеличение выручки за счёт ИИ: рост конверсии, кросс-продажи, персонализация",
        "pnl_impact": "Операционный доход",
    },
    "opex_reduction": {
        "label": "Снижение OPEX",
        "icon": "savings",
        "description": "Оптимизация операционных расходов: автоматизация процессов, маршрутизация",
        "pnl_impact": "Операционные расходы",
    },
    "fte_optimization": {
        "label": "Оптимизация ФОТ (ПШЕ)",
        "icon": "groups",
        "description": "Реальное сокращение штата и/или ненайм за счёт автоматизации",
        "pnl_impact": "Операционный доход",
    },
    "risk_reduction": {
        "label": "Снижение операционных рисков",
        "icon": "shield",
        "description": "Антифрод, выявление дефектов, предотвращение потерь",
        "pnl_impact": "Операционный доход / расходы",
    },
    "liquidity_release": {
        "label": "Высвобождение ликвидности",
        "icon": "water_drop",
        "description": "Оптимизация резервов ликвидности в кассах, банкоматах, нормативах",
        "pnl_impact": "Операционный доход",
    },
    "reserve_recovery": {
        "label": "Довзыскание резервов",
        "icon": "account_balance",
        "description": "Улучшение сбора просроченной задолженности, снижение кредитного риска",
        "pnl_impact": "Расходы на резервы",
    },
    "reserve_release": {
        "label": "Роспуск резервов (учётный)",
        "icon": "receipt_long",
        "description": "Временный учётный эффект от пересмотра резервов (принцип неттирования)",
        "pnl_impact": "Расходы на резервы (временно)",
    },
    "capital_cost_reduction": {
        "label": "Снижение стоимости капитала",
        "icon": "domain",
        "description": "Оптимизация RWA, снижение ЧЗК, экономия на фондировании",
        "pnl_impact": "Стоимость капитала",
    },
}

BENCHMARKS = [
    {
        "id": "ebit_share",
        "label": "Доля фин. эффекта ИИ в EBIT",
        "value": 0.22,
        "display": "20–24%",
        "source": "McKinsey / Сбер",
    },
    {
        "id": "opex_reduction",
        "label": "Снижение OPEX от ИИ",
        "value": 0.10,
        "display": "~10%",
        "source": "Отрасль",
    },
    {
        "id": "roi",
        "label": "ROI от ИИ",
        "value": 8.0,
        "display": "1:8",
        "source": "Сбер",
    },
    {
        "id": "annual_growth",
        "label": "Ежегодный рост эффекта",
        "value": 0.50,
        "display": "50%",
        "source": "Сбер 2020–2024",
    },
]

COMMON_ERRORS = [
    {
        "code": "E001",
        "check": "no_costs",
        "severity": "error",
        "message": "Не указаны затраты на ИИ-решение. Методология требует нетто-подход: gross эффект минус все затраты.",
    },
    {
        "code": "E002",
        "check": "no_baseline",
        "severity": "error",
        "message": "Не указан baseline (AS IS). Без базы невозможно корректно оценить инкрементальный эффект.",
    },
    {
        "code": "E003",
        "check": "no_cannibalization",
        "severity": "warning",
        "message": "Рост доходов без учёта каннибализации. При увеличении продаж одного продукта другие могут терять объём.",
    },
    {
        "code": "E004",
        "check": "costs_too_low",
        "severity": "warning",
        "message": "Затраты подозрительно низкие (< 5% от эффекта). Проверьте: включены ли ФОТ, серверы, лицензии?",
    },
    {
        "code": "E005",
        "check": "roi_too_high",
        "severity": "warning",
        "message": "ROI выше 15:1 — вероятна ошибка в допущениях. Бенчмарк Сбера: ROI 1:8.",
    },
    {
        "code": "E006",
        "check": "no_ramp_up",
        "severity": "info",
        "message": "Период ramp-up = 0. ИИ-решение обычно выходит на полный эффект за 3–6 месяцев.",
    },
    {
        "code": "E007",
        "check": "virtual_as_real",
        "severity": "info",
        "message": "Ненайм (avoided hiring) — это виртуальный PnL. Он выделен отдельно от реального финансового эффекта.",
    },
    {
        "code": "E008",
        "check": "no_dev_time",
        "severity": "info",
        "message": "Срок разработки = 0. Обычно внедрение ИИ занимает от 1 до 6 месяцев.",
    },
]
