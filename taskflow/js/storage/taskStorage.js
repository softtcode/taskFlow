/*
  taskStorage.js — ÚNICO lugar que sabe ONDE as tarefas são guardadas.

  Tudo fica no armazenamento do próprio navegador (localStorage), neste computador e neste
  perfil do navegador. Não existe banco de dados nem servidor: o app funciona offline e
  pode ser aberto direto do arquivo index.html.

  Atenção: se o usuário limpar os "dados do site" do navegador, as tarefas somem.
  Por isso há "Exportar" e "Importar" em Configurações (backup em arquivo JSON).

  As funções são assíncronas (devolvem Promise) por hábito de projeto: se um dia você
  quiser guardar em outro lugar (IndexedDB, um serviço na nuvem...), só este arquivo muda.

  Modelo de uma tarefa:
    { id, title, description, createdAt (ISO), dueDate ("AAAA-MM-DD" | null),
      dueTime ("HH:mm" | null), priority, status, category, completedAt (ISO | null) }
*/
import { readJSON, writeJSON } from '../utils/storage.js';
import { generateId } from '../utils/id.js';

const KEY = 'tasks';

const readAll = () => {
  const stored = readJSON(KEY, null);
  return Array.isArray(stored) ? stored : null;
};

export const taskStorage = {
  /** Devolve a lista de tarefas, ou null se o usuário nunca salvou nada (primeiro acesso). */
  async list() {
    return readAll();
  },

  /** Cria uma tarefa, gerando id e data de criação. */
  async create(data) {
    const task = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    writeJSON(KEY, [...(readAll() ?? []), task]);
    return task;
  },

  /** Atualiza campos de uma tarefa existente e devolve a tarefa completa. */
  async update(id, patch) {
    const tasks = readAll() ?? [];
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) throw new Error('Tarefa não encontrada.');
    const updated = { ...tasks[index], ...patch, id };
    tasks[index] = updated;
    writeJSON(KEY, tasks);
    return updated;
  },

  async remove(id) {
    writeJSON(KEY, (readAll() ?? []).filter((task) => task.id !== id));
  },

  /** Substitui tudo de uma vez (exemplos, importação de backup e "apagar tudo"). */
  async replaceAll(tasks) {
    writeJSON(KEY, tasks);
    return tasks;
  },
};

/** O navegador permite gravar dados? (falha em alguns modos privativos ou com cookies bloqueados) */
export function isStorageAvailable() {
  try {
    const probe = '__taskflow_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
