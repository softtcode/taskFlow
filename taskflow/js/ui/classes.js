/*
  classes.js — "design tokens" em forma de classes Tailwind reutilizáveis.

  Em vez de repetir 15 classes em todo botão, usamos `${ui.btnPrimary}` nos templates.
  Quer deixar todos os botões mais arredondados ou os cards mais "chapados"? Mude AQUI, uma vez só.
*/

const btnBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50';

export const ui = {
  /* superfícies */
  card: 'rounded-xl border border-line bg-surface shadow-card',

  /* botões */
  btnPrimary: `${btnBase} bg-accent text-white shadow-sm hover:brightness-110`,
  btnSecondary: `${btnBase} border border-line bg-surface text-ink hover:bg-subtle`,
  btnGhost: `${btnBase} text-mute hover:bg-subtle hover:text-ink`,
  btnDanger: `${btnBase} bg-red-600 text-white hover:bg-red-700`,
  btnDangerSoft: `${btnBase} text-red-600 hover:bg-red-500/10 dark:text-red-400`,
  iconBtn:
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mute transition hover:bg-subtle hover:text-ink',

  /* formulários */
  input:
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mute/70 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 aria-[invalid=true]:border-red-500',
  select:
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
  label: 'mb-1.5 block text-sm font-medium',
  fieldError: 'mt-1.5 text-xs text-red-600 dark:text-red-400',

  /* etiquetas (prioridade, categoria, status) */
  badge: 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
};
