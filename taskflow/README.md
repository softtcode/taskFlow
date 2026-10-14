# TaskFlow — gerenciador de tarefas

HTML5 + Tailwind CSS + JavaScript puro (módulos ES). Sem React, sem servidor, sem banco de dados.

## Como abrir

**Dê dois cliques em `index.html`.** Pronto. Não precisa de servidor.

- Os dados ficam no `localStorage` do **seu navegador**, neste computador. Nada é enviado para lugar nenhum.
- O Tailwind e a fonte Inter vêm de CDNs, então a primeira carga precisa de internet.
  (Para funcionar 100% offline, veja "Tailwind em produção" abaixo.)
- Se você limpar os "dados do site" do navegador, as tarefas somem. Use **Configurações → Exportar backup**
  de vez em quando e **Importar backup** para restaurar (ou levar as tarefas para outro computador).

## Editando o código

Você edita os módulos em `js/`. O `index.html` carrega `dist/app.js`, um arquivo único gerado a partir
deles (navegadores não carregam módulos ES direto do disco, e é isso que evita o servidor).
Depois de editar, rode (precisa do [Node.js](https://nodejs.org)):

```bash
node build.mjs            # gera dist/app.js
node build.mjs --watch    # gera de novo a cada vez que você salvar
```

Depois é só recarregar a página (F5). O build avisa se algum import estiver errado ou circular.
Nunca edite `dist/app.js` à mão: ele é sobrescrito.

## Mapa do código

```
index.html                 shell fixo: sidebar, header e uma <section> por tela
build.mjs                  junta js/ em dist/app.js (sem dependências)
dist/app.js                GERADO — é o que o navegador executa
css/styles.css             variáveis de tema, animações, <dialog>, drag-and-drop
js/
├── main.js                ponto de entrada: liga tudo na ordem certa
├── tailwind.config.js     cores semânticas (app, surface, ink, mute, accent...)
├── config/
│   ├── constants.js       prioridades, status, cores de destaque, configurações padrão
│   └── navigation.js      seções do app (sidebar, menu mobile e atalhos 1–5)
├── core/
│   ├── router.js          alterna as seções (hash #/tasks) e chama view.render()
│   ├── eventBus.js        avisos entre módulos (emit / on)
│   ├── theme.js           claro / escuro / sistema + cor de destaque
│   └── shortcuts.js       atalhos de teclado
├── storage/taskStorage.js ÚNICO lugar que lê/grava as tarefas (localStorage)
├── services/
│   ├── taskService.js     regras de negócio, estado das tarefas e importação de backup
│   ├── taskSelectors.js   filtros, ordenação, atrasadas, estatísticas (funções puras)
│   ├── settingsService.js preferências do usuário (salvas no localStorage)
│   └── notificationService.js  lembretes de vencimento
├── state/uiState.js       filtros e ordenação atuais (não persistem)
├── components/            modal, toast, formulário, cards de tarefa, gráficos, sidebar, header
├── views/                 uma tela por arquivo: dashboard, tasks, calendar, stats, settings
├── ui/classes.js          classes Tailwind reutilizáveis (botões, cards, inputs)
├── utils/                 dom, datas, formatação, ícones (Lucide), validação, drag-and-drop
└── data/sampleTasks.js    tarefas de exemplo do primeiro acesso
```

## Como as peças conversam

1. O usuário clica → a **view** chama uma função de `taskService`.
2. `taskService` grava via `taskStorage` e emite `tasks:changed`.
3. O **router** ouve o evento e chama `render()` da tela visível.
4. `render()` monta uma string HTML e a coloca na `<section>` com `patchHtml()`.

Os cliques usam **delegação**: o container escuta um único evento e lê `data-action` / `data-id`
do botão clicado. Por isso o HTML pode ser recriado sem perder os ouvintes.

## Receitas para modificar

| Quero... | Edite |
|---|---|
| Mudar cores de prioridade ou nomes de status | `js/config/constants.js` |
| Mudar o visual de botões, cards e campos | `js/ui/classes.js` |
| Mudar as cores base do tema claro/escuro | variáveis em `css/styles.css` |
| Adicionar uma cor de destaque | `ACCENT_COLORS` em `constants.js` |
| Adicionar um campo à tarefa (ex.: "responsável") | `taskForm.js` (campo), `validators.js`, `taskService.normalize()` e `sanitizeImportedTasks()`, `taskItem.js` (exibição) |
| Criar uma nova tela | item em `config/navigation.js`, `<section id="view-x">` no HTML, `js/views/xView.js`, registrar em `main.js` |
| Mudar um atalho | lista `SHORTCUTS` em `core/shortcuts.js` |
| Novo ícone | colar o SVG de lucide.dev em `utils/icons.js` |

Depois de qualquer mudança em `js/`: `node build.mjs`.

Regras que valem a pena manter:
- Todo texto vindo do usuário passa por `esc()` antes de entrar em um template.
- Escreva classes Tailwind por extenso (`bg-red-500`), nunca montadas (`bg-${cor}-500`).
- Datas de vencimento são texto `AAAA-MM-DD` + `HH:mm`; não há conversão de fuso.
- Módulos não podem se importar em círculo (o build recusa). Se precisar, extraia a parte comum para um terceiro arquivo.
- O build só entende `import { a, b } from './x.js'` e `export function/const/let/class`.

## Tailwind em produção / 100% offline

O CDN é ótimo para estudar, mas depende de internet. Para funcionar offline: instale o Tailwind CLI,
use `content: ['./index.html', './js/**/*.js']`, mova a config de `js/tailwind.config.js` para
`tailwind.config.js`, gere um CSS estático e troque a tag `<script src="https://cdn.tailwindcss.com...">`
por esse CSS. Faça o mesmo baixando a fonte Inter para uma pasta local.

## Atalhos

`N` nova tarefa · `/` buscar · `T` tema · `B` recolher menu · `1`–`5` seções · `?` ajuda · `Esc` fecha janelas.
