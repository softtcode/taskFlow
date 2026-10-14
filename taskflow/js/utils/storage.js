/*
  storage.js — pequeno invólucro do localStorage.
  Todas as chaves ganham o prefixo de STORAGE_PREFIX e os valores são guardados como JSON.
*/
import { STORAGE_PREFIX } from '../config/constants.js';

/** Lê uma chave. Se não existir (ou estiver corrompida), devolve `fallback`. */
export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Grava uma chave. Pode lançar erro (ex.: armazenamento cheio) — quem chama decide o que fazer. */
export function writeJSON(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

export function removeKey(key) {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
