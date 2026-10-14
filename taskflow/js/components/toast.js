/*
  toast.js — mensagens rápidas de sucesso, erro e informação.
  Uso:  toast.success('Tarefa criada')   toast.error('Algo deu errado')   toast.info('...')
*/
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';

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

export const toast = {
  success: (message) => show('success', message),
  error: (message) => show('error', message, 5000),
  info: (message) => show('info', message, 5000),
};
