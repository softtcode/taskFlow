/*
  notificationService.js — lembretes de vencimento.

  A cada 30 segundos, procura tarefas pendentes cujo prazo está chegando (conforme a antecedência
  escolhida em Configurações) e avisa com um toast e, se permitido, com uma notificação do navegador.
  Cada tarefa é avisada uma única vez por prazo (o registro fica no localStorage).
*/
import { getSettings } from './settingsService.js';
import { getTasks } from './taskService.js';
import { dueTimestamp } from './taskSelectors.js';
import { toast } from '../components/toast.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { formatDueLabel } from '../utils/format.js';

const KEY = 'notified';
const CHECK_INTERVAL_MS = 30_000;
const MINUTE = 60_000;

/** Janela em que o lembrete vale: [início, fim]. Tarefa sem horário avisa às 9h do dia. */
function reminderWindow(task, leadMinutes) {
  const due = dueTimestamp(task);
  if (task.dueTime) return [due - leadMinutes * MINUTE, due + 5 * MINUTE];
  const [year, month, day] = task.dueDate.split('-').map(Number);
  return [new Date(year, month - 1, day, 9, 0).getTime(), due];
}

function checkReminders() {
  const settings = getSettings();
  if (!settings.notifyEnabled) return;

  const now = Date.now();
  const notified = readJSON(KEY, {}) ?? {};
  const due = [];

  getTasks().forEach((task) => {
    if (task.status === 'done' || !task.dueDate) return;
    const [start, end] = reminderWindow(task, settings.notifyLeadMinutes);
    if (now < start || now > end) return;

    const marker = `${task.dueDate}T${task.dueTime ?? ''}`;
    if (notified[task.id] === marker) return;
    notified[task.id] = marker;
    due.push(task);
  });

  if (!due.length) return;
  try { writeJSON(KEY, notified); } catch { /* sem espaço: apenas segue */ }

  if (due.length > 3) {
    toast.info(`${due.length} tarefas estão perto do vencimento.`);
  } else {
    due.forEach((task) => toast.info(`Lembrete: "${task.title}" vence ${formatDueLabel(task).toLowerCase()}.`));
  }

  if (settings.notifyBrowser && 'Notification' in window && Notification.permission === 'granted') {
    due.slice(0, 3).forEach((task) => {
      new Notification('TaskFlow', { body: `"${task.title}" vence ${formatDueLabel(task).toLowerCase()}.` });
    });
  }
}

export function initNotifications() {
  checkReminders();
  setInterval(checkReminders, CHECK_INTERVAL_MS);
}

/** Pede permissão para notificações do sistema. Devolve true se concedida. */
export async function enableBrowserNotifications() {
  if (!('Notification' in window)) {
    toast.error('Este navegador não suporta notificações do sistema.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    toast.error('As notificações estão bloqueadas. Libere nas permissões do site no navegador.');
    return false;
  }
  return (await Notification.requestPermission()) === 'granted';
}
