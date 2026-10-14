/*
  format.js — transforma datas e horas em texto para a tela,
  respeitando as preferências do usuário (formato de data e de hora).
*/
import { getSettings } from '../services/settingsService.js';
import { addDays, pad, toDateKey, todayKey } from './date.js';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const longDateYear = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayMonthShort = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const monthLong = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

/** "2026-10-11" → "11/10/2026" (ou outro formato escolhido nas configurações) */
export function formatDateKey(key) {
  if (!key) return '';
  const [year, month, day] = key.split('-');
  switch (getSettings().dateFormat) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return key;
    default: return `${day}/${month}/${year}`;
  }
}

/** "14:30" → "14:30" (24h) ou "2:30 PM" (12h) */
export function formatTime(time) {
  if (!time) return '';
  if (getSettings().timeFormat !== '12h') return time;
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Texto do prazo de uma tarefa: "Hoje, 14:30", "Amanhã", "Ontem", "11/10/2026"... */
export function formatDueLabel(task) {
  if (!task.dueDate) return 'Sem prazo';
  const now = new Date();
  let day;
  if (task.dueDate === todayKey()) day = 'Hoje';
  else if (task.dueDate === toDateKey(addDays(now, 1))) day = 'Amanhã';
  else if (task.dueDate === toDateKey(addDays(now, -1))) day = 'Ontem';
  else day = formatDateKey(task.dueDate);
  return task.dueTime ? `${day}, ${formatTime(task.dueTime)}` : day;
}

/** Data de criação (ISO) → "11/10/2026 às 14:30" */
export function formatCreatedAt(iso) {
  const date = new Date(iso);
  return `${formatDateKey(toDateKey(date))} às ${formatTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`)}`;
}

/** "Domingo, 11 de outubro" (com withYear: "Domingo, 11 de outubro de 2026") */
export const formatLongDate = (date, withYear = false) => capitalize((withYear ? longDateYear : longDate).format(date));

/** "Outubro de 2026" */
export const formatMonthYear = (date) => capitalize(monthYear.format(date));

/** "11 – 17 de outubro de 2026" ou "28 de set. – 4 de out. de 2026" */
export function formatWeekRange(start, end) {
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} de ${monthLong.format(end)} de ${end.getFullYear()}`;
  }
  return `${dayMonthShort.format(start)} – ${dayMonthShort.format(end)} de ${end.getFullYear()}`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
