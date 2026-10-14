/*
  shortcuts.js — atalhos de teclado globais.
  A lista SHORTCUTS é a fonte única: ela alimenta tanto o comportamento quanto a janela de ajuda (?).
  Os atalhos ficam desativados enquanto o usuário digita em um campo ou há uma janela aberta.
*/
import { NAV_ITEMS } from '../config/navigation.js';
import { openDialog } from '../components/modal.js';
import { openTaskForm } from '../components/taskForm.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { $, esc } from '../utils/dom.js';
import { navigate } from './router.js';
import { toggleTheme } from './theme.js';

export const SHORTCUTS = [
  { key: 'n', label: 'N', description: 'Criar nova tarefa', run: () => openTaskForm() },
  { key: '/', label: '/', description: 'Buscar tarefas', run: () => $('#global-search').focus() },
  { key: 't', label: 'T', description: 'Alternar tema claro/escuro', run: toggleTheme },
  { key: 'b', label: 'B', description: 'Recolher ou expandir o menu lateral', run: () => updateSettings({ sidebarCollapsed: !getSettings().sidebarCollapsed }) },
  ...NAV_ITEMS.map((item) => ({ key: item.shortcut, label: item.shortcut, description: `Ir para ${item.label}`, run: () => navigate(item.id) })),
  { key: '?', label: '?', description: 'Mostrar esta lista de atalhos', run: () => openShortcutsHelp() },
];

const isTyping = (element) =>
  element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));

export function initShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target) || document.querySelector('dialog[open]')) return;

    const shortcut = SHORTCUTS.find((item) => item.key === event.key.toLowerCase());
    if (!shortcut) return;
    event.preventDefault();
    shortcut.run();
  });
}

export function openShortcutsHelp() {
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
