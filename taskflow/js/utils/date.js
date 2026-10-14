/*
  date.js — funções de data SEM dependências.

  DECISÃO DE DESIGN: datas de vencimento são guardadas como texto "AAAA-MM-DD" (chave do dia)
  e o horário como "HH:mm". Assim não existe problema de fuso horário e agrupar tarefas por dia
  (calendário) vira uma simples comparação de textos.
*/

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const pad = (n) => String(n).padStart(2, '0');

/** Date → "2026-10-11" (no fuso local) */
export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "2026-10-11" → Date (meia-noite local) */
export function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const todayKey = () => toDateKey(new Date());
export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

/** Soma meses mantendo o dia (ex.: 31/jan + 1 mês = 28/fev, nunca "pula" para março). */
export function addMonths(date, amount) {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export const isSameDay = (a, b) => toDateKey(a) === toDateKey(b);

/** Primeiro dia da semana que contém `date`. weekStart: 0 = domingo, 1 = segunda. */
export function startOfWeek(date, weekStart = 0) {
  const diff = (date.getDay() - weekStart + 7) % 7;
  return addDays(date, -diff);
}

export function getWeekDays(date, weekStart = 0) {
  const start = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Todos os dias exibidos na grade do mês (inclui dias do mês anterior/seguinte para fechar as semanas). */
export function getMonthGrid(date, weekStart = 0) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => addDays(first, i - offset));
}

/** Nomes dos dias da semana na ordem correta para o primeiro dia escolhido. */
export function getWeekdayLabels(weekStart = 0) {
  return Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(weekStart + i) % 7]);
}
