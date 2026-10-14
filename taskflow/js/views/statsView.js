/*
  statsView.js — produtividade: indicadores e gráficos calculados com as tarefas reais.
*/
import { STATUSES, STATUS_ORDER } from '../config/constants.js';
import { getTasks } from '../services/taskService.js';
import {
  categoryBreakdown, computeSummary, lastDaysActivity, priorityDistribution, statusDistribution,
} from '../services/taskSelectors.js';
import { esc, patchHtml } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { donutChart, progressBar, weeklyBars } from '../components/charts.js';
import { emptyState } from '../components/emptyState.js';
import { openTaskForm } from '../components/taskForm.js';

let root;

export const statsView = {
  id: 'stats',
  title: 'Produtividade',

  mount(section) {
    root = section;
    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="new-task"]')) openTaskForm();
    });
  },

  render() {
    const tasks = getTasks();

    if (tasks.length === 0) {
      patchHtml(root, emptyState({
        iconName: 'bar-chart',
        title: 'Ainda não há dados',
        text: 'Crie e conclua tarefas para acompanhar sua produtividade aqui.',
        actionHtml: `<button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Criar tarefa</button>`,
      }));
      return;
    }

    const summary = computeSummary(tasks);
    const priorities = priorityDistribution(tasks);
    const categories = categoryBreakdown(tasks);

    patchHtml(root, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          ${kpi('Tarefas criadas', summary.total, 'clipboard-list')}
          ${kpi('Concluídas', summary.done, 'circle-check')}
          ${kpi('Taxa de conclusão', `${summary.completionRate}%`, 'trending-up')}
          ${kpi('Atrasadas', summary.overdue, 'alert-circle', summary.overdue > 0)}
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <section class="${ui.card} p-5 lg:col-span-2" aria-labelledby="week-heading">
            <h3 id="week-heading" class="font-semibold">Evolução nos últimos 7 dias</h3>
            <p class="mb-5 text-sm text-mute">Tarefas criadas e concluídas por dia.</p>
            ${weeklyBars(lastDaysActivity(tasks, 7))}
          </section>

          <section class="${ui.card} p-5" aria-labelledby="priority-heading">
            <h3 id="priority-heading" class="font-semibold">Por prioridade</h3>
            <p class="mb-5 text-sm text-mute">Distribuição de todas as tarefas.</p>
            <div class="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              ${donutChart(priorities)}
              <ul class="w-full space-y-2 text-sm">
                ${priorities.map((item) => `
                  <li class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full ${item.dot}"></span>
                    <span class="flex-1">${item.label}</span>
                    <span class="font-medium">${item.count}</span>
                  </li>`).join('')}
              </ul>
            </div>
          </section>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="${ui.card} p-5" aria-labelledby="status-heading">
            <h3 id="status-heading" class="mb-4 font-semibold">Por status</h3>
            ${statusSection(tasks)}
          </section>

          <section class="${ui.card} p-5" aria-labelledby="category-heading">
            <h3 id="category-heading" class="mb-4 font-semibold">Por categoria</h3>
            <ul class="space-y-4">
              ${categories.map((category) => `
                <li>
                  <div class="mb-1.5 flex items-center justify-between text-sm">
                    <span class="font-medium">${esc(category.name)}</span>
                    <span class="text-mute">${category.done} de ${category.total} concluídas</span>
                  </div>
                  ${progressBar((category.done / category.total) * 100, { label: `Conclusão em ${category.name}` })}
                </li>`).join('')}
            </ul>
          </section>
        </div>
      </div>`);
  },
};

function kpi(label, value, iconName, alert = false) {
  return `
    <div class="${ui.card} p-4 sm:p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-mute">${label}</span>
        <span class="${alert ? 'text-red-500' : 'text-mute'}">${icon(iconName, 'h-4 w-4')}</span>
      </div>
      <p class="mt-3 text-3xl font-semibold tracking-tight ${alert ? 'text-red-600 dark:text-red-400' : ''}">${value}</p>
    </div>`;
}

/** Barra empilhada com a proporção de cada status + legenda. */
function statusSection(tasks) {
  const counts = statusDistribution(tasks);
  const total = tasks.length;
  const segmentTone = { todo: 'bg-slate-400', doing: 'bg-blue-500', done: 'bg-emerald-500' };

  const segments = STATUS_ORDER.filter((id) => counts[id] > 0)
    .map((id) => `<div class="h-full ${segmentTone[id]}" style="width:${(counts[id] / total) * 100}%" title="${STATUSES[id].label}: ${counts[id]}"></div>`)
    .join('');

  const legend = STATUS_ORDER.map((id) => `
    <li class="flex items-center gap-2">
      <span class="h-2.5 w-2.5 rounded-full ${STATUSES[id].dot}"></span>
      <span class="flex-1">${STATUSES[id].label}</span>
      <span class="font-medium">${counts[id]}</span>
    </li>`).join('');

  return `
    <div class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-subtle" role="img"
      aria-label="${STATUS_ORDER.map((id) => `${STATUSES[id].label}: ${counts[id]}`).join(', ')}">${segments}</div>
    <ul class="mt-5 space-y-2 text-sm">${legend}</ul>`;
}
