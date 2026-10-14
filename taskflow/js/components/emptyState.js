/*
  emptyState.js — estado vazio: em vez de uma tela em branco, explica e convida a agir.
*/
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

export function emptyState({ iconName = 'clipboard-list', title, text, actionHtml = '' }) {
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
