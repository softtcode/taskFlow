/** Gera um identificador único. (Com uma API real, o servidor costuma gerar o id.) */
export function generateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
