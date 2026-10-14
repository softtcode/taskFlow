/*
  dom.js — utilitários de DOM usados por todas as telas.
*/

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapa texto digitado pelo usuário antes de colocá-lo em um template HTML.
 * REGRA DE OURO: todo dado do usuário (título, descrição, categoria...) passa por esc().
 * Sem isso, alguém poderia salvar uma tarefa chamada "<img onerror=...>" e executar código.
 */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Atrasa a execução até o usuário parar de digitar (usado na busca). */
export function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Troca o HTML de um container PRESERVANDO o foco do teclado.
 * Como as telas re-renderizam inteiras, sem isso quem navega por teclado perderia o foco
 * a cada clique. Para o foco sobreviver, marque o elemento com data-focus-key="nome-unico".
 */
export function patchHtml(root, html) {
  const active = document.activeElement;
  const focusKey = root.contains(active) ? active.dataset?.focusKey : undefined;
  root.innerHTML = html;
  if (focusKey) {
    root.querySelector(`[data-focus-key="${focusKey}"]`)?.focus({ preventScroll: true });
  }
}

export const plural = (n, singular, pluralForm) => `${n} ${n === 1 ? singular : pluralForm}`;

/** Remove acentos e põe em minúsculas — para a busca ignorar "Reunião" vs "reuniao". */
export function normalizeText(text) {
  return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Dispara o download de um arquivo gerado no navegador. */
export function downloadFile(filename, content, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
