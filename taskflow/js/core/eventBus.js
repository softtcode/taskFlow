/*
  eventBus.js — um "quadro de avisos" muito simples (padrão pub/sub).

  Em vez de cada módulo chamar diretamente os outros, quem muda algo AVISA ("emit") e
  quem se interessa OUVE ("on"). Exemplo: taskService avisa "tasks:changed" e o roteador
  re-renderiza a tela atual. Nenhum dos dois conhece o outro.
*/

export const EVENTS = {
  TASKS_CHANGED: 'tasks:changed',
  SETTINGS_CHANGED: 'settings:changed',
  FILTERS_CHANGED: 'filters:changed',
  ROUTE_CHANGED: 'route:changed',
};

const listeners = new Map();

export const bus = {
  /** Registra um ouvinte. Devolve uma função que cancela o registro. */
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event)?.delete(handler);
  },

  emit(event, payload) {
    listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Erro em um ouvinte de "${event}"`, error);
      }
    });
  },
};
