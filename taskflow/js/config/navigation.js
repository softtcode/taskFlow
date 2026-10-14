/*
  navigation.js — fonte única das seções do app.
  Usada pela sidebar, pela barra inferior (mobile) e pelos atalhos de teclado (1 a 5).

  Para criar uma nova tela:
    1. adicione um item aqui;
    2. adicione <section id="view-<id>"> no index.html;
    3. crie js/views/<id>View.js e registre em js/main.js.
*/
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', short: 'Início', icon: 'layout-dashboard', shortcut: '1' },
  { id: 'tasks', label: 'Minhas tarefas', short: 'Tarefas', icon: 'list-checks', shortcut: '2' },
  { id: 'calendar', label: 'Calendário', short: 'Agenda', icon: 'calendar', shortcut: '3' },
  { id: 'stats', label: 'Produtividade', short: 'Produtiv.', icon: 'bar-chart', shortcut: '4' },
  { id: 'settings', label: 'Configurações', short: 'Ajustes', icon: 'settings', shortcut: '5' },
];
