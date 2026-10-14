/*
  constants.js — tudo que é "configuração" da aplicação fica aqui.
  Quer mudar um nome, uma cor de prioridade ou uma opção? Comece por este arquivo.

  IMPORTANTE (Tailwind): as classes abaixo são escritas por extenso de propósito.
  O Tailwind só gera o CSS das classes que ele consegue "ler" no código. Se você montasse
  `bg-${cor}-500` dinamicamente, a classe não seria gerada em um build de produção.
*/

export const APP_NAME = 'TaskFlow';

/** Prefixo das chaves no localStorage. Se mudar o formato dos dados, aumente a versão (v2). */
export const STORAGE_PREFIX = 'taskflow:v1:';

/* ---------------- Prioridades ---------------- */
export const PRIORITIES = {
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
export const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];

/* ---------------- Status (colunas do Kanban) ---------------- */
export const STATUSES = {
  todo: { id: 'todo', label: 'A fazer', dot: 'bg-slate-400' },
  doing: { id: 'doing', label: 'Em andamento', dot: 'bg-blue-500' },
  done: { id: 'done', label: 'Concluído', dot: 'bg-emerald-500' },
};
export const STATUS_ORDER = ['todo', 'doing', 'done'];

export const DEFAULT_CATEGORIES = ['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Finanças'];

/* ---------------- Filtros e ordenação (tela "Minhas tarefas") ---------------- */
export const DEFAULT_FILTERS = { search: '', priority: 'all', status: 'all', category: 'all', date: 'all' };

export const STATUS_FILTERS = {
  all: 'Todos',
  pending: 'Pendentes',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluídas',
};

export const DATE_FILTERS = {
  all: 'Qualquer data',
  today: 'Hoje',
  week: 'Próximos 7 dias',
  overdue: 'Atrasadas',
  none: 'Sem prazo',
};

export const SORT_OPTIONS = {
  urgency: 'Urgência',
  due: 'Vencimento',
  created: 'Criação (mais recentes)',
};

export const LAYOUTS = {
  list: { label: 'Lista', icon: 'list' },
  cards: { label: 'Cards', icon: 'layout-grid' },
  kanban: { label: 'Kanban', icon: 'kanban' },
};

/* ---------------- Cores de destaque ----------------
   base  = cor usada em botões e fundos
   light = versão mais clara usada para texto no modo escuro (melhor contraste) */
export const ACCENT_COLORS = [
  { id: 'indigo', label: 'Índigo', base: '79 70 229', light: '129 140 248' },
  { id: 'violet', label: 'Violeta', base: '124 58 237', light: '167 139 250' },
  { id: 'blue', label: 'Azul', base: '37 99 235', light: '96 165 250' },
  { id: 'emerald', label: 'Esmeralda', base: '5 150 105', light: '52 211 153' },
  { id: 'rose', label: 'Rosa', base: '225 29 72', light: '251 113 133' },
  { id: 'orange', label: 'Laranja', base: '234 88 12', light: '251 146 60' },
];

/* ---------------- Preferências padrão do usuário ---------------- */
export const DEFAULT_SETTINGS = {
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
