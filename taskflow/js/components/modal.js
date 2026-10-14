/*
  modal.js — janelas modais usando o elemento nativo <dialog>.
  O navegador cuida de: prender o foco dentro da janela, fechar com Esc,
  escurecer o fundo e devolver o foco ao botão que abriu. Acessibilidade "de graça".
*/
import { esc } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
let counter = 0;

/**
 * Abre uma janela. `render(body, close)` recebe o elemento onde você coloca o conteúdo
 * e a função que fecha a janela. Qualquer elemento com data-dialog-close também fecha.
 */
export function openDialog({ title, description = '', size = 'md', render }) {
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
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
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
