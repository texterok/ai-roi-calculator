const state = {
  currentStep: 0,
  scenario: null,
  selectedEffects: new Set(),
  result: null,
};

const SCENARIOS = {
  product: {
    label: 'ИИ в продукте',
    recommended: ['revenue_growth', 'risk_reduction', 'reserve_recovery', 'capital_cost_reduction'],
    benchmarks: [
      { label: 'Окупаемость', value: '18-30 мес' },
      { label: 'ROI (год 1)', value: '20-50%' },
      { label: 'ROI (3 года)', value: '150-400%' },
      { label: 'Риск провала', value: '45-55%' },
      { label: 'Revenue uplift', value: '3-15%' },
    ],
    costHint: 'Продуктовый ИИ обычно требует $500K-$2M инвестиций. Ongoing: 30-50% от начальных в год (данные, ML Ops, мониторинг).',
    resultNote: 'Продуктовый ИИ имеет долгий payback, но эффект компаундится: больше пользователей = больше данных = лучше модели. Потолок не ограничен.',
  },
  process: {
    label: 'ИИ в процессе',
    recommended: ['opex_reduction', 'fte_optimization', 'risk_reduction', 'liquidity_release'],
    benchmarks: [
      { label: 'Окупаемость', value: '6-14 мес' },
      { label: 'ROI (год 1)', value: '40-80%' },
      { label: 'ROI (3 года)', value: '80-150%' },
      { label: 'Риск провала', value: '30-40%' },
      { label: 'OPEX снижение', value: '20-40%' },
    ],
    costHint: 'Процессный ИИ обычно требует $100K-$500K. Ongoing: 20-40% от начальных в год (поддержка, дообучение).',
    resultNote: 'Процессный ИИ окупается быстро, но эффект ограничен: расходы можно снизить только до нуля. Бенчмарк McKinsey: ~10% снижения OPEX.',
  },
};

function selectScenario(key) {
  state.scenario = key;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-scenario="${key}"]`).classList.add('selected');

  // Auto-advance after short delay
  setTimeout(() => goToStep(1), 300);
}

// Slider <-> Number sync
function syncSlider(rangeEl) {
  const group = rangeEl.closest('.slider-input');
  const numEl = group.querySelector('input[type="number"]');
  if (numEl) numEl.value = rangeEl.value;
  const effectKey = rangeEl.dataset.effect;
  if (effectKey) validateInline(effectKey);
}

function syncNumber(numEl) {
  const group = numEl.closest('.slider-input');
  const rangeEl = group.querySelector('input[type="range"]');
  if (rangeEl) rangeEl.value = numEl.value;
  const effectKey = numEl.dataset.effect;
  if (effectKey) validateInline(effectKey);
}

function goToStep(n) {
  if (n === 1 && !state.scenario) {
    alert('Выберите сценарий внедрения');
    return;
  }
  if (n === 2 && state.selectedEffects.size === 0) {
    alert('Выберите хотя бы один тип эффекта');
    return;
  }
  state.currentStep = n;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`).classList.add('active');
  document.querySelectorAll('.step-indicator').forEach((s, i) => {
    s.classList.remove('active');
    s.classList.toggle('completed', i < n);
    if (i === n) s.classList.add('active');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (n === 1) applyScenario();
  if (n === 2) renderEffectForms();
  if (n === 3) showCostBenchmarks();
  if (n === 4) showResultScenarioBar();
}

function applyScenario() {
  const sc = SCENARIOS[state.scenario];
  if (!sc) return;

  // Show benchmarks bar
  const bar = document.getElementById('scenario-benchmarks');
  bar.style.display = 'flex';
  bar.innerHTML = sc.benchmarks.map(b =>
    `<div class="sb-item"><span>${b.label}:</span> <span class="sb-value">${b.value}</span></div>`
  ).join('');

  // Highlight recommended effects, dim others
  document.querySelectorAll('.effect-card').forEach(card => {
    const key = card.dataset.effect;
    const badge = card.querySelector('.effect-card-badge');
    const isRec = sc.recommended.includes(key);

    card.classList.toggle('recommended', isRec);
    card.classList.toggle('dimmed', !isRec);
    badge.style.display = isRec ? 'inline-block' : 'none';

    // Auto-select recommended
    if (isRec && !state.selectedEffects.has(key)) {
      state.selectedEffects.add(key);
      card.classList.add('selected');
    }
  });
}

function showCostBenchmarks() {
  const sc = SCENARIOS[state.scenario];
  if (!sc) return;
  const bar = document.getElementById('cost-benchmarks');
  bar.style.display = 'flex';
  bar.innerHTML = `<div class="sb-item" style="flex:1"><span class="material-symbols-outlined meta-icon" style="font-size:16px">info</span> ${sc.costHint}</div>`;
}

function showResultScenarioBar() {
  const sc = SCENARIOS[state.scenario];
  if (!sc) return;
  const bar = document.getElementById('scenario-results-bar');
  bar.style.display = 'flex';
  bar.innerHTML = `<div class="sb-item" style="flex:1"><span class="material-symbols-outlined meta-icon" style="font-size:16px">lightbulb</span> <strong>${sc.label}:</strong>&nbsp;${sc.resultNote}</div>`;
}

function toggleEffect(key) {
  const card = document.querySelector(`[data-effect="${key}"]`);
  if (state.selectedEffects.has(key)) {
    state.selectedEffects.delete(key);
    card.classList.remove('selected');
  } else {
    state.selectedEffects.add(key);
    card.classList.add('selected');
  }
}

// Get value of a field in current effect section
function getFieldVal(effectKey, fieldId) {
  const el = document.querySelector(`input[type="number"][data-effect="${effectKey}"][data-field="${fieldId}"]`);
  return el ? parseFloat(el.value) || 0 : 0;
}

// Inline validation rules per effect type
const INLINE_RULES = {
  revenue_growth: (gv) => {
    const warnings = [];
    const baseline = gv('baseline_revenue_monthly');
    const expected = gv('expected_revenue_monthly');
    const crossSell = gv('cross_sell_revenue_monthly');
    const cannib = gv('cannibalization_pct');

    if (baseline > 0 && expected > 0) {
      const pct = ((expected - baseline) / baseline) * 100;
      if (pct > 100) {
        warnings.push({ type: 'warn', text: `Рост выручки ${pct.toFixed(0)}% от baseline — убедитесь, что прогноз обоснован пилотными данными, а не экспертной оценкой.` });
      } else if (pct > 50) {
        warnings.push({ type: 'warn', text: `Рост выручки ${pct.toFixed(0)}% — амбициозная оценка. Принцип консерватизма: лучше заложить минимальный прогноз.` });
      }
      if (pct < 0) {
        warnings.push({ type: 'err', text: 'Ожидаемая выручка ниже текущей. Это снижение дохода, а не рост.' });
      }
    }
    if (baseline === 0 && expected > 0) {
      warnings.push({ type: 'err', text: 'Не указан baseline (AS IS). Без текущего уровня невозможно оценить инкрементальный эффект.' });
    }
    if (crossSell > 0 && cannib === 0) {
      warnings.push({ type: 'warn', text: 'Кросс-продажи без каннибализации. Обычно рост продаж одного продукта забирает 5–15% у смежных.' });
    }
    return warnings;
  },

  opex_reduction: (gv) => {
    const warnings = [];
    const current = gv('current_cost_monthly');
    const expected = gv('expected_cost_monthly');

    if (current > 0 && expected > current) {
      warnings.push({ type: 'err', text: 'Ожидаемые затраты выше текущих — это увеличение расходов, а не снижение.' });
    }
    if (current > 0 && expected > 0) {
      const reduction = ((current - expected) / current) * 100;
      if (reduction > 50) {
        warnings.push({ type: 'warn', text: `Снижение OPEX на ${reduction.toFixed(0)}% — проверьте, обосновано ли это. Отраслевой бенчмарк: ~10% от ИИ.` });
      }
    }
    if (current === 0 && expected > 0) {
      warnings.push({ type: 'err', text: 'Не указаны текущие затраты (AS IS).' });
    }
    return warnings;
  },

  fte_optimization: (gv) => {
    const warnings = [];
    const reduced = gv('fte_reduced');
    const avoided = gv('fte_avoided');

    if (avoided > 0 && reduced === 0) {
      warnings.push({ type: 'warn', text: 'Только ненайм без реального сокращения. Ненайм — это виртуальный PnL, он не отразится в реальном P&L отчётного года.' });
    }
    if (reduced + avoided > 50) {
      warnings.push({ type: 'warn', text: `Высвобождение ${reduced + avoided} ПШЕ — масштабная инициатива. Убедитесь, что нормативная численность рассчитана корректно.` });
    }
    return warnings;
  },

  risk_reduction: (gv) => {
    const warnings = [];
    const pct = gv('expected_prevention_pct');

    if (pct > 80) {
      warnings.push({ type: 'warn', text: `Предотвращение ${pct}% — крайне амбициозно. Отраслевой бенчмарк: 30–50%.` });
    }
    if (pct > 0 && gv('annual_loss_baseline') === 0) {
      warnings.push({ type: 'err', text: 'Не указаны текущие потери (AS IS).' });
    }
    return warnings;
  },

  liquidity_release: (gv) => {
    const warnings = [];
    const current = gv('current_reserves');
    const optimized = gv('optimized_reserves');

    if (optimized > current && current > 0) {
      warnings.push({ type: 'err', text: 'Оптимизированный объём больше текущего — это увеличение резервов, а не высвобождение.' });
    }
    if (current > 0 && optimized > 0) {
      const pct = ((current - optimized) / current) * 100;
      if (pct > 50) {
        warnings.push({ type: 'warn', text: `Высвобождение ${pct.toFixed(0)}% ликвидности — проверьте соответствие нормативам.` });
      }
    }
    return warnings;
  },

  reserve_recovery: (gv) => {
    const warnings = [];
    const current = gv('current_recovery_rate_pct');
    const expected = gv('expected_recovery_rate_pct');
    const delta = expected - current;

    if (delta > 15) {
      warnings.push({ type: 'warn', text: `Прирост ставки взыскания +${delta.toFixed(0)} п.п. — нетипично. Проверьте, подтверждено ли пилотом.` });
    }
    if (expected < current && current > 0) {
      warnings.push({ type: 'err', text: 'Ожидаемая ставка ниже текущей — это ухудшение взыскания.' });
    }
    return warnings;
  },

  reserve_release: () => [],
  capital_cost_reduction: () => [],
};

function validateInline(effectKey) {
  const container = document.querySelector(`.form-section[data-section="${effectKey}"]`);
  if (!container) return;

  const warningDiv = container.querySelector('.inline-warnings');
  if (!warningDiv) return;

  const ruleFn = INLINE_RULES[effectKey];
  if (!ruleFn) { warningDiv.innerHTML = ''; return; }

  const gv = (fieldId) => getFieldVal(effectKey, fieldId);
  const warnings = ruleFn(gv);

  if (warnings.length === 0) {
    warningDiv.innerHTML = '';
    return;
  }

  warningDiv.innerHTML = warnings.map(w => `
    <div class="inline-warning visible ${w.type}">
      <span class="material-symbols-outlined">${w.type === 'err' ? 'error' : 'warning'}</span>
      <span>${w.text}</span>
    </div>
  `).join('');
}

function renderEffectForms() {
  const container = document.getElementById('effect-forms');
  container.innerHTML = '';

  const configs = {
    revenue_growth: {
      title: 'Рост доходов',
      hint: 'Инкремент = TO BE минус AS IS. Не забудьте учесть каннибализацию: если вы увеличиваете продажи одного продукта, другие могут терять объём.',
      groups: [
        {
          title: 'Сейчас (AS IS)',
          icon: 'history',
          style: 'asis',
          fields: [
            { id: 'baseline_revenue_monthly', label: 'Текущая выручка', unit: 'млн руб./мес', default: 0, min: 0, max: 5000, step: 1 },
          ],
        },
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'expected_revenue_monthly', label: 'Ожидаемая выручка', unit: 'млн руб./мес', default: 0, min: 0, max: 5000, step: 1 },
          ],
        },
        {
          title: 'Побочные эффекты',
          icon: 'swap_horiz',
          style: 'side',
          fields: [
            { id: 'cross_sell_revenue_monthly', label: 'Доход от кросс-продаж', unit: 'млн руб./мес', default: 0, min: 0, max: 500, step: 0.5 },
            { id: 'cannibalization_pct', label: 'Каннибализация (потери смежных продуктов)', unit: '%', default: 0, min: 0, max: 50, step: 1 },
          ],
        },
        {
          title: 'Параметры расчёта',
          icon: 'tune',
          style: 'params',
          fields: [
            { id: 'product_lifetime_months', label: 'Срок жизни продукта', unit: 'мес', default: 12, min: 1, max: 120, step: 1 },
            { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3, min: 0, max: 12, step: 1 },
          ],
        },
      ],
    },

    opex_reduction: {
      title: 'Снижение OPEX',
      hint: 'Эффект = текущие затраты минус ожидаемые. Бенчмарк отрасли: ~10% снижения OPEX от внедрения ИИ.',
      groups: [
        {
          title: 'Сейчас (AS IS)',
          icon: 'history',
          style: 'asis',
          fields: [
            { id: 'current_cost_monthly', label: 'Текущие операционные затраты', unit: 'млн руб./мес', default: 0, min: 0, max: 1000, step: 1 },
          ],
        },
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'expected_cost_monthly', label: 'Ожидаемые затраты', unit: 'млн руб./мес', default: 0, min: 0, max: 1000, step: 1 },
          ],
        },
        {
          title: 'Параметры расчёта',
          icon: 'tune',
          style: 'params',
          fields: [
            { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3, min: 0, max: 12, step: 1 },
          ],
        },
      ],
    },

    fte_optimization: {
      title: 'Оптимизация ФОТ (ПШЕ)',
      hint: 'Реальное сокращение — фактическое увольнение. Ненайм — сотрудники, которых не пришлось нанять. Ненайм = виртуальный PnL, учитывается отдельно.',
      groups: [
        {
          title: 'Эффект на численность',
          icon: 'groups',
          style: 'tobe',
          fields: [
            { id: 'fte_reduced', label: 'Реальное сокращение ПШЕ', unit: 'чел', default: 0, min: 0, max: 100, step: 1 },
            { id: 'fte_avoided', label: 'Ненайм (avoided hiring)', unit: 'чел', default: 0, min: 0, max: 100, step: 1 },
          ],
        },
        {
          title: 'Стоимость сотрудника',
          icon: 'payments',
          style: 'asis',
          fields: [
            { id: 'avg_salary_monthly', label: 'Средняя ЗП (gross)', unit: 'тыс. руб./мес', default: 0, min: 50, max: 1000, step: 10 },
            { id: 'tax_rate_pct', label: 'Ставка взносов', unit: '%', default: 30.2, min: 0, max: 50, step: 0.1 },
            { id: 'bonus_months', label: 'Бонус', unit: 'мес/год', default: 0, min: 0, max: 12, step: 0.5 },
            { id: 'office_cost_per_fte_monthly', label: 'Расходы на рабочее место', unit: 'тыс. руб./мес', default: 0, min: 0, max: 200, step: 5 },
          ],
        },
      ],
    },

    risk_reduction: {
      title: 'Снижение операционных рисков',
      hint: 'Укажите текущие потери и ожидаемый % предотвращения. Отраслевой бенчмарк: 30–50%. Стоимость ложных срабатываний вычитается из эффекта.',
      groups: [
        {
          title: 'Сейчас (AS IS)',
          icon: 'history',
          style: 'asis',
          fields: [
            { id: 'annual_loss_baseline', label: 'Текущие потери от фрода/дефектов', unit: 'млн руб./год', default: 0, min: 0, max: 10000, step: 1 },
          ],
        },
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'expected_prevention_pct', label: 'Ожидаемое предотвращение', unit: '%', default: 0, min: 0, max: 100, step: 1 },
          ],
        },
        {
          title: 'Побочные эффекты',
          icon: 'swap_horiz',
          style: 'side',
          fields: [
            { id: 'false_positive_cost_annual', label: 'Стоимость ложных срабатываний', unit: 'млн руб./год', default: 0, min: 0, max: 500, step: 0.5 },
          ],
        },
      ],
    },

    liquidity_release: {
      title: 'Высвобождение ликвидности',
      hint: 'Высвобожденные средства можно разместить по ставке overnight. Эффект = (текущий объём - оптимизированный) x ставка фондирования.',
      groups: [
        {
          title: 'Сейчас (AS IS)',
          icon: 'history',
          style: 'asis',
          fields: [
            { id: 'current_reserves', label: 'Текущий объём резервов', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
          ],
        },
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'optimized_reserves', label: 'Оптимизированный объём', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
          ],
        },
        {
          title: 'Параметры расчёта',
          icon: 'tune',
          style: 'params',
          fields: [
            { id: 'cost_of_funds_pct', label: 'Стоимость фондирования', unit: '% годовых', default: 8.0, min: 1, max: 25, step: 0.5 },
          ],
        },
      ],
    },

    reserve_recovery: {
      title: 'Довзыскание резервов',
      hint: 'Эффект = портфель x (ожидаемая ставка - текущая ставка). ИИ помогает точнее оценивать заёмщиков и эффективнее взыскивать.',
      groups: [
        {
          title: 'Сейчас (AS IS)',
          icon: 'history',
          style: 'asis',
          fields: [
            { id: 'portfolio_volume', label: 'Объём портфеля', unit: 'млн руб.', default: 0, min: 0, max: 500000, step: 100 },
            { id: 'current_recovery_rate_pct', label: 'Текущий % взыскания', unit: '%', default: 0, min: 0, max: 100, step: 1 },
          ],
        },
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'expected_recovery_rate_pct', label: 'Ожидаемый % взыскания', unit: '%', default: 0, min: 0, max: 100, step: 1 },
          ],
        },
      ],
    },

    reserve_release: {
      title: 'Роспуск резервов (учётный)',
      hint: 'Временный эффект: резервы высвобождаются сейчас, но могут потребоваться позже (принцип неттирования). Укажите сумму и срок.',
      groups: [
        {
          title: 'Параметры эффекта',
          icon: 'tune',
          style: 'tobe',
          fields: [
            { id: 'reserve_release_amount', label: 'Сумма роспуска', unit: 'млн руб.', default: 0, min: 0, max: 10000, step: 1 },
            { id: 'effect_duration_months', label: 'Срок действия эффекта', unit: 'мес', default: 12, min: 1, max: 60, step: 1 },
          ],
        },
      ],
    },

    capital_cost_reduction: {
      title: 'Снижение стоимости капитала',
      hint: 'Формула: снижение RWA x норматив достаточности (H1) x стоимость капитала (CoE).',
      groups: [
        {
          title: 'После внедрения ИИ (TO BE)',
          icon: 'rocket_launch',
          style: 'tobe',
          fields: [
            { id: 'rwa_reduction', label: 'Снижение RWA', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
          ],
        },
        {
          title: 'Параметры расчёта',
          icon: 'tune',
          style: 'params',
          fields: [
            { id: 'capital_adequacy_ratio_pct', label: 'Норматив достаточности (H1)', unit: '%', default: 12.0, min: 8, max: 20, step: 0.5 },
            { id: 'cost_of_capital_pct', label: 'Стоимость капитала (CoE)', unit: '% годовых', default: 15.0, min: 5, max: 30, step: 0.5 },
          ],
        },
      ],
    },
  };

  for (const key of state.selectedEffects) {
    const cfg = configs[key];
    if (!cfg) continue;

    const section = document.createElement('div');
    section.className = 'form-section';
    section.setAttribute('data-section', key);
    section.innerHTML = `<h3>${cfg.title}</h3>`;
    if (cfg.hint) {
      section.innerHTML += `<p class="section-hint">${cfg.hint}</p>`;
    }

    for (const group of cfg.groups) {
      const groupDiv = document.createElement('div');
      groupDiv.className = `field-group group-${group.style}`;
      groupDiv.innerHTML = `<div class="field-group-title"><span class="material-symbols-outlined">${group.icon}</span>${group.title}</div>`;

      for (let i = 0; i < group.fields.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'form-row';
        for (let j = i; j < Math.min(i + 2, group.fields.length); j++) {
          const f = group.fields[j];
          row.innerHTML += `
            <div class="form-group">
              <label>${f.label}</label>
              <div class="slider-input">
                <input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.default}"
                       data-effect="${key}" data-field="${f.id}" oninput="syncSlider(this)">
                <input type="number" step="any" value="${f.default}"
                       data-effect="${key}" data-field="${f.id}" oninput="syncNumber(this)">
              </div>
              <span class="unit">${f.unit}</span>
            </div>`;
        }
        groupDiv.appendChild(row);
      }
      section.appendChild(groupDiv);
    }

    // Inline warnings container
    const warningsDiv = document.createElement('div');
    warningsDiv.className = 'inline-warnings';
    section.appendChild(warningsDiv);

    container.appendChild(section);
  }
}

function gatherData() {
  const effects = {};
  for (const key of state.selectedEffects) {
    const inputs = document.querySelectorAll(`input[type="number"][data-effect="${key}"]`);
    const obj = {};
    inputs.forEach(inp => {
      obj[inp.dataset.field] = parseFloat(inp.value) || 0;
    });
    effects[key] = obj;
  }

  const costs = {};
  document.querySelectorAll('input[type="number"][data-cost]').forEach(inp => {
    costs[inp.dataset.cost] = parseFloat(inp.value) || 0;
  });

  return { effects, costs };
}

async function calculate() {
  const data = gatherData();

  const resp = await fetch('/roi/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  state.result = await resp.json();
  goToStep(4);
  renderResults();
}

function fmt(n) {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + ' млрд';
  if (Math.abs(n) >= 1) return n.toFixed(1) + ' млн';
  return (n * 1000).toFixed(0) + ' тыс';
}

function renderResults() {
  const r = state.result;

  document.getElementById('kpi-net').textContent = fmt(r.net_effect_annual);
  document.getElementById('kpi-net').className = 'kpi-value ' + (r.net_effect_annual >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-roi').textContent = r.roi_pct.toFixed(0) + '%';
  document.getElementById('kpi-roi').className = 'kpi-value ' + (r.roi_pct >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-npv').textContent = fmt(r.npv);
  document.getElementById('kpi-npv').className = 'kpi-value ' + (r.npv >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-payback').textContent = r.payback_months > 0 ? r.payback_months + ' мес' : 'Не окупается';
  document.getElementById('kpi-payback').className = 'kpi-value ' + (r.payback_months > 0 && r.payback_months <= 24 ? 'positive' : 'negative');

  let tbody = '';
  for (const [name, val] of Object.entries(r.gross_effects)) {
    const isVirtual = name.includes('виртуальный');
    tbody += `<tr class="${isVirtual ? 'virtual-row' : ''}">
      <td>${name}</td>
      <td class="amount ${val >= 0 ? 'positive' : 'negative'}">+${fmt(val)} руб./год</td>
    </tr>`;
  }
  tbody += `<tr class="total-row"><td>Итого Gross</td><td class="amount positive">+${fmt(r.total_gross_annual)} руб./год</td></tr>`;
  for (const [name, val] of Object.entries(r.cost_breakdown)) {
    if (val > 0) tbody += `<tr><td>${name}</td><td class="amount negative">-${fmt(val)} руб./год</td></tr>`;
  }
  tbody += `<tr class="total-row"><td>Итого затраты</td><td class="amount negative">-${fmt(r.total_costs_annual)} руб./год</td></tr>`;
  tbody += `<tr class="total-row"><td>Чистый эффект (Net)</td><td class="amount ${r.net_effect_annual >= 0 ? 'positive' : 'negative'}">${r.net_effect_annual >= 0 ? '+' : ''}${fmt(r.net_effect_annual)} руб./год</td></tr>`;
  if (r.virtual_pnl_annual > 0) {
    tbody += `<tr class="virtual-row"><td>В т.ч. виртуальный PnL (ненайм)</td><td class="amount">${fmt(r.virtual_pnl_annual)} руб./год</td></tr>`;
  }
  document.getElementById('waterfall-body').innerHTML = tbody;

  renderCashflowChart(r);

  const wp = document.getElementById('warnings-panel');
  if (r.warnings.length === 0) {
    wp.innerHTML = '<p style="color: var(--success); font-size: 13px;">Предупреждений нет</p>';
  } else {
    wp.innerHTML = r.warnings.map(w => `
      <div class="warning-item ${w.severity}">
        <span class="badge">${w.code}</span>
        <span>${w.message}</span>
      </div>
    `).join('');
  }

  const bl = document.getElementById('benchmarks-list');
  bl.innerHTML = r.benchmarks.map(b => `
    <div class="benchmark-item">
      <div class="bm-label">${b.label}</div>
      <div class="bm-value">${b.display}</div>
      <div class="bm-source">${b.source}</div>
    </div>
  `).join('');
}

let cashflowChart = null;

function renderCashflowChart(r) {
  const ctx = document.getElementById('cashflow-chart').getContext('2d');
  if (cashflowChart) cashflowChart.destroy();

  const labels = Array.from({ length: r.cumulative_cashflows.length }, (_, i) => `${i + 1}`);

  cashflowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Кумулятивный cashflow',
          data: r.cumulative_cashflows,
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Помесячный cashflow',
          data: r.monthly_cashflows,
          borderColor: '#B45309',
          borderDash: [4, 4],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#8C8577', font: { size: 11 } },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Месяц', color: '#8C8577' },
          ticks: { color: '#8C8577' },
          grid: { color: 'rgba(229, 224, 213, 0.7)' },
        },
        y: {
          title: { display: true, text: 'млн руб.', color: '#8C8577' },
          ticks: { color: '#8C8577' },
          grid: { color: 'rgba(229, 224, 213, 0.7)' },
        },
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.effect-card').forEach(card => {
    card.addEventListener('click', () => toggleEffect(card.dataset.effect));
  });
});
