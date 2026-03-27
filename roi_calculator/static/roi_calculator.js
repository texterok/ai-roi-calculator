const state = {
  currentStep: 1,
  selectedEffects: new Set(),
  result: null,
};

// Slider <-> Number sync
function syncSlider(rangeEl) {
  const group = rangeEl.closest('.slider-input') || rangeEl.closest('.form-group');
  const numEl = group.querySelector('input[type="number"]');
  if (numEl) numEl.value = rangeEl.value;
}

function syncNumber(numEl) {
  const group = numEl.closest('.slider-input') || numEl.closest('.form-group');
  const rangeEl = group.querySelector('input[type="range"]');
  if (rangeEl) rangeEl.value = numEl.value;
}

function goToStep(n) {
  if (n === 2 && state.selectedEffects.size === 0) {
    alert('Выберите хотя бы один тип эффекта');
    return;
  }
  state.currentStep = n;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`step-${n}`).classList.add('active');
  document.querySelectorAll('.step-indicator').forEach((s, i) => {
    s.classList.remove('active');
    s.classList.toggle('completed', i + 1 < n);
    if (i + 1 === n) s.classList.add('active');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (n === 2) renderEffectForms();
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

function renderEffectForms() {
  const container = document.getElementById('effect-forms');
  container.innerHTML = '';

  const configs = {
    revenue_growth: {
      title: 'Рост доходов',
      hint: 'Инкремент = TO BE минус AS IS. Не забудьте учесть каннибализацию: если вы увеличиваете продажи одного продукта, другие могут терять объём.',
      fields: [
        { id: 'baseline_revenue_monthly', label: 'Текущая выручка (AS IS)', unit: 'млн руб./мес', default: 0, min: 0, max: 5000, step: 1 },
        { id: 'expected_revenue_monthly', label: 'Ожидаемая выручка (TO BE)', unit: 'млн руб./мес', default: 0, min: 0, max: 5000, step: 1 },
        { id: 'cross_sell_revenue_monthly', label: 'Доход от кросс-продаж', unit: 'млн руб./мес', default: 0, min: 0, max: 500, step: 0.5 },
        { id: 'cannibalization_pct', label: 'Каннибализация', unit: '%', default: 0, min: 0, max: 50, step: 1 },
        { id: 'product_lifetime_months', label: 'Срок жизни продукта', unit: 'мес', default: 12, min: 1, max: 120, step: 1 },
        { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3, min: 0, max: 12, step: 1 },
      ],
    },
    opex_reduction: {
      title: 'Снижение OPEX',
      hint: 'Укажите текущий и ожидаемый уровень затрат. Эффект = разница между ними. Учтите, что экономия часто выходит на полный уровень не сразу.',
      fields: [
        { id: 'current_cost_monthly', label: 'Текущие затраты (AS IS)', unit: 'млн руб./мес', default: 0, min: 0, max: 1000, step: 1 },
        { id: 'expected_cost_monthly', label: 'Ожидаемые затраты (TO BE)', unit: 'млн руб./мес', default: 0, min: 0, max: 1000, step: 1 },
        { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3, min: 0, max: 12, step: 1 },
      ],
    },
    fte_optimization: {
      title: 'Оптимизация ФОТ (ПШЕ)',
      hint: 'Реальное сокращение = фактическое увольнение. Ненайм = сотрудники, которых не пришлось нанимать благодаря ИИ. Ненайм учитывается как виртуальный PnL отдельно.',
      fields: [
        { id: 'fte_reduced', label: 'Реальное сокращение ПШЕ', unit: 'чел', default: 0, min: 0, max: 100, step: 1 },
        { id: 'fte_avoided', label: 'Ненайм (avoided)', unit: 'чел', default: 0, min: 0, max: 100, step: 1 },
        { id: 'avg_salary_monthly', label: 'Средняя ЗП (gross)', unit: 'тыс. руб./мес', default: 0, min: 50, max: 1000, step: 10 },
        { id: 'tax_rate_pct', label: 'Ставка взносов', unit: '%', default: 30.2, min: 0, max: 50, step: 0.1 },
        { id: 'bonus_months', label: 'Бонус', unit: 'мес/год', default: 0, min: 0, max: 12, step: 0.5 },
        { id: 'office_cost_per_fte_monthly', label: 'Расходы на рабочее место', unit: 'тыс. руб./мес', default: 0, min: 0, max: 200, step: 5 },
      ],
    },
    risk_reduction: {
      title: 'Снижение операционных рисков',
      hint: 'Укажите текущие потери от фрода/дефектов и ожидаемый % предотвращения. Не забудьте про стоимость ложных срабатываний — они тоже стоят денег.',
      fields: [
        { id: 'annual_loss_baseline', label: 'Текущие потери (AS IS)', unit: 'млн руб./год', default: 0, min: 0, max: 10000, step: 1 },
        { id: 'expected_prevention_pct', label: 'Ожидаемое предотвращение', unit: '%', default: 0, min: 0, max: 100, step: 1 },
        { id: 'false_positive_cost_annual', label: 'Стоимость ложных срабатываний', unit: 'млн руб./год', default: 0, min: 0, max: 500, step: 0.5 },
      ],
    },
    liquidity_release: {
      title: 'Высвобождение ликвидности',
      hint: 'Высвобожденные средства можно разместить по ставке overnight. Эффект = высвобожденный объём x стоимость фондирования.',
      fields: [
        { id: 'current_reserves', label: 'Текущий объём резервов', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
        { id: 'optimized_reserves', label: 'Оптимизированный объём', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
        { id: 'cost_of_funds_pct', label: 'Стоимость фондирования', unit: '% годовых', default: 8.0, min: 1, max: 25, step: 0.5 },
      ],
    },
    reserve_recovery: {
      title: 'Довзыскание резервов',
      hint: 'ИИ помогает точнее оценивать заёмщиков и эффективнее работать с просроченной задолженностью. Эффект = портфель x дельта ставки взыскания.',
      fields: [
        { id: 'portfolio_volume', label: 'Объём портфеля', unit: 'млн руб.', default: 0, min: 0, max: 500000, step: 100 },
        { id: 'current_recovery_rate_pct', label: 'Текущий % взыскания', unit: '%', default: 0, min: 0, max: 100, step: 1 },
        { id: 'expected_recovery_rate_pct', label: 'Ожидаемый % взыскания', unit: '%', default: 0, min: 0, max: 100, step: 1 },
      ],
    },
    reserve_release: {
      title: 'Роспуск резервов (учётный)',
      hint: 'Это временный эффект: резервы высвобождаются сейчас, но могут потребоваться позже (принцип неттирования). Указывайте длительность эффекта.',
      fields: [
        { id: 'reserve_release_amount', label: 'Сумма роспуска', unit: 'млн руб.', default: 0, min: 0, max: 10000, step: 1 },
        { id: 'effect_duration_months', label: 'Срок действия эффекта', unit: 'мес', default: 12, min: 1, max: 60, step: 1 },
      ],
    },
    capital_cost_reduction: {
      title: 'Снижение стоимости капитала',
      hint: 'Эффект возникает через снижение RWA (активов, взвешенных с учётом риска). Формула: снижение RWA x норматив H1 x стоимость капитала.',
      fields: [
        { id: 'rwa_reduction', label: 'Снижение RWA', unit: 'млн руб.', default: 0, min: 0, max: 100000, step: 100 },
        { id: 'capital_adequacy_ratio_pct', label: 'Норматив достаточности (H1)', unit: '%', default: 12.0, min: 8, max: 20, step: 0.5 },
        { id: 'cost_of_capital_pct', label: 'Стоимость капитала (CoE)', unit: '% годовых', default: 15.0, min: 5, max: 30, step: 0.5 },
      ],
    },
  };

  for (const key of state.selectedEffects) {
    const cfg = configs[key];
    if (!cfg) continue;

    const section = document.createElement('div');
    section.className = 'form-section';
    section.innerHTML = `<h3>${cfg.title}</h3>`;
    if (cfg.hint) {
      section.innerHTML += `<p class="section-hint">${cfg.hint}</p>`;
    }

    for (let i = 0; i < cfg.fields.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'form-row';
      for (let j = i; j < Math.min(i + 2, cfg.fields.length); j++) {
        const f = cfg.fields[j];
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
      section.appendChild(row);
    }
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
