/*
  settingsView.js — preferências do usuário. Cada controle grava em settingsService
  (que salva no localStorage), por isso tudo permanece após atualizar a página.

  Convenção dos controles:
    data-setting="nome"  + data-value="x"   → botões de escolha (tema, cor)
    data-setting="nome"  + data-toggle      → interruptores liga/desliga
    <select|input data-setting="nome">      → dispara no evento "change"
*/
import { ACCENT_COLORS, LAYOUTS } from '../config/constants.js';
import { openShortcutsHelp } from '../core/shortcuts.js';
import { enableBrowserNotifications } from '../services/notificationService.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { addSampleTasks, clearTasks, getTasks, importTasks } from '../services/taskService.js';
import { downloadFile, esc, patchHtml } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { ui } from '../ui/classes.js';
import { confirmDialog } from '../components/modal.js';
import { segmented, toggleSwitch } from '../components/segmented.js';
import { toast } from '../components/toast.js';

let root;
const NUMERIC_SETTINGS = new Set(['weekStart', 'notifyLeadMinutes']);

export const settingsView = {
  id: 'settings',
  title: 'Configurações',

  mount(section) {
    root = section;
    root.addEventListener('click', onClick);
    root.addEventListener('change', (event) => {
      if (event.target.matches('[data-import-file]')) return importFromFile(event.target);
      const el = event.target.closest('[data-setting]');
      if (!el || 'toggle' in el.dataset) return;
      const { setting } = el.dataset;
      applySetting(setting, NUMERIC_SETTINGS.has(setting) ? Number(el.value) : el.value);
    });
  },

  render() {
    const s = getSettings();
    patchHtml(root, `
      <div class="mx-auto max-w-3xl space-y-4">
        ${group('Aparência', 'Tema e cores da interface.', [
          row('Tema', 'Escolha claro, escuro ou siga o sistema operacional.', segmented({
            label: 'Tema',
            dataAttrs: 'data-setting="theme"',
            value: s.theme,
            options: [
              { value: 'light', label: 'Claro', icon: 'sun' },
              { value: 'dark', label: 'Escuro', icon: 'moon' },
              { value: 'system', label: 'Sistema', icon: 'monitor' },
            ],
          })),
          row('Cor de destaque', 'Usada em botões, links e itens ativos.', accentPicker(s.accent)),
          row('Seu nome', 'Aparece na mensagem de boas-vindas.', `<input type="text" data-setting="userName" value="${esc(s.userName)}" maxlength="30" placeholder="Opcional" aria-label="Seu nome" class="${ui.input} sm:w-48" />`),
        ])}

        ${group('Exibição das tarefas', 'Como a lista e o calendário se comportam.', [
          row('Visualização padrão', 'Modo usado em Minhas tarefas.', select('taskLayout', Object.entries(LAYOUTS).map(([id, l]) => [id, l.label]), s.taskLayout)),
          row('Mostrar tarefas concluídas', 'Em lista e cards. No Kanban elas ficam sempre na coluna "Concluído".', toggleSwitch({ setting: 'showCompleted', checked: s.showCompleted, label: 'Mostrar tarefas concluídas' })),
          row('Mostrar descrições', 'Exibe o resumo abaixo do título.', toggleSwitch({ setting: 'showDescriptions', checked: s.showDescriptions, label: 'Mostrar descrições' })),
          row('Primeiro dia da semana', 'Usado no calendário.', select('weekStart', [[0, 'Domingo'], [1, 'Segunda-feira']], s.weekStart)),
        ])}

        ${group('Data e horário', 'Formato usado nos prazos das tarefas.', [
          row('Formato de data', '', select('dateFormat', [['DD/MM/YYYY', 'DD/MM/AAAA'], ['MM/DD/YYYY', 'MM/DD/AAAA'], ['YYYY-MM-DD', 'AAAA-MM-DD']], s.dateFormat)),
          row('Formato de hora', '', select('timeFormat', [['24h', '24 horas (14:30)'], ['12h', '12 horas (2:30 PM)']], s.timeFormat)),
        ])}

        ${group('Notificações', 'Lembretes de tarefas perto do vencimento.', [
          row('Lembretes no aplicativo', 'Mostra um aviso quando uma tarefa está para vencer.', toggleSwitch({ setting: 'notifyEnabled', checked: s.notifyEnabled, label: 'Lembretes no aplicativo' })),
          row('Notificações do sistema', 'Também avisa pelo navegador (pede permissão).', toggleSwitch({ setting: 'notifyBrowser', checked: s.notifyBrowser, label: 'Notificações do sistema' })),
          row('Antecedência', 'Quanto tempo antes do horário avisar.', select('notifyLeadMinutes', [[0, 'No horário'], [15, '15 minutos'], [30, '30 minutos'], [60, '1 hora'], [1440, '1 dia']], s.notifyLeadMinutes)),
        ])}

        ${group('Dados e atalhos', 'Tudo fica salvo apenas neste navegador, sem servidor nem banco de dados.', [
          row('Atalhos de teclado', 'Veja todos os atalhos disponíveis.', `<button type="button" data-action="show-shortcuts" class="${ui.btnSecondary}">${icon('keyboard')}Ver atalhos</button>`),
          row('Exportar backup', 'Baixa um arquivo JSON com suas tarefas. Guarde-o: os dados ficam só neste navegador.', `<button type="button" data-action="export-data" class="${ui.btnSecondary}">${icon('download')}Exportar</button>`),
          row('Importar backup', 'Restaura as tarefas de um arquivo exportado. Substitui as tarefas atuais.', `<button type="button" data-action="import-data" class="${ui.btnSecondary}">${icon('upload')}Importar</button><input type="file" accept="application/json,.json" data-import-file class="sr-only" tabindex="-1" aria-hidden="true" />`),
          row('Dados de exemplo', 'Adiciona tarefas de demonstração à sua lista.', `<button type="button" data-action="load-samples" class="${ui.btnSecondary}">Adicionar exemplos</button>`),
          row('Apagar todas as tarefas', 'Remove todas as tarefas permanentemente.', `<button type="button" data-action="clear-data" class="${ui.btnDangerSoft}">${icon('trash-2')}Apagar tudo</button>`),
        ])}
      </div>`);
  },
};

/* ------------------------------------------------------------ montagem */

function group(title, description, rows) {
  return `
    <section class="${ui.card} p-5">
      <h3 class="font-semibold">${title}</h3>
      <p class="text-sm text-mute">${description}</p>
      <div class="mt-2 divide-y divide-line">${rows.join('')}</div>
    </section>`;
}

function row(title, description, control) {
  return `
    <div class="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div class="min-w-0 max-w-md">
        <p class="text-sm font-medium">${title}</p>
        ${description ? `<p class="text-sm text-mute">${description}</p>` : ''}
      </div>
      ${control}
    </div>`;
}

function select(setting, options, value) {
  return `<select data-setting="${setting}" aria-label="${setting}" class="${ui.select} sm:w-52">
    ${options.map(([optionValue, label]) => `<option value="${esc(optionValue)}" ${String(optionValue) === String(value) ? 'selected' : ''}>${esc(label)}</option>`).join('')}
  </select>`;
}

function accentPicker(current) {
  return `<div role="radiogroup" aria-label="Cor de destaque" class="flex flex-wrap gap-2.5">
    ${ACCENT_COLORS.map((color) => {
      const selected = color.id === current;
      return `<button type="button" role="radio" aria-checked="${selected}" aria-label="${color.label}" title="${color.label}"
        data-setting="accent" data-value="${color.id}" style="background:rgb(${color.base})"
        class="flex h-8 w-8 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface transition hover:scale-105 ${selected ? 'ring-2 ring-ink' : ''}">
        ${selected ? icon('check', 'h-4 w-4') : ''}</button>`;
    }).join('')}
  </div>`;
}

/* ------------------------------------------------------------ comportamento */

async function applySetting(setting, value) {
  if (setting === 'notifyBrowser' && value === true && !(await enableBrowserNotifications())) {
    return updateSettings({ notifyBrowser: false }); // permissão negada: mantém desligado e re-renderiza
  }
  updateSettings({ [setting]: value });
}

async function onClick(event) {
  const el = event.target.closest('[data-setting], [data-action]');
  if (!el) return;

  if (el.dataset.setting) {
    if ('toggle' in el.dataset) applySetting(el.dataset.setting, el.getAttribute('aria-checked') !== 'true');
    else if ('value' in el.dataset) applySetting(el.dataset.setting, el.dataset.value);
    return;
  }

  switch (el.dataset.action) {
    case 'show-shortcuts':
      openShortcutsHelp();
      break;

    case 'export-data': {
      const payload = { exportedAt: new Date().toISOString(), settings: getSettings(), tasks: getTasks() };
      downloadFile('taskflow-backup.json', JSON.stringify(payload, null, 2));
      toast.success('Arquivo exportado');
      break;
    }

    case 'import-data':
      root.querySelector('[data-import-file]').click();
      break;

    case 'load-samples':
      await addSampleTasks();
      toast.success('Tarefas de exemplo adicionadas');
      break;

    case 'clear-data': {
      const confirmed = await confirmDialog({
        title: 'Apagar todas as tarefas?',
        message: 'Todas as tarefas serão removidas permanentemente. Considere exportar um backup antes.',
        confirmLabel: 'Apagar tudo',
        danger: true,
      });
      if (confirmed) {
        await clearTasks();
        toast.success('Todas as tarefas foram apagadas');
      }
      break;
    }
  }
}

/** Lê o arquivo escolhido, pede confirmação e substitui as tarefas. */
async function importFromFile(input) {
  const file = input.files?.[0];
  input.value = ''; // permite escolher o mesmo arquivo de novo depois
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.tasks; // aceita lista pura ou o formato exportado
    const confirmed = await confirmDialog({
      title: 'Importar backup?',
      message: `As ${getTasks().length} tarefas atuais serão substituídas pelas do arquivo "${file.name}".`,
      confirmLabel: 'Importar',
    });
    if (!confirmed) return;
    const count = await importTasks(list);
    toast.success(`${count} tarefa${count === 1 ? '' : 's'} importada${count === 1 ? '' : 's'}`);
  } catch (error) {
    console.error(error);
    toast.error('Arquivo inválido. Escolha um backup exportado pelo TaskFlow.');
  }
}
