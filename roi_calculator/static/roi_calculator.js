const state = {
  currentStep: 1,
  selectedEffects: new Set(),
  result: null,
};

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
      fields: [
        { id: 'baseline_revenue_monthly', label: 'Текущая выручка (AS IS)', unit: 'млн руб./мес', default: 0 },
        { id: 'expected_revenue_monthly', label: 'Ожидаемая выручка (TO BE)', unit: 'млн руб./мес', default: 0 },
        { id: 'cross_sell_revenue_monthly', label: 'Доход от кросс-продаж', unit: 'млн руб./мес', default: 0 },
        { id: 'cannibalization_pct', label: 'Каннибализация', unit: '%', default: 0 },
        { id: 'product_lifetime_months', label: 'Срок жизни продукта', unit: 'мес', default: 12 },
        { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3 },
      ],
    },
    opex_reduction: {
      title: 'Снижение OPEX',
      fields: [
        { id: 'current_cost_monthly', label: 'Текущие затраты (AS IS)', unit: 'млн руб./мес', default: 0 },
        { id: 'expected_cost_monthly', label: 'Ожидаемые затраты (TO BE)', unit: 'млн руб./мес', default: 0 },
        { id: 'ramp_up_months', label: 'Период выхода на полный эффект', unit: 'мес', default: 3 },
      ],
    },
    fte_optimization: {
      title: 'Оптимизация ФОТ (ПШЕ)',
      fields: [
        { id: 'fte_reduced', label: 'Реальное сокращение ПШЕ', unit: 'чел', default: 0 },
        { id: 'fte_avoided', label: 'Ненайм (avoided)', unit: 'чел', default: 0 },
        { id: 'avg_salary_monthly', label: 'Средняя ЗП (gross)', unit: 'тыс. руб./мес', default: 0 },
        { id: 'tax_rate_pct', label: 'Ставка взносов', unit: '%', default: 30.2 },
        { id: 'bonus_months', label: 'Бонус', unit: 'мес/год', default: 0 },
        { id: 'office_cost_per_fte_monthly', label: 'Расходы на рабочее место', unit: 'тыс. руб./мес', default: 0 },
      ],
    },
    risk_reduction: {
      title: 'Снижение операционных рисков',
      fields: [
        { id: 'annual_loss_baseline', label: 'Текущие потери (AS IS)', unit: 'млн руб./год', default: 0 },
        { id: 'expected_prevention_pct', label: 'Ожидаемое предотвращение', unit: '%', default: 0 },
        { id: 'false_positive_cost_annual', label: 'Стоимость ложных срабатываний', unit: 'млн руб./год', default: 0 },
      ],
    },
    liquidity_release: {
      title: 'Высвобождение ликвидности',
      fields: [
        { id: 'current_reserves', label: 'Текущий объём резервов', unit: 'млн руб.', default: 0 },
        { id: 'optimized_reserves', label: 'Оптимизированный объём', unit: 'млн руб.', default: 0 },
        { id: 'cost_of_funds_pct', label: 'Стоимость фондирования', unit: '% годовых', default: 8.0 },
      ],
    },
    reserve_recovery: {
      title: 'Довзыскание резервов',
      fields: [
        { id: 'portfolio_volume', label: 'Объём портфеля', unit: 'млн руб.', default: 0 },
        { id: 'current_recovery_rate_pct', label: 'Текущий % взыскания', unit: '%', default: 0 },
        { id: 'expected_recovery_rate_pct', label: 'Ожидаемый % взыскания', unit: '%', default: 0 },
      ],
    },
    reserve_release: {
      title: 'Роспуск резервов (учётный)',
      fields: [
        { id: 'reserve_release_amount', label: 'Сумма роспуска', unit: 'млн руб.', default: 0 },
        { id: 'effect_duration_months', label: 'Срок действия эффекта', unit: 'мес', default: 12 },
      ],
    },
    capital_cost_reduction: {
      title: 'Снижение стоимости капитала',
      fields: [
        { id: 'rwa_reduction', label: 'Снижение RWA', unit: 'млн руб.', default: 0 },
        { id: 'capital_adequacy_ratio_pct', label: 'Норматив достаточности (H1)', unit: '%', default: 12.0 },
        { id: 'cost_of_capital_pct', label: 'Стоимость капитала (CoE)', unit: '% годовых', default: 15.0 },
      ],
    },
  };

  for (const key of state.selectedEffects) {
    const cfg = configs[key];
    if (!cfg) continue;

    const section = document.createElement('div');
    section.className = 'form-section';
    section.innerHTML = `<h3>${cfg.title}</h3>`;

    const rows = [];
    for (let i = 0; i < cfg.fields.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'form-row';
      for (let j = i; j < Math.min(i + 2, cfg.fields.length); j++) {
        const f = cfg.fields[j];
        row.innerHTML += `
          <div class="form-group">
            <label>${f.label}</label>
            <input type="number" step="any" id="eff_${key}_${f.id}" value="${f.default}" data-effect="${key}" data-field="${f.id}">
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
    const inputs = document.querySelectorAll(`[data-effect="${key}"]`);
    const obj = {};
    inputs.forEach(inp => {
      obj[inp.dataset.field] = parseFloat(inp.value) || 0;
    });
    effects[key] = obj;
  }

  const costs = {};
  document.querySelectorAll('[data-cost]').forEach(inp => {
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

  // KPIs
  document.getElementById('kpi-net').textContent = fmt(r.net_effect_annual);
  document.getElementById('kpi-net').className = 'kpi-value ' + (r.net_effect_annual >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-roi').textContent = r.roi_pct.toFixed(0) + '%';
  document.getElementById('kpi-roi').className = 'kpi-value ' + (r.roi_pct >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-npv').textContent = fmt(r.npv);
  document.getElementById('kpi-npv').className = 'kpi-value ' + (r.npv >= 0 ? 'positive' : 'negative');
  document.getElementById('kpi-payback').textContent = r.payback_months > 0 ? r.payback_months + ' мес' : 'Не окупается';
  document.getElementById('kpi-payback').className = 'kpi-value ' + (r.payback_months > 0 && r.payback_months <= 24 ? 'positive' : 'negative');

  // Waterfall table
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

  // Cashflow chart
  renderCashflowChart(r);

  // Warnings
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

  // Benchmarks
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
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Помесячный cashflow',
          data: r.monthly_cashflows,
          borderColor: '#a78bfa',
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
          labels: { color: '#8b8fa3', font: { size: 11 } },
        },
        annotation: r.payback_months > 0 ? {
          annotations: {
            payback: {
              type: 'line',
              xMin: r.payback_months - 1,
              xMax: r.payback_months - 1,
              borderColor: '#22c55e',
              borderWidth: 2,
              borderDash: [6, 3],
              label: {
                content: `Окупаемость: ${r.payback_months} мес`,
                enabled: true,
                position: 'start',
                color: '#22c55e',
                font: { size: 11 },
              },
            },
          },
        } : {},
      },
      scales: {
        x: {
          title: { display: true, text: 'Месяц', color: '#8b8fa3' },
          ticks: { color: '#8b8fa3' },
          grid: { color: 'rgba(42, 42, 58, 0.5)' },
        },
        y: {
          title: { display: true, text: 'млн руб.', color: '#8b8fa3' },
          ticks: { color: '#8b8fa3' },
          grid: { color: 'rgba(42, 42, 58, 0.5)' },
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
