/*
  segmented.js — controles reutilizáveis de formulário: botões segmentados e interruptor (switch).
*/
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';

/**
 * Grupo de botões onde só um fica ativo (ex.: Lista | Cards | Kanban).
 * dataAttrs: atributos que identificam a AÇÃO, ex.: 'data-action="set-layout"'.
 * O valor clicado chega no handler como element.dataset.value.
 */
export function segmented({ label, options, value, dataAttrs }) {
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
export function toggleSwitch({ setting, checked, label }) {
  return `
    <button type="button" role="switch" aria-checked="${checked}" aria-label="${esc(label)}"
      data-setting="${esc(setting)}" data-toggle
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-accent' : 'bg-mute/30'}">
      <span class="inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}"></span>
    </button>`;
}
