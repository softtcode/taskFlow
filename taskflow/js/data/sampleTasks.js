/*
  sampleTasks.js — tarefas de exemplo para o primeiro acesso.
  As datas são RELATIVAS a hoje (offset em dias), então o app sempre parece "vivo":
  há tarefas para hoje, atrasadas, futuras e concluídas nos últimos dias (para os gráficos).
*/
import { addDays, toDateKey } from '../utils/date.js';
import { generateId } from '../utils/id.js';

export function buildSampleTasks() {
  const today = new Date();
  const dateKey = (offset) => toDateKey(addDays(today, offset));
  const isoAt = (offset, hour) => {
    const date = addDays(today, offset);
    date.setHours(hour, 15, 0, 0);
    return date.toISOString();
  };

  // [título, descrição, prioridade, status, categoria, prazo(dias), horário, criada(dias), concluída(dias)]
  const rows = [
    ['Finalizar relatório trimestral', 'Consolidar os números de vendas e revisar os gráficos antes do envio.', 'urgent', 'doing', 'Trabalho', 0, '17:00', -4, null],
    ['Enviar proposta comercial ao cliente', 'Revisar valores e anexar o portfólio atualizado.', 'urgent', 'todo', 'Trabalho', -1, '12:00', -5, null],
    ['Reunião de alinhamento semanal', 'Pauta: prioridades da semana e bloqueios do time.', 'high', 'todo', 'Trabalho', 0, '15:30', -2, null],
    ['Pagar fatura do cartão', '', 'high', 'todo', 'Finanças', 1, null, -3, null],
    ['Estudar módulos ES do JavaScript', 'Import/export, organização de pastas e módulos dinâmicos.', 'medium', 'doing', 'Estudos', 2, '20:00', -6, null],
    ['Comprar presente de aniversário', 'Ver opções até sexta-feira.', 'medium', 'todo', 'Pessoal', -2, null, -7, null],
    ['Agendar consulta de rotina', '', 'low', 'todo', 'Saúde', 5, null, -1, null],
    ['Planejar viagem de fim de ano', 'Pesquisar passagens e hospedagem.', 'low', 'todo', 'Pessoal', 12, null, 0, null],
    ['Treino de força', '', 'medium', 'done', 'Saúde', 0, '07:00', -3, 0],
    ['Revisar pull requests pendentes', '', 'medium', 'done', 'Trabalho', -1, null, -3, -1],
    ['Fazer backup dos arquivos', '', 'low', 'done', 'Pessoal', -1, null, -2, -1],
    ['Organizar planilha de gastos', '', 'low', 'done', 'Finanças', -2, null, -5, -2],
    ['Ligar para o contador', '', 'high', 'done', 'Finanças', -3, '16:00', -6, -3],
    ['Atualizar portfólio online', '', 'medium', 'done', 'Estudos', -4, null, -6, -4],
    ['Renovar assinatura do software', '', 'medium', 'done', 'Trabalho', -8, null, -10, -8],
    ['Responder e-mails acumulados', '', 'low', 'done', 'Trabalho', -9, null, -11, -9],
  ];

  return rows.map(([title, description, priority, status, category, due, dueTime, created, completed]) => ({
    id: generateId(),
    title,
    description,
    priority,
    status,
    category,
    dueDate: dateKey(due),
    dueTime,
    createdAt: isoAt(created, 9),
    completedAt: completed === null ? null : isoAt(completed, 18),
  }));
}
