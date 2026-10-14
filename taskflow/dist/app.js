/*
  ARQUIVO GERADO por build.mjs — NÃO EDITE AQUI.
  Edite os módulos em js/ e rode:  node build.mjs
*/
(function () {
'use strict';
const __modules = {};

/* ===== core/eventBus.js ===== */
__modules["core/eventBus.js"] = (function () {
/*
  eventBus.js — um "quadro de avisos" muito simples (padrão pub/sub).

  Em vez de cada módulo chamar diretamente os outros, quem muda algo AVISA ("emit") e
  quem se interessa OUVE ("on"). Exemplo: taskService avisa "tasks:changed" e o roteador
  re-renderiza a tela atual. Nenhum dos dois conhece o outro.
*/

const EVENTS = {
  TASKS_CHANGED: 'tasks:changed',
  SETTINGS_CHANGED: 'settings:changed',
  FILTERS_CHANGED: 'filters:changed',
  ROUTE_CHANGED: 'route:changed',
};

const listeners = new Map();

const bus = {
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
return { EVENTS, bus };
})();

/* ===== utils/dom.js ===== */
__modules["utils/dom.js"] = (function () {
/*
  dom.js — utilitários de DOM usados por todas as telas.
*/

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapa texto digitado pelo usuário antes de colocá-lo em um template HTML.
 * REGRA DE OURO: todo dado do usuário (título, descrição, categoria...) passa por esc().
 * Sem isso, alguém poderia salvar uma tarefa chamada "<img onerror=...>" e executar código.
 */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Atrasa a execução até o usuário parar de digitar (usado na busca). */
function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Troca o HTML de um container PRESERVANDO o foco do teclado.
 * Como as telas re-renderizam inteiras, sem isso quem navega por teclado perderia o foco
 * a cada clique. Para o foco sobreviver, marque o elemento com data-focus-key="nome-unico".
 */
function patchHtml(root, html) {
  const active = document.activeElement;
  const focusKey = root.contains(active) ? active.dataset?.focusKey : undefined;
  root.innerHTML = html;
  if (focusKey) {
    root.querySelector(`[data-focus-key="${focusKey}"]`)?.focus({ preventScroll: true });
  }
}

const plural = (n, singular, pluralForm) => `${n} ${n === 1 ? singular : pluralForm}`;

/** Remove acentos e põe em minúsculas — para a busca ignorar "Reunião" vs "reuniao". */
function normalizeText(text) {
  return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Dispara o download de um arquivo gerado no navegador. */
function downloadFile(filename, content, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
return { $, $$, esc, debounce, patchHtml, plural, normalizeText, downloadFile };
})();

/* ===== config/constants.js ===== */
__modules["config/constants.js"] = (function () {
/*
  constants.js — tudo que é "configuração" da aplicação fica aqui.
  Quer mudar um nome, uma cor de prioridade ou uma opção? Comece por este arquivo.

  IMPORTANTE (Tailwind): as classes abaixo são escritas por extenso de propósito.
  O Tailwind só gera o CSS das classes que ele consegue "ler" no código. Se você montasse
  `bg-${cor}-500` dinamicamente, a classe não seria gerada em um build de produção.
*/

const APP_NAME = 'TaskFlow';

/** Prefixo das chaves no localStorage. Se mudar o formato dos dados, aumente a versão (v2). */
const STORAGE_PREFIX = 'taskflow:v1:';

/* ---------------- Prioridades ---------------- */
const PRIORITIES = {
  urgent: {
    id: 'urgent', label: 'Urgente', weight: 4, hex: '#ef4444',
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300',
    chip: 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100',
  },
  high: {
    id: 'high', label: 'Alta', weight: 3, hex: '#f97316',
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-700 ring-orange-500/25 dark:text-orange-300',
    chip: 'border-orange-500 bg-orange-500/10 text-orange-900 dark:text-orange-100',
  },
  medium: {
    id: 'medium', label: 'Média', weight: 2, hex: '#eab308',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/25 dark:text-yellow-300',
    chip: 'border-yellow-500 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100',
  },
  low: {
    id: 'low', label: 'Baixa', weight: 1, hex: '#22c55e',
    dot: 'bg-green-500',
    badge: 'bg-green-500/10 text-green-700 ring-green-500/25 dark:text-green-300',
    chip: 'border-green-500 bg-green-500/10 text-green-900 dark:text-green-100',
  },
};
/** Ordem de exibição (da mais importante para a menos importante). */
const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];

/* ---------------- Status (colunas do Kanban) ---------------- */
const STATUSES = {
  todo: { id: 'todo', label: 'A fazer', dot: 'bg-slate-400' },
  doing: { id: 'doing', label: 'Em andamento', dot: 'bg-blue-500' },
  done: { id: 'done', label: 'Concluído', dot: 'bg-emerald-500' },
};
const STATUS_ORDER = ['todo', 'doing', 'done'];

const DEFAULT_CATEGORIES = ['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Finanças'];

/* ---------------- Filtros e ordenação (tela "Minhas tarefas") ---------------- */
const DEFAULT_FILTERS = { search: '', priority: 'all', status: 'all', category: 'all', date: 'all' };

const STATUS_FILTERS = {
  all: 'Todos',
  pending: 'Pendentes',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluídas',
};

const DATE_FILTERS = {
  all: 'Qualquer data',
  today: 'Hoje',
  week: 'Próximos 7 dias',
  overdue: 'Atrasadas',
  none: 'Sem prazo',
};

const SORT_OPTIONS = {
  urgency: 'Urgência',
  due: 'Vencimento',
  created: 'Criação (mais recentes)',
};

const LAYOUTS = {
  list: { label: 'Lista', icon: 'list' },
  cards: { label: 'Cards', icon: 'layout-grid' },
  kanban: { label: 'Kanban', icon: 'kanban' },
};

/* ---------------- Cores de destaque ----------------
   base  = cor usada em botões e fundos
   light = versão mais clara usada para texto no modo escuro (melhor contraste) */
const ACCENT_COLORS = [
  { id: 'indigo', label: 'Índigo', base: '79 70 229', light: '129 140 248' },
  { id: 'violet', label: 'Violeta', base: '124 58 237', light: '167 139 250' },
  { id: 'blue', label: 'Azul', base: '37 99 235', light: '96 165 250' },
  { id: 'emerald', label: 'Esmeralda', base: '5 150 105', light: '52 211 153' },
  { id: 'rose', label: 'Rosa', base: '225 29 72', light: '251 113 133' },
  { id: 'orange', label: 'Laranja', base: '234 88 12', light: '251 146 60' },
];

/* ---------------- Preferências padrão do usuário ---------------- */
const DEFAULT_SETTINGS = {
  theme: 'system',          // 'light' | 'dark' | 'system'
  accent: 'indigo',         // id de ACCENT_COLORS
  userName: '',
  taskLayout: 'list',       // 'list' | 'cards' | 'kanban'
  showCompleted: true,      // mostrar concluídas em lista/cards
  showDescriptions: true,
  weekStart: 0,             // 0 = domingo, 1 = segunda
  sidebarCollapsed: false,
  dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '24h',        // '24h' | '12h'
  notifyEnabled: true,      // lembretes dentro do app
  notifyBrowser: false,     // notificações do sistema (precisa de permissão)
  notifyLeadMinutes: 30,    // antecedência do lembrete
};
return { APP_NAME, STORAGE_PREFIX, PRIORITIES, PRIORITY_ORDER, STATUSES, STATUS_ORDER, DEFAULT_CATEGORIES, DEFAULT_FILTERS, STATUS_FILTERS, DATE_FILTERS, SORT_OPTIONS, LAYOUTS, ACCENT_COLORS, DEFAULT_SETTINGS };
})();

/* ===== core/router.js ===== */
__modules["core/router.js"] = (function () {
/*
  router.js — alterna entre as seções (telas) da aplicação.

  Como funciona:
    1. cada tela é uma <section id="view-<id>"> no index.html;
    2. o endereço (#/tasks) diz qual tela mostrar — por isso o botão "voltar" e o F5 funcionam;
    3. ao navegar, escondemos todas as <section> e mostramos só a escolhida (atributo "hidden");
    4. chamamos view.render() para desenhar o conteúdo atualizado.

  Uma "view" é um objeto: { id, title, mount(section), render() }
    mount()  roda UMA vez (cria os ouvintes de clique)
    render() roda sempre que a tela aparece ou os dados mudam
*/
const { $ } = __modules["utils/dom.js"];
const { APP_NAME } = __modules["config/constants.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];

const views = new Map(); // id → { view, section }
let currentId = null;

function registerView(view) {
  const section = document.getElementById(`view-${view.id}`);
  if (!section) throw new Error(`Falta <section id="view-${view.id}"> no index.html`);
  views.set(view.id, { view, section });
  view.mount(section);
}

const getCurrentViewId = () => currentId;

/** Vai para uma tela: navigate('tasks') */
function navigate(id) {
  if (location.hash === `#/${id}`) show(id);
  else location.hash = `#/${id}`;
}

function resolveRoute() {
  const id = location.hash.replace(/^#\/?/, '');
  return views.has(id) ? id : 'dashboard';
}

function show(id) {
  const { view, section } = views.get(id);

  views.forEach((entry, key) => {
    entry.section.hidden = key !== id;
  });

  // Reinicia a animação de entrada
  section.classList.remove('view-enter');
  void section.offsetWidth;
  section.classList.add('view-enter');

  currentId = id;
  view.render();
  document.title = `${view.title} — ${APP_NAME}`;
  $('#main').scrollTo({ top: 0 });
  bus.emit(EVENTS.ROUTE_CHANGED, { id, title: view.title });
}

/** Redesenha a tela atual (chamado quando tarefas ou configurações mudam). */
function rerenderCurrent() {
  if (currentId) views.get(currentId).view.render();
}

function initRouter() {
  window.addEventListener('hashchange', () => show(resolveRoute()));
  bus.on(EVENTS.TASKS_CHANGED, rerenderCurrent);
  bus.on(EVENTS.SETTINGS_CHANGED, rerenderCurrent);
  show(resolveRoute());
}
return { registerView, getCurrentViewId, navigate, initRouter };
})();

/* ===== utils/storage.js ===== */
__modules["utils/storage.js"] = (function () {
/*
  storage.js — pequeno invólucro do localStorage.
  Todas as chaves ganham o prefixo de STORAGE_PREFIX e os valores são guardados como JSON.
*/
const { STORAGE_PREFIX } = __modules["config/constants.js"];

/** Lê uma chave. Se não existir (ou estiver corrompida), devolve `fallback`. */
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Grava uma chave. Pode lançar erro (ex.: armazenamento cheio) — quem chama decide o que fazer. */
function writeJSON(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function removeKey(key) {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
return { readJSON, writeJSON, removeKey };
})();

/* ===== services/settingsService.js ===== */
__modules["services/settingsService.js"] = (function () {
/*
  settingsService.js — preferências do usuário (tema, cor, formatos...).
  Salvas no localStorage a cada mudança, por isso sobrevivem ao recarregar a página.
*/
const { DEFAULT_SETTINGS } = __modules["config/constants.js"];
const { readJSON, writeJSON } = __modules["utils/storage.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];

const KEY = 'settings';

function load() {
  const stored = readJSON(KEY, {});
  // Mesclar com o padrão garante que novas opções adicionadas no futuro tenham valor.
  return { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

let settings = load();

const getSettings = () => settings;

/** Atualiza uma ou mais preferências: updateSettings({ theme: 'dark' }) */
function updateSettings(patch) {
  settings = { ...settings, ...patch };
  try {
    writeJSON(KEY, settings);
  } catch (error) {
    console.warn('Não foi possível salvar as configurações.', error);
  }
  bus.emit(EVENTS.SETTINGS_CHANGED, { settings, patch });
}

function resetSettings() {
  updateSettings({ ...DEFAULT_SETTINGS });
}
return { getSettings, updateSettings, resetSettings };
})();

/* ===== core/theme.js ===== */
__modules["core/theme.js"] = (function () {
/*
  theme.js — aplica o tema (claro/escuro/sistema) e a cor de destaque.

  Como funciona: o tema escuro é a classe "dark" no <html>; a cor de destaque são duas
  variáveis CSS (--accent-base e --accent-light). O resto é feito em css/styles.css.
*/
const { ACCENT_COLORS } = __modules["config/constants.js"];
const { getSettings, updateSettings } = __modules["services/settingsService.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];

const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

/** O tema escuro está ativo agora? (considera a opção "seguir o sistema") */
function isDark() {
  const { theme } = getSettings();
  return theme === 'dark' || (theme === 'system' && systemQuery.matches);
}

function applyTheme() {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark());

  const accent = ACCENT_COLORS.find((color) => color.id === getSettings().accent) ?? ACCENT_COLORS[0];
  root.style.setProperty('--accent-base', accent.base);
  root.style.setProperty('--accent-light', accent.light);
}

/** Botão do header: alterna entre claro e escuro (e sai do modo "sistema"). */
function toggleTheme() {
  updateSettings({ theme: isDark() ? 'light' : 'dark' });
}

function initTheme() {
  applyTheme();
  bus.on(EVENTS.SETTINGS_CHANGED, applyTheme);
  systemQuery.addEventListener('change', applyTheme); // sistema mudou de claro↔escuro
}
return { isDark, applyTheme, toggleTheme, initTheme };
})();

/* ===== state/uiState.js ===== */
__modules["state/uiState.js"] = (function () {
/*
  uiState.js — estado temporário da interface (filtros e ordenação da lista de tarefas).
  Não é salvo: ao recarregar a página, os filtros voltam ao padrão.
  Vive aqui (e não dentro da tela) porque várias partes mexem nele: a busca do header,
  os cards do dashboard e a própria tela de tarefas.
*/
const { DEFAULT_FILTERS } = __modules["config/constants.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];

const uiState = {
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'urgency',
};

function setFilters(patch) {
  uiState.filters = { ...uiState.filters, ...patch };
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

function resetFilters() {
  uiState.filters = { ...DEFAULT_FILTERS };
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

function setSortBy(sortBy) {
  uiState.sortBy = sortBy;
  bus.emit(EVENTS.FILTERS_CHANGED, uiState.filters);
}

/** true se algum filtro (inclusive a busca) está diferente do padrão. */
function hasActiveFilters() {
  return Object.keys(DEFAULT_FILTERS).some((key) => uiState.filters[key] !== DEFAULT_FILTERS[key]);
}
return { uiState, setFilters, resetFilters, setSortBy, hasActiveFilters };
})();

/* ===== utils/id.js ===== */
__modules["utils/id.js"] = (function () {
/** Gera um identificador único. (Com uma API real, o servidor costuma gerar o id.) */
function generateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
return { generateId };
})();

/* ===== storage/taskStorage.js ===== */
__modules["storage/taskStorage.js"] = (function () {
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
const { readJSON, writeJSON } = __modules["utils/storage.js"];
const { generateId } = __modules["utils/id.js"];

const KEY = 'tasks';

const readAll = () => {
  const stored = readJSON(KEY, null);
  return Array.isArray(stored) ? stored : null;
};

const taskStorage = {
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
function isStorageAvailable() {
  try {
    const probe = '__taskflow_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
return { taskStorage, isStorageAvailable };
})();

/* ===== utils/date.js ===== */
__modules["utils/date.js"] = (function () {
/*
  date.js — funções de data SEM dependências.

  DECISÃO DE DESIGN: datas de vencimento são guardadas como texto "AAAA-MM-DD" (chave do dia)
  e o horário como "HH:mm". Assim não existe problema de fuso horário e agrupar tarefas por dia
  (calendário) vira uma simples comparação de textos.
*/

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const pad = (n) => String(n).padStart(2, '0');

/** Date → "2026-10-11" (no fuso local) */
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "2026-10-11" → Date (meia-noite local) */
function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const todayKey = () => toDateKey(new Date());
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

/** Soma meses mantendo o dia (ex.: 31/jan + 1 mês = 28/fev, nunca "pula" para março). */
function addMonths(date, amount) {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

const isSameDay = (a, b) => toDateKey(a) === toDateKey(b);

/** Primeiro dia da semana que contém `date`. weekStart: 0 = domingo, 1 = segunda. */
function startOfWeek(date, weekStart = 0) {
  const diff = (date.getDay() - weekStart + 7) % 7;
  return addDays(date, -diff);
}

function getWeekDays(date, weekStart = 0) {
  const start = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Todos os dias exibidos na grade do mês (inclui dias do mês anterior/seguinte para fechar as semanas). */
function getMonthGrid(date, weekStart = 0) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => addDays(first, i - offset));
}

/** Nomes dos dias da semana na ordem correta para o primeiro dia escolhido. */
function getWeekdayLabels(weekStart = 0) {
  return Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(weekStart + i) % 7]);
}
return { WEEKDAYS_SHORT, pad, toDateKey, fromDateKey, todayKey, startOfDay, addDays, addMonths, isSameDay, startOfWeek, getWeekDays, getMonthGrid, getWeekdayLabels };
})();

/* ===== data/sampleTasks.js ===== */
__modules["data/sampleTasks.js"] = (function () {
/*
  sampleTasks.js — tarefas de exemplo para o primeiro acesso.
  As datas são RELATIVAS a hoje (offset em dias), então o app sempre parece "vivo":
  há tarefas para hoje, atrasadas, futuras e concluídas nos últimos dias (para os gráficos).
*/
const { addDays, toDateKey } = __modules["utils/date.js"];
const { generateId } = __modules["utils/id.js"];

function buildSampleTasks() {
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
return { buildSampleTasks };
})();

/* ===== services/taskService.js ===== */
__modules["services/taskService.js"] = (function () {
/*
  taskService.js — as REGRAS DE NEGÓCIO das tarefas e a "memória" da aplicação.

  - Mantém a lista de tarefas em memória (`tasks`) para as telas lerem rapidamente.
  - Para gravar, chama js/storage/taskStorage.js (localStorage do navegador).
  - Depois de qualquer mudança, avisa todo mundo com o evento "tasks:changed".

  As telas NUNCA mexem em `tasks` diretamente: sempre passam por estas funções.
*/
const { taskStorage } = __modules["storage/taskStorage.js"];
const { PRIORITIES, STATUSES } = __modules["config/constants.js"];
const { buildSampleTasks } = __modules["data/sampleTasks.js"];
const { generateId } = __modules["utils/id.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];

let tasks = [];

const notify = () => bus.emit(EVENTS.TASKS_CHANGED, { tasks });

/* ------------------------------------------------------------ leitura */

const getTasks = () => tasks;
const getTask = (id) => tasks.find((task) => task.id === id);

/* ------------------------------------------------------------ carregamento */

/** Carrega as tarefas ao abrir o app. No primeiro acesso, grava os exemplos. */
async function loadTasks() {
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

async function createTask(values) {
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
async function updateTask(id, patch) {
  const previous = getTask(id);
  if (!previous) throw new Error('Tarefa não encontrada.');
  const cleanPatch = 'title' in patch ? normalize({ ...previous, ...patch }) : patch;
  const updated = await taskStorage.update(id, applyStatusRules(previous, cleanPatch));
  tasks = tasks.map((task) => (task.id === id ? updated : task));
  notify();
  return updated;
}

async function deleteTask(id) {
  await taskStorage.remove(id);
  tasks = tasks.filter((task) => task.id !== id);
  notify();
}

const setStatus = (id, status) => updateTask(id, { status });
const reopenTask = (id) => updateTask(id, { status: 'todo' });
const moveToDate = (id, dueDate) => updateTask(id, { dueDate });

/** Alterna concluída/pendente (o checkbox do card). */
function toggleDone(id) {
  return getTask(id)?.status === 'done' ? reopenTask(id) : setStatus(id, 'done');
}

/* ------------------------------------------------------------ dados */

async function clearTasks() {
  tasks = await taskStorage.replaceAll([]);
  notify();
}

/** Adiciona as tarefas de exemplo às que já existem. */
async function addSampleTasks() {
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
function sanitizeImportedTasks(list) {
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
async function importTasks(list) {
  const clean = sanitizeImportedTasks(list);
  tasks = await taskStorage.replaceAll(clean);
  notify();
  return clean.length;
}
return { getTasks, getTask, loadTasks, createTask, updateTask, deleteTask, setStatus, reopenTask, moveToDate, toggleDone, clearTasks, addSampleTasks, sanitizeImportedTasks, importTasks };
})();

/* ===== services/taskSelectors.js ===== */
__modules["services/taskSelectors.js"] = (function () {
/*
  taskSelectors.js — funções PURAS que respondem perguntas sobre uma lista de tarefas:
  "quais estão atrasadas?", "quantas foram concluídas?", "como ordenar?"...
  Não alteram nada e não tocam no DOM, por isso são fáceis de entender e de testar.
*/
const { DEFAULT_CATEGORIES, PRIORITIES, PRIORITY_ORDER } = __modules["config/constants.js"];
const { addDays, fromDateKey, startOfDay, toDateKey, todayKey, WEEKDAYS_SHORT } = __modules["utils/date.js"];
const { normalizeText } = __modules["utils/dom.js"];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------------ prazos */

/** Momento exato do vencimento (em ms), ou null se a tarefa não tem prazo. Sem horário = fim do dia. */
function dueTimestamp(task) {
  if (!task.dueDate) return null;
  const [year, month, day] = task.dueDate.split('-').map(Number);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0).getTime();
  }
  return new Date(year, month - 1, day, 23, 59, 59).getTime();
}

function isOverdue(task, now = Date.now()) {
  if (task.status === 'done') return false;
  const due = dueTimestamp(task);
  return due !== null && due < now;
}

/** Vence nas próximas `hours` horas (e ainda não passou). */
function isDueSoon(task, now = Date.now(), hours = 48) {
  if (task.status === 'done') return false;
  const due = dueTimestamp(task);
  return due !== null && due >= now && due - now <= hours * HOUR;
}

/* ------------------------------------------------------------------ filtros e ordenação */

function applyFilters(tasks, filters, { showCompleted = true } = {}) {
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
function sortTasks(tasks, sortBy) {
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
function getCategoryList(tasks, { includeDefaults = false } = {}) {
  const set = new Set(tasks.map((task) => task.category).filter(Boolean));
  if (includeDefaults) DEFAULT_CATEGORIES.forEach((category) => set.add(category));
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/* ------------------------------------------------------------------ números para dashboard e estatísticas */

function computeSummary(tasks) {
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

function priorityDistribution(tasks) {
  return PRIORITY_ORDER.map((id) => ({
    id,
    label: PRIORITIES[id].label,
    hex: PRIORITIES[id].hex,
    dot: PRIORITIES[id].dot,
    count: tasks.filter((task) => task.priority === id).length,
  }));
}

function statusDistribution(tasks) {
  return {
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };
}

/** Por categoria: total e concluídas, da maior para a menor. */
function categoryBreakdown(tasks) {
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
function lastDaysActivity(tasks, days = 7) {
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
function weekTrend(tasks) {
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
function tasksByDate(tasks) {
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
return { dueTimestamp, isOverdue, isDueSoon, applyFilters, sortTasks, getCategoryList, computeSummary, priorityDistribution, statusDistribution, categoryBreakdown, lastDaysActivity, weekTrend, tasksByDate };
})();

/* ===== utils/validators.js ===== */
__modules["utils/validators.js"] = (function () {
/*
  validators.js — regras de validação dos formulários.
  Devolve um objeto { campo: "mensagem" }. Objeto vazio = tudo válido.
*/

function validateTask(values) {
  const errors = {};
  const title = (values.title ?? '').trim();

  if (!title) errors.title = 'Informe um título para a tarefa.';
  else if (title.length < 3) errors.title = 'O título precisa ter pelo menos 3 caracteres.';
  else if (title.length > 80) errors.title = 'O título pode ter no máximo 80 caracteres.';

  if ((values.description ?? '').length > 500) {
    errors.description = 'A descrição pode ter no máximo 500 caracteres.';
  }

  if ((values.category ?? '').trim().length > 24) {
    errors.category = 'A categoria pode ter no máximo 24 caracteres.';
  }

  if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    errors.dueDate = 'Data inválida.';
  }

  if (values.dueTime && !values.dueDate) {
    errors.dueTime = 'Escolha uma data para usar um horário.';
  }

  return errors;
}
return { validateTask };
})();

/* ===== utils/format.js ===== */
__modules["utils/format.js"] = (function () {
/*
  format.js — transforma datas e horas em texto para a tela,
  respeitando as preferências do usuário (formato de data e de hora).
*/
const { getSettings } = __modules["services/settingsService.js"];
const { addDays, pad, toDateKey, todayKey } = __modules["utils/date.js"];

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const longDateYear = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayMonthShort = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const monthLong = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

/** "2026-10-11" → "11/10/2026" (ou outro formato escolhido nas configurações) */
function formatDateKey(key) {
  if (!key) return '';
  const [year, month, day] = key.split('-');
  switch (getSettings().dateFormat) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return key;
    default: return `${day}/${month}/${year}`;
  }
}

/** "14:30" → "14:30" (24h) ou "2:30 PM" (12h) */
function formatTime(time) {
  if (!time) return '';
  if (getSettings().timeFormat !== '12h') return time;
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Texto do prazo de uma tarefa: "Hoje, 14:30", "Amanhã", "Ontem", "11/10/2026"... */
function formatDueLabel(task) {
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
function formatCreatedAt(iso) {
  const date = new Date(iso);
  return `${formatDateKey(toDateKey(date))} às ${formatTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`)}`;
}

/** "Domingo, 11 de outubro" (com withYear: "Domingo, 11 de outubro de 2026") */
const formatLongDate = (date, withYear = false) => capitalize((withYear ? longDateYear : longDate).format(date));

/** "Outubro de 2026" */
const formatMonthYear = (date) => capitalize(monthYear.format(date));

/** "11 – 17 de outubro de 2026" ou "28 de set. – 4 de out. de 2026" */
function formatWeekRange(start, end) {
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} de ${monthLong.format(end)} de ${end.getFullYear()}`;
  }
  return `${dayMonthShort.format(start)} – ${dayMonthShort.format(end)} de ${end.getFullYear()}`;
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
return { formatDateKey, formatTime, formatDueLabel, formatCreatedAt, formatLongDate, formatMonthYear, formatWeekRange, greeting };
})();

/* ===== utils/icons.js ===== */
__modules["utils/icons.js"] = (function () {
/*
  icons.js — ícones no estilo Lucide (https://lucide.dev), embutidos como SVG.
  Vantagens: funcionam offline, não pesam e herdam a cor do texto (currentColor).

  Uso em templates:   ${icon('plus')}   ou   ${icon('plus', 'h-5 w-5 text-accent')}
  Uso em HTML estático: <span data-icon="plus" data-icon-class="h-4 w-4"></span>
  Para adicionar um ícone: copie o conteúdo do SVG em lucide.dev e cole no objeto PATHS.
*/

const PATHS = {
  'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  'bar-chart': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
  'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  kanban: '<path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  keyboard: '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  'party-popper': '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
};

function icon(name, className = 'h-4 w-4') {
  const body = PATHS[name];
  if (!body) console.warn(`Ícone "${name}" não existe em js/utils/icons.js`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body ?? ''}</svg>`;
}

/** Preenche todo elemento do HTML estático que tenha o atributo data-icon="nome". */
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, el.dataset.iconClass || 'h-4 w-4');
  });
}
return { icon, hydrateIcons };
})();

/* ===== ui/classes.js ===== */
__modules["ui/classes.js"] = (function () {
/*
  classes.js — "design tokens" em forma de classes Tailwind reutilizáveis.

  Em vez de repetir 15 classes em todo botão, usamos `${ui.btnPrimary}` nos templates.
  Quer deixar todos os botões mais arredondados ou os cards mais "chapados"? Mude AQUI, uma vez só.
*/

const btnBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50';

const ui = {
  /* superfícies */
  card: 'rounded-xl border border-line bg-surface shadow-card',

  /* botões */
  btnPrimary: `${btnBase} bg-accent text-white shadow-sm hover:brightness-110`,
  btnSecondary: `${btnBase} border border-line bg-surface text-ink hover:bg-subtle`,
  btnGhost: `${btnBase} text-mute hover:bg-subtle hover:text-ink`,
  btnDanger: `${btnBase} bg-red-600 text-white hover:bg-red-700`,
  btnDangerSoft: `${btnBase} text-red-600 hover:bg-red-500/10 dark:text-red-400`,
  iconBtn:
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mute transition hover:bg-subtle hover:text-ink',

  /* formulários */
  input:
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mute/70 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 aria-[invalid=true]:border-red-500',
  select:
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
  label: 'mb-1.5 block text-sm font-medium',
  fieldError: 'mt-1.5 text-xs text-red-600 dark:text-red-400',

  /* etiquetas (prioridade, categoria, status) */
  badge: 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
};
return { ui };
})();

/* ===== components/modal.js ===== */
__modules["components/modal.js"] = (function () {
/*
  modal.js — janelas modais usando o elemento nativo <dialog>.
  O navegador cuida de: prender o foco dentro da janela, fechar com Esc,
  escurecer o fundo e devolver o foco ao botão que abriu. Acessibilidade "de graça".
*/
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
let counter = 0;

/**
 * Abre uma janela. `render(body, close)` recebe o elemento onde você coloca o conteúdo
 * e a função que fecha a janela. Qualquer elemento com data-dialog-close também fecha.
 */
function openDialog({ title, description = '', size = 'md', render }) {
  const titleId = `dialog-title-${++counter}`;
  const dialog = document.createElement('dialog');
  dialog.className = `app-dialog ${SIZES[size] ?? SIZES.md}`;
  dialog.setAttribute('aria-labelledby', titleId);

  dialog.innerHTML = `
    <div class="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-pop sm:p-6">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="${titleId}" class="text-lg font-semibold tracking-tight">${esc(title)}</h2>
          ${description ? `<p class="mt-0.5 text-sm text-mute">${esc(description)}</p>` : ''}
        </div>
        <button type="button" data-dialog-close class="${ui.iconBtn} -mr-1.5 -mt-1" aria-label="Fechar">${icon('x', 'h-4 w-4')}</button>
      </div>
      <div data-dialog-body></div>
    </div>`;

  const close = () => dialog.close();

  dialog.addEventListener('click', (event) => {
    // Clicar no fundo escuro (o próprio <dialog>) ou em um botão "fechar"
    if (event.target === dialog || event.target.closest('[data-dialog-close]')) close();
  });
  dialog.addEventListener('close', () => dialog.remove()); // dispara com Esc e com close()

  const body = dialog.querySelector('[data-dialog-body]');
  document.body.appendChild(dialog);
  render(body, close); // renderiza ANTES de abrir, para o `autofocus` funcionar
  dialog.showModal();

  return { dialog, body, close };
}

/** Pergunta "tem certeza?". Devolve uma Promise<boolean>: await confirmDialog({...}) */
function confirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    let confirmed = false;

    const { dialog } = openDialog({
      title,
      size: 'sm',
      render(body, close) {
        body.innerHTML = `
          <p class="text-sm text-mute">${esc(message)}</p>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" data-cancel autofocus class="${ui.btnSecondary}">${esc(cancelLabel)}</button>
            <button type="button" data-confirm class="${danger ? ui.btnDanger : ui.btnPrimary}">${esc(confirmLabel)}</button>
          </div>`;
        body.querySelector('[data-cancel]').addEventListener('click', close);
        body.querySelector('[data-confirm]').addEventListener('click', () => {
          confirmed = true;
          close();
        });
      },
    });

    dialog.addEventListener('close', () => resolve(confirmed));
  });
}
return { openDialog, confirmDialog };
})();

/* ===== components/toast.js ===== */
__modules["components/toast.js"] = (function () {
/*
  toast.js — mensagens rápidas de sucesso, erro e informação.
  Uso:  toast.success('Tarefa criada')   toast.error('Algo deu errado')   toast.info('...')
*/
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];

const TYPES = {
  success: { icon: 'circle-check', color: 'text-emerald-500', role: 'status' },
  error: { icon: 'alert-circle', color: 'text-red-500', role: 'alert' },
  info: { icon: 'info', color: 'text-accent-ink', role: 'status' },
};
const MAX_VISIBLE = 4;

function show(type, message, duration = 3500) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const config = TYPES[type];

  const element = document.createElement('div');
  element.setAttribute('role', config.role);
  element.className = 'toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop';
  element.innerHTML = `
    <span class="mt-0.5 shrink-0 ${config.color}">${icon(config.icon, 'h-[18px] w-[18px]')}</span>
    <p class="min-w-0 flex-1 text-sm">${esc(message)}</p>
    <button type="button" class="${ui.iconBtn} -m-1 !h-6 !w-6" aria-label="Fechar aviso">${icon('x', 'h-3.5 w-3.5')}</button>`;

  const dismiss = () => {
    if (element.dataset.leaving) return;
    element.dataset.leaving = 'true';
    element.classList.replace('toast-enter', 'toast-leave');
    element.addEventListener('animationend', () => element.remove(), { once: true });
  };

  element.querySelector('button').addEventListener('click', dismiss);
  root.appendChild(element);
  while (root.children.length > MAX_VISIBLE) root.firstElementChild.remove();
  setTimeout(dismiss, duration);
}

const toast = {
  success: (message) => show('success', message),
  error: (message) => show('error', message, 5000),
  info: (message) => show('info', message, 5000),
};
return { toast };
})();

/* ===== components/taskDelete.js ===== */
__modules["components/taskDelete.js"] = (function () {
/*
  taskDelete.js — exclusão de tarefa SEMPRE com confirmação.
  Fica em arquivo próprio porque é usada tanto pelos botões das listas (taskActions.js)
  quanto pelo botão "Excluir" do formulário (taskForm.js).
*/
const { deleteTask, getTask } = __modules["services/taskService.js"];
const { confirmDialog } = __modules["components/modal.js"];
const { toast } = __modules["components/toast.js"];

/** Pergunta "tem certeza?" e exclui. Devolve true se a tarefa foi excluída. */
async function confirmAndDelete(id) {
  const task = getTask(id);
  if (!task) return false;

  const confirmed = await confirmDialog({
    title: 'Excluir tarefa?',
    message: `"${task.title}" será removida permanentemente. Esta ação não pode ser desfeita.`,
    confirmLabel: 'Excluir',
    danger: true,
  });
  if (!confirmed) return false;

  try {
    await deleteTask(id);
    toast.success('Tarefa excluída');
    return true;
  } catch (error) {
    console.error(error);
    toast.error('Não foi possível excluir a tarefa.');
    return false;
  }
}
return { confirmAndDelete };
})();

/* ===== components/taskForm.js ===== */
__modules["components/taskForm.js"] = (function () {
/*
  taskForm.js — formulário (em modal) para criar e editar tarefas.

    openTaskForm()                                   → nova tarefa
    openTaskForm({ defaults: { dueDate: '2026-10-20' } })  → nova, com campos preenchidos
    openTaskForm({ task })                           → editar (também serve para ver os detalhes)
*/
const { PRIORITIES, PRIORITY_ORDER, STATUSES, STATUS_ORDER } = __modules["config/constants.js"];
const { createTask, getTasks, updateTask } = __modules["services/taskService.js"];
const { getCategoryList } = __modules["services/taskSelectors.js"];
const { validateTask } = __modules["utils/validators.js"];
const { formatCreatedAt } = __modules["utils/format.js"];
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { confirmAndDelete } = __modules["components/taskDelete.js"];
const { openDialog } = __modules["components/modal.js"];
const { toast } = __modules["components/toast.js"];

const FIELDS = ['title', 'description', 'category', 'dueDate', 'dueTime'];

function openTaskForm({ task = null, defaults = {} } = {}) {
  const isEdit = Boolean(task);
  const v = {
    title: '', description: '', priority: 'medium', status: 'todo', category: '', dueDate: '', dueTime: '',
    ...defaults,
    ...(task ?? {}),
  };
  v.dueDate = v.dueDate ?? '';
  v.dueTime = v.dueTime ?? '';

  openDialog({
    title: isEdit ? 'Editar tarefa' : 'Nova tarefa',
    description: isEdit ? `Criada em ${formatCreatedAt(task.createdAt)}` : '',
    render(body, close) {
      body.innerHTML = template(v, isEdit);
      bindForm(body.querySelector('form'), { task, isEdit, close });
    },
  });
}

function errorLine(field) {
  return `<p id="tf-${field}-error" data-error-for="${field}" class="${ui.fieldError}" hidden></p>`;
}

function template(v, isEdit) {
  const categories = getCategoryList(getTasks(), { includeDefaults: true });

  const priorities = PRIORITY_ORDER.map((id) => `
    <label class="cursor-pointer">
      <input type="radio" name="priority" value="${id}" class="peer sr-only" ${v.priority === id ? 'checked' : ''} />
      <span class="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm transition hover:bg-subtle peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-medium peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        <span class="h-2 w-2 rounded-full ${PRIORITIES[id].dot}"></span>${PRIORITIES[id].label}
      </span>
    </label>`).join('');

  const statuses = STATUS_ORDER.map((id) =>
    `<option value="${id}" ${v.status === id ? 'selected' : ''}>${STATUSES[id].label}</option>`).join('');

  return `
    <form novalidate class="space-y-4">
      <div>
        <label for="tf-title" class="${ui.label}">Título <span class="text-red-500" aria-hidden="true">*</span></label>
        <input id="tf-title" name="title" type="text" maxlength="80" autocomplete="off" autofocus
          value="${esc(v.title)}" placeholder="O que precisa ser feito?" aria-describedby="tf-title-error" class="${ui.input}" />
        ${errorLine('title')}
      </div>

      <div>
        <label for="tf-description" class="${ui.label}">Descrição</label>
        <textarea id="tf-description" name="description" rows="3" maxlength="500" aria-describedby="tf-description-error"
          placeholder="Detalhes, links ou observações (opcional)" class="${ui.input} resize-none">${esc(v.description)}</textarea>
        ${errorLine('description')}
      </div>

      <fieldset>
        <legend class="${ui.label}">Prioridade</legend>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">${priorities}</div>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="tf-status" class="${ui.label}">Status</label>
          <select id="tf-status" name="status" class="${ui.select}">${statuses}</select>
        </div>
        <div>
          <label for="tf-category" class="${ui.label}">Categoria</label>
          <input id="tf-category" name="category" type="text" list="tf-categories" maxlength="24" autocomplete="off"
            value="${esc(v.category)}" placeholder="Ex.: Trabalho" aria-describedby="tf-category-error" class="${ui.input}" />
          <datalist id="tf-categories">${categories.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>
          ${errorLine('category')}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="tf-dueDate" class="${ui.label}">Data de vencimento</label>
          <input id="tf-dueDate" name="dueDate" type="date" value="${esc(v.dueDate)}" aria-describedby="tf-dueDate-error" class="${ui.input}" />
          ${errorLine('dueDate')}
        </div>
        <div>
          <label for="tf-dueTime" class="${ui.label}">Horário <span class="font-normal text-mute">(opcional)</span></label>
          <input id="tf-dueTime" name="dueTime" type="time" value="${esc(v.dueTime)}" aria-describedby="tf-dueTime-error" class="${ui.input}" />
          ${errorLine('dueTime')}
        </div>
      </div>
      <button type="button" data-clear-due class="text-xs font-medium text-mute underline-offset-2 hover:text-ink hover:underline">Remover prazo</button>

      <div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        ${isEdit
          ? `<button type="button" data-delete class="${ui.btnDangerSoft} mr-auto">${icon('trash-2')}Excluir</button>`
          : '<span class="mr-auto text-xs text-mute">Ctrl + Enter para salvar</span>'}
        <button type="button" data-dialog-close class="${ui.btnSecondary}">Cancelar</button>
        <button type="submit" data-submit class="${ui.btnPrimary}">${isEdit ? 'Salvar alterações' : 'Criar tarefa'}</button>
      </div>
    </form>`;
}

function readForm(form) {
  const data = new FormData(form);
  return {
    title: (data.get('title') ?? '').trim(),
    description: (data.get('description') ?? '').trim(),
    priority: data.get('priority'),
    status: data.get('status'),
    category: (data.get('category') ?? '').trim(),
    dueDate: data.get('dueDate') || null,
    dueTime: data.get('dueTime') || null,
  };
}

function showErrors(form, errors) {
  FIELDS.forEach((field) => {
    const message = form.querySelector(`[data-error-for="${field}"]`);
    const input = form.elements[field];
    message.textContent = errors[field] ?? '';
    message.hidden = !errors[field];
    input.setAttribute('aria-invalid', String(Boolean(errors[field])));
  });
  const first = FIELDS.find((field) => errors[field]);
  if (first) form.elements[first].focus();
}

function bindForm(form, { task, isEdit, close }) {
  const submit = form.querySelector('[data-submit]');
  const label = submit.textContent;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(form);
    const errors = validateTask(values);
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    submit.disabled = true;
    submit.innerHTML = `${icon('loader', 'h-4 w-4 animate-spin')}Salvando...`;
    try {
      if (isEdit) await updateTask(task.id, values);
      else await createTask(values);
      toast.success(isEdit ? 'Tarefa atualizada' : 'Tarefa criada');
      close();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar a tarefa. Tente novamente.');
      submit.disabled = false;
      submit.textContent = label;
    }
  });

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) form.requestSubmit();
  });

  form.querySelector('[data-clear-due]').addEventListener('click', () => {
    form.elements.dueDate.value = '';
    form.elements.dueTime.value = '';
  });

  form.querySelector('[data-delete]')?.addEventListener('click', async () => {
    if (await confirmAndDelete(task.id)) close();
  });
}
return { openTaskForm };
})();

/* ===== components/header.js ===== */
__modules["components/header.js"] = (function () {
/*
  header.js — título da página, busca global, tema e botão "Nova tarefa".
  (O HTML do header está no index.html; aqui só ligamos o comportamento.)
*/
const { bus, EVENTS } = __modules["core/eventBus.js"];
const { getCurrentViewId, navigate } = __modules["core/router.js"];
const { toggleTheme } = __modules["core/theme.js"];
const { setFilters, uiState } = __modules["state/uiState.js"];
const { $, debounce } = __modules["utils/dom.js"];
const { openTaskForm } = __modules["components/taskForm.js"];

function initHeader() {
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
return { initHeader };
})();

/* ===== config/navigation.js ===== */
__modules["config/navigation.js"] = (function () {
/*
  navigation.js — fonte única das seções do app.
  Usada pela sidebar, pela barra inferior (mobile) e pelos atalhos de teclado (1 a 5).

  Para criar uma nova tela:
    1. adicione um item aqui;
    2. adicione <section id="view-<id>"> no index.html;
    3. crie js/views/<id>View.js e registre em js/main.js.
*/
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', short: 'Início', icon: 'layout-dashboard', shortcut: '1' },
  { id: 'tasks', label: 'Minhas tarefas', short: 'Tarefas', icon: 'list-checks', shortcut: '2' },
  { id: 'calendar', label: 'Calendário', short: 'Agenda', icon: 'calendar', shortcut: '3' },
  { id: 'stats', label: 'Produtividade', short: 'Produtiv.', icon: 'bar-chart', shortcut: '4' },
  { id: 'settings', label: 'Configurações', short: 'Ajustes', icon: 'settings', shortcut: '5' },
];
return { NAV_ITEMS };
})();

/* ===== components/sidebar.js ===== */
__modules["components/sidebar.js"] = (function () {
/*
  sidebar.js — menu lateral (desktop/tablet) e barra inferior (mobile).
  Os itens vêm de config/navigation.js. A seção ativa recebe aria-current="page"
  (o visual de "ativo" está em css/styles.css).
*/
const { NAV_ITEMS } = __modules["config/navigation.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];
const { getSettings, updateSettings } = __modules["services/settingsService.js"];
const { getTasks } = __modules["services/taskService.js"];
const { $, $$ } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];

function initSidebar() {
  $('#sidebar-nav').innerHTML = NAV_ITEMS.map((item) => `
    <a href="#/${item.id}" data-nav="${item.id}" title="${item.label}"
      class="nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-mute transition hover:bg-subtle hover:text-ink">
      ${icon(item.icon, 'h-[18px] w-[18px] shrink-0')}
      <span class="nav-label flex-1 truncate">${item.label}</span>
      ${item.id === 'tasks' ? '<span data-pending-badge class="nav-label hidden rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-ink"></span>' : ''}
    </a>`).join('');

  $('#mobile-nav').innerHTML = NAV_ITEMS.map((item) => `
    <a href="#/${item.id}" data-nav="${item.id}" class="mobile-link flex flex-col items-center gap-0.5 px-1 pb-2 pt-2 text-[11px] font-medium">
      <span class="mobile-pill flex h-7 w-12 items-center justify-center rounded-full transition">${icon(item.icon, 'h-5 w-5')}</span>
      <span class="max-w-full truncate">${item.short}</span>
    </a>`).join('');

  $('#sidebar-toggle').addEventListener('click', () => {
    updateSettings({ sidebarCollapsed: !getSettings().sidebarCollapsed });
  });

  bus.on(EVENTS.ROUTE_CHANGED, ({ id }) => {
    $$('[data-nav]').forEach((link) => {
      if (link.dataset.nav === id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  });
  bus.on(EVENTS.SETTINGS_CHANGED, applyCollapsed);
  bus.on(EVENTS.TASKS_CHANGED, updatePendingBadge);

  applyCollapsed();
}

function applyCollapsed() {
  const collapsed = getSettings().sidebarCollapsed;
  $('#sidebar').dataset.collapsed = String(collapsed);
  $('#sidebar-toggle').setAttribute('aria-expanded', String(!collapsed));
}

function updatePendingBadge() {
  const pending = getTasks().filter((task) => task.status !== 'done').length;
  const badge = $('[data-pending-badge]');
  badge.textContent = pending;
  badge.classList.toggle('hidden', pending === 0);
}
return { initSidebar };
})();

/* ===== core/shortcuts.js ===== */
__modules["core/shortcuts.js"] = (function () {
/*
  shortcuts.js — atalhos de teclado globais.
  A lista SHORTCUTS é a fonte única: ela alimenta tanto o comportamento quanto a janela de ajuda (?).
  Os atalhos ficam desativados enquanto o usuário digita em um campo ou há uma janela aberta.
*/
const { NAV_ITEMS } = __modules["config/navigation.js"];
const { openDialog } = __modules["components/modal.js"];
const { openTaskForm } = __modules["components/taskForm.js"];
const { getSettings, updateSettings } = __modules["services/settingsService.js"];
const { $, esc } = __modules["utils/dom.js"];
const { navigate } = __modules["core/router.js"];
const { toggleTheme } = __modules["core/theme.js"];

const SHORTCUTS = [
  { key: 'n', label: 'N', description: 'Criar nova tarefa', run: () => openTaskForm() },
  { key: '/', label: '/', description: 'Buscar tarefas', run: () => $('#global-search').focus() },
  { key: 't', label: 'T', description: 'Alternar tema claro/escuro', run: toggleTheme },
  { key: 'b', label: 'B', description: 'Recolher ou expandir o menu lateral', run: () => updateSettings({ sidebarCollapsed: !getSettings().sidebarCollapsed }) },
  ...NAV_ITEMS.map((item) => ({ key: item.shortcut, label: item.shortcut, description: `Ir para ${item.label}`, run: () => navigate(item.id) })),
  { key: '?', label: '?', description: 'Mostrar esta lista de atalhos', run: () => openShortcutsHelp() },
];

const isTyping = (element) =>
  element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));

function initShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target) || document.querySelector('dialog[open]')) return;

    const shortcut = SHORTCUTS.find((item) => item.key === event.key.toLowerCase());
    if (!shortcut) return;
    event.preventDefault();
    shortcut.run();
  });
}

function openShortcutsHelp() {
  const extra = [
    { label: 'Esc', description: 'Fechar janelas e limpar a busca' },
    { label: 'Ctrl + Enter', description: 'Salvar o formulário de tarefa' },
  ];
  openDialog({
    title: 'Atalhos de teclado',
    size: 'sm',
    render(body) {
      body.innerHTML = `<ul class="divide-y divide-line">${[...SHORTCUTS, ...extra]
        .map((item) => `
          <li class="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span>${esc(item.description)}</span>
            <kbd class="rounded-md border border-line bg-subtle px-2 py-0.5 text-xs font-medium text-mute">${esc(item.label)}</kbd>
          </li>`).join('')}</ul>`;
    },
  });
}
return { SHORTCUTS, initShortcuts, openShortcutsHelp };
})();

/* ===== services/notificationService.js ===== */
__modules["services/notificationService.js"] = (function () {
/*
  notificationService.js — lembretes de vencimento.

  A cada 30 segundos, procura tarefas pendentes cujo prazo está chegando (conforme a antecedência
  escolhida em Configurações) e avisa com um toast e, se permitido, com uma notificação do navegador.
  Cada tarefa é avisada uma única vez por prazo (o registro fica no localStorage).
*/
const { getSettings } = __modules["services/settingsService.js"];
const { getTasks } = __modules["services/taskService.js"];
const { dueTimestamp } = __modules["services/taskSelectors.js"];
const { toast } = __modules["components/toast.js"];
const { readJSON, writeJSON } = __modules["utils/storage.js"];
const { formatDueLabel } = __modules["utils/format.js"];

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

function initNotifications() {
  checkReminders();
  setInterval(checkReminders, CHECK_INTERVAL_MS);
}

/** Pede permissão para notificações do sistema. Devolve true se concedida. */
async function enableBrowserNotifications() {
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
return { initNotifications, enableBrowserNotifications };
})();

/* ===== utils/dnd.js ===== */
__modules["utils/dnd.js"] = (function () {
/*
  dnd.js — arrastar e soltar (HTML5 Drag and Drop) reutilizável.
  Usado no Kanban (soltar em uma coluna) e no calendário (soltar em um dia).

    bindDragAndDrop(container, {
      zoneSelector: '[data-drop-status]',      // onde se pode soltar
      onDrop: (taskId, zoneElement) => {...},   // o que fazer ao soltar
    });

  O elemento arrastável precisa de draggable="true" e data-drag-id="<id da tarefa>".
  Obs.: arrastar não funciona em telas touch — por isso o Kanban também tem botões "mover".
*/
function bindDragAndDrop(root, { itemSelector = '[data-drag-id]', zoneSelector, onDrop }) {
  const clearHighlights = () => {
    root.querySelectorAll('.is-dragging, .drop-active').forEach((el) => el.classList.remove('is-dragging', 'drop-active'));
  };

  root.addEventListener('dragstart', (event) => {
    const item = event.target.closest?.(itemSelector);
    if (!item) return;
    event.dataTransfer.setData('text/plain', item.dataset.dragId);
    event.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => item.classList.add('is-dragging')); // depois, para a "sombra" do arraste sair normal
  });

  root.addEventListener('dragend', clearHighlights);

  root.addEventListener('dragover', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (!zone) return;
    event.preventDefault(); // necessário para permitir soltar
    event.dataTransfer.dropEffect = 'move';
    zone.classList.add('drop-active');
  });

  root.addEventListener('dragleave', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('drop-active');
  });

  root.addEventListener('drop', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (!zone) return;
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    clearHighlights();
    if (id) onDrop(id, zone);
  });
}
return { bindDragAndDrop };
})();

/* ===== components/emptyState.js ===== */
__modules["components/emptyState.js"] = (function () {
/*
  emptyState.js — estado vazio: em vez de uma tela em branco, explica e convida a agir.
*/
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];

function emptyState({ iconName = 'clipboard-list', title, text, actionHtml = '' }) {
  return `
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-ink">
        ${icon(iconName, 'h-6 w-6')}
      </div>
      <h3 class="text-base font-semibold">${esc(title)}</h3>
      <p class="mt-1 max-w-sm text-sm text-mute">${esc(text)}</p>
      ${actionHtml ? `<div class="mt-5">${actionHtml}</div>` : ''}
    </div>`;
}
return { emptyState };
})();

/* ===== components/segmented.js ===== */
__modules["components/segmented.js"] = (function () {
/*
  segmented.js — controles reutilizáveis de formulário: botões segmentados e interruptor (switch).
*/
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];

/**
 * Grupo de botões onde só um fica ativo (ex.: Lista | Cards | Kanban).
 * dataAttrs: atributos que identificam a AÇÃO, ex.: 'data-action="set-layout"'.
 * O valor clicado chega no handler como element.dataset.value.
 */
function segmented({ label, options, value, dataAttrs }) {
  const buttons = options
    .map((option) => {
      const active = option.value === value;
      return `
        <button type="button" ${dataAttrs} data-value="${esc(option.value)}" aria-pressed="${active}"
          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
            active ? 'bg-surface text-ink shadow-card' : 'text-mute hover:text-ink'
          }">
          ${option.icon ? icon(option.icon, 'h-4 w-4') : ''}
          <span class="${option.icon ? 'hidden sm:inline' : ''}">${esc(option.label)}</span>
        </button>`;
    })
    .join('');

  return `<div role="group" aria-label="${esc(label)}" class="inline-flex rounded-lg border border-line bg-subtle p-0.5">${buttons}</div>`;
}

/** Interruptor liga/desliga. `setting` é o nome da preferência em settingsService. */
function toggleSwitch({ setting, checked, label }) {
  return `
    <button type="button" role="switch" aria-checked="${checked}" aria-label="${esc(label)}"
      data-setting="${esc(setting)}" data-toggle
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-accent' : 'bg-mute/30'}">
      <span class="inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}"></span>
    </button>`;
}
return { segmented, toggleSwitch };
})();

/* ===== components/taskActions.js ===== */
__modules["components/taskActions.js"] = (function () {
/*
  taskActions.js — o que acontece quando o usuário clica nos botões de uma tarefa
  (concluir, reabrir, editar, excluir, mover). Compartilhado por todas as telas.

  Uso dentro de uma tela:
    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;   // já tratado aqui
      ...ações específicas da tela...
    });
*/
const { STATUSES } = __modules["config/constants.js"];
const { getTask, reopenTask, setStatus, toggleDone } = __modules["services/taskService.js"];
const { openTaskForm } = __modules["components/taskForm.js"];
const { confirmAndDelete } = __modules["components/taskDelete.js"];
const { toast } = __modules["components/toast.js"];

async function run(fn, errorMessage = 'Algo deu errado. Tente novamente.') {
  try {
    await fn();
  } catch (error) {
    console.error(error);
    toast.error(errorMessage);
  }
}

/** Devolve true se a ação era de tarefa (e foi tratada). */
function handleTaskAction(element) {
  const { action, id } = element.dataset;

  switch (action) {
    case 'toggle':
      run(async () => {
        const task = await toggleDone(id);
        toast.success(task.status === 'done' ? 'Tarefa concluída' : 'Tarefa reaberta');
      });
      return true;

    case 'reopen':
      run(async () => {
        await reopenTask(id);
        toast.success('Tarefa reaberta');
      });
      return true;

    case 'edit':
      openTaskForm({ task: getTask(id) });
      return true;

    case 'delete':
      confirmAndDelete(id);
      return true;

    case 'move':
      run(async () => {
        await setStatus(id, element.dataset.status);
        toast.success(`Tarefa movida para "${STATUSES[element.dataset.status].label}"`);
      });
      return true;

    default:
      return false;
  }
}
return { handleTaskAction };
})();

/* ===== components/taskItem.js ===== */
__modules["components/taskItem.js"] = (function () {
/*
  taskItem.js — como UMA tarefa aparece na tela. Três versões do mesmo dado:
    taskRow()   → linha (modo lista, dashboard, dia do calendário)
    taskCard()  → card (modo cards e Kanban)
  Os pedaços menores (etiquetas, prazo, botões) são compartilhados para não duplicar HTML.

  Os botões usam data-action / data-id; quem trata o clique é components/taskActions.js.
*/
const { PRIORITIES, STATUSES, STATUS_ORDER } = __modules["config/constants.js"];
const { esc } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { formatDueLabel } = __modules["utils/format.js"];
const { isDueSoon, isOverdue } = __modules["services/taskSelectors.js"];
const { ui } = __modules["ui/classes.js"];

/* ---------- pedaços reutilizáveis ---------- */

function priorityBadge(priority) {
  const info = PRIORITIES[priority] ?? PRIORITIES.medium;
  return `<span class="${ui.badge} ${info.badge}"><span class="h-1.5 w-1.5 rounded-full ${info.dot}"></span>${info.label}</span>`;
}

// Cores das categorias (nenhuma é vermelha/laranja/verde para não confundir com as prioridades)
const CATEGORY_STYLES = [
  'bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300',
  'bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300',
  'bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/25 dark:text-fuchsia-300',
  'bg-teal-500/10 text-teal-700 ring-teal-500/25 dark:text-teal-300',
  'bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300',
  'bg-cyan-500/10 text-cyan-700 ring-cyan-500/25 dark:text-cyan-300',
];

/** Cada categoria recebe sempre a mesma cor (calculada a partir do nome). */
function categoryStyle(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

function categoryChip(name) {
  if (!name) return '';
  return `<span class="${ui.badge} ${categoryStyle(name)}">${icon('tag', 'h-3 w-3')}${esc(name)}</span>`;
}

function statusBadge(task) {
  if (task.status !== 'doing') return '';
  return `<span class="${ui.badge} bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300">${STATUSES.doing.label}</span>`;
}

/** Prazo da tarefa: vermelho se atrasada, âmbar se vence em breve. */
function dueBadge(task) {
  if (!task.dueDate) return '';
  const overdue = isOverdue(task);
  const soon = isDueSoon(task);
  const tone = task.status === 'done'
    ? 'text-mute'
    : overdue ? 'font-medium text-red-600 dark:text-red-400'
    : soon ? 'text-amber-600 dark:text-amber-400'
    : 'text-mute';
  return `<span class="inline-flex items-center gap-1 text-xs ${tone}">
    ${icon(overdue ? 'alert-circle' : 'clock', 'h-3.5 w-3.5')}
    ${overdue ? '<span class="sr-only">Atrasada: </span>' : ''}${esc(formatDueLabel(task))}
  </span>`;
}

function checkButton(task) {
  const done = task.status === 'done';
  return `<button type="button" role="checkbox" aria-checked="${done}" data-action="toggle" data-id="${esc(task.id)}"
    aria-label="${done ? 'Reabrir' : 'Concluir'} tarefa: ${esc(task.title)}"
    class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
      done ? 'border-accent bg-accent text-white' : 'border-mute/50 text-transparent hover:border-accent hover:text-accent/60'
    }">${icon('check', 'h-3 w-3')}</button>`;
}

function actionButtons(task) {
  const id = esc(task.id);
  const title = esc(task.title);
  const reopen = task.status === 'done'
    ? `<button type="button" class="${ui.iconBtn}" data-action="reopen" data-id="${id}" title="Reabrir" aria-label="Reabrir tarefa: ${title}">${icon('rotate-ccw')}</button>`
    : '';
  return `<div class="reveal-actions flex shrink-0 items-center gap-0.5">
    ${reopen}
    <button type="button" class="${ui.iconBtn}" data-action="edit" data-id="${id}" title="Editar" aria-label="Editar tarefa: ${title}">${icon('pencil')}</button>
    <button type="button" class="${ui.iconBtn} hover:!text-red-600" data-action="delete" data-id="${id}" title="Excluir" aria-label="Excluir tarefa: ${title}">${icon('trash-2')}</button>
  </div>`;
}

/** Cor da borda/fundo: destaca tarefas atrasadas automaticamente. */
const shellTone = (task) =>
  isOverdue(task) ? 'border-red-500/30 bg-red-500/5' : 'border-line bg-surface hover:border-mute/40';

/* ---------- versão em linha ---------- */

function taskRow(task, { showDescription = true } = {}) {
  const done = task.status === 'done';
  return `
    <article class="group flex items-start gap-3 rounded-xl border p-3 shadow-card transition sm:p-3.5 ${shellTone(task)}">
      ${checkButton(task)}
      <div class="min-w-0 flex-1">
        <button type="button" data-action="edit" data-id="${esc(task.id)}"
          class="block max-w-full truncate text-left text-sm font-medium hover:text-accent-ink ${done ? 'text-mute line-through' : ''}">${esc(task.title)}</button>
        ${showDescription && task.description ? `<p class="mt-0.5 line-clamp-1 text-sm text-mute">${esc(task.description)}</p>` : ''}
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          ${priorityBadge(task.priority)}${statusBadge(task)}${categoryChip(task.category)}${dueBadge(task)}
        </div>
      </div>
      ${actionButtons(task)}
    </article>`;
}

/* ---------- versão em card (também usada no Kanban) ---------- */

/** No Kanban (kanban: true) o card pode ser arrastado e ganha botões para mover entre colunas. */
function taskCard(task, { showDescription = true, kanban = false } = {}) {
  const done = task.status === 'done';
  const id = esc(task.id);
  return `
    <article class="group flex flex-col gap-3 rounded-xl border p-4 shadow-card transition ${shellTone(task)} ${kanban ? 'cursor-grab active:cursor-grabbing' : ''}"
      ${kanban ? `draggable="true" data-drag-id="${id}"` : ''}>
      <div class="flex items-start gap-3">
        ${checkButton(task)}
        <button type="button" data-action="edit" data-id="${id}"
          class="line-clamp-2 min-w-0 flex-1 text-left text-sm font-medium hover:text-accent-ink ${done ? 'text-mute line-through' : ''}">${esc(task.title)}</button>
      </div>
      ${showDescription && task.description ? `<p class="line-clamp-2 text-sm text-mute">${esc(task.description)}</p>` : ''}
      <div class="flex flex-wrap items-center gap-1.5">${priorityBadge(task.priority)}${statusBadge(task)}${categoryChip(task.category)}</div>
      <div class="mt-auto flex items-center justify-between gap-2">
        ${dueBadge(task) || '<span class="text-xs text-mute">Sem prazo</span>'}
        ${actionButtons(task)}
      </div>
      ${kanban ? moveButtons(task) : ''}
    </article>`;
}

/** Botões "← A fazer" / "Concluído →": mover entre colunas sem arrastar (teclado e touch). */
function moveButtons(task) {
  const index = STATUS_ORDER.indexOf(task.status);
  const previous = STATUS_ORDER[index - 1];
  const next = STATUS_ORDER[index + 1];
  const button = (status, content) =>
    `<button type="button" data-action="move" data-id="${esc(task.id)}" data-status="${status}" class="${ui.btnGhost} !px-2 !py-1 text-xs">${content}</button>`;

  return `<div class="flex items-center justify-between gap-2 border-t border-line pt-2">
    ${previous ? button(previous, `${icon('chevron-left', 'h-3.5 w-3.5')}${STATUSES[previous].label}`) : '<span></span>'}
    ${next ? button(next, `${STATUSES[next].label}${icon('chevron-right', 'h-3.5 w-3.5')}`) : ''}
  </div>`;
}
return { priorityBadge, categoryChip, dueBadge, taskRow, taskCard };
})();

/* ===== views/calendarView.js ===== */
__modules["views/calendarView.js"] = (function () {
/*
  calendarView.js — calendário com visões de mês, semana e dia, integrado às tarefas.

  - clicar em um dia vazio cria uma tarefa naquela data (no celular abre o dia);
  - clicar em uma tarefa abre os detalhes para editar;
  - arrastar uma tarefa para outro dia muda o vencimento (o horário é mantido);
  - o painel lateral lista as tarefas atrasadas e as que vencem nas próximas 48 h.
*/
const { PRIORITIES } = __modules["config/constants.js"];
const { getSettings } = __modules["services/settingsService.js"];
const { getTask, getTasks, moveToDate } = __modules["services/taskService.js"];
const { isDueSoon, isOverdue, sortTasks, tasksByDate } = __modules["services/taskSelectors.js"];
const { resetFilters, setFilters } = __modules["state/uiState.js"];
const { navigate } = __modules["core/router.js"];
const { addDays, addMonths, fromDateKey, getMonthGrid, getWeekDays, getWeekdayLabels, startOfWeek, toDateKey, todayKey, WEEKDAYS_SHORT } = __modules["utils/date.js"];
const { esc, patchHtml, plural } = __modules["utils/dom.js"];
const { bindDragAndDrop } = __modules["utils/dnd.js"];
const { formatDateKey, formatDueLabel, formatLongDate, formatMonthYear, formatTime, formatWeekRange } = __modules["utils/format.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { emptyState } = __modules["components/emptyState.js"];
const { segmented } = __modules["components/segmented.js"];
const { handleTaskAction } = __modules["components/taskActions.js"];
const { openTaskForm } = __modules["components/taskForm.js"];
const { taskRow } = __modules["components/taskItem.js"];
const { toast } = __modules["components/toast.js"];

const MAX_CHIPS = 3; // tarefas visíveis por dia no mês; o resto vira "+N mais"
const MODES = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

let root;
let mode = 'month';
let cursor = new Date(); // data de referência: define qual mês/semana/dia está na tela

const isDesktop = () => window.matchMedia('(min-width: 640px)').matches;

const calendarView = {
  id: 'calendar',
  title: 'Calendário',

  mount(section) {
    root = section;
    root.addEventListener('click', onClick);

    // Chips são <div role="button">: Enter e Espaço precisam ativá-los como em um botão.
    root.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"][data-action]')) {
        event.preventDefault();
        event.target.click();
      }
    });

    bindDragAndDrop(root, {
      zoneSelector: '[data-drop-date]',
      onDrop: async (id, zone) => {
        const date = zone.dataset.dropDate;
        if (getTask(id)?.dueDate === date) return;
        try {
          await moveToDate(id, date);
          toast.success(`Vencimento alterado para ${formatDateKey(date)}`);
        } catch (error) {
          console.error(error);
          toast.error('Não foi possível alterar a data.');
        }
      },
    });
  },

  render() {
    const settings = getSettings();
    const byDate = tasksByDate(getTasks());
    const body = mode === 'month' ? monthView(byDate, settings) : mode === 'week' ? weekView(byDate, settings) : dayView(byDate);

    patchHtml(root, `
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="${ui.card} overflow-hidden">${toolbar(settings)}${body}</div>
        ${sidePanel()}
      </div>`);
  },
};

/* ------------------------------------------------------------ cliques */

function onClick(event) {
  const el = event.target.closest('[data-action]');
  if (!el || handleTaskAction(el)) return;
  const { action, date } = el.dataset;

  switch (action) {
    case 'cal-prev': shift(-1); break;
    case 'cal-next': shift(1); break;
    case 'cal-today': cursor = new Date(); calendarView.render(); break;
    case 'cal-mode': mode = el.dataset.value; calendarView.render(); break;
    case 'goto-day': cursor = fromDateKey(date); mode = 'day'; calendarView.render(); break;
    case 'new-on-date':
      // Em telas pequenas a célula é minúscula: tocar nela abre o dia em vez de criar.
      if (el.classList.contains('cal-cell') && !isDesktop()) {
        cursor = fromDateKey(date);
        mode = 'day';
        calendarView.render();
      } else {
        openTaskForm({ defaults: { dueDate: date } });
      }
      break;
    case 'show-overdue':
      resetFilters();
      setFilters({ date: 'overdue' });
      navigate('tasks');
      break;
  }
}

function shift(direction) {
  if (mode === 'month') cursor = addMonths(cursor, direction);
  else if (mode === 'week') cursor = addDays(cursor, 7 * direction);
  else cursor = addDays(cursor, direction);
  calendarView.render();
}

/* ------------------------------------------------------------ cabeçalho */

function title(settings) {
  if (mode === 'month') return formatMonthYear(cursor);
  if (mode === 'week') {
    const start = startOfWeek(cursor, settings.weekStart);
    return formatWeekRange(start, addDays(start, 6));
  }
  return formatLongDate(cursor, true);
}

function toolbar(settings) {
  return `
    <div class="flex flex-wrap items-center gap-3 border-b border-line p-3 sm:p-4">
      <h2 class="mr-auto text-base font-semibold sm:text-lg" aria-live="polite">${esc(title(settings))}</h2>
      <div class="flex items-center gap-1">
        <button type="button" data-action="cal-prev" data-focus-key="cal-prev" class="${ui.iconBtn}" aria-label="Período anterior">${icon('chevron-left')}</button>
        <button type="button" data-action="cal-today" class="${ui.btnSecondary} !px-3 !py-1.5">Hoje</button>
        <button type="button" data-action="cal-next" data-focus-key="cal-next" class="${ui.iconBtn}" aria-label="Próximo período">${icon('chevron-right')}</button>
      </div>
      ${segmented({ label: 'Tipo de visualização', dataAttrs: 'data-action="cal-mode"', value: mode, options: MODES })}
    </div>`;
}

/* ------------------------------------------------------------ chip de tarefa (mês e semana) */

function calendarChip(task, { full = false } = {}) {
  const id = esc(task.id);
  const done = task.status === 'done';
  const time = task.dueTime ? `<span class="shrink-0 font-semibold opacity-80">${esc(formatTime(task.dueTime))}</span>` : '';
  return `
    <div role="button" tabindex="0" draggable="true" data-drag-id="${id}" data-action="edit" data-id="${id}" title="${esc(task.title)}"
      class="flex cursor-pointer items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-xs transition hover:brightness-95 ${PRIORITIES[task.priority].chip}
      ${done ? 'line-through opacity-50' : ''} ${isOverdue(task) ? 'ring-1 ring-inset ring-red-500/60' : ''}">
      ${time}<span class="${full ? 'break-words' : 'truncate'}">${esc(task.title)}</span>
    </div>`;
}

/* ------------------------------------------------------------ visão mensal */

function monthView(byDate, settings) {
  const today = todayKey();
  const month = cursor.getMonth();
  const labels = getWeekdayLabels(settings.weekStart)
    .map((label) => `<div class="px-2 py-2 text-center text-xs font-medium text-mute">${label}</div>`)
    .join('');
  const cells = getMonthGrid(cursor, settings.weekStart)
    .map((day) => monthCell(day, byDate.get(toDateKey(day)) ?? [], today, month))
    .join('');

  return `
    <div role="group" aria-label="${esc(formatMonthYear(cursor))}">
      <div class="grid grid-cols-7 border-b border-line bg-subtle/50">${labels}</div>
      <div class="grid grid-cols-7">${cells}</div>
    </div>`;
}

function monthCell(day, tasks, today, month) {
  const key = toDateKey(day);
  const isToday = key === today;
  const outside = day.getMonth() !== month;
  const shown = tasks.slice(0, MAX_CHIPS);
  const hidden = tasks.length - shown.length;
  const dayLabel = `${formatLongDate(day)}${tasks.length ? `, ${plural(tasks.length, 'tarefa', 'tarefas')}` : ''}`;

  return `
    <div class="cal-cell group relative min-h-[4.5rem] cursor-pointer border-b border-r border-line p-1 transition hover:bg-subtle/60 sm:min-h-[7.5rem] sm:p-1.5 ${outside ? 'bg-subtle/30' : ''}"
      data-action="new-on-date" data-date="${key}" data-drop-date="${key}">
      <div class="flex items-center justify-between">
        <button type="button" data-action="goto-day" data-date="${key}" aria-label="${esc(dayLabel)}"
          class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium hover:ring-2 hover:ring-accent/40 ${
            isToday ? 'bg-accent text-white' : outside ? 'text-mute/60' : 'text-ink'}" ${isToday ? 'aria-current="date"' : ''}>${day.getDate()}</button>
        <button type="button" data-action="new-on-date" data-date="${key}" aria-label="Nova tarefa em ${esc(formatDateKey(key))}"
          class="reveal-actions hidden h-5 w-5 items-center justify-center rounded text-mute hover:bg-subtle hover:text-ink sm:flex">${icon('plus', 'h-3.5 w-3.5')}</button>
      </div>
      <div class="mt-1 hidden space-y-1 sm:block">
        ${shown.map((task) => calendarChip(task)).join('')}
        ${hidden ? `<button type="button" data-action="goto-day" data-date="${key}" class="px-1 text-xs font-medium text-mute hover:text-ink">+${hidden} mais</button>` : ''}
      </div>
      <div class="mt-1.5 flex flex-wrap justify-center gap-0.5 sm:hidden">
        ${tasks.slice(0, 4).map((task) => `<span class="h-1.5 w-1.5 rounded-full ${PRIORITIES[task.priority].dot} ${task.status === 'done' ? 'opacity-40' : ''}"></span>`).join('')}
      </div>
    </div>`;
}

/* ------------------------------------------------------------ visão semanal */

function weekView(byDate, settings) {
  const today = todayKey();
  const columns = getWeekDays(cursor, settings.weekStart).map((day) => {
    const key = toDateKey(day);
    const tasks = byDate.get(key) ?? [];
    const isToday = key === today;
    return `
      <div class="min-h-[8rem] border-b border-line p-2 md:min-h-[26rem] md:border-b-0 ${isToday ? 'bg-accent/5' : ''}" data-drop-date="${key}">
        <div class="mb-2 flex items-center justify-between">
          <button type="button" data-action="goto-day" data-date="${key}" class="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-subtle">
            <span class="text-xs font-medium text-mute">${WEEKDAYS_SHORT[day.getDay()]}</span>
            <span class="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-accent text-white' : ''}">${day.getDate()}</span>
          </button>
          <button type="button" data-action="new-on-date" data-date="${key}" class="${ui.iconBtn} !h-6 !w-6" aria-label="Nova tarefa em ${esc(formatDateKey(key))}">${icon('plus', 'h-3.5 w-3.5')}</button>
        </div>
        <div class="space-y-1.5">
          ${tasks.length ? tasks.map((task) => calendarChip(task, { full: true })).join('') : '<p class="px-1 text-xs text-mute">Sem tarefas</p>'}
        </div>
      </div>`;
  }).join('');

  return `<div class="grid divide-line md:grid-cols-7 md:divide-x">${columns}</div>`;
}

/* ------------------------------------------------------------ visão diária */

function dayView(byDate) {
  const key = toDateKey(cursor);
  const tasks = byDate.get(key) ?? [];
  const done = tasks.filter((task) => task.status === 'done').length;
  const addButton = `<button type="button" data-action="new-on-date" data-date="${key}" class="${ui.btnSecondary}">${icon('plus')}Adicionar tarefa neste dia</button>`;

  return `
    <div class="p-4 sm:p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-mute">${tasks.length ? `${plural(tasks.length, 'tarefa', 'tarefas')}, ${done} concluída${done === 1 ? '' : 's'}` : 'Nenhuma tarefa neste dia'}</p>
        ${tasks.length ? addButton : ''}
      </div>
      ${tasks.length
        ? `<div class="space-y-2">${tasks.map((task) => taskRow(task, { showDescription: true })).join('')}</div>`
        : emptyState({ iconName: 'calendar', title: 'Dia livre', text: 'Nenhuma tarefa vence nesta data.', actionHtml: addButton })}
    </div>`;
}

/* ------------------------------------------------------------ painel lateral: atrasadas e próximas */

function sidePanel() {
  const tasks = getTasks();
  const now = Date.now();
  const overdue = sortTasks(tasks.filter((task) => isOverdue(task, now)), 'due');
  const soon = sortTasks(tasks.filter((task) => isDueSoon(task, now)), 'due');

  return `
    <aside class="space-y-4" aria-label="Alertas de prazo">
      ${attentionCard('Atrasadas', 'alert-circle', 'text-red-500', overdue, 'Nenhuma tarefa atrasada.', true)}
      ${attentionCard('Vencem em breve', 'clock', 'text-amber-500', soon, 'Nada vencendo nas próximas 48 horas.')}
    </aside>`;
}

function attentionCard(heading, iconName, iconClass, items, emptyText, withLink = false) {
  const list = items.slice(0, 5).map((task) => `
    <li>
      <button type="button" data-action="edit" data-id="${esc(task.id)}" class="flex w-full items-start gap-2 rounded-lg p-2 text-left transition hover:bg-subtle">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITIES[task.priority].dot}"></span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">${esc(task.title)}</span>
          <span class="block text-xs text-mute">${esc(formatDueLabel(task))}</span>
        </span>
      </button>
    </li>`).join('');

  return `
    <section class="${ui.card} p-4">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span class="${iconClass}">${icon(iconName, 'h-4 w-4')}</span>${heading}
        <span class="ml-auto rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-mute">${items.length}</span>
      </h3>
      ${items.length ? `<ul class="space-y-1">${list}</ul>` : `<p class="text-sm text-mute">${emptyText}</p>`}
      ${withLink && items.length > 5 ? `<button type="button" data-action="show-overdue" class="mt-2 text-xs font-medium text-accent-ink hover:underline">Ver todas (${items.length})</button>` : ''}
    </section>`;
}
return { calendarView };
})();

/* ===== components/charts.js ===== */
__modules["components/charts.js"] = (function () {
/*
  charts.js — gráficos minimalistas feitos só com SVG e divs (sem bibliotecas).
  Cada função recebe dados e devolve uma string de HTML.
*/
const { esc } = __modules["utils/dom.js"];

/** Barra de progresso horizontal. percent: 0 a 100. */
function progressBar(percent, { label = 'Progresso', barClass = 'bg-accent' } = {}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return `
    <div class="h-2 w-full overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
      <div class="h-full rounded-full ${barClass} transition-all duration-500" style="width:${value}%"></div>
    </div>`;
}

/** Anel de progresso (porcentagem no centro). */
function progressRing(percent, { size = 112 } = {}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return `
    <div class="relative shrink-0" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke-width="8" class="stroke-line"/>
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke-width="8" stroke-linecap="round"
          class="stroke-accent transition-all duration-700"
          stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center text-2xl font-semibold">${Math.round(percent)}%</div>
    </div>`;
}

/** Rosca (donut) com um segmento por item: { label, count, hex }. */
function donutChart(items, { size = 144 } = {}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = items
    .filter((item) => item.count > 0)
    .map((item) => {
      const length = (item.count / total) * circumference;
      const segment = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${item.hex}" stroke-width="14"
        stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}">
        <title>${esc(item.label)}: ${item.count}</title></circle>`;
      offset += length;
      return segment;
    })
    .join('');

  return `
    <div class="relative shrink-0" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90" role="img" aria-label="Tarefas por prioridade: ${items.map((i) => `${i.label} ${i.count}`).join(', ')}">
        <circle cx="60" cy="60" r="${radius}" fill="none" stroke-width="14" class="stroke-line"/>
        ${segments}
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-semibold">${total}</span>
        <span class="text-xs text-mute">tarefas</span>
      </div>
    </div>`;
}

/** Barras agrupadas por dia: criadas (cinza) x concluídas (cor de destaque). */
function weeklyBars(days) {
  const max = Math.max(1, ...days.flatMap((day) => [day.created, day.completed]));
  const summary = days.map((d) => `${d.label}: ${d.created} criadas, ${d.completed} concluídas`).join('; ');

  const columns = days
    .map(
      (day) => `
      <div class="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
        <div class="flex w-full flex-1 items-end justify-center gap-1">
          <div class="w-full max-w-[18px] rounded-t-md bg-mute/30" style="height:${(day.created / max) * 100}%;min-height:3px" title="${day.created} criadas"></div>
          <div class="w-full max-w-[18px] rounded-t-md bg-accent" style="height:${(day.completed / max) * 100}%;min-height:3px" title="${day.completed} concluídas"></div>
        </div>
        <span class="text-xs ${day.isToday ? 'font-semibold text-ink' : 'text-mute'}">${day.label}</span>
      </div>`,
    )
    .join('');

  return `
    <div class="flex h-44 items-stretch gap-2 sm:gap-4" role="img" aria-label="Últimos 7 dias. ${esc(summary)}">${columns}</div>
    <div class="mt-4 flex items-center gap-4 text-xs text-mute">
      <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-mute/30"></span>Criadas</span>
      <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-accent"></span>Concluídas</span>
    </div>`;
}
return { progressBar, progressRing, donutChart, weeklyBars };
})();

/* ===== views/dashboardView.js ===== */
__modules["views/dashboardView.js"] = (function () {
/*
  dashboardView.js — visão geral: boas-vindas, números do dia, produtividade e prioridades.
*/
const { navigate } = __modules["core/router.js"];
const { getSettings } = __modules["services/settingsService.js"];
const { getTasks } = __modules["services/taskService.js"];
const { computeSummary, sortTasks, weekTrend } = __modules["services/taskSelectors.js"];
const { resetFilters, setFilters } = __modules["state/uiState.js"];
const { esc, patchHtml, plural } = __modules["utils/dom.js"];
const { todayKey } = __modules["utils/date.js"];
const { formatLongDate, greeting } = __modules["utils/format.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { emptyState } = __modules["components/emptyState.js"];
const { progressBar, progressRing } = __modules["components/charts.js"];
const { handleTaskAction } = __modules["components/taskActions.js"];
const { openTaskForm } = __modules["components/taskForm.js"];
const { taskRow } = __modules["components/taskItem.js"];

let root;

const dashboardView = {
  id: 'dashboard',
  title: 'Dashboard',

  mount(section) {
    root = section;
    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;

      switch (el.dataset.action) {
        case 'new-task':
          openTaskForm();
          break;
        case 'open-filter': // os cards de números levam à lista já filtrada
          resetFilters();
          setFilters(JSON.parse(el.dataset.filter));
          navigate('tasks');
          break;
        case 'go':
          navigate(el.dataset.view);
          break;
      }
    });
  },

  render() {
    const tasks = getTasks();
    const settings = getSettings();
    const summary = computeSummary(tasks);
    const priorityTasks = sortTasks(tasks.filter((task) => task.status !== 'done'), 'urgency').slice(0, 5);
    const todayTasks = sortTasks(tasks.filter((task) => task.dueDate === todayKey()), 'due');
    const rowOptions = { showDescription: settings.showDescriptions };

    patchHtml(root, `
      <div class="space-y-6">
        ${header(summary, settings)}

        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          ${statCard('Pendentes', summary.pending, 'clock', 'bg-accent/10 text-accent-ink', { status: 'pending' })}
          ${statCard('Concluídas', summary.done, 'circle-check', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', { status: 'done' })}
          ${statCard('Atrasadas', summary.overdue, 'alert-circle', 'bg-red-500/10 text-red-600 dark:text-red-400', { date: 'overdue' })}
          ${statCard('Para hoje', summary.today, 'calendar', 'bg-amber-500/10 text-amber-600 dark:text-amber-400', { date: 'today' })}
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          ${productivityCard(summary, weekTrend(tasks))}
          <section class="${ui.card} p-5 lg:col-span-2" aria-labelledby="priority-heading">
            <div class="mb-4 flex items-center justify-between">
              <h3 id="priority-heading" class="font-semibold">Tarefas prioritárias</h3>
              <button type="button" data-action="go" data-view="tasks" class="text-sm font-medium text-accent-ink hover:underline">Ver todas</button>
            </div>
            ${priorityTasks.length
              ? `<div class="space-y-2">${priorityTasks.map((task) => taskRow(task, rowOptions)).join('')}</div>`
              : emptyState({
                  iconName: 'party-popper',
                  title: tasks.length ? 'Tudo em dia' : 'Nenhuma tarefa por aqui',
                  text: tasks.length ? 'Você não tem tarefas pendentes. Aproveite!' : 'Crie sua primeira tarefa para começar a se organizar.',
                })}
          </section>
        </div>

        <section class="${ui.card} p-5" aria-labelledby="today-heading">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 id="today-heading" class="font-semibold">Agenda de hoje</h3>
            <div class="w-full sm:w-56">
              <p class="mb-1.5 text-xs text-mute">${summary.todayDone} de ${summary.today} concluídas</p>
              ${progressBar(summary.today ? (summary.todayDone / summary.today) * 100 : 0, { label: 'Progresso de hoje' })}
            </div>
          </div>
          ${todayTasks.length
            ? `<div class="space-y-2">${todayTasks.map((task) => taskRow(task, rowOptions)).join('')}</div>`
            : `<p class="py-6 text-center text-sm text-mute">Nenhuma tarefa com vencimento hoje.</p>`}
        </section>
      </div>`);
  },
};

function header(summary, settings) {
  const name = settings.userName.trim();
  let message;
  if (summary.total === 0) message = 'Comece criando sua primeira tarefa.';
  else if (summary.todayPending === 0 && summary.overdue === 0) message = 'Nada pendente para hoje. Bom trabalho!';
  else {
    message = `Você tem ${plural(summary.todayPending, 'tarefa', 'tarefas')} para hoje`;
    message += summary.overdue ? ` e ${plural(summary.overdue, 'atrasada', 'atrasadas')}.` : '.';
  }

  return `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-mute">${esc(formatLongDate(new Date()))}</p>
        <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">${greeting()}${name ? `, ${esc(name)}` : ''}</h2>
        <p class="mt-1 text-mute">${esc(message)}</p>
      </div>
      <button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Nova tarefa</button>
    </div>`;
}

function statCard(label, value, iconName, tone, filter) {
  return `
    <button type="button" data-action="open-filter" data-filter="${esc(JSON.stringify(filter))}"
      class="${ui.card} p-4 text-left transition hover:border-mute/40 sm:p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-mute">${label}</span>
        <span class="flex h-8 w-8 items-center justify-center rounded-lg ${tone}">${icon(iconName, 'h-4 w-4')}</span>
      </div>
      <p class="mt-3 text-3xl font-semibold tracking-tight">${value}</p>
    </button>`;
}

function productivityLabel(summary) {
  if (summary.total === 0) return 'Sem dados ainda';
  if (summary.completionRate >= 75) return 'Excelente ritmo';
  if (summary.completionRate >= 50) return 'Bom andamento';
  if (summary.completionRate >= 25) return 'Em progresso';
  return 'Vamos começar';
}

function trendText({ current, previous }) {
  if (!current && !previous) return '';
  if (!previous) return `<p class="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">${current} concluídas nos últimos 7 dias</p>`;
  const diff = Math.round(((current - previous) / previous) * 100);
  const up = diff >= 0;
  return `<p class="mt-1 inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
    ${icon(up ? 'trending-up' : 'trending-down', 'h-3.5 w-3.5')}${up ? '+' : ''}${diff}% em relação à semana anterior</p>`;
}

function productivityCard(summary, trend) {
  return `
    <section class="${ui.card} p-5" aria-labelledby="productivity-heading">
      <h3 id="productivity-heading" class="text-sm font-medium text-mute">Produtividade</h3>
      <div class="mt-4 flex items-center gap-5">
        ${progressRing(summary.completionRate)}
        <div class="min-w-0">
          <p class="font-medium">${productivityLabel(summary)}</p>
          <p class="text-sm text-mute">${summary.done} de ${summary.total} concluídas</p>
          ${trendText(trend)}
        </div>
      </div>
      <div class="mt-5">${progressBar(summary.completionRate, { label: 'Tarefas concluídas' })}</div>
    </section>`;
}
return { dashboardView };
})();

/* ===== views/settingsView.js ===== */
__modules["views/settingsView.js"] = (function () {
/*
  settingsView.js — preferências do usuário. Cada controle grava em settingsService
  (que salva no localStorage), por isso tudo permanece após atualizar a página.

  Convenção dos controles:
    data-setting="nome"  + data-value="x"   → botões de escolha (tema, cor)
    data-setting="nome"  + data-toggle      → interruptores liga/desliga
    <select|input data-setting="nome">      → dispara no evento "change"
*/
const { ACCENT_COLORS, LAYOUTS } = __modules["config/constants.js"];
const { openShortcutsHelp } = __modules["core/shortcuts.js"];
const { enableBrowserNotifications } = __modules["services/notificationService.js"];
const { getSettings, updateSettings } = __modules["services/settingsService.js"];
const { addSampleTasks, clearTasks, getTasks, importTasks } = __modules["services/taskService.js"];
const { downloadFile, esc, patchHtml } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { confirmDialog } = __modules["components/modal.js"];
const { segmented, toggleSwitch } = __modules["components/segmented.js"];
const { toast } = __modules["components/toast.js"];

let root;
const NUMERIC_SETTINGS = new Set(['weekStart', 'notifyLeadMinutes']);

const settingsView = {
  id: 'settings',
  title: 'Configurações',

  mount(section) {
    root = section;
    root.addEventListener('click', onClick);
    root.addEventListener('change', (event) => {
      if (event.target.matches('[data-import-file]')) return importFromFile(event.target);
      const el = event.target.closest('[data-setting]');
      if (!el || 'toggle' in el.dataset) return;
      const { setting } = el.dataset;
      applySetting(setting, NUMERIC_SETTINGS.has(setting) ? Number(el.value) : el.value);
    });
  },

  render() {
    const s = getSettings();
    patchHtml(root, `
      <div class="mx-auto max-w-3xl space-y-4">
        ${group('Aparência', 'Tema e cores da interface.', [
          row('Tema', 'Escolha claro, escuro ou siga o sistema operacional.', segmented({
            label: 'Tema',
            dataAttrs: 'data-setting="theme"',
            value: s.theme,
            options: [
              { value: 'light', label: 'Claro', icon: 'sun' },
              { value: 'dark', label: 'Escuro', icon: 'moon' },
              { value: 'system', label: 'Sistema', icon: 'monitor' },
            ],
          })),
          row('Cor de destaque', 'Usada em botões, links e itens ativos.', accentPicker(s.accent)),
          row('Seu nome', 'Aparece na mensagem de boas-vindas.', `<input type="text" data-setting="userName" value="${esc(s.userName)}" maxlength="30" placeholder="Opcional" aria-label="Seu nome" class="${ui.input} sm:w-48" />`),
        ])}

        ${group('Exibição das tarefas', 'Como a lista e o calendário se comportam.', [
          row('Visualização padrão', 'Modo usado em Minhas tarefas.', select('taskLayout', Object.entries(LAYOUTS).map(([id, l]) => [id, l.label]), s.taskLayout)),
          row('Mostrar tarefas concluídas', 'Em lista e cards. No Kanban elas ficam sempre na coluna "Concluído".', toggleSwitch({ setting: 'showCompleted', checked: s.showCompleted, label: 'Mostrar tarefas concluídas' })),
          row('Mostrar descrições', 'Exibe o resumo abaixo do título.', toggleSwitch({ setting: 'showDescriptions', checked: s.showDescriptions, label: 'Mostrar descrições' })),
          row('Primeiro dia da semana', 'Usado no calendário.', select('weekStart', [[0, 'Domingo'], [1, 'Segunda-feira']], s.weekStart)),
        ])}

        ${group('Data e horário', 'Formato usado nos prazos das tarefas.', [
          row('Formato de data', '', select('dateFormat', [['DD/MM/YYYY', 'DD/MM/AAAA'], ['MM/DD/YYYY', 'MM/DD/AAAA'], ['YYYY-MM-DD', 'AAAA-MM-DD']], s.dateFormat)),
          row('Formato de hora', '', select('timeFormat', [['24h', '24 horas (14:30)'], ['12h', '12 horas (2:30 PM)']], s.timeFormat)),
        ])}

        ${group('Notificações', 'Lembretes de tarefas perto do vencimento.', [
          row('Lembretes no aplicativo', 'Mostra um aviso quando uma tarefa está para vencer.', toggleSwitch({ setting: 'notifyEnabled', checked: s.notifyEnabled, label: 'Lembretes no aplicativo' })),
          row('Notificações do sistema', 'Também avisa pelo navegador (pede permissão).', toggleSwitch({ setting: 'notifyBrowser', checked: s.notifyBrowser, label: 'Notificações do sistema' })),
          row('Antecedência', 'Quanto tempo antes do horário avisar.', select('notifyLeadMinutes', [[0, 'No horário'], [15, '15 minutos'], [30, '30 minutos'], [60, '1 hora'], [1440, '1 dia']], s.notifyLeadMinutes)),
        ])}

        ${group('Dados e atalhos', 'Tudo fica salvo apenas neste navegador, sem servidor nem banco de dados.', [
          row('Atalhos de teclado', 'Veja todos os atalhos disponíveis.', `<button type="button" data-action="show-shortcuts" class="${ui.btnSecondary}">${icon('keyboard')}Ver atalhos</button>`),
          row('Exportar backup', 'Baixa um arquivo JSON com suas tarefas. Guarde-o: os dados ficam só neste navegador.', `<button type="button" data-action="export-data" class="${ui.btnSecondary}">${icon('download')}Exportar</button>`),
          row('Importar backup', 'Restaura as tarefas de um arquivo exportado. Substitui as tarefas atuais.', `<button type="button" data-action="import-data" class="${ui.btnSecondary}">${icon('upload')}Importar</button><input type="file" accept="application/json,.json" data-import-file class="sr-only" tabindex="-1" aria-hidden="true" />`),
          row('Dados de exemplo', 'Adiciona tarefas de demonstração à sua lista.', `<button type="button" data-action="load-samples" class="${ui.btnSecondary}">Adicionar exemplos</button>`),
          row('Apagar todas as tarefas', 'Remove todas as tarefas permanentemente.', `<button type="button" data-action="clear-data" class="${ui.btnDangerSoft}">${icon('trash-2')}Apagar tudo</button>`),
        ])}
      </div>`);
  },
};

/* ------------------------------------------------------------ montagem */

function group(title, description, rows) {
  return `
    <section class="${ui.card} p-5">
      <h3 class="font-semibold">${title}</h3>
      <p class="text-sm text-mute">${description}</p>
      <div class="mt-2 divide-y divide-line">${rows.join('')}</div>
    </section>`;
}

function row(title, description, control) {
  return `
    <div class="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div class="min-w-0 max-w-md">
        <p class="text-sm font-medium">${title}</p>
        ${description ? `<p class="text-sm text-mute">${description}</p>` : ''}
      </div>
      ${control}
    </div>`;
}

function select(setting, options, value) {
  return `<select data-setting="${setting}" aria-label="${setting}" class="${ui.select} sm:w-52">
    ${options.map(([optionValue, label]) => `<option value="${esc(optionValue)}" ${String(optionValue) === String(value) ? 'selected' : ''}>${esc(label)}</option>`).join('')}
  </select>`;
}

function accentPicker(current) {
  return `<div role="radiogroup" aria-label="Cor de destaque" class="flex flex-wrap gap-2.5">
    ${ACCENT_COLORS.map((color) => {
      const selected = color.id === current;
      return `<button type="button" role="radio" aria-checked="${selected}" aria-label="${color.label}" title="${color.label}"
        data-setting="accent" data-value="${color.id}" style="background:rgb(${color.base})"
        class="flex h-8 w-8 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface transition hover:scale-105 ${selected ? 'ring-2 ring-ink' : ''}">
        ${selected ? icon('check', 'h-4 w-4') : ''}</button>`;
    }).join('')}
  </div>`;
}

/* ------------------------------------------------------------ comportamento */

async function applySetting(setting, value) {
  if (setting === 'notifyBrowser' && value === true && !(await enableBrowserNotifications())) {
    return updateSettings({ notifyBrowser: false }); // permissão negada: mantém desligado e re-renderiza
  }
  updateSettings({ [setting]: value });
}

async function onClick(event) {
  const el = event.target.closest('[data-setting], [data-action]');
  if (!el) return;

  if (el.dataset.setting) {
    if ('toggle' in el.dataset) applySetting(el.dataset.setting, el.getAttribute('aria-checked') !== 'true');
    else if ('value' in el.dataset) applySetting(el.dataset.setting, el.dataset.value);
    return;
  }

  switch (el.dataset.action) {
    case 'show-shortcuts':
      openShortcutsHelp();
      break;

    case 'export-data': {
      const payload = { exportedAt: new Date().toISOString(), settings: getSettings(), tasks: getTasks() };
      downloadFile('taskflow-backup.json', JSON.stringify(payload, null, 2));
      toast.success('Arquivo exportado');
      break;
    }

    case 'import-data':
      root.querySelector('[data-import-file]').click();
      break;

    case 'load-samples':
      await addSampleTasks();
      toast.success('Tarefas de exemplo adicionadas');
      break;

    case 'clear-data': {
      const confirmed = await confirmDialog({
        title: 'Apagar todas as tarefas?',
        message: 'Todas as tarefas serão removidas permanentemente. Considere exportar um backup antes.',
        confirmLabel: 'Apagar tudo',
        danger: true,
      });
      if (confirmed) {
        await clearTasks();
        toast.success('Todas as tarefas foram apagadas');
      }
      break;
    }
  }
}

/** Lê o arquivo escolhido, pede confirmação e substitui as tarefas. */
async function importFromFile(input) {
  const file = input.files?.[0];
  input.value = ''; // permite escolher o mesmo arquivo de novo depois
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.tasks; // aceita lista pura ou o formato exportado
    const confirmed = await confirmDialog({
      title: 'Importar backup?',
      message: `As ${getTasks().length} tarefas atuais serão substituídas pelas do arquivo "${file.name}".`,
      confirmLabel: 'Importar',
    });
    if (!confirmed) return;
    const count = await importTasks(list);
    toast.success(`${count} tarefa${count === 1 ? '' : 's'} importada${count === 1 ? '' : 's'}`);
  } catch (error) {
    console.error(error);
    toast.error('Arquivo inválido. Escolha um backup exportado pelo TaskFlow.');
  }
}
return { settingsView };
})();

/* ===== views/statsView.js ===== */
__modules["views/statsView.js"] = (function () {
/*
  statsView.js — produtividade: indicadores e gráficos calculados com as tarefas reais.
*/
const { STATUSES, STATUS_ORDER } = __modules["config/constants.js"];
const { getTasks } = __modules["services/taskService.js"];
const { categoryBreakdown, computeSummary, lastDaysActivity, priorityDistribution, statusDistribution } = __modules["services/taskSelectors.js"];
const { esc, patchHtml } = __modules["utils/dom.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { donutChart, progressBar, weeklyBars } = __modules["components/charts.js"];
const { emptyState } = __modules["components/emptyState.js"];
const { openTaskForm } = __modules["components/taskForm.js"];

let root;

const statsView = {
  id: 'stats',
  title: 'Produtividade',

  mount(section) {
    root = section;
    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="new-task"]')) openTaskForm();
    });
  },

  render() {
    const tasks = getTasks();

    if (tasks.length === 0) {
      patchHtml(root, emptyState({
        iconName: 'bar-chart',
        title: 'Ainda não há dados',
        text: 'Crie e conclua tarefas para acompanhar sua produtividade aqui.',
        actionHtml: `<button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Criar tarefa</button>`,
      }));
      return;
    }

    const summary = computeSummary(tasks);
    const priorities = priorityDistribution(tasks);
    const categories = categoryBreakdown(tasks);

    patchHtml(root, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          ${kpi('Tarefas criadas', summary.total, 'clipboard-list')}
          ${kpi('Concluídas', summary.done, 'circle-check')}
          ${kpi('Taxa de conclusão', `${summary.completionRate}%`, 'trending-up')}
          ${kpi('Atrasadas', summary.overdue, 'alert-circle', summary.overdue > 0)}
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <section class="${ui.card} p-5 lg:col-span-2" aria-labelledby="week-heading">
            <h3 id="week-heading" class="font-semibold">Evolução nos últimos 7 dias</h3>
            <p class="mb-5 text-sm text-mute">Tarefas criadas e concluídas por dia.</p>
            ${weeklyBars(lastDaysActivity(tasks, 7))}
          </section>

          <section class="${ui.card} p-5" aria-labelledby="priority-heading">
            <h3 id="priority-heading" class="font-semibold">Por prioridade</h3>
            <p class="mb-5 text-sm text-mute">Distribuição de todas as tarefas.</p>
            <div class="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              ${donutChart(priorities)}
              <ul class="w-full space-y-2 text-sm">
                ${priorities.map((item) => `
                  <li class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full ${item.dot}"></span>
                    <span class="flex-1">${item.label}</span>
                    <span class="font-medium">${item.count}</span>
                  </li>`).join('')}
              </ul>
            </div>
          </section>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="${ui.card} p-5" aria-labelledby="status-heading">
            <h3 id="status-heading" class="mb-4 font-semibold">Por status</h3>
            ${statusSection(tasks)}
          </section>

          <section class="${ui.card} p-5" aria-labelledby="category-heading">
            <h3 id="category-heading" class="mb-4 font-semibold">Por categoria</h3>
            <ul class="space-y-4">
              ${categories.map((category) => `
                <li>
                  <div class="mb-1.5 flex items-center justify-between text-sm">
                    <span class="font-medium">${esc(category.name)}</span>
                    <span class="text-mute">${category.done} de ${category.total} concluídas</span>
                  </div>
                  ${progressBar((category.done / category.total) * 100, { label: `Conclusão em ${category.name}` })}
                </li>`).join('')}
            </ul>
          </section>
        </div>
      </div>`);
  },
};

function kpi(label, value, iconName, alert = false) {
  return `
    <div class="${ui.card} p-4 sm:p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-mute">${label}</span>
        <span class="${alert ? 'text-red-500' : 'text-mute'}">${icon(iconName, 'h-4 w-4')}</span>
      </div>
      <p class="mt-3 text-3xl font-semibold tracking-tight ${alert ? 'text-red-600 dark:text-red-400' : ''}">${value}</p>
    </div>`;
}

/** Barra empilhada com a proporção de cada status + legenda. */
function statusSection(tasks) {
  const counts = statusDistribution(tasks);
  const total = tasks.length;
  const segmentTone = { todo: 'bg-slate-400', doing: 'bg-blue-500', done: 'bg-emerald-500' };

  const segments = STATUS_ORDER.filter((id) => counts[id] > 0)
    .map((id) => `<div class="h-full ${segmentTone[id]}" style="width:${(counts[id] / total) * 100}%" title="${STATUSES[id].label}: ${counts[id]}"></div>`)
    .join('');

  const legend = STATUS_ORDER.map((id) => `
    <li class="flex items-center gap-2">
      <span class="h-2.5 w-2.5 rounded-full ${STATUSES[id].dot}"></span>
      <span class="flex-1">${STATUSES[id].label}</span>
      <span class="font-medium">${counts[id]}</span>
    </li>`).join('');

  return `
    <div class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-subtle" role="img"
      aria-label="${STATUS_ORDER.map((id) => `${STATUSES[id].label}: ${counts[id]}`).join(', ')}">${segments}</div>
    <ul class="mt-5 space-y-2 text-sm">${legend}</ul>`;
}
return { statsView };
})();

/* ===== views/tasksView.js ===== */
__modules["views/tasksView.js"] = (function () {
/*
  tasksView.js — "Minhas tarefas": filtros, ordenação e três formas de ver (lista, cards, kanban).
  Busca por nome = campo do header (state/uiState.js guarda o texto).
*/
const { DATE_FILTERS, LAYOUTS, PRIORITIES, PRIORITY_ORDER, SORT_OPTIONS, STATUSES, STATUS_FILTERS, STATUS_ORDER } = __modules["config/constants.js"];
const { bus, EVENTS } = __modules["core/eventBus.js"];
const { getCurrentViewId } = __modules["core/router.js"];
const { getSettings, updateSettings } = __modules["services/settingsService.js"];
const { getTask, getTasks, setStatus } = __modules["services/taskService.js"];
const { applyFilters, getCategoryList, sortTasks } = __modules["services/taskSelectors.js"];
const { hasActiveFilters, resetFilters, setFilters, setSortBy, uiState } = __modules["state/uiState.js"];
const { esc, patchHtml, plural } = __modules["utils/dom.js"];
const { bindDragAndDrop } = __modules["utils/dnd.js"];
const { icon } = __modules["utils/icons.js"];
const { ui } = __modules["ui/classes.js"];
const { emptyState } = __modules["components/emptyState.js"];
const { segmented } = __modules["components/segmented.js"];
const { handleTaskAction } = __modules["components/taskActions.js"];
const { openTaskForm } = __modules["components/taskForm.js"];
const { taskCard, taskRow } = __modules["components/taskItem.js"];
const { toast } = __modules["components/toast.js"];

let root;

const tasksView = {
  id: 'tasks',
  title: 'Minhas tarefas',

  mount(section) {
    root = section;

    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-action]');
      if (!el || handleTaskAction(el)) return;

      switch (el.dataset.action) {
        case 'new-task':
          openTaskForm({ defaults: el.dataset.status ? { status: el.dataset.status } : {} });
          break;
        case 'set-layout':
          updateSettings({ taskLayout: el.dataset.value }); // salvo nas configurações → re-renderiza
          break;
        case 'clear-filters':
          resetFilters();
          break;
      }
    });

    // Selects de filtro e de ordenação
    root.addEventListener('change', (event) => {
      const select = event.target;
      if (select.dataset.filter) setFilters({ [select.dataset.filter]: select.value });
      else if (select.dataset.sort) setSortBy(select.value);
    });

    // Kanban: soltar um card em uma coluna muda o status
    bindDragAndDrop(root, {
      zoneSelector: '[data-drop-status]',
      onDrop: async (id, zone) => {
        const status = zone.dataset.dropStatus;
        if (getTask(id)?.status === status) return;
        try {
          await setStatus(id, status);
          toast.success(`Tarefa movida para "${STATUSES[status].label}"`);
        } catch (error) {
          console.error(error);
          toast.error('Não foi possível mover a tarefa.');
        }
      },
    });

    bus.on(EVENTS.FILTERS_CHANGED, () => {
      if (getCurrentViewId() === 'tasks') this.render();
    });
  },

  render() {
    const settings = getSettings();
    const all = getTasks();
    const { filters, sortBy } = uiState;
    const isKanban = settings.taskLayout === 'kanban';
    const visible = sortTasks(
      applyFilters(all, filters, { showCompleted: settings.showCompleted || isKanban }),
      sortBy,
    );

    patchHtml(root, `
      <div class="space-y-4">
        ${toolbar(all, visible.length, settings)}
        ${results(all, visible, settings)}
      </div>`);
  },
};

/* ------------------------------------------------------------ barra de filtros */

function selectField(label, key, options, value, attr) {
  // Se a opção escolhida deixou de existir (ex.: categoria apagada), mantém visível para não confundir.
  const list = options.some(([optionValue]) => optionValue === value) ? options : [...options, [value, value]];
  return `
    <label class="block text-xs font-medium text-mute">${label}
      <select ${attr} data-focus-key="field-${key}" class="${ui.select} mt-1">
        ${list.map(([optionValue, text]) => `<option value="${esc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}
      </select>
    </label>`;
}

function toolbar(all, count, settings) {
  const { filters, sortBy } = uiState;
  const categories = getCategoryList(all).map((name) => [name, name]);

  return `
    <div class="${ui.card} p-3 sm:p-4">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        ${selectField('Prioridade', 'priority', [['all', 'Todas'], ...PRIORITY_ORDER.map((id) => [id, PRIORITIES[id].label])], filters.priority, 'data-filter="priority"')}
        ${selectField('Status', 'status', Object.entries(STATUS_FILTERS), filters.status, 'data-filter="status"')}
        ${selectField('Categoria', 'category', [['all', 'Todas'], ...categories], filters.category, 'data-filter="category"')}
        ${selectField('Prazo', 'date', Object.entries(DATE_FILTERS), filters.date, 'data-filter="date"')}
        ${selectField('Ordenar por', 'sort', Object.entries(SORT_OPTIONS), sortBy, 'data-sort="true"')}
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p class="text-sm text-mute" aria-live="polite">
          ${plural(count, 'tarefa', 'tarefas')}${filters.search.trim() ? ` para "${esc(filters.search.trim())}"` : ''}
        </p>
        <div class="flex items-center gap-2">
          ${hasActiveFilters() ? `<button type="button" data-action="clear-filters" class="${ui.btnGhost} !py-1.5">Limpar filtros</button>` : ''}
          ${segmented({
            label: 'Modo de visualização',
            dataAttrs: 'data-action="set-layout"',
            value: settings.taskLayout,
            options: Object.entries(LAYOUTS).map(([value, layout]) => ({ value, label: layout.label, icon: layout.icon })),
          })}
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------ resultados */

function results(all, visible, settings) {
  const options = { showDescription: settings.showDescriptions };

  if (all.length === 0) {
    return emptyState({
      title: 'Nenhuma tarefa ainda',
      text: 'Crie sua primeira tarefa e acompanhe tudo por aqui: lista, cards ou kanban.',
      actionHtml: `<button type="button" data-action="new-task" class="${ui.btnPrimary}">${icon('plus')}Criar tarefa</button>`,
    });
  }

  if (settings.taskLayout === 'kanban') return kanban(visible, options);

  if (visible.length === 0) {
    return emptyState({
      iconName: 'search',
      title: 'Nenhuma tarefa encontrada',
      text: 'Nada corresponde à busca ou aos filtros atuais.',
      actionHtml: `<button type="button" data-action="clear-filters" class="${ui.btnSecondary}">Limpar filtros</button>`,
    });
  }

  if (settings.taskLayout === 'cards') {
    return `<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${visible.map((task) => taskCard(task, options)).join('')}</div>`;
  }
  return `<div class="space-y-2">${visible.map((task) => taskRow(task, options)).join('')}</div>`;
}

function kanban(visible, options) {
  const columns = STATUS_ORDER.map((status) => {
    const items = visible.filter((task) => task.status === status);
    const { label, dot } = STATUSES[status];
    return `
      <section class="flex flex-col rounded-xl border border-line bg-subtle/60 p-3" data-drop-status="${status}" aria-label="Coluna ${label}">
        <header class="mb-3 flex items-center justify-between px-1">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <span class="h-2 w-2 rounded-full ${dot}"></span>${label}
            <span class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-mute">${items.length}</span>
          </h3>
          <button type="button" data-action="new-task" data-status="${status}" class="${ui.iconBtn}" aria-label="Adicionar tarefa em ${label}">${icon('plus')}</button>
        </header>
        <div class="flex min-h-[7rem] flex-1 flex-col gap-2.5">
          ${items.length
            ? items.map((task) => taskCard(task, { ...options, kanban: true })).join('')
            : '<p class="m-auto px-4 py-6 text-center text-sm text-mute">Arraste tarefas para cá</p>'}
        </div>
      </section>`;
  }).join('');

  return `<div class="grid gap-4 lg:grid-cols-3">${columns}</div>`;
}
return { tasksView };
})();

/* ===== main.js ===== */
__modules["main.js"] = (function () {
/*
  main.js — ponto de entrada. Liga as peças na ordem certa:
    tema → menu e header → telas → atalhos → carrega os dados → mostra a tela.
  Para criar uma tela nova, registre-a aqui (veja também config/navigation.js).
*/
const { initHeader } = __modules["components/header.js"];
const { initSidebar } = __modules["components/sidebar.js"];
const { toast } = __modules["components/toast.js"];
const { initRouter, registerView } = __modules["core/router.js"];
const { initShortcuts } = __modules["core/shortcuts.js"];
const { initTheme } = __modules["core/theme.js"];
const { initNotifications } = __modules["services/notificationService.js"];
const { loadTasks } = __modules["services/taskService.js"];
const { isStorageAvailable } = __modules["storage/taskStorage.js"];
const { hydrateIcons } = __modules["utils/icons.js"];
const { calendarView } = __modules["views/calendarView.js"];
const { dashboardView } = __modules["views/dashboardView.js"];
const { settingsView } = __modules["views/settingsView.js"];
const { statsView } = __modules["views/statsView.js"];
const { tasksView } = __modules["views/tasksView.js"];

async function bootstrap() {
  hydrateIcons(); // ícones do HTML estático (data-icon="...")
  initTheme();
  initSidebar();
  initHeader();

  [dashboardView, tasksView, calendarView, statsView, settingsView].forEach(registerView);
  initShortcuts();

  try {
    await loadTasks();
  } catch (error) {
    console.error(error);
    toast.error('Não foi possível carregar suas tarefas.');
  }

  hideLoader();
  initRouter();
  if (!isStorageAvailable()) {
    toast.error('Este navegador está bloqueando o armazenamento local: suas tarefas não serão salvas.');
  }
  initNotifications();
}

function hideLoader() {
  const loader = document.getElementById('app-loader');
  loader.classList.add('opacity-0', 'pointer-events-none');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  setTimeout(() => loader.remove(), 600); // garantia, caso a transição não dispare
}

bootstrap();
return {  };
})();
})();
