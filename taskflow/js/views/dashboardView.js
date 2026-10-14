/*
  dashboardView.js — visão geral: boas-vindas, números do dia, produtividade e prioridades.
*/
import { navigate } from '../core/router.js';
import { getSettings } from '../services/settingsService.js';
import { getTasks } from '../services/taskService.js';
import { computeSummary, sortTasks, weekTrend } from '../services/taskSelectors.js';
import { resetFilters, setFilters } from '../state/uiState.js';
import { esc, patchHtml, plural } from '../utils/dom.js';
import { todayKey } from '../utils/date.js';
import { formatLongDate, greeting } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { emptyState } from '../components/emptyState.js';
import { progressBar, progressRing } from '../components/charts.js';
import { handleTaskAction } from '../components/taskActions.js';
import { openTaskForm } from '../components/taskForm.js';
import { taskRow } from '../components/taskItem.js';

let root;

export const dashboardView = {
  id: 'dashboard',
  title: 'Dashboard',

  mount(section) {
    root = section;
    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;

      switch (el.dataset.action) {
        case 'new-task':
          openTaskForm();
          break;
        case 'open-filter': // os cards de números levam à lista já filtrada
          resetFilters();
          setFilters(JSON.parse(el.dataset.filter));
          navigate('tasks');
          break;
        case 'go':
          navigate(el.dataset.view);
          break;
      }
    });
  },

  render() {
    const tasks = getTasks();
    const settings = getSettings();
    const summary = computeSummary(tasks);
    const priorityTasks = sortTasks(tasks.filter((task) => task.status !== 'done'), 'urgency').slice(0, 5);
    const todayTasks = sortTasks(tasks.filter((task) => task.dueDate === todayKey()), 'due');
    const rowOptions = { showDescription: settings.showDescriptions };

    patchHtml(root, `
      <div class="space-y-6">
        ${header(summary, settings)}

        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          ${statCard('Pendentes', summary.pending, 'clock', 'bg-accent/10 text-accent-ink', { status: 'pending' })}
          ${statCard('Concluídas', summary.done, 'circle-check', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', { status: 'done' })}
          ${statCard('Atrasadas', summary.overdue, 'alert-circle', 'bg-red-500/10 text-red-600 dark:text-red-400', { date: 'overdue' })}
          ${statCard('Para hoje', summary.today, 'calendar', 'bg-amber-500/10 text-amber-600 dark:text-amber-400', { date: 'today' })}
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          ${productivityCard(summary, weekTrend(tasks))}
          <section class="${ui.card} p-5 lg:col-span-2" aria-labelledby="priority-heading">
            <div class="mb-4 flex items-center justify-between">
              <h3 id="priority-heading" class="font-semibold">Tarefas prioritárias</h3>
              <button type="button" data-action="go" data-view="tasks" class="text-sm font-medium text-accent-ink hover:underline">Ver todas</button>
            </div>
            ${priorityTasks.length
              ? `<div class="space-y-2">${priorityTasks.map((task) => taskRow(task, rowOptions)).join('')}</div>`
              : emptyState({
                  iconName: 'party-popper',
                  title: tasks.length ? 'Tudo em dia' : 'Nenhuma tarefa por aqui',
                  text: tasks.length ? 'Você não tem tarefas pendentes. Aproveite!' : 'Crie sua primeira tarefa para começar a se organizar.',
                })}
          </section>
        </div>

        <section class="${ui.card} p-5" aria-labelledby="today-heading">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 id="today-heading" class="font-semibold">Agenda de hoje</h3>
            <div class="w-full sm:w-56">
              <p class="mb-1.5 text-xs text-mute">${summary.todayDone} de ${summary.today} concluídas</p>
              ${progressBar(summary.today ? (summary.todayDone / summary.today) * 100 : 0, { label: 'Progresso de hoje' })}
            </div>
          </div>
          ${todayTasks.length
            ? `<div class="space-y-2">${todayTasks.map((task) => taskRow(task, rowOptions)).join('')}</div>`
            : `<p class="py-6 text-center text-sm text-mute">Nenhuma tarefa com vencimento hoje.</p>`}
        </section>
      </div>`);
  },
};

function header(summary, settings) {
  const name = settings.userName.trim();
  let message;
  if (summary.total === 0) message = 'Comece criando sua primeira tarefa.';
  else if (summary.todayPending === 0 && summary.overdue === 0) message = 'Nada pendente para hoje. Bom trabalho!';
  else {
    message = `Você tem ${plural(summary.todayPending, 'tarefa', 'tarefas')} para hoje`;
    message += summary.overdue ? ` e ${plural(summary.overdue, 'atrasada', 'atrasadas')}.` : '.';
  }

  return `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-mute">${esc(formatLongDate(new Date()))}</p>
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">${greeting()}${name ? `, ${esc(name)}` : ''}</h2>
        <p class="mt-1 text-mute">${esc(message)}</p>
      </div>
      <button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Nova tarefa</button>
    </div>`;
}

function statCard(label, value, iconName, tone, filter) {
  return `
    <button type="button" data-action="open-filter" data-filter="${esc(JSON.stringify(filter))}"
      class="${ui.card} p-4 text-left transition hover:border-mute/40 sm:p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-mute">${label}</span>
        <span class="flex h-8 w-8 items-center justify-center rounded-lg ${tone}">${icon(iconName, 'h-4 w-4')}</span>
      </div>
      <p class="mt-3 text-3xl font-semibold tracking-tight">${value}</p>
    </button>`;
}

function productivityLabel(summary) {
  if (summary.total === 0) return 'Sem dados ainda';
  if (summary.completionRate >= 75) return 'Excelente ritmo';
  if (summary.completionRate >= 50) return 'Bom andamento';
  if (summary.completionRate >= 25) return 'Em progresso';
  return 'Vamos começar';
}

function trendText({ current, previous }) {
  if (!current && !previous) return '';
  if (!previous) return `<p class="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">${current} concluídas nos últimos 7 dias</p>`;
  const diff = Math.round(((current - previous) / previous) * 100);
  const up = diff >= 0;
  return `<p class="mt-1 inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
    ${icon(up ? 'trending-up' : 'trending-down', 'h-3.5 w-3.5')}${up ? '+' : ''}${diff}% em relação à semana anterior</p>`;
}

function productivityCard(summary, trend) {
  return `
    <section class="${ui.card} p-5" aria-labelledby="productivity-heading">
      <h3 id="productivity-heading" class="text-sm font-medium text-mute">Produtividade</h3>
      <div class="mt-4 flex items-center gap-5">
        ${progressRing(summary.completionRate)}
        <div class="min-w-0">
          <p class="font-medium">${productivityLabel(summary)}</p>
          <p class="text-sm text-mute">${summary.done} de ${summary.total} concluídas</p>
          ${trendText(trend)}
        </div>
      </div>
      <div class="mt-5">${progressBar(summary.completionRate, { label: 'Tarefas concluídas' })}</div>
    </section>`;
}
