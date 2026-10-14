/*
  taskItem.js — como UMA tarefa aparece na tela. Três versões do mesmo dado:
    taskRow()   → linha (modo lista, dashboard, dia do calendário)
    taskCard()  → card (modo cards e Kanban)
  Os pedaços menores (etiquetas, prazo, botões) são compartilhados para não duplicar HTML.

  Os botões usam data-action / data-id; quem trata o clique é components/taskActions.js.
*/
import { PRIORITIES, STATUSES, STATUS_ORDER } from '../config/constants.js';
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { formatDueLabel } from '../utils/format.js';
import { isDueSoon, isOverdue } from '../services/taskSelectors.js';
import { ui } from '../ui/classes.js';

/* ---------- pedaços reutilizáveis ---------- */

export function priorityBadge(priority) {
  const info = PRIORITIES[priority] ?? PRIORITIES.medium;
  return `<span class="${ui.badge} ${info.badge}"><span class="h-1.5 w-1.5 rounded-full ${info.dot}"></span>${info.label}</span>`;
}

// Cores das categorias (nenhuma é vermelha/laranja/verde para não confundir com as prioridades)
const CATEGORY_STYLES = [
  'bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300',
  'bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300',
  'bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/25 dark:text-fuchsia-300',
  'bg-teal-500/10 text-teal-700 ring-teal-500/25 dark:text-teal-300',
  'bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300',
  'bg-cyan-500/10 text-cyan-700 ring-cyan-500/25 dark:text-cyan-300',
];

/** Cada categoria recebe sempre a mesma cor (calculada a partir do nome). */
function categoryStyle(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

export function categoryChip(name) {
  if (!name) return '';
  return `<span class="${ui.badge} ${categoryStyle(name)}">${icon('tag', 'h-3 w-3')}${esc(name)}</span>`;
}

function statusBadge(task) {
  if (task.status !== 'doing') return '';
  return `<span class="${ui.badge} bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300">${STATUSES.doing.label}</span>`;
}

/** Prazo da tarefa: vermelho se atrasada, âmbar se vence em breve. */
export function dueBadge(task) {
  if (!task.dueDate) return '';
  const overdue = isOverdue(task);
  const soon = isDueSoon(task);
  const tone = task.status === 'done'
    ? 'text-mute'
    : overdue ? 'font-medium text-red-600 dark:text-red-400'
    : soon ? 'text-amber-600 dark:text-amber-400'
    : 'text-mute';
  return `<span class="inline-flex items-center gap-1 text-xs ${tone}">
    ${icon(overdue ? 'alert-circle' : 'clock', 'h-3.5 w-3.5')}
    ${overdue ? '<span class="sr-only">Atrasada: </span>' : ''}${esc(formatDueLabel(task))}
  </span>`;
}

function checkButton(task) {
  const done = task.status === 'done';
  return `<button type="button" role="checkbox" aria-checked="${done}" data-action="toggle" data-id="${esc(task.id)}"
    aria-label="${done ? 'Reabrir' : 'Concluir'} tarefa: ${esc(task.title)}"
    class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
      done ? 'border-accent bg-accent text-white' : 'border-mute/50 text-transparent hover:border-accent hover:text-accent/60'
    }">${icon('check', 'h-3 w-3')}</button>`;
}

function actionButtons(task) {
  const id = esc(task.id);
  const title = esc(task.title);
  const reopen = task.status === 'done'
    ? `<button type="button" class="${ui.iconBtn}" data-action="reopen" data-id="${id}" title="Reabrir" aria-label="Reabrir tarefa: ${title}">${icon('rotate-ccw')}</button>`
    : '';
  return `<div class="reveal-actions flex shrink-0 items-center gap-0.5">
    ${reopen}
    <button type="button" class="${ui.iconBtn}" data-action="edit" data-id="${id}" title="Editar" aria-label="Editar tarefa: ${title}">${icon('pencil')}</button>
    <button type="button" class="${ui.iconBtn} hover:!text-red-600" data-action="delete" data-id="${id}" title="Excluir" aria-label="Excluir tarefa: ${title}">${icon('trash-2')}</button>
  </div>`;
}

/** Cor da borda/fundo: destaca tarefas atrasadas automaticamente. */
const shellTone = (task) =>
  isOverdue(task) ? 'border-red-500/30 bg-red-500/5' : 'border-line bg-surface hover:border-mute/40';

/* ---------- versão em linha ---------- */

export function taskRow(task, { showDescription = true } = {}) {
  const done = task.status === 'done';
  return `
    <article class="group flex items-start gap-3 rounded-xl border p-3 shadow-card transition sm:p-3.5 ${shellTone(task)}">
      ${checkButton(task)}
      <div class="min-w-0 flex-1">
        <button type="button" data-action="edit" data-id="${esc(task.id)}"
          class="block max-w-full truncate text-left text-sm font-medium hover:text-accent-ink ${done ? 'text-mute line-through' : ''}">${esc(task.title)}</button>
        ${showDescription && task.description ? `<p class="mt-0.5 line-clamp-1 text-sm text-mute">${esc(task.description)}</p>` : ''}
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          ${priorityBadge(task.priority)}${statusBadge(task)}${categoryChip(task.category)}${dueBadge(task)}
        </div>
      </div>
      ${actionButtons(task)}
    </article>`;
}

/* ---------- versão em card (também usada no Kanban) ---------- */

/** No Kanban (kanban: true) o card pode ser arrastado e ganha botões para mover entre colunas. */
export function taskCard(task, { showDescription = true, kanban = false } = {}) {
  const done = task.status === 'done';
  const id = esc(task.id);
  return `
    <article class="group flex flex-col gap-3 rounded-xl border p-4 shadow-card transition ${shellTone(task)} ${kanban ? 'cursor-grab active:cursor-grabbing' : ''}"
      ${kanban ? `draggable="true" data-drag-id="${id}"` : ''}>
      <div class="flex items-start gap-3">
        ${checkButton(task)}
        <button type="button" data-action="edit" data-id="${id}"
          class="line-clamp-2 min-w-0 flex-1 text-left text-sm font-medium hover:text-accent-ink ${done ? 'text-mute line-through' : ''}">${esc(task.title)}</button>
      </div>
      ${showDescription && task.description ? `<p class="line-clamp-2 text-sm text-mute">${esc(task.description)}</p>` : ''}
      <div class="flex flex-wrap items-center gap-1.5">${priorityBadge(task.priority)}${statusBadge(task)}${categoryChip(task.category)}</div>
      <div class="mt-auto flex items-center justify-between gap-2">
        ${dueBadge(task) || '<span class="text-xs text-mute">Sem prazo</span>'}
        ${actionButtons(task)}
      </div>
      ${kanban ? moveButtons(task) : ''}
    </article>`;
}

/** Botões "← A fazer" / "Concluído →": mover entre colunas sem arrastar (teclado e touch). */
function moveButtons(task) {
  const index = STATUS_ORDER.indexOf(task.status);
  const previous = STATUS_ORDER[index - 1];
  const next = STATUS_ORDER[index + 1];
  const button = (status, content) =>
    `<button type="button" data-action="move" data-id="${esc(task.id)}" data-status="${status}" class="${ui.btnGhost} !px-2 !py-1 text-xs">${content}</button>`;

  return `<div class="flex items-center justify-between gap-2 border-t border-line pt-2">
    ${previous ? button(previous, `${icon('chevron-left', 'h-3.5 w-3.5')}${STATUSES[previous].label}`) : '<span></span>'}
    ${next ? button(next, `${STATUSES[next].label}${icon('chevron-right', 'h-3.5 w-3.5')}`) : ''}
  </div>`;
}
