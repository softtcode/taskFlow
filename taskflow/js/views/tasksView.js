/*
  tasksView.js — "Minhas tarefas": filtros, ordenação e três formas de ver (lista, cards, kanban).
  Busca por nome = campo do header (state/uiState.js guarda o texto).
*/
import {
  DATE_FILTERS, LAYOUTS, PRIORITIES, PRIORITY_ORDER, SORT_OPTIONS, STATUSES, STATUS_FILTERS, STATUS_ORDER,
} from '../config/constants.js';
import { bus, EVENTS } from '../core/eventBus.js';
import { getCurrentViewId } from '../core/router.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { getTask, getTasks, setStatus } from '../services/taskService.js';
import { applyFilters, getCategoryList, sortTasks } from '../services/taskSelectors.js';
import { hasActiveFilters, resetFilters, setFilters, setSortBy, uiState } from '../state/uiState.js';
import { esc, patchHtml, plural } from '../utils/dom.js';
import { bindDragAndDrop } from '../utils/dnd.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { emptyState } from '../components/emptyState.js';
import { segmented } from '../components/segmented.js';
import { handleTaskAction } from '../components/taskActions.js';
import { openTaskForm } from '../components/taskForm.js';
import { taskCard, taskRow } from '../components/taskItem.js';
import { toast } from '../components/toast.js';

let root;

export const tasksView = {
  id: 'tasks',
  title: 'Minhas tarefas',

  mount(section) {
    root = section;

    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;

      switch (el.dataset.action) {
        case 'new-task':
          openTaskForm({ defaults: el.dataset.status ? { status: el.dataset.status } : {} });
          break;
        case 'set-layout':
          updateSettings({ taskLayout: el.dataset.value }); // salvo nas configurações → re-renderiza
          break;
        case 'clear-filters':
          resetFilters();
          break;
      }
    });

    // Selects de filtro e de ordenação
    root.addEventListener('change', (event) => {
      const select = event.target;
      if (select.dataset.filter) setFilters({ [select.dataset.filter]: select.value });
      else if (select.dataset.sort) setSortBy(select.value);
    });

    // Kanban: soltar um card em uma coluna muda o status
    bindDragAndDrop(root, {
      zoneSelector: '[data-drop-status]',
      onDrop: async (id, zone) => {
        const status = zone.dataset.dropStatus;
        if (getTask(id)?.status === status) return;
        try {
          await setStatus(id, status);
          toast.success(`Tarefa movida para "${STATUSES[status].label}"`);
        } catch (error) {
          console.error(error);
          toast.error('Não foi possível mover a tarefa.');
        }
      },
    });

    bus.on(EVENTS.FILTERS_CHANGED, () => {
      if (getCurrentViewId() === 'tasks') this.render();
    });
  },

  render() {
    const settings = getSettings();
    const all = getTasks();
    const { filters, sortBy } = uiState;
    const isKanban = settings.taskLayout === 'kanban';
    const visible = sortTasks(
      applyFilters(all, filters, { showCompleted: settings.showCompleted || isKanban }),
      sortBy,
    );

    patchHtml(root, `
      <div class="space-y-4">
        ${toolbar(all, visible.length, settings)}
        ${results(all, visible, settings)}
      </div>`);
  },
};

/* ------------------------------------------------------------ barra de filtros */

function selectField(label, key, options, value, attr) {
  // Se a opção escolhida deixou de existir (ex.: categoria apagada), mantém visível para não confundir.
  const list = options.some(([optionValue]) => optionValue === value) ? options : [...options, [value, value]];
  return `
    <label class="block text-xs font-medium text-mute">${label}
      <select ${attr} data-focus-key="field-${key}" class="${ui.select} mt-1">
        ${list.map(([optionValue, text]) => `<option value="${esc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}
      </select>
    </label>`;
}

function toolbar(all, count, settings) {
  const { filters, sortBy } = uiState;
  const categories = getCategoryList(all).map((name) => [name, name]);

  return `
    <div class="${ui.card} p-3 sm:p-4">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        ${selectField('Prioridade', 'priority', [['all', 'Todas'], ...PRIORITY_ORDER.map((id) => [id, PRIORITIES[id].label])], filters.priority, 'data-filter="priority"')}
        ${selectField('Status', 'status', Object.entries(STATUS_FILTERS), filters.status, 'data-filter="status"')}
        ${selectField('Categoria', 'category', [['all', 'Todas'], ...categories], filters.category, 'data-filter="category"')}
        ${selectField('Prazo', 'date', Object.entries(DATE_FILTERS), filters.date, 'data-filter="date"')}
        ${selectField('Ordenar por', 'sort', Object.entries(SORT_OPTIONS), sortBy, 'data-sort="true"')}
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p class="text-sm text-mute" aria-live="polite">
          ${plural(count, 'tarefa', 'tarefas')}${filters.search.trim() ? ` para "${esc(filters.search.trim())}"` : ''}
        </p>
        <div class="flex items-center gap-2">
          ${hasActiveFilters() ? `<button type="button" data-action="clear-filters" class="${ui.btnGhost} !py-1.5">Limpar filtros</button>` : ''}
          ${segmented({
            label: 'Modo de visualização',
            dataAttrs: 'data-action="set-layout"',
            value: settings.taskLayout,
            options: Object.entries(LAYOUTS).map(([value, layout]) => ({ value, label: layout.label, icon: layout.icon })),
          })}
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------ resultados */

function results(all, visible, settings) {
  const options = { showDescription: settings.showDescriptions };

  if (all.length === 0) {
    return emptyState({
      title: 'Nenhuma tarefa ainda',
      text: 'Crie sua primeira tarefa e acompanhe tudo por aqui: lista, cards ou kanban.',
      actionHtml: `<button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Criar tarefa</button>`,
    });
  }

  if (settings.taskLayout === 'kanban') return kanban(visible, options);

  if (visible.length === 0) {
    return emptyState({
      iconName: 'search',
      title: 'Nenhuma tarefa encontrada',
      text: 'Nada corresponde à busca ou aos filtros atuais.',
      actionHtml: `<button type="button" data-action="clear-filters" class="${ui.btnSecondary}">Limpar filtros</button>`,
    });
  }

  if (settings.taskLayout === 'cards') {
    return `<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${visible.map((task) => taskCard(task, options)).join('')}</div>`;
  }
  return `<div class="space-y-2">${visible.map((task) => taskRow(task, options)).join('')}</div>`;
}

function kanban(visible, options) {
  const columns = STATUS_ORDER.map((status) => {
    const items = visible.filter((task) => task.status === status);
    const { label, dot } = STATUSES[status];
    return `
      <section class="flex flex-col rounded-xl border border-line bg-subtle/60 p-3" data-drop-status="${status}" aria-label="Coluna ${label}">
        <header class="mb-3 flex items-center justify-between px-1">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <span class="h-2 w-2 rounded-full ${dot}"></span>${label}
            <span class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-mute">${items.length}</span>
          </h3>
          <button type="button" data-action="new-task" data-status="${status}" class="${ui.iconBtn}" aria-label="Adicionar tarefa em ${label}">${icon('plus')}</button>
        </header>
        <div class="flex min-h-[7rem] flex-1 flex-col gap-2.5">
          ${items.length
            ? items.map((task) => taskCard(task, { ...options, kanban: true })).join('')
            : '<p class="m-auto px-4 py-6 text-center text-sm text-mute">Arraste tarefas para cá</p>'}
        </div>
      </section>`;
  }).join('');

  return `<div class="grid gap-4 lg:grid-cols-3">${columns}</div>`;
}
