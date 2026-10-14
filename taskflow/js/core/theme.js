/*
  theme.js — aplica o tema (claro/escuro/sistema) e a cor de destaque.

  Como funciona: o tema escuro é a classe "dark" no <html>; a cor de destaque são duas
  variáveis CSS (--accent-base e --accent-light). O resto é feito em css/styles.css.
*/
import { ACCENT_COLORS } from '../config/constants.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { bus, EVENTS } from './eventBus.js';

const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

/** O tema escuro está ativo agora? (considera a opção "seguir o sistema") */
export function isDark() {
  const { theme } = getSettings();
  return theme === 'dark' || (theme === 'system' && systemQuery.matches);
}

export function applyTheme() {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark());

  const accent = ACCENT_COLORS.find((color) => color.id === getSettings().accent) ?? ACCENT_COLORS[0];
  root.style.setProperty('--accent-base', accent.base);
  root.style.setProperty('--accent-light', accent.light);
}

/** Botão do header: alterna entre claro e escuro (e sai do modo "sistema"). */
export function toggleTheme() {
  updateSettings({ theme: isDark() ? 'light' : 'dark' });
}

export function initTheme() {
  applyTheme();
  bus.on(EVENTS.SETTINGS_CHANGED, applyTheme);
  systemQuery.addEventListener('change', applyTheme); // sistema mudou de claro↔escuro
}
