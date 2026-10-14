/*
  calendarView.js — calendário com visões de mês, semana e dia, integrado às tarefas.

  - clicar em um dia vazio cria uma tarefa naquela data (no celular abre o dia);
  - clicar em uma tarefa abre os detalhes para editar;
  - arrastar uma tarefa para outro dia muda o vencimento (o horário é mantido);
  - o painel lateral lista as tarefas atrasadas e as que vencem nas próximas 48 h.
*/
import { PRIORITIES } from '../config/constants.js';
import { getSettings } from '../services/settingsService.js';
import { getTask, getTasks, moveToDate } from '../services/taskService.js';
import { isDueSoon, isOverdue, sortTasks, tasksByDate } from '../services/taskSelectors.js';
import { resetFilters, setFilters } from '../state/uiState.js';
import { navigate } from '../core/router.js';
import {
  addDays, addMonths, fromDateKey, getMonthGrid, getWeekDays, getWeekdayLabels, startOfWeek, toDateKey, todayKey, WEEKDAYS_SHORT,
} from '../utils/date.js';
import { esc, patchHtml, plural } from '../utils/dom.js';
import { bindDragAndDrop } from '../utils/dnd.js';
import { formatDateKey, formatDueLabel, formatLongDate, formatMonthYear, formatTime, formatWeekRange } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { emptyState } from '../components/emptyState.js';
import { segmented } from '../components/segmented.js';
import { handleTaskAction } from '../components/taskActions.js';
import { openTaskForm } from '../components/taskForm.js';
import { taskRow } from '../components/taskItem.js';
import { toast } from '../components/toast.js';

const MAX_CHIPS = 3; // tarefas visíveis por dia no mês; o resto vira "+N mais"
const MODES = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

let root;
let mode = 'month';
let cursor = new Date(); // data de referência: define qual mês/semana/dia está na tela

const isDesktop = () => window.matchMedia('(min-width: 640px)').matches;

export const calendarView = {
  id: 'calendar',
  title: 'Calendário',

  mount(section) {
    root = section;
    root.addEventListener('click', onClick);

    // Chips são <div role="button">: Enter e Espaço precisam ativá-los como em um botão.
    root.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"][data-action]')) {
        event.preventDefault();
        event.target.click();
      }
    });

    bindDragAndDrop(root, {
      zoneSelector: '[data-drop-date]',
      onDrop: async (id, zone) => {
        const date = zone.dataset.dropDate;
        if (getTask(id)?.dueDate === date) return;
        try {
          await moveToDate(id, date);
          toast.success(`Vencimento alterado para ${formatDateKey(date)}`);
        } catch (error) {
          console.error(error);
          toast.error('Não foi possível alterar a data.');
        }
      },
    });
  },

  render() {
    const settings = getSettings();
    const byDate = tasksByDate(getTasks());
    const body = mode === 'month' ? monthView(byDate, settings) : mode === 'week' ? weekView(byDate, settings) : dayView(byDate);

    patchHtml(root, `
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="${ui.card} overflow-hidden">${toolbar(settings)}${body}</div>
        ${sidePanel()}
      </div>`);
  },
};

/* ------------------------------------------------------------ cliques */

function onClick(event) {
  const el = event.target.closest('[data-action]');
  if (!el || handleTaskAction(el)) return;
  const { action, date } = el.dataset;

  switch (action) {
    case 'cal-prev': shift(-1); break;
    case 'cal-next': shift(1); break;
    case 'cal-today': cursor = new Date(); calendarView.render(); break;
    case 'cal-mode': mode = el.dataset.value; calendarView.render(); break;
    case 'goto-day': cursor = fromDateKey(date); mode = 'day'; calendarView.render(); break;
    case 'new-on-date':
      // Em telas pequenas a célula é minúscula: tocar nela abre o dia em vez de criar.
      if (el.classList.contains('cal-cell') && !isDesktop()) {
        cursor = fromDateKey(date);
        mode = 'day';
        calendarView.render();
      } else {
        openTaskForm({ defaults: { dueDate: date } });
      }
      break;
    case 'show-overdue':
      resetFilters();
      setFilters({ date: 'overdue' });
      navigate('tasks');
      break;
  }
}

function shift(direction) {
  if (mode === 'month') cursor = addMonths(cursor, direction);
  else if (mode === 'week') cursor = addDays(cursor, 7 * direction);
  else cursor = addDays(cursor, direction);
  calendarView.render();
}

/* ------------------------------------------------------------ cabeçalho */

function title(settings) {
  if (mode === 'month') return formatMonthYear(cursor);
  if (mode === 'week') {
    const start = startOfWeek(cursor, settings.weekStart);
    return formatWeekRange(start, addDays(start, 6));
  }
  return formatLongDate(cursor, true);
}

function toolbar(settings) {
  return `
    <div class="flex flex-wrap items-center gap-3 border-b border-line p-3 sm:p-4">
      <h2 class="mr-auto text-base font-semibold sm:text-lg" aria-live="polite">${esc(title(settings))}</h2>
      <div class="flex items-center gap-1">
        <button type="button" data-action="cal-prev" data-focus-key="cal-prev" class="${ui.iconBtn}" aria-label="Período anterior">${icon('chevron-left')}</button>
        <button type="button" data-action="cal-today" class="${ui.btnSecondary} !px-3 !py-1.5">Hoje</button>
        <button type="button" data-action="cal-next" data-focus-key="cal-next" class="${ui.iconBtn}" aria-label="Próximo período">${icon('chevron-right')}</button>
      </div>
      ${segmented({ label: 'Tipo de visualização', dataAttrs: 'data-action="cal-mode"', value: mode, options: MODES })}
    </div>`;
}

/* ------------------------------------------------------------ chip de tarefa (mês e semana) */

function calendarChip(task, { full = false } = {}) {
  const id = esc(task.id);
  const done = task.status === 'done';
  const time = task.dueTime ? `<span class="shrink-0 font-semibold opacity-80">${esc(formatTime(task.dueTime))}</span>` : '';
  return `
    <div role="button" tabindex="0" draggable="true" data-drag-id="${id}" data-action="edit" data-id="${id}" title="${esc(task.title)}"
      class="flex cursor-pointer items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-xs transition hover:brightness-95 ${PRIORITIES[task.priority].chip}
      ${done ? 'line-through opacity-50' : ''} ${isOverdue(task) ? 'ring-1 ring-inset ring-red-500/60' : ''}">
      ${time}<span class="${full ? 'break-words' : 'truncate'}">${esc(task.title)}</span>
    </div>`;
}

/* ------------------------------------------------------------ visão mensal */

function monthView(byDate, settings) {
  const today = todayKey();
  const month = cursor.getMonth();
  const labels = getWeekdayLabels(settings.weekStart)
    .map((label) => `<div class="px-2 py-2 text-center text-xs font-medium text-mute">${label}</div>`)
    .join('');
  const cells = getMonthGrid(cursor, settings.weekStart)
    .map((day) => monthCell(day, byDate.get(toDateKey(day)) ?? [], today, month))
    .join('');

  return `
    <div role="group" aria-label="${esc(formatMonthYear(cursor))}">
      <div class="grid grid-cols-7 border-b border-line bg-subtle/50">${labels}</div>
      <div class="grid grid-cols-7">${cells}</div>
    </div>`;
}

function monthCell(day, tasks, today, month) {
  const key = toDateKey(day);
  const isToday = key === today;
  const outside = day.getMonth() !== month;
  const shown = tasks.slice(0, MAX_CHIPS);
  const hidden = tasks.length - shown.length;
  const dayLabel = `${formatLongDate(day)}${tasks.length ? `, ${plural(tasks.length, 'tarefa', 'tarefas')}` : ''}`;

  return `
    <div class="cal-cell group relative min-h-[4.5rem] cursor-pointer border-b border-r border-line p-1 transition hover:bg-subtle/60 sm:min-h-[7.5rem] sm:p-1.5 ${outside ? 'bg-subtle/30' : ''}"
      data-action="new-on-date" data-date="${key}" data-drop-date="${key}">
      <div class="flex items-center justify-between">
        <button type="button" data-action="goto-day" data-date="${key}" aria-label="${esc(dayLabel)}"
          class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium hover:ring-2 hover:ring-accent/40 ${
            isToday ? 'bg-accent text-white' : outside ? 'text-mute/60' : 'text-ink'}" ${isToday ? 'aria-current="date"' : ''}>${day.getDate()}</button>
        <button type="button" data-action="new-on-date" data-date="${key}" aria-label="Nova tarefa em ${esc(formatDateKey(key))}"
          class="reveal-actions hidden h-5 w-5 items-center justify-center rounded text-mute hover:bg-subtle hover:text-ink sm:flex">${icon('plus', 'h-3.5 w-3.5')}</button>
      </div>
      <div class="mt-1 hidden space-y-1 sm:block">
        ${shown.map((task) => calendarChip(task)).join('')}
        ${hidden ? `<button type="button" data-action="goto-day" data-date="${key}" class="px-1 text-xs font-medium text-mute hover:text-ink">+${hidden} mais</button>` : ''}
      </div>
      <div class="mt-1.5 flex flex-wrap justify-center gap-0.5 sm:hidden">
        ${tasks.slice(0, 4).map((task) => `<span class="h-1.5 w-1.5 rounded-full ${PRIORITIES[task.priority].dot} ${task.status === 'done' ? 'opacity-40' : ''}"></span>`).join('')}
      </div>
    </div>`;
}

/* ------------------------------------------------------------ visão semanal */

function weekView(byDate, settings) {
  const today = todayKey();
  const columns = getWeekDays(cursor, settings.weekStart).map((day) => {
    const key = toDateKey(day);
    const tasks = byDate.get(key) ?? [];
    const isToday = key === today;
    return `
      <div class="min-h-[8rem] border-b border-line p-2 md:min-h-[26rem] md:border-b-0 ${isToday ? 'bg-accent/5' : ''}" data-drop-date="${key}">
        <div class="mb-2 flex items-center justify-between">
          <button type="button" data-action="goto-day" data-date="${key}" class="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-subtle">
            <span class="text-xs font-medium text-mute">${WEEKDAYS_SHORT[day.getDay()]}</span>
            <span class="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-accent text-white' : ''}">${day.getDate()}</span>
          </button>
          <button type="button" data-action="new-on-date" data-date="${key}" class="${ui.iconBtn} !h-6 !w-6" aria-label="Nova tarefa em ${esc(formatDateKey(key))}">${icon('plus', 'h-3.5 w-3.5')}</button>
        </div>
        <div class="space-y-1.5">
          ${tasks.length ? tasks.map((task) => calendarChip(task, { full: true })).join('') : '<p class="px-1 text-xs text-mute">Sem tarefas</p>'}
        </div>
      </div>`;
  }).join('');

  return `<div class="grid divide-line md:grid-cols-7 md:divide-x">${columns}</div>`;
}

/* ------------------------------------------------------------ visão diária */

function dayView(byDate) {
  const key = toDateKey(cursor);
  const tasks = byDate.get(key) ?? [];
  const done = tasks.filter((task) => task.status === 'done').length;
  const addButton = `<button type="button" data-action="new-on-date" data-date="${key}" class="${ui.btnSecondary}">${icon('plus')}Adicionar tarefa neste dia</button>`;

  return `
    <div class="p-4 sm:p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-mute">${tasks.length ? `${plural(tasks.length, 'tarefa', 'tarefas')}, ${done} concluída${done === 1 ? '' : 's'}` : 'Nenhuma tarefa neste dia'}</p>
        ${tasks.length ? addButton : ''}
      </div>
      ${tasks.length
        ? `<div class="space-y-2">${tasks.map((task) => taskRow(task, { showDescription: true })).join('')}</div>`
        : emptyState({ iconName: 'calendar', title: 'Dia livre', text: 'Nenhuma tarefa vence nesta data.', actionHtml: addButton })}
    </div>`;
}

/* ------------------------------------------------------------ painel lateral: atrasadas e próximas */

function sidePanel() {
  const tasks = getTasks();
  const now = Date.now();
  const overdue = sortTasks(tasks.filter((task) => isOverdue(task, now)), 'due');
  const soon = sortTasks(tasks.filter((task) => isDueSoon(task, now)), 'due');

  return `
    <aside class="space-y-4" aria-label="Alertas de prazo">
      ${attentionCard('Atrasadas', 'alert-circle', 'text-red-500', overdue, 'Nenhuma tarefa atrasada.', true)}
      ${attentionCard('Vencem em breve', 'clock', 'text-amber-500', soon, 'Nada vencendo nas próximas 48 horas.')}
    </aside>`;
}

function attentionCard(heading, iconName, iconClass, items, emptyText, withLink = false) {
  const list = items.slice(0, 5).map((task) => `
    <li>
      <button type="button" data-action="edit" data-id="${esc(task.id)}" class="flex w-full items-start gap-2 rounded-lg p-2 text-left transition hover:bg-subtle">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITIES[task.priority].dot}"></span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">${esc(task.title)}</span>
          <span class="block text-xs text-mute">${esc(formatDueLabel(task))}</span>
        </span>
      </button>
    </li>`).join('');

  return `
    <section class="${ui.card} p-4">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span class="${iconClass}">${icon(iconName, 'h-4 w-4')}</span>${heading}
        <span class="ml-auto rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-mute">${items.length}</span>
      </h3>
      ${items.length ? `<ul class="space-y-1">${list}</ul>` : `<p class="text-sm text-mute">${emptyText}</p>`}
      ${withLink && items.length > 5 ? `<button type="button" data-action="show-overdue" class="mt-2 text-xs font-medium text-accent-ink hover:underline">Ver todas (${items.length})</button>` : ''}
    </section>`;
}
