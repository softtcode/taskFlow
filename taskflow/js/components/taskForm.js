/*
  taskForm.js — formulário (em modal) para criar e editar tarefas.

    openTaskForm()                                   → nova tarefa
    openTaskForm({ defaults: { dueDate: '2026-10-20' } })  → nova, com campos preenchidos
    openTaskForm({ task })                           → editar (também serve para ver os detalhes)
*/
import { PRIORITIES, PRIORITY_ORDER, STATUSES, STATUS_ORDER } from '../config/constants.js';
import { createTask, getTasks, updateTask } from '../services/taskService.js';
import { getCategoryList } from '../services/taskSelectors.js';
import { validateTask } from '../utils/validators.js';
import { formatCreatedAt } from '../utils/format.js';
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { confirmAndDelete } from './taskDelete.js';
import { openDialog } from './modal.js';
import { toast } from './toast.js';

const FIELDS = ['title', 'description', 'category', 'dueDate', 'dueTime'];

export function openTaskForm({ task = null, defaults = {} } = {}) {
  const isEdit = Boolean(task);
  const v = {
    title: '', description: '', priority: 'medium', status: 'todo', category: '', dueDate: '', dueTime: '',
    ...defaults,
    ...(task ?? {}),
  };
  v.dueDate = v.dueDate ?? '';
  v.dueTime = v.dueTime ?? '';

  openDialog({
    title: isEdit ? 'Editar tarefa' : 'Nova tarefa',
    description: isEdit ? `Criada em ${formatCreatedAt(task.createdAt)}` : '',
    render(body, close) {
      body.innerHTML = template(v, isEdit);
      bindForm(body.querySelector('form'), { task, isEdit, close });
    },
  });
}

function errorLine(field) {
  return `<p id="tf-${field}-error" data-error-for="${field}" class="${ui.fieldError}" hidden></p>`;
}

function template(v, isEdit) {
  const categories = getCategoryList(getTasks(), { includeDefaults: true });

  const priorities = PRIORITY_ORDER.map((id) => `
    <label class="cursor-pointer">
      <input type="radio" name="priority" value="${id}" class="peer sr-only" ${v.priority === id ? 'checked' : ''} />
      <span class="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm transition hover:bg-subtle peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        <span class="h-2 w-2 rounded-full ${PRIORITIES[id].dot}"></span>${PRIORITIES[id].label}
      </span>
    </label>`).join('');

  const statuses = STATUS_ORDER.map((id) =>
    `<option value="${id}" ${v.status === id ? 'selected' : ''}>${STATUSES[id].label}</option>`).join('');

  return `
    <form novalidate class="space-y-4">
      <div>
        <label for="tf-title" class="${ui.label}">Título <span class="text-red-500" aria-hidden="true">*</span></label>
        <input id="tf-title" name="title" type="text" maxlength="80" autocomplete="off" autofocus
          value="${esc(v.title)}" placeholder="O que precisa ser feito?" aria-describedby="tf-title-error" class="${ui.input}" />
        ${errorLine('title')}
      </div>

      <div>
        <label for="tf-description" class="${ui.label}">Descrição</label>
        <textarea id="tf-description" name="description" rows="3" maxlength="500" aria-describedby="tf-description-error"
          placeholder="Detalhes, links ou observações (opcional)" class="${ui.input} resize-none">${esc(v.description)}</textarea>
        ${errorLine('description')}
      </div>

      <fieldset>
        <legend class="${ui.label}">Prioridade</legend>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">${priorities}</div>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="tf-status" class="${ui.label}">Status</label>
          <select id="tf-status" name="status" class="${ui.select}">${statuses}</select>
        </div>
        <div>
          <label for="tf-category" class="${ui.label}">Categoria</label>
          <input id="tf-category" name="category" type="text" list="tf-categories" maxlength="24" autocomplete="off"
            value="${esc(v.category)}" placeholder="Ex.: Trabalho" aria-describedby="tf-category-error" class="${ui.input}" />
          <datalist id="tf-categories">${categories.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>
          ${errorLine('category')}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="tf-dueDate" class="${ui.label}">Data de vencimento</label>
          <input id="tf-dueDate" name="dueDate" type="date" value="${esc(v.dueDate)}" aria-describedby="tf-dueDate-error" class="${ui.input}" />
          ${errorLine('dueDate')}
        </div>
        <div>
          <label for="tf-dueTime" class="${ui.label}">Horário <span class="font-normal text-mute">(opcional)</span></label>
          <input id="tf-dueTime" name="dueTime" type="time" value="${esc(v.dueTime)}" aria-describedby="tf-dueTime-error" class="${ui.input}" />
          ${errorLine('dueTime')}
        </div>
      </div>
      <button type="button" data-clear-due class="text-xs font-medium text-mute underline-offset-2 hover:text-ink hover:underline">Remover prazo</button>

      <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        ${isEdit
          ? `<button type="button" data-delete class="${ui.btnDangerSoft} mr-auto">${icon('trash-2')}Excluir</button>`
          : '<span class="mr-auto text-xs text-mute">Ctrl + Enter para salvar</span>'}
        <button type="button" data-dialog-close class="${ui.btnSecondary}">Cancelar</button>
        <button type="submit" data-submit class="${ui.btnPrimary}">${isEdit ? 'Salvar alterações' : 'Criar tarefa'}</button>
      </div>
    </form>`;
}

function readForm(form) {
  const data = new FormData(form);
  return {
    title: (data.get('title') ?? '').trim(),
    description: (data.get('description') ?? '').trim(),
    priority: data.get('priority'),
    status: data.get('status'),
    category: (data.get('category') ?? '').trim(),
    dueDate: data.get('dueDate') || null,
    dueTime: data.get('dueTime') || null,
  };
}

function showErrors(form, errors) {
  FIELDS.forEach((field) => {
    const message = form.querySelector(`[data-error-for="${field}"]`);
    const input = form.elements[field];
    message.textContent = errors[field] ?? '';
    message.hidden = !errors[field];
    input.setAttribute('aria-invalid', String(Boolean(errors[field])));
  });
  const first = FIELDS.find((field) => errors[field]);
  if (first) form.elements[first].focus();
}

function bindForm(form, { task, isEdit, close }) {
  const submit = form.querySelector('[data-submit]');
  const label = submit.textContent;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(form);
    const errors = validateTask(values);
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    submit.disabled = true;
    submit.innerHTML = `${icon('loader', 'h-4 w-4 animate-spin')}Salvando...`;
    try {
      if (isEdit) await updateTask(task.id, values);
      else await createTask(values);
      toast.success(isEdit ? 'Tarefa atualizada' : 'Tarefa criada');
      close();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar a tarefa. Tente novamente.');
      submit.disabled = false;
      submit.textContent = label;
    }
  });

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) form.requestSubmit();
  });

  form.querySelector('[data-clear-due]').addEventListener('click', () => {
    form.elements.dueDate.value = '';
    form.elements.dueTime.value = '';
  });

  form.querySelector('[data-delete]')?.addEventListener('click', async () => {
    if (await confirmAndDelete(task.id)) close();
  });
}
