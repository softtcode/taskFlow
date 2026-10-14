/*
  validators.js — regras de validação dos formulários.
  Devolve um objeto { campo: "mensagem" }. Objeto vazio = tudo válido.
*/

export function validateTask(values) {
  const errors = {};
  const title = (values.title ?? '').trim();

  if (!title) errors.title = 'Informe um título para a tarefa.';
  else if (title.length < 3) errors.title = 'O título precisa ter pelo menos 3 caracteres.';
  else if (title.length > 80) errors.title = 'O título pode ter no máximo 80 caracteres.';

  if ((values.description ?? '').length > 500) {
    errors.description = 'A descrição pode ter no máximo 500 caracteres.';
  }

  if ((values.category ?? '').trim().length > 24) {
    errors.category = 'A categoria pode ter no máximo 24 caracteres.';
  }

  if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    errors.dueDate = 'Data inválida.';
  }

  if (values.dueTime && !values.dueDate) {
    errors.dueTime = 'Escolha uma data para usar um horário.';
  }

  return errors;
}
