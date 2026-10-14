/*
  main.js — ponto de entrada. Liga as peças na ordem certa:
    tema → menu e header → telas → atalhos → carrega os dados → mostra a tela.
  Para criar uma tela nova, registre-a aqui (veja também config/navigation.js).
*/
import { initHeader } from './components/header.js';
import { initSidebar } from './components/sidebar.js';
import { toast } from './components/toast.js';
import { initRouter, registerView } from './core/router.js';
import { initShortcuts } from './core/shortcuts.js';
import { initTheme } from './core/theme.js';
import { initNotifications } from './services/notificationService.js';
import { loadTasks } from './services/taskService.js';
import { isStorageAvailable } from './storage/taskStorage.js';
import { hydrateIcons } from './utils/icons.js';
import { calendarView } from './views/calendarView.js';
import { dashboardView } from './views/dashboardView.js';
import { settingsView } from './views/settingsView.js';
import { statsView } from './views/statsView.js';
import { tasksView } from './views/tasksView.js';

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
