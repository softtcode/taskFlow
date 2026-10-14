/*
  taskService.js — as REGRAS DE NEGÓCIO das tarefas e a "memória" da aplicação.

  - Mantém a lista de tarefas em memória (`tasks`) para as telas lerem rapidamente.
  - Para gravar, chama js/storage/taskStorage.js (localStorage do navegador).
  - Depois de qualquer mudança, avisa todo mundo com o evento "tasks:changed".

  As telas NUNCA mexem em `tasks` diretamente: sempre passam por estas funções.
*/
import { taskStorage } from '../storage/taskStorage.js';
import { PRIORITIES, STATUSES } from '../config/constants.js';
import { buildSampleTasks } from '../data/sampleTasks.js';
import { generateId } from '../utils/id.js';
import { bus, EVENTS } from '../core/eventBus.js';

let tasks = [];

const notify = () => bus.emit(EVENTS.TASKS_CHANGED, { tasks });

/* ------------------------------------------------------------ leitura */

export const getTasks = () => tasks;
export const getTask = (id) => tasks.find((task) => task.id === id);

/* ------------------------------------------------------------ carregamento */

/** Carrega as tarefas ao abrir o app. No primeiro acesso, grava os exemplos. */
export async function loadTasks() {
  const stored = await taskStorage.list();
  tasks = stored ?? (await taskStorage.replaceAll(buildSampleTasks()));
  notify();
}

/* ------------------------------------------------------------ regras */

/** Limpa e completa os dados vindos do formulário. */
function normalize(values) {
  return {
    title: values.title.trim(),
    description: (values.description ?? '').trim(),
    priority: values.priority,
    status: values.status,
    category: (values.category ?? '').trim() || 'Geral',
    dueDate: values.dueDate || null,
    dueTime: values.dueDate ? values.dueTime || null : null,
  };
}

/** Regra: ao concluir, registra a data de conclusão; ao reabrir, apaga. */
function applyStatusRules(previous, patch) {
  if (!('status' in patch) || patch.status === previous.status) return patch;
  if (patch.status === 'done') return { ...patch, completedAt: new Date().toISOString() };
  if (previous.status === 'done') return { ...patch, completedAt: null };
  return patch;
}

/* ------------------------------------------------------------ escrita */

export async function createTask(values) {
  const data = normalize(values);
  const task = await taskStorage.create({
    ...data,
    completedAt: data.status === 'done' ? new Date().toISOString() : null,
  });
  tasks = [...tasks, task];
  notify();
  return task;
}

/** `patch` pode ter só alguns campos: updateTask(id, { priority: 'high' }) */
export async function updateTask(id, patch) {
  const previous = getTask(id);
  if (!previous) throw new Error('Tarefa não encontrada.');
  const cleanPatch = 'title' in patch ? normalize({ ...previous, ...patch }) : patch;
  const updated = await taskStorage.update(id, applyStatusRules(previous, cleanPatch));
  tasks = tasks.map((task) => (task.id === id ? updated : task));
  notify();
  return updated;
}

export async function deleteTask(id) {
  await taskStorage.remove(id);
  tasks = tasks.filter((task) => task.id !== id);
  notify();
}

export const setStatus = (id, status) => updateTask(id, { status });
export const reopenTask = (id) => updateTask(id, { status: 'todo' });
export const moveToDate = (id, dueDate) => updateTask(id, { dueDate });

/** Alterna concluída/pendente (o checkbox do card). */
export function toggleDone(id) {
  return getTask(id)?.status === 'done' ? reopenTask(id) : setStatus(id, 'done');
}

/* ------------------------------------------------------------ dados */

export async function clearTasks() {
  tasks = await taskStorage.replaceAll([]);
  notify();
}

/** Adiciona as tarefas de exemplo às que já existem. */
export async function addSampleTasks() {
  tasks = await taskStorage.replaceAll([...tasks, ...buildSampleTasks()]);
  notify();
}

/* ------------------------------------------------------------ importação de backup */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const isIso = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

/**
 * Valida e corrige as tarefas de um arquivo importado. Nunca confie em arquivo de fora:
 * campos inválidos viram valores padrão e itens sem título são descartados.
 */
export function sanitizeImportedTasks(list) {
  if (!Array.isArray(list)) throw new Error('O arquivo não contém uma lista de tarefas.');

  return list
    .filter((item) => item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim())
    .map((item) => {
      const status = item.status in STATUSES ? item.status : 'todo';
      const dueDate = DATE_PATTERN.test(item.dueDate ?? '') ? item.dueDate : null;
      return {
        id: typeof item.id === 'string' && item.id ? item.id : generateId(),
        title: item.title.trim().slice(0, 80),
        description: String(item.description ?? '').slice(0, 500),
        priority: item.priority in PRIORITIES ? item.priority : 'medium',
        status,
        category: String(item.category ?? '').trim().slice(0, 24) || 'Geral',
        dueDate,
        dueTime: dueDate && TIME_PATTERN.test(item.dueTime ?? '') ? item.dueTime : null,
        createdAt: isIso(item.createdAt) ? item.createdAt : new Date().toISOString(),
        completedAt: status === 'done' ? (isIso(item.completedAt) ? item.completedAt : new Date().toISOString()) : null,
      };
    });
}

/** Substitui TODAS as tarefas pelas de um backup. Devolve quantas foram importadas. */
export async function importTasks(list) {
  const clean = sanitizeImportedTasks(list);
  tasks = await taskStorage.replaceAll(clean);
  notify();
  return clean.length;
}
