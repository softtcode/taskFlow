/*
  dnd.js — arrastar e soltar (HTML5 Drag and Drop) reutilizável.
  Usado no Kanban (soltar em uma coluna) e no calendário (soltar em um dia).

    bindDragAndDrop(container, {
      zoneSelector: '[data-drop-status]',      // onde se pode soltar
      onDrop: (taskId, zoneElement) => {...},   // o que fazer ao soltar
    });

  O elemento arrastável precisa de draggable="true" e data-drag-id="<id da tarefa>".
  Obs.: arrastar não funciona em telas touch — por isso o Kanban também tem botões "mover".
*/
export function bindDragAndDrop(root, { itemSelector = '[data-drag-id]', zoneSelector, onDrop }) {
  const clearHighlights = () => {
    root.querySelectorAll('.is-dragging, .drop-active').forEach((el) => el.classList.remove('is-dragging', 'drop-active'));
  };

  root.addEventListener('dragstart', (event) => {
    const item = event.target.closest?.(itemSelector);
    if (!item) return;
    event.dataTransfer.setData('text/plain', item.dataset.dragId);
    event.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => item.classList.add('is-dragging')); // depois, para a "sombra" do arraste sair normal
  });

  root.addEventListener('dragend', clearHighlights);

  root.addEventListener('dragover', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (!zone) return;
    event.preventDefault(); // necessário para permitir soltar
    event.dataTransfer.dropEffect = 'move';
    zone.classList.add('drop-active');
  });

  root.addEventListener('dragleave', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('drop-active');
  });

  root.addEventListener('drop', (event) => {
    const zone = event.target.closest?.(zoneSelector);
    if (!zone) return;
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    clearHighlights();
    if (id) onDrop(id, zone);
  });
}
