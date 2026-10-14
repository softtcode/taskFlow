/*
  router.js — alterna entre as seções (telas) da aplicação.

  Como funciona:
    1. cada tela é uma <section id="view-<id>"> no index.html;
    2. o endereço (#/tasks) diz qual tela mostrar — por isso o botão "voltar" e o F5 funcionam;
    3. ao navegar, escondemos todas as <section> e mostramos só a escolhida (atributo "hidden");
    4. chamamos view.render() para desenhar o conteúdo atualizado.

  Uma "view" é um objeto: { id, title, mount(section), render() }
    mount()  roda UMA vez (cria os ouvintes de clique)
    render() roda sempre que a tela aparece ou os dados mudam
*/
import { $ } from '../utils/dom.js';
import { APP_NAME } from '../config/constants.js';
import { bus, EVENTS } from './eventBus.js';

const views = new Map(); // id → { view, section }
let currentId = null;

export function registerView(view) {
  const section = document.getElementById(`view-${view.id}`);
  if (!section) throw new Error(`Falta <section id="view-${view.id}"> no index.html`);
  views.set(view.id, { view, section });
  view.mount(section);
}

export const getCurrentViewId = () => currentId;

/** Vai para uma tela: navigate('tasks') */
export function navigate(id) {
  if (location.hash === `#/${id}`) show(id);
  else location.hash = `#/${id}`;
}

function resolveRoute() {
  const id = location.hash.replace(/^#\/?/, '');
  return views.has(id) ? id : 'dashboard';
}

function show(id) {
  const { view, section } = views.get(id);

  views.forEach((entry, key) => {
    entry.section.hidden = key !== id;
  });

  // Reinicia a animação de entrada
  section.classList.remove('view-enter');
  void section.offsetWidth;
  section.classList.add('view-enter');

  currentId = id;
  view.render();
  document.title = `${view.title} — ${APP_NAME}`;
  $('#main').scrollTo({ top: 0 });
  bus.emit(EVENTS.ROUTE_CHANGED, { id, title: view.title });
}

/** Redesenha a tela atual (chamado quando tarefas ou configurações mudam). */
function rerenderCurrent() {
  if (currentId) views.get(currentId).view.render();
}

export function initRouter() {
  window.addEventListener('hashchange', () => show(resolveRoute()));
  bus.on(EVENTS.TASKS_CHANGED, rerenderCurrent);
  bus.on(EVENTS.SETTINGS_CHANGED, rerenderCurrent);
  show(resolveRoute());
}
