/*
  uiState.js — estado temporário da interface (filtros e ordenação da lista de tarefas).
  Não é salvo: ao recarregar a página, os filtros voltam ao padrão.
  Vive aqui (e não dentro da tela) porque várias partes mexem nele: a busca do header,
  os cards do dashboard e a própria tela de tarefas.
*/
import { DEFAULT_FILTERS } from '../config/constants.js';
import { bus, EVENTS } from '../core/eventBus.js';

export const uiState = {
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'urgency',
};

export function setFilters(patch) {
  uiState.filters = { ...uiState.filters, ...patch };
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

export function resetFilters() {
  uiState.filters = { ...DEFAULT_FILTERS };
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

export function setSortBy(sortBy) {
  uiState.sortBy = sortBy;
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

/** true se algum filtro (inclusive a busca) está diferente do padrão. */
export function hasActiveFilters() {
  return Object.keys(DEFAULT_FILTERS).some((key) => uiState.filters[key] !== DEFAULT_FILTERS[key]);
}
