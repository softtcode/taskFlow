/*
  sidebar.js — menu lateral (desktop/tablet) e barra inferior (mobile).
  Os itens vêm de config/navigation.js. A seção ativa recebe aria-current="page"
  (o visual de "ativo" está em css/styles.css).
*/
import { NAV_ITEMS } from '../config/navigation.js';
import { bus, EVENTS } from '../core/eventBus.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { getTasks } from '../services/taskService.js';
import { $, $$ } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

export function initSidebar() {
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
