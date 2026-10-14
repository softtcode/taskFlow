/*
  taskSelectors.js — funções PURAS que respondem perguntas sobre uma lista de tarefas:
  "quais estão atrasadas?", "quantas foram concluídas?", "como ordenar?"...
  Não alteram nada e não tocam no DOM, por isso são fáceis de entender e de testar.
*/
import { DEFAULT_CATEGORIES, PRIORITIES, PRIORITY_ORDER } from '../config/constants.js';
import { addDays, fromDateKey, startOfDay, toDateKey, todayKey, WEEKDAYS_SHORT } from '../utils/date.js';
import { normalizeText } from '../utils/dom.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------------ prazos */

/** Momento exato do vencimento (em ms), ou null se a tarefa não tem prazo. Sem horário = fim do dia. */
export function dueTimestamp(task) {
  if (!task.dueDate) return null;
  const [year, month, day] = task.dueDate.split('-').map(Number);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0).getTime();
  }
  return new Date(year, month - 1, day, 23, 59, 59).getTime();
}

export function isOverdue(task, now = Date.now()) {
  if (task.status === 'done') return false;
  const due = dueTimestamp(task);
  return due !== null && due < now;
}

/** Vence nas próximas `hours` horas (e ainda não passou). */
export function isDueSoon(task, now = Date.now(), hours = 48) {
  if (task.status === 'done') return false;
  const due = dueTimestamp(task);
  return due !== null && due >= now && due - now <= hours * HOUR;
}

/* ------------------------------------------------------------------ filtros e ordenação */

export function applyFilters(tasks, filters, { showCompleted = true } = {}) {
  const query = normalizeText(filters.search.trim());
  const today = todayKey();
  const weekEnd = toDateKey(addDays(new Date(), 6));
  const now = Date.now();

  return tasks.filter((task) => {
    if (query && !normalizeText(task.title).includes(query)) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;

    if (filters.status === 'pending') {
      if (task.status === 'done') return false;
    } else if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Preferência "mostrar concluídas" — mas se o usuário filtrou por concluídas, respeitamos o filtro.
    if (!showCompleted && task.status === 'done' && filters.status !== 'done') return false;

    switch (filters.date) {
      case 'today': return task.dueDate === today;
      case 'week': return Boolean(task.dueDate) && task.dueDate >= today && task.dueDate <= weekEnd;
      case 'overdue': return isOverdue(task, now);
      case 'none': return !task.dueDate;
      default: return true;
    }
  });
}

const weight = (task) => PRIORITIES[task.priority]?.weight ?? 0;
const doneLast = (a, b) => Number(a.status === 'done') - Number(b.status === 'done');

function compareDue(a, b) {
  const dueA = dueTimestamp(a);
  const dueB = dueTimestamp(b);
  if (dueA === dueB) return 0;
  if (dueA === null) return 1; // sem prazo vai para o fim
  if (dueB === null) return -1;
  return dueA - dueB;
}

/** sortBy: 'urgency' | 'due' | 'created'. Devolve uma cópia ordenada (não altera o original). */
export function sortTasks(tasks, sortBy) {
  const list = [...tasks];
  switch (sortBy) {
    case 'due':
      return list.sort((a, b) => doneLast(a, b) || compareDue(a, b) || weight(b) - weight(a));
    case 'created':
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    default: // urgência: prioridade mais alta primeiro; empate = prazo mais próximo
      return list.sort((a, b) => doneLast(a, b) || weight(b) - weight(a) || compareDue(a, b));
  }
}

/* ------------------------------------------------------------------ categorias */

/** Lista de categorias. Com includeDefaults, soma as categorias sugeridas (usado no formulário). */
export function getCategoryList(tasks, { includeDefaults = false } = {}) {
  const set = new Set(tasks.map((task) => task.category).filter(Boolean));
  if (includeDefaults) DEFAULT_CATEGORIES.forEach((category) => set.add(category));
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/* ------------------------------------------------------------------ números para dashboard e estatísticas */

export function computeSummary(tasks) {
  const now = Date.now();
  const today = todayKey();
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'done').length;
  const todayTasks = tasks.filter((task) => task.dueDate === today);
  const todayDone = todayTasks.filter((task) => task.status === 'done').length;

  return {
    total,
    done,
    pending: total - done,
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
    today: todayTasks.length,
    todayDone,
    todayPending: todayTasks.length - todayDone,
    completionRate: total ? Math.round((done / total) * 100) : 0,
  };
}

export function priorityDistribution(tasks) {
  return PRIORITY_ORDER.map((id) => ({
    id,
    label: PRIORITIES[id].label,
    hex: PRIORITIES[id].hex,
    dot: PRIORITIES[id].dot,
    count: tasks.filter((task) => task.priority === id).length,
  }));
}

export function statusDistribution(tasks) {
  return {
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };
}

/** Por categoria: total e concluídas, da maior para a menor. */
export function categoryBreakdown(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    const name = task.category || 'Geral';
    const entry = map.get(name) ?? { name, total: 0, done: 0 };
    entry.total += 1;
    if (task.status === 'done') entry.done += 1;
    map.set(name, entry);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Atividade dos últimos `days` dias: quantas tarefas foram criadas e concluídas em cada dia. */
export function lastDaysActivity(tasks, days = 7) {
  const base = startOfDay(new Date());
  const keys = Array.from({ length: days }, (_, i) => toDateKey(addDays(base, i - (days - 1))));
  const created = Object.fromEntries(keys.map((key) => [key, 0]));
  const completed = Object.fromEntries(keys.map((key) => [key, 0]));

  tasks.forEach((task) => {
    const createdKey = toDateKey(new Date(task.createdAt));
    if (createdKey in created) created[createdKey] += 1;
    if (task.completedAt) {
      const completedKey = toDateKey(new Date(task.completedAt));
      if (completedKey in completed) completed[completedKey] += 1;
    }
  });

  return keys.map((key, index) => ({
    key,
    label: WEEKDAYS_SHORT[fromDateKey(key).getDay()],
    created: created[key],
    completed: completed[key],
    isToday: index === days - 1,
  }));
}

/** Concluídas nos últimos 7 dias comparado com os 7 dias anteriores. */
export function weekTrend(tasks) {
  const startCurrent = addDays(startOfDay(new Date()), -6).getTime();
  const startPrevious = startCurrent - 7 * DAY;
  let current = 0;
  let previous = 0;
  tasks.forEach((task) => {
    if (!task.completedAt) return;
    const time = new Date(task.completedAt).getTime();
    if (time >= startCurrent) current += 1;
    else if (time >= startPrevious) previous += 1;
  });
  return { current, previous };
}

/** Mapa "AAAA-MM-DD" → tarefas daquele dia, ordenadas por horário e prioridade (usado no calendário). */
export function tasksByDate(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    if (!task.dueDate) return;
    if (!map.has(task.dueDate)) map.set(task.dueDate, []);
    map.get(task.dueDate).push(task);
  });
  map.forEach((list) => {
    list.sort((a, b) => {
      const timeA = a.dueTime ?? '';
      const timeB = b.dueTime ?? '';
      return timeA.localeCompare(timeB) || weight(b) - weight(a);
    });
  });
  return map;
}
