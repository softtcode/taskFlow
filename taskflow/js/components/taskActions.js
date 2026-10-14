/*
  taskActions.js — o que acontece quando o usuário clica nos botões de uma tarefa
  (concluir, reabrir, editar, excluir, mover). Compartilhado por todas as telas.

  Uso dentro de uma tela:
    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;   // já tratado aqui
      ...ações específicas da tela...
    });
*/
import { STATUSES } from '../config/constants.js';
import { getTask, reopenTask, setStatus, toggleDone } from '../services/taskService.js';
import { openTaskForm } from './taskForm.js';
import { confirmAndDelete } from './taskDelete.js';
import { toast } from './toast.js';

async function run(fn, errorMessage = 'Algo deu errado. Tente novamente.') {
  try {
    await fn();
  } catch (error) {
    console.error(error);
    toast.error(errorMessage);
  }
}

/** Devolve true se a ação era de tarefa (e foi tratada). */
export function handleTaskAction(element) {
  const { action, id } = element.dataset;

  switch (action) {
    case 'toggle':
      run(async () => {
        const task = await toggleDone(id);
        toast.success(task.status === 'done' ? 'Tarefa concluída' : 'Tarefa reaberta');
      });
      return true;

    case 'reopen':
      run(async () => {
        await reopenTask(id);
        toast.success('Tarefa reaberta');
      });
      return true;

    case 'edit':
      openTaskForm({ task: getTask(id) });
      return true;

    case 'delete':
      confirmAndDelete(id);
      return true;

    case 'move':
      run(async () => {
        await setStatus(id, element.dataset.status);
        toast.success(`Tarefa movida para "${STATUSES[element.dataset.status].label}"`);
      });
      return true;

    default:
      return false;
  }
}
