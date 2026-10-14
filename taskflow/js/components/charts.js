/*
  charts.js — gráficos minimalistas feitos só com SVG e divs (sem bibliotecas).
  Cada função recebe dados e devolve uma string de HTML.
*/
import { esc } from '../utils/dom.js';

/** Barra de progresso horizontal. percent: 0 a 100. */
export function progressBar(percent, { label = 'Progresso', barClass = 'bg-accent' } = {}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return `
    <div class="h-2 w-full overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
      <div class="h-full rounded-full ${barClass} transition-all duration-500" style="width:${value}%"></div>
    </div>`;
}

/** Anel de progresso (porcentagem no centro). */
export function progressRing(percent, { size = 112 } = {}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return `
    <div class="relative shrink-0" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke-width="8" class="stroke-line"/>
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke-width="8" stroke-linecap="round"
          class="stroke-accent transition-all duration-700"
          stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center text-2xl font-semibold">${Math.round(percent)}%</div>
    </div>`;
}

/** Rosca (donut) com um segmento por item: { label, count, hex }. */
export function donutChart(items, { size = 144 } = {}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = items
    .filter((item) => item.count > 0)
    .map((item) => {
      const length = (item.count / total) * circumference;
      const segment = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${item.hex}" stroke-width="14"
        stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}">
        <title>${esc(item.label)}: ${item.count}</title></circle>`;
      offset += length;
      return segment;
    })
    .join('');

  return `
    <div class="relative shrink-0" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90" role="img" aria-label="Tarefas por prioridade: ${items.map((i) => `${i.label} ${i.count}`).join(', ')}">
        <circle cx="60" cy="60" r="${radius}" fill="none" stroke-width="14" class="stroke-line"/>
        ${segments}
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-semibold">${total}</span>
        <span class="text-xs text-mute">tarefas</span>
      </div>
    </div>`;
}

/** Barras agrupadas por dia: criadas (cinza) x concluídas (cor de destaque). */
export function weeklyBars(days) {
  const max = Math.max(1, ...days.flatMap((day) => [day.created, day.completed]));
  const summary = days.map((d) => `${d.label}: ${d.created} criadas, ${d.completed} concluídas`).join('; ');

  const columns = days
    .map(
      (day) => `
      <div class="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
        <div class="flex w-full flex-1 items-end justify-center gap-1">
          <div class="w-full max-w-[18px] rounded-t-md bg-mute/30" style="height:${(day.created / max) * 100}%;min-height:3px" title="${day.created} criadas"></div>
          <div class="w-full max-w-[18px] rounded-t-md bg-accent" style="height:${(day.completed / max) * 100}%;min-height:3px" title="${day.completed} concluídas"></div>
        </div>
        <span class="text-xs ${day.isToday ? 'font-semibold text-ink' : 'text-mute'}">${day.label}</span>
      </div>`,
    )
    .join('');

  return `
    <div class="flex h-44 items-stretch gap-2 sm:gap-4" role="img" aria-label="Últimos 7 dias. ${esc(summary)}">${columns}</div>
    <div class="mt-4 flex items-center gap-4 text-xs text-mute">
      <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-mute/30"></span>Criadas</span>
      <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-accent"></span>Concluídas</span>
    </div>`;
}
