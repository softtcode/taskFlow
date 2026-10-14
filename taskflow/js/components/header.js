/*
  header.js — título da página, busca global, tema e botão "Nova tarefa".
  (O HTML do header está no index.html; aqui só ligamos o comportamento.)
*/
import { bus, EVENTS } from '../core/eventBus.js';
import { getCurrentViewId, navigate } from '../core/router.js';
import { toggleTheme } from '../core/theme.js';
import { setFilters, uiState } from '../state/uiState.js';
import { $, debounce } from '../utils/dom.js';
import { openTaskForm } from './taskForm.js';

export function initHeader() {
  const title = $('#page-title');
  const search = $('#global-search');

  bus.on(EVENTS.ROUTE_CHANGED, ({ title: pageTitle }) => {
    title.textContent = pageTitle;
  });

  // Digitar na busca filtra as tarefas pelo nome e leva o usuário para a lista.
  const applySearch = debounce((value) => {
    setFilters({ search: value });
    if (value && getCurrentViewId() !== 'tasks') navigate('tasks');
  }, 200);

  search.addEventListener('input', (event) => applySearch(event.target.value));
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearSearch();
  });
  $('#search-clear').addEventListener('click', () => {
    clearSearch();
    search.focus();
  });

  function clearSearch() {
    search.value = '';
    setFilters({ search: '' });
  }

  // Mantém o campo sincronizado quando os filtros são limpos em outro lugar.
  bus.on(EVENTS.FILTERS_CHANGED, () => {
    if (search.value.trim() !== uiState.filters.search.trim()) search.value = uiState.filters.search;
  });

  $('#new-task-btn').addEventListener('click', () => openTaskForm());
  $('#theme-toggle').addEventListener('click', toggleTheme);
}
