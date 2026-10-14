/*
  taskDelete.js — exclusão de tarefa SEMPRE com confirmação.
  Fica em arquivo próprio porque é usada tanto pelos botões das listas (taskActions.js)
  quanto pelo botão "Excluir" do formulário (taskForm.js).
*/
import { deleteTask, getTask } from '../services/taskService.js';
import { confirmDialog } from './modal.js';
import { toast } from './toast.js';

/** Pergunta "tem certeza?" e exclui. Devolve true se a tarefa foi excluída. */
export async function confirmAndDelete(id) {
  const task = getTask(id);
  if (!task) return false;

  const confirmed = await confirmDialog({
    title: 'Excluir tarefa?',
    message: `"${task.title}" será removida permanentemente. Esta ação não pode ser desfeita.`,
    confirmLabel: 'Excluir',
    danger: true,
  });
  if (!confirmed) return false;

  try {
    await deleteTask(id);
    toast.success('Tarefa excluída');
    return true;
  } catch (error) {
    console.error(error);
    toast.error('Não foi possível excluir a tarefa.');
    return false;
  }
}
